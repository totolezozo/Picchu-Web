// constants for bird game
const GRAVITY = 300;
const FLAP_VELOCITY = -200;
const MAX_ROTATION = 30;
const pipeSpeed = 300;

// bird variables
let bird, birdPositionY, birdVelocityY, birdRotation;
let lastTime;
let score = 1;
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('game-over');

// game state
let gameStarted = false;

// pipes
let pipeInterval;
let pipeGap = 350;

function createPipePair() {
    const pipeTop = document.createElement('div');
    const pipeBottom = document.createElement('div');
    pipeTop.className = 'pipe';
    pipeBottom.className = 'pipe';
    
    const gameContainerWidth = document.getElementById('game-container').offsetWidth; 
    
    pipeTop.style.left = gameContainerWidth + 'px';
    pipeBottom.style.left = gameContainerWidth + 'px';

    const gameContainerHeight = document.getElementById('game-container').offsetHeight;
    const pipeGapHeight = Math.floor(gameContainerHeight * 0.40); 
    
    const pipeTopHeight = Math.floor((Math.random() * (1 - 0.2) + 0.1) * (gameContainerHeight - pipeGapHeight));
    pipeTop.style.height = pipeTopHeight + 'px';
    pipeTop.style.top = '0';

    const pipeBottomHeight = gameContainerHeight - pipeTopHeight - pipeGapHeight;
    pipeBottom.style.height = pipeBottomHeight + 'px';
    pipeBottom.style.bottom = '0';
    pipeTop.style.transform = 'scaleY(-1)';

    document.getElementById('game-container').appendChild(pipeTop);
    document.getElementById('game-container').appendChild(pipeBottom);
}

function movePipes(currentTime) {
    const pipes = document.getElementsByClassName('pipe');
    for (let i = 0; i < pipes.length; i++) {
        const pipe = pipes[i];
        const pipePositionX = parseFloat(pipe.style.left) || 0;
        const deltaTime = (currentTime - lastTime) / 1000;
        const newX = pipePositionX - pipeSpeed * deltaTime;
        pipe.style.left = newX + 'px';
        if (newX < -pipe.offsetWidth) {
            pipe.remove();
            updateScore();
        }
    }
}

function startPipeGeneration() {
    pipeInterval = setInterval(createPipePair, 2000);
}

function stopPipeGeneration() {
    clearInterval(pipeInterval);
}

function flapBird() {
    if (!gameStarted) {
        gameStarted = true;
        lastTime = performance.now();
        gameLoop(lastTime);
        startPipeGeneration();
    }
    birdVelocityY = FLAP_VELOCITY;
    birdRotation = MAX_ROTATION;
}

function updateBirdPosition(currentTime) {
    const deltaTime = (currentTime - lastTime) / 1000;

    birdVelocityY += GRAVITY * deltaTime;
    birdPositionY += birdVelocityY * deltaTime;
    bird.style.top = birdPositionY + 'px';

    birdRotation = Math.min(MAX_ROTATION, birdVelocityY * 0.5);
    bird.style.transform = `rotate(${birdRotation}deg)`;

    if (birdPositionY < 0) {
        birdPositionY = 0;
        birdVelocityY = 0;
    }
    const gameContainerHeight = document.getElementById('game-container').offsetHeight;
    if (birdPositionY > gameContainerHeight - bird.offsetHeight - 20) {
        return true;
    }
    return false;
}

function checkCollision() {
    const pipes = document.getElementsByClassName('pipe');
    const offset = 10;

    for (let i = 0; i < pipes.length; i++) {
        const pipe = pipes[i];

        const birdRect = bird.getBoundingClientRect();
        const pipeRect = pipe.getBoundingClientRect();

        if (birdRect.left + offset < pipeRect.right &&
            birdRect.right - offset > pipeRect.left &&
            birdRect.top + offset < pipeRect.bottom &&
            birdRect.bottom - offset > pipeRect.top) {
            return true;
        }
    }
    return false;
}

function updateScore() {
    score += 0.5;
    scoreElement.innerText = score;
}



function gameLoop(currentTime) {
    if (!updateBirdPosition(currentTime)) {
        movePipes(currentTime);
        if (!checkCollision()) {
            requestAnimationFrame(gameLoop);
        }
    }
    lastTime = currentTime;
}

window.onload = function() {
    gameOverElement.style.display = 'block';
    bird = document.getElementById('bird');
    birdPositionY = bird.offsetTop;
    birdVelocityY = 0;
    birdRotation = 0;

    document.querySelector('header').addEventListener('click', function() {
        gameOverElement.style.display = 'none';
        flapBird();
    });
};




