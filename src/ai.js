// CPU AI State Machine for Sansad Showdown / FIGHT KARO

export class CPUController {
  constructor(difficulty = 'normal') {
    this.difficulty = difficulty; // 'easy', 'normal', 'hard'
    this.decisionTimer = 0;
    this.currentAction = null;
    this.actionDuration = 0;
  }

  setDifficulty(diff) {
    this.difficulty = diff;
  }

  update(dt, cpuFighter, playerFighter) {
    if (cpuFighter.health <= 0 || cpuFighter.state === 'KNOCKDOWN' || cpuFighter.isAttacking()) {
      return;
    }

    this.decisionTimer -= dt;
    this.actionDuration -= dt;

    if (this.actionDuration <= 0 && this.currentAction === 'WALK') {
      cpuFighter.stopWalking();
      this.currentAction = null;
    }

    if (this.decisionTimer <= 0) {
      this.makeDecision(cpuFighter, playerFighter);
    }
  }

  makeDecision(cpu, player) {
    const dx = player.position.x - cpu.position.x;
    const distance = Math.abs(dx);
    const facingPlayer = (dx > 0 && cpu.facing === 1) || (dx < 0 && cpu.facing === -1);

    // Decision interval based on difficulty
    const intervals = { easy: 0.5, normal: 0.25, hard: 0.12 };
    this.decisionTimer = intervals[this.difficulty] || 0.25;

    // Check if Super is ready (Priority for Hard & Normal)
    if (cpu.shakti >= 100) {
      if (this.difficulty === 'hard' || (this.difficulty === 'normal' && distance < 4.0)) {
        cpu.triggerSuper(player);
        return;
      }
    }

    // Defensive check: If player is attacking nearby, should we block?
    if (player.isAttacking() && distance < 2.2) {
      const blockChance = { easy: 0.15, normal: 0.6, hard: 0.9 }[this.difficulty];
      if (Math.random() < blockChance) {
        cpu.block();
        this.actionDuration = 0.3;
        this.currentAction = 'BLOCK';
        return;
      }
    }

    // Attack Range (~1.6 to 2.0 units)
    if (distance <= 2.0) {
      // Choose attack based on difficulty
      const rand = Math.random();
      if (this.difficulty === 'easy') {
        if (rand < 0.4) cpu.lightPunch();
        else if (rand < 0.7) cpu.lightKick();
      } else if (this.difficulty === 'normal') {
        if (rand < 0.3) cpu.lightPunch();
        else if (rand < 0.55) cpu.heavyPunch();
        else if (rand < 0.75) cpu.lightKick();
        else if (rand < 0.9) cpu.lowSweep();
        else cpu.uppercut();
      } else {
        // Hard: High-damage mix-ups
        if (rand < 0.25) cpu.lowSweep(); // Sweep trips player
        else if (rand < 0.55) cpu.uppercut();
        else if (rand < 0.8) cpu.heavyPunch();
        else cpu.lightPunch();
      }
      return;
    }

    // Spacing / Movement: Close in or back away
    if (distance > 2.0) {
      // Move towards player
      const dir = dx > 0 ? 1 : -1;
      cpu.walk(dir);
      this.currentAction = 'WALK';
      this.actionDuration = Math.min(0.4, distance * 0.1);

      // Occasional jump-in approach
      if (this.difficulty !== 'easy' && Math.random() < 0.2 && cpu.isGrounded) {
        cpu.jump();
      }
    } else {
      cpu.stopWalking();
    }
  }
}
