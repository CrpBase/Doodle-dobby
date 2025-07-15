import { submitScore, loadLeaderboard } from './firebase_leaderboard.js';

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

  const canvas = document.getElementById("gameCanvas");
  canvas.addEventListener("touchstart", e => {
    const rect = canvas.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    const canvasMid = rect.width / 2;
    keys.left = touchX < canvasMid;
    keys.right = touchX >= canvasMid;
  });

  canvas.addEventListener("touchend", e => {
    keys.left = false;
    keys.right = false;
  });
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
  try {
    await submitScore(name, score);
  } catch (err) {
    console.error("Failed to send score:", err);
  }
}