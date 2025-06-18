// ✅ Import the combined animals list (which itself imports the parts)
import { animals } from './animals.js';

// ✅ Setup canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ✅ Preload animal icons
const animalImages = {};
animals.forEach(animal => {
  const img = new Image();
  img.src = animal.icon; // from the 'icon' field in your split files
  animalImages[animal.name] = img;
});

// ✅ Player state
let player = {
  level: 0,
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 40,  // sets size for drawImage
  speed: 2.0,
  score: 0
};

// ✅ Initial food blobs
let foods = Array.from({ length: 20 }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  radius: 5 + Math.random() * 5
}));

// ✅ Keyboard controls
let keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

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
      player.radius = 40 + player.level * 2; // increase size slightly
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
    openUpgradeMenu(nextOptions.slice(0, 4)); // show up to 4 options
  }
}

function update() {
  if (menu.style.display !== 'none') return; // pause when choosing

  // Movement
  if (keys['ArrowUp']) player.y -= player.speed;
  if (keys['ArrowDown']) player.y += player.speed;
  if (keys['ArrowLeft']) player.x -= player.speed;
  if (keys['ArrowRight']) player.x += player.speed;

  // Bounds
  player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

  // Eat food
  foods = foods.filter(f => {
    const dx = player.x - f.x;
    const dy = player.y - f.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < player.radius + f.radius) {
      player.radius += 0.2; // grow slightly
      player.score += 1;
      return false; // remove eaten food
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

  // Draw food blobs
  ctx.fillStyle = 'green';
  foods.forEach(f => {
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw player animal icon
  const animal = animals[player.level];
  const img = animalImages[animal.name];
  if (img.complete) {
    ctx.drawImage(
      img,
      player.x - player.radius,
      player.y - player.radius,
      player.radius * 2,
      player.radius * 2
    );
  } else {
    // fallback if image not loaded yet
    ctx.fillStyle = animal.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // HUD info
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
