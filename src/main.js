// Main Game Controller for Sansad Showdown (FIGHT KARO)

import * as THREE from 'three';
import { sound } from './audio.js';
import { getAllCharacters, getCharacterById, loadSavedCustomFighter } from './characters.js';
import { ArenaStage } from './stage.js';
import { Fighter, FIGHTER_STATE } from './fighter.js';
import { CombatEngine } from './combat.js';
import { CPUController } from './ai.js';
import { UIManager } from './ui.js';
import { CustomCharacterModal } from './customCharacterModal.js';

class GameApp {
  constructor() {
    this.canvas = document.getElementById('three-canvas');
    this.ui = new UIManager();
    this.cpuAI = new CPUController('normal');
    this.customModal = new CustomCharacterModal((customChar) => this.onCustomCharacterSaved(customChar));

    // Game settings & states
    this.gameState = 'SELECT'; // 'SELECT', 'FIGHTING', 'ROUND_OVER', 'MATCH_OVER', 'PAUSED'
    this.gameMode = 'cpu';     // 'cpu' or 'local2p'
    this.cpuDifficulty = 'normal';
    this.selectedStage = 'sansad';

    this.p1CharId = 'mitraman';
    this.p2CharId = 'yatraboy';

    this.p1Fighter = null;
    this.p2Fighter = null;

    // Match tracking
    this.currentRound = 1;
    this.roundTimeRemaining = 60;
    this.matchStats = { maxCombo: 0, supersUsed: 0, matchTime: 0 };
    this.keys = {};
    this.timeScale = 1.0;
    this.isCowPassing = false;

    this.initThree();
    this.loadInitialData();
    this.setupSelectScreen();
    this.bindGlobalKeys();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autostart') === '1') {
      this.startMatch();
    } else if (urlParams.get('modal') === '1') {
      this.customModal.open();
    }

    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.animate(t));
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.05, 400);
    this.camera.position.set(0, 1.8, 6.2);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.stage = new ArenaStage(this.scene);
    this.combat = new CombatEngine(this.scene, this.camera, this.renderer);
    this.combat.onPaparazzi = (count) => this.stage.triggerPaparazzi(count);

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.combat.setRenderer(this.renderer);
    });
  }

  loadInitialData() {
    loadSavedCustomFighter();
  }

  // --- Character Selection Screen ---
  setupSelectScreen() {
    this.selectScreen = document.getElementById('character-select-screen');
    this.rosterGrid = document.getElementById('roster-grid');

    this.selP1Img = document.getElementById('sel-p1-img');
    this.selP1Name = document.getElementById('sel-p1-name');
    this.selP1Team = document.getElementById('sel-p1-team');
    this.selP1Super = document.getElementById('sel-p1-super');

    this.selP2Img = document.getElementById('sel-p2-img');
    this.selP2Name = document.getElementById('sel-p2-name');
    this.selP2Team = document.getElementById('sel-p2-team');
    this.selP2Super = document.getElementById('sel-p2-super');
    this.p2ModeTag = document.getElementById('p2-mode-tag');

    // Create Own Character button
    document.getElementById('btn-create-character').addEventListener('click', () => {
      this.customModal.open();
    });

    // Fight Button
    document.getElementById('btn-fight').addEventListener('click', () => {
      sound.init();
      sound.playUIConfirm();
      sound.startBGM();
      this.startMatch();
    });

    // Mode Toggle Buttons
    const modeBtns = document.querySelectorAll('#mode-selector .opt-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.gameMode = btn.dataset.mode;
        this.p2ModeTag.textContent = this.gameMode === 'cpu' ? 'CPU' : '2P';
        document.getElementById('cpu-diff-group').style.display = this.gameMode === 'cpu' ? 'flex' : 'none';
        sound.playUISelect();
      });
    });

    // Difficulty Toggle Buttons
    const diffBtns = document.querySelectorAll('#diff-selector .opt-btn');
    diffBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        diffBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.cpuDifficulty = btn.dataset.diff;
        this.cpuAI.setDifficulty(this.cpuDifficulty);
        sound.playUISelect();
      });
    });

    // Stage Selector Toggle Buttons
    const stageBtns = document.querySelectorAll('#stage-selector .opt-btn');
    stageBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        stageBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedStage = btn.dataset.stage;
        this.stage.setStage(this.selectedStage);
        sound.playUISelect();
      });
    });

    // Audio Toggle
    const audioBtn = document.getElementById('audio-toggle-btn');
    const audioIcon = document.getElementById('audio-icon');
    audioBtn.addEventListener('click', () => {
      const isMuted = sound.toggleMute();
      audioIcon.textContent = isMuted ? '🔇' : '🔊';
    });

    this.renderRoster();
    this.updatePreviewCards();
  }

  renderRoster() {
    this.rosterGrid.innerHTML = '';
    const characters = getAllCharacters();

    characters.forEach(char => {
      const card = document.createElement('div');
      card.className = 'roster-card';
      if (char.id === this.p1CharId) card.classList.add('selected-p1');
      if (char.id === this.p2CharId) card.classList.add('selected-p2');

      const img = document.createElement('img');
      img.src = char.portrait;
      img.alt = char.name;

      const name = document.createElement('div');
      name.className = 'roster-card-name';
      name.textContent = char.name;

      card.appendChild(img);
      card.appendChild(name);

      // Left click = Select P1, Right click or Shift+click = Select P2
      card.addEventListener('click', (e) => {
        if (e.shiftKey) {
          this.p2CharId = char.id;
        } else {
          this.p1CharId = char.id;
        }
        sound.playUISelect();
        this.renderRoster();
        this.updatePreviewCards();
      });

      card.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.p2CharId = char.id;
        sound.playUISelect();
        this.renderRoster();
        this.updatePreviewCards();
      });

      this.rosterGrid.appendChild(card);
    });
  }

  updatePreviewCards() {
    const p1 = getCharacterById(this.p1CharId);
    const p2 = getCharacterById(this.p2CharId);

    this.selP1Img.src = p1.portrait;
    this.selP1Name.textContent = p1.name;
    this.selP1Team.textContent = p1.team;
    this.selP1Super.textContent = `${p1.superMove.name} — ${p1.superMove.desc}`;

    this.selP2Img.src = p2.portrait;
    this.selP2Name.textContent = p2.name;
    this.selP2Team.textContent = p2.team;
    this.selP2Super.textContent = `${p2.superMove.name} — ${p2.superMove.desc}`;
  }

  onCustomCharacterSaved(updatedCustomChar) {
    this.p1CharId = updatedCustomChar.id;
    this.renderRoster();
    this.updatePreviewCards();
  }

  // --- Match Flow ---
  startMatch() {
    this.selectScreen.classList.add('hidden');
    this.gameState = 'FIGHTING';
    this.currentRound = 1;
    this.matchStats = { maxCombo: 0, supersUsed: 0, matchTime: 0 };
    this.timeScale = 1.0;
    this.isCowPassing = false;

    // Apply chosen stage arena
    this.stage.setStage(this.selectedStage);

    const p1Data = getCharacterById(this.p1CharId);
    const p2Data = getCharacterById(this.p2CharId);

    // Clean up old fighters
    if (this.p1Fighter) this.p1Fighter.destroy();
    if (this.p2Fighter) this.p2Fighter.destroy();

    this.p1Fighter = new Fighter(p1Data, this.scene, false);
    this.p2Fighter = new Fighter(p2Data, this.scene, true);

    const onSuper = (f) => {
      this.matchStats.supersUsed++;
      this.stage.cheer();
      this.ui.showSuperBanner(f, f === this.p1Fighter);
      this.ui.spawnSpeechBubble(f, f.charData.quotes?.super, this.camera, this.renderer);
    };
    this.p1Fighter.onSuperTriggered = onSuper;
    this.p2Fighter.onSuperTriggered = onSuper;

    this.p1Fighter.onSuperImpact = (data) => this.combat.handleSuperHit(data);
    this.p2Fighter.onSuperImpact = (data) => this.combat.handleSuperHit(data);

    this.p1Fighter.onDust = (pos, mult) => this.combat.fx.dust(pos, mult);
    this.p2Fighter.onDust = (pos, mult) => this.combat.fx.dust(pos, mult);

    const vignette = document.getElementById('vignette');
    if (vignette) vignette.classList.add('on');

    this.ui.setupMatch(this.p1Fighter, this.p2Fighter, this.gameMode === 'local2p');
    this.startRound(this.currentRound);
  }

  startRound(roundNumber) {
    this.currentRound = roundNumber;
    this.roundTimeRemaining = 60;
    this.timeScale = 1.0;
    this.isCowPassing = false;

    this.p1Fighter.resetPosition(-3.5);
    this.p2Fighter.resetPosition(3.5);

    this.p1Fighter.health = this.p1Fighter.maxHealth;
    this.p2Fighter.health = this.p2Fighter.maxHealth;

    this.ui.updateHealth(this.p1Fighter, this.p2Fighter);
    this.ui.updateTimer(this.roundTimeRemaining, this.currentRound);

    // Authentic round voice announcer
    if (roundNumber === 1) sound.announce('round_1');
    else if (roundNumber === 2) sound.announce('round_2');
    else sound.announce('final_round');

    this.ui.showAnnouncement(`ROUND ${roundNumber}`, 1100);

    setTimeout(() => {
      this.ui.showAnnouncement('FIGHT!', 900);
      sound.announce('fight');

      // Character battle cries & speech bubbles
      sound.playCharacterVoice(this.p1Fighter.charData.id);
      this.ui.spawnSpeechBubble(this.p1Fighter, this.p1Fighter.charData.quotes?.start, this.camera, this.renderer);
      setTimeout(() => {
        sound.playCharacterVoice(this.p2Fighter.charData.id);
        this.ui.spawnSpeechBubble(this.p2Fighter, this.p2Fighter.charData.quotes?.start, this.camera, this.renderer);
      }, 500);
    }, 1100);
  }

  checkRoundOver() {
    if (this.gameState !== 'FIGHTING') return;

    let roundWinner = null;
    if (this.p1Fighter.health <= 0) roundWinner = this.p2Fighter;
    else if (this.p2Fighter.health <= 0) roundWinner = this.p1Fighter;
    else if (this.roundTimeRemaining <= 0) {
      roundWinner = this.p1Fighter.health >= this.p2Fighter.health ? this.p1Fighter : this.p2Fighter;
    }

    if (roundWinner) {
      this.gameState = 'ROUND_OVER';
      roundWinner.roundsWon++;
      roundWinner.setState(FIGHTER_STATE.VICTORY);

      // Signature Slow-motion K.O. effect & heavy impact VFX
      this.timeScale = 0.28;
      this.combat.fx.flash('rgba(255, 255, 255, 0.85)', 150);
      this.combat.shakeCamera(0.4, 0.6);
      const loser = roundWinner === this.p1Fighter ? this.p2Fighter : this.p1Fighter;
      this.combat.fx.shockwave(new THREE.Vector3(loser.position.x, 0.04, 0), 0xffa600, 0.6, 1.5, false);
      this.stage.triggerPaparazzi(12);

      setTimeout(() => {
        this.timeScale = 1.0;
      }, 1200);

      sound.playKO();
      this.ui.showAnnouncement('K.O.!', 1400);
      this.ui.updateRounds(this.p1Fighter.roundsWon, this.p2Fighter.roundsWon);
      this.stage.cheer();

      setTimeout(() => {
        // Check match victory (Best of 3 -> first to 2 rounds)
        if (this.p1Fighter.roundsWon >= 2 || this.p2Fighter.roundsWon >= 2) {
          this.endMatch(roundWinner);
        } else {
          this.gameState = 'FIGHTING';
          this.startRound(this.currentRound + 1);
        }
      }, 2200);
    }
  }

  endMatch(winner) {
    this.gameState = 'MATCH_OVER';
    const isP1 = winner === this.p1Fighter;

    const vignette = document.getElementById('vignette');
    if (vignette) vignette.classList.remove('on');

    sound.announce(isP1 ? 'you_win' : 'you_lose');
    sound.playClip(isP1 ? 'jingle_win' : 'jingle_lose', 1.0);
    sound.playCharacterVoice(winner.charData.id);

    this.ui.showVictoryModal(
      winner,
      isP1,
      this.matchStats,
      () => this.startMatch(),
      () => {
        this.selectScreen.classList.remove('hidden');
        this.gameState = 'SELECT';
      }
    );
  }

  // --- Input Handling ---
  bindGlobalKeys() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      this.keys[e.code] = true;

      // Global keys
      if (e.key === 'Escape') {
        this.togglePause();
      }
      if (e.key.toLowerCase() === 'm') {
        const isMuted = sound.toggleMute();
        document.getElementById('audio-icon').textContent = isMuted ? '🔇' : '🔊';
      }

      if (this.gameState !== 'FIGHTING') return;

      // --- PLAYER 1 COMBAT INPUTS ---
      // Attacks: J = Punch, K = Kick
      if (e.key.toLowerCase() === 'j') {
        const isCrouching = this.keys['s'] || this.keys['arrowdown'];
        const isForward = (this.keys['d'] && this.p1Fighter.facing === 1) || (this.keys['a'] && this.p1Fighter.facing === -1);

        if (isCrouching && isForward) {
          this.p1Fighter.uppercut();
        } else if (isForward) {
          this.p1Fighter.heavyPunch();
        } else {
          this.p1Fighter.lightPunch();
        }
      }

      if (e.key.toLowerCase() === 'k') {
        const isCrouching = this.keys['s'] || this.keys['arrowdown'];
        if (isCrouching) {
          this.p1Fighter.lowSweep();
        } else {
          this.p1Fighter.lightKick();
        }
      }

      // Super Move: Space or L
      if (e.code === 'Space' || e.key.toLowerCase() === 'l') {
        const triggered = this.p1Fighter.triggerSuper(this.p2Fighter);
        if (triggered) {
          this.matchStats.supersUsed++;
          this.stage.cheer();
          this.ui.spawnSpeechBubble(this.p1Fighter, this.p1Fighter.charData.quotes?.super, this.camera, this.renderer);
        }
      }

      // --- PLAYER 2 COMBAT INPUTS (Local 2P Mode) ---
      if (this.gameMode === 'local2p') {
        if (e.key === '1' || e.key.toLowerCase() === 'u') {
          const isForward = (this.keys['arrowright'] && this.p2Fighter.facing === 1) || (this.keys['arrowleft'] && this.p2Fighter.facing === -1);
          if (isForward) this.p2Fighter.heavyPunch();
          else this.p2Fighter.lightPunch();
        }
        if (e.key === '2' || e.key.toLowerCase() === 'i') {
          if (this.keys['arrowdown']) this.p2Fighter.lowSweep();
          else this.p2Fighter.lightKick();
        }
        if (e.key === 'Enter' || e.key.toLowerCase() === 'o') {
          const triggered = this.p2Fighter.triggerSuper(this.p1Fighter);
          if (triggered) {
            this.matchStats.supersUsed++;
            this.stage.cheer();
            this.ui.spawnSpeechBubble(this.p2Fighter, this.p2Fighter.charData.quotes?.super, this.camera, this.renderer);
          }
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
      this.keys[e.code] = false;
    });

    // Pause Resume & Quit
    document.getElementById('btn-resume').addEventListener('click', () => this.togglePause());
    document.getElementById('btn-quit-to-menu').addEventListener('click', () => {
      document.getElementById('pause-modal').classList.add('hidden');
      this.ui.hud.classList.add('hidden');
      this.selectScreen.classList.remove('hidden');
      this.gameState = 'SELECT';
    });
  }

  togglePause() {
    if (this.gameState === 'FIGHTING') {
      this.gameState = 'PAUSED';
      document.getElementById('pause-modal').classList.remove('hidden');
    } else if (this.gameState === 'PAUSED') {
      this.gameState = 'FIGHTING';
      document.getElementById('pause-modal').classList.add('hidden');
    }
  }

  handleContinuousInput(dt) {
    if (this.gameState !== 'FIGHTING' || this.isCowPassing) return;

    // --- Player 1 Movement ---
    if (this.p1Fighter.isGrounded && !this.p1Fighter.isAttacking()) {
      if (this.keys['w']) {
        this.p1Fighter.jump();
        this.stage.spawnDust(this.p1Fighter.position.x, this.p1Fighter.position.z, 0.8);
      } else if (this.keys['s']) {
        this.p1Fighter.crouch();
      } else if (this.keys['a']) {
        // If moving away from opponent, block
        if (this.p1Fighter.facing === 1) {
          this.p1Fighter.block();
        } else {
          this.p1Fighter.walk(-1);
        }
      } else if (this.keys['d']) {
        if (this.p1Fighter.facing === -1) {
          this.p1Fighter.block();
        } else {
          this.p1Fighter.walk(1);
        }
      } else {
        this.p1Fighter.stopWalking();
      }
    }

    // --- Player 2 Movement (Local 2P) ---
    if (this.gameMode === 'local2p') {
      if (this.p2Fighter.isGrounded && !this.p2Fighter.isAttacking()) {
        if (this.keys['arrowup']) {
          this.p2Fighter.jump();
          this.stage.spawnDust(this.p2Fighter.position.x, this.p2Fighter.position.z, 0.8);
        } else if (this.keys['arrowdown']) {
          this.p2Fighter.crouch();
        } else if (this.keys['arrowleft']) {
          if (this.p2Fighter.facing === 1) this.p2Fighter.block();
          else this.p2Fighter.walk(-1);
        } else if (this.keys['arrowright']) {
          if (this.p2Fighter.facing === -1) this.p2Fighter.block();
          else this.p2Fighter.walk(1);
        } else {
          this.p2Fighter.stopWalking();
        }
      }
    }
  }

  // --- Main Animation & Render Loop ---
  animate(currentTime) {
    requestAnimationFrame((t) => this.animate(t));

    const rawDt = Math.min((currentTime - this.lastTime) / 1000, 0.05); // cap delta time to 50ms
    this.lastTime = currentTime;
    const dt = rawDt * (this.timeScale || 1.0);

    if (this.gameState === 'FIGHTING' || this.gameState === 'ROUND_OVER') {
      const isFrozen = this.combat.isHitStopped(dt);

      if (!isFrozen) {
        this.handleContinuousInput(dt);

        // CPU AI Update (pauses politely when Sacred Gaumata is crossing)
        if (this.gameMode === 'cpu' && this.gameState === 'FIGHTING' && !this.isCowPassing) {
          this.cpuAI.update(dt, this.p2Fighter, this.p1Fighter);
        }

        // Update Fighters
        this.p1Fighter.update(dt, this.p2Fighter);
        this.p2Fighter.update(dt, this.p1Fighter);

        // Update Combat Collisions & Effects
        this.combat.update(dt, this.p1Fighter, this.p2Fighter, (event) => {
          this.ui.handleCombatEvent(event);
          if (event.combo > this.matchStats.maxCombo) {
            this.matchStats.maxCombo = event.combo;
          }
          if (event.combo >= 2) {
            this.ui.showCombo(event.combo);
          }

          // Reactive Chai Stall Spill Event (Fighters slammed into tea stall on the right)
          if ((event.hitPos.x > 7.5 || event.defender.position.x > 7.5) && (event.attackType === 'heavy' || event.damage >= 10)) {
            this.stage.spillChaiCup(event.attacker.charData.name, (spillEvent) => {
              this.ui.tickerText.textContent = spillEvent.headline + ' ◆ ' + this.ui.tickerText.textContent;
              this.ui.debaterLeftQuote.textContent = "Chai bhaiya demands ₹10 UPI immediately!";
              this.ui.debaterRightQuote.textContent = "National loss! Flying cutting chai across the aisle!";
            });
          }

          // Random chance of hit speech bubble
          if (Math.random() < 0.25) {
            this.ui.spawnSpeechBubble(event.defender, event.defender.charData.quotes?.hit, this.camera, this.renderer);
          }
        });

        // Update Match Timer (Pauses during Cow Crossing)
        if (this.gameState === 'FIGHTING' && !this.isCowPassing) {
          this.roundTimeRemaining = Math.max(0, this.roundTimeRemaining - dt);
          this.matchStats.matchTime += dt;
          this.ui.updateTimer(this.roundTimeRemaining, this.currentRound);
          this.ui.updateHealth(this.p1Fighter, this.p2Fighter);
          this.ui.updateShakti(this.p1Fighter, this.p2Fighter);
          this.checkRoundOver();
        }
      } else {
        this.ui.updateHealth(this.p1Fighter, this.p2Fighter);
        this.ui.updateShakti(this.p1Fighter, this.p2Fighter);
      }

      // Update Stage animations (bystanders, paparazzi flashes, Sacred Cow, flying cup)
      this.stage.update(dt, (event) => {
        if (event.type === 'COW_ENTER') {
          this.isCowPassing = true;
          this.ui.showAnnouncement('⚠ GAUMATA CROSSING - SAB RUK JAO! ⚠', 2500);
          this.ui.tickerText.textContent = event.headline + ' ◆ ' + this.ui.tickerText.textContent;
          this.ui.debaterLeftQuote.textContent = "All Sansad bills paused for holy blessings!";
          this.ui.debaterRightQuote.textContent = "Total ceasefire! Even the opposition is bowing!";
        } else if (event.type === 'COW_EXIT') {
          this.isCowPassing = false;
          this.ui.showAnnouncement('FIGHT!', 900);
          sound.announce('fight');
        } else if (event.type === 'CHAI_SHOUT') {
          this.ui.tickerText.textContent = `VILLAGE CHAI: "${event.shout}" ◆ ` + this.ui.tickerText.textContent;
        }
      });

      // Dynamic Camera Framing (Follows center point between fighters)
      this.updateCamera(dt);
    }

    this.renderer.render(this.scene, this.camera);
  }

  updateCamera(dt) {
    if (!this.p1Fighter || !this.p2Fighter) return;

    const p1x = this.p1Fighter.position.x;
    const p2x = this.p2Fighter.position.x;
    const p1y = this.p1Fighter.position.y;
    const p2y = this.p2Fighter.position.y;

    const midX = (p1x + p2x) / 2;
    const dist = Math.abs(p1x - p2x);

    // Exact Fight Karo camera framing math
    const targetZ = Math.min(8.5, Math.max(4.4, 3.4 + dist * 0.85));
    const vertOffset = Math.max(p1y, p2y) * 0.35;
    const aspect = this.camera.aspect;
    const portraitAdjust = aspect < 1 ? (1 - aspect) * 5 : 0;

    const targetPosY = 1.55 + dist * 0.06 + vertOffset;
    const targetPosZ = targetZ + portraitAdjust;
    const targetLookY = 1.0 + vertOffset * 0.8;

    // Exponential smoothing
    const smoothFactor = 1 - Math.exp(-5.0 * dt);

    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, midX, smoothFactor);
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, targetPosY, smoothFactor);
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, targetPosZ, smoothFactor);

    // Direct screen shake jolt
    const shake = this.combat.getScreenShakeOffset();
    this.camera.position.x += shake.x;
    this.camera.position.y += shake.y;

    this.camera.lookAt(midX, targetLookY, 0);
  }
}

// Boot application
window.addEventListener('DOMContentLoaded', () => {
  window.app = new GameApp();
});
