/* ============================================================
   Screens — Attract, Tutorial, Summary, Initials, Powerup Popup
   ============================================================ */
(function () {
  'use strict';

  var G = window.Game = window.Game || {};

  var els = {};
  var initialsCallback = null;
  var initialsTimer = null;
  var initialsCountdown = 0;

  var debriefCallback = null;
  var debriefTimer = null;

  function init() {
    els.attract = document.getElementById('attract-screen');
    els.summary = document.getElementById('summary-screen');
    els.tutorial = document.getElementById('tutorial-overlay');
    els.initials = document.getElementById('initials-overlay');
    els.initialsInput = document.getElementById('initials-input');
    els.initialsCountdownEl = document.getElementById('initials-countdown');
    els.popup = document.getElementById('powerup-popup');
    els.popupLabel = document.getElementById('popup-label');
    els.popupDesc = document.getElementById('popup-desc');
    els.popupIcon = document.getElementById('popup-icon');
    els.popupBadge = document.getElementById('popup-badge');
    els.debrief = document.getElementById('debrief-screen');
    els.debriefRankMsg = document.getElementById('debrief-rank-msg');
    els.debriefWeapons = document.getElementById('debrief-weapons');
    els.debriefMissing = document.getElementById('debrief-missing');
  }

  /* ---- Attract Screen ---- */
  function showAttract() {
    els.attract.classList.remove('hidden');
    els.summary.classList.add('hidden');
    els.initials.classList.add('hidden');
    hidePowerupPopup();
    G.Leaderboard.hide();
  }

  function hideAttract() {
    els.attract.classList.add('hidden');
  }

  /* ---- Tutorial ---- */
  var tutorialShown = false;
  var tutorialTimer = null;

  function showTutorial(durationMs) {
    if (tutorialShown) return; // only show once per session
    tutorialShown = true;
    els.tutorial.classList.add('visible');
    els.tutorial.style.pointerEvents = 'all';

    function dismiss() {
      if (tutorialTimer) { clearTimeout(tutorialTimer); tutorialTimer = null; }
      els.tutorial.classList.remove('visible');
      els.tutorial.style.pointerEvents = '';
      els.tutorial.removeEventListener('click', dismiss);
      els.tutorial.removeEventListener('touchstart', dismiss);
      window.removeEventListener('keydown', dismissKey);
    }

    function dismissKey(e) {
      if (e.code === 'Space' || e.code === 'Enter' || e.key.length === 1) {
        dismiss();
      }
    }

    els.tutorial.addEventListener('click', dismiss);
    els.tutorial.addEventListener('touchstart', dismiss);
    window.addEventListener('keydown', dismissKey);

    tutorialTimer = setTimeout(dismiss, durationMs || 5000);
  }

  /* ---- Summary / End Screen ---- */
  function showSummary(data) {
    els.summary.classList.remove('hidden');

    var heading = els.summary.querySelector('.summary-heading');
    var outcomeEl = els.summary.querySelector('.summary-outcome');
    var scoreEl = els.summary.querySelector('.summary-score');
    var rankEl = els.summary.querySelector('.summary-rank');
    var statsEl = els.summary.querySelector('.summary-stats');
    var killsEl = els.summary.querySelector('.summary-kills');
    var autoEl = els.summary.querySelector('.summary-auto-reset');

    if (data.survived) {
      heading.textContent = 'Fort Defended!';
      heading.className = 'summary-heading win';
      outcomeEl.textContent = 'You successfully protected the fort from all threats.';
      outcomeEl.className = 'summary-outcome win';
    } else {
      heading.textContent = 'Fort Compromised';
      heading.className = 'summary-heading lose';
      outcomeEl.textContent = 'The fort was breached. Threats overwhelmed your defenses.';
      outcomeEl.className = 'summary-outcome lose';
    }

    scoreEl.textContent = data.score;
    rankEl.textContent = data.rank;

    var statsHTML = '<span>Total Kills: ' + data.kills + '</span>';
    statsHTML += '<span>Integrity: ' + Math.max(0, Math.ceil(data.integrity)) + '%</span>';
    if (data.survived) {
      statsHTML += '<span>Time Bonus: +' + data.timeBonus + '</span>';
    }
    statsEl.innerHTML = statsHTML;

    // Kill breakdown by enemy type
    var killsHTML = '';
    if (data.killsByType && data.enemyCfg) {
      var types = Object.keys(data.enemyCfg);
      for (var i = 0; i < types.length; i++) {
        var key = types[i];
        var def = data.enemyCfg[key];
        var count = data.killsByType[key] || 0;
        killsHTML += '<div class="summary-kill-row">';
        killsHTML += '<span class="summary-kill-swatch" style="background:' + def.color + '"></span>';
        killsHTML += '<span class="summary-kill-label">' + (def.category || def.label) + '</span>';
        killsHTML += '<span class="summary-kill-count">' + count + '</span>';
        killsHTML += '</div>';
      }
    }
    killsEl.innerHTML = killsHTML;

    autoEl.textContent = 'Auto-reset in 15s';
  }

  function hideSummary() {
    els.summary.classList.add('hidden');
  }

  /* ---- Initials Entry ---- */
  function promptInitials(timeoutSeconds, callback) {
    els.initials.classList.remove('hidden');
    els.initialsInput.value = '';
    els.initialsInput.focus();
    initialsCallback = callback;
    initialsCountdown = timeoutSeconds;

    _updateInitialsCountdown();

    initialsTimer = setInterval(function () {
      initialsCountdown--;
      _updateInitialsCountdown();
      if (initialsCountdown <= 0) {
        _submitInitials();
      }
    }, 1000);

    els.initialsInput.onkeydown = function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        _submitInitials();
      }
      if (e.key.length === 1 && els.initialsInput.value.length >= 3) {
        e.preventDefault();
      }
    };
  }

  function _updateInitialsCountdown() {
    if (els.initialsCountdownEl) {
      els.initialsCountdownEl.textContent = 'Auto-saving as GUEST in ' + initialsCountdown + 's';
    }
  }

  function _submitInitials() {
    if (initialsTimer) {
      clearInterval(initialsTimer);
      initialsTimer = null;
    }
    els.initials.classList.add('hidden');
    var val = els.initialsInput.value.trim().toUpperCase() || 'GST';
    if (val.length > 3) val = val.substring(0, 3);
    els.initialsInput.onkeydown = null;
    if (initialsCallback) {
      initialsCallback(val);
      initialsCallback = null;
    }
  }

  function hideInitials() {
    if (initialsTimer) {
      clearInterval(initialsTimer);
      initialsTimer = null;
    }
    els.initials.classList.add('hidden');
    els.initialsInput.onkeydown = null;
  }

  /* ---- Power-up Educational Popup ---- */
  function showPowerupPopup(data) {
    if (!els.popup) return;

    // Set content
    if (els.popupLabel) els.popupLabel.textContent = data.label;
    if (els.popupDesc) els.popupDesc.textContent = data.description;
    if (els.popupBadge) els.popupBadge.textContent = 'COLLECTED';

    // Set accent color
    if (els.popupIcon) {
      els.popupIcon.style.borderColor = data.chipColor;
      els.popupIcon.style.color = data.chipColor;
      // Set icon text based on type
      var iconMap = {
        'STRONG_PASSWORD': '\u{1F6E1}',     // shield
        'MFA': '\u{2714}\u{FE0F}',           // check
        'SSO': '\u{1F511}',                  // key
        'PASSWORD_MANAGER': '\u{1F512}',     // lock
        'IT_ADMIN_DASHBOARD': '\u{1F4CA}'    // chart
      };
      els.popupIcon.textContent = iconMap[data.type] || '\u{2B50}';
    }

    // Animate border color
    els.popup.style.setProperty('--popup-accent', data.chipColor);
    els.popup.classList.remove('hidden');
    els.popup.classList.add('visible');
  }

  function hidePowerupPopup() {
    if (!els.popup) return;
    els.popup.classList.add('hidden');
    els.popup.classList.remove('visible');
  }

  /* ---- Outcome Flash (brief heading-only display) ---- */
  function showOutcomeFlash(survived) {
    var heading = els.summary.querySelector('.summary-heading');
    heading.textContent = survived ? 'Fort Defended!' : 'Fort Compromised';
    heading.className = 'summary-heading ' + (survived ? 'win' : 'lose');
    els.summary.classList.remove('hidden');
    els.summary.classList.add('flash-only');
  }

  function hideOutcomeFlash() {
    els.summary.classList.add('hidden');
    els.summary.classList.remove('flash-only');
  }

  /* ---- Post-Game Debrief ---- */
  function showDebrief(data, callback) {
    if (!els.debrief) { if (callback) callback(); return; }

    debriefCallback = callback;

    // Rank-specific message
    var rankMessages = {
      'Novice': 'Your vault was under-defended. Your organisation may have similar gaps — ask us how to close them.',
      'Analyst': 'You deployed some controls, but gaps remain. Layered security is the key to resilience.',
      'Guardian': 'Solid defence. You understand the fundamentals — now imagine this level of protection across your entire organisation.',
      'Sentinel': 'Impressive. You used most of the tools available. Very few threats got through.',
      'Zero-Knowledge Master': 'Maximum protection achieved. You deployed all five controls and defended the vault completely.'
    };
    els.debriefRankMsg.textContent = rankMessages[data.rank] || rankMessages['Novice'];

    // Weapon breakdown
    var weaponDefs = {
      'STRONG_PASSWORD': { label: 'Strong Passwords', icon: '\u{1F6E1}' },
      'SSO': { label: 'Single Sign-On', icon: '\u{1F511}' },
      'MFA': { label: 'Multi-Factor Auth', icon: '\u{2714}\u{FE0F}' },
      'PASSWORD_MANAGER': { label: 'Password Manager', icon: '\u{1F512}' },
      'IT_ADMIN_DASHBOARD': { label: 'IT Dashboard', icon: '\u{1F4CA}' }
    };

    var allTypes = ['STRONG_PASSWORD', 'SSO', 'MFA', 'PASSWORD_MANAGER', 'IT_ADMIN_DASHBOARD'];
    var weaponsHTML = '';
    var missingList = [];

    for (var i = 0; i < allTypes.length; i++) {
      var t = allTypes[i];
      var def = weaponDefs[t];
      var wasUsed = data.weaponsUsed && data.weaponsUsed[t];
      var cls = wasUsed ? 'used' : 'missed';
      weaponsHTML += '<div class="debrief-weapon ' + cls + '">';
      weaponsHTML += '<span class="dw-icon">' + def.icon + '</span>';
      weaponsHTML += '<span>' + def.label + '</span>';
      weaponsHTML += wasUsed ? ' \u2713' : ' \u2717';
      weaponsHTML += '</div>';
      if (!wasUsed) missingList.push(def.label);
    }
    els.debriefWeapons.innerHTML = weaponsHTML;

    if (missingList.length > 0) {
      els.debriefMissing.textContent = 'Missing: ' + missingList.join(', ');
    } else {
      els.debriefMissing.textContent = 'All controls deployed!';
      els.debriefMissing.style.color = '#4ECDC4';
    }

    els.debrief.classList.remove('hidden');

    function dismiss() {
      hideDebrief();
      if (debriefCallback) { debriefCallback(); debriefCallback = null; }
    }

    // Auto-advance after 8 seconds
    debriefTimer = setTimeout(dismiss, 8000);

    // Dismiss on click/tap/key
    els.debrief.onclick = function () { dismiss(); };
    els.debrief.ontouchstart = function (e) { e.preventDefault(); dismiss(); };
  }

  function hideDebrief() {
    if (!els.debrief) return;
    els.debrief.classList.add('hidden');
    els.debrief.onclick = null;
    els.debrief.ontouchstart = null;
    if (debriefTimer) { clearTimeout(debriefTimer); debriefTimer = null; }
  }

  G.Screens = {
    init: init,
    showAttract: showAttract,
    hideAttract: hideAttract,
    showTutorial: showTutorial,
    showSummary: showSummary,
    hideSummary: hideSummary,
    promptInitials: promptInitials,
    hideInitials: hideInitials,
    showPowerupPopup: showPowerupPopup,
    hidePowerupPopup: hidePowerupPopup,
    showOutcomeFlash: showOutcomeFlash,
    hideOutcomeFlash: hideOutcomeFlash,
    showDebrief: showDebrief,
    hideDebrief: hideDebrief
  };
})();
