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
  function showTutorial(durationMs) {
    els.tutorial.classList.add('visible');
    setTimeout(function () {
      els.tutorial.classList.remove('visible');
    }, durationMs || 3000);
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
    hideOutcomeFlash: hideOutcomeFlash
  };
})();
