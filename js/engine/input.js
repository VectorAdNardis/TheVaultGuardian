/* ============================================================
   Input — Mouse, Touch, Keyboard handling
   ============================================================
   Tracks aim direction (angle from vault center to pointer).
   Fires on click / tap / space.
   WASD + arrows to rotate aim when using keyboard-only.
   ============================================================ */
(function () {
  'use strict';

  var G = window.Game = window.Game || {};

  var aimX = 0;
  var aimY = 0;
  var aimAngle = 0;             // radians
  var fireRequested = false;
  var lastActivityTime = 0;
  var pointerActive = false;    // true if mouse/touch has moved at least once
  var keyboardAimSpeed = 3;     // radians per second for keyboard aim

  // Keys currently held
  var keys = {};

  function init(canvasEl) {
    aimX = window.innerWidth / 2;
    aimY = 0;
    lastActivityTime = performance.now() / 1000;

    // Mouse
    canvasEl.addEventListener('mousemove', function (e) {
      aimX = e.clientX;
      aimY = e.clientY;
      pointerActive = true;
      _activity();
    });

    canvasEl.addEventListener('mousedown', function (e) {
      e.preventDefault();
      aimX = e.clientX;
      aimY = e.clientY;
      pointerActive = true;
      fireRequested = true;
      _activity();
    });

    // Touch
    canvasEl.addEventListener('touchstart', function (e) {
      e.preventDefault();
      var t = e.touches[0];
      aimX = t.clientX;
      aimY = t.clientY;
      pointerActive = true;
      fireRequested = true;
      _activity();
    }, { passive: false });

    canvasEl.addEventListener('touchmove', function (e) {
      e.preventDefault();
      var t = e.touches[0];
      aimX = t.clientX;
      aimY = t.clientY;
      pointerActive = true;
      _activity();
    }, { passive: false });

    // Keyboard
    window.addEventListener('keydown', function (e) {
      keys[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        fireRequested = true;
      }
      _activity();
    });

    window.addEventListener('keyup', function (e) {
      keys[e.code] = false;
    });
  }

  function _activity() {
    lastActivityTime = performance.now() / 1000;
  }

  /* Update aim angle.
     vaultX, vaultY: vault center in canvas coords.
     dt: delta time for keyboard rotation. */
  function update(vaultX, vaultY, dt) {
    // Keyboard aim rotation (WASD / arrows)
    var kx = 0, ky = 0;
    if (keys['ArrowLeft'] || keys['KeyA']) kx -= 1;
    if (keys['ArrowRight'] || keys['KeyD']) kx += 1;
    if (keys['ArrowUp'] || keys['KeyW']) ky -= 1;
    if (keys['ArrowDown'] || keys['KeyS']) ky += 1;

    // Continuous fire when Space is held
    if (keys['Space']) {
      fireRequested = true;
      _activity();
    }

    if (kx !== 0 || ky !== 0) {
      // Set aim angle directly from keyboard direction
      aimAngle = Math.atan2(ky, kx);
      _activity();
    } else if (pointerActive) {
      // Calculate angle from vault center to pointer
      var dx = aimX - vaultX;
      var dy = aimY - vaultY;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        aimAngle = Math.atan2(dy, dx);
      }
    }
  }

  function consumeFire() {
    if (fireRequested) {
      fireRequested = false;
      return true;
    }
    return false;
  }

  function getAimAngle() { return aimAngle; }
  function getLastActivity() { return lastActivityTime; }

  /* Reset for new game */
  function reset() {
    fireRequested = false;
    lastActivityTime = performance.now() / 1000;
  }

  /* Check if any key / activity happened recently */
  function anyStartInput() {
    return fireRequested || keys['Space'] || keys['Enter'];
  }

  function consumeStartInput() {
    var had = fireRequested;
    fireRequested = false;
    return had;
  }

  G.Input = {
    init: init,
    update: update,
    consumeFire: consumeFire,
    getAimAngle: getAimAngle,
    getLastActivity: getLastActivity,
    reset: reset,
    anyStartInput: anyStartInput,
    consumeStartInput: consumeStartInput
  };
})();
