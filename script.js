// Import Firebase SDKs (using ES Modules for browser)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- CONFIGURATION ---

// 1. User List
const USER_LIST = [
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
    { "id": "26", "name": "池姍姍" }
];

// 2. Unsplash Config
const UNSPLASH_ACCESS_KEY = 'ZGC6pKeybukJmdSmEvRBjP5kw_WAiLD_h9nZI3v60WU';
const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos';

// Fallback Images (Blind Box)
const FALLBACK_IMAGES = [
    { url: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=400', credit: 'Daniel Olah', link: 'https://unsplash.com' },
    { url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=400', credit: 'Clement H', link: 'https://unsplash.com' },
    { url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=400', credit: 'Patrick Tomasso', link: 'https://unsplash.com' },
    { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400', credit: 'Sean Oulashin', link: 'https://unsplash.com' },
    { url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=400', credit: 'V2osk', link: 'https://unsplash.com' }
];

// 3. Firebase Config
// TODO: Replace this object with your actual Firebase project config from the Console!
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
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

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
    // Keep the "ALL" option, add users
    USER_LIST.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.id}. ${user.name}`;
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
    // Reverse to show newest last? Or newest first? Usually newest first is better for feed, 
    // but for "infinite rope" maybe append. Let's do newest first.
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

// --- WRITE MODAL & UNSPLASH ---

const imgKeywordInput = document.getElementById('img-keyword');
const imgResultsDiv = document.getElementById('img-results');
const searchStatus = document.getElementById('search-status');
let selectedImageData = null;

document.getElementById('writeBtn').onclick = () => {
    writeModal.style.display = 'block';
    // Pre-select user if in Wall view
    if (currentView === 'wall' && currentTargetUser) {
        recipientSelect.value = currentTargetUser.id;
    }
};

document.querySelector('.close-modal').onclick = () => {
    writeModal.style.display = 'none';
};

document.getElementById('search-img-btn').onclick = async () => {
    const query = imgKeywordInput.value.trim();
    if (!query) return;

    imgResultsDiv.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 搜尋中...';
    searchStatus.textContent = '';

    try {
        const response = await fetch(`${UNSPLASH_API_URL}?query=${encodeURIComponent(query)}&per_page=6&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`);

        if (response.status === 403 || response.status === 429) {
            throw new Error('Rate Limit');
        }

        const data = await response.json();
        if (data.results && data.results.length > 0) {
            renderImgResults(data.results.map(img => ({
                url: img.urls.small,
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
        // Blind Box Mode
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
            document.getElementById('selected-img-url').value = img.url;
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
        if (recipientId === 'ALL') {
            // Send to everyone
            const promises = USER_LIST.map(user => {
                return push(ref(db, 'messages/' + user.id), postData);
            });
            await Promise.all(promises);
            Swal.fire('成功!', '已寄送給全班同學', 'success');
        } else {
            // Send to specific user
            await push(ref(db, 'messages/' + recipientId), postData);
            Swal.fire('成功!', '明信片已寄出', 'success');
        }

        // Reset and close
        writeModal.style.display = 'none';
        document.getElementById('compose-form').reset();
        imgResultsDiv.innerHTML = '';
        selectedImageData = null;

    } catch (error) {
        console.error(error);
        Swal.fire('錯誤', '寄送失敗，請檢查網路', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '寄出信件';
    }
};

// --- EVENT LISTENERS ---

function setupEventListeners() {
    // 3D Flip Click
    activeCard.onclick = () => {
        activeCard.classList.toggle('flipped');
    };

    // Close Modal Outside Click
    document.querySelector('.card-modal-backdrop').onclick = () => {
        cardModal.style.display = 'none';
        activeCard.classList.remove('flipped'); // Reset
    };

    // Admin Trigger
    document.getElementById('admin-trigger').onclick = () => {
        const pwd = prompt("請輸入管理者密碼:");
        if (pwd === "teacher123") {
            isAdmin = true;
            document.getElementById('admin-trigger').style.color = "red";
            document.getElementById('admin-trigger').textContent = "Admin Active";
            alert("管理者模式已開啟");
            // Refresh view if on wall
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
        // UI updates automatically via onValue listener
    } catch (e) {
        alert("刪除失敗");
    }
};

// Start
init();
