// Import Firebase SDKs (using ES Modules for browser)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- CONFIGURATION ---

// 1. User List (加入許願池)
const USER_LIST = [
    // --- 新增：公共許願池 (放在第一個) ---
    { "id": "public", "name": "🌟 許願池 (公共留言板)" },

    // --- 學員名單 ---
    { "id": "1", "name": "曹翔竣" }, { "id": "2", "name": "魏凱莉" },
    { "id": "3", "name": "葉宇芳" }, { "id": "4", "name": "卓仲涵" },
    { "id": "5", "name": "呂念臻" }, { "id": "6", "name": "劉軒安" },
    { "id": "7", "name": "蔡尹筑" }, { "id": "8", "name": "邱芮亭" },
    { "id": "10", "name": "黃宗毅" }, { "id": "11", "name": "姜曉菁" },
    { "id": "12", "name": "孫逸瀞" }, { "id": "13", "name": "林秀美" },
    { "id": "14", "name": "劉正義" }, { "id": "15", "name": "吳文惠" },
    { "id": "16", "name": "陳詩喬" }, { "id": "18", "name": "劉朝根" },
    { "id": "19", "name": "薛曉寧" }, { "id": "21", "name": "江淯審" },
    { "id": "22", "name": "李珊珊" }, { "id": "23", "name": "陳志豪" },
    { "id": "24", "name": "喬英華" }, { "id": "25", "name": "范姜宇萱" },
    { "id": "26", "name": "池姍姍" },
    // --- 老師與助教名單 ---
    { "id": "101", "name": "AMY" },
    { "id": "102", "name": "咖啡老師" },
    { "id": "103", "name": "金魚老師" },
    { "id": "104", "name": "葉學祥老師" },
    { "id": "105", "name": "Vincent" },
    { "id": "106", "name": "徐薪皓導師" },
    { "id": "107", "name": "婷" }
];

// 2. Unsplash Config
const UNSPLASH_ACCESS_KEY = 'ZGC6pKeybukJmdSmEvRBjP5kw_WAiLD_h9nZI3v60WU';
const UNSPLASH_API_SEARCH_URL = 'https://api.unsplash.com/search/photos';
const UNSPLASH_API_PHOTO_URL = 'https://api.unsplash.com/photos';

// Fallback Images (Blind Box)
const FALLBACK_IMAGES = [
    { url: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=400', credit: 'Daniel Olah', link: 'https://unsplash.com' },
    { url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=400', credit: 'Clement H', link: 'https://unsplash.com' },
    { url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=400', credit: 'Patrick Tomasso', link: 'https://unsplash.com' },
    { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400', credit: 'Sean Oulashin', link: 'https://unsplash.com' },
    { url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=400', credit: 'V2osk', link: 'https://unsplash.com' }
];

// 3. Firebase Config
// ⚠️ 注意：請把這裡換成你原本有效的 Firebase Config！(你上傳的檔案這裡是空的)
const firebaseConfig = {
    apiKey: "AIzaSyD8HruhZEJZ0Oc4ZtWo4B_TvnylmaGE7bs",
    authDomain: "rowan-20251217.firebaseapp.com",
    databaseURL: "https://rowan-20251217-default-rtdb.firebaseio.com",
    projectId: "rowan-20251217",
    storageBucket: "rowan-20251217.firebasestorage.app",
    messagingSenderId: "96584481086",
    appId: "1:96584481086:web:f8f6531c2686cbe59ed46f",
    measurementId: "G-L98TXMF9FB"
};

// Initialize Firebase
let app, db;
try {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
} catch (e) {
    console.error("Firebase 初始化失敗，請檢查 firebaseConfig 是否已填寫", e);
    alert("請檢查 script.js 中的 Firebase 設定！");
}

// --- GLOBAL STATE ---
let currentView = 'lobby';
let currentTargetUser = null; // Who are we reading?
let isAdmin = false;

// --- DOM ELEMENTS ---
const lobbyView = document.getElementById('lobby-view');
const wallView = document.getElementById('wall-view');
const userGrid = document.getElementById('user-grid');
const wallOwnerName = document.getElementById('wall-owner-name');
const ropeContainer = document.getElementById('rope-container');
const writeModal = document.getElementById('write-modal');
const recipientSelect = document.getElementById('recipient-select');
const cardModal = document.getElementById('card-modal');
const activeCard = document.getElementById('active-card');

// --- INITIALIZATION ---

function init() {
    renderUserGrid();
    populateRecipientDropdown();
    setupEventListeners();
}

// Render Lobby Grid
function renderUserGrid() {
    userGrid.innerHTML = '';
    USER_LIST.forEach(user => {
        const div = document.createElement('div');
        div.className = 'mailbox';
        div.innerHTML = `
            <h3>${user.name}</h3>
            <span class="id-tag">No. ${user.id}</span>
        `;
        div.onclick = () => openWall(user);
        userGrid.appendChild(div);
    });
}

// Populate Write Modal Dropdown
function populateRecipientDropdown() {
    // 1. 加入「全體學員」選項 (放在最上面)
    const optionStudents = document.createElement('option');
    optionStudents.value = "STUDENTS";
    optionStudents.textContent = "🎓 寄給全體學員 (不含老師)";
    optionStudents.style.fontWeight = "bold";
    optionStudents.style.color = "#d35400"; // 橘色強調
    recipientSelect.appendChild(optionStudents);

    // 2. 加入「全體人員」選項 (原本的)
    const optionAll = document.createElement('option');
    optionAll.value = "ALL";
    optionAll.textContent = "📢 寄給所有人 (含老師、許願池)";
    recipientSelect.appendChild(optionAll);

    // 3. 產生個別名單
    USER_LIST.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        // 稍微區分一下許願池的顯示
        if (user.id === 'public') {
            option.textContent = user.name;
            option.style.fontWeight = "bold";
        } else {
            option.textContent = `${user.id === 'public' ? '' : user.id + '. '}${user.name}`;
        }
        recipientSelect.appendChild(option);
    });
}

// --- NAVIGATION ---

window.app = {
    goHome: () => {
        currentView = 'lobby';
        wallView.classList.remove('active');
        lobbyView.classList.add('active');
        currentTargetUser = null;
    }
};

function openWall(user) {
    currentTargetUser = user;
    currentView = 'wall';
    lobbyView.classList.remove('active');
    wallView.classList.add('active');
    wallOwnerName.textContent = `${user.name} 的留言板`;

    loadMessages(user.id);
}

// --- FIREBASE READ ---

function loadMessages(userId) {
    ropeContainer.innerHTML = '<div class="loading-msg">正在掛上明信片...</div>';

    const messagesRef = ref(db, 'messages/' + userId);
    onValue(messagesRef, (snapshot) => {
        ropeContainer.innerHTML = ''; // Clear loading
        const data = snapshot.val();

        if (!data) {
            ropeContainer.innerHTML = '<div class="loading-msg">這裡還空空的，快寄張明信片來吧！</div>';
            return;
        }

        renderRopes(data);
    });
}

// --- RENDER LOGIC (THE ROPES) ---

function renderRopes(messagesObj) {
    const messages = Object.entries(messagesObj).map(([key, val]) => ({ ...val, key }));
    messages.sort((a, b) => b.timestamp - a.timestamp);

    // Determine cards per rope based on screen size
    const isMobile = window.innerWidth < 768;
    const cardsPerRope = isMobile ? 2 : 4;

    let currentRope = null;

    messages.forEach((msg, index) => {
        // Start new rope every N cards
        if (index % cardsPerRope === 0) {
            currentRope = document.createElement('div');
            currentRope.className = 'rope-row';
            ropeContainer.appendChild(currentRope);
        }

        const card = createCardElement(msg);
        currentRope.appendChild(card);
    });
}

function createCardElement(msg) {
    const hanger = document.createElement('div');
    hanger.className = 'card-hanger';
    // Random slight rotation for natural look
    const randomRot = (Math.random() * 6 - 3).toFixed(1);
    hanger.style.transform = `rotate(${randomRot}deg)`;

    const img = document.createElement('img');
    img.src = msg.imageUrl || FALLBACK_IMAGES[0].url;
    img.className = 'card-thumb-img';

    hanger.appendChild(img);

    // Admin Delete Button
    if (isAdmin) {
        const delBtn = document.createElement('button');
        delBtn.className = 'delete-btn';
        delBtn.style.display = 'flex';
        delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
        delBtn.onclick = (e) => {
            e.stopPropagation();
            deleteMessage(msg.key);
        };
        hanger.appendChild(delBtn);
    }

    // Interaction
    hanger.onclick = () => openCardViewer(msg);

    return hanger;
}

// --- CARD VIEWER (3D FLIP) ---

function openCardViewer(msg) {
    // Populate Data
    document.getElementById('view-cover-img').src = msg.imageUrl;
    document.getElementById('view-from').textContent = msg.from || '匿名';
    document.getElementById('view-msg').textContent = msg.content;
    document.getElementById('view-credit').innerHTML = `Photo by <a href="${msg.imageCreditLink || '#'}" target="_blank" style="color:#aaa">${msg.imageCredit || 'Unsplash'}</a> on Unsplash`;

    // Format Timestamp for Stamp
    const date = new Date(msg.timestamp);
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    document.querySelector('.stamp-date').textContent = `${months[date.getMonth()]} ${date.getDate()}`;
    document.querySelector('.stamp-loc').textContent = date.getFullYear();

    // Reset State
    activeCard.classList.remove('flipped');
    cardModal.style.display = 'flex';
}

// --- WRITE MODAL & UNSPLASH (Updated for URL Paste) ---

const imgKeywordInput = document.getElementById('img-keyword');
const imgResultsDiv = document.getElementById('img-results');
const searchStatus = document.getElementById('search-status');
let selectedImageData = null;

document.getElementById('writeBtn').onclick = () => {
    writeModal.style.display = 'block';
    if (currentView === 'wall' && currentTargetUser) {
        recipientSelect.value = currentTargetUser.id;
    }
};

document.querySelector('.close-modal').onclick = () => {
    writeModal.style.display = 'none';
};

// 處理 Unsplash 搜尋與網址解析
document.getElementById('search-img-btn').onclick = async () => {
    const query = imgKeywordInput.value.trim();
    if (!query) return;

    imgResultsDiv.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 搜尋中...';
    searchStatus.textContent = '';

    // --- 新增：判斷是否為 Unsplash 網址 ---
    // 例如: https://unsplash.com/photos/christmas-tree-OwAgJwshLzo
    if (query.includes('unsplash.com/photos/')) {
        try {
            // 抓取 ID：通常是網址最後一段，或是 - 之後的代碼
            // 簡單策略：先切開 '/' 取最後一段，再嘗試獲取 ID
            // Unsplash 網址結構通常是 .../photos/標題-ID
            // 我們直接把整個 slug 丟給 API，或是嘗試解析

            const urlParts = query.split('/');
            // 取得最後一段 (e.g., christmas-tree-OwAgJwshLzo)
            // 如果最後面有 ? (參數) 要去掉
            let photoSlug = urlParts[urlParts.length - 1].split('?')[0];

            // 呼叫單張照片 API
            const response = await fetch(`${UNSPLASH_API_PHOTO_URL}/${photoSlug}?client_id=${UNSPLASH_ACCESS_KEY}`);

            if (!response.ok) throw new Error('Photo not found');

            const data = await response.json();

            // 直接顯示這張圖結果
            renderImgResults([{
                url: data.urls.small, // 預覽用小圖
                fullUrl: data.urls.regular, // 實際存這張
                credit: data.user.name,
                link: data.links.html
            }]);
            searchStatus.textContent = "已找到指定圖片！";
            return; // 結束，不進行關鍵字搜尋

        } catch (error) {
            console.warn('URL Resolve Error', error);
            searchStatus.textContent = "無法解析該網址，將嘗試作為關鍵字搜尋...";
            // 失敗的話，繼續往下走，當作關鍵字搜尋
        }
    }

    // --- 原有的關鍵字搜尋邏輯 ---
    try {
        const response = await fetch(`${UNSPLASH_API_SEARCH_URL}?query=${encodeURIComponent(query)}&per_page=6&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`);

        if (response.status === 403 || response.status === 429) {
            throw new Error('Rate Limit');
        }

        const data = await response.json();
        if (data.results && data.results.length > 0) {
            renderImgResults(data.results.map(img => ({
                url: img.urls.small,
                fullUrl: img.urls.regular,
                credit: img.user.name,
                link: img.links.html
            })));
        } else {
            searchStatus.textContent = "找不到相關圖片，試試別的關鍵字？";
            imgResultsDiv.innerHTML = '';
        }

    } catch (error) {
        console.warn('Unsplash API Limit or Error', error);
        searchStatus.textContent = "⚠️ 搜尋次數已達上限，目前轉為隨機圖片模式";
        const randomPicks = [];
        for (let i = 0; i < 4; i++) {
            randomPicks.push(FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)]);
        }
        renderImgResults(randomPicks);
    }
};

function renderImgResults(images) {
    imgResultsDiv.innerHTML = '';
    images.forEach(img => {
        const thumb = document.createElement('img');
        thumb.src = img.url;
        thumb.className = 'search-thumb';
        thumb.onclick = () => {
            document.querySelectorAll('.search-thumb').forEach(el => el.classList.remove('selected'));
            thumb.classList.add('selected');
            selectedImageData = img;

            // 這裡優先使用 fullUrl (如果有)，否則用 url
            // 關鍵字搜尋回傳的 img 物件裡我們上面有加 fullUrl
            // Fallback 只有 url
            const saveUrl = img.fullUrl || img.url;

            document.getElementById('selected-img-url').value = saveUrl;
            document.getElementById('selected-img-credit').value = img.credit;
            document.getElementById('selected-img-link').value = img.link;
        };
        imgResultsDiv.appendChild(thumb);
    });
}

// --- SEND MESSAGE ---

document.getElementById('compose-form').onsubmit = async (e) => {
    e.preventDefault();

    const recipientId = recipientSelect.value;
    const sender = document.getElementById('sender-name').value;
    const content = document.getElementById('message-text').value;
    const imgUrl = document.getElementById('selected-img-url').value;

    if (!imgUrl) {
        Swal.fire('請先選擇一張封面圖片！');
        return;
    }

    const postData = {
        from: sender,
        content: content,
        imageUrl: imgUrl,
        imageCredit: document.getElementById('selected-img-credit').value,
        imageCreditLink: document.getElementById('selected-img-link').value,
        timestamp: serverTimestamp()
    };

    const submitBtn = document.querySelector('.send-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = '傳送中...';

    try {
        // --- 修改開始：新增 STUDENTS 的判斷邏輯 ---

        if (recipientId === 'ALL') {
            // 寄給全部人 (包含許願池、老師)
            const promises = USER_LIST.map(user => {
                return push(ref(db, 'messages/' + user.id), postData);
            });
            await Promise.all(promises);
            Swal.fire('成功!', '已廣播給所有人', 'success');

        } else if (recipientId === 'STUDENTS') {
            // 🎓 只寄給學員 (邏輯：排除 ID 為 'public' 且排除 ID >= 100 的老師)
            const studentList = USER_LIST.filter(user => {
                // 排除公共許願池
                if (user.id === 'public') return false;
                // 將 ID 轉為數字，如果小於 100 則視為學員
                const uid = parseInt(user.id);
                return !isNaN(uid) && uid < 100;
            });

            const promises = studentList.map(user => {
                return push(ref(db, 'messages/' + user.id), postData);
            });
            await Promise.all(promises);
            Swal.fire('成功!', '已寄送給全體學員 (23人)', 'success');

        } else {
            // 寄給單一對象 (包含個別寄給許願池)
            await push(ref(db, 'messages/' + recipientId), postData);
            Swal.fire('成功!', '明信片已寄出', 'success');
        }

        // --- 修改結束 ---

        writeModal.style.display = 'none';
        document.getElementById('compose-form').reset();
        imgResultsDiv.innerHTML = '';
        selectedImageData = null;

    } catch (error) {
        // ... (原本的錯誤處理不用動)
    };

    // --- EVENT LISTENERS ---

    function setupEventListeners() {
        activeCard.onclick = () => {
            activeCard.classList.toggle('flipped');
        };

        document.querySelector('.card-modal-backdrop').onclick = () => {
            cardModal.style.display = 'none';
            activeCard.classList.remove('flipped');
        };

        document.getElementById('admin-trigger').onclick = () => {
            const pwd = prompt("請輸入管理者密碼:");
            if (pwd === "teacher123") {
                isAdmin = true;
                document.getElementById('admin-trigger').style.color = "red";
                document.getElementById('admin-trigger').textContent = "Admin Active";
                alert("管理者模式已開啟");
                if (currentView === 'wall' && currentTargetUser) {
                    loadMessages(currentTargetUser.id);
                }
            }
        };
    }

    // --- ADMIN ---

    window.deleteMessage = async (msgKey) => {
        if (!confirm("確定要刪除這張明信片嗎？無法復原喔！")) return;
        try {
            await remove(ref(db, `messages/${currentTargetUser.id}/${msgKey}`));
        } catch (e) {
            alert("刪除失敗");
        }
    };

    // Start
    init();
