// ==========================================
// 1. Firebase Configuration & Initialization
// ==========================================

// ⚠️ 請將你原本的 Firebase Config 貼在下方的大括號中
const firebaseConfig = {
    // 在這裡貼上你的 apiKey, authDomain, databaseURL... 等設定
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
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onChildAdded, remove, child } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

let app, db;

try {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    console.log("Firebase initialized successfully");
} catch (error) {
    console.error("Firebase init error. Did you fill in the config?", error);
    alert("請檢查 script.js 中的 Firebase 設定是否已填寫！");
}

// ==========================================
// 2. Data & Configuration
// ==========================================

// Unsplash API Key
const UNSPLASH_ACCESS_KEY = "ZGC6pKeybukJmdSmEvRBjP5kw_WAiLD_h9nZI3v60WU";

// 使用者名單 (包含原班級與新加入的老師/嘉賓)
// 新增的人員我使用了 100 號以後的 ID 以示區別
const users = [
    { id: "1", name: "曹翔竣" }, { id: "2", name: "魏凱莉" },
    { id: "3", name: "葉宇芳" }, { id: "4", name: "卓仲涵" },
    { id: "5", name: "呂念臻" }, { id: "6", name: "劉軒安" },
    { id: "7", name: "蔡尹筑" }, { id: "8", name: "邱芮亭" },
    { id: "10", name: "黃宗毅" }, { id: "11", name: "姜曉菁" },
    { id: "12", name: "孫逸瀞" }, { id: "13", name: "林秀美" },
    { id: "14", name: "劉正義" }, { id: "15", name: "吳文惠" },
    { id: "16", "name": "陳詩喬" }, { id: "18", "name": "劉朝根" },
    { id: "19", "name": "薛曉寧" }, { id: "21", "name": "江淯審" },
    { id: "22", "name": "李珊珊" }, { id: "23", "name": "陳志豪" },
    { id: "24", "name": "喬英華" }, { id: "25", "name": "范姜宇萱" },
    { id: "26", "name": "池姍姍" },
    // 新增名單
    { id: "101", name: "AMY" },
    { id: "102", name: "咖啡老師" },
    { id: "103", name: "金魚老師" },
    { id: "104", name: "葉學祥老師" },
    { id: "105", name: "Vincent" },
    { id: "106", name: "徐薪皓導師" },
    { id: "107", name: "婷" }
];

// ==========================================
// 3. UI Logic & Functions
// ==========================================

const lobbyContainer = document.getElementById('lobby-container');
const wallContainer = document.getElementById('wall-container');
const lobbyGrid = document.getElementById('lobby-grid');
const wallContent = document.getElementById('wall-content');
const wallOwnerName = document.getElementById('wall-owner-name');
const backToLobbyBtn = document.getElementById('back-to-lobby');
const composeBtn = document.getElementById('compose-btn');
const composeModal = document.getElementById('compose-modal');
const closeModalBtn = document.querySelector('.close-modal');
const sendBtn = document.getElementById('send-btn');
const recipientSelect = document.getElementById('recipient-select');
const coverInput = document.getElementById('cover-input');
const searchImgBtn = document.getElementById('search-img-btn');
const imageResults = document.getElementById('image-results');
const adminTrigger = document.getElementById('admin-trigger');

let currentWallUserId = null;
let isAdmin = false;

// Initialize Lobby
function initLobby() {
    lobbyGrid.innerHTML = '';
    users.forEach(user => {
        const card = document.createElement('div');
        card.className = 'user-card';
        card.innerHTML = `
            <div class="mailbox-icon">📮</div>
            <div class="user-name">${user.name}</div>
        `;
        card.addEventListener('click', () => openWall(user.id, user.name));
        lobbyGrid.appendChild(card);
    });

    // Populate Recipient Dropdown
    recipientSelect.innerHTML = '<option value="" disabled selected>請選擇收件人</option>';

    // Add "Send to All" option
    const optionAll = document.createElement('option');
    optionAll.value = "ALL";
    optionAll.textContent = "📢 寄給所有人 (群發)";
    optionAll.style.fontWeight = "bold";
    recipientSelect.appendChild(optionAll);

    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.name;
        recipientSelect.appendChild(option);
    });
}

// Open Wall
function openWall(userId, userName) {
    currentWallUserId = userId;
    wallOwnerName.textContent = `${userName} 的明信片牆`;
    lobbyContainer.style.display = 'none';
    wallContainer.style.display = 'block';
    loadMessages(userId);
}

// Back to Lobby
backToLobbyBtn.addEventListener('click', () => {
    currentWallUserId = null;
    wallContainer.style.display = 'none';
    lobbyContainer.style.display = 'block';
    wallContent.innerHTML = '<div class="rope-layer"></div>'; // Reset wall
});

// Compose Modal
composeBtn.addEventListener('click', () => {
    composeModal.style.display = 'flex';
    imageResults.innerHTML = ''; // Clear previous searches
});

closeModalBtn.addEventListener('click', () => {
    composeModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === composeModal) composeModal.style.display = 'none';
});

// Image Search Logic (Unsplash API)
searchImgBtn.addEventListener('click', async () => {
    const query = coverInput.value.trim();
    if (!query) return;

    // Check if user entered a URL instead of a keyword
    if (query.startsWith('http')) {
        alert('您輸入的是網址。若要使用網址，請直接填入上方「封面圖片網址」欄位，無需點擊搜尋。');
        return;
    }

    imageResults.innerHTML = '搜尋中...';

    try {
        const response = await fetch(`https://api.unsplash.com/search/photos?page=1&query=${query}&per_page=4&client_id=${UNSPLASH_ACCESS_KEY}`);

        if (response.status === 403 || response.status === 429) {
            throw new Error("Rate Limit");
        }

        const data = await response.json();
        imageResults.innerHTML = '';

        if (data.results.length === 0) {
            imageResults.innerHTML = '找不到相關圖片';
            return;
        }

        data.results.forEach(photo => {
            const img = document.createElement('img');
            img.src = photo.urls.small;
            img.dataset.fullUrl = photo.urls.regular;
            img.dataset.credit = `Photo by ${photo.user.name}`;
            img.addEventListener('click', () => {
                // Select this image
                document.querySelectorAll('#image-results img').forEach(i => i.style.border = 'none');
                img.style.border = '3px solid #e74c3c';
                coverInput.value = photo.urls.regular; // Auto fill input
                coverInput.dataset.credit = `Photo by ${photo.user.name} on Unsplash`;
            });
            imageResults.appendChild(img);
        });

    } catch (error) {
        console.warn("Unsplash API Error:", error);
        // Fallback to Random Blind Box
        imageResults.innerHTML = '<p style="color:orange">搜尋次數已達上限，已轉為隨機模式</p>';
        const fallbackKeywords = ['nature', 'water', 'sky', 'forest', 'abstract'];
        const randomKey = fallbackKeywords[Math.floor(Math.random() * fallbackKeywords.length)];
        const randomUrl = `https://source.unsplash.com/random/600x400/?${randomKey}&sig=${Math.random()}`; // Note: source.unsplash can be unstable, but good for fallback

        // Since source.unsplash is deprecated/unreliable, let's use a static placeholder logic or simple alert
        imageResults.innerHTML += `<div class="fallback-box" onclick="selectFallback()">🎲 點擊使用隨機圖片</div>`;
    }
});

// Helper: Select Fallback Image
window.selectFallback = function () {
    const randomNum = Math.floor(Math.random() * 1000);
    const url = `https://picsum.photos/seed/${randomNum}/600/400`; // Using Picsum for reliable fallback
    coverInput.value = url;
    coverInput.dataset.credit = "Random Image";
    alert("已選擇隨機圖片！");
}

// ==========================================
// 4. NEW LOGIC: Resolve Image URL
// ==========================================
// 此功能用於解析使用者貼上的 Unsplash 網頁連結
async function resolveImageSource(inputUrl) {
    inputUrl = inputUrl.trim();

    // 1. 如果是 Unsplash 網頁連結 (例如: https://unsplash.com/photos/xxxx-ID)
    if (inputUrl.includes('unsplash.com/photos/')) {
        try {
            // 從網址中抓取 ID。通常 ID 位於最後一個斜線後，問號前
            // 例如 .../photos/christmas-tree...-OwAgJwshLzo
            const urlParts = inputUrl.split('/');
            let photoId = urlParts[urlParts.length - 1];
            // 如果 ID 後面有 ? (參數)，要去掉
            if (photoId.includes('?')) {
                photoId = photoId.split('?')[0];
            }

            console.log("Detected Unsplash Web Link. ID:", photoId);

            // 呼叫 API 取得真正的圖片連結
            const apiRes = await fetch(`https://api.unsplash.com/photos/${photoId}?client_id=${UNSPLASH_ACCESS_KEY}`);
            if (!apiRes.ok) throw new Error("Unsplash API Lookup Failed");

            const photoData = await apiRes.json();
            return {
                url: photoData.urls.regular,
                credit: `Photo by ${photoData.user.name} on Unsplash`
            };

        } catch (e) {
            console.error("Error resolving Unsplash link:", e);
            // 如果失敗，退回使用原始連結（雖然可能無法顯示，但至少不會卡死）
            return { url: inputUrl, credit: "Image from Unsplash" };
        }
    }

    // 2. 如果是普通圖片連結 (直連)
    return {
        url: inputUrl,
        credit: coverInput.dataset.credit || "Internet Image"
    };
}


// Send Message Logic (Modified for Group Send & Unsplash Resolve)
sendBtn.addEventListener('click', async () => {
    const recipientId = recipientSelect.value;
    const senderName = document.getElementById('sender-input').value.trim() || '匿名';
    const messageText = document.getElementById('message-text').value.trim();
    const rawCoverUrl = coverInput.value.trim();

    if (!recipientId || !messageText || !rawCoverUrl) {
        alert('請填寫完整資訊 (收件人、內容、封面圖)');
        return;
    }

    sendBtn.disabled = true;
    sendBtn.innerText = "處理中...";

    // 1. 解析圖片連結 (處理 Unsplash 網頁網址)
    const imageInfo = await resolveImageSource(rawCoverUrl);

    const newPostcard = {
        from: senderName,
        message: messageText,
        image: imageInfo.url,
        credit: imageInfo.credit,
        timestamp: Date.now()
    };

    // 2. Determine Recipients
    let targets = [];
    if (recipientId === "ALL") {
        targets = users.map(u => u.id); // All user IDs
    } else {
        targets = [recipientId];
    }

    // 3. Send to Firebase
    try {
        const updates = targets.map(uid => {
            const msgRef = ref(db, 'messages/' + uid);
            return push(msgRef, newPostcard);
        });

        await Promise.all(updates);

        alert('明信片寄送成功！');
        composeModal.style.display = 'none';
        // Reset form
        document.getElementById('message-text').value = '';
        coverInput.value = '';
        imageResults.innerHTML = '';

        // If viewing a wall, refresh not strictly needed as onChildAdded handles it, 
        // but keeps UI clean.
    } catch (error) {
        console.error("Send error:", error);
        alert('寄送失敗，請稍後再試。');
    } finally {
        sendBtn.disabled = false;
        sendBtn.innerText = "投遞明信片";
    }
});

// ==========================================
// 5. Wall Display Logic (Ropes & Cards)
// ==========================================

function loadMessages(userId) {
    const messagesRef = ref(db, 'messages/' + userId);

    // Clear current wall content but keep container
    wallContent.innerHTML = '';

    // Create initial rope
    let currentRope = createRope();
    wallContent.appendChild(currentRope);
    let cardCountOnRope = 0;

    // Listen for new messages
    onChildAdded(messagesRef, (snapshot) => {
        const msg = snapshot.val();
        const msgKey = snapshot.key;

        if (cardCountOnRope >= 3) { // 3 cards per rope (desktop)
            currentRope = createRope();
            wallContent.appendChild(currentRope);
            cardCountOnRope = 0;
        }

        const card = createPostcardElement(msg, msgKey, userId);
        currentRope.appendChild(card);

        // Add minimal animation delay
        setTimeout(() => card.classList.add('visible'), 100);

        cardCountOnRope++;
    });
}

function createRope() {
    const rope = document.createElement('div');
    rope.className = 'rope';
    return rope;
}

function createPostcardElement(msg, msgKey, userId) {
    const dateObj = new Date(msg.timestamp);
    const dateStr = dateObj.toLocaleDateString('zh-TW');
    const timeStr = dateObj.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });

    const scene = document.createElement('div');
    scene.className = 'postcard-scene';

    scene.innerHTML = `
        <div class="postcard-wrapper">
            <div class="postcard-face postcard-front">
                <img src="${msg.image}" alt="cover" onerror="this.src='https://via.placeholder.com/600x400?text=Image+Error'">
            </div>
            <div class="postcard-face postcard-back">
                <div class="stamp">
                    <div class="stamp-circle">
                        <span>郵</span>
                        <small>${dateStr}</small>
                        <small>${timeStr}</small>
                    </div>
                </div>
                <div class="message-body">
                    <p>To: ${users.find(u => u.id === userId)?.name || 'User'}</p>
                    <div class="text-content">${msg.message}</div>
                    <p class="signature">From: ${msg.from}</p>
                </div>
                <div class="credit-line">${msg.credit || ''}</div>
            </div>
        </div>
        ${isAdmin ? `<button class="delete-btn" onclick="deleteMessage('${userId}', '${msgKey}')">🗑️</button>` : ''}
    `;

    // Click to Zoom
    const wrapper = scene.querySelector('.postcard-wrapper');
    wrapper.addEventListener('click', () => {
        wrapper.classList.toggle('is-flipped'); // Just flip for now, or add zoom logic in CSS
        scene.classList.toggle('zoomed'); // Apply zoom class to parent
    });

    return scene;
}

// ==========================================
// 6. Admin Logic
// ==========================================

adminTrigger.addEventListener('click', (e) => {
    e.preventDefault();
    const pw = prompt("請輸入管理員密碼：");
    if (pw === "teacher123") {
        isAdmin = true;
        alert("管理員模式已開啟。現在您可以看到刪除按鈕。");
        // Reload current wall to show delete buttons if open
        if (currentWallUserId) {
            loadMessages(currentWallUserId);
        }
    } else {
        alert("密碼錯誤");
    }
});

window.deleteMessage = function (userId, msgKey) {
    if (!confirm("確定要刪除這張明信片嗎？")) return;

    const msgRef = ref(db, `messages/${userId}/${msgKey}`);
    remove(msgRef)
        .then(() => {
            alert("已刪除");
            // UI will update automatically via Firebase listener? 
            // Actually onChildRemoved is not set up, so we might need to refresh manualy or remove DOM.
            // Simplest: Reload wall
            loadMessages(userId);
        })
        .catch(err => alert("刪除失敗: " + err.message));
};


// Start App
initLobby();
