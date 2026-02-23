/* ============================================================
   Leaderboard — localStorage-based top 10, today + all-time
   ============================================================ */
(function () {
  'use strict';

  var G = window.Game = window.Game || {};

  var STORAGE_KEY = 'vaultguardian_leaderboard';
  var MAX_ENTRIES = 10;

  /* ---- Data ---- */
  function _load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return [];
  }

  function _save(entries) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (e) { /* ignore */ }
  }

  function addEntry(initials, score, rank) {
    var entries = _load();
    entries.push({
      initials: (initials || 'GST').toUpperCase().substring(0, 3),
      score: score,
      rank: rank,
      timestamp: Date.now()
    });
    entries.sort(function (a, b) { return b.score - a.score; });
    if (entries.length > MAX_ENTRIES * 3) {
      entries = entries.slice(0, MAX_ENTRIES * 3); // keep generous buffer
    }
    _save(entries);
    return entries;
  }

  function getAll() {
    var entries = _load();
    entries.sort(function (a, b) { return b.score - a.score; });
    return entries.slice(0, MAX_ENTRIES);
  }

  function getToday() {
    var entries = _load();
    var now = new Date();
    var startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    var today = entries.filter(function (e) { return e.timestamp >= startOfDay; });
    today.sort(function (a, b) { return b.score - a.score; });
    return today.slice(0, MAX_ENTRIES);
  }

  function clearAll() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
  }

  /* ---- UI Rendering ---- */
  var panelEl = null;
  var currentTab = 'today';

  function init() {
    panelEl = document.getElementById('leaderboard-panel');
  }

  function show(highlightScore) {
    if (!panelEl) return;
    panelEl.classList.remove('hidden');
    currentTab = 'today';
    _render(highlightScore);
  }

  function hide() {
    if (!panelEl) return;
    panelEl.classList.add('hidden');
  }

  function _render(highlightScore) {
    var entries = currentTab === 'today' ? getToday() : getAll();

    var html = '<div class="lb-container">';
    html += '<h3>Leaderboard</h3>';
    html += '<div class="lb-tabs">';
    html += '<button class="lb-tab' + (currentTab === 'today' ? ' active' : '') + '" data-tab="today">Today</button>';
    html += '<button class="lb-tab' + (currentTab === 'alltime' ? ' active' : '') + '" data-tab="alltime">All-Time</button>';
    html += '</div>';

    if (entries.length === 0) {
      html += '<div class="lb-empty">No scores yet. Be the first!</div>';
    } else {
      html += '<ul class="lb-list">';
      for (var i = 0; i < entries.length; i++) {
        var e = entries[i];
        var hl = (highlightScore !== undefined && e.score === highlightScore && i === _findFirstIndex(entries, highlightScore)) ? ' highlight' : '';
        html += '<li class="' + hl + '">';
        html += '<span class="lb-rank">' + (i + 1) + '.</span>';
        html += '<span class="lb-name">' + _esc(e.initials) + '</span>';
        html += '<span class="lb-score">' + e.score + '</span>';
        html += '</li>';
      }
      html += '</ul>';
    }
    html += '</div>';

    panelEl.innerHTML = html;

    // Tab click listeners
    var tabs = panelEl.querySelectorAll('.lb-tab');
    for (var t = 0; t < tabs.length; t++) {
      tabs[t].addEventListener('click', function (ev) {
        currentTab = ev.target.getAttribute('data-tab');
        _render(highlightScore);
      });
    }
  }

  function _findFirstIndex(entries, score) {
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].score === score) return i;
    }
    return -1;
  }

  function _esc(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  /* ---- Hidden clear control (3s long-press in bottom-left corner) ---- */
  var clearTimer = null;

  function initClearControl() {
    var zone = document.getElementById('lb-clear-zone');
    if (!zone) return;

    function startClear() {
      clearTimer = setTimeout(function () {
        clearAll();
        alert('Leaderboard cleared.');
      }, 3000);
    }

    function cancelClear() {
      if (clearTimer) {
        clearTimeout(clearTimer);
        clearTimer = null;
      }
    }

    zone.addEventListener('mousedown', startClear);
    zone.addEventListener('touchstart', startClear);
    zone.addEventListener('mouseup', cancelClear);
    zone.addEventListener('mouseleave', cancelClear);
    zone.addEventListener('touchend', cancelClear);
    zone.addEventListener('touchcancel', cancelClear);
  }

  G.Leaderboard = {
    init: init,
    show: show,
    hide: hide,
    addEntry: addEntry,
    getAll: getAll,
    getToday: getToday,
    clearAll: clearAll,
    initClearControl: initClearControl
  };
})();
