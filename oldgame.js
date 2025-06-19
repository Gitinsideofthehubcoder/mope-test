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
  baseSpeed: 2.0,
  vx: 0,
  vy: 0,
  angle: 0,
  score: 0,
  maxSpeed: 2.0 // dynamic max speed, changes on boost
};

// Mouse
let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});

// ✅ Boost impulse with hold + 1.5s cooldown
let canBoost = true;
let boosting = false;
const boostCooldown = 1500; // 1.5 sec
const boostDuration = 500; // ms

function doBoost() {
  if (!canBoost) return;

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const dx = mouse.x - centerX;
  const dy = mouse.y - centerY;
  const distance = Math.hypot(dx, dy);

  if (distance < 5) return; // No boost if mouse at center

  const dirX = dx / distance;
  const dirY = dy / distance;

  const boostStrength = 20; // big push
  player.vx += dirX * boostStrength;
  player.vy += dirY * boostStrength;

  // Allow higher speed for a short time
  player.maxSpeed = player.baseSpeed * 4;
  setTimeout(() => {
    player.maxSpeed = player.baseSpeed;
  }, boostDuration);

  canBoost = false;
  setTimeout(() => {
    canBoost = true;
  }, boostCooldown);
}

// Holding left click repeatedly triggers boost if cooldown allows
window.addEventListener('mousedown', (e) => {
  if (e.button === 0) boosting = true;
});
window.addEventListener('mouseup', (e) => {
  if (e.button === 0) boosting = false;
});

// Food
const FOOD_COUNT = 300;
let foods = Array.from({ length: FOOD_COUNT }, () => ({
  x: Math.random() * worldWidth,
  y: Math.random() * worldHeight,
  radius: 5 + Math.random() * 5
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
      player.baseSpeed = 2.0 + player.level * 0.05;
      player.maxSpeed = player.baseSpeed;
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
  const distance = Math.hypot(dx, dy);

  const speedFactor = Math.min(distance / 100, 1);

  if (distance > 1) {
    const dirX = dx / distance;
    const dirY = dy / distance;
    const accel = 0.2 * speedFactor;
    player.vx += dirX * accel;
    player.vy += dirY * accel;
  }

  // ✅ Apply boost if holding and allowed
  if (boosting && canBoost) {
    doBoost();
  }

  // Friction
  player.vx *= 0.9;
  player.vy *= 0.9;

  // Clamp to dynamic maxSpeed
  const finalMax = player.maxSpeed * speedFactor;
  const vTotal = Math.hypot(player.vx, player.vy);
  if (vTotal > finalMax) {
    player.vx = (player.vx / vTotal) * finalMax;
    player.vy = (player.vy / vTotal) * finalMax;
  }

  // Move
  player.worldX += player.vx;
  player.worldY += player.vy;

  player.angle = Math.atan2(player.vy, player.vx);

  // Bounds
  player.worldX = Math.max(player.radius, Math.min(worldWidth - player.radius, player.worldX));
  player.worldY = Math.max(player.radius, Math.min(worldHeight - player.radius, player.worldY));

  // Eat food
  foods = foods.filter(f => {
    const fx = player.worldX - f.x;
    const fy = player.worldY - f.y;
    const dist = Math.hypot(fx, fy);
    if (dist < player.radius + f.radius) {
      player.radius += 0.2;
      player.score += 1;
      return false;
    }
    return true;
  });

  while (foods.length < FOOD_COUNT) {
    foods.push({
      x: Math.random() * worldWidth,
      y: Math.random() * worldHeight,
      radius: 5 + Math.random() * 5
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
    ctx.beginPath();
    ctx.arc(screenX, screenY, f.radius, 0, Math.PI * 2);
    ctx.fill();
  });

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

  // HUD
  ctx.fillStyle = 'black';
  ctx.font = '20px Arial';
  ctx.fillText(`Score: ${player.score}`, 10, 30);
  ctx.fillText(`Animal: ${animal.name} (${animal.biome})`, 10, 55);
  if (!canBoost) {
    ctx.fillStyle = 'gray';
    ctx.fillText(`Boost on cooldown...`, 10, 80);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
