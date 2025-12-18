<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>時光信箱 - 班級留言板</title>
    
    <!-- Fonts: Zen Maru Gothic and Noto Serif TC -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Huninn:wght@400;700&family=Huninn:wght@400;700&display=swap" rel="stylesheet">
    
    <!-- Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <!-- Custom CSS -->
    <link rel="stylesheet" href="style.css">
<link rel="stylesheet" href="/index.css">
</head>
<body>

    <!-- Header / Navigation -->
    <header>
        <div class="logo" onclick="app.goHome()">
            <i class="fa-solid fa-envelope-open-text"></i> 時光信箱
        </div>
        <button id="writeBtn" class="write-btn">
            <i class="fa-solid fa-pen-nib"></i> 我要寄信
        </button>
    </header>

    <!-- Main Container -->
    <main id="app-container">
        <!-- Section 1: The Lobby (User Grid) -->
        <div id="lobby-view" class="view active">
            <div class="lobby-title">
                <h2><i class="fa-solid fa-users"></i> 請選擇收信人</h2>
                <p>點擊名字查看對方的留言板</p>
            </div>
            <div id="user-grid" class="user-grid">
                <!-- Users injected via JS -->
            </div>
        </div>

        <!-- Section 3: The Wall (Ropes & Postcards) -->
        <div id="wall-view" class="view">
            <div class="wall-header">
                <button class="back-btn" onclick="app.goHome()">
                    <i class="fa-solid fa-arrow-left"></i> 返回大廳
                </button>
                <h2 id="wall-owner-name">某某某 的留言板</h2>
            </div>
            
            <div id="rope-container" class="rope-container">
                <!-- Ropes and Cards injected via JS -->
                <div class="loading-msg">正在掛上明信片...</div>
            </div>
        </div>
    </main>

    <!-- Section 2: Write Modal -->
    <div id="write-modal" class="modal">
        <div class="modal-content paper-texture">
            <span class="close-modal">&times;</span>
            <h3>寫一張明信片</h3>
            
            <form id="compose-form">
                <div class="form-group">
                    <label>收件人 (To):</label>
                    <select id="recipient-select" required>
                        <option value="" disabled selected>請選擇...</option>
                        <option value="ALL">📢 寄給所有人 (全班)</option>
                        <!-- Users injected via JS -->
                    </select>
                </div>

                <div class="form-group">
                    <label>寄件人 (From):</label>
                    <input type="text" id="sender-name" placeholder="你的名字或暱稱" required maxlength="20">
                </div>

                <div class="form-group">
                    <label>封面圖片:</label>
                    <div class="image-search-box">
                        <input type="text" id="img-keyword" placeholder="輸入關鍵字 (如: sky, cat)...">
                        <button type="button" id="search-img-btn">搜尋圖片</button>
                    </div>
                    <!-- Fallback message area -->
                    <div id="search-status" class="search-status"></div>
                    
                    <div id="img-results" class="img-results">
                        <!-- Image thumbnails go here -->
                    </div>
                    <input type="hidden" id="selected-img-url" required>
                    <input type="hidden" id="selected-img-credit">
                    <input type="hidden" id="selected-img-link">
                </div>

                <div class="form-group">
                    <label>內容 (Message):</label>
                    <textarea id="message-text" rows="4" placeholder="寫下你想說的話..." required></textarea>
                </div>

                <button type="submit" class="send-btn">寄出信件 <i class="fa-solid fa-paper-plane"></i></button>
            </form>
        </div>
    </div>

    <!-- Postcard Zoom/Flip Modal -->
    <div id="card-modal" class="modal card-viewer-modal">
        <!-- Close button outside -->
        <div class="card-modal-backdrop"></div>
        
        <div class="scene">
            <div class="postcard-3d" id="active-card">
                <div class="card-face card-front">
                    <img id="view-cover-img" src="" alt="Cover">
                    <div class="hint-text"><i class="fa-solid fa-rotate"></i> 點擊翻面</div>
                </div>
                <div class="card-face card-back paper-texture">
                    <div class="stamp-mark" id="view-stamp">
                        <div class="stamp-date">OCT 24</div>
                        <div class="stamp-loc">TAIWAN</div>
                    </div>
                    <div class="card-content">
                        <div class="card-header">
                            <span class="label">From:</span> <span id="view-from"></span>
                        </div>
                        <div class="card-body">
                            <p id="view-msg"></p>
                        </div>
                        <div class="card-footer">
                            <div class="credit" id="view-credit">Photo by Unsplash</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer / Admin Trigger -->
    <footer>
        <p>&copy; 2025 Class Memory Board. <span id="admin-trigger" title="Admin">Locked</span></p>
    </footer>

    <!-- Scripts -->
    <!-- SweetAlert2 for nice alerts -->
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <!-- Main Logic -->
    <script type="module" src="script.js"></script>
<script type="module" src="/index.tsx"></script>
</body>
</html>
