/* ============================================================
   Entities — Vault, Threats, Pickups, Projectiles, Effects
   ============================================================ */
(function () {
  'use strict';

  var G = window.Game = window.Game || {};

  /* ---- Vault Core ---- */
  function createVault(cx, cy) {
    return {
      x: cx,
      y: cy,
      radius: 40,
      integrity: 100,
      maxIntegrity: 100,
      pulsePhase: 0,       // for glow animation
      shieldFlash: 0       // flash-on-hit timer
    };
  }

  /* ---- Threat ---- */
  function createThreat(type, x, y, speed, cfg) {
    var def = cfg.enemies[type];
    return {
      type: type,
      x: x,
      y: y,
      speed: speed,           // px/s after scaling
      hp: def.hp,
      maxHp: def.hp,
      damage: def.damage,
      radius: def.radius,
      color: def.color,
      shape: def.shape,
      label: def.label,
      points: def.points || 10,
      alive: true,
      hitFlash: 0,            // visual flash timer
      slowed: false,
      angle: 0                // rotation for visual spin
    };
  }

  /* ---- Pickup Chip ---- */
  function createPickup(type, x, y, cfg) {
    var def = cfg.powerups[type];
    return {
      type: type,
      x: x,
      y: y,
      hp: 2,                 // needs 1–2 hits to activate
      chipColor: def.chipColor,
      icon: def.icon,
      label: def.label,
      durationSeconds: def.durationSeconds,
      powerupType: def.type,  // 'weapon' or 'tool'
      priority: def.priority,
      radius: 20,
      alive: true,
      driftAngle: 0,          // angle toward vault
      driftSpeed: 18,         // slow drift px/s
      bobPhase: Math.random() * Math.PI * 2,
      hitFlash: 0
    };
  }

  /* ---- Active Power-up (in-play state) ---- */
  function createActivePowerup(type, cfg) {
    var def = cfg.powerups[type];
    return {
      type: type,
      label: def.label,
      icon: def.icon,
      chipColor: def.chipColor,
      powerupType: def.type,
      priority: def.priority,
      remaining: def.durationSeconds,
      duration: def.durationSeconds
    };
  }

  /* ---- Projectile / Beam ---- */
  // variant: 'DEFAULT' | 'STRONG_PASSWORD' | 'MFA' | 'SSO' | 'PASSWORD_MANAGER'
  function createProjectile(x, y, angle, speed, variant) {
    return {
      x: x,
      y: y,
      angle: angle,
      speed: speed,            // px/s
      variant: variant || 'DEFAULT',
      alive: true,
      age: 0,                  // seconds since spawn
      length: 18,              // visual trail length
      radius: 5                // collision radius
    };
  }

  /* Laser: persistent line from vault, not a moving projectile */
  function createLaser(angle, duration, variant) {
    return {
      angle: angle,
      alive: true,
      age: 0,
      duration: duration || 2.5,
      width: 6,
      variant: variant || 'SSO'
    };
  }

  /* PASSWORD_MANAGER wave ring */
  function createWaveRing(cx, cy, maxRadius) {
    return {
      cx: cx,
      cy: cy,
      radius: 20,
      maxRadius: maxRadius || 600,
      speed: 350,              // expansion px/s
      alive: true,
      age: 0,
      variant: 'PASSWORD_MANAGER',
      damage: 1,
      hitSet: {}               // track which threats already hit (by index)
    };
  }

  /* ---- Visual Effect (non-interactive) ---- */
  function createEffect(type, x, y, color) {
    return {
      type: type,   // 'explosion' | 'pickup_flash' | 'damage_flash' | 'text'
      x: x,
      y: y,
      color: color || '#FFFFFF',
      age: 0,
      duration: 0.4,
      alive: true,
      scale: 1,
      text: '',     // for floating text
      particles: [] // for explosion particles
    };
  }

  function createExplosion(x, y, color, count) {
    var e = createEffect('explosion', x, y, color);
    e.duration = 0.5;
    count = count || 8;
    for (var i = 0; i < count; i++) {
      var a = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.4;
      var spd = 60 + Math.random() * 100;
      e.particles.push({
        x: x, y: y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        radius: 2 + Math.random() * 3,
        alpha: 1
      });
    }
    return e;
  }

  function createFloatingText(x, y, text, color) {
    var e = createEffect('text', x, y, color);
    e.text = text;
    e.duration = 0.8;
    return e;
  }

  /* ---- Collections ---- */
  G.Entities = {
    createVault: createVault,
    createThreat: createThreat,
    createPickup: createPickup,
    createActivePowerup: createActivePowerup,
    createProjectile: createProjectile,
    createLaser: createLaser,
    createWaveRing: createWaveRing,
    createEffect: createEffect,
    createExplosion: createExplosion,
    createFloatingText: createFloatingText
  };
})();
