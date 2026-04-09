(() => {
  const STORAGE_KEY = "pytype_lite_save_v1";
  const { pools, unlockRules, modes } = window.PYTYPE_DATA;

  const els = {
    views: {
      home: document.getElementById("homeView"),
      game: document.getElementById("gameView"),
      result: document.getElementById("resultView"),
      stats: document.getElementById("statsView")
    },
    startGameBtn: document.getElementById("startGameBtn"),
    modeCards: Array.from(document.querySelectorAll(".mode-card")),
    openStatsBtn: document.getElementById("openStatsBtn"),
    closeStatsBtn: document.getElementById("closeStatsBtn"),
    retryBtn: document.getElementById("retryBtn"),
    goHomeBtn: document.getElementById("goHomeBtn"),
    backHomeBtn: document.getElementById("backHomeBtn"),
    pauseBtn: document.getElementById("pauseBtn"),
    inputForm: document.getElementById("inputForm"),
    wordInput: document.getElementById("wordInput"),
    modeLabel: document.getElementById("modeLabel"),
    scoreValue: document.getElementById("scoreValue"),
    lifeValue: document.getElementById("lifeValue"),
    comboValue: document.getElementById("comboValue"),
    progressValue: document.getElementById("progressValue"),
    feedbackBar: document.getElementById("feedbackBar"),
    arena: document.getElementById("arena"),
    rainLayer: document.getElementById("rainLayer"),
    singleTargetBox: document.getElementById("singleTargetBox"),
    singleTargetText: document.getElementById("singleTargetText"),
    bestScoreValue: document.getElementById("bestScoreValue"),
    totalGamesValue: document.getElementById("totalGamesValue"),
    unlockedValue: document.getElementById("unlockedValue"),
    resultModeLabel: document.getElementById("resultModeLabel"),
    resultScore: document.getElementById("resultScore"),
    resultCorrect: document.getElementById("resultCorrect"),
    resultWrong: document.getElementById("resultWrong"),
    resultAccuracy: document.getElementById("resultAccuracy"),
    resultCombo: document.getElementById("resultCombo"),
    resultBest: document.getElementById("resultBest"),
    statsGames: document.getElementById("statsGames"),
    statsCorrect: document.getElementById("statsCorrect"),
    statsWrong: document.getElementById("statsWrong"),
    statsCombo: document.getElementById("statsCombo"),
    bestRain: document.getElementById("bestRain"),
    bestSprint: document.getElementById("bestSprint"),
    bestSymbol: document.getElementById("bestSymbol"),
    wrongList: document.getElementById("wrongList")
  };

  let selectedMode = "rain";
  let currentView = "home";
  let saveData = loadSaveData();
  let currentGame = null;
  let lastResult = null;
  let rainFrameId = 0;
  let singleModeTimer = 0;

  function defaultSave() {
    return {
      bestScore: 0,
      unlockedLevels: ["basic"],
      lastMode: "rain",
      totalGames: 0,
      totalCorrect: 0,
      totalWrong: 0,
      bestCombo: 0,
      modeStats: {
        rain: { best: 0, playCount: 0 },
        sprint: { best: 0, playCount: 0 },
        symbol: { best: 0, playCount: 0 }
      },
      mostWrong: {}
    };
  }

  function loadSaveData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultSave();
      const parsed = JSON.parse(raw);
      return normalizeSave(parsed);
    } catch (err) {
      return defaultSave();
    }
  }

  function normalizeSave(input) {
    const fallback = defaultSave();
    const merged = {
      ...fallback,
      ...input,
      modeStats: {
        ...fallback.modeStats,
        ...(input.modeStats || {})
      },
      mostWrong: { ...(input.mostWrong || {}) }
    };
    if (!Array.isArray(merged.unlockedLevels) || merged.unlockedLevels.length === 0) {
      merged.unlockedLevels = ["basic"];
    }
    if (!merged.unlockedLevels.includes("basic")) {
      merged.unlockedLevels.unshift("basic");
    }
    return merged;
  }

  function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
  }

  function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function getUnlockedLabels() {
    return unlockRules
      .filter((rule) => saveData.unlockedLevels.includes(rule.key))
      .map((rule) => rule.label);
  }

  function ensureUnlockByScore(score) {
    let changed = false;
    unlockRules.forEach((rule) => {
      if (score >= rule.scoreNeed && !saveData.unlockedLevels.includes(rule.key)) {
        saveData.unlockedLevels.push(rule.key);
        changed = true;
      }
    });
    if (changed) saveToStorage();
  }

  function showView(viewKey) {
    if (!els.views[viewKey]) return;
    Object.entries(els.views).forEach(([key, node]) => {
      node.classList.toggle("active", key === viewKey);
    });
    currentView = viewKey;
  }

  function setSelectedMode(mode) {
    selectedMode = mode;
    els.modeCards.forEach((card) => {
      card.classList.toggle("selected", card.dataset.mode === mode);
    });
  }

  function refreshHomeSummary() {
    els.bestScoreValue.textContent = String(saveData.bestScore);
    els.totalGamesValue.textContent = String(saveData.totalGames);
    els.unlockedValue.textContent = getUnlockedLabels().join(" / ");
  }

  function renderStats() {
    els.statsGames.textContent = String(saveData.totalGames);
    els.statsCorrect.textContent = String(saveData.totalCorrect);
    els.statsWrong.textContent = String(saveData.totalWrong);
    els.statsCombo.textContent = String(saveData.bestCombo);
    els.bestRain.textContent = String(saveData.modeStats.rain.best);
    els.bestSprint.textContent = String(saveData.modeStats.sprint.best);
    els.bestSymbol.textContent = String(saveData.modeStats.symbol.best);

    const topWrong = Object.entries(saveData.mostWrong)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    els.wrongList.innerHTML = "";
    if (topWrong.length === 0) {
      const li = document.createElement("li");
      li.textContent = "还没有错误记录，继续保持。";
      els.wrongList.appendChild(li);
      return;
    }

    topWrong.forEach(([word, count]) => {
      const li = document.createElement("li");
      li.textContent = `${word}（${count} 次）`;
      els.wrongList.appendChild(li);
    });
  }

  function setFeedback(type, text) {
    els.feedbackBar.classList.remove("good", "bad", "warn");
    if (type) els.feedbackBar.classList.add(type);
    els.feedbackBar.textContent = text;
  }

  function resetFeedback() {
    setFeedback("", "准备开始");
  }

  function resetArena() {
    els.rainLayer.innerHTML = "";
    els.singleTargetBox.classList.add("hidden");
    els.singleTargetText.textContent = "";
  }

  function updateStatusUI() {
    if (!currentGame) return;
    els.scoreValue.textContent = String(currentGame.score);
    els.lifeValue.textContent = String(currentGame.lives);
    els.comboValue.textContent = String(currentGame.combo);
    els.progressValue.textContent = currentGame.progressText;
  }

  function stopGameLoops() {
    if (rainFrameId) {
      cancelAnimationFrame(rainFrameId);
      rainFrameId = 0;
    }
    if (singleModeTimer) {
      clearTimeout(singleModeTimer);
      singleModeTimer = 0;
    }
  }

  function startGame(mode) {
    stopGameLoops();
    resetArena();

    const selected = modes[mode];
    if (!selected) return;

    currentGame = {
      mode,
      paused: false,
      running: true,
      score: 0,
      lives: mode === "rain" ? selected.startLives : 1,
      combo: 0,
      bestCombo: 0,
      correct: 0,
      wrong: 0,
      progressText: mode === "rain" ? "1-1" : `0/${selected.rounds}`,
      startedAt: Date.now(),
      mistakes: {},
      targetWord: "",
      roundsTotal: selected.rounds || 0,
      roundIndex: 0,
      targetStartAt: 0,
      lastFrameAt: 0,
      spawnTimerMs: 0,
      spawnIntervalMs: 1300,
      level: 1,
      nextDropId: 1,
      drops: []
    };

    els.modeLabel.textContent = selected.title;
    els.pauseBtn.textContent = "⏸";
    els.wordInput.value = "";
    updateStatusUI();
    resetFeedback();

    if (mode === "rain") {
      els.rainLayer.style.display = "block";
      els.singleTargetBox.classList.add("hidden");
      setFeedback("", "代码雨开始，输入词条后按回车消除。");
      runRainLoop();
    } else {
      els.rainLayer.style.display = "none";
      els.singleTargetBox.classList.remove("hidden");
      queueNextSingleTarget();
    }

    showView("game");
    els.wordInput.focus();
  }

  function runRainLoop() {
    currentGame.lastFrameAt = performance.now();

    const tick = (timestamp) => {
      if (!currentGame || !currentGame.running || currentGame.mode !== "rain") return;
      if (currentGame.paused) {
        currentGame.lastFrameAt = timestamp;
        rainFrameId = requestAnimationFrame(tick);
        return;
      }

      const deltaSec = Math.min(0.05, (timestamp - currentGame.lastFrameAt) / 1000);
      currentGame.lastFrameAt = timestamp;

      updateRainLevelByScore();
      currentGame.spawnTimerMs += deltaSec * 1000;
      if (currentGame.spawnTimerMs >= currentGame.spawnIntervalMs) {
        spawnDrop();
        currentGame.spawnTimerMs = 0;
      }

      updateDropPositions(deltaSec);
      updateStatusUI();
      rainFrameId = requestAnimationFrame(tick);
    };

    rainFrameId = requestAnimationFrame(tick);
  }

  function getRainPoolByLevel(level) {
    if (!currentGame) return pools.basic;
    if (level === 1) return pools.basic;
    if (level === 2) return [...pools.basic, ...pools.keyword];
    return [...pools.basic, ...pools.keyword, ...pools.symbol];
  }

  function updateRainLevelByScore() {
    if (!currentGame || currentGame.mode !== "rain") return;
    let nextLevel = 1;
    if (currentGame.score >= 550) nextLevel = 3;
    else if (currentGame.score >= 220) nextLevel = 2;

    if (nextLevel !== currentGame.level) {
      currentGame.level = nextLevel;
      if (nextLevel === 2) {
        currentGame.spawnIntervalMs = 980;
        setFeedback("warn", "进入 2-1：掉落速度提升。");
      } else if (nextLevel === 3) {
        currentGame.spawnIntervalMs = 760;
        setFeedback("warn", "进入 3-1：符号词条加入。");
      }
    }

    currentGame.progressText = `${currentGame.level}-1`;
  }

  function spawnDrop() {
    if (!currentGame || currentGame.mode !== "rain") return;
    const arenaWidth = els.arena.clientWidth;
    const pool = getRainPoolByLevel(currentGame.level);
    const word = pickRandom(pool);
    const dropEl = document.createElement("div");
    const speedBase = currentGame.level === 1 ? 55 : currentGame.level === 2 ? 75 : 95;
    const speed = speedBase + Math.random() * 28;
    const left = Math.max(6, Math.random() * (arenaWidth - 120));

    dropEl.className = "drop-word";
    dropEl.textContent = word;
    dropEl.style.left = `${left}px`;
    dropEl.style.top = "0";

    const drop = {
      id: currentGame.nextDropId++,
      text: word,
      y: -46,
      speed,
      el: dropEl
    };

    currentGame.drops.push(drop);
    els.rainLayer.appendChild(dropEl);
  }

  function removeDrop(drop) {
    const idx = currentGame.drops.findIndex((item) => item.id === drop.id);
    if (idx >= 0) currentGame.drops.splice(idx, 1);
    if (drop.el && drop.el.parentNode) drop.el.parentNode.removeChild(drop.el);
  }

  function updateDropPositions(deltaSec) {
    if (!currentGame || currentGame.mode !== "rain") return;
    const arenaHeight = els.arena.clientHeight;
    const missed = [];

    currentGame.drops.forEach((drop) => {
      drop.y += drop.speed * deltaSec;
      drop.el.style.transform = `translateY(${drop.y}px)`;
      if (drop.y >= arenaHeight - 52) missed.push(drop);
    });

    missed.forEach((drop) => {
      markWrong(drop.text);
      removeDrop(drop);
      currentGame.wrong += 1;
      currentGame.combo = 0;
      currentGame.lives -= 1;
      setFeedback("bad", `漏掉 ${drop.text}，生命 -1`);
      if (currentGame.lives <= 0) endGame();
    });
  }

  function calcRainGain() {
    const comboBonus = Math.min(10, Math.floor(currentGame.combo / 2) * 2);
    return modes.rain.baseScore + comboBonus;
  }

  function submitCurrentInput() {
    if (!currentGame || !currentGame.running || currentGame.paused) return;
    const answer = els.wordInput.value.trim();
    if (!answer) return;
    els.wordInput.value = "";

    if (currentGame.mode === "rain") {
      handleRainInput(answer);
      return;
    }

    handleSingleInput(answer);
  }

  function handleRainInput(answer) {
    const candidates = currentGame.drops.filter((drop) => drop.text === answer);
    if (candidates.length === 0) {
      currentGame.wrong += 1;
      currentGame.combo = 0;
      currentGame.lives -= 1;
      markWrong(answer);
      setFeedback("bad", `没有匹配目标：${answer}，生命 -1`);
      updateStatusUI();
      if (currentGame.lives <= 0) endGame();
      return;
    }

    candidates.sort((a, b) => b.y - a.y);
    const hit = candidates[0];
    currentGame.combo += 1;
    currentGame.bestCombo = Math.max(currentGame.bestCombo, currentGame.combo);
    currentGame.correct += 1;
    const gain = calcRainGain();
    currentGame.score += gain;
    hit.el.classList.add("hit");
    removeDrop(hit);
    setFeedback("good", `命中 ${answer}，+${gain}`);
    updateStatusUI();
  }

  function getSingleModePool(mode) {
    if (mode === "sprint") return [...pools.basic, ...pools.keyword];
    return pools.symbol;
  }

  function queueNextSingleTarget() {
    if (!currentGame || !currentGame.running) return;
    if (currentGame.roundIndex >= currentGame.roundsTotal) {
      endGame();
      return;
    }

    const pool = getSingleModePool(currentGame.mode);
    currentGame.targetWord = pickRandom(pool);
    currentGame.roundIndex += 1;
    currentGame.targetStartAt = Date.now();
    currentGame.progressText = `${currentGame.roundIndex}/${currentGame.roundsTotal}`;
    els.singleTargetText.textContent = currentGame.targetWord;
    updateStatusUI();

    const modeHint = currentGame.mode === "sprint"
      ? "越快输入，额外分越高。"
      : "符号要一字不差，保持连击。";
    setFeedback("", modeHint);
  }

  function handleSingleInput(answer) {
    const target = currentGame.targetWord;
    const elapsedSec = (Date.now() - currentGame.targetStartAt) / 1000;

    if (answer === target) {
      currentGame.correct += 1;
      currentGame.combo += 1;
      currentGame.bestCombo = Math.max(currentGame.bestCombo, currentGame.combo);

      let gain = modes[currentGame.mode].baseScore;
      if (currentGame.mode === "sprint") {
        const speedBonus = Math.max(0, 12 - Math.floor(elapsedSec * 2));
        gain += speedBonus;
        setFeedback("good", `正确，耗时 ${elapsedSec.toFixed(2)}s，+${gain}`);
      } else {
        const comboBonus = Math.min(12, Math.floor(currentGame.combo / 2) * 2);
        gain += comboBonus;
        setFeedback("good", `符号命中，+${gain}`);
      }
      currentGame.score += gain;
    } else {
      currentGame.wrong += 1;
      currentGame.combo = 0;
      markWrong(target);
      setFeedback("bad", `错误，目标是 ${target}`);
    }

    updateStatusUI();
    singleModeTimer = setTimeout(() => {
      queueNextSingleTarget();
      els.wordInput.focus();
    }, 320);
  }

  function togglePause() {
    if (!currentGame || !currentGame.running) return;
    currentGame.paused = !currentGame.paused;
    els.pauseBtn.textContent = currentGame.paused ? "▶" : "⏸";
    if (currentGame.paused) {
      setFeedback("warn", "已暂停，点击继续。");
    } else if (currentGame.mode === "rain") {
      setFeedback("", "继续战斗。");
    } else {
      setFeedback("", "继续输入当前目标。");
    }
    els.wordInput.focus();
  }

  function endGame() {
    if (!currentGame || !currentGame.running) return;
    currentGame.running = false;
    stopGameLoops();

    if (currentGame.mode === "rain") {
      currentGame.drops.forEach((drop) => {
        if (drop.el && drop.el.parentNode) drop.el.parentNode.removeChild(drop.el);
      });
      currentGame.drops = [];
    }

    const totalAnswers = currentGame.correct + currentGame.wrong;
    const accuracy = totalAnswers > 0
      ? Math.round((currentGame.correct / totalAnswers) * 100)
      : 0;

    updateSaveByResult(currentGame);
    ensureUnlockByScore(saveData.modeStats.rain.best);
    saveToStorage();
    refreshHomeSummary();
    renderStats();

    lastResult = {
      mode: currentGame.mode,
      score: currentGame.score,
      correct: currentGame.correct,
      wrong: currentGame.wrong,
      accuracy,
      bestCombo: currentGame.bestCombo,
      globalBest: saveData.bestScore
    };

    renderResult(lastResult);
    currentGame = null;
    showView("result");
  }

  function updateSaveByResult(game) {
    saveData.totalGames += 1;
    saveData.totalCorrect += game.correct;
    saveData.totalWrong += game.wrong;
    saveData.bestScore = Math.max(saveData.bestScore, game.score);
    saveData.bestCombo = Math.max(saveData.bestCombo, game.bestCombo);
    saveData.lastMode = game.mode;
    saveData.modeStats[game.mode].playCount += 1;
    saveData.modeStats[game.mode].best = Math.max(saveData.modeStats[game.mode].best, game.score);
  }

  function renderResult(result) {
    els.resultModeLabel.textContent = modes[result.mode].title;
    els.resultScore.textContent = String(result.score);
    els.resultCorrect.textContent = String(result.correct);
    els.resultWrong.textContent = String(result.wrong);
    els.resultAccuracy.textContent = `${result.accuracy}%`;
    els.resultCombo.textContent = String(result.bestCombo);
    els.resultBest.textContent = String(result.globalBest);
  }

  function markWrong(word) {
    if (!word) return;
    saveData.mostWrong[word] = (saveData.mostWrong[word] || 0) + 1;
  }

  function bindEvents() {
    els.modeCards.forEach((card) => {
      card.addEventListener("click", () => {
        setSelectedMode(card.dataset.mode);
      });
    });

    els.startGameBtn.addEventListener("click", () => {
      startGame(selectedMode);
    });

    els.openStatsBtn.addEventListener("click", () => {
      renderStats();
      showView("stats");
    });

    els.closeStatsBtn.addEventListener("click", () => {
      showView("home");
    });

    els.retryBtn.addEventListener("click", () => {
      const mode = lastResult ? lastResult.mode : selectedMode;
      startGame(mode);
    });

    els.goHomeBtn.addEventListener("click", () => {
      showView("home");
    });

    els.backHomeBtn.addEventListener("click", () => {
      if (!currentGame || !currentGame.running) {
        showView("home");
        return;
      }
      const ok = window.confirm("当前对局将结束并返回首页，确认吗？");
      if (!ok) return;
      currentGame.running = false;
      stopGameLoops();
      currentGame = null;
      resetArena();
      showView("home");
    });

    els.pauseBtn.addEventListener("click", togglePause);
    els.inputForm.addEventListener("submit", (event) => {
      event.preventDefault();
      submitCurrentInput();
      els.wordInput.focus();
    });
  }

  function init() {
    ensureUnlockByScore(saveData.modeStats.rain.best);
    refreshHomeSummary();
    renderStats();
    if (saveData.lastMode && modes[saveData.lastMode]) {
      setSelectedMode(saveData.lastMode);
    } else {
      setSelectedMode("rain");
    }
    showView(currentView);
    bindEvents();
  }

  init();
})();
