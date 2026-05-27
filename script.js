const playBtn = document.getElementById('play-btn');
const siteMenu = document.getElementById('site-menu');
const gameContainer = document.getElementById('game-container');
const closeGameBtn = document.getElementById('close-game-btn');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ОБ'ЄКТИ ОНЛАЙН ЗОБРАЖЕНЬ
const images = {
    apple: new Image(),
    platform: new Image(),
    starter_platform: new Image(),
    player_right: new Image(),
    player_left: new Image(),
    player_jump_right: new Image(),
    player_jump_left: new Image(),
    play_btn_ui: new Image(),
    restart_btn_ui: new Image(),
    resume_btn_ui: new Image(),
    main_menu_btn_ui: new Image()
};

// Завантаження твоїх URL
images.apple.src = 'apple.png';
images.platform.src = 'platform.png';
images.starter_platform.src = 'starter_platform.png';
images.player_right.src = 'parkour.png';
images.player_left.src = 'parkour_left.png';
images.player_jump_right.src = 'parkour_jump.png';
images.player_jump_left.src = 'parkour_jump_left.png';
images.play_btn_ui.src = 'play_button.png';
images.restart_btn_ui.src = 'restart_button.png';
images.resume_btn_ui.src = 'resume_button.png';
images.main_menu_btn_ui.src = 'main_menu_button.png';

// Стан гри: MENU, PLAYING, PAUSED, GAME_OVER
let gameState = "MENU"; 
let score = 0;
let player = { x: 200, y: 500, vy: 0, width: 45, height: 45, facingLeft: false };
let platforms = [];
let platformCount = 0;
let nextAppleAt = 30;
let movingCycle = 0;
let appleBoostTimer = 0;

const baseGravity = 0.4;
const baseJump = -11.5;
const baseAppleSpeed = -8.5;
const basePlatSpeed = 3.0;

// Координати іконки Паузи вгорі екрана (X: 350, Y: 10, Ш.: 40, В.: 40)
const pauseBtnArea = { x: 350, y: 10, width: 40, height: 40 };

// --- КЕРУВАННЯ МИШКОЮ ---

// ---УНІВЕРСАЛЬНІ ФУНКЦІЇ КЕРУВАННЯ (ПК + ТЕЛЕФОН) ---

// 1. Рух персонажа за координатою X
function movePlayer(targetX) {
    if (targetX < player.x) {
        player.facingLeft = true;
    } else if (targetX > player.x) {
        player.facingLeft = false;
    }
    player.x = targetX;
}

// 2. Обробка кліків/тапів по кнопках меню, паузи та рестарту
function handleActionClick(clickX, clickY) {
    if (gameState === "MENU") {
        if (clickX >= 100 && clickX <= 300 && clickY >= 260 && clickY <= 340) {
            startGame();
        }
    } 
    else if (gameState === "PLAYING") {
        if (clickX >= pauseBtnArea.x && clickX <= pauseBtnArea.x + pauseBtnArea.width &&
            clickY >= pauseBtnArea.y && clickY <= pauseBtnArea.y + pauseBtnArea.height) {
            gameState = "PAUSED";
        }
    } 
    else if (gameState === "PAUSED") {
        if (clickX >= 100 && clickX <= 300 && clickY >= 220 && clickY <= 290) {
            gameState = "PLAYING";
        }
        else if (clickX >= 100 && clickX <= 300 && clickY >= 320 && clickY <= 390) {
            gameState = "MENU";
        }
    } 
    else if (gameState === "GAME_OVER") {
        if (clickX >= 100 && clickX <= 300 && clickY >= 310 && clickY <= 390) {
            startGame();
        }
    }
}

// --- КЕРУВАННЯ ДЛЯ КОМП'ЮТЕРІВ (МИШКА) ---

canvas.addEventListener('mousemove', (e) => {
    if (gameState === "PLAYING") {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        movePlayer(mouseX);
    }
});

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    handleActionClick(clickX, clickY);
});


// --- КЕРУВАННЯ ДЛЯ ТЕЛЕФОНІВ (СЕНСОР / ТАЧ) ---

// Рух пальцем по екрану
canvas.addEventListener('touchmove', (e) => {
    if (gameState === "PLAYING") {
        // КРИТИЧНО: Запобігає смиканню та прокручуванню сайту на телефоні під час гри
        e.preventDefault(); 
        
        const rect = canvas.getBoundingClientRect();
        // Беремо координату першого дотику пальця e.touches[0]
        const touchX = e.touches[0].clientX - rect.left;
        movePlayer(touchX);
    }
}, { passive: false }); // Прапорець passive: false дозволяє блокувати стандартний скрол браузера

// Коротке натискання пальцем (тап)
canvas.addEventListener('touchstart', (e) => {
    const rect = canvas.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    const touchY = e.touches[0].clientY - rect.top;
    handleActionClick(touchX, touchY);
});
// --- ЦИКЛ ТА ЛОГІКА ГРИ ---

function startGame() {
    gameState = "PLAYING";
    score = 0;
    player.x = 200;
    player.y = 400;
    player.vy = 0;
    appleBoostTimer = 0;
    platforms = [];
    platformCount = 0;
    movingCycle = 0;
    nextAppleAt = Math.floor(Math.random() * 6) + 30;
    
    // Стартова платформа
    platforms.push({ x: 100, y: 550, w: 200, h: 20, isStarter: true, hasApple: false, isMoving: false, dir: 1, visited: true });

    let y = 400;
    while (y > -100) {
        generatePlatform(y);
        y -= (Math.random() * 60 + 70);
    }
}

function generatePlatform(y) {
    platformCount++;
    let hasApple = false;
    
    if (platformCount >= nextAppleAt) {
        hasApple = true;
        platformCount = 0;
        nextAppleAt = Math.floor(Math.random() * 6) + 30;
    }

    let isMoving = false;
    if (score >= 3000) {
        isMoving = true;
    } else if (score >= 1600) {
        movingCycle = (movingCycle + 1) % 8;
        isMoving = movingCycle < 4;
    } else if (score >= 600) {
        movingCycle = (movingCycle + 1) % 15;
        isMoving = movingCycle < 5;
    } else if (score >= 200) {
        movingCycle = (movingCycle + 1) % 10;
        isMoving = movingCycle < 2;
    }

    let dir = Math.random() > 0.5 ? 1 : -1;
    platforms.push({ x: Math.random() * 300, y: y, w: 100, h: 20, isStarter: false, hasApple: hasApple, isMoving: isMoving, dir: dir, visited: false });
}

function update() {
    // Гра прораховується ТІЛЬКИ у стані PLAYING
    if (gameState === "PLAYING") {
        let speedLevel = Math.min(Math.floor(score / 100), 12);
        let currentGrav = baseGravity + (speedLevel * 0.04);
        let currentJump = baseJump - (speedLevel * 0.4);
        let currentAppleBoost = baseAppleSpeed - (speedLevel * 0.4);
        
        let currentPlatSpeed = basePlatSpeed + (speedLevel * 0.3);
        if (score >= 3000) {
            currentPlatSpeed = (basePlatSpeed + 12 * 0.3) * 1.5;
        }

        platforms.forEach(p => {
            if (p.isMoving) {
                p.x += p.dir * currentPlatSpeed;
                if (p.x <= 0) { p.x = 0; p.dir = 1; }
                else if (p.x + p.w >= 400) { p.x = 400 - p.w; p.dir = -1; }
            }
        });

        if (player.x > 400) player.x = 0;
        else if (player.x < 0) player.x = 400;

        let prevBottom = player.y + player.height / 2;

        if (appleBoostTimer > 0) {
            appleBoostTimer--;
            player.vy = currentAppleBoost;
        } else {
            player.vy += currentGrav;
        }
        
        player.y += player.vy;
        let currentBottom = player.y + player.height / 2;

        // Яблука
        platforms.forEach(p => {
            if (p.hasApple) {
                let ax = p.x + p.w / 2;
                let ay = p.y - 20;
                if (Math.abs(player.x - ax) < 30 && Math.abs(player.y - ay) < 30) {
                    p.hasApple = false;
                    score += 50;
                    appleBoostTimer = 100;
                }
            }
        });

        // Платформи
        if (player.vy > 0) {
            platforms.forEach(p => {
                if (prevBottom <= p.y + 10 && currentBottom >= p.y) {
                    if (player.x > p.x - 10 && player.x < p.x + p.w + 10) {
                        player.vy = currentJump;
                        if (!p.visited) {
                            score += 10;
                            p.visited = true;
                        }
                    }
                }
            });
        }

        // Камера
        if (player.y < 300) {
            let diff = 300 - player.y;
            player.y = 300;
            platforms.forEach(p => p.y += diff);
            platforms = platforms.filter(p => p.y < 650);

            while (platforms.length < 10) {
                let highestY = Math.min(...platforms.map(p => p.y));
                generatePlatform(highestY - (Math.random() * 60 + 70));
            }
        }

        if (player.y > 650) {
            gameState = "GAME_OVER";
        }
    }
}

// --- СИСТЕМА ВІДМАЛЬОВКИ ГРАФІКИ ---

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 1. Малювання платформ та яблук (Малюється під час гри, паузи чи програшу)
    platforms.forEach(p => {
        if (p.isStarter && images.starter_platform.complete) {
            ctx.drawImage(images.starter_platform, p.x, p.y, p.w, p.h);
        } else if (!p.isStarter && images.platform.complete) {
            ctx.drawImage(images.platform, p.x, p.y, p.w, p.h);
        } else {
            ctx.fillStyle = p.isStarter ? "#FF69B4" : "#4CAF50";
            ctx.fillRect(p.x, p.y, p.w, p.h);
        }

        if (p.hasApple) {
            if (images.apple.complete) {
                ctx.drawImage(images.apple, p.x + p.w / 2 - 15, p.y - 30, 30, 30);
            } else {
                ctx.fillStyle = "red";
                ctx.beginPath();
                ctx.arc(p.x + p.w / 2, p.y - 15, 10, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    });

    // 2. Персонаж та інтерфейс
    if (gameState === "PLAYING" || gameState === "PAUSED" || gameState === "GAME_OVER") {
        let currentSprite = images.player_right;
        let isJumping = player.vy < 0;

        if (player.facingLeft) {
            currentSprite = isJumping ? images.player_jump_left : images.player_left;
        } else {
            currentSprite = isJumping ? images.player_jump_right : images.player_right;
        }

        if (currentSprite.complete) {
            ctx.drawImage(currentSprite, player.x - (player.width / 2), player.y - (player.height / 2), player.width, player.height);
        } else {
            ctx.fillStyle = "blue";
            ctx.fillRect(player.x - 15, player.y - 20, 30, 40);
        }
        
        // Малюємо рахунок
        ctx.fillStyle = "black";
        ctx.font = "bold 20px 'Silkscreen', monospace";
        ctx.fillText("Score: " + score, 10, 30);

        // Малюємо кнопку Паузи (вгорі праворуч) під час активної гри
        if (gameState === "PLAYING") {
            ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
            ctx.strokeStyle = "black";
            ctx.lineWidth = 3;
            ctx.fillRect(pauseBtnArea.x, pauseBtnArea.y, pauseBtnArea.width, pauseBtnArea.height);
            ctx.strokeRect(pauseBtnArea.x, pauseBtnArea.y, pauseBtnArea.width, pauseBtnArea.height);
            
            ctx.fillStyle = "black";
            ctx.font = "bold 22px 'Silkscreen', monospace";
            ctx.textAlign = "center";
            ctx.fillText("||", pauseBtnArea.x + 20, pauseBtnArea.y + 28);
            ctx.textAlign = "left";
        }
    }

    // 3. Екран Головного Меню
    if (gameState === "MENU") {
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fillRect(0,0, 400, 600);
        
        if (images.play_btn_ui.complete) {
            ctx.drawImage(images.play_btn_ui, 100, 260, 200, 80);
        } else {
            ctx.fillStyle = "white";
            ctx.font = "30px 'Silkscreen', monospace";
            ctx.textAlign = "center";
            ctx.fillText("CLICK TO START", 200, 300);
            ctx.textAlign = "left";
        }
    }

    // 4. ЕКРАН ПАУЗИ
    if (gameState === "PAUSED") {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0,0, 400, 600);
        
        ctx.fillStyle = "white";
        ctx.font = "36px 'Silkscreen', monospace";
        ctx.textAlign = "center";
        ctx.fillText("PAUSED", 200, 150);

        // Твоя картинка для кнопки продовження гри
        if (images.resume_btn_ui.complete) {
            ctx.drawImage(images.resume_btn_ui, 100, 220, 200, 70);
        } else {
            ctx.fillStyle = "green";
            ctx.fillRect(100, 220, 200, 70);
            ctx.fillStyle = "white";
            ctx.font = "20px 'Silkscreen', monospace";
            ctx.fillText("RESUME", 200, 260);
        }

        // Твоя картинка для кнопки виходу в меню
        if (images.main_menu_btn_ui.complete) {
            ctx.drawImage(images.main_menu_btn_ui, 100, 320, 200, 70);
        } else {
            ctx.fillStyle = "gray";
            ctx.fillRect(100, 320, 200, 70);
            ctx.fillStyle = "white";
            ctx.font = "20px 'Silkscreen', monospace";
            ctx.fillText("MAIN MENU", 200, 360);
        }
        ctx.textAlign = "left";
    }

    // 5. Екран Програшу (Game Over)
    if (gameState === "GAME_OVER") {
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0,0, 400, 600);
        
        ctx.fillStyle = "white";
        ctx.font = "40px 'Silkscreen', monospace";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", 200, 210);
        ctx.font = "24px 'Silkscreen', monospace";
        ctx.fillText("Score: " + score, 200, 260);
        
        if (images.restart_btn_ui.complete) {
            ctx.drawImage(images.restart_btn_ui, 100, 310, 200, 80);
        } else {
            ctx.fillStyle = "#0DD11B";
            ctx.fillText("CLICK TO RESTART", 200, 350);
        }
        ctx.textAlign = "left";
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();


playBtn.addEventListener('click', (e) => {
    e.preventDefault();
    siteMenu.style.display = 'none';
    gameContainer.style.display = 'block';
    startGame(); 
});

closeGameBtn.addEventListener('click', () => {
    gameContainer.style.display = 'none';
    siteMenu.style.display = 'block';
    gameState = "MENU";
});