/* ============================================================
   Renderer — Canvas 2D drawing for all game entities
   ============================================================
   Draws: background grid, vault, threats (space-invader sprites),
          pickups (icon chips), projectiles, lasers, wave rings, effects.
   ============================================================ */
(function () {
  'use strict';

  var G = window.Game = window.Game || {};

  var canvas, ctx;
  var W, H;
  var dpr = 1;
  var stars = [];

  /* ========================================================
     SPACE INVADER SPRITE DEFINITIONS
     Each sprite is an array of strings.
     '#' = filled pixel, '.' = empty pixel.
     Sprites are drawn centered, scaled to fit the threat radius.
     ======================================================== */
  var SPRITES = {
    /* SHADOW_IT_APP — classic "crab" invader (unauthorized apps) */
    SHADOW_IT_APP: [
      '..#.....#..',
      '...#...#...',
      '..#######..',
      '.##.###.##.',
      '###########',
      '#.#######.#',
      '#.#.....#.#',
      '...##.##...'
    ],
    /* SHADOW_AI_BOT — robot/brain invader (rogue AI) */
    SHADOW_AI_BOT: [
      '...###...',
      '..#####..',
      '.#.#.#.#.',
      '.#######.',
      '..#.#.#..',
      '.#.#.#.#.',
      '#.#...#.#',
      '.#.....#.'
    ],
    /* WEAK_PASSWORD — virus/bacteria (vulnerability) */
    WEAK_PASSWORD: [
      '#...#...#',
      '.#.###.#.',
      '..#####..',
      '###.#.###',
      '..#####..',
      '.#.###.#.',
      '#...#...#'
    ],
    /* PHISHING — fast hook/lure invader */
    PHISHING: [
      '..#.#..',
      '.#####.',
      '##.#.##',
      '#######',
      '.#.#.#.',
      '#.....#'
    ],
    /* INSIDER_ANOMALY — large boss/skull invader */
    INSIDER_ANOMALY: [
      '..#######..',
      '.#########.',
      '##.##.##.##',
      '###########',
      '.###.#.###.',
      '..#.#.#.#..',
      '.#.......#.',
      '#..#...#..#'
    ]
  };

  /* Pre-parsed sprite data: { cols, rows, pixels[][] } */
  var _parsedSprites = {};

  function _parseSprites() {
    var types = Object.keys(SPRITES);
    for (var t = 0; t < types.length; t++) {
      var key = types[t];
      var rows = SPRITES[key];
      var parsed = { rows: rows.length, cols: rows[0].length, data: [] };
      for (var r = 0; r < rows.length; r++) {
        parsed.data[r] = [];
        for (var c = 0; c < rows[r].length; c++) {
          parsed.data[r][c] = rows[r][c] === '#' ? 1 : 0;
        }
      }
      _parsedSprites[key] = parsed;
    }
  }

  /* ========================================================
     POWER-UP ICON DRAWING FUNCTIONS
     Each draws a recognizable icon centered at (0,0) within size.
     ======================================================== */

  var POWERUP_ICONS = {
    /* Strong Password — Shield with lock */
    STRONG_PASSWORD: function (s) {
      // Shield outline
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.45);
      ctx.quadraticCurveTo(s * 0.45, -s * 0.35, s * 0.4, 0);
      ctx.quadraticCurveTo(s * 0.3, s * 0.35, 0, s * 0.48);
      ctx.quadraticCurveTo(-s * 0.3, s * 0.35, -s * 0.4, 0);
      ctx.quadraticCurveTo(-s * 0.45, -s * 0.35, 0, -s * 0.45);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Lock body
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-s * 0.12, -s * 0.02, s * 0.24, s * 0.18);
      // Lock shackle
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -s * 0.02, s * 0.1, Math.PI, 0);
      ctx.stroke();
    },

    /* MFA — Double shield / checkmark */
    MFA: function (s) {
      // Outer shield
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.42);
      ctx.quadraticCurveTo(s * 0.42, -s * 0.3, s * 0.38, 0);
      ctx.quadraticCurveTo(s * 0.25, s * 0.32, 0, s * 0.45);
      ctx.quadraticCurveTo(-s * 0.25, s * 0.32, -s * 0.38, 0);
      ctx.quadraticCurveTo(-s * 0.42, -s * 0.3, 0, -s * 0.42);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fill();
      ctx.stroke();
      // Checkmark
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-s * 0.18, s * 0.02);
      ctx.lineTo(-s * 0.04, s * 0.18);
      ctx.lineTo(s * 0.2, -s * 0.14);
      ctx.stroke();
    },

    /* SSO — Skeleton key */
    SSO: function (s) {
      // Key ring (circle at top)
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -s * 0.18, s * 0.16, 0, Math.PI * 2);
      ctx.stroke();
      // Key shaft
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.02);
      ctx.lineTo(0, s * 0.35);
      ctx.stroke();
      // Key teeth
      ctx.beginPath();
      ctx.moveTo(0, s * 0.2);
      ctx.lineTo(s * 0.12, s * 0.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, s * 0.3);
      ctx.lineTo(s * 0.1, s * 0.3);
      ctx.stroke();
      // Sparkles
      var sparkSize = s * 0.06;
      ctx.fillStyle = '#FFFFFF';
      _drawSparkle(s * 0.28, -s * 0.32, sparkSize);
      _drawSparkle(-s * 0.25, -s * 0.1, sparkSize * 0.7);
    },

    /* Password Manager — Vault door */
    PASSWORD_MANAGER: function (s) {
      // Vault circle
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.35, 0, Math.PI * 2);
      ctx.stroke();
      // Inner circle
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.2, 0, Math.PI * 2);
      ctx.stroke();
      // Handle/spokes
      for (var i = 0; i < 3; i++) {
        var a = (Math.PI * 2 / 3) * i - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * s * 0.2, Math.sin(a) * s * 0.2);
        ctx.lineTo(Math.cos(a) * s * 0.35, Math.sin(a) * s * 0.35);
        ctx.stroke();
      }
      // Center dot
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.05, 0, Math.PI * 2);
      ctx.fill();
    },

    /* IT Admin Dashboard — Monitor with chart */
    IT_ADMIN_DASHBOARD: function (s) {
      // Monitor frame
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      var mw = s * 0.6, mh = s * 0.4;
      ctx.strokeRect(-mw / 2, -mh / 2 - s * 0.06, mw, mh);
      // Stand
      ctx.beginPath();
      ctx.moveTo(0, mh / 2 - s * 0.06);
      ctx.lineTo(0, mh / 2 + s * 0.08);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-s * 0.15, mh / 2 + s * 0.08);
      ctx.lineTo(s * 0.15, mh / 2 + s * 0.08);
      ctx.stroke();
      // Bar chart inside
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-mw / 2 + s * 0.08, -s * 0.02, s * 0.08, s * 0.12);
      ctx.fillRect(-mw / 2 + s * 0.2, -s * 0.12, s * 0.08, s * 0.22);
      ctx.fillRect(-mw / 2 + s * 0.32, -s * 0.08, s * 0.08, s * 0.18);
    }
  };

  function _drawSparkle(x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y + size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - size, y);
    ctx.lineTo(x + size, y);
    ctx.stroke();
  }

  /* ---- Init ---- */
  function init(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    resize();
    _generateStars(120);
    _parseSprites();
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function getWidth() { return W; }
  function getHeight() { return H; }
  function getScale() { return Math.min(W, H) / 1080; }

  /* ---- Background ---- */
  function _generateStars(count) {
    stars = [];
    for (var i = 0; i < count; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        r: 0.5 + Math.random() * 1.5,
        a: 0.2 + Math.random() * 0.5,
        speed: 0.0002 + Math.random() * 0.0005
      });
    }
  }

  function drawBackground(time, reducedMotion) {
    ctx.fillStyle = '#060A12';
    ctx.fillRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = 'rgba(255, 23, 68, 0.04)';
    ctx.lineWidth = 1;
    var gridSize = 60 * getScale();
    if (gridSize < 20) gridSize = 20;
    for (var x = gridSize; x < W; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (var y = gridSize; y < H; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Stars
    if (!reducedMotion) {
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.x += s.speed;
        if (s.x > 1) s.x -= 1;
        var twinkle = 0.5 + 0.5 * Math.sin(time * 2 + i);
        ctx.fillStyle = 'rgba(255,255,255,' + (s.a * twinkle).toFixed(2) + ')';
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /* ---- Vault Core ---- */
  function drawVault(vault, time, scale) {
    var x = vault.x;
    var y = vault.y;
    var r = vault.radius * scale;

    // Outer glow rings
    var pulseA = 0.15 + 0.1 * Math.sin(time * 3);
    var pulseR = r * (1.8 + 0.15 * Math.sin(time * 2));

    ctx.beginPath();
    ctx.arc(x, y, pulseR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 23, 68, ' + (pulseA * 0.3).toFixed(3) + ')';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, r * 1.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 23, 68, ' + pulseA.toFixed(3) + ')';
    ctx.fill();

    // Shield ring
    ctx.beginPath();
    ctx.arc(x, y, r * 1.15, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 23, 68, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Rotating dashes on shield
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(time * 0.5);
    var dashCount = 12;
    for (var i = 0; i < dashCount; i++) {
      var angle = (Math.PI * 2 / dashCount) * i;
      var dashR = r * 1.15;
      ctx.beginPath();
      ctx.arc(0, 0, dashR, angle, angle + 0.15);
      ctx.strokeStyle = 'rgba(255, 100, 100, 0.4)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.restore();

    // Core circle
    var grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, '#FF4444');
    grad.addColorStop(0.6, '#D32F2F');
    grad.addColorStop(1, '#8B0000');
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Inner highlight
    ctx.beginPath();
    ctx.arc(x - r * 0.2, y - r * 0.2, r * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fill();

    // Lock icon in center
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold ' + Math.round(r * 0.7) + 'px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('\u{1F512}', x, y);

    // Shield flash (on damage)
    if (vault.shieldFlash > 0) {
      ctx.beginPath();
      ctx.arc(x, y, r * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 50, 50, ' + (vault.shieldFlash * 0.6).toFixed(2) + ')';
      ctx.fill();
    }

    // Integrity ring
    var intPct = Math.max(0, vault.integrity / vault.maxIntegrity);
    if (intPct < 1) {
      ctx.beginPath();
      ctx.arc(x, y, r * 1.3, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * intPct);
      var intColor = intPct > 0.5 ? '#4ECDC4' : intPct > 0.25 ? '#F39C12' : '#E74C3C';
      ctx.strokeStyle = intColor;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  /* ========================================================
     THREAT DRAWING — Space Invader pixel-art sprites
     ======================================================== */
  function drawThreat(thr, scale, time, colorBlind) {
    var x = thr.x;
    var y = thr.y;
    var r = thr.radius * scale;
    var color = colorBlind ? _cbColor(thr.type) : thr.color;

    var sprite = _parsedSprites[thr.type];
    if (!sprite) return;

    ctx.save();
    ctx.translate(x, y);

    // Glow aura behind sprite
    ctx.shadowColor = color;
    ctx.shadowBlur = 10 + Math.sin(time * 4 + thr.angle) * 3;

    // Calculate pixel size: fit sprite within radius * 2
    var spriteW = sprite.cols;
    var spriteH = sprite.rows;
    var maxDim = Math.max(spriteW, spriteH);
    var pixelSize = (r * 2) / maxDim;
    var offsetX = -(spriteW * pixelSize) / 2;
    var offsetY = -(spriteH * pixelSize) / 2;

    // Draw filled pixels
    ctx.fillStyle = color;
    for (var row = 0; row < sprite.rows; row++) {
      for (var col = 0; col < sprite.cols; col++) {
        if (sprite.data[row][col]) {
          ctx.fillRect(
            offsetX + col * pixelSize,
            offsetY + row * pixelSize,
            pixelSize + 0.5,  // +0.5 to avoid sub-pixel gaps
            pixelSize + 0.5
          );
        }
      }
    }

    // Bright "eye" pixels — draw lighter color on specific rows for detail
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    var eyeRow = Math.floor(sprite.rows * 0.35); // ~1/3 down
    for (var ec = 0; ec < sprite.cols; ec++) {
      if (sprite.data[eyeRow] && sprite.data[eyeRow][ec]) {
        ctx.fillRect(
          offsetX + ec * pixelSize,
          offsetY + eyeRow * pixelSize,
          pixelSize + 0.5,
          pixelSize + 0.5
        );
      }
    }

    ctx.shadowBlur = 0;

    // Animated "legs" wiggle — shift bottom row slightly
    var wiggle = Math.sin(time * 6 + thr.angle * 2) * pixelSize * 0.3;
    var lastRow = sprite.rows - 1;
    ctx.fillStyle = color;
    for (var bc = 0; bc < sprite.cols; bc++) {
      if (sprite.data[lastRow] && sprite.data[lastRow][bc]) {
        ctx.fillRect(
          offsetX + bc * pixelSize + wiggle,
          offsetY + lastRow * pixelSize,
          pixelSize + 0.5,
          pixelSize + 0.5
        );
      }
    }

    ctx.restore();

    // Hit flash overlay
    if (thr.hitFlash > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, thr.hitFlash * 5);
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(x, y, r * 1.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Frozen indicator (ice blue overlay + ring)
    if (thr.frozen) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#88DDFF';
      ctx.beginPath();
      ctx.arc(x, y, r + 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = '#88DDFF';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(x, y, r + 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function _cbColor(type) {
    var map = {
      'SHADOW_IT_APP': '#FFD700',
      'SHADOW_AI_BOT': '#FF00FF',
      'WEAK_PASSWORD': '#FF4444',
      'PHISHING': '#00BFFF',
      'INSIDER_ANOMALY': '#00FF7F'
    };
    return map[type] || '#FFFFFF';
  }

  /* ========================================================
     PICKUP CHIP DRAWING — Canvas-drawn icons
     ======================================================== */
  function drawPickup(pk, scale, time) {
    var x = pk.x;
    var y = pk.y;
    var r = pk.radius * scale;
    var bob = Math.sin(time * 3 + pk.bobPhase) * 4;

    ctx.save();
    ctx.translate(x, y + bob);

    // Outer glow
    ctx.shadowColor = pk.chipColor;
    ctx.shadowBlur = 14;

    // Chip body (rounded hexagonal shape for sci-fi feel)
    var hw = r * 1.3;
    var hh = r * 1.0;
    ctx.fillStyle = pk.chipColor;
    ctx.globalAlpha = 0.2;
    _roundRect(ctx, -hw, -hh, hw * 2, hh * 2, 8);
    ctx.fill();

    // Border with pulse
    var borderAlpha = 0.5 + Math.sin(time * 4 + pk.bobPhase) * 0.2;
    ctx.strokeStyle = pk.chipColor;
    ctx.lineWidth = 2;
    ctx.globalAlpha = borderAlpha;
    _roundRect(ctx, -hw, -hh, hw * 2, hh * 2, 8);
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Draw the icon using canvas paths
    var iconFn = POWERUP_ICONS[pk.type];
    if (iconFn) {
      ctx.save();
      iconFn(r * 1.6);
      ctx.restore();
    }

    ctx.restore();

    // HP indicator dots
    if (pk.hp > 0) {
      for (var i = 0; i < pk.hp; i++) {
        ctx.fillStyle = pk.chipColor;
        ctx.beginPath();
        ctx.arc(x - 4 + i * 8, y + bob + hh + 6, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Hit flash
    if (pk.hitFlash > 0) {
      ctx.save();
      ctx.globalAlpha = pk.hitFlash * 5;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(x, y + bob, r * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /* ---- Projectiles ---- */
  function drawProjectile(proj, scale) {
    if (!proj.alive) return;

    var x = proj.x;
    var y = proj.y;
    var tailX = x - Math.cos(proj.angle) * proj.length * scale;
    var tailY = y - Math.sin(proj.angle) * proj.length * scale;

    ctx.save();

    switch (proj.variant) {
      case 'STRONG_PASSWORD':
        ctx.strokeStyle = '#FF4444';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#FF4444';
        ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(x, y); ctx.stroke();
        break;

      case 'SSO':
        ctx.strokeStyle = '#45B7D1';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#45B7D1';
        ctx.shadowBlur = 5;
        ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(x, y); ctx.stroke();
        break;

      default:
        ctx.strokeStyle = '#FF8888';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#FF1744';
        ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(x, y); ctx.stroke();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
  }

  /* ---- MFA Laser ---- */
  function drawLaser(laser, vault, time) {
    if (!laser.alive) return;

    var maxLen = Math.max(W, H) * 1.5;
    var x1 = vault.x;
    var y1 = vault.y;
    var x2 = vault.x + Math.cos(laser.angle) * maxLen;
    var y2 = vault.y + Math.sin(laser.angle) * maxLen;

    var fadeIn = Math.min(1, laser.age * 5);
    var fadeOut = Math.min(1, (laser.duration - laser.age) * 3);
    var alpha = fadeIn * fadeOut;

    ctx.save();

    ctx.strokeStyle = 'rgba(78, 205, 196, ' + (alpha * 0.3).toFixed(3) + ')';
    ctx.lineWidth = laser.width * 4;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

    ctx.strokeStyle = 'rgba(78, 205, 196, ' + alpha.toFixed(3) + ')';
    ctx.lineWidth = laser.width;
    ctx.shadowColor = '#4ECDC4';
    ctx.shadowBlur = 15;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, ' + (alpha * 0.7).toFixed(3) + ')';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

    var shimmer = Math.sin(time * 20) * 0.2;
    ctx.strokeStyle = 'rgba(255, 255, 255, ' + (shimmer * alpha).toFixed(3) + ')';
    ctx.lineWidth = laser.width * 2;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

    ctx.restore();
  }

  /* ---- Wave Ring ---- */
  function drawWaveRing(ring, time) {
    if (!ring.alive) return;

    var alpha = Math.max(0, 1 - ring.radius / ring.maxRadius);
    ctx.save();

    ctx.strokeStyle = 'rgba(150, 206, 180, ' + (alpha * 0.2).toFixed(3) + ')';
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.arc(ring.cx, ring.cy, ring.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(150, 206, 180, ' + (alpha * 0.7).toFixed(3) + ')';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(ring.cx, ring.cy, ring.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, ' + (alpha * 0.4).toFixed(3) + ')';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(ring.cx, ring.cy, ring.radius - 3, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  /* ---- Effects ---- */
  function drawEffect(effect) {
    if (!effect.alive) return;

    var progress = effect.age / effect.duration;
    var alpha = 1 - progress;

    if (effect.type === 'explosion') {
      for (var i = 0; i < effect.particles.length; i++) {
        var p = effect.particles[i];
        ctx.fillStyle = effect.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * (1 - progress * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else if (effect.type === 'text') {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = effect.color;
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(effect.text, effect.x, effect.y - progress * 30);
      ctx.restore();
    } else if (effect.type === 'pickup_flash') {
      ctx.save();
      ctx.globalAlpha = alpha * 0.5;
      ctx.fillStyle = effect.color;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, 40 * (1 + progress), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /* ---- IT Admin Dashboard overlay ---- */
  function drawAdminOverlay(time, alpha) {
    ctx.save();

    // Ice blue screen tint
    ctx.globalAlpha = alpha * 0.06;
    ctx.fillStyle = '#88DDFF';
    ctx.fillRect(0, 0, W, H);

    // Frost grid
    ctx.globalAlpha = alpha * 0.08;
    ctx.strokeStyle = '#88DDFF';
    ctx.lineWidth = 0.5;

    var spacing = 40;
    for (var x = 0; x < W; x += spacing) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (var y = 0; y < H; y += spacing) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Frost sweep line
    var sweepY = (time * 40) % H;
    ctx.globalAlpha = alpha * 0.2;
    ctx.fillStyle = '#88DDFF';
    ctx.fillRect(0, sweepY - 3, W, 6);

    ctx.restore();
  }

  /* ---- Aim indicator ---- */
  function drawAimIndicator(vault, aimAngle, scale) {
    var r = vault.radius * scale * 1.4;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(
      vault.x + Math.cos(aimAngle) * (vault.radius * scale),
      vault.y + Math.sin(aimAngle) * (vault.radius * scale)
    );
    ctx.lineTo(
      vault.x + Math.cos(aimAngle) * (r + 30),
      vault.y + Math.sin(aimAngle) * (r + 30)
    );
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1.5;
    var cx = vault.x + Math.cos(aimAngle) * (r + 20);
    var cy = vault.y + Math.sin(aimAngle) * (r + 20);
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  /* ---- Clear ---- */
  function clear() {
    ctx.clearRect(0, 0, W, H);
  }

  /* ---- Expose ---- */
  G.Renderer = {
    init: init,
    resize: resize,
    clear: clear,
    getWidth: getWidth,
    getHeight: getHeight,
    getScale: getScale,
    drawBackground: drawBackground,
    drawVault: drawVault,
    drawThreat: drawThreat,
    drawPickup: drawPickup,
    drawProjectile: drawProjectile,
    drawLaser: drawLaser,
    drawWaveRing: drawWaveRing,
    drawEffect: drawEffect,
    drawAdminOverlay: drawAdminOverlay,
    drawAimIndicator: drawAimIndicator
  };
})();
