// Import the full animal list
import { animals } from './animals.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Player object
let player = {
  level: 0,
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 20,
  speed: 2.0,
  score: 0
};

// Initialize radius and speed from first animal
player.radius = 20;
player.speed = 2.0;

let foods = Array.from({length: 20}, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  radius: 5 + Math.random() * 5
}));

let keys = {};
window.addEventListener('keydown', (e) => { keys[e.key] = true; });
window.addEventListener('keyup', (e) => { keys[e.key] = false; });

// Create upgrade menu
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

// Show the upgrade options
function openUpgradeMenu(options) {
  menu.innerHTML = `<h3>Choose your next animal:</h3>`;
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.textContent = `${opt.name} (${opt.biome})`;
    btn.style.margin = '5px';
    btn.onclick = () => {
      // Evolve to chosen animal
      player.level = animals.findIndex(a => a.name === opt.name);
      player.radius = 20 + player.level * 2;  // radius grows modestly with level
      player.speed = 2.0 + player.level * 0.05; // speed grows slightly
      menu.style.display = 'none';
    };
    menu.appendChild(btn);
  });
  menu.style.display = 'block';
}

// Check if player can upgrade
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

// Game update loop
function update() {
  if (menu.style.display !== 'none') return; // pause when menu open

  if (keys['ArrowUp']) player.y -= player.speed;
  if (keys['ArrowDown']) player.y += player.speed;
  if (keys['ArrowLeft']) player.x -= player.speed;
  if (keys['ArrowRight']) player.x += player.speed;

  // Keep player in bounds
  player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

  // Check collisions with food
  foods = foods.filter(f => {
    const dx = player.x - f.x;
    const dy = player.y - f.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < player.radius + f.radius) {
      player.radius += 0.2; // grow slightly
      player.score += 1;
      return false; // eat it
    }
    return true;
  });

  // Respawn food
  while (foods.length < 20) {
    foods.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: 5 + Math.random() * 5
    });
  }

  checkEvolution();
}

// Draw everything
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Food
  ctx.fillStyle = 'green';
  foods.forEach(f => {
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  // Player
  ctx.fillStyle = animals[player.level].color;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Info
  ctx.fillStyle = 'black';
  ctx.font = '20px Arial';
  ctx.fillText(`Score: ${player.score}`, 10, 20);
  ctx.fillText(`Animal: ${animals[player.level].name} (${animals[player.level].biome})`, 10, 45);
}

// Main loop
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
