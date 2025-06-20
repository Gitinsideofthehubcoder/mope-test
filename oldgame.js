// Import animals
import { animals } from './animals.js';

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Auto fullscreen
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Preload icons
const animalImages = {};
animals.forEach(animal => {
  const img = new Image();
  img.src = animal.icon;
  animalImages[animal.name] = img;
});

// World size
const worldWidth = 5000;
const worldHeight = 5000;

// Player
let player = {
  level: 0,
  worldX: worldWidth / 2,
  worldY: worldHeight / 2,
  radius: 40,

  baseSpeed: 3.0,
  maxSpeed: 5.0,
  vx: 0,
  vy: 0,
  angle: 0,
  score: 0,
  boosting: false
};

// Mouse
let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});

// Boost: impulse + flag
let canBoost = true;
let boostHeld = false;
const boostCooldown = 1500;
const boostImpulse = 10.0;

function startBoost() {
  if (!canBoost) return;

  // ✅ Use current velocity direction; fallback to facing if stopped
  let velAngle = Math.atan2(player.vy, player.vx);
  const speed = Math.hypot(player.vx, player.vy);
  if (speed < 0.1) {
    velAngle = player.angle;
  }

  const dirX = Math.cos(velAngle);
  const dirY = Math.sin(velAngle);
  player.vx += dirX * boostImpulse;
  player.vy += dirY * boostImpulse;

  player.boosting = true;

  setTimeout(() => {
    player.boosting = false;
  }, 300);

  canBoost = false;
  setTimeout(() => {
    canBoost = true;
  }, boostCooldown);
}

// Hold left click to repeat boost
window.addEventListener('mousedown', (e) => {
  if (e.button === 0) boostHeld = true;
});
window.addEventListener('mouseup', (e) => {
  if (e.button === 0) boostHeld = false;
});

// Food
const FOOD_COUNT = 300;
let foods = Array.from({ length: FOOD_COUNT }, () => ({
  x: Math.random() * worldWidth,
  y: Math.random() * worldHeight,
  radius: 15 + Math.random() * 5,
  absorbing: false,   // ✅ for fade/fly effect
  alpha: 1.0          // ✅ for fade
}));

// Upgrade menu
const menu = document.createElement('div');
menu.style.position = 'absolute';
menu.style.top = '50%';
menu.style.left = '50%';
menu.style.transform = 'translate(-50%, -50%)';
menu.style.background = 'white';
menu.style.padding = '20px';
menu.style.border = '2px solid black';
menu.style.display = 'none';
document.body.appendChild(menu);

function openUpgradeMenu(options) {
  menu.innerHTML = `<h3>Choose your next animal:</h3>`;
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.textContent = `${opt.name} (${opt.biome})`;
    btn.style.margin = '5px';
    btn.onclick = () => {
      player.level = animals.findIndex(a => a.name === opt.name);
      player.radius = 40 + player.level * 2;
      player.baseSpeed = 3.0 + player.level * 0.05;
      player.maxSpeed = 5.0 + player.level * 0.05;
      menu.style.display = 'none';
    };
    menu.appendChild(btn);
  });
  menu.style.display = 'block';
}

function checkEvolution() {
  const current = animals[player.level];
  const nextOptions = animals.filter(a =>
    a.evolveScore > current.evolveScore &&
    a.evolveScore <= player.score
  );
  if (nextOptions.length > 0 && menu.style.display === 'none') {
    openUpgradeMenu(nextOptions.slice(0, 4));
  }
}

function update() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const dx = mouse.x - centerX;
  const dy = mouse.y - centerY;
  const dist = Math.hypot(dx, dy);

  const speedFactor = Math.min(dist / 100, 1);

  // Steering: weaker during boost for drift
  if (dist > 1) {
    const dirX = dx / dist;
    const dirY = dy / dist;
    const steer = player.boosting ? 0.3 * speedFactor : 0.6 * speedFactor;
    player.vx += dirX * steer;
    player.vy += dirY * steer;
  }

  // Boost trigger
  if (boostHeld && canBoost) {
    startBoost();
  }

  // Friction
  player.vx *= 0.93;
  player.vy *= 0.93;

  // Speed limit
  const vTotal = Math.hypot(player.vx, player.vy);
  const speedLimit = player.boosting ? player.maxSpeed * 2 : player.maxSpeed;
  if (vTotal > speedLimit) {
    player.vx = (player.vx / vTotal) * speedLimit;
    player.vy = (player.vy / vTotal) * speedLimit;
  }

  // Move player
  player.worldX += player.vx;
  player.worldY += player.vy;

  // ✅ Velocity-based facing
  player.angle = Math.atan2(player.vy, player.vx);

  // Keep inside map
  player.worldX = Math.max(player.radius, Math.min(worldWidth - player.radius, player.worldX));
  player.worldY = Math.max(player.radius, Math.min(worldHeight - player.radius, player.worldY));

  // Mark food as absorbing when eaten
  foods.forEach(f => {
    const fx = player.worldX - f.x;
    const fy = player.worldY - f.y;
    const d = Math.hypot(fx, fy);
    if (!f.absorbing && d < player.radius + f.radius) {
      f.absorbing = true;
      player.radius += 0.2;
      player.score += 1;
    }
  });

  // ✅ Update absorbing food: fly + fade, no shrink
  foods.forEach(f => {
    if (f.absorbing) {
      const dx = player.worldX - f.x;
      const dy = player.worldY - f.y;
      f.x += dx * 0.2;
      f.y += dy * 0.2;
      f.alpha -= 0.1; // fade fast
    }
  });

  // Remove faded food
  foods = foods.filter(f => f.alpha > 0);

  // Replenish if needed
  while (foods.length < FOOD_COUNT) {
    foods.push({
      x: Math.random() * worldWidth,
      y: Math.random() * worldHeight,
      radius: 15 + Math.random() * 5,
      absorbing: false,
      alpha: 1.0
    });
  }

  checkEvolution();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const offsetX = player.worldX - canvas.width / 2;
  const offsetY = player.worldY - canvas.height / 2;

  ctx.fillStyle = "#cceeff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'green';
  foods.forEach(f => {
    const screenX = f.x - offsetX;
    const screenY = f.y - offsetY;
    ctx.globalAlpha = f.alpha;
    ctx.beginPath();
    ctx.arc(screenX, screenY, f.radius, 0, Math.PI * 2); // ✅ same radius
    ctx.fill();
  });
  ctx.globalAlpha = 1.0; // reset

  const animal = animals[player.level];
  const img = animalImages[animal.name];
  if (img.complete) {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(player.angle);
    ctx.drawImage(
      img,
      -player.radius,
      -player.radius,
      player.radius * 2,
      player.radius * 2
    );
    ctx.restore();
  } else {
    ctx.fillStyle = animal.color;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // HUD (no boost cooldown label)
  ctx.fillStyle = 'black';
  ctx.font = '20px Arial';
  ctx.fillText(`Score: ${player.score}`, 10, 30);
  ctx.fillText(`Animal: ${animal.name} (${animal.biome})`, 10, 55);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
