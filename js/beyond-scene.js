/* =========================================================================
   BeyondScene — an ORIGINAL 8-bit platformer world for the hero backdrop.
   (Not based on any existing game's art — all shapes drawn from scratch.)
   Sits BELOW the glyph field. Gentle cloud drift, bobbing coin + sprite.
     BeyondScene.mount(canvas, { accent })
   ========================================================================= */
(function () {
  "use strict";

  function mount(canvas, opts) {
    opts = opts || {};
    var ctx = canvas.getContext("2d", { alpha: true });
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, U = 6;
    var t0 = performance.now(), raf = 0, last = 0, running = true;

    // palette (original, brand-mint flavored)
    var P = {
      sky0: "#39064d00", // unused placeholder
      cloud: "#f4f8ff", cloudSh: "#cfe0fa",
      hillL: "#46b35e", hillD: "#2f8f48", grass: "#5ec46f", grassD: "#3a9a52",
      soil: "#a9612c", soilHi: "#c07c41", soilSh: "#7c4419", seam: "#8a4d22",
      stone: "#8b93a3", stoneHi: "#b3bac7", stoneSh: "#5c6373",
      coin: opts.accent || "#6abb8d", coinHi: "#cdeede",
      pole: "#d7dbe2", flag: opts.accent || "#6abb8d",
      body: opts.accent || "#6abb8d", bodyD: "#2f6b4d", eye: "#14141a", tip: "#fcd573",
      ink: "14,14,18"
    };

    function R(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.ceil(w), Math.ceil(h)); }
    function C(cx, cy, cw, ch, c) { R(cx * U, cy * U, cw * U, ch * U, c); }

    function cloud(bx, by) {
      // 12 x 5 puffy original cloud
      C(bx + 4, by + 0, 4, 1, P.cloud);
      C(bx + 2, by + 1, 8, 1, P.cloud);
      C(bx + 1, by + 2, 10, 1, P.cloud);
      C(bx + 0, by + 3, 12, 1, P.cloud);
      C(bx + 0, by + 4, 12, 1, P.cloudSh);
    }

    function hill(cx, gy, bw, hh) {
      // symmetric pixel mound
      for (var i = 0; i < hh; i++) {
        var w = Math.max(2, Math.round(bw * (1 - i / hh)));
        var x = cx - (w >> 1);
        C(x, gy - 1 - i, w, 1, i > hh - 3 ? P.grass : P.hillL);
      }
      // darker texture specks
      C(cx - 2, gy - 3, 1, 1, P.hillD);
      C(cx + 2, gy - 5, 1, 1, P.hillD);
    }

    function bush(cx, gy, w) {
      C(cx, gy - 1, w, 1, P.hillL);
      C(cx + 1, gy - 2, Math.max(1, w - 2), 1, P.grass);
    }

    function block(cx, cy) {
      // 2x2 stone block with clean bevel
      C(cx, cy, 2, 2, P.stone);
      C(cx, cy, 2, 0.4, P.stoneHi);
      C(cx, cy, 0.4, 2, P.stoneHi);
      C(cx, cy + 1.6, 2, 0.4, P.stoneSh);
      C(cx + 1.6, cy, 0.4, 2, P.stoneSh);
    }

    function coin(cx, cy) {
      C(cx + 0.75, cy, 1, 2.5, P.coin);
      C(cx, cy + 0.75, 2.5, 1, P.coin);
      C(cx + 0.85, cy + 0.6, 0.5, 1.2, P.coinHi);
    }

    function flag(cx, gy) {
      var top = gy - 17;
      C(cx, top, 0.5, 17, P.pole);          // pole
      C(cx - 0.2, top - 0.6, 0.9, 0.9, P.coinHi); // ball
      // triangular flag (stepped)
      for (var i = 0; i < 5; i++) C(cx - 5 + i, top + 1 + i, 5 - i, 1, P.flag);
    }

    function sprite(cx, gy, frame) {
      var by = gy - 9 + frame; // body top, bob 1px
      // antenna
      C(cx + 3, by - 2, 0.6, 2, P.bodyD);
      C(cx + 2.7, by - 2.6, 1.2, 0.8, P.tip);
      // body (8 wide, 7 tall) rounded-ish
      C(cx + 1, by, 6, 7, P.body);
      C(cx, by + 1, 8, 5, P.body);
      // outline accents
      C(cx, by + 1, 1, 5, P.bodyD);
      C(cx + 7, by + 1, 1, 5, P.bodyD);
      C(cx + 1, by + 6, 6, 1, P.bodyD);
      // eyes
      C(cx + 2, by + 2, 1.2, 1.6, P.eye);
      C(cx + 5, by + 2, 1.2, 1.6, P.eye);
      // feet
      C(cx + 1.4, by + 7, 1.6, 1.4, P.bodyD);
      C(cx + 5, by + 7, 1.6, 1.4, P.bodyD);
    }

    function render(now) {
      var t = (now - t0) * 0.001;
      var cols = Math.ceil(W / U), rows = Math.ceil(H / U);

      // sky
      var g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#2f5fc2");
      g.addColorStop(0.5, "#5183dd");
      g.addColorStop(1, "#84afe8");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      var gt = rows - 8; // ground top row

      // clouds (slow drift, wrap)
      var span = cols + 16;
      var drift = (t * 0.9) % span;
      var bases = [ -2, Math.round(cols * 0.34), Math.round(cols * 0.66), cols + 2 ];
      for (var ci = 0; ci < bases.length; ci++) {
        var bx = ((bases[ci] - drift) % span + span) % span - 8;
        cloud(bx, Math.round(rows * (0.14 + (ci % 2) * 0.08)));
      }

      // distant hills
      hill(Math.round(cols * 0.16), gt, 22, 13);
      hill(Math.round(cols * 0.30), gt, 14, 8);
      hill(Math.round(cols * 0.74), gt, 18, 11);
      bush(Math.round(cols * 0.44), gt, 5);
      bush(Math.round(cols * 0.60), gt, 4);

      // floating blocks + bobbing coin
      var by = Math.round(rows * 0.40);
      var bx0 = Math.round(cols * 0.60);
      block(bx0, by); block(bx0 + 3, by); block(bx0 + 6, by);
      var bob = Math.round(Math.sin(t * 2.2)); // -1..1 stepped
      coin(bx0 + 3.25, by - 3.5 + bob * 0.5);

      // goal flag (right)
      flag(cols - 7, gt);

      // ground: grass top + soil with seams
      C(0, gt, cols, 1, P.grass);
      C(0, gt + 0.7, cols, 0.4, P.grassD);
      C(0, gt + 1, cols, rows - gt, P.soil);
      for (var x = 0; x < cols; x += 1) {
        // brick-free seam pattern: offset vertical seams
        var off = (Math.floor(x / 2) % 2);
        if (x % 4 === 0) C(x, gt + 1, 0.18, rows - gt, P.soilSh);
        if ((x + off) % 3 === 0) C(x, gt + 2 + off, 1, 0.18, P.seam);
      }
      C(0, gt + 1, cols, 0.25, P.soilHi);

      // sprite walking-bob (2 frame)
      var frame = Math.floor(t * 3) % 2 === 0 ? 0 : 1;
      sprite(Math.round(cols * 0.50), gt, frame);

      // bottom fade into the dark page
      var f = ctx.createLinearGradient(0, H * 0.82, 0, H);
      f.addColorStop(0, "rgba(" + P.ink + ",0)");
      f.addColorStop(1, "rgba(" + P.ink + ",1)");
      ctx.fillStyle = f; ctx.fillRect(0, H * 0.82, W, H * 0.18);
    }

    function resize() {
      var r = canvas.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      U = Math.max(4, Math.round(H / 108));
      render(performance.now());
    }

    function loop(now) {
      raf = requestAnimationFrame(loop);
      if (!running) return;
      if (now - last < 90) return; // ~11fps, chunky retro motion
      last = now; render(now);
    }

    var ro = ("ResizeObserver" in window) ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(canvas); else window.addEventListener("resize", resize);

    resize();
    render(performance.now());
    raf = requestAnimationFrame(loop);

    return {
      setAccent: function (hex) { P.coin = P.flag = P.body = hex; render(performance.now()); },
      pause: function () { running = false; },
      resume: function () { running = true; },
      destroy: function () {
        cancelAnimationFrame(raf);
        if (ro) ro.disconnect(); else window.removeEventListener("resize", resize);
      }
    };
  }

  window.BeyondScene = { mount: mount };
})();
