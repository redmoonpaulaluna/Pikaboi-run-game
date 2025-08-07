const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let width, height;
function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}
resize();
window.addEventListener('resize', resize);

let distance = 1;
let coins = 0;
let speed = 4;
let gameOver = false;

const gravity = 0.6;
const groundY = height - 150;

let player;
let obstacles = [];
let coinsOnField = [];

const hudDistance = document.getElementById('distance');
const hudCoins = document.getElementById('coins');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScore = document.getElementById('finalScore');

class Player {
  constructor() {
    this.width = 60;
    this.height = 80;
    this.x = 100;
    this.y = groundY - this.height;
    this.dy = 0;
    this.jumping = false;
    this.sliding = false;
    this.slideHeight = 50;
    this.slideTime = 0;
  }

  draw() {
    ctx.fillStyle = 'yellow';
    if (this.sliding) {
      // Draw sliding rectangle smaller height
      ctx.fillRect(this.x, this.y + this.height - this.slideHeight, this.width, this.slideHeight);
      // Optional: Draw ears / tail as triangles (simplified Pikachu-like)
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.moveTo(this.x + 10, this.y + this.height - this.slideHeight);
      ctx.lineTo(this.x + 20, this.y + this.height - this.slideHeight - 15);
      ctx.lineTo(this.x + 30, this.y + this.height - this.slideHeight);
      ctx.fill();
    } else {
      // Normal standing rectangle
      ctx.fillRect(this.x, this.y, this.width, this.height);
      // Ears (triangles)
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.moveTo(this.x + 10, this.y);
      ctx.lineTo(this.x + 20, this.y - 20);
      ctx.lineTo(this.x + 30, this.y);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(this.x + this.width - 10, this.y);
      ctx.lineTo(this.x + this.width - 20, this.y - 20);
      ctx.lineTo(this.x + this.width - 30, this.y);
      ctx.fill();
    }
  }

  update() {
    this.dy += gravity;
    this.y += this.dy;

    if (this.y > groundY - this.height && !this.sliding) {
      this.y = groundY - this.height;
      this.dy = 0;
      this.jumping = false;
    }

    if (this.sliding) {
      this.slideTime--;
      if (this.slideTime <= 0) {
        this.sliding = false;
      }
    }
  }

  jump() {
    if (!this.jumping && !this.sliding) {
      this.dy = -15;
      this.jumping = true;
    }
  }

  slide() {
    if (!this.jumping && !this.sliding) {
      this.sliding = true;
      this.slideTime = 30; // frames sliding duration
      // lower the player y for sliding hitbox
      this.y = groundY - this.slideHeight;
    }
  }

  getHitbox() {
    if (this.sliding) {
      return {
        x: this.x,
        y: this.y + this.height - this.slideHeight,
        width: this.width,
        height: this.slideHeight
      };
    }
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
}

class Obstacle {
  constructor() {
    this.width = 40 + Math.random() * 30;
    this.height = 40 + Math.random() * 50;
    this.x = width + 50;
    this.y = groundY - this.height;
  }

  draw() {
    ctx.fillStyle = '#bb2222';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    // optional: add spikes or pattern
  }

  update() {
    this.x -= speed;
  }
}

class Coin {
  constructor() {
    this.radius = 15;
    this.x = width + 50;
    this.y = groundY - 100 - Math.random() * 150;
  }

  draw() {
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'orange';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  update() {
    this.x -= speed;
  }

  getHitbox() {
    return {
      x: this.x - this.radius,
      y: this.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2
    };
  }
}

function isColliding(rect1, rect2) {
  return !(rect1.x > rect2.x + rect2.width ||
           rect1.x + rect1.width < rect2.x ||
           rect1.y > rect2.y + rect2.height ||
           rect1.y + rect1.height < rect2.y);
}

function updateHUD() {
  hudDistance.textContent = 'Distance: ' + distance.toFixed(0);
  hudCoins.textContent = 'Coins: ' + coins;
}

function spawnObstacle() {
  if (!gameOver && Math.random() < 0.02) { // chance to spawn per frame
    obstacles.push(new Obstacle());
  }
}

function spawnCoin() {
  if (!gameOver && Math.random() < 0.03) {
    coinsOnField.push(new Coin());
  }
}

function handleCollisions() {
  const playerHitbox = player.getHitbox();

  for (let i = obstacles.length - 1; i >= 0; i--) {
    if (isColliding(playerHitbox, obstacles[i])) {
      gameOver = true;
      showGameOver();
      break;
    }
  }

  for (let i = coinsOnField.length - 1; i >= 0; i--) {
    if (isColliding(playerHitbox, coinsOnField[i].getHitbox())) {
      coins++;
      coinsOnField.splice(i, 1);
    }
  }
}

function showGameOver() {
  finalScore.textContent = `Distance: ${distance.toFixed(0)} | Coins: ${coins}`;
  gameOverScreen.style.display = 'block';
}

function animate() {
  if (gameOver) return;

  ctx.clearRect(0, 0, width, height);

  player.update();
  player.draw();

  obstacles.forEach((ob) => {
    ob.update();
    ob.draw();
  });

  coinsOnField.forEach((coin) => {
    coin.update();
    coin.draw();
  });

  // Remove offscreen obstacles and coins
  obstacles = obstacles.filter(ob => ob.x + ob.width > 0);
  coinsOnField = coinsOnField.filter(c => c.x + c.radius > 0);

  spawnObstacle();
  spawnCoin();

  handleCollisions();

  distance += speed * 0.1;
  speed += 0.0005; // langsam schneller

  updateHUD();

  requestAnimationFrame(animate);
}

// Touch swipe detection
let touchStartY = null;
let touchEndY = null;

canvas.addEventListener('touchstart', (e) => {
  if (gameOver) return;
  touchStartY = e.changedTouches[0].clientY;
});

canvas.addEventListener('touchend', (e) => {
  if (gameOver) return;
  touchEndY = e.changedTouches[0].clientY;
  handleSwipe();
});

function handleSwipe() {
  if (touchStartY !== null && touchEndY !== null) {
    let diff = touchStartY - touchEndY;
    if (diff > 50) {
      player.jump();
    } else if (diff < -50) {
      player.slide();
    }
  }
  touchStartY = null;
  touchEndY = null;
}

// Keyboard controls (für Desktop)
window.addEventListener('keydown', e => {
  if (gameOver) return;
  if (e.code === 'ArrowUp') player.jump();
  if (e.code === 'ArrowDown') player.slide();
});

// Game starten
function init() {
  player = new Player();
  obstacles = [];
  coinsOnField = [];
  distance = 1;
  coins = 0;
  speed = 4;
  gameOver = false;
  gameOverScreen.style.display = 'none';
  updateHUD();
  animate();
}

function startGame() {
  init();
}

// Start sofort
startGame();
