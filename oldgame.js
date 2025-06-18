import { animals } from './animals.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ✅ Auto-resize to screen resolution
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ✅ Preload icons
const animalImages = {};
animals.forEach(animal => {
  const img = new Image();
  img.src = animal.icon;
  animalImages[animal.name] = img;
});

// ✅ Big world dimensions
const worldWidth = 5000;
const worldHeight = 5000;

// ✅ Player with real world position
let player = {
  level: 0,
  worldX: worldWidth / 2,
  worldY: worldHeight / 2,
  radius: 40,
  speed: 2.0,
  vx: 0,
  vy: 0,
  angle: 0,
  score: 0
};

// ✅ Mouse relative to screen center
let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});

// ✅ Food items with world coordinates
let foods = Array.from({ length: 300 }, () => ({
  x: Math.random() * worldWidth,
  y: Math.random() * worldHeight,
  radius: 5 + Math.random() * 5
}));

// ✅ Upgrade menu
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
      player.speed = 2.0 + player.level * 0.05;
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
  if (menu.style.display !== 'none') return;

  // 🐾 Direction from player center to mouse cursor
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const dx = mouse.x - centerX;
  const dy = mouse.y - centerY;
  const distance = Math.hypot(dx, dy);

  if (distance > 1) {
    const dirX = dx / distance;
    const dirY = dy / distance;
    const accel = 0.2;
    player.vx += dirX * accel;
    player.vy += dirY * accel;
  }

  // Friction
  player.vx *= 0.9;
  player.vy *= 0.9;

  // Limit speed
  const speedLimit = player.speed;
  const vTotal = Math.hypot(player.vx, player.vy);
  if (vTotal > speedLimit) {
    player.vx = (player.vx / vTotal) * speedLimit;
    player.vy = (player.vy / vTotal) * speedLimit;
  }

  // Update world position
  player.worldX += player.vx;
  player.worldY += player.vy;

  // Update facing angle
  player.angle = Math.atan2(player.vy, player.vx);

  // Stay inside map
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

  while (foods.length < 300) {
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

  // Camera offset: player stays centered
  const offsetX = player.worldX - canvas.width / 2;
  const offsetY = player.worldY - canvas.height / 2;

  // Draw background (optional grid or color)
  ctx.fillStyle = "#cceeff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw foods relative to camera
  ctx.fillStyle = 'green';
  foods.forEach(f => {
    const screenX = f.x - offsetX;
    const screenY = f.y - offsetY;
    ctx.beginPath();
    ctx.arc(screenX, screenY, f.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw player at screen center, rotated
  const animal = animals[player.level];
  const img = animalImages[animal.name];

  if (img.complete) {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2); // player always at center
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
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
