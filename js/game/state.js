/* ============================================================
   State Machine — ATTRACT | PLAYING | PAUSED | SUMMARY
   ============================================================ */
(function () {
  'use strict';

  var STATES = {
    ATTRACT: 'ATTRACT',
    PLAYING: 'PLAYING',
    PAUSED:  'PAUSED',
    SUMMARY: 'SUMMARY'
  };

  var current = STATES.ATTRACT;
  var listeners = [];

  function get() { return current; }

  function set(next) {
    if (next === current) return;
    var prev = current;
    current = next;
    for (var i = 0; i < listeners.length; i++) {
      listeners[i](current, prev);
    }
  }

  function onChange(fn) {
    listeners.push(fn);
  }

  function is(s) { return current === s; }

  window.Game = window.Game || {};
  window.Game.State = {
    STATES: STATES,
    get: get,
    set: set,
    is: is,
    onChange: onChange
  };
})();
