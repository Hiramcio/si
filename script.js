document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const passInput = document.getElementById('passInput');
  const errorMsg = document.getElementById('errorMsg');
  const lockScreen = document.getElementById('lockScreen');
  const mainContent = document.getElementById('mainContent');

  const surpriseBtn = document.getElementById('surpriseBtn');
  const balloonsContainer = document.getElementById('balloonsContainer');
  const popSound = document.getElementById('popSound');
  const bgMusic = document.getElementById('bgMusic');

  // Canvas de Fuegos Artificiales y Chispas
  const canvas = document.getElementById('fireworksCanvas');
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Hash SHA-256 de "septiembre"
  const TARGET_HASH = "d6b09def5952d6784cb7d273520a95dbf5b6063af1a590e0846fbb6fc7189125";
  // 2 minutos y 42 segundos
  const PARTY_DURATION_MS = (2 * 60 + 42) * 1000;

  // Algoritmo de Hash
  async function sha256(str) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  }

  // Desbloqueo por contraseña
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const inputVal = passInput.value.trim().toLowerCase();
    const userHash = await sha256(inputVal);

    if (userHash === TARGET_HASH) {
      lockScreen.style.display = 'none';
      mainContent.classList.remove('hidden');
    } else {
      errorMsg.textContent = "Clave incorrecta ❌ Intenta de nuevo";
      passInput.value = "";
    }
  });

  // --- MOTOR DE FUEGOS ARTIFICIALES Y CHISPAS EN CANVAS ---
  let fireworks = [];
  let particles = [];
  let isPartyActive = false;

  class Firework {
    constructor(startX, startY, targetX, targetY) {
      this.x = startX;
      this.y = startY;
      this.startX = startX;
      this.startY = startY;
      this.targetX = targetX;
      this.targetY = targetY;
      this.distanceToTarget = Math.hypot(targetX - startX, targetY - startY);
      this.distanceTraveled = 0;
      this.coordinates = [];
      this.coordinateCount = 3;
      while (this.coordinateCount--) {
        this.coordinates.push([this.x, this.y]);
      }
      this.angle = Math.atan2(targetY - startY, targetX - startX);
      this.speed = 4;
      this.acceleration = 1.05;
      this.brightness = Math.random() * 50 + 50;
      this.hue = Math.random() * 360;
    }

    update(index) {
      this.coordinates.pop();
      this.coordinates.unshift([this.x, this.y]);

      this.speed *= this.acceleration;
      const vx = Math.cos(this.angle) * this.speed;
      const vy = Math.sin(this.angle) * this.speed;
      this.distanceTraveled = Math.hypot(this.x - this.startX, this.y - this.startY);

      if (this.distanceTraveled >= this.distanceToTarget) {
        createSparkParticles(this.targetX, this.targetY, this.hue);
        fireworks.splice(index, 1);
      } else {
        this.x += vx;
        this.y += vy;
      }
    }

    draw() {
      ctx.beginPath();
      ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
      ctx.lineTo(this.x, this.y);
      ctx.strokeStyle = `hsl(${this.hue}, 100%, ${this.brightness}%)`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  class SparkParticle {
    constructor(x, y, hue) {
      this.x = x;
      this.y = y;
      this.coordinates = [];
      this.coordinateCount = 5;
      while (this.coordinateCount--) {
        this.coordinates.push([this.x, this.y]);
      }
      this.angle = Math.random() * Math.PI * 2;
      this.speed = Math.random() * 10 + 1;
      this.friction = 0.95;
      this.gravity = 1.2;
      this.hue = hue + (Math.random() * 40 - 20);
      this.brightness = Math.random() * 80 + 20;
      this.alpha = 1;
      this.decay = Math.random() * 0.015 + 0.008;
    }

    update(index) {
      this.coordinates.pop();
      this.coordinates.unshift([this.x, this.y]);
      this.speed *= this.friction;
      this.x += Math.cos(this.angle) * this.speed;
      this.y += Math.sin(this.angle) * this.speed + this.gravity;
      this.alpha -= this.decay;

      if (this.alpha <= this.decay) {
        particles.splice(index, 1);
      }
    }

    draw() {
      ctx.beginPath();
      ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
      ctx.lineTo(this.x, this.y);
      ctx.strokeStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${this.alpha})`;
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }
  }

  function createSparkParticles(x, y, hue) {
    let particleCount = 80;
    while (particleCount--) {
      particles.push(new SparkParticle(x, y, hue));
    }
  }

  function fireworksLoop() {
    if (!isPartyActive && fireworks.length === 0 && particles.length === 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    requestAnimationFrame(fireworksLoop);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'lighter';

    let i = fireworks.length;
    while (i--) {
      fireworks[i].draw();
      fireworks[i].update(i);
    }

    let j = particles.length;
    while (j--) {
      particles[j].draw();
      particles[j].update(j);
    }
  }

  // Botón Sorpresa
  surpriseBtn.addEventListener('click', () => {
    // Si la fiesta ya está activa, ignoramos clics adicionales
    if (isPartyActive) return;

    if (popSound) {
      popSound.currentTime = 0;
      popSound.play().catch(e => console.log(e));
    }

    if (bgMusic) {
      bgMusic.volume = 0.1
      bgMusic.play().catch(e => console.log(e));
    }

    isPartyActive = true;
    
    // Deshabilitar y actualizar el botón
    surpriseBtn.disabled = true;
    surpriseBtn.style.opacity = '0.5';
    surpriseBtn.style.cursor = 'default';
    surpriseBtn.textContent = '¡Celebrando! 🎉✨';

    fireworksLoop();

    startFireworksSparks(PARTY_DURATION_MS);
    startConfetti(PARTY_DURATION_MS);
    startBalloonsAnimation(PARTY_DURATION_MS);

    // Al terminar los 2m 42s, rehabilitar el botón por si desea presionarlo de nuevo
    setTimeout(() => {
      isPartyActive = false;
      surpriseBtn.disabled = false;
      surpriseBtn.style.opacity = '1';
      surpriseBtn.style.cursor = 'pointer';
      surpriseBtn.textContent = 'Presiona para la sorpresa 🚀';
    }, PARTY_DURATION_MS);
  });

  // Dispara los cohetes de chispas
  function startFireworksSparks(duration) {
    const animationEnd = Date.now() + duration;

    const fwInterval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(fwInterval);
      }

      const startX = Math.random() * canvas.width;
      const targetX = Math.random() * (canvas.width * 0.8) + canvas.width * 0.1;
      const targetY = Math.random() * (canvas.height * 0.5) + 50;

      fireworks.push(new Firework(startX, canvas.height, targetX, targetY));
    }, 500);
  }

  // Lluvia complementaria de Confeti
  function startConfetti(duration) {
    const animationEnd = Date.now() + duration;

    const confInterval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(confInterval);

      confetti({
        particleCount: 20,
        spread: 60,
        origin: { x: Math.random(), y: Math.random() * 0.4 }
      });
    }, 600);
  }

  // Animación de Globos flotando
  function startBalloonsAnimation(duration) {
    const animationEnd = Date.now() + duration;

    const balloonInterval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(balloonInterval);

      createSingleBalloon();
    }, 380);
  }

  function createSingleBalloon() {
    const colors = ['#818cf8', '#c084fc', '#f43f5e', '#fbbf24', '#34d399', '#38bdf8'];
    const balloon = document.createElement('div');
    balloon.classList.add('balloon');

    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomLeft = Math.random() * 90 + 5;
    const randomSize = Math.random() * 20 + 40;
    const randomDuration = Math.random() * 2 + 5;

    balloon.style.backgroundColor = randomColor;
    balloon.style.left = `${randomLeft}vw`;
    balloon.style.width = `${randomSize}px`;
    balloon.style.height = `${randomSize * 1.3}px`;
    balloon.style.animationDuration = `${randomDuration}s`;

    balloonsContainer.appendChild(balloon);

    setTimeout(() => { balloon.remove(); }, randomDuration * 1000);
  }
});