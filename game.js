const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 20,
  speed: 2,
  score: 0
};

let foods = [];

for (let i = 0; i < 20; i++) {
  foods.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: 5 + Math.random() * 5
  });
}

let keys = {};

window.addEventListener('keydown', (e) => { keys[e.key] = true; });
window.addEventListener('keyup', (e) => { keys[e.key] = false; });

function update() {
  if (keys['ArrowUp']) player.y -= player.speed;
  if (keys['ArrowDown']) player.y += player.speed;
  if (keys['ArrowLeft']) player.x -= player.speed;
  if (keys['ArrowRight']) player.x += player.speed;

  // Keep player in bounds
  player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

  // Check food collision
  foods = foods.filter(f => {
    let dx = player.x - f.x;
    let dy = player.y - f.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < player.radius + f.radius) {
      player.radius += 0.2; // grow
      player.score += 1;
      return false; // remove food
    }
    return true;
  });

  // Respawn food if needed
  while (foods.length < 20) {
    foods.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: 5 + Math.random() * 5
    });
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw foods
  ctx.fillStyle = 'green';
  foods.forEach(f => {
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw player
  ctx.fillStyle = 'orange';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();

  // Draw score
  ctx.fillStyle = 'black';
  ctx.font = '20px Arial';
  ctx.fillText(`Score: ${player.score}`, 10, 20);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
