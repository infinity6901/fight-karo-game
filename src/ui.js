// UI, HUD, Satire & Broadcast Layer for FIGHT KARO

export class UIManager {
  constructor() {
    this.hud = document.getElementById('fight-hud');
    this.p1HealthFill = document.getElementById('p1-health-fill');
    this.p1HealthGhost = document.getElementById('p1-health-ghost');
    this.p2HealthFill = document.getElementById('p2-health-fill');
    this.p2HealthGhost = document.getElementById('p2-health-ghost');

    this.p1Portrait = document.getElementById('p1-portrait');
    this.p2Portrait = document.getElementById('p2-portrait');
    this.p1Name = document.getElementById('p1-name');
    this.p2Name = document.getElementById('p2-name');
    this.p1Tag = document.getElementById('p1-tag');
    this.p2Tag = document.getElementById('p2-tag');

    this.matchTimer = document.getElementById('match-timer');
    this.matchRoundText = document.getElementById('match-round-text');
    this.announcerBanner = document.getElementById('announcer-banner');
    this.announcerText = document.getElementById('announcer-text');

    this.p1ShaktiFill = document.getElementById('p1-shakti-fill');
    this.p2ShaktiFill = document.getElementById('p2-shakti-fill');
    this.p1SuperReady = document.getElementById('p1-super-ready');
    this.p2SuperReady = document.getElementById('p2-super-ready');

    this.comboDisplay = document.getElementById('combo-display');
    this.comboCount = document.getElementById('combo-count');

    this.tickerText = document.getElementById('ticker-text');
    this.debaterLeftHead = document.getElementById('debater-left-img');
    this.debaterRightHead = document.getElementById('debater-right-img');
    this.debaterLeftQuote = document.getElementById('debater-left-quote');
    this.debaterRightQuote = document.getElementById('debater-right-quote');

    this.speechContainer = document.getElementById('speech-bubbles-container');

    this.victoryModal = document.getElementById('victory-modal');
    this.victoryTitle = document.getElementById('victory-winner-text');
    this.victoryQuote = document.getElementById('victory-quote');
    this.resultStamp = document.getElementById('result-stamp');
    this.statMaxCombo = document.getElementById('stat-max-combo');
    this.statSupersUsed = document.getElementById('stat-supers-used');
    this.statMatchTime = document.getElementById('stat-match-time');

    this.superBanner = document.getElementById('super-banner');
    this.superBannerImg = document.getElementById('super-banner-img');
    this.superBannerTitle = document.getElementById('super-banner-title');
    this.superBannerSub = document.getElementById('super-banner-sub');

    this.initTicker();
  }

  initTicker() {
    this.tickerText.textContent =
      "SATIRE LIVE: Sansad Showdown — the fight nobody demanded ◆ FAKE POLL: MITRAMAN 50% • YATRA BOY 36% • OTHERS 14% ◆ " +
      "BREAKING: Chai cup lost in crossfire. MITRAMAN blamed. ◆ Fact-checkers still verifying HUGPLOMACY. Results by 2029. ◆ " +
      "KURSI INDEX jumps 589 points after GST SWEEP ◆ Panel of 14 experts shouting simultaneously over SURPRISE STRIKE ◆ " +
      "Opposition demands Supreme Court monitored JPC into rival's UPPERCUT! ◆ " +
      "TECH WATCH: Aloo-to-Sona machine breaks internet; potato futures surge 80%! ◆";
  }

  setupMatch(p1Fighter, p2Fighter, isLocal2P = false) {
    this.hud.classList.remove('hidden');

    this.p1Name.textContent = p1Fighter.charData.name;
    this.p2Name.textContent = p2Fighter.charData.name;
    this.p1Portrait.src = p1Fighter.charData.portrait;
    this.p2Portrait.src = p2Fighter.charData.portrait;

    this.p1Tag.textContent = '(YOU)';
    this.p2Tag.textContent = isLocal2P ? '(2P)' : '(CPU)';

    this.updateHealth(p1Fighter, p2Fighter);
    this.updateShakti(p1Fighter, p2Fighter);
    this.updateRounds(p1Fighter.roundsWon, p2Fighter.roundsWon);
  }

  updateTimer(timeRemaining, currentRound = 1) {
    this.matchTimer.textContent = Math.ceil(timeRemaining);
    this.matchRoundText.textContent = `ROUND ${currentRound}`;
    if (timeRemaining <= 10) {
      this.matchTimer.classList.add('low-time');
    } else {
      this.matchTimer.classList.remove('low-time');
    }
  }

  updateHealth(p1, p2) {
    const p1Pct = Math.max(0, (p1.health / p1.maxHealth) * 100);
    const p2Pct = Math.max(0, (p2.health / p2.maxHealth) * 100);

    this.p1HealthFill.style.width = `${p1Pct}%`;
    this.p2HealthFill.style.width = `${p2Pct}%`;

    setTimeout(() => {
      this.p1HealthGhost.style.width = `${p1Pct}%`;
      this.p2HealthGhost.style.width = `${p2Pct}%`;
    }, 240);
  }

  updateShakti(p1, p2) {
    this.p1ShaktiFill.style.width = `${p1.shakti}%`;
    this.p2ShaktiFill.style.width = `${p2.shakti}%`;

    if (p1.shakti >= 100) {
      this.p1ShaktiFill.classList.add('full');
      const keyHint = document.body.classList.contains('touch-device') ? '' : ' [SPACE / L]';
      this.p1SuperReady.textContent = `${p1.charData.superMove?.name || 'SUPER'} READY!${keyHint}`;
      this.p1SuperReady.classList.remove('hidden');
    } else {
      this.p1ShaktiFill.classList.remove('full');
      this.p1SuperReady.classList.add('hidden');
    }

    if (p2.shakti >= 100) {
      this.p2ShaktiFill.classList.add('full');
      this.p2SuperReady.textContent = `${p2.charData.superMove?.name || 'SUPER'} READY!`;
      this.p2SuperReady.classList.remove('hidden');
    } else {
      this.p2ShaktiFill.classList.remove('full');
      this.p2SuperReady.classList.add('hidden');
    }
  }

  updateRounds(p1Rounds, p2Rounds) {
    const p1Pips = document.querySelectorAll('#p1-rounds .pip');
    const p2Pips = document.querySelectorAll('#p2-rounds .pip');

    p1Pips.forEach((pip, idx) => {
      if (idx < p1Rounds) pip.classList.add('won');
      else pip.classList.remove('won');
    });

    p2Pips.forEach((pip, idx) => {
      if (idx < p2Rounds) pip.classList.add('won');
      else pip.classList.remove('won');
    });
  }

  showAnnouncement(text, duration = 1200) {
    this.announcerText.textContent = text;
    this.announcerBanner.classList.remove('hidden');

    this.announcerBanner.style.animation = 'none';
    this.announcerBanner.offsetHeight;
    this.announcerBanner.style.animation = null;

    setTimeout(() => {
      this.announcerBanner.classList.add('hidden');
    }, duration);
  }

  showCombo(count) {
    if (count < 2) {
      this.comboDisplay.classList.add('hidden');
      return;
    }
    this.comboCount.textContent = count;
    this.comboDisplay.classList.remove('hidden');
  }

  hideCombo() {
    this.comboDisplay.classList.add('hidden');
  }

  spawnSpeechBubble(fighter, text, camera, renderer) {
    if (!text) return;
    const bubble = document.createElement('div');
    bubble.className = 'speech-bubble';
    bubble.textContent = text;
    this.speechContainer.appendChild(bubble);

    const headPos = fighter.position.clone();
    headPos.y += 2.6;
    headPos.project(camera);

    const halfWidth = renderer.domElement.clientWidth / 2;
    const halfHeight = renderer.domElement.clientHeight / 2;

    const screenX = (headPos.x * halfWidth) + halfWidth;
    const screenY = -(headPos.y * halfHeight) + halfHeight;

    bubble.style.left = `${screenX}px`;
    bubble.style.top = `${screenY}px`;

    setTimeout(() => {
      if (bubble.parentNode) bubble.parentNode.removeChild(bubble);
    }, 2400);
  }

  handleCombatEvent(event) {
    if (event.type === 'HIT') {
      this.debaterLeftHead.classList.add('bobbing');
      this.debaterRightHead.classList.add('bobbing');
      setTimeout(() => {
        this.debaterLeftHead.classList.remove('bobbing');
        this.debaterRightHead.classList.remove('bobbing');
      }, 500);

      const quotesLeft = [
        "Opposition is SPEECHLESS!",
        "Poori timeline samajhiye... planned strike!",
        "Masterstroke strike landed!",
        "K.O. ki tayyari shuru!",
        "Potato in, gold out?! Auditors on the way!"
      ];
      const quotesRight = [
        "That was a JUMLA punch, didn't even hurt!",
        "Not today, bro. BLOCKED.",
        "Yatra bhai ne fatafat maar diya!",
        "Bro hit him with a WhatsApp forward 💀",
        "Hum walkout karenge!"
      ];

      this.debaterLeftQuote.textContent = quotesLeft[Math.floor(Math.random() * quotesLeft.length)];
      this.debaterRightQuote.textContent = quotesRight[Math.floor(Math.random() * quotesRight.length)];

      if (event.combo >= 3 || event.damage > 14) {
        const headline = `BREAKING: ${event.attacker.charData.name}'s ${event.moveName || 'strike'} lands! Twitter in absolute meltdown! ◆ `;
        this.tickerText.textContent = headline + this.tickerText.textContent;
      }
    }
  }

  showSuperBanner(fighter, isP1 = true) {
    if (!this.superBanner) return;
    const accent = fighter.charData.accentColor || '#ff9933';
    this.superBanner.style.setProperty('--accent', accent);
    this.superBanner.innerHTML = `
      <img src="${fighter.charData.portrait}" alt="${fighter.charData.name}">
      <div>
        <small>${fighter.charData.name}</small>
        <span>${fighter.charData.superMove?.name || 'SUPER STRIKE'}!</span>
      </div>
    `;
    this.superBanner.className = `super-banner show ${isP1 ? 'from-left' : 'from-right'}`;
    this.toggleCinema(true);

    setTimeout(() => {
      this.superBanner.className = 'super-banner hidden';
      this.toggleCinema(false);
    }, 1700);
  }

  toggleCinema(active) {
    const cinema = document.getElementById('cinema');
    if (cinema) {
      cinema.classList.toggle('on', active);
    }
  }

  showVictoryModal(winner, isP1Winner, matchStats, onRematch, onSelectNeta) {
    this.victoryTitle.textContent = `${winner.charData.name} WINS!`;
    this.victoryQuote.textContent = `"${winner.charData.quotes?.win || 'Total victory!'}"`;

    if (this.resultStamp) {
      this.resultStamp.textContent = isP1Winner ? 'YOU WIN!' : 'YOU LOSE!';
      if (isP1Winner) {
        this.resultStamp.classList.remove('lose');
      } else {
        this.resultStamp.classList.add('lose');
      }
    }

    this.statMaxCombo.textContent = matchStats.maxCombo || 1;
    this.statSupersUsed.textContent = matchStats.supersUsed || 0;
    this.statMatchTime.textContent = `${Math.round(matchStats.matchTime)}s`;

    this.victoryModal.classList.remove('hidden');

    const rematchBtn = document.getElementById('btn-rematch');
    const selectBtn = document.getElementById('btn-char-select');

    rematchBtn.onclick = () => {
      this.victoryModal.classList.add('hidden');
      if (onRematch) onRematch();
    };

    selectBtn.onclick = () => {
      this.victoryModal.classList.add('hidden');
      this.hud.classList.add('hidden');
      if (onSelectNeta) onSelectNeta();
    };
  }
}
