/* =========================================================================
   BeyondFlappy — an ORIGINAL endless-flyer pixel scene (Flappy-genre, not
   Flappy Bird's art). A little mint bird flaps between gapped pillars over a
   day sky; columns + ground scroll. Sits below the glyph field in a panel.
     BeyondFlappy.mount(canvas, { accent: "#6abb8d" })
   ========================================================================= */
(function () {
  "use strict";

  function mount(canvas, opts) {
    opts = opts || {};
    var ctx = canvas.getContext("2d", { alpha: true });
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, U = 5;
    var t0 = performance.now(), raf = 0, last = 0, running = true;

    var P = {
      colA: opts.accent || "#6abb8d", colD: "#2c7050", colHi: "#9fe0bf",
      bird: opts.accent || "#6abb8d", belly: "#cdeede", beak: "#fcd573", eye: "#14141a",
      cloud: "#eaf3ff", grass: "#5ec46f", grassD: "#3a9a52", soil: "#a9612c", soilSh: "#7c4419"
    };

    function R(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.ceil(w), Math.ceil(h)); }
    function C(cx, cy, cw, ch, c) { R(cx * U, cy * U, cw * U, ch * U, c); }

    function cloud(bx, by) {
      C(bx + 3, by, 4, 1, P.cloud); C(bx + 1, by + 1, 8, 1, P.cloud); C(bx, by + 2, 10, 1, P.cloud);
    }

    function pillar(cx, topRows, gapTop, gapBot, groundTop) {
      // top segment
      if (gapTop > topRows) {
        C(cx, topRows, 3, gapTop - topRows, P.colA);
        C(cx, topRows, 0.7, gapTop - topRows, P.colHi);
        C(cx + 2.3, topRows, 0.7, gapTop - topRows, P.colD);
        C(cx - 0.5, gapTop - 1.4, 4, 1.4, P.colA);      // cap
        C(cx - 0.5, gapTop - 1.4, 4, 0.5, P.colHi);
        C(cx - 0.5, gapTop - 0.4, 4, 0.4, P.colD);
      }
      // bottom segment
      if (groundTop > gapBot) {
        C(cx, gapBot, 3, groundTop - gapBot, P.colA);
        C(cx, gapBot, 0.7, groundTop - gapBot, P.colHi);
        C(cx + 2.3, gapBot, 0.7, groundTop - gapBot, P.colD);
        C(cx - 0.5, gapBot, 4, 1.4, P.colA);            // cap
        C(cx - 0.5, gapBot, 4, 0.5, P.colHi);
        C(cx - 0.5, gapBot + 1, 4, 0.4, P.colD);
      }
    }

    function bird(cx, cy, flap) {
      // body 6x5, original mint bird
      C(cx + 1, cy, 4, 1, P.bird);
      C(cx, cy + 1, 6, 3, P.bird);
      C(cx + 1, cy + 4, 4, 1, P.bird);
      C(cx, cy + 2.4, 4, 1.4, P.belly);     // belly
      C(cx + 4, cy + 1.4, 1.4, 1.4, P.eye); // eye
      C(cx + 5.6, cy + 2, 1.6, 1, P.beak);  // beak
      // wing flaps up/down
      if (flap) C(cx + 1, cy - 1, 2.4, 1.4, P.colD);
      else C(cx + 1, cy + 3.4, 2.4, 1.4, P.colD);
    }

    function render(now) {
      var t = (now - t0) * 0.001;
      var cols = Math.ceil(W / U), rows = Math.ceil(H / U);
      var groundTop = rows - 4;

      // sky
      var g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#3367c4"); g.addColorStop(0.6, "#5d8fe0"); g.addColorStop(1, "#9bc1ef");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      // clouds (slow)
      var cspan = cols + 14, cd = (t * 1.6) % cspan;
      cloud(((cols * 0.2 - cd) % cspan + cspan) % cspan - 6, Math.round(rows * 0.16));
      cloud(((cols * 0.7 - cd) % cspan + cspan) % cspan - 6, Math.round(rows * 0.26));

      // scrolling pillars
      var spacing = 15;                 // cells between pillars
      var speed = 6.5;                  // cells / sec
      var scroll = t * speed;
      var first = Math.floor(scroll / spacing);
      for (var k = first; k < first + Math.ceil(cols / spacing) + 2; k++) {
        var sx = k * spacing - scroll;  // screen cell x
        if (sx < -4 || sx > cols + 4) continue;
        // deterministic gap center per pillar
        var gc = Math.round(rows * (0.42 + 0.20 * Math.sin(k * 1.7) ));
        var gapH = 8;
        pillar(sx, 0, gc - gapH / 2, gc + gapH / 2, groundTop);
      }

      // bird — fixed x, bobbing sine path, 2-frame flap
      var bx = Math.round(cols * 0.30);
      var by = rows * 0.44 + Math.sin(t * 3.1) * (rows * 0.10);
      bird(bx, by, Math.floor(t * 6) % 2 === 0);

      // ground (scrolls)
      C(0, groundTop, cols, 1, P.grass);
      C(0, groundTop + 0.7, cols, 0.4, P.grassD);
      C(0, groundTop + 1, cols, rows - groundTop, P.soil);
      var gsc = (t * speed) % 4;
      for (var x = -4; x < cols; x += 4) C(x - gsc, groundTop + 2, 0.4, rows - groundTop, P.soilSh);

      // bottom fade into the panel
      var f = ctx.createLinearGradient(0, H * 0.8, 0, H);
      f.addColorStop(0, "rgba(20,21,26,0)"); f.addColorStop(1, "rgba(20,21,26,.85)");
      ctx.fillStyle = f; ctx.fillRect(0, H * 0.8, W, H * 0.2);
    }

    function resize() {
      var r = canvas.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      U = Math.max(4, Math.round(H / 84));
      render(performance.now());
    }
    function loop(now) {
      raf = requestAnimationFrame(loop);
      if (!running) return;
      if (now - last < 70) return; // chunky retro fps
      last = now; render(now);
    }

    var ro = ("ResizeObserver" in window) ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(canvas); else window.addEventListener("resize", resize);
    resize(); render(performance.now()); raf = requestAnimationFrame(loop);

    return {
      setAccent: function (hex) { P.colA = P.bird = hex; render(performance.now()); },
      pause: function () { running = false; },
      resume: function () { running = true; },
      destroy: function () {
        cancelAnimationFrame(raf);
        if (ro) ro.disconnect(); else window.removeEventListener("resize", resize);
      }
    };
  }

  window.BeyondFlappy = { mount: mount };
})();
