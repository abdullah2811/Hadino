const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State
let gameRunning = false;
let gamePaused = false;
let isCountingDown = false;
let countdownValue = 0;
let pausedTime = 0;
let baseGameSpeed = 20; // Base speed in pixels per second
let gameSpeed = 20; // Current speed in pixels per second
let score = 0;
let frameCount = 0;
let username = '';

// Timing variables
let lastTime = 0;
let deltaTime = 0;

// Screen size detection
function getGameSpeedMultiplier() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    const isLaptopScreen = screenWidth >= 1024 && screenHeight >= 600;
    
    if (isLaptopScreen) {
        return 1.8; // Make it 80% faster on laptop screens
    }
    
    return 1.0; // Keep original speed for mobile devices
}

function updateGameSpeed() {
    const multiplier = getGameSpeedMultiplier();
    baseGameSpeed = 300 * multiplier; // 300 pixels per second base
    gameSpeed = baseGameSpeed;
    
    // Update physics based on current game speed
    updatePhysicsConstants();
}

function updatePhysicsConstants() {
    // Calculate speed factor (how much faster than base speed)
    const speedFactor = gameSpeed / 300; // 300 is reference speed (base starting speed)

    // Update gravity: faster speed = stronger gravity for quicker landing
    // Multiplicative model keeps growth smooth
    let newGravity = BASE_GRAVITY * speedFactor * GRAVITY_SPEED_MULTIPLIER;

    // Clamp gravity to avoid impossible scenarios
    const minGravity = BASE_GRAVITY * 0.9;
    const maxGravity = BASE_GRAVITY * 2.5; // upper bound for playability
    GRAVITY = Math.max(minGravity, Math.min(maxGravity, newGravity));

    // Keep jump height constant: H = J^2 / (2G) => J ∝ sqrt(G)
    // Scale jump force with sqrt of gravity ratio
    const jumpScale = Math.sqrt(GRAVITY / BASE_GRAVITY);
    // Clamp jump scaling to sensible bounds
    const clampedJumpScale = Math.max(0.9, Math.min(1.6, jumpScale));
    JUMP_FORCE = BASE_JUMP_FORCE * clampedJumpScale;
}

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
    'assets/music15.mp3',
    'assets/music16.mp3',
    'assets/music17.mp3'
];
const menuTheme = 'assets/main_menu_theme.mp3';

// Physics Constants (per second)
const BASE_GRAVITY = 1200; // Base gravity pixels per second squared
const BASE_JUMP_FORCE = -650; // Base jump force pixels per second
const GROUND_HEIGHT = 50;
const GRAVITY_SPEED_MULTIPLIER = 1.2; // How much speed affects gravity (1.2 = 120% correlation)

// Current physics values (will be updated based on game speed)
let GRAVITY = BASE_GRAVITY;
let JUMP_FORCE = BASE_JUMP_FORCE;

// Game Objects
const dino = {
    x: 0, // Will be set to 40% of canvas width
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

    update(deltaTime) {
        if (keys['Space'] || keys['ArrowUp'] || keys['Click']) {
            this.jump();
        }
        
        // Apply velocity based on delta time
        this.y += this.dy * deltaTime;

        if (this.y + this.height > canvas.height - GROUND_HEIGHT) {
            this.y = canvas.height - GROUND_HEIGHT - this.height;
            this.dy = 0;
            this.grounded = true;
        } else {
            // Apply gravity based on delta time
            this.dy += GRAVITY * deltaTime;
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
    about: document.getElementById('about-overlay'),
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
    menuAboutBtn: document.getElementById('menu-about-btn'),

    leaderboardBackBtn: document.getElementById('leaderboard-back-btn'),
    settingsBackBtn: document.getElementById('settings-back-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    aboutBackBtn: document.getElementById('about-back-btn'),

    musicToggle: document.getElementById('music-toggle'),

    restartBtn: document.getElementById('restart-btn'),
    homeBtn: document.getElementById('home-btn'),
    topScoresList: document.getElementById('top-scores-list'),
    muteBtn: document.getElementById('mute-btn'),
    nextMusicBtn: document.getElementById('next-music-btn'),
    pauseBtn: document.getElementById('pause-btn'),
    pauseOverlay: document.getElementById('pause-overlay'),
    countdownText: document.getElementById('countdown-text'),
    resumeBtn: document.getElementById('resume-btn'),
    pauseHomeBtn: document.getElementById('pause-home-btn')
};

// Audio
const bgMusic = document.getElementById('bg-music');
let currentMusicIndex = 0;
let lastScoreMilestone = 0;
let isLoadingMusic = false;
let currentMusicSrc = '';
let hasUserInteracted = false;
let pendingMusicAction = null;
let isMuted = false;

// Auth State
let isRegisterMode = false;
let currentUser = null;

// Initialization
function init() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    setupUserInteractionDetection();
    setupAuthUI();
    setupMenuUI();

    const savedUserId = localStorage.getItem('ruralRunner_userId');
    if (savedUserId) {
        // Fetch fresh data from Firestore on page load
        loginUser(savedUserId).then(() => {
            showMainMenu();
        }).catch(err => {
            console.error('Auto-login failed:', err);
            localStorage.removeItem('ruralRunner_userId');
            ui.login.classList.remove('hidden');
        });
    }

    const musicEnabled = localStorage.getItem('ruralRunner_music') !== 'false';
    if (ui.musicToggle) ui.musicToggle.checked = musicEnabled;

    if (ui.restartBtn) ui.restartBtn.addEventListener('click', resetGame);
    if (ui.homeBtn) ui.homeBtn.addEventListener('click', showMainMenu);
    if (ui.musicToggle) ui.musicToggle.addEventListener('change', updateMusicState);
    if (ui.muteBtn) ui.muteBtn.addEventListener('click', toggleMute);
    if (ui.nextMusicBtn) ui.nextMusicBtn.addEventListener('click', playNextMusic);
    if (ui.pauseBtn) ui.pauseBtn.addEventListener('click', togglePause);
    if (ui.resumeBtn) ui.resumeBtn.addEventListener('click', resumeGameWithCountdown);
    if (ui.pauseHomeBtn) ui.pauseHomeBtn.addEventListener('click', goToMainMenuFromPause);

    // Fullscreen button for mobile
    const fullscreenBtn = document.getElementById('enter-fullscreen-btn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', enterFullscreen);
    }

    // Auto-enter fullscreen on orientation change to landscape (mobile only)
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
}

function setupUserInteractionDetection() {
    const interactionEvents = ['click', 'touchstart', 'keydown'];
    
    const enableAudio = () => {
        if (!hasUserInteracted) {
            hasUserInteracted = true;
            console.log('User interaction detected - audio enabled');
            
            // Execute any pending music action
            if (pendingMusicAction) {
                pendingMusicAction();
                pendingMusicAction = null;
            }
            
            // Remove listeners after first interaction
            interactionEvents.forEach(event => {
                document.removeEventListener(event, enableAudio);
            });
        }
    };
    
    // Add interaction listeners
    interactionEvents.forEach(event => {
        document.addEventListener(event, enableAudio, { once: true });
    });
}

function setupUserInteractionDetection() {
    const interactionEvents = ['click', 'touchstart', 'keydown'];
    
    const enableAudio = () => {
        if (!hasUserInteracted) {
            hasUserInteracted = true;
            console.log('User interaction detected - audio enabled');
            
            // Execute any pending music action
            if (pendingMusicAction) {
                pendingMusicAction();
                pendingMusicAction = null;
            }
            
            // Remove listeners after first interaction
            interactionEvents.forEach(event => {
                document.removeEventListener(event, enableAudio);
            });
        }
    };
    
    // Add interaction listeners
    interactionEvents.forEach(event => {
        document.addEventListener(event, enableAudio, { once: true });
    });
}

function resizeCanvas() {
    const container = document.getElementById('game-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    // Update dino position to maintain 20% from left when screen resizes
    if (gameRunning || gamePaused) {
        dino.x = canvas.width * 0.2;
        // Adjust y position if needed
        if (dino.grounded) {
            dino.y = canvas.height - GROUND_HEIGHT - dino.height;
        }
    }
    
    // Update game speed when screen size changes
    updateGameSpeed();
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
    if (ui.menuAboutBtn) ui.menuAboutBtn.addEventListener('click', showAbout);

    if (ui.leaderboardBackBtn) ui.leaderboardBackBtn.addEventListener('click', showMainMenu);
    if (ui.settingsBackBtn) ui.settingsBackBtn.addEventListener('click', showMainMenu);
    if (ui.aboutBackBtn) ui.aboutBackBtn.addEventListener('click', showMainMenu);
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

        // Store only user ID for auto-login, highScore always from Firestore
        localStorage.setItem('ruralRunner_userId', currentUser.id);
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
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    };

    await userRef.set(userData);
    currentUser = { id: userId, ...userData };
    console.log("User registered successfully with highScore initialized to 0");
}

async function loginUser(userId) {
    const userRef = db.collection('users').doc(userId);
    const doc = await userRef.get();

    if (!doc.exists) {
        throw new Error("User ID not found. Please register.");
    }

    const userData = doc.data();
    // Ensure highScore exists and is a number
    if (typeof userData.highScore !== 'number') {
        userData.highScore = 0;
        // Update the user document to fix missing highScore
        await userRef.update({ highScore: 0 });
        console.log("Fixed missing highScore for user:", userId);
    }

    // Always use Firestore as single source of truth
    currentUser = { id: userId, ...userData };
    console.log("User logged in:", currentUser.name, "High Score from Firestore:", currentUser.highScore);
}

async function fetchLeaderboard() {
    try {
        ui.topScoresList.innerHTML = '<li>Loading...</li>';
        
        // Add a small delay to ensure database connection is stable
        await new Promise(resolve => setTimeout(resolve, 100));
        
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
            li.innerHTML = `<span>${rank}. ${data.name} <small>(${doc.id})</small></span> <span>${data.highScore || 0}</span>`;
            ui.topScoresList.appendChild(li);
            rank++;
        });

    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        ui.topScoresList.innerHTML = '<li>Error loading scores. <button onclick="fetchLeaderboard()" style="background:none;border:none;color:#4CAF50;cursor:pointer;text-decoration:underline;">Retry</button></li>';
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

function showAbout() {
    hideAllOverlays();
    ui.about.classList.remove('hidden');
}

function hideAllOverlays() {
    ui.login.classList.add('hidden');
    ui.mainMenu.classList.add('hidden');
    ui.leaderboard.classList.add('hidden');
    ui.settings.classList.add('hidden');
    if (ui.about) ui.about.classList.add('hidden');
    ui.gameOver.classList.add('hidden');
    ui.scoreBoard.classList.add('hidden');
    if (ui.muteBtn) ui.muteBtn.classList.add('hidden');
    if (ui.nextMusicBtn) ui.nextMusicBtn.classList.add('hidden');
    if (ui.pauseBtn) ui.pauseBtn.classList.add('hidden');
    if (ui.pauseOverlay) ui.pauseOverlay.classList.add('hidden');
}

function logout() {
    localStorage.removeItem('ruralRunner_userId');
    currentUser = null;
    hideAllOverlays();
    ui.login.classList.remove('hidden');
    stopMusic();
}

function goToMainMenuFromPause() {
    gameRunning = false;
    gamePaused = false;
    isCountingDown = false;
    stopMusic();
    showMainMenu();
}

// Pause System
function togglePause() {
    if (!gameRunning) return;
    
    if (!gamePaused) {
        pauseGame();
    } else {
        resumeGameWithCountdown();
    }
}

function pauseGame() {
    gamePaused = true;
    pausedTime = performance.now();
    ui.pauseOverlay.classList.remove('hidden');
    ui.countdownText.style.display = 'none';
    ui.pauseBtn.textContent = '\u25b6';
    ui.pauseBtn.title = 'Resume Game';
    
    // Pause music
    if (!bgMusic.paused) {
        bgMusic.pause();
    }
}

function resumeGameWithCountdown() {
    if (gamePaused && !isCountingDown) {
        isCountingDown = true;
        countdownValue = 3;
        ui.countdownText.textContent = '3';
        ui.countdownText.style.display = 'block';
        
        const countdownInterval = setInterval(() => {
            countdownValue--;
            
            if (countdownValue > 0) {
                ui.countdownText.textContent = countdownValue.toString();
            } else if (countdownValue === 0) {
                ui.countdownText.textContent = 'GO!';
            } else {
                // Resume game
                clearInterval(countdownInterval);
                ui.pauseOverlay.classList.add('hidden');
                ui.countdownText.style.display = 'none';
                ui.pauseBtn.textContent = '⏸';
                ui.pauseBtn.title = 'Pause Game';
                
                gamePaused = false;
                isCountingDown = false;
                
                // Reset timing to prevent jumps - this is crucial!
                lastTime = 0;
                deltaTime = 0;
                
                // Resume music
                if (ui.musicToggle.checked && bgMusic.paused && !isMuted) {
                    bgMusic.play().catch(e => console.log("Music resume failed:", e));
                }
            }
        }, 1000);
    }
}
function playMenuMusic() {
    if (!ui.musicToggle.checked || isLoadingMusic) return;

    const playAudio = () => {
        if (currentMusicSrc !== menuTheme) {
            isLoadingMusic = true;
            bgMusic.pause();
            bgMusic.src = menuTheme;
            currentMusicSrc = menuTheme;
            bgMusic.loop = true;
            
            bgMusic.addEventListener('canplaythrough', function onCanPlay() {
                bgMusic.removeEventListener('canplaythrough', onCanPlay);
                isLoadingMusic = false;
                if (ui.musicToggle.checked && hasUserInteracted && !isMuted) {
                    bgMusic.play().catch(e => console.log("Menu music play failed:", e));
                }
            }, { once: true });
            
            bgMusic.load();
        } else if (bgMusic.paused && !isLoadingMusic && hasUserInteracted && !isMuted) {
            bgMusic.play().catch(e => console.log("Menu music resume failed:", e));
        }
    };
    
    if (hasUserInteracted) {
        playAudio();
    } else {
        // Store the action to execute after user interaction
        pendingMusicAction = playAudio;
        console.log('Menu music queued - waiting for user interaction');
    }
}

function playGameMusic() {
    if (!ui.musicToggle.checked || isLoadingMusic) {
        console.log("Music is disabled in settings");
        return;
    }

    const randomTrack = musicTracks[Math.floor(Math.random() * musicTracks.length)];
    
    if (currentMusicSrc === randomTrack && !bgMusic.paused) {
        return; // Already playing this track
    }
    
    const playAudio = () => {
        isLoadingMusic = true;
        console.log("Playing game music:", randomTrack);
        bgMusic.pause();
        bgMusic.src = randomTrack;
        currentMusicSrc = randomTrack;
        bgMusic.loop = true;
        
        bgMusic.addEventListener('canplaythrough', function onCanPlay() {
            bgMusic.removeEventListener('canplaythrough', onCanPlay);
            isLoadingMusic = false;
            if (ui.musicToggle.checked && gameRunning && !gamePaused && hasUserInteracted && !isMuted) {
                bgMusic.play().catch(e => console.log("Game music play failed:", e));
            }
        }, { once: true });
        
        bgMusic.load();
    };
    
    if (hasUserInteracted) {
        playAudio();
    } else {
        // Store the action to execute after user interaction
        pendingMusicAction = playAudio;
        console.log('Game music queued - waiting for user interaction');
    }
}

function changeGameMusic(scoreBasedIndex) {
    if (!ui.musicToggle.checked || isLoadingMusic || !hasUserInteracted) {
        console.log("Music is disabled in settings or no user interaction");
        return;
    }

    // Use random selection instead of score-based index for variety
    const randomTrackIndex = Math.floor(Math.random() * musicTracks.length);
    const selectedTrack = musicTracks[randomTrackIndex];
    
    // Don't change to the same track
    if (currentMusicSrc === selectedTrack) {
        return;
    }
    
    isLoadingMusic = true;
    console.log(`Changing music at score ${Math.floor(score)} to random track ${randomTrackIndex + 1}: ${selectedTrack}`);
    
    bgMusic.pause();
    bgMusic.src = selectedTrack;
    currentMusicSrc = selectedTrack;
    bgMusic.loop = true;
    
    bgMusic.addEventListener('canplaythrough', function onCanPlay() {
        bgMusic.removeEventListener('canplaythrough', onCanPlay);
        isLoadingMusic = false;
        if (ui.musicToggle.checked && gameRunning && !gamePaused && hasUserInteracted && !isMuted) {
            bgMusic.play().catch(e => console.log("Music change failed:", e));
        }
    }, { once: true });
    
    bgMusic.load();
}

function stopMusic() {
    isLoadingMusic = false;
    bgMusic.pause();
    bgMusic.currentTime = 0;
}

function toggleMute() {
    isMuted = !isMuted;
    
    if (isMuted) {
        bgMusic.pause();
        ui.muteBtn.textContent = '🔇';
        ui.muteBtn.title = 'Unmute Music';
        console.log('Music muted');
    } else {
        // Resume music if game is running and not paused
        if (gameRunning && !gamePaused && hasUserInteracted) {
            bgMusic.play().catch(e => console.log('Music resume failed:', e));
        }
        ui.muteBtn.textContent = '🔊';
        ui.muteBtn.title = 'Mute Music';
        console.log('Music unmuted');
    }
}

function playNextMusic() {
    if (!hasUserInteracted) {
        console.log('Cannot change music - no user interaction yet');
        return;
    }
    
    // Get a random track different from current
    let randomTrack;
    do {
        randomTrack = musicTracks[Math.floor(Math.random() * musicTracks.length)];
    } while (randomTrack === currentMusicSrc && musicTracks.length > 1);
    
    isLoadingMusic = true;
    console.log('Manually switching to:', randomTrack);
    
    bgMusic.pause();
    bgMusic.src = randomTrack;
    currentMusicSrc = randomTrack;
    bgMusic.loop = true;
    
    bgMusic.addEventListener('canplaythrough', function onCanPlay() {
        bgMusic.removeEventListener('canplaythrough', onCanPlay);
        isLoadingMusic = false;
        // Play only if not muted and game is running
        if (!isMuted && gameRunning && hasUserInteracted) {
            bgMusic.play().catch(e => console.log('Next music play failed:', e));
        }
    }, { once: true });
    
    bgMusic.load();
}

function updateMusicState() {
    const enabled = ui.musicToggle.checked;
    localStorage.setItem('ruralRunner_music', enabled);

    if (enabled) {
        if (!gameRunning && !ui.mainMenu.classList.contains('hidden')) {
            playMenuMusic();
        } else if (gameRunning && !isLoadingMusic && hasUserInteracted) {
            if (bgMusic.paused) bgMusic.play().catch(e => console.log("Music resume failed:", e));
        }
    } else {
        bgMusic.pause();
        isLoadingMusic = false;
        pendingMusicAction = null;
    }
}

function startGame() {
    hideAllOverlays();
    ui.scoreBoard.classList.remove('hidden');
    ui.muteBtn.classList.remove('hidden');
    ui.nextMusicBtn.classList.remove('hidden');
    ui.pauseBtn.classList.remove('hidden');

    playGameMusic();

    resetGame();
}

function resetGame() {
    gameRunning = true;
    gamePaused = false;
    isCountingDown = false;
    score = 0;
    updateGameSpeed(); // Set appropriate speed based on screen size
    obstacles = [];
    frameCount = 0;
    currentMusicIndex = 0;
    lastScoreMilestone = 0;
    lastTime = 0;
    deltaTime = 0;

    // Position dino at 20% of screen width from left
    dino.x = canvas.width * 0.2;
    dino.y = canvas.height - GROUND_HEIGHT - dino.height;
    dino.dy = 0;

    ui.gameOver.classList.add('hidden');
    ui.scoreBoard.classList.remove('hidden');
    ui.muteBtn.classList.remove('hidden');
    ui.nextMusicBtn.classList.remove('hidden');
    ui.pauseBtn.classList.remove('hidden');
    ui.pauseBtn.textContent = '⏸';
    ui.pauseBtn.title = 'Pause Game';
    
    // Update mute button state
    ui.muteBtn.textContent = isMuted ? '🔇' : '🔊';
    ui.muteBtn.title = isMuted ? 'Unmute Music' : 'Mute Music';

    if (currentUser) {
        ui.highScore.textContent = currentUser.highScore;
    } else {
        ui.highScore.textContent = '0';
    }

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

function update(deltaTime) {
    if (!gameRunning) return;

    frameCount++;
    // Score increases at 10 points per second
    score += 10 * deltaTime;
    // Speed increases at 6 pixels/sec per second
    gameSpeed += 7 * deltaTime;
    
    // Update physics constants based on new speed
    updatePhysicsConstants();
    
    ui.currentScore.textContent = Math.floor(score);

    // Update displayed high score in real-time if current score exceeds it
    if (currentUser && Math.floor(score) > currentUser.highScore) {
        ui.highScore.textContent = Math.floor(score);
    }

    // Check for music change every 400 points (reduced frequency)
    const currentScoreMilestone = Math.floor(score / 400);
    if (currentScoreMilestone > lastScoreMilestone && currentScoreMilestone > 0 && !isLoadingMusic) {
        lastScoreMilestone = currentScoreMilestone;
        changeGameMusic(currentScoreMilestone);
    }

    dino.update(deltaTime);

    // Background scrolling speed (50% of game speed)
    bgOffset -= gameSpeed * 0.5 * deltaTime;
    if (bgOffset <= -canvas.width) bgOffset = 0;

    // Dynamic obstacle spacing based on current speed and air time
    // Ensure the player has enough runway or airtime to react
    const flightTimeUp = Math.abs(JUMP_FORCE) / GRAVITY; // time to peak
    const totalAirTime = flightTimeUp * 2; // symmetric approximation
    // Base reaction window in seconds, slightly reduces as speed grows
    const speedFactor = gameSpeed / 300;
    const reactionWindow = Math.max(1.2, 1.8 - 0.4 * (speedFactor - 1));
    // Ensure min gap considers both runway and airtime
    let minGap = gameSpeed * Math.max(reactionWindow, totalAirTime * 0.8);
    let maxGap = minGap + 500; // Plus 500 pixels for variety

    if (obstacles.length === 0) {
        spawnObstacle();
    } else {
        const lastObstacle = obstacles[obstacles.length - 1];
        const gap = canvas.width - lastObstacle.x;

        if (gap > minGap) {
            // Time-based spawn probability (2% chance per second)
            if (Math.random() < 0.02 * deltaTime * 60 || gap > maxGap) {
                spawnObstacle();
            }
        }
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.x -= gameSpeed * deltaTime;

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

function gameLoop(currentTime) {
    if (!gameRunning) return;
    
    // If game is paused or counting down, just continue the loop without updating
    if (gamePaused || isCountingDown) {
        requestAnimationFrame(gameLoop);
        return;
    }
    
    // Calculate delta time in seconds
    if (lastTime === 0) {
        lastTime = currentTime;
    }
    deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;
    
    // Cap deltaTime to prevent large jumps (e.g., when tab becomes inactive)
    deltaTime = Math.min(deltaTime, 1/30); // Max 30 FPS equivalent
    
    update(deltaTime);
    draw();
    requestAnimationFrame(gameLoop);
}

async function gameOver() {
    gameRunning = false;
    gamePaused = false;
    isCountingDown = false;
    stopMusic();

    const finalScore = Math.floor(score);

    ui.finalScore.textContent = finalScore;
    ui.gameOver.classList.remove('hidden');
    ui.scoreBoard.classList.add('hidden');
    ui.muteBtn.classList.add('hidden');
    ui.nextMusicBtn.classList.add('hidden');
    ui.pauseBtn.classList.add('hidden');

    if (currentUser && finalScore > currentUser.highScore) {
        currentUser.highScore = finalScore;
        
        // Update only Firestore (single source of truth)
        try {
            await db.collection('users').doc(currentUser.id).update({
                highScore: finalScore,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log("New high score saved to Firestore:", finalScore);
        } catch (error) {
            console.error("Error saving score to Firestore:", error);
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
