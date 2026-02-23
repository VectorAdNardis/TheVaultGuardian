/* ============================================================
   HUD — Timer, integrity, score, weapon bar (always visible),
         active power-ups, kill tracker by enemy type
   ============================================================ */
(function () {
  'use strict';

  var G = window.Game = window.Game || {};

  var els = {};
  var visible = false;
  var _onInventoryUse = null; // callback(type)

  function init() {
    els.hud = document.getElementById('hud');
    els.timer = document.getElementById('hud-timer');
    els.wave = document.getElementById('hud-wave');
    els.integrityFill = document.getElementById('hud-integrity-fill');
    els.integrityLabel = document.getElementById('hud-integrity-label');
    els.score = document.getElementById('hud-score');
    els.inventory = document.getElementById('hud-inventory');
    els.activePowerups = document.getElementById('hud-active-powerups');
    els.killTracker = document.getElementById('hud-kill-tracker');
  }

  function show() {
    if (!visible) {
      els.hud.classList.add('visible');
      visible = true;
    }
  }

  function hide() {
    if (visible) {
      els.hud.classList.remove('visible');
      visible = false;
    }
  }

  /* Register callback for when player clicks a weapon slot */
  function onInventoryUse(fn) {
    _onInventoryUse = fn;
  }

  /* Main HUD update — called every frame during gameplay.
     rt = { timeLeft, waveIndex, totalWaves, waveName,
            integrity, maxIntegrity, score,
            inventory, activePowerups, killsByType, enemyCfg,
            powerupCfg, powerupOrder } */
  function update(rt) {
    // Timer
    var t = Math.max(0, Math.ceil(rt.timeLeft));
    var min = Math.floor(t / 60);
    var sec = t % 60;
    els.timer.textContent = _pad(min) + ':' + _pad(sec);

    // Wave
    var waveName = rt.waveName || '';
    els.wave.textContent = 'WAVE ' + (rt.waveIndex + 1) + '/' + rt.totalWaves + (waveName ? ' \u2014 ' + waveName : '');

    // Integrity
    var pct = Math.max(0, (rt.integrity / rt.maxIntegrity) * 100);
    els.integrityFill.style.width = pct + '%';
    if (pct > 50) {
      els.integrityFill.style.background = 'linear-gradient(90deg, #4ECDC4, #45B7D1)';
    } else if (pct > 25) {
      els.integrityFill.style.background = 'linear-gradient(90deg, #F39C12, #E67E22)';
    } else {
      els.integrityFill.style.background = 'linear-gradient(90deg, #E74C3C, #FF1744)';
    }
    els.integrityLabel.textContent = Math.ceil(rt.integrity);

    // Score
    els.score.textContent = rt.score;

    // Weapon bar (always shows all 5 weapons, greyed if count=0)
    _updateWeaponBar(rt.inventory, rt.powerupCfg, rt.powerupOrder);

    // Active power-ups (running with timers)
    _updateActivePowerups(rt.activePowerups);

    // Kill tracker by enemy type
    _updateKillTracker(rt.killsByType, rt.enemyCfg);
  }

  /* ---- Weapon bar (always visible, all 5 types) ---- */
  function _updateWeaponBar(inv, powerupCfg, order) {
    if (!els.inventory || !powerupCfg || !order) return;
    var html = '';
    for (var i = 0; i < order.length; i++) {
      var type = order[i];
      var def = powerupCfg[type];
      if (!def) continue;
      var count = inv[type] || 0;
      var isActive = count > 0;
      var cls = 'weapon-slot' + (isActive ? ' weapon-active' : ' weapon-locked');
      var color = def.chipColor || '#666';

      html += '<div class="' + cls + '" data-weapon-type="' + type + '" style="--weapon-color:' + color + '">';
      html += '<span class="weapon-key">' + (i + 1) + '</span>';
      html += '<span class="weapon-icon">' + _iconForType(type) + '</span>';
      html += '<span class="weapon-label">' + def.label + '</span>';
      if (count > 0) {
        html += '<span class="weapon-count">' + count + '</span>';
      }
      html += '</div>';
    }
    els.inventory.innerHTML = html;

    // Bind click listeners on active slots
    var slots = els.inventory.querySelectorAll('.weapon-active');
    for (var s = 0; s < slots.length; s++) {
      slots[s].addEventListener('click', _handleWeaponClick);
      slots[s].addEventListener('touchstart', _handleWeaponTouch);
    }
  }

  function _handleWeaponClick(e) {
    var type = e.currentTarget.getAttribute('data-weapon-type');
    if (_onInventoryUse && type) {
      _onInventoryUse(type);
    }
  }

  function _handleWeaponTouch(e) {
    e.preventDefault();
    e.stopPropagation();
    var type = e.currentTarget.getAttribute('data-weapon-type');
    if (_onInventoryUse && type) {
      _onInventoryUse(type);
    }
  }

  function _iconForType(type) {
    var map = {
      'STRONG_PASSWORD': '\u{1F6E1}',
      'MFA': '\u2714\uFE0F',
      'SSO': '\u{1F511}',
      'PASSWORD_MANAGER': '\u{1F512}',
      'IT_ADMIN_DASHBOARD': '\u{1F4CA}'
    };
    return map[type] || '\u2B50';
  }

  /* ---- Active power-ups (with countdown timers) ---- */
  function _updateActivePowerups(active) {
    if (!els.activePowerups) return;
    var html = '';
    for (var i = 0; i < active.length; i++) {
      var pu = active[i];
      var pct = (pu.remaining / pu.duration) * 100;
      html += '<div class="powerup-slot" style="border-color:' + pu.chipColor + '">';
      html += '<span class="pu-icon" style="color:' + pu.chipColor + '">' + _iconForType(pu.type) + '</span>';
      html += '<span class="pu-label">' + pu.label + '</span>';
      html += '<span class="pu-timer">' + Math.ceil(pu.remaining) + 's</span>';
      html += '<span class="pu-bar" style="width:' + pct + '%;background:' + pu.chipColor + '"></span>';
      html += '</div>';
    }
    els.activePowerups.innerHTML = html;
  }

  /* ---- Kill tracker by enemy type ---- */
  function _updateKillTracker(killsByType, enemyCfg) {
    if (!els.killTracker || !enemyCfg) return;
    var types = Object.keys(enemyCfg);
    var html = '';
    var totalKills = 0;
    for (var i = 0; i < types.length; i++) {
      var key = types[i];
      var def = enemyCfg[key];
      var count = killsByType[key] || 0;
      totalKills += count;
      if (count > 0) {
        html += '<div class="kill-row">';
        html += '<span class="kill-swatch" style="background:' + def.color + '"></span>';
        html += '<span class="kill-label">' + (def.category || def.label) + '</span>';
        html += '<span class="kill-count">' + count + '</span>';
        html += '</div>';
      }
    }
    // Show total at top
    var header = '<div class="kill-header">DEFEATED: ' + totalKills + '</div>';
    els.killTracker.innerHTML = header + html;
  }

  function _pad(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  G.HUD = {
    init: init,
    show: show,
    hide: hide,
    update: update,
    onInventoryUse: onInventoryUse
  };
})();
