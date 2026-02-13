// CSVデータ保持用
let currentData = [];

// ページ読み込み完了時の処理
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menu-toggle');
    const menuClose = document.getElementById('menu-close');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    // メニューを開く
    menuToggle.addEventListener('click', () => {
        sidebar.classList.add('active');
        overlay.classList.add('active');
    });

    // メニューを閉じる（閉じるボタン or 背景クリック）
    function closeSidebar() {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    }

    menuClose.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);

    // グローバルスコープに関数を公開（HTMLのonclickから呼ぶため）
    window.closeMenu = closeSidebar;
});


function loadPage(fileName, title) {
    const titleEl = document.getElementById('page-title');
    const container = document.getElementById('data-container');
    
    // タイトル設定
    if(titleEl) titleEl.innerText = title;
    
    container.innerHTML = '<p>Loading Crystal Data...</p>';

    // パスを data/ 配下に指定
    Papa.parse(`./data/${fileName}`, {
        download: true,
        header: true,
        skipEmptyLines: true, // 空行をスキップ
        complete: function(results) {
            currentData = results.data;
            renderData(currentData);
        },
        error: function(err) {
            container.innerHTML = `<p style="color:red;">Error: ファイルが見つかりません (${fileName})</p>`;
        }
    });
}

function renderData(data) {
    const container = document.getElementById('data-container');
    container.innerHTML = '';

    if (!data || data.length === 0) {
        container.innerHTML = '<p>データがありません。</p>';
        return;
    }

    data.forEach(item => {
        // カラム名の揺らぎを吸収
        const name = item['種類・領域'] || item['項目名'] || item['用語名'] || item['能力語'] || item['能力名'] || item['処理名'] || item['カウンター名'];
        const desc = item['解説'];
        
        // 補足がある場合
        const note = item['補足'] ? `<small style="display:block; margin-top:10px; color:#94a3b8;">※ ${item['補足']}</small>` : '';

        if (name) {
            const card = document.createElement('div');
            card.className = 'rule-card';
            card.innerHTML = `
                <h3>${name}</h3>
                <p>${desc || ''}</p>
                ${note}
            `;
            container.appendChild(card);
        }
    });
}

function filterContent() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const cards = document.querySelectorAll('.rule-card');

    cards.forEach(card => {
        const text = card.innerText.toLowerCase();
        card.style.display = text.includes(query) ? 'block' : 'none';
    });
}
