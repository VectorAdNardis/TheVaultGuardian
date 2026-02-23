/* ============================================================
   Main — Game loop, initialization, audio, state orchestration
   ============================================================
   Entry point. Loads config, wires modules, runs the loop.
   ============================================================ */
(function () {
  'use strict';

  var G = window.Game;

  /* ---- Runtime state ---- */
  var cfg = null;
  var isDemo = false;
  var vault = null;
  var threats = [];
  var pickups = [];
  var projectiles = [];
  var lasers = [];
  var waveRings = [];
  var effects = [];
  var activePowerups = [];
  var inventory = {};        // { 'STRONG_PASSWORD': 2, 'MFA': 0, ... } — count per type
  var shownPopups = {};      // { 'STRONG_PASSWORD': true, ... } — show-once per session

  // Fixed display order for weapon bar (maps to keys 1-5)
  var POWERUP_ORDER = ['STRONG_PASSWORD', 'SSO', 'MFA', 'PASSWORD_MANAGER', 'IT_ADMIN_DASHBOARD'];

  var gameTime = 0;       // total elapsed game time (seconds)
  var timeLeft = 0;       // countdown (seconds)
  var fireCooldown = 0;
  var idleTimer = 0;
  var summaryIdleTimer = 0;
  var lastFrameTime = 0;
  var running = false;

  // Powerup popup state
  var popupActive = false;
  var popupTimer = 0;
  var popupData = null;   // { type, label, chipColor, description }

  // Settings
  var audioEnabled = false;
  var colorBlindMode = false;
  var reducedMotion = false;

  // Audio context (lazy init)
  var audioCtx = null;

  /* ==== Configuration Loading ==== */

  // Default config embedded for file:// fallback
  var DEFAULT_CONFIG = null; // will be set from JSON or inline

  function loadConfig(callback) {
    // Try fetching the JSON config file
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', 'config/game-config.json', true);
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status === 200 || xhr.status === 0) {
            try {
              cfg = JSON.parse(xhr.responseText);
              callback();
              return;
            } catch (e) {
              console.warn('Config parse error, using defaults.', e);
            }
          }
          // Fallback: use inline defaults
          cfg = _inlineDefaults();
          callback();
        }
      };
      xhr.send();
    } catch (e) {
      cfg = _inlineDefaults();
      callback();
    }
  }

  function _inlineDefaults() {
    // Minimal fallback if JSON can't be loaded
    return {
      durationSeconds: 150,
      vaultRadius: 40,
      vaultIntegrity: 100,
      popupDurationSeconds: 6,
      maxInventorySlots: 5,
      waves: [
        { name: 'Recon', duration: 30, spawnInterval: 3.5, enemies: ['WEAK_PASSWORD'], speedMultiplier: 0.45 },
        { name: 'Infiltration', duration: 30, spawnInterval: 2.8, enemies: ['WEAK_PASSWORD', 'SHADOW_IT_APP'], speedMultiplier: 0.55 },
        { name: 'Escalation', duration: 30, spawnInterval: 2.2, enemies: ['SHADOW_IT_APP', 'SHADOW_AI_BOT', 'WEAK_PASSWORD'], speedMultiplier: 0.7 },
        { name: 'Assault', duration: 30, spawnInterval: 1.6, enemies: ['SHADOW_IT_APP', 'SHADOW_AI_BOT', 'WEAK_PASSWORD', 'PHISHING'], speedMultiplier: 0.85 },
        { name: 'Full Breach', duration: 30, spawnInterval: 1.0, enemies: ['SHADOW_IT_APP', 'SHADOW_AI_BOT', 'WEAK_PASSWORD', 'PHISHING', 'INSIDER_ANOMALY'], speedMultiplier: 1.1 }
      ],
      pickupSpawnInterval: 10, pickupSpawnVariance: 3, maxActivePowerups: 2,
      colorBlindMode: false, reducedMotion: false, audioEnabled: false,
      brandColors: { red: '#D32F2F', dark: '#0A0E17', accent: '#FF1744', bg: '#060A12' },
      rankThresholds: [
        { min: 0, rank: 'Novice' }, { min: 50, rank: 'Analyst' },
        { min: 100, rank: 'Guardian' }, { min: 150, rank: 'Sentinel' },
        { min: 220, rank: 'Zero-Knowledge Master' }
      ],
      enemies: {
        WEAK_PASSWORD: { color: '#E74C3C', speedMin: 1.8, speedMax: 2.4, damage: 6, hp: 1, radius: 14, shape: 'invader', label: 'Bad Password', category: 'Bad Passwords' },
        SHADOW_IT_APP: { color: '#F39C12', speedMin: 1.6, speedMax: 2.2, damage: 9, hp: 2, radius: 16, shape: 'invader', label: 'Phishing', category: 'Phishing Attacks' },
        SHADOW_AI_BOT: { color: '#9B59B6', speedMin: 1.2, speedMax: 1.6, damage: 8, hp: 3, radius: 18, shape: 'invader', label: 'Shadow IT', category: 'Shadow IT Apps' },
        PHISHING: { color: '#3498DB', speedMin: 0.9, speedMax: 1.3, damage: 12, hp: 4, radius: 20, shape: 'invader', label: 'Third Party', category: 'Third Party Risks' },
        INSIDER_ANOMALY: { color: '#2ECC71', speedMin: 0.6, speedMax: 1.0, damage: 15, hp: 5, radius: 22, shape: 'invader', label: 'Hacker', category: 'Hackers' }
      },
      powerups: {
        STRONG_PASSWORD: { icon: 'SP', durationSeconds: 10, rarity: 0.3, label: 'Strong Password', chipColor: '#FF6B6B', type: 'weapon', priority: 1, description: 'Strong, unique passwords are your first line of defense. A password manager generates and stores complex passwords so you never have to remember them.' },
        MFA: { icon: 'MF', durationSeconds: 8, rarity: 0.2, label: 'Multi-Factor Auth', chipColor: '#4ECDC4', type: 'weapon', priority: 3, description: 'MFA blocks 99.9% of automated attacks. Even if a password is stolen, multi-factor authentication stops unauthorized access cold.' },
        SSO: { icon: 'SS', durationSeconds: 8, rarity: 0.2, label: 'Single Sign-On', chipColor: '#45B7D1', type: 'weapon', priority: 2, description: 'One secure login for all your apps. Single Sign-On eliminates password fatigue and reduces attack surfaces across your organization.' },
        PASSWORD_MANAGER: { icon: 'PM', durationSeconds: 7, rarity: 0.15, label: 'Password Manager', chipColor: '#96CEB4', type: 'weapon', priority: 4, description: 'Password reuse is the #1 cause of breaches. A password manager secures every credential and eliminates the risk automatically.' },
        IT_ADMIN_DASHBOARD: { icon: 'IT', durationSeconds: 5, rarity: 0.15, label: 'SaaS Monitoring & Protect', chipColor: '#FFEAA7', type: 'tool', priority: 0, description: 'Freeze all threats! SaaS Monitoring reveals Shadow IT, enforces security policies, and stops threats cold across your organization.' }
      },
      baseEnemySpeed: 60, projectileSpeed: 1000, projectileDamage: 1,
      fireRate: 0.15, idleTimeoutSeconds: 20, attractResetSeconds: 15,
      leaderboardSize: 10, initialsTimeoutSeconds: 5,
      demo: { waveDuration: 5, spawnIntervalMultiplier: 0.6, pickupSpawnInterval: 3, speedMultiplier: 0.8 }
    };
  }

  /* ==== Initialization ==== */

  function boot() {
    // Check demo mode
    isDemo = /[?&]demo=1/.test(window.location.search);
    if (isDemo) console.log('[DEMO] Demo mode active');

    loadConfig(function () {
      // Apply config settings
      audioEnabled = cfg.audioEnabled;
      colorBlindMode = cfg.colorBlindMode;
      reducedMotion = cfg.reducedMotion;

      // Init modules
      var canvas = document.getElementById('game-canvas');
      G.Renderer.init(canvas);
      G.Input.init(canvas);
      G.HUD.init();
      G.HUD.onInventoryUse(_useInventoryItem);
      G.Leaderboard.init();
      G.Leaderboard.initClearControl();
      G.Leaderboard.onRestart(function () {
        if (G.State.is(G.State.STATES.SUMMARY)) {
          toAttract();
          startGame();
        }
      });
      G.Screens.init();

      // Wire controls
      _initControls();

      // Resize handler
      window.addEventListener('resize', function () {
        G.Renderer.resize();
      });

      // Start in attract mode
      G.State.set(G.State.STATES.ATTRACT);
      G.Screens.showAttract();
      G.HUD.hide();

      // Start loop
      running = true;
      lastFrameTime = performance.now();
      requestAnimationFrame(loop);

      if (isDemo) console.log('[DEMO] Config loaded, game booted.');
    });
  }

  function _initControls() {
    // Sound toggle
    var muteBtn = document.getElementById('btn-mute');
    if (muteBtn) {
      muteBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        audioEnabled = !audioEnabled;
        muteBtn.textContent = audioEnabled ? 'Sound: On' : 'Sound: Off';
        muteBtn.classList.toggle('active', audioEnabled);
      });
    }

    // Attract screen click — start game
    var attractEl = document.getElementById('attract-screen');
    if (attractEl) {
      attractEl.addEventListener('click', function () {
        if (G.State.is(G.State.STATES.ATTRACT)) {
          startGame();
        }
      });
      attractEl.addEventListener('touchstart', function (e) {
        e.preventDefault();
        if (G.State.is(G.State.STATES.ATTRACT)) {
          startGame();
        }
      });
    }

    // Summary screen click — return to attract
    var summaryEl = document.getElementById('summary-screen');
    if (summaryEl) {
      summaryEl.addEventListener('click', function () {
        if (G.State.is(G.State.STATES.SUMMARY)) {
          toAttract();
        }
      });
    }

    // Popup dismiss on click/tap
    var popupEl = document.getElementById('powerup-popup');
    if (popupEl) {
      popupEl.addEventListener('click', function () {
        _dismissPopup();
      });
      popupEl.addEventListener('touchstart', function (e) {
        e.preventDefault();
        _dismissPopup();
      });
    }

    // Keyboard start + inventory shortcuts
    window.addEventListener('keydown', function (e) {
      // Dismiss popup on any key
      if (popupActive) {
        _dismissPopup();
        return;
      }
      if (e.code === 'Space' || e.code === 'Enter') {
        if (G.State.is(G.State.STATES.ATTRACT)) {
          startGame();
        }
      }
      // Number keys 1-5 to use inventory items (mapped to POWERUP_ORDER)
      if (G.State.is(G.State.STATES.PLAYING)) {
        var keyNum = parseInt(e.key, 10);
        if (keyNum >= 1 && keyNum <= 5 && POWERUP_ORDER[keyNum - 1]) {
          _useInventoryItem(POWERUP_ORDER[keyNum - 1]);
        }
        // Debug shortcuts: W = instant win, L = instant loss
        if (e.code === 'KeyW' && e.shiftKey) {
          endGame(true);
        }
        if (e.code === 'KeyL' && e.shiftKey) {
          vault.integrity = 0;
          endGame(false);
        }
      }
    });
  }

  /* ==== Game Start / Reset ==== */

  function startGame() {
    var W = G.Renderer.getWidth();
    var H = G.Renderer.getHeight();

    vault = G.Entities.createVault(W / 2, H / 2);
    vault.integrity = cfg.vaultIntegrity;
    vault.maxIntegrity = cfg.vaultIntegrity;
    vault.radius = cfg.vaultRadius;

    threats = [];
    pickups = [];
    projectiles = [];
    lasers = [];
    waveRings = [];
    effects = [];
    activePowerups = [];
    inventory = {};

    gameTime = 0;
    timeLeft = cfg.durationSeconds;
    fireCooldown = 0;
    idleTimer = 0;
    popupActive = false;
    popupTimer = 0;
    popupData = null;
    summaryIdleTimer = 0;

    G.Scoring.reset();
    G.Spawner.reset(cfg, isDemo);
    G.Input.reset();

    G.State.set(G.State.STATES.PLAYING);
    G.Screens.hideAttract();
    G.Screens.hideSummary();
    G.Screens.hideInitials();
    G.Leaderboard.hide();
    G.HUD.show();

    // Show tutorial briefly
    G.Screens.showTutorial(3000);

    if (isDemo) console.log('[DEMO] Game started');
  }

  function endGame(survived) {
    G.State.set(G.State.STATES.SUMMARY);
    G.HUD.hide();

    var timeBonus = 0;
    if (survived) {
      timeBonus = G.Scoring.addTimeBonus(timeLeft);
    }

    var score = G.Scoring.getScore();
    var rank = G.Scoring.getRank(cfg);

    if (isDemo) {
      console.log('[DEMO] Game ended. Survived:', survived, 'Score:', score, 'Rank:', rank);
    }

    // Prompt initials then show summary + leaderboard
    G.Screens.promptInitials(cfg.initialsTimeoutSeconds, function (initials) {
      G.Leaderboard.addEntry(initials, score, rank);

      G.Screens.showSummary({
        score: score,
        rank: rank,
        integrity: vault.integrity,
        maxIntegrity: vault.maxIntegrity,
        kills: G.Scoring.getKills(),
        killsByType: G.Scoring.getKillsByType(),
        enemyCfg: cfg.enemies,
        timeLeft: timeLeft,
        timeBonus: timeBonus,
        survived: survived
      });

      G.Leaderboard.show(score, {
        killsByType: G.Scoring.getKillsByType(),
        enemyCfg: cfg.enemies,
        survived: survived
      });
      summaryIdleTimer = 0;
    });
  }

  function toAttract() {
    G.State.set(G.State.STATES.ATTRACT);
    G.Screens.showAttract();
    G.Screens.hideSummary();
    G.Screens.hideInitials();
    G.Leaderboard.hide();
    G.HUD.hide();
  }

  /* ==== Audio (WebAudio synthesis) ==== */

  function _ensureAudio() {
    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { /* no audio */ }
    }
    return audioCtx;
  }

  function playSound(type) {
    if (!audioEnabled) return;
    var ctx = _ensureAudio();
    if (!ctx) return;

    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    var now = ctx.currentTime;

    switch (type) {
      case 'shoot':
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
        break;

      case 'hit':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;

      case 'kill':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.12);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;

      case 'pickup':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.setValueAtTime(600, now + 0.06);
        osc.frequency.setValueAtTime(800, now + 0.12);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;

      case 'expire':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.2);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;

      case 'vault_hit':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
        break;

      case 'wave_start':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
        break;

      case 'game_over':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.6);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
        break;

      case 'laser':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
    }
  }

  /* ==== Weapon System ==== */

  /* Determine current active weapon variant based on powerup priority.
     PASSWORD_MANAGER (4) > MFA (3) > SSO (2) > STRONG_PASSWORD (1) > DEFAULT (0) */
  function getActiveWeapon() {
    var best = null;
    var bestPrio = -1;
    for (var i = 0; i < activePowerups.length; i++) {
      var pu = activePowerups[i];
      if (pu.powerupType === 'weapon' && pu.priority > bestPrio) {
        best = pu;
        bestPrio = pu.priority;
      }
    }
    return best ? best.type : 'DEFAULT';
  }

  /* Check if IT Admin Dashboard is active (slow effect) */
  function hasAdminDashboard() {
    for (var i = 0; i < activePowerups.length; i++) {
      if (activePowerups[i].type === 'IT_ADMIN_DASHBOARD') return true;
    }
    return false;
  }

  /* Fire weapon from vault */
  function fireWeapon(aimAngle) {
    var W = G.Renderer.getWidth();
    var H = G.Renderer.getHeight();
    var scale = G.Renderer.getScale();
    var weapon = getActiveWeapon();
    var speed = cfg.projectileSpeed * scale;

    switch (weapon) {
      case 'STRONG_PASSWORD':
        // Twin beams with slight angle spread
        var spread = 0.08; // ~4.5 degrees
        projectiles.push(G.Entities.createProjectile(vault.x, vault.y, aimAngle - spread, speed, 'STRONG_PASSWORD'));
        projectiles.push(G.Entities.createProjectile(vault.x, vault.y, aimAngle + spread, speed, 'STRONG_PASSWORD'));
        playSound('shoot');
        break;

      case 'SSO':
        // Persistent laser line
        lasers.push(G.Entities.createLaser(aimAngle, 2.5, 'SSO'));
        playSound('laser');
        break;

      case 'MFA':
        // Shotgun cone burst (7 beams in ~40 degree spread)
        var count = 7;
        var totalSpread = 0.35; // ~20 degrees each side
        for (var i = 0; i < count; i++) {
          var a = aimAngle - totalSpread + (totalSpread * 2 / (count - 1)) * i;
          var s = speed * (0.85 + Math.random() * 0.3);
          projectiles.push(G.Entities.createProjectile(vault.x, vault.y, a, s, 'MFA'));
        }
        playSound('shoot');
        break;

      case 'PASSWORD_MANAGER':
        // Expanding ring wave
        var maxR = Math.max(W, H) * 0.7;
        waveRings.push(G.Entities.createWaveRing(vault.x, vault.y, maxR));
        playSound('shoot');
        break;

      default:
        // Single default beam
        projectiles.push(G.Entities.createProjectile(vault.x, vault.y, aimAngle, speed, 'DEFAULT'));
        playSound('shoot');
    }
  }

  /* ==== Main Loop ==== */

  function loop(timestamp) {
    if (!running) return;

    var dt = Math.min((timestamp - lastFrameTime) / 1000, 0.05); // cap at 50ms
    lastFrameTime = timestamp;
    gameTime += dt;

    var state = G.State.get();

    // ---- ATTRACT ----
    if (state === G.State.STATES.ATTRACT) {
      updateAttract(dt);
      renderAttract();
    }

    // ---- PLAYING ----
    else if (state === G.State.STATES.PLAYING) {
      if (popupActive) {
        // Game is paused for power-up popup — wait for user click to continue
        renderPlaying();
      } else {
        updatePlaying(dt);
        renderPlaying();
      }
    }

    // ---- SUMMARY ----
    else if (state === G.State.STATES.SUMMARY) {
      summaryIdleTimer += dt;
      renderAttract(); // keep background animated
      if (summaryIdleTimer >= cfg.attractResetSeconds) {
        toAttract();
      }
    }

    requestAnimationFrame(loop);
  }

  /* ---- Attract Mode Update ---- */
  function updateAttract(dt) {
    // Just animate background; no game logic
  }

  function renderAttract() {
    G.Renderer.clear();
    G.Renderer.drawBackground(gameTime, reducedMotion);

    // Draw a demo vault in center
    var W = G.Renderer.getWidth();
    var H = G.Renderer.getHeight();
    var scale = G.Renderer.getScale();
    var demoVault = { x: W / 2, y: H / 2, radius: cfg.vaultRadius, integrity: 100, maxIntegrity: 100, shieldFlash: 0 };
    G.Renderer.drawVault(demoVault, gameTime, scale);
  }

  /* ---- Gameplay Update ---- */
  function updatePlaying(dt) {
    var W = G.Renderer.getWidth();
    var H = G.Renderer.getHeight();
    var scale = G.Renderer.getScale();

    // ---- Timer ----
    timeLeft -= dt;

    // ---- Idle check ----
    var now = performance.now() / 1000;
    var idleDuration = now - G.Input.getLastActivity();
    if (idleDuration >= cfg.idleTimeoutSeconds) {
      toAttract();
      return;
    }

    // ---- Loss check (integrity) ----
    if (vault.integrity <= 0) {
      vault.integrity = 0;
      playSound('game_over');
      endGame(false);
      return;
    }

    // Clamp time
    if (timeLeft < 0) timeLeft = 0;

    // ---- Input ----
    G.Input.update(vault.x, vault.y, dt);

    // Fire
    fireCooldown -= dt;
    var weapon = getActiveWeapon();
    if (weapon === 'STRONG_PASSWORD') {
      // Continuous stream only while holding mouse/space
      G.Input.consumeFire(); // consume any pending fire to prevent double-shot
      if (G.Input.isFireHeld() && fireCooldown <= 0) {
        fireWeapon(G.Input.getAimAngle());
        fireCooldown = 0.06; // very fast stream (~16 shots/sec)
      }
    } else if (G.Input.consumeFire() && fireCooldown <= 0) {
      fireWeapon(G.Input.getAimAngle());
      fireCooldown = cfg.fireRate;
    }

    // ---- Spawner ----
    var spawnResult = G.Spawner.update(dt, cfg, W, H, vault, scale);
    for (var i = 0; i < spawnResult.newThreats.length; i++) {
      threats.push(spawnResult.newThreats[i]);
      if (isDemo) console.log('[DEMO] Spawn:', spawnResult.newThreats[i].type);
    }
    for (var j = 0; j < spawnResult.newPickups.length; j++) {
      pickups.push(spawnResult.newPickups[j]);
      if (isDemo) console.log('[DEMO] Pickup spawn:', spawnResult.newPickups[j].type);
    }
    if (spawnResult.waveJustStarted) {
      playSound('wave_start');
      if (isDemo) console.log('[DEMO] Wave', spawnResult.waveIndex + 1, 'started');
    }

    // ---- IT Admin freeze effect ----
    var adminActive = hasAdminDashboard();

    // ---- Update threats ----
    for (var t = threats.length - 1; t >= 0; t--) {
      var thr = threats[t];
      if (!thr.alive) { threats.splice(t, 1); continue; }

      // Move toward vault (frozen if admin dashboard active)
      if (!adminActive) {
        var dx = vault.x - thr.x;
        var dy = vault.y - thr.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          var moveSpeed = thr.speed * dt;
          thr.x += (dx / dist) * moveSpeed;
          thr.y += (dy / dist) * moveSpeed;
        }
        thr.angle += dt * 1.5;
      }

      thr.frozen = adminActive;
      if (thr.hitFlash > 0) thr.hitFlash -= dt;
    }

    // ---- Update pickups (drift toward vault) ----
    for (var k = pickups.length - 1; k >= 0; k--) {
      var pk = pickups[k];
      if (!pk.alive) { pickups.splice(k, 1); continue; }

      pk.x += Math.cos(pk.driftAngle) * pk.driftSpeed * scale * dt;
      pk.y += Math.sin(pk.driftAngle) * pk.driftSpeed * scale * dt;

      if (pk.hitFlash > 0) pk.hitFlash -= dt;

      // Remove if too close to vault (missed)
      var pdx = pk.x - vault.x;
      var pdy = pk.y - vault.y;
      if (Math.sqrt(pdx * pdx + pdy * pdy) < vault.radius * scale) {
        pk.alive = false;
      }
    }

    // ---- Update projectiles ----
    for (var p = projectiles.length - 1; p >= 0; p--) {
      var proj = projectiles[p];
      if (!proj.alive) { projectiles.splice(p, 1); continue; }

      proj.x += Math.cos(proj.angle) * proj.speed * dt;
      proj.y += Math.sin(proj.angle) * proj.speed * dt;
      proj.age += dt;

      // Remove if off-screen
      if (proj.x < -50 || proj.x > W + 50 || proj.y < -50 || proj.y > H + 50) {
        proj.alive = false;
      }
    }

    // ---- Update lasers ----
    for (var l = lasers.length - 1; l >= 0; l--) {
      var laser = lasers[l];
      laser.age += dt;
      if (laser.age >= laser.duration) {
        laser.alive = false;
        lasers.splice(l, 1);
      }
    }

    // ---- Update wave rings ----
    for (var w = waveRings.length - 1; w >= 0; w--) {
      var ring = waveRings[w];
      ring.radius += ring.speed * scale * dt;
      ring.age += dt;
      if (ring.radius >= ring.maxRadius) {
        ring.alive = false;
        waveRings.splice(w, 1);
      }
    }

    // ---- Update active powerups (countdown) ----
    for (var pu = activePowerups.length - 1; pu >= 0; pu--) {
      activePowerups[pu].remaining -= dt;
      if (activePowerups[pu].remaining <= 0) {
        if (isDemo) console.log('[DEMO] Powerup expired:', activePowerups[pu].type);
        playSound('expire');
        activePowerups.splice(pu, 1);
      }
    }

    // ---- Vault flash decay ----
    if (vault.shieldFlash > 0) vault.shieldFlash -= dt;

    // ---- Update effects ----
    for (var e = effects.length - 1; e >= 0; e--) {
      var eff = effects[e];
      eff.age += dt;
      if (eff.age >= eff.duration) {
        eff.alive = false;
        effects.splice(e, 1);
        continue;
      }
      // Update particles
      if (eff.type === 'explosion') {
        for (var ep = 0; ep < eff.particles.length; ep++) {
          var part = eff.particles[ep];
          part.x += part.vx * dt;
          part.y += part.vy * dt;
          part.alpha = Math.max(0, 1 - eff.age / eff.duration);
        }
      }
    }

    // ---- Collision Detection ----
    var collisionEvents = G.Collisions.check({
      vault: vault,
      threats: threats,
      projectiles: projectiles,
      pickups: pickups,
      lasers: lasers,
      waveRings: waveRings,
      config: cfg,
      scale: scale,
      activePowerups: activePowerups,
      canvasW: W,
      canvasH: H
    });

    // ---- Process collision events ----
    for (var ce = 0; ce < collisionEvents.length; ce++) {
      var evt = collisionEvents[ce];

      switch (evt.type) {
        case 'threat_killed':
          var pts = G.Scoring.killThreat(evt.threat);
          effects.push(G.Entities.createExplosion(evt.threat.x, evt.threat.y, evt.threat.color, 10));
          effects.push(G.Entities.createFloatingText(evt.threat.x, evt.threat.y - 20, '+' + pts, '#FFFFFF'));
          playSound('kill');
          if (isDemo) console.log('[DEMO] Kill:', evt.threat.type, 'pts:', pts);
          break;

        case 'threat_hit':
          playSound('hit');
          break;

        case 'pickup_collected':
          _collectToInventory(evt.pickup);
          effects.push(G.Entities.createExplosion(evt.pickup.x, evt.pickup.y, evt.pickup.chipColor, 8));
          playSound('pickup');
          if (isDemo) console.log('[DEMO] Pickup collected to inventory:', evt.pickup.type);
          break;

        case 'pickup_hit':
          playSound('hit');
          break;

        case 'vault_hit':
          playSound('vault_hit');
          effects.push(G.Entities.createExplosion(vault.x, vault.y, '#FF4444', 6));
          if (isDemo) console.log('[DEMO] Vault hit! Damage:', evt.damage, 'Integrity:', vault.integrity);
          break;
      }
    }

    // ---- Win/loss checks (after all entity updates + collisions) ----
    if (vault.integrity <= 0) {
      vault.integrity = 0;
      playSound('game_over');
      endGame(false);
      return;
    }

    if (G.Spawner.isWavesComplete()) {
      // Count alive threats (some may have been killed this frame but not yet spliced)
      var aliveThreats = 0;
      for (var at = 0; at < threats.length; at++) {
        if (threats[at].alive) aliveThreats++;
      }
      if (aliveThreats === 0 || timeLeft <= 0) {
        endGame(true);
        return;
      }
    }

    // ---- HUD ----
    var wIdx = G.Spawner.getWaveIndex();
    G.HUD.update({
      timeLeft: timeLeft,
      waveIndex: wIdx,
      totalWaves: cfg.waves.length,
      waveName: cfg.waves[wIdx] ? cfg.waves[wIdx].name || '' : '',
      integrity: vault.integrity,
      maxIntegrity: vault.maxIntegrity,
      score: G.Scoring.getScore(),
      inventory: inventory,
      activePowerups: activePowerups,
      killsByType: G.Scoring.getKillsByType(),
      enemyCfg: cfg.enemies,
      powerupCfg: cfg.powerups,
      powerupOrder: POWERUP_ORDER
    });
  }

  /* ---- Collect a pickup into inventory (increment count) ---- */
  function _collectToInventory(pk) {
    var def = cfg.powerups[pk.type];
    if (!def) return;

    if (!inventory[pk.type]) inventory[pk.type] = 0;
    inventory[pk.type]++;

    // Show educational popup (only once per type per session)
    if (!shownPopups[pk.type]) {
      shownPopups[pk.type] = true;
      _showPowerupPopup(pk);
    }
  }

  /* ---- Use an inventory item by type (activate it) ---- */
  function _useInventoryItem(type) {
    if (!inventory[type] || inventory[type] <= 0) return;
    if (!G.State.is(G.State.STATES.PLAYING)) return;
    if (popupActive) return;

    var newPu = G.Entities.createActivePowerup(type, cfg);

    // Enforce maxActivePowerups
    var weaponCount = 0;
    var toolCount = 0;
    for (var i = 0; i < activePowerups.length; i++) {
      if (activePowerups[i].powerupType === 'weapon') weaponCount++;
      else toolCount++;
    }

    if (newPu.powerupType === 'weapon') {
      if (weaponCount >= cfg.maxActivePowerups) {
        var minIdx = -1;
        var minPrio = Infinity;
        for (var j = 0; j < activePowerups.length; j++) {
          if (activePowerups[j].powerupType === 'weapon' && activePowerups[j].priority < minPrio) {
            minPrio = activePowerups[j].priority;
            minIdx = j;
          }
        }
        if (minIdx >= 0 && newPu.priority >= minPrio) {
          activePowerups.splice(minIdx, 1);
        } else {
          return; // don't activate if lower priority
        }
      }
    } else {
      if (toolCount >= 1) {
        for (var k = activePowerups.length - 1; k >= 0; k--) {
          if (activePowerups[k].powerupType === 'tool') {
            activePowerups.splice(k, 1);
            break;
          }
        }
      }
    }

    inventory[type]--;
    activePowerups.push(newPu);
    playSound('pickup');
    if (isDemo) console.log('[DEMO] Inventory item used:', type);
  }

  /* ---- Power-up educational popup (show-once per session) ---- */
  function _showPowerupPopup(pickup) {
    var def = cfg.powerups[pickup.type];
    if (!def || !def.description) return;

    popupActive = true;
    popupTimer = cfg.popupDurationSeconds || 6;
    popupData = {
      type: pickup.type,
      label: def.label,
      chipColor: def.chipColor || pickup.chipColor,
      description: def.description
    };

    G.Screens.showPowerupPopup(popupData);

    if (isDemo) console.log('[DEMO] Popup shown:', pickup.type);
  }

  function _dismissPopup() {
    if (!popupActive) return;
    popupActive = false;
    popupTimer = 0;
    popupData = null;
    G.Screens.hidePowerupPopup();
    // Reset idle timer so popup pause doesn't count as idle
    G.Input.reset();
  }

  /* ---- Render Gameplay ---- */
  function renderPlaying() {
    var scale = G.Renderer.getScale();
    G.Renderer.clear();
    G.Renderer.drawBackground(gameTime, reducedMotion);

    // IT Admin overlay effect
    if (hasAdminDashboard()) {
      var adminPu = null;
      for (var a = 0; a < activePowerups.length; a++) {
        if (activePowerups[a].type === 'IT_ADMIN_DASHBOARD') adminPu = activePowerups[a];
      }
      if (adminPu) {
        G.Renderer.drawAdminOverlay(gameTime, adminPu.remaining / adminPu.duration);
      }
    }

    // Wave rings (behind everything)
    for (var w = 0; w < waveRings.length; w++) {
      G.Renderer.drawWaveRing(waveRings[w], gameTime);
    }

    // Lasers
    for (var l = 0; l < lasers.length; l++) {
      G.Renderer.drawLaser(lasers[l], vault, gameTime);
    }

    // Threats
    for (var t = 0; t < threats.length; t++) {
      if (threats[t].alive) {
        G.Renderer.drawThreat(threats[t], scale, gameTime, colorBlindMode);
      }
    }

    // Pickups
    for (var k = 0; k < pickups.length; k++) {
      if (pickups[k].alive) {
        G.Renderer.drawPickup(pickups[k], scale, gameTime);
      }
    }

    // Projectiles
    for (var p = 0; p < projectiles.length; p++) {
      if (projectiles[p].alive) {
        G.Renderer.drawProjectile(projectiles[p], scale);
      }
    }

    // Vault (on top)
    G.Renderer.drawVault(vault, gameTime, scale);

    // Aim indicator
    G.Renderer.drawAimIndicator(vault, G.Input.getAimAngle(), scale);

    // Effects (topmost)
    for (var e = 0; e < effects.length; e++) {
      G.Renderer.drawEffect(effects[e]);
    }
  }

  /* ==== Boot ==== */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
