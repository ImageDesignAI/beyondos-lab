/* =========================================================================
   BeyondField — a game-flavored generative glyph field.
   A drifting tilemap of monospace glyphs lit by a slow flow field, with a
   cursor spotlight. BeyondOS's answer to a research-lab ASCII background.
   Public API:
     const f = BeyondField.mount(canvas, opts)
     f.set({ cell, density, motion, glyphs, accent })
     f.destroy()
   ========================================================================= */
(function () {
  "use strict";

  // Glyph sets — "tilemap" reads like a level editor / action grid.
  var GLYPH_SETS = {
    tilemap: "·.:+=*#%▚▞▘▝░▒▓■◆▲►▼◄●○".split(""),
    arrows:  "·.˙←↑→↓↖↗↘↙▲►▼◄↻↺".split(""),
    pixels:  "·.▖▗▘▝▚▞▙▟▛▜█░▒▓".split(""),
    binary:  "·.01<>/\\|-_=+*".split("")
  };

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  // Cheap, smooth value-ish noise from layered sines. Deterministic, fast.
  function flow(x, y, t) {
    var a = Math.sin(x * 0.045 + t * 0.27) + Math.sin(y * 0.052 - t * 0.19);
    var b = Math.sin((x + y) * 0.028 + t * 0.16) + Math.sin((x - y) * 0.037 - t * 0.21);
    var c = Math.sin(Math.hypot(x - 0.0, y - 0.0) * 0.02 - t * 0.12);
    return (a + b * 0.7 + c * 0.5) / 3.2; // ~ -1..1
  }

  function mount(canvas, opts) {
    opts = opts || {};
    var ctx = canvas.getContext("2d", { alpha: true });
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    var state = {
      cell:    opts.cell    || 17,    // px between glyph centers
      density: opts.density != null ? opts.density : 0.62, // base brightness 0..1
      motion:  opts.motion  != null ? opts.motion  : 1,    // 0 = still
      glyphs:  opts.glyphs  || "tilemap",
      accent:  opts.accent  || "106 187 141", // rgb triplet string
      ink:     opts.ink     || "245 245 247",
      bg:      opts.bg      || null,           // if set, paints a backdrop
      running: true
    };

    var W = 0, H = 0, cols = 0, rows = 0;
    var pointer = { x: -9999, y: -9999, on: false };
    var t0 = performance.now();
    var lastDraw = 0;
    var raf = 0;

    function resize() {
      var r = canvas.getBoundingClientRect();
      W = Math.max(1, Math.floor(r.width));
      H = Math.max(1, Math.floor(r.height));
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(W / state.cell) + 1;
      rows = Math.ceil(H / state.cell) + 1;
      if (typeof render === "function") render(performance.now());
    }

    function render(now) {
      var t = state.motion ? ((now - t0) * 0.001 * state.motion) : 4.2;
      ctx.clearRect(0, 0, W, H);
      if (state.bg) { ctx.fillStyle = "rgb(" + state.bg + ")"; ctx.fillRect(0, 0, W, H); }

      var set = GLYPH_SETS[state.glyphs] || GLYPH_SETS.tilemap;
      var n = set.length;
      var cs = state.cell;
      ctx.font = (cs - 4) + "px " + (opts.font || "'Geist Mono', ui-monospace, monospace");
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      var pr = pointer.on ? 150 : -1; // spotlight radius
      var pr2 = pr * pr;

      for (var gy = 0; gy < rows; gy++) {
        for (var gx = 0; gx < cols; gx++) {
          var px = gx * cs + cs * 0.5;
          var py = gy * cs + cs * 0.5;

          var v = flow(gx, gy, t);          // -1..1
          var lvl = (v + 1) * 0.5;           // 0..1
          // bias by density
          lvl = clamp(lvl * (0.45 + state.density), 0, 1);

          // cursor spotlight lift
          var lift = 0;
          if (pr > 0) {
            var dx = px - pointer.x, dy = py - pointer.y;
            var d2 = dx * dx + dy * dy;
            if (d2 < pr2) lift = (1 - d2 / pr2) * 0.9;
          }
          var b = clamp(lvl + lift, 0, 1);

          if (b < 0.14) continue; // leave low cells empty -> airy negative space

          var gi = Math.min(n - 1, Math.floor(b * n * 0.999));
          var ch = set[gi];

          // colour: mostly ink, brightest + spotlight tinted accent
          var alpha, color;
          if (lift > 0.2 || b > 0.84) {
            alpha = clamp(0.42 + b * 0.55, 0, 1);
            color = "rgba(" + state.accent + "," + alpha.toFixed(3) + ")";
          } else {
            alpha = (b - 0.14) * 0.85; // faint
            color = "rgba(" + state.ink + "," + alpha.toFixed(3) + ")";
          }
          ctx.fillStyle = color;
          ctx.fillText(ch, px, py);
        }
      }
    }

    function loop(now) {
      raf = requestAnimationFrame(loop);
      if (!state.running) return;
      if (now - lastDraw < 27) return; // ~36fps cap
      lastDraw = now;
      render(now);
    }

    function onMove(e) {
      var r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.on = true;
    }
    function onLeave() { pointer.on = false; pointer.x = pointer.y = -9999; }

    var ro = ("ResizeObserver" in window) ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(canvas); else window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    canvas.addEventListener("pointerleave", onLeave);

    resize();
    render(performance.now()); // guaranteed first paint (rAF may be paused when backgrounded)
    raf = requestAnimationFrame(loop);

    return {
      set: function (patch) {
        var reflow = patch.cell != null && patch.cell !== state.cell;
        Object.assign(state, patch);
        if (reflow) resize();
      },
      get: function () { return Object.assign({}, state); },
      pause: function () { state.running = false; },
      resume: function () { state.running = true; },
      destroy: function () {
        cancelAnimationFrame(raf);
        if (ro) ro.disconnect(); else window.removeEventListener("resize", resize);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerdown", onMove);
        canvas.removeEventListener("pointerleave", onLeave);
      }
    };
  }

  window.BeyondField = { mount: mount, GLYPH_SETS: GLYPH_SETS };
})();
