// CSVファイル一覧と、表示用のカテゴリ名の定義
const fileMap = [
    { file: 'cards.csv', name: 'カードの種類と領域' },
    { file: 'turns.csv', name: 'ターンの流れ' },
    { file: 'terms.csv', name: '用語集' },
    { file: 'abilities.csv', name: '能力語' },
    { file: 'keywords.csv', name: 'キーワード能力' },
    { file: 'processes.csv', name: 'キーワード処理' },
    { file: 'counters.csv', name: 'カウンター' }
];

let currentData = []; // 現在表示中のページのデータ

document.addEventListener('DOMContentLoaded', () => {
    // ハンバーガーメニュー等の処理は既存のまま
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
    window.closeMenu = closeSidebar;
});

// --- ページ切り替え機能 ---
function loadPage(fileName, title) {
    // UIのリセット
    document.getElementById('page-title').innerText = title;
    document.getElementById('localSearchInput').value = ''; // ページ内検索クリア
    document.getElementById('localSearchInput').style.display = 'inline-block'; // ページ内検索を表示
    
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
            container.innerHTML = `<p style="color:red;">Error: ${fileName}</p>`;
        }
    });
}

// --- ホームリセット機能 ---
function resetHome() {
    document.getElementById('page-title').innerText = 'Welcome to Adamaster\'s Guide';
    document.getElementById('localSearchInput').style.display = 'none'; // ホームではページ内検索を隠す
    
    const container = document.getElementById('data-container');
    container.innerHTML = `
        <div class="welcome-msg">
            <h3>クリスタル・フロンティア ルールブックへようこそ</h3>
            <p>左のメニューから項目を選択するか、サイドバーからキーワードを全検索してください。</p>
        </div>
    `;
    
    // メニューが開いていれば閉じる（スマホ用）
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

    // スマホメニューが開いていたら閉じる
    window.closeMenu();

    const container = document.getElementById('data-container');
    const titleEl = document.getElementById('page-title');
    const localInput = document.getElementById('localSearchInput');

    titleEl.innerText = `全検索結果: "${query}"`;
    localInput.style.display = 'none'; // 全検索時はページ内検索を隠す
    container.innerHTML = '<p>Searching all crystals...</p>';

    // すべてのCSVを非同期で読み込むPromise配列を作成
    const promises = fileMap.map(item => {
        return new Promise((resolve) => {
            Papa.parse(`./data/${item.file}`, {
                download: true,
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    // データに「カテゴリ名」を付与して返す
                    const labeledData = results.data.map(row => ({
                        ...row,
                        _categoryName: item.name // 表示用にカテゴリ名を埋め込む
                    }));
                    resolve(labeledData);
                },
                error: () => resolve([]) // エラーでも止まらないように空配列を返す
            });
        });
    });

    // 全ファイルの読み込み完了を待つ
    Promise.all(promises).then(allFilesData => {
        // 配列の配列をフラットにする（[Array, Array] -> [Obj, Obj...]）
        const flatData = allFilesData.flat();

        // クエリでフィルタリング
        const filtered = flatData.filter(item => {
            const name = item['種類・領域'] || item['項目名'] || item['用語名'] || item['能力語'] || item['能力名'] || item['処理名'] || item['カウンター名'] || '';
            const desc = item['解説'] || '';
            return name.toLowerCase().includes(query) || desc.toLowerCase().includes(query);
        });

        renderData(filtered, true); // 第2引数 true でカテゴリタグを表示モードに
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
        const desc = item['解説'];
        
        if (name) {
            const card = document.createElement('div');
            card.className = 'rule-card';
            
            // 全検索時はカテゴリ名（どのファイルのルールか）を表示する
            const categoryHtml = showCategory && item._categoryName 
                ? `<span class="category-tag">${item._categoryName}</span>` 
                : '';

            const note = item['補足'] 
                ? `<small style="display:block; margin-top:10px; color:#94a3b8;">※ ${item['補足']}</small>` 
                : '';

            card.innerHTML = `
                ${categoryHtml}
                <h3>${name}</h3>
                <p>${desc || ''}</p>
                ${note}
            `;
            container.appendChild(card);
        }
    });
}
