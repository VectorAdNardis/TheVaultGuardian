/* ============================================================
   Collision Detection
   ============================================================
   Checks:
   1. Projectiles vs Threats
   2. Projectiles vs Pickups (shoot-to-activate)
   3. Lasers vs Threats
   4. Wave rings vs Threats
   5. Threats vs Vault core
   ============================================================ */
(function () {
  'use strict';

  var G = window.Game = window.Game || {};

  // Damage per hit based on weapon variant
  var WEAPON_DAMAGE = {
    'DEFAULT': 1,
    'STRONG_PASSWORD': 2,
    'SSO': 3,
    'MFA': 4,
    'PASSWORD_MANAGER': 5
  };

  function _dmg(variant) {
    return WEAPON_DAMAGE[variant] || 1;
  }

  /* Simple circle-circle overlap */
  function circlesOverlap(ax, ay, ar, bx, by, br) {
    var dx = ax - bx;
    var dy = ay - by;
    var dist = Math.sqrt(dx * dx + dy * dy);
    return dist < ar + br;
  }

  /* Point-to-line-segment distance (for laser collision) */
  function pointToSegmentDist(px, py, x1, y1, x2, y2) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    var lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
    var t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
    var projX = x1 + t * dx;
    var projY = y1 + t * dy;
    var dxp = px - projX;
    var dyp = py - projY;
    return Math.sqrt(dxp * dxp + dyp * dyp);
  }

  /* ---- Main collision pass ----
     Called once per frame from main loop.
     Returns event list: { type, ... } for scoring, effects, sound cues. */
  function check(rt) {
    var events = [];
    var vault = rt.vault;
    var threats = rt.threats;
    var projectiles = rt.projectiles;
    var pickups = rt.pickups;
    var lasers = rt.lasers;
    var waveRings = rt.waveRings;
    var cfg = rt.config;
    var scale = rt.scale;
    var hasPowerup = rt.activePowerups.length > 0;

    // ---- 1. Projectiles vs Threats ----
    for (var p = projectiles.length - 1; p >= 0; p--) {
      var proj = projectiles[p];
      if (!proj.alive) continue;

      for (var t = 0; t < threats.length; t++) {
        var thr = threats[t];
        if (!thr.alive) continue;

        if (circlesOverlap(proj.x, proj.y, proj.radius, thr.x, thr.y, thr.radius * scale)) {
          // Hit! Damage based on weapon variant
          thr.hp -= _dmg(proj.variant);
          thr.hitFlash = 0.12;
          proj.alive = false;

          if (thr.hp <= 0) {
            thr.alive = false;
            events.push({ type: 'threat_killed', threat: thr, hasPowerup: hasPowerup });
          } else {
            events.push({ type: 'threat_hit', threat: thr });
          }
          break; // projectile consumed
        }
      }
    }

    // ---- 2. Projectiles vs Pickups (shoot to collect) ----
    for (var p2 = projectiles.length - 1; p2 >= 0; p2--) {
      var proj2 = projectiles[p2];
      if (!proj2.alive) continue;

      for (var k = 0; k < pickups.length; k++) {
        var pk = pickups[k];
        if (!pk.alive) continue;

        if (circlesOverlap(proj2.x, proj2.y, proj2.radius, pk.x, pk.y, pk.radius * scale)) {
          pk.hp -= 1;
          pk.hitFlash = 0.12;
          proj2.alive = false;

          if (pk.hp <= 0) {
            pk.alive = false;
            events.push({ type: 'pickup_collected', pickup: pk });
          } else {
            events.push({ type: 'pickup_hit', pickup: pk });
          }
          break;
        }
      }
    }

    // ---- 3. Lasers vs Threats ----
    for (var l = 0; l < lasers.length; l++) {
      var laser = lasers[l];
      if (!laser.alive) continue;

      // Laser line: from vault center outward at laser.angle to screen edge
      var maxLen = Math.max(rt.canvasW, rt.canvasH);
      var lx1 = vault.x;
      var ly1 = vault.y;
      var lx2 = vault.x + Math.cos(laser.angle) * maxLen;
      var ly2 = vault.y + Math.sin(laser.angle) * maxLen;

      for (var t2 = 0; t2 < threats.length; t2++) {
        var thr2 = threats[t2];
        if (!thr2.alive) continue;

        var dist = pointToSegmentDist(thr2.x, thr2.y, lx1, ly1, lx2, ly2);
        if (dist < thr2.radius * scale + laser.width) {
          // Laser damages once per ~0.15s (tracked via hitFlash cooldown)
          if (thr2.hitFlash <= 0) {
            thr2.hp -= _dmg(laser.variant);
            thr2.hitFlash = 0.15;
            if (thr2.hp <= 0) {
              thr2.alive = false;
              events.push({ type: 'threat_killed', threat: thr2, hasPowerup: hasPowerup });
            } else {
              events.push({ type: 'threat_hit', threat: thr2 });
            }
          }
        }
      }

      // Lasers vs Pickups
      for (var k2 = 0; k2 < pickups.length; k2++) {
        var pk2 = pickups[k2];
        if (!pk2.alive) continue;
        var dist2 = pointToSegmentDist(pk2.x, pk2.y, lx1, ly1, lx2, ly2);
        if (dist2 < pk2.radius * scale + laser.width) {
          if (pk2.hitFlash <= 0) {
            pk2.hp -= 1;
            pk2.hitFlash = 0.15;
            if (pk2.hp <= 0) {
              pk2.alive = false;
              events.push({ type: 'pickup_collected', pickup: pk2 });
            } else {
              events.push({ type: 'pickup_hit', pickup: pk2 });
            }
          }
        }
      }
    }

    // ---- 4. Wave rings vs Threats ----
    for (var w = 0; w < waveRings.length; w++) {
      var ring = waveRings[w];
      if (!ring.alive) continue;

      for (var t3 = 0; t3 < threats.length; t3++) {
        var thr3 = threats[t3];
        if (!thr3.alive) continue;

        // Check if threat is near the ring's expanding edge
        var dx = thr3.x - ring.cx;
        var dy = thr3.y - ring.cy;
        var distFromCenter = Math.sqrt(dx * dx + dy * dy);
        var ringEdge = ring.radius;
        var hitRange = thr3.radius * scale + 15; // ring thickness

        if (Math.abs(distFromCenter - ringEdge) < hitRange) {
          var hitKey = 't' + t3;
          if (!ring.hitSet[hitKey]) {
            ring.hitSet[hitKey] = true;
            thr3.hp -= _dmg(ring.variant);
            thr3.hitFlash = 0.12;
            if (thr3.hp <= 0) {
              thr3.alive = false;
              events.push({ type: 'threat_killed', threat: thr3, hasPowerup: hasPowerup });
            } else {
              events.push({ type: 'threat_hit', threat: thr3 });
            }
          }
        }
      }

      // Wave rings vs Pickups
      for (var k3 = 0; k3 < pickups.length; k3++) {
        var pk3 = pickups[k3];
        if (!pk3.alive) continue;
        var dxp = pk3.x - ring.cx;
        var dyp = pk3.y - ring.cy;
        var distP = Math.sqrt(dxp * dxp + dyp * dyp);
        if (Math.abs(distP - ring.radius) < pk3.radius * scale + 15) {
          var pkKey = 'p' + k3;
          if (!ring.hitSet[pkKey]) {
            ring.hitSet[pkKey] = true;
            pk3.hp -= 1;
            pk3.hitFlash = 0.12;
            if (pk3.hp <= 0) {
              pk3.alive = false;
              events.push({ type: 'pickup_collected', pickup: pk3 });
            } else {
              events.push({ type: 'pickup_hit', pickup: pk3 });
            }
          }
        }
      }
    }

    // ---- 5. Threats vs Vault ----
    for (var t4 = 0; t4 < threats.length; t4++) {
      var thr4 = threats[t4];
      if (!thr4.alive) continue;

      var dxv = thr4.x - vault.x;
      var dyv = thr4.y - vault.y;
      var distV = Math.sqrt(dxv * dxv + dyv * dyv);

      if (distV < vault.radius * scale + thr4.radius * scale * 0.5) {
        vault.integrity -= thr4.damage;
        vault.shieldFlash = 0.3;
        thr4.alive = false;
        events.push({ type: 'vault_hit', threat: thr4, damage: thr4.damage });
      }
    }

    return events;
  }

  G.Collisions = {
    check: check,
    circlesOverlap: circlesOverlap
  };
})();
