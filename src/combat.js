import * as THREE from 'three';
import { sound } from './audio.js';
import { FxEngine } from './fx.js';

export class CombatEngine {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    this.comboCountP1 = 0;
    this.comboTimerP1 = 0;
    this.comboCountP2 = 0;
    this.comboTimerP2 = 0;

    // Exact GPU Particle and VFX Engine
    this.fx = new FxEngine(this.scene);

    // Screen Shake state
    this.shakeAmt = 0;
    this.shakeDuration = 0;

    // HitStop (Freeze Frames)
    this.hitStop = 0;

    // Paparazzi flash callback
    this.onPaparazzi = null;
  }

  setRenderer(renderer) {
    this.renderer = renderer;
  }

  shakeCamera(amt, duration) {
    this.shakeAmt = Math.max(this.shakeAmt, amt);
    this.shakeDuration = Math.max(this.shakeDuration, duration);
  }

  isHitStopped(dt) {
    if (this.hitStop > 0) {
      this.hitStop--;
      // During hitStop, only particle physics, shockwaves, and camera shake continue updating
      this.fx.update(dt, this.camera);
      if (this.shakeDuration > 0) {
        this.shakeDuration -= dt;
        if (this.shakeDuration <= 0) this.shakeAmt = 0;
      }
      return true;
    }
    return false;
  }

  handleSuperHit(impactData) {
    const { impactPoint, opponent, attacker, moveName, accent, damage } = impactData;

    // Fight Karo exact super impact:
    // 160 particles with speed 11, life 0.9, size 0.3, gravity 4, drag 1.8
    this.fx.particles.emit(impactPoint, {
      count: 160,
      speed: 11,
      color: 0xffa830,
      life: 0.9,
      size: 0.3,
      gravity: 4,
      drag: 1.8
    });

    // Expanding billboard shockwave ring at impact
    this.fx.shockwave(impactPoint, 0xffc370, 0.6, 1.1, true);

    // Expanding horizontal shockwave on the ground
    this.fx.shockwave(new THREE.Vector3(opponent.position.x, 0.04, 0), 0xff9900, 0.8, 1.6, false);

    // Screen flash (Fight Karo golden flash)
    this.fx.flash('rgba(255, 210, 120, 0.9)', 260);

    // Heavy camera shake
    this.shakeCamera(0.5, 0.7);

    // Audio boom
    sound.playSuperExplosion();

    // Comic popup
    this.fx.popup(moveName, impactPoint, accent || '#ffd84a', this.camera, this.renderer);

    // Paparazzi flashes & crowd cheering
    if (this.onPaparazzi) {
      this.onPaparazzi(10);
    }
  }

  update(dt, p1, p2, onCombatEvent) {
    // 1. Combo Timers
    if (this.comboTimerP1 > 0) {
      this.comboTimerP1 -= dt;
      if (this.comboTimerP1 <= 0) this.comboCountP1 = 0;
    }
    if (this.comboTimerP2 > 0) {
      this.comboTimerP2 -= dt;
      if (this.comboTimerP2 <= 0) this.comboCountP2 = 0;
    }

    // 2. Attack Collisions
    this.checkAttackCollision(p1, p2, dt, 'p1', onCombatEvent);
    this.checkAttackCollision(p2, p1, dt, 'p2', onCombatEvent);

    // 3. Update GPU Particles & Billboard Shockwaves
    this.fx.update(dt, this.camera);

    // 4. Screen Shake Decay (Exact Fight Karo decay formula)
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      if (this.shakeDuration <= 0) this.shakeAmt = 0;
    }

    return false;
  }

  checkAttackCollision(attacker, defender, dt, attackerTag, onCombatEvent) {
    if (!attacker.isAttacking() || !attacker.currentAttack || attacker.attackHitRegistered) {
      return;
    }

    const attack = attacker.currentAttack;
    const progress = attacker.stateTime;

    // Active hit frame window
    if (progress < 0.06 || progress > 0.28) {
      return;
    }

    const dx = Math.abs(attacker.position.x - defender.position.x);
    const dy = Math.abs(attacker.position.y - defender.position.y);
    const isFacingDefender = (defender.position.x - attacker.position.x) * attacker.facing >= 0;

    if (isFacingDefender && dx <= attack.range && dy <= 1.8) {
      attacker.attackHitRegistered = true;

      const strength = attack.isHeavy ? 1.2 : 0.5;
      const isTrip = attack.causesTrip || false;
      const result = defender.takeDamage(attack.damage, false, isTrip);
      attacker.shakti = Math.min(100, attacker.shakti + (result.blocked ? 5 : 10));

      const hitX = (attacker.position.x + defender.position.x) / 2;
      const hitY = defender.position.y + 1.4;
      const hitPos = new THREE.Vector3(hitX, hitY, 0);

      if (result.blocked) {
        // --- BLOCKED HIT ---
        sound.playBlock();
        this.hitStop = 3;
        this.shakeCamera(0.04, 0.12);
        this.fx.hitSpark(hitPos, strength, true, attacker.facing);
        this.fx.popup('BLOCKED!', hitPos, '#7fd4ff', this.camera, this.renderer);
      } else {
        // --- CLEAN HIT ---
        sound.playHit(strength);

        const isKnockdown = isTrip || defender.health <= 0;
        this.hitStop = isKnockdown ? 8 : 5;
        this.shakeCamera(0.06 + strength * 0.1, 0.2);

        // GPU neon spark burst (gold) + expanding shockwave ring
        this.fx.hitSpark(hitPos, strength, false, attacker.facing);

        // Comic popup words
        const comicWords = ['THAPPAD!', 'CHATAAK!', 'DHISHOOM!', 'FATAFAT!', 'JUMLA!'];
        const chosenWord = attack.name || comicWords[Math.floor(Math.random() * comicWords.length)];
        const popupColor = attacker.charData.primaryColor || (attackerTag === 'p1' ? '#ffd84a' : '#fb923c');
        this.fx.popup(chosenWord, hitPos, popupColor, this.camera, this.renderer);

        // Heavy blow effects
        if (strength > 0.8 || result.damageDealt >= 15) {
          this.fx.flash('rgba(255, 255, 255, 0.65)', 75);
        }

        // Knockdown effects (ground dust puff, paparazzi flashes)
        if (isKnockdown) {
          sound.playThud();
          this.fx.dust(new THREE.Vector3(defender.position.x, 0.05, 0), 2.2);
          this.fx.shockwave(new THREE.Vector3(defender.position.x, 0.04, 0), 0xffa600, 0.5, 1.4, false);
          if (this.onPaparazzi) {
            this.onPaparazzi(8);
          }
        }

        // Combos
        if (attackerTag === 'p1') {
          this.comboCountP1++;
          this.comboTimerP1 = 1.0;
        } else {
          this.comboCountP2++;
          this.comboTimerP2 = 1.0;
        }
      }

      const activeCombo = attackerTag === 'p1' ? this.comboCountP1 : this.comboCountP2;

      if (onCombatEvent) {
        onCombatEvent({
          type: 'HIT',
          attacker,
          defender,
          attackType: attack.type,
          moveName: attack.name,
          damage: result.damageDealt,
          blocked: result.blocked,
          combo: activeCombo,
          hitPos: { x: hitX, y: hitY }
        });
      }
    }
  }

  getScreenShakeOffset() {
    if (this.shakeDuration <= 0 || this.shakeAmt <= 0) return { x: 0, y: 0 };
    const decay = this.shakeAmt * Math.max(0, Math.min(1, this.shakeDuration * 4));
    return {
      x: (Math.random() - 0.5) * decay,
      y: (Math.random() - 0.5) * decay
    };
  }
}
