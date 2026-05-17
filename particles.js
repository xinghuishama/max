// ===========================
// v4.0 霓虹粉粒子引擎
// ===========================
(function () {
  const canvas = document.getElementById("particles");
  const ctx = canvas.getContext("2d");

  let w, h, particles;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  window.addEventListener("resize", resize);
  resize();

  // 粒子数量（移动端自动减少）
  const COUNT = window.innerWidth < 600 ? 40 : 90;

  function createParticles() {
    particles = [];
    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random() * 1.5 + 0.5, // 深度
        r: Math.random() * 2 + 1,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4
      });
    }
  }

  createParticles();

  function draw() {
    ctx.clearRect(0, 0, w, h);

    for (let p of particles) {
      // 位置更新（缓动）
      p.x += p.vx * p.z;
      p.y += p.vy * p.z;

      // 边界循环
      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;

      // 发光粒子
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 75, 129, ${0.25 * p.z})`;
      ctx.shadowBlur = 12 * p.z;
      ctx.shadowColor = "#ff4b81";
      ctx.arc(p.x, p.y, p.r * p.z, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  draw();
})();