import { animals } from './animals.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ✅ Preload animal icons
const animalImages = {};
animals.forEach(animal => {
  const img = new Image();
  img.src = animal.icon;
  animalImages[animal.name] = img;
});

// ✅ Player state
let player = {
  level: 0,
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 40,
  speed: 2.0,
  vx: 0,
  vy: 0,
  angle: 0,  // angle in radians for rotation
  score: 0
};

// ✅ Mouse tracking
let mouse = { x: player.x, y: player.y };
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});

// ✅ Initial food
let foods = Array.from({ length: 20 }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
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

  // 🐾 Smooth movement toward mouse
  const dx = mouse.x - player.x;
  const dy = mouse.y - player.y;
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

  // Speed limit
  const speedLimit = player.speed;
  const vTotal = Math.hypot(player.vx, player.vy);
  if (vTotal > speedLimit) {
    player.vx = (player.vx / vTotal) * speedLimit;
    player.vy = (player.vy / vTotal) * speedLimit;
  }

  // Update position
  player.x += player.vx;
  player.y += player.vy;

  // 🔑 Update angle — use arctangent of velocity
  player.angle = Math.atan2(player.vy, player.vx);

  // Stay in bounds
  player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

  // Eat food
  foods = foods.filter(f => {
    const fx = player.x - f.x;
    const fy = player.y - f.y;
    const dist = Math.hypot(fx, fy);
    if (dist < player.radius + f.radius) {
      player.radius += 0.2;
      player.score += 1;
      return false;
    }
    return true;
  });

  while (foods.length < 20) {
    foods.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: 5 + Math.random() * 5
    });
  }

  checkEvolution();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Food
  ctx.fillStyle = 'green';
  foods.forEach(f => {
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  // Player: draw rotated icon
  const animal = animals[player.level];
  const img = animalImages[animal.name];

  if (img.complete) {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle); // rotate to current angle
    ctx.drawImage(
      img,
      -player.radius,  // draw centered
      -player.radius,
      player.radius * 2,
      player.radius * 2
    );
    ctx.restore();
  } else {
    // fallback circle
    ctx.fillStyle = animal.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // HUD
  ctx.fillStyle = 'black';
  ctx.font = '20px Arial';
  ctx.fillText(`Score: ${player.score}`, 10, 20);
  ctx.fillText(`Animal: ${animal.name} (${animal.biome})`, 10, 45);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
