/* ============================================================
   Spawner — Wave progression + Pickup chip spawns
   ============================================================
   Spawns enemies at screen edges heading toward vault.
   Spawns pickup chips on a timer with variance.
   Supports demo mode (shorter waves, faster pickups).
   ============================================================ */
(function () {
  'use strict';

  var G = window.Game = window.Game || {};

  var waveIndex = 0;
  var waveTimer = 0;        // seconds into current wave
  var spawnAccum = 0;       // accumulator for enemy spawn timing
  var pickupAccum = 0;      // accumulator for pickup spawn
  var nextPickupAt = 0;     // seconds until next pickup
  var totalGameTime = 0;
  var wavesComplete = false;
  var isDemo = false;

  function reset(cfg, demo) {
    waveIndex = 0;
    waveTimer = 0;
    spawnAccum = 0;
    pickupAccum = 0;
    totalGameTime = 0;
    wavesComplete = false;
    isDemo = !!demo;
    nextPickupAt = _nextPickupDelay(cfg);
  }

  function _nextPickupDelay(cfg) {
    var base = isDemo ? cfg.demo.pickupSpawnInterval : cfg.pickupSpawnInterval;
    var variance = cfg.pickupSpawnVariance;
    return base + (Math.random() * 2 - 1) * variance;
  }

  /* Returns { newThreats:[], newPickups:[], waveChanged:bool, wavesComplete:bool } */
  function update(dt, cfg, canvasW, canvasH, vault, scale) {
    var result = {
      newThreats: [],
      newPickups: [],
      waveJustStarted: false,
      waveIndex: waveIndex,
      wavesComplete: false
    };

    if (wavesComplete) {
      result.wavesComplete = true;
      return result;
    }

    totalGameTime += dt;
    waveTimer += dt;
    spawnAccum += dt;
    pickupAccum += dt;

    var waves = cfg.waves;
    var wave = waves[waveIndex];
    if (!wave) {
      wavesComplete = true;
      result.wavesComplete = true;
      return result;
    }

    var waveDuration = isDemo ? cfg.demo.waveDuration : wave.duration;
    var spawnInterval = wave.spawnInterval * (isDemo ? cfg.demo.spawnIntervalMultiplier : 1);

    // ---- Check wave transition ----
    if (waveTimer >= waveDuration) {
      waveTimer -= waveDuration;
      waveIndex++;
      if (waveIndex >= waves.length) {
        wavesComplete = true;
        result.wavesComplete = true;
        return result;
      }
      result.waveJustStarted = true;
      result.waveIndex = waveIndex;
      wave = waves[waveIndex];
      spawnInterval = wave.spawnInterval * (isDemo ? cfg.demo.spawnIntervalMultiplier : 1);
    }

    // ---- Spawn enemies ----
    while (spawnAccum >= spawnInterval) {
      spawnAccum -= spawnInterval;

      var enemies = wave.enemies;
      var typeKey = enemies[Math.floor(Math.random() * enemies.length)];
      var def = cfg.enemies[typeKey];
      if (!def) continue;

      var speedMult = wave.speedMultiplier * (isDemo ? cfg.demo.speedMultiplier : 1);
      var speed = (def.speedMin + Math.random() * (def.speedMax - def.speedMin)) * cfg.baseEnemySpeed * speedMult;
      speed *= scale; // scale to canvas

      // Spawn at random edge
      var pos = _randomEdgePosition(canvasW, canvasH, def.radius * scale);

      var threat = G.Entities.createThreat(typeKey, pos.x, pos.y, speed, cfg);
      threat.radius = def.radius; // will be scaled during render
      result.newThreats.push(threat);
    }

    // ---- Spawn pickups ----
    if (pickupAccum >= nextPickupAt) {
      pickupAccum -= nextPickupAt;
      nextPickupAt = _nextPickupDelay(cfg);

      var pickupType = _weightedPickup(cfg);
      if (pickupType) {
        var ppos = _randomEdgePosition(canvasW, canvasH, 30);
        var pickup = G.Entities.createPickup(pickupType, ppos.x, ppos.y, cfg);

        // Calculate drift angle toward vault center
        var dx = vault.x - ppos.x;
        var dy = vault.y - ppos.y;
        pickup.driftAngle = Math.atan2(dy, dx);

        result.newPickups.push(pickup);
      }
    }

    return result;
  }

  /* Weighted random pickup selection based on rarity */
  function _weightedPickup(cfg) {
    var types = Object.keys(cfg.powerups);
    var totalWeight = 0;
    for (var i = 0; i < types.length; i++) {
      totalWeight += cfg.powerups[types[i]].rarity;
    }
    var r = Math.random() * totalWeight;
    var accum = 0;
    for (var j = 0; j < types.length; j++) {
      accum += cfg.powerups[types[j]].rarity;
      if (r <= accum) return types[j];
    }
    return types[types.length - 1];
  }

  /* Random position along screen edge with padding */
  function _randomEdgePosition(w, h, pad) {
    var edge = Math.floor(Math.random() * 4);
    var x, y;
    switch (edge) {
      case 0: x = -pad; y = Math.random() * h; break;           // left
      case 1: x = w + pad; y = Math.random() * h; break;        // right
      case 2: x = Math.random() * w; y = -pad; break;           // top
      case 3: x = Math.random() * w; y = h + pad; break;        // bottom
      default: x = -pad; y = Math.random() * h;
    }
    return { x: x, y: y };
  }

  function getWaveIndex() { return waveIndex; }
  function getTotalGameTime() { return totalGameTime; }
  function isWavesComplete() { return wavesComplete; }

  G.Spawner = {
    reset: reset,
    update: update,
    getWaveIndex: getWaveIndex,
    getTotalGameTime: getTotalGameTime,
    isWavesComplete: isWavesComplete
  };
})();
