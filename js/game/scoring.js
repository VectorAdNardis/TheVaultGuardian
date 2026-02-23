/* ============================================================
   Scoring & Rank System — with per-type kill tracking
   ============================================================ */
(function () {
  'use strict';

  var G = window.Game = window.Game || {};

  var score = 0;
  var killCount = 0;
  var powerupKills = 0;
  var killsByType = {};    // { 'SHADOW_IT_APP': 3, 'PHISHING': 5, ... }

  function reset() {
    score = 0;
    killCount = 0;
    powerupKills = 0;
    killsByType = {};
  }

  function getScore() { return score; }
  function getKills() { return killCount; }
  function getPowerupKills() { return powerupKills; }
  function getKillsByType() { return killsByType; }

  /* Award points for destroying a threat. */
  function killThreat(threat, hasPowerupActive) {
    var pts = threat.points || 10;
    if (hasPowerupActive) {
      pts += 5;
      powerupKills++;
    }
    score += pts;
    killCount++;

    // Track by type
    if (!killsByType[threat.type]) {
      killsByType[threat.type] = 0;
    }
    killsByType[threat.type]++;

    return pts;
  }

  /* +1 per second remaining at victory */
  function addTimeBonus(secondsLeft) {
    var bonus = Math.max(0, Math.floor(secondsLeft));
    score += bonus;
    return bonus;
  }

  /* Determine rank from config thresholds */
  function getRank(cfg) {
    var thresholds = cfg.rankThresholds;
    var rank = thresholds[0].rank;
    for (var i = 0; i < thresholds.length; i++) {
      if (score >= thresholds[i].min) {
        rank = thresholds[i].rank;
      }
    }
    return rank;
  }

  G.Scoring = {
    reset: reset,
    getScore: getScore,
    getKills: getKills,
    getPowerupKills: getPowerupKills,
    getKillsByType: getKillsByType,
    killThreat: killThreat,
    addTimeBonus: addTimeBonus,
    getRank: getRank
  };
})();
