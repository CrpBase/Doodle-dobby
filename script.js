import { submitScore, loadLeaderboard } from './firebase_leaderboard.js';

let canvas, ctx;
let doodle, platforms, score, isGameOver, enemies;
let keys = { left: false, right: false };
let velocityX = 0;
const acceleration = 0.4;
const maxSpeed = 3.5;

const jumpSound = new Audio('assets/jump.mp3');
const springSound = new Audio('assets/spring.mp3');
const music = new Audio('assets/music.mp3');
const loseSound = new Audio('assets/ooh.mp3');
music.loop = true;

window.addEventListener("load", () => {
  const savedName = localStorage.getItem("playerName");
  if (!savedName) {
    document.getElementById("namePrompt").style.display = "flex";
  } else {
    document.getElementById("menu").style.display = "block";
  }

  document.getElementById("saveNameBtn").addEventListener("click", () => {
    const input = document.getElementById("playerNameInput").value.trim();
    if (input) {
      localStorage.setItem("playerName", input);
      document.getElementById("namePrompt").style.display = "none";
      document.getElementById("menu").style.display = "block";
    }
  });

  document.getElementById("startBtn").addEventListener("click", startGame);
  document.getElementById("restartBtn").addEventListener("click", startGame);
  document.getElementById("menuBtn").addEventListener("click", showMenu);
  document.getElementById("leaderboardBtn").addEventListener("click", showLeaderboard);
  document.getElementById("backToMenuBtn").addEventListener("click", showMenu);
});

document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = true;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = true;
});
document.addEventListener("keyup", e => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = false;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = false;
});

function showMenu() {
  document.getElementById("game").style.display = "none";
  document.getElementById("gameOver").style.display = "none";
  document.getElementById("leaderboard").style.display = "none";
  document.getElementById("menu").style.display = "block";
}

function startGame() {
  document.getElementById("menu").style.display = "none";
  document.getElementById("game").style.display = "block";
  document.getElementById("gameOver").style.display = "none";
  document.getElementById("leaderboard").style.display = "none";
  music.currentTime = 0;
  music.play();
  init();
}

async function showLeaderboard() {
  document.getElementById("menu").style.display = "none";
  document.getElementById("gameOver").style.display = "none";
  document.getElementById("game").style.display = "none";
  document.getElementById("leaderboard").style.display = "block";

  const leaderboardTable = document.getElementById("leaderboardTable");
  leaderboardTable.innerHTML = "<tr><th>#</th><th>Name</th><th>Score</th></tr>";

  try {
    const data = await loadLeaderboard();
    data.forEach((entry, i) => {
      const row = leaderboardTable.insertRow();
      row.innerHTML = `<td>${i + 1}</td><td>${entry.name}</td><td>${entry.score}</td>`;
    });
  } catch (err) {
    leaderboardTable.innerHTML += `<tr><td colspan='3'>Failed to load</td></tr>`;
  }
}

async function sendScoreToServer(name, score) {
  try {
    await submitScore(name, score);
  } catch (err) {
    console.error("Failed to send score:", err);
  }
}

function init() {
  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  doodle = {
    x: 200,
    y: 500,
    width: 40,
    height: 40,
    vy: 0,
    gravity: 0.2,
    jump: -10,
    img: new Image()
  };
  doodle.img.src = 'assets/doodle.png';

  platforms = [];
  score = 0;
  enemies = [];
  isGameOver = false;

  createInitialPlatforms();
  gameLoop();
}

function createPlatform(x, y, type = "normal") {
  return {
    x,
    y,
    width: 70,
    height: 10,
    type,
    direction: 1,
    brokenUsed: false,
    used: false,
    spring: Math.random() < 0.1
  };
}

function createInitialPlatforms() {
  let y = 600;
  for (let i = 0; i < 6; i++) {
    platforms.push(createPlatform(Math.random() * 330, y, "normal"));
    y -= 100;
  }
  platforms.push(createPlatform(200, 550, "normal"));
}

function updatePlatforms() {
  platforms.forEach(p => {
    if (p.type === "moving") {
      p.x += p.direction;
      if (p.x <= 0 || p.x + p.width >= canvas.width) p.direction *= -1;
    }
  });
}

function drawPlatforms() {
  platforms.forEach(p => {
    if ((p.type === "broken" && p.brokenUsed) || (p.type === "once" && p.used)) return;

    ctx.fillStyle = p.type === "moving" ? "#3af" :
                    p.type === "broken" ? "#a52a2a" :
                    p.type === "once" ? "#f7d600" : "#333";
    ctx.fillRect(p.x, p.y, p.width, p.height);

    if (p.spring) {
      ctx.fillStyle = "#0f0";
      ctx.fillRect(p.x + p.width / 2 - 5, p.y - 10, 10, 10);
    }

    if (p.type === "broken") {
      ctx.strokeStyle = "#fff";
      ctx.beginPath();
      ctx.moveTo(p.x + 20, p.y);
      ctx.lineTo(p.x + 50, p.y + 10);
      ctx.stroke();
    }
  });
}

function drawDoodle() {
  ctx.drawImage(doodle.img, doodle.x, doodle.y, doodle.width, doodle.height);
}

function update() {
  doodle.vy += doodle.gravity;
  doodle.y += doodle.vy;

  platforms.forEach(p => {
    if (
      doodle.vy > 0 &&
      !p.brokenUsed &&
      !p.used &&
      doodle.x + doodle.width > p.x &&
      doodle.x < p.x + p.width &&
      doodle.y + doodle.height > p.y &&
      doodle.y + doodle.height < p.y + p.height + 10
    ) {
      if (p.type === "broken") {
        p.brokenUsed = true;
        return;
      }
      if (p.type === "once") {
        p.used = true;
      }
      if (p.spring) {
        doodle.vy = doodle.jump * 1.8;
        springSound.currentTime = 0;
        springSound.play();
      } else {
        doodle.vy = doodle.jump;
        jumpSound.currentTime = 0;
        jumpSound.play();
      }
    }
  });

  if (doodle.y < 300) {
    const delta = 300 - doodle.y;
    doodle.y = 300;
    platforms.forEach(p => { p.y += delta; });
    enemies.forEach(e => { e.y += delta; });
    score += Math.floor(delta);
  }

  document.getElementById("scoreCounter").innerText = "Score: " + score;

  while (platforms.length < 12) {
    const lastY = Math.min(...platforms.map(p => p.y));
    const last = platforms[platforms.length - 1];
    let type = "normal";
    const chance = Math.random();
    if (score > 6000 && chance < 0.3) type = "broken";
    else if (score > 3000 && chance < 0.2) type = "moving";
    else if (score > 1000 && chance < 0.1) type = "once";
    platforms.push(createPlatform(Math.random() * 330, lastY - 100, type));
  }

  platforms = platforms.filter(p => p.y < 600);

  if (doodle.y > 600 && !isGameOver) {
    isGameOver = true;
    showGameOverMenu();
  }
}

function handleMovement() {
  if (keys.left) velocityX = -maxSpeed;
  else if (keys.right) velocityX = maxSpeed;
  else velocityX = 0;

  doodle.x += velocityX;

  if (doodle.x + doodle.width < 0) doodle.x = canvas.width;
  else if (doodle.x > canvas.width) doodle.x = -doodle.width;
}

function gameLoop() {
  if (isGameOver) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawPlatforms();
  drawDoodle();
  update();
  handleMovement();
  updatePlatforms();
  requestAnimationFrame(gameLoop);
}

function showGameOverMenu() {
  music.pause();
  loseSound.play();

  const name = localStorage.getItem("playerName") || "Anonymous";
  const best = localStorage.getItem("bestScore") || 0;
  if (score > best) {
    localStorage.setItem("bestScore", score);
  }

  const allScores = JSON.parse(localStorage.getItem("allScores") || "[]");
  allScores.push({ name, score });
  localStorage.setItem("allScores", JSON.stringify(allScores));
  sendScoreToServer(name, score);

  document.getElementById("game").style.display = "none";
  document.getElementById("gameOver").style.display = "block";
  const bestDisplay = localStorage.getItem("bestScore") || score;
  document.getElementById("scoreDisplay").innerText = "Score: " + score + "\nBest: " + bestDisplay;
}