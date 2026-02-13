// CSVファイル一覧と、表示用のカテゴリ名の定義
const fileMap = [
    { file: 'cards.csv', name: 'カードの種類と領域' },
    { file: 'turns.csv', name: 'ターンの流れ' },
    { file: 'terms.csv', name: '用語集' },
    { file: 'abilities.csv', name: '能力語' },
    { file: 'keywords.csv', name: 'キーワード能力' },
    { file: 'processes.csv', name: 'キーワード処理' },
    { file: 'counters.csv', name: 'カウンター' },
    { file: 'otherrules.csv', name: 'その他のルール' }
];

let currentData = []; // 現在表示中のページのデータ

document.addEventListener('DOMContentLoaded', () => {
    // --- メニュー開閉処理 ---
    const menuToggle = document.getElementById('menu-toggle');
    const menuClose = document.getElementById('menu-close');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    if(menuToggle){
        menuToggle.addEventListener('click', () => {
            sidebar.classList.add('active');
            overlay.classList.add('active');
        });
    }

    function closeSidebar() {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    }

    if(menuClose) menuClose.addEventListener('click', closeSidebar);
    if(overlay) overlay.addEventListener('click', closeSidebar);
    
    // HTML内のonclickから呼べるようにする
    window.closeMenu = closeSidebar;

    // 初回ロード時にホーム画面を表示
    resetHome();
});

// --- ページ切り替え機能 ---
function loadPage(fileName, title) {
    // UIのリセット
    document.getElementById('page-title').innerText = title;
    const localInput = document.getElementById('localSearchInput');
    if(localInput) {
        localInput.value = ''; // ページ内検索クリア
        localInput.style.display = 'inline-block'; // ページ内検索を表示
    }
    
    const container = document.getElementById('data-container');
    container.innerHTML = '<p>Loading...</p>';

    Papa.parse(`./data/${fileName}`, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            currentData = results.data;
            renderData(currentData);
        },
        error: function(err) {
            container.innerHTML = `<p style="color:red;">Error: ${fileName} が読み込めませんでした。</p>`;
        }
    });
}

// --- ホームリセット機能 ---
function resetHome() {
    document.getElementById('page-title').innerText = 'Welcome to Adamaster\'s Guide';
    const localInput = document.getElementById('localSearchInput');
    if(localInput) localInput.style.display = 'none'; // ホームではページ内検索を隠す
    
    const container = document.getElementById('data-container');
    // ★ボタンを追加した初期画面
    container.innerHTML = `
        <div class="welcome-msg">
            <h3>クリスタル・フロンティア ルールブックへようこそ</h3>
            <p>左のメニューから項目を選択するか、サイドバーからキーワードを全検索してください。</p>
            
            <br>
            <a href="https://crystalfrontier.github.io/cf-builder/" target="_blank" class="db-button">
                カードデータベースを開く ↗
            </a>
        </div>
    `;
    
    window.closeMenu();
}

// --- ページ内検索（フィルタリング） ---
function filterLocalContent() {
    const query = document.getElementById('localSearchInput').value.toLowerCase();
    const cards = document.querySelectorAll('.rule-card');

    cards.forEach(card => {
        const text = card.innerText.toLowerCase();
        card.style.display = text.includes(query) ? 'block' : 'none';
    });
}

// --- 全ファイル検索機能 ---
function handleGlobalSearch(event) {
    if (event.key === 'Enter') {
        executeGlobalSearch();
    }
}

function executeGlobalSearch() {
    const query = document.getElementById('globalSearchInput').value.toLowerCase();
    if (!query) return;

    window.closeMenu();

    const container = document.getElementById('data-container');
    const titleEl = document.getElementById('page-title');
    const localInput = document.getElementById('localSearchInput');

    titleEl.innerText = `全検索結果: "${query}"`;
    if(localInput) localInput.style.display = 'none';
    container.innerHTML = '<p>Searching all crystals...</p>';

    const promises = fileMap.map(item => {
        return new Promise((resolve) => {
            Papa.parse(`./data/${item.file}`, {
                download: true,
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    // データにカテゴリ名を付与
                    const labeledData = results.data.map(row => ({
                        ...row,
                        _categoryName: item.name
                    }));
                    resolve(labeledData);
                },
                error: () => resolve([])
            });
        });
    });

    Promise.all(promises).then(allFilesData => {
        const flatData = allFilesData.flat();

        const filtered = flatData.filter(item => {
            // 検索対象のカラム
            const name = item['種類・領域'] || item['項目名'] || item['用語名'] || item['能力語'] || item['能力名'] || item['処理名'] || item['カウンター名'] || '';
            const desc = item['解説'] || item['ルール内容'] || '';
            
            return name.toLowerCase().includes(query) || desc.toLowerCase().includes(query);
        });

        renderData(filtered, true);
    });
}

/**
 * テキスト内の (1) や (赤) などを画像アイコンに変換する
 */
function formatEffect(text) {
    if (!text) return "";
    // 全角括弧を半角に統一
    let normalized = text.replace(/（/g, '(').replace(/）/g, ')');
    // 括弧内（1〜15文字）を画像タグに置換
    // main/rulebook/ から見て main/images/icons/ なのでパスは ../images/icons/
    return normalized.replace(/\(([^)]{1,15})\)/g, (match, content) => {
        const cleanContent = content.trim();
        const safeMatch = match.replace(/"/g, '&quot;');
        return `<img src="../images/icons/${cleanContent}.png" class="inline-icon" alt="${safeMatch}" onerror="this.style.display='none';this.insertAdjacentText('afterend','${safeMatch}')">`;
    });
}

// --- データ描画 ---
function renderData(data, showCategory = false) {
    const container = document.getElementById('data-container');
    container.innerHTML = '';

    if (!data || data.length === 0) {
        container.innerHTML = '<p>該当する項目は見つかりませんでした。</p>';
        return;
    }

    data.forEach(item => {
        const name = item['種類・領域'] || item['項目名'] || item['用語名'] || item['能力語'] || item['能力名'] || item['処理名'] || item['カウンター名'];
        const desc = item['解説'] || item['ルール内容'];
        
        // 項目名か解説のどちらかがあれば表示
        if (name || desc) {
            const card = document.createElement('div');
            card.className = 'rule-card';
            
            // カテゴリタグ（全検索時）
            const categoryHtml = showCategory && item._categoryName 
                ? `<span class="category-tag">${item._categoryName}</span>` 
                : '';

            // 見出し
            const titleHtml = name ? `<h3>${name}</h3>` : '';
            
            // 本文（ここで formatEffect を適用してアイコン化する）
            const descHtml = desc ? `<p>${formatEffect(desc)}</p>` : '';

            card.innerHTML = `
                ${categoryHtml}
                ${titleHtml}
                ${descHtml}
            `;
            container.appendChild(card);
        }
    });
}
