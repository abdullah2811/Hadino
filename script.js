const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State
let gameRunning = false;
let gameSpeed = 6;
let score = 0;
let frameCount = 0;
let username = '';

// Assets
const assets = {
    character: new Image(),
    background: new Image(),
    obstacle: new Image()
};
assets.character.src = 'assets/character_sprite.png';
assets.background.src = 'assets/game_background.png';
assets.obstacle.src = 'assets/obstacle_doll.png';

// Music Tracks
const musicTracks = [
    'assets/music1.mp3',
    'assets/music2.mp3',
    'assets/music3.mp3',
    'assets/music4.mp3',
    'assets/music5.mp3',
    'assets/music6.mp3',
    'assets/music7.mp3',
    'assets/music8.mp3',
    'assets/music9.mp3',
    'assets/music10.mp3',
    'assets/music11.mp3',
    'assets/music12.mp3',
    'assets/music13.mp3',
    'assets/music14.mp3',
    'assets/music15.mp3'
];
const menuTheme = 'assets/main_menu_theme.mp3';

// Physics Constants
const GRAVITY = 0.8;
const JUMP_FORCE = -17;
const GROUND_HEIGHT = 50;

// Game Objects
const dino = {
    x: 50,
    y: 0,
    width: 120,
    height: 150,
    dy: 0,
    jumpTimer: 0,
    grounded: false,

    draw() {
        if (assets.character.complete && assets.character.naturalWidth !== 0) {
            ctx.drawImage(assets.character, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = '#FF5722';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    },

    update() {
        if (keys['Space'] || keys['ArrowUp'] || keys['Click']) {
            this.jump();
        }
        this.y += this.dy;

        if (this.y + this.height > canvas.height - GROUND_HEIGHT) {
            this.y = canvas.height - GROUND_HEIGHT - this.height;
            this.dy = 0;
            this.grounded = true;
        } else {
            this.dy += GRAVITY;
            this.grounded = false;
        }
    },

    jump() {
        if (this.grounded) {
            this.dy = JUMP_FORCE;
            this.grounded = false;
        }
    }
};

let obstacles = [];
let bgOffset = 0;

// Input Handling
const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

canvas.addEventListener('mousedown', () => keys['Click'] = true);
canvas.addEventListener('mouseup', () => keys['Click'] = false);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    keys['Click'] = true;
}, { passive: false });
canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    keys['Click'] = false;
}, { passive: false });

// UI Elements
const ui = {
    login: document.getElementById('login-overlay'),
    mainMenu: document.getElementById('main-menu-overlay'),
    leaderboard: document.getElementById('leaderboard-overlay'),
    settings: document.getElementById('settings-overlay'),
    gameOver: document.getElementById('game-over-overlay'),

    scoreBoard: document.getElementById('score-board'),
    currentScore: document.getElementById('current-score'),
    highScore: document.getElementById('high-score'),
    finalScore: document.getElementById('final-score'),

    tabLogin: document.getElementById('tab-login'),
    tabRegister: document.getElementById('tab-register'),
    userIdInput: document.getElementById('userid-input'),
    usernameInput: document.getElementById('username-input'),
    authActionBtn: document.getElementById('auth-action-btn'),
    authMessage: document.getElementById('auth-message'),

    menuUsername: document.getElementById('menu-username'),
    menuPlayBtn: document.getElementById('menu-play-btn'),
    menuLeaderboardBtn: document.getElementById('menu-leaderboard-btn'),
    menuSettingsBtn: document.getElementById('menu-settings-btn'),

    leaderboardBackBtn: document.getElementById('leaderboard-back-btn'),
    settingsBackBtn: document.getElementById('settings-back-btn'),
    logoutBtn: document.getElementById('logout-btn'),

    musicToggle: document.getElementById('music-toggle'),

    restartBtn: document.getElementById('restart-btn'),
    homeBtn: document.getElementById('home-btn'),
    topScoresList: document.getElementById('top-scores-list')
};

// Audio
const bgMusic = document.getElementById('bg-music');

// Auth State
let isRegisterMode = false;
let currentUser = null;

// Initialization
function init() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    setupAuthUI();
    setupMenuUI();

    const savedUser = localStorage.getItem('ruralRunner_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainMenu();
    }

    const musicEnabled = localStorage.getItem('ruralRunner_music') !== 'false';
    if (ui.musicToggle) ui.musicToggle.checked = musicEnabled;

    if (ui.restartBtn) ui.restartBtn.addEventListener('click', resetGame);
    if (ui.homeBtn) ui.homeBtn.addEventListener('click', showMainMenu);
    if (ui.musicToggle) ui.musicToggle.addEventListener('change', updateMusicState);

    // Fullscreen button for mobile
    const fullscreenBtn = document.getElementById('enter-fullscreen-btn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', enterFullscreen);
    }

    // Auto-enter fullscreen on orientation change to landscape (mobile only)
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
}

function resizeCanvas() {
    const container = document.getElementById('game-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

function setupAuthUI() {
    if (ui.tabLogin) ui.tabLogin.addEventListener('click', () => switchAuthMode(false));
    if (ui.tabRegister) ui.tabRegister.addEventListener('click', () => switchAuthMode(true));
    if (ui.authActionBtn) ui.authActionBtn.addEventListener('click', handleAuthAction);
}

function setupMenuUI() {
    if (ui.menuPlayBtn) ui.menuPlayBtn.addEventListener('click', startGame);
    if (ui.menuLeaderboardBtn) ui.menuLeaderboardBtn.addEventListener('click', showLeaderboard);
    if (ui.menuSettingsBtn) ui.menuSettingsBtn.addEventListener('click', showSettings);

    if (ui.leaderboardBackBtn) ui.leaderboardBackBtn.addEventListener('click', showMainMenu);
    if (ui.settingsBackBtn) ui.settingsBackBtn.addEventListener('click', showMainMenu);
    if (ui.logoutBtn) ui.logoutBtn.addEventListener('click', logout);
}

function switchAuthMode(register) {
    isRegisterMode = register;

    if (register) {
        ui.tabRegister.classList.add('active');
        ui.tabLogin.classList.remove('active');
        ui.usernameInput.classList.remove('hidden');
        ui.authActionBtn.textContent = "Register & Play";
    } else {
        ui.tabLogin.classList.add('active');
        ui.tabRegister.classList.remove('active');
        ui.usernameInput.classList.add('hidden');
        ui.authActionBtn.textContent = "Login & Play";
    }
    ui.authMessage.textContent = "";
}

async function handleAuthAction() {
    const userId = ui.userIdInput.value.trim();
    const name = ui.usernameInput.value.trim();

    if (!userId) {
        ui.authMessage.textContent = "User ID is required.";
        ui.authMessage.style.color = "red";
        return;
    }

    ui.authActionBtn.disabled = true;
    ui.authActionBtn.textContent = "Processing...";

    try {
        if (isRegisterMode) {
            if (!name) throw new Error("Name is required for registration.");
            await registerUser(userId, name);
        } else {
            await loginUser(userId);
        }

        localStorage.setItem('ruralRunner_user', JSON.stringify(currentUser));
        showMainMenu();

    } catch (error) {
        ui.authMessage.textContent = error.message;
        ui.authMessage.style.color = "red";
        ui.authActionBtn.disabled = false;
        ui.authActionBtn.textContent = isRegisterMode ? "Register & Play" : "Login & Play";
    }
}

async function registerUser(userId, name) {
    const userRef = db.collection('users').doc(userId);
    const doc = await userRef.get();

    if (doc.exists) {
        throw new Error("User ID already exists. Please login.");
    }

    const usernameQuery = await db.collection('users').where('name', '==', name).get();
    if (!usernameQuery.empty) {
        throw new Error("Display Name is already taken. Please choose another.");
    }

    const userData = {
        name: name,
        highScore: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    await userRef.set(userData);
    currentUser = { id: userId, ...userData };
}

async function loginUser(userId) {
    const userRef = db.collection('users').doc(userId);
    const doc = await userRef.get();

    if (!doc.exists) {
        throw new Error("User ID not found. Please register.");
    }

    currentUser = { id: userId, ...doc.data() };
}

async function fetchLeaderboard() {
    try {
        ui.topScoresList.innerHTML = '<li>Loading...</li>';
        const snapshot = await db.collection('users')
            .orderBy('highScore', 'desc')
            .limit(50)
            .get();

        ui.topScoresList.innerHTML = '';

        if (snapshot.empty) {
            ui.topScoresList.innerHTML = '<li>No scores yet!</li>';
            return;
        }

        let rank = 1;
        snapshot.forEach(doc => {
            const data = doc.data();
            const li = document.createElement('li');
            li.innerHTML = `<span>${rank}. ${data.name} <small>(${doc.id})</small></span> <span>${data.highScore}</span>`;
            ui.topScoresList.appendChild(li);
            rank++;
        });

    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        ui.topScoresList.innerHTML = '<li>Error loading scores.</li>';
    }
}

function showMainMenu() {
    gameRunning = false;
    if (currentUser) ui.menuUsername.textContent = currentUser.name;

    hideAllOverlays();
    ui.mainMenu.classList.remove('hidden');

    ui.authActionBtn.disabled = false;
    ui.authActionBtn.textContent = isRegisterMode ? "Register & Play" : "Login & Play";

    playMenuMusic();
}

function showLeaderboard() {
    hideAllOverlays();
    ui.leaderboard.classList.remove('hidden');
    fetchLeaderboard();
}

function showSettings() {
    hideAllOverlays();
    ui.settings.classList.remove('hidden');
}

function hideAllOverlays() {
    ui.login.classList.add('hidden');
    ui.mainMenu.classList.add('hidden');
    ui.leaderboard.classList.add('hidden');
    ui.settings.classList.add('hidden');
    ui.gameOver.classList.add('hidden');
    ui.scoreBoard.classList.add('hidden');
}

function logout() {
    localStorage.removeItem('ruralRunner_user');
    currentUser = null;
    hideAllOverlays();
    ui.login.classList.remove('hidden');
    stopMusic();
}

// Music Logic
function playMenuMusic() {
    if (!ui.musicToggle.checked) return;

    if (!bgMusic.src.includes('main_menu_theme.mp3')) {
        bgMusic.src = menuTheme;
        bgMusic.loop = true;
        bgMusic.play().catch(e => console.log("Menu music play failed:", e));
    } else if (bgMusic.paused) {
        bgMusic.play().catch(e => console.log("Menu music resume failed:", e));
    }
}

function playGameMusic() {
    if (!ui.musicToggle.checked) {
        console.log("Music is disabled in settings");
        return;
    }

    const randomTrack = musicTracks[Math.floor(Math.random() * musicTracks.length)];
    console.log("Playing game music:", randomTrack);
    bgMusic.src = randomTrack;
    bgMusic.loop = true;
    bgMusic.play().catch(e => console.log("Game music play failed:", e));
}

function stopMusic() {
    bgMusic.pause();
    bgMusic.currentTime = 0;
}

function updateMusicState() {
    const enabled = ui.musicToggle.checked;
    localStorage.setItem('ruralRunner_music', enabled);

    if (enabled) {
        if (!gameRunning && !ui.mainMenu.classList.contains('hidden')) {
            playMenuMusic();
        } else if (gameRunning) {
            if (bgMusic.paused) bgMusic.play();
        }
    } else {
        bgMusic.pause();
    }
}

function startGame() {
    hideAllOverlays();
    ui.scoreBoard.classList.remove('hidden');

    playGameMusic();

    resetGame();
}

function resetGame() {
    gameRunning = true;
    score = 0;
    gameSpeed = 8;
    obstacles = [];
    frameCount = 0;

    dino.y = canvas.height - GROUND_HEIGHT - dino.height;
    dino.dy = 0;

    ui.gameOver.classList.add('hidden');
    ui.scoreBoard.classList.remove('hidden');

    if (currentUser) ui.highScore.textContent = currentUser.highScore;

    playGameMusic();

    requestAnimationFrame(gameLoop);
}

function spawnObstacle() {
    const size = 100;
    const obstacle = {
        x: canvas.width,
        y: canvas.height - GROUND_HEIGHT - size,
        width: 30,
        height: size,
        draw() {
            if (assets.obstacle.complete && assets.obstacle.naturalWidth !== 0) {
                ctx.drawImage(assets.obstacle, this.x - 10, this.y, 120, 120);
            } else {
                ctx.fillStyle = '#880E4F';
                ctx.fillRect(this.x, this.y, this.width, this.height);
            }
        }
    };
    obstacles.push(obstacle);
}

function update() {
    if (!gameRunning) return;

    frameCount++;
    score += 0.1;
    gameSpeed += 0.001;

    ui.currentScore.textContent = Math.floor(score);

    dino.update();

    bgOffset -= gameSpeed * 0.5;
    if (bgOffset <= -canvas.width) bgOffset = 0;

    let minGap = gameSpeed * 60;
    let maxGap = minGap + 500;

    if (obstacles.length === 0) {
        spawnObstacle();
    } else {
        const lastObstacle = obstacles[obstacles.length - 1];
        const gap = canvas.width - lastObstacle.x;

        if (gap > minGap) {
            if (Math.random() < 0.02 || gap > maxGap) {
                spawnObstacle();
            }
        }
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.x -= gameSpeed;

        if (
            dino.x < obs.x + obs.width &&
            dino.x + dino.width > obs.x &&
            dino.y < obs.y + obs.height &&
            dino.y + dino.height > obs.y
        ) {
            gameOver();
        }

        if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (assets.background.complete && assets.background.naturalWidth !== 0) {
        ctx.drawImage(assets.background, bgOffset, 0, canvas.width, canvas.height);
        ctx.drawImage(assets.background, bgOffset + canvas.width, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#81C784';
        ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);
        ctx.fillStyle = '#E0F7FA';
        ctx.fillRect(0, 0, canvas.width, canvas.height - GROUND_HEIGHT);
    }

    obstacles.forEach(obs => obs.draw());
    dino.draw();
}

function gameLoop() {
    if (!gameRunning) return;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

async function gameOver() {
    gameRunning = false;
    stopMusic();

    const finalScore = Math.floor(score);

    ui.finalScore.textContent = finalScore;
    ui.gameOver.classList.remove('hidden');
    ui.scoreBoard.classList.add('hidden');

    if (currentUser && finalScore > currentUser.highScore) {
        currentUser.highScore = finalScore;
        try {
            await db.collection('users').doc(currentUser.id).update({
                highScore: finalScore
            });
            console.log("New high score saved!");
        } catch (error) {
            console.error("Error saving score:", error);
        }
    }
}

// Fullscreen Management
function enterFullscreen() {
    const elem = document.documentElement;

    if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => {
            console.log("Fullscreen request failed:", err);
        });
    } else if (elem.webkitRequestFullscreen) { // Safari
        elem.webkitRequestFullscreen();
    } else if (elem.mozRequestFullScreen) { // Firefox
        elem.mozRequestFullScreen();
    } else if (elem.msRequestFullscreen) { // IE/Edge
        elem.msRequestFullscreen();
    }
}

function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
}

function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function isLandscape() {
    return window.innerWidth > window.innerHeight;
}

function handleOrientationChange() {
    // Auto-enter fullscreen on mobile when in landscape
    if (isMobileDevice() && isLandscape() && !document.fullscreenElement && !document.webkitFullscreenElement) {
        // Small delay to ensure orientation change is complete
        setTimeout(() => {
            if (isLandscape()) {
                enterFullscreen();
            }
        }, 300);
    }
}

init();
