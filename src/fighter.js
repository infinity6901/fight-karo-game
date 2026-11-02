import * as THREE from 'three';
import { sound } from './audio.js';
import { CharacterModel } from './fighterModel.js';
import * as K from './kinematics.js';

export const FIGHTER_STATE = {
  IDLE: 'IDLE',
  WALK_FWD: 'WALK_FWD',
  WALK_BACK: 'WALK_BACK',
  JUMP: 'JUMP',
  CROUCH: 'CROUCH',
  BLOCK: 'BLOCK',
  LIGHT_PUNCH: 'LIGHT_PUNCH',
  HEAVY_PUNCH: 'HEAVY_PUNCH',
  LIGHT_KICK: 'LIGHT_KICK',
  LOW_SWEEP: 'LOW_SWEEP',
  UPPERCUT: 'UPPERCUT',
  HURT: 'HURT',
  KNOCKDOWN: 'KNOCKDOWN',
  SUPER: 'SUPER',
  VICTORY: 'VICTORY'
};

export class Fighter {
  constructor(charData, scene, isPlayer2 = false) {
    this.charData = charData;
    this.scene = scene;
    this.isPlayer2 = isPlayer2;

    // Combat Stats & State
    this.maxHealth = 100;
    this.health = 100;
    this.shakti = 0;
    this.roundsWon = 0;

    // Position & Physics
    this.position = new THREE.Vector3(isPlayer2 ? 3.5 : -3.5, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.facing = isPlayer2 ? -1 : 1; // 1 = facing right, -1 = facing left
    this.isGrounded = true;

    // State machine
    this.state = FIGHTER_STATE.IDLE;
    this.stateTime = 0;
    this.animTime = 0;
    this.hitstun = 0;
    this.blockstun = 0;
    this.invincible = false;

    // Active attack frame data
    this.currentAttack = null;
    this.attackHitRegistered = false;

    // Root Three.js Group
    this.group = new THREE.Group();

    // Procedural Fallback Mesh Group
    this.proceduralGroup = new THREE.Group();
    this.buildProceduralFallback();
    this.group.add(this.proceduralGroup);

    // Exact 3D Rigged Model Loader
    this.model = new CharacterModel(this.charData, () => {
      // Once GLTF character model is loaded and ready, hide the procedural fallback
      this.proceduralGroup.visible = false;
    });
    this.group.add(this.model.root);

    this.scene.add(this.group);

    // Super move prop
    this.superProp = null;
    this.superPhase = 0;

    this.updatePosition();
  }

  // --- Procedural Fallback (Instantaneous while GLB loads) ---
  buildProceduralFallback() {
    const skinColor = this.charData.skinTone || '#e0ac69';
    const primaryColor = this.charData.primaryColor || '#ea580c';
    const pantsColor = this.charData.pantsColor || '#ffffff';

    this.skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.75 });
    this.torsoMat = new THREE.MeshStandardMaterial({ color: primaryColor, roughness: 0.7 });
    this.pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.8 });

    this.pelvis = new THREE.Group();
    this.pelvis.position.y = 1.6;
    this.proceduralGroup.add(this.pelvis);

    const hipMesh = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.36, 0.46), this.pantsMat);
    this.pelvis.add(hipMesh);

    this.spine = new THREE.Group();
    this.spine.position.y = 0.2;
    this.pelvis.add(this.spine);

    const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.86, 1.05, 0.52), this.torsoMat);
    torsoMesh.position.y = 0.525;
    this.spine.add(torsoMesh);

    this.head = new THREE.Group();
    this.head.position.y = 1.35;
    this.spine.add(this.head);

    const headTexSrc = this.charData.customFaceDataUrl || this.charData.faceTexture || this.charData.portrait;
    const texLoader = new THREE.TextureLoader();
    const headTex = texLoader.load(headTexSrc);
    headTex.colorSpace = THREE.SRGBColorSpace;

    const headMat = new THREE.MeshStandardMaterial({ map: headTex, roughness: 0.65 });
    const headMats = [this.skinMat, this.skinMat, this.skinMat, this.skinMat, headMat, this.skinMat];
    const headBox = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.82, 0.68), headMats);
    this.head.add(headBox);

    // Left Arm
    this.leftShoulder = new THREE.Group();
    this.leftShoulder.position.set(-0.58, 0.88, 0);
    this.spine.add(this.leftShoulder);
    this.leftElbow = new THREE.Group();
    this.leftElbow.position.y = -0.62;
    this.leftShoulder.add(this.leftElbow);
    this.leftFist = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), this.skinMat);
    this.leftFist.position.y = -0.62;
    this.leftElbow.add(this.leftFist);

    // Right Arm
    this.rightShoulder = new THREE.Group();
    this.rightShoulder.position.set(0.58, 0.88, 0);
    this.spine.add(this.rightShoulder);
    this.rightElbow = new THREE.Group();
    this.rightElbow.position.y = -0.62;
    this.rightShoulder.add(this.rightElbow);
    this.rightFist = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), this.skinMat);
    this.rightFist.position.y = -0.62;
    this.rightElbow.add(this.rightFist);

    // Legs
    this.leftHip = new THREE.Group();
    this.leftHip.position.set(-0.26, 0, 0);
    this.pelvis.add(this.leftHip);
    this.leftKnee = new THREE.Group();
    this.leftKnee.position.y = -0.72;
    this.leftHip.add(this.leftKnee);
    this.leftFoot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.13, 0.44), this.skinMat);
    this.leftFoot.position.set(0, -0.72, 0.12);
    this.leftKnee.add(this.leftFoot);

    this.rightHip = new THREE.Group();
    this.rightHip.position.set(0.26, 0, 0);
    this.pelvis.add(this.rightHip);
    this.rightKnee = new THREE.Group();
    this.rightKnee.position.y = -0.72;
    this.rightHip.add(this.rightKnee);
    this.rightFoot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.13, 0.44), this.skinMat);
    this.rightFoot.position.set(0, -0.72, 0.12);
    this.rightKnee.add(this.rightFoot);

    // Super Aura glow sphere
    const auraGeo = new THREE.SphereGeometry(2.0, 16, 16);
    this.auraMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0,
      wireframe: true
    });
    this.auraMesh = new THREE.Mesh(auraGeo, this.auraMat);
    this.auraMesh.position.y = 1.5;
    this.group.add(this.auraMesh);
  }

  // --- Animation State Machine & Kinematics Pose Evaluation ---
  update(dt, opponent) {
    this.stateTime += dt;
    this.animTime += dt;

    // Face opponent automatically when grounded & not in active attack
    if (this.isGrounded && this.state !== FIGHTER_STATE.KNOCKDOWN && !this.isAttacking()) {
      const dx = opponent.position.x - this.position.x;
      this.facing = dx >= 0 ? 1 : -1;
    }
    this.group.rotation.y = this.facing === 1 ? Math.PI * 0.5 : -Math.PI * 0.5;

    // Handle Hitstun & Blockstun
    if (this.hitstun > 0) {
      this.hitstun -= dt;
      if (this.hitstun <= 0 && this.state === FIGHTER_STATE.HURT) {
        this.setState(FIGHTER_STATE.IDLE);
      }
    }
    if (this.blockstun > 0) {
      this.blockstun -= dt;
      if (this.blockstun <= 0 && this.state === FIGHTER_STATE.BLOCK) {
        this.setState(FIGHTER_STATE.IDLE);
      }
    }

    // Physics (Gravity & Movement)
    if (!this.isGrounded) {
      this.velocity.y -= 28 * dt; // Gravity
      this.position.y += this.velocity.y * dt;
      this.position.x += this.velocity.x * dt;

      if (this.position.y <= 0) {
        this.position.y = 0;
        this.velocity.y = 0;
        this.velocity.x = 0;
        const wasAirborne = !this.isGrounded;
        this.isGrounded = true;
        if (wasAirborne && this.onDust) {
          this.onDust(new THREE.Vector3(this.position.x, 0.05, 0), 1.2);
        }
        if (this.state === FIGHTER_STATE.JUMP) {
          this.setState(FIGHTER_STATE.IDLE);
        }
      }
    } else {
      this.position.x += this.velocity.x * dt;
    }

    // Stage boundary collision (-11 to +11)
    this.position.x = THREE.MathUtils.clamp(this.position.x, -11, 11);
    this.updatePosition();

    // Evaluate Skeletal Rig Pose
    this.evaluatePose(dt, opponent);
  }

  evaluatePose(dt, opponent) {
    const charId = this.charData.modelId || this.charData.id || 'modi';
    let pose = null;

    switch (this.state) {
      case FIGHTER_STATE.IDLE:
        pose = K.getStancePose(this.animTime, charId);
        break;

      case FIGHTER_STATE.WALK_FWD:
        pose = K.getWalkPose(this.animTime, this.stateTime, 1, charId);
        break;

      case FIGHTER_STATE.WALK_BACK:
        pose = K.getWalkPose(this.animTime, this.stateTime, -1, charId);
        break;

      case FIGHTER_STATE.CROUCH:
        pose = K.getCrouchPose(this.animTime, charId, false);
        break;

      case FIGHTER_STATE.BLOCK:
        pose = K.getBlockPose(this.animTime, charId);
        break;

      case FIGHTER_STATE.JUMP:
        pose = K.getJumpPose(this.velocity.y, charId);
        break;

      case FIGHTER_STATE.LIGHT_PUNCH: {
        const progress = this.stateTime / 0.24;
        pose = K.getAttackPose('LIGHT_PUNCH', progress, this.animTime, charId);
        if (this.stateTime >= 0.24) this.setState(FIGHTER_STATE.IDLE);
        break;
      }

      case FIGHTER_STATE.HEAVY_PUNCH: {
        const progress = this.stateTime / 0.36;
        pose = K.getAttackPose('HEAVY_PUNCH', progress, this.animTime, charId);
        if (this.stateTime >= 0.36) this.setState(FIGHTER_STATE.IDLE);
        break;
      }

      case FIGHTER_STATE.LIGHT_KICK: {
        const progress = this.stateTime / 0.32;
        pose = K.getAttackPose('LIGHT_KICK', progress, this.animTime, charId);
        if (this.stateTime >= 0.32) this.setState(FIGHTER_STATE.IDLE);
        break;
      }

      case FIGHTER_STATE.LOW_SWEEP: {
        const progress = this.stateTime / 0.42;
        pose = K.getAttackPose('LOW_SWEEP', progress, this.animTime, charId);
        if (this.stateTime >= 0.42) this.setState(FIGHTER_STATE.IDLE);
        break;
      }

      case FIGHTER_STATE.UPPERCUT: {
        const progress = this.stateTime / 0.48;
        pose = K.getAttackPose('UPPERCUT', progress, this.animTime, charId);
        if (this.stateTime >= 0.48) this.setState(FIGHTER_STATE.IDLE);
        break;
      }

      case FIGHTER_STATE.HURT:
        pose = K.getHurtPose(this.stateTime, 'mid', this.animTime, charId);
        break;

      case FIGHTER_STATE.KNOCKDOWN: {
        const progress = Math.min(1.0, this.stateTime / 0.4);
        pose = K.getKnockdownPose(this.isGrounded, progress, this.animTime);
        if (this.health > 0 && this.stateTime >= 1.4) {
          const getUpProgress = (this.stateTime - 1.4) / 0.6;
          if (getUpProgress >= 1.0) {
            this.setState(FIGHTER_STATE.IDLE);
          } else {
            pose = K.getGetUpPose(getUpProgress, this.animTime, charId);
          }
        }
        break;
      }

      case FIGHTER_STATE.VICTORY:
        pose = K.getVictoryPose(this.animTime, charId);
        break;

      case FIGHTER_STATE.SUPER:
        this.updateSuperAnimation(dt, opponent);
        pose = K.getVictoryPose(this.animTime, charId);
        break;

      default:
        pose = K.getStancePose(this.animTime, charId);
        break;
    }

    if (pose) {
      // Drive 3D GLTF Rigged Model Bones
      this.model.applyPose(pose);

      // Also drive procedural fallback bones if model is still loading
      if (this.proceduralGroup.visible) {
        this.applyPoseToProcedural(pose);
      }
    }
  }

  applyPoseToProcedural(pose) {
    if (this.pelvis) this.pelvis.position.y = 1.6 + (pose.rootY || 0);
    if (this.head) this.head.rotation.x = pose.headF || 0;
    if (this.leftShoulder) this.leftShoulder.rotation.x = -(pose.lShF || 0.85);
    if (this.leftElbow) this.leftElbow.rotation.x = pose.lEl || 1.6;
    if (this.rightShoulder) this.rightShoulder.rotation.x = -(pose.rShF || 0.85);
    if (this.rightElbow) this.rightElbow.rotation.x = pose.rEl || 1.6;
    if (this.leftHip) this.leftHip.rotation.x = pose.lThF || 0;
    if (this.leftKnee) this.leftKnee.rotation.x = pose.lKn || 0;
    if (this.rightHip) this.rightHip.rotation.x = pose.rThF || 0;
    if (this.rightKnee) this.rightKnee.rotation.x = pose.rKn || 0;
  }

  // --- Signature Super Moves ---
  triggerSuper(opponent) {
    if (this.shakti < 100 || this.state === FIGHTER_STATE.KNOCKDOWN || this.state === FIGHTER_STATE.HURT) {
      return false;
    }
    this.shakti = 0;
    this.setState(FIGHTER_STATE.SUPER);
    this.superPhase = 1;
    this.invincible = true;

    sound.playSuperCharge();
    this.auraMat.opacity = 0.85;

    const superId = this.charData.superMove?.id || 'chakra';
    this.spawnSuperProp(superId, opponent);

    if (this.onSuperTriggered) {
      this.onSuperTriggered(this);
    }
    return true;
  }

  spawnSuperProp(superId, opponent) {
    if (this.superProp) {
      this.scene.remove(this.superProp.mesh);
      this.superProp = null;
    }

    if (superId === 'chakra' || this.charData.id === 'mitraman') {
      // Mitra Chakra: Golden spinning serrated disc with sun-burst blades
      const chakraGroup = new THREE.Group();

      const ringGeo = new THREE.TorusGeometry(1.8, 0.12, 16, 48);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      chakraGroup.add(ring);

      const toothGeo = new THREE.ConeGeometry(0.18, 0.45, 3);
      const toothMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
      for (let i = 0; i < 32; i++) {
        const tooth = new THREE.Mesh(toothGeo, toothMat);
        const angle = (i * Math.PI * 2) / 32;
        tooth.position.set(Math.cos(angle) * 1.85, Math.sin(angle) * 1.85, 0);
        tooth.rotation.z = angle - Math.PI / 2;
        chakraGroup.add(tooth);
      }

      for (let i = 0; i < 8; i++) {
        const spoke = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 3.6, 8),
          new THREE.MeshBasicMaterial({ color: 0xf59e0b })
        );
        spoke.rotation.z = (i * Math.PI) / 4;
        chakraGroup.add(spoke);
      }

      const coreMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      chakraGroup.add(coreMesh);

      chakraGroup.position.set(this.position.x, 4.8, this.position.z);
      chakraGroup.scale.set(0.1, 0.1, 0.1);
      this.scene.add(chakraGroup);

      this.superProp = { mesh: chakraGroup, type: 'chakra', target: opponent };
    } else if (superId === 'gold_machine' || this.charData.id === 'yatraboy') {
      // Aloo-to-Sona Machine
      const machineGroup = new THREE.Group();

      const boxGeo = new THREE.BoxGeometry(2.4, 2.6, 1.9);
      const boxMat = new THREE.MeshStandardMaterial({
        color: 0x15803d,
        roughness: 0.35,
        metalness: 0.4
      });
      const box = new THREE.Mesh(boxGeo, boxMat);
      box.position.y = 1.3;
      machineGroup.add(box);

      const badgeGeo = new THREE.PlaneGeometry(1.6, 0.6);
      const badgeMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
      const badge = new THREE.Mesh(badgeGeo, badgeMat);
      badge.position.set(0, 0.8, 0.96);
      machineGroup.add(badge);

      const chimney = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 1.2, 12),
        new THREE.MeshStandardMaterial({ color: 0x1e293b })
      );
      chimney.position.set(-0.7, 3.0, 0);
      machineGroup.add(chimney);

      const funnel = new THREE.Mesh(
        new THREE.ConeGeometry(0.95, 1.1, 16),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9 })
      );
      funnel.position.set(0.3, 3.0, 0);
      funnel.rotation.x = Math.PI;
      machineGroup.add(funnel);

      const potatoGeo = new THREE.SphereGeometry(0.55, 12, 12);
      potatoGeo.scale(1.0, 1.3, 1.0);
      const potatoMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.9 });
      const potato = new THREE.Mesh(potatoGeo, potatoMat);
      potato.position.set(0.3, 4.6, 0);
      machineGroup.add(potato);

      machineGroup.position.set(opponent.position.x, 0, opponent.position.z);
      this.scene.add(machineGroup);

      this.superProp = { mesh: machineGroup, potato, type: 'gold_machine', target: opponent };
    } else if (superId === 'bulldozer' || this.charData.id === 'dozerdada') {
      // Bulldozer Charge Action
      const dozerGroup = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(3.0, 1.8, 1.8),
        new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.4 })
      );
      body.position.y = 1.1;
      dozerGroup.add(body);

      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 1.4, 2.2),
        new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 })
      );
      blade.position.set(1.6 * this.facing, 0.8, 0);
      dozerGroup.add(blade);

      dozerGroup.position.set(this.position.x - this.facing * 4, 0, 0);
      this.scene.add(dozerGroup);
      this.superProp = { mesh: dozerGroup, type: 'bulldozer', target: opponent };
    } else if (superId === 'tariff_wall' || this.charData.id === 'taruftaau') {
      // Giant Trade Tariff Wall dropping from the sky
      const wallGroup = new THREE.Group();
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 4.5, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.8 }) // Red brick wall
      );
      wall.position.y = 8;
      wallGroup.add(wall);
      wallGroup.position.set(opponent.position.x, 0, opponent.position.z);
      this.scene.add(wallGroup);
      this.superProp = { mesh: wallGroup, wall, type: 'tariff_wall', target: opponent };
    } else if (superId === 'khela_hobe' || this.charData.id === 'deedee') {
      // Giant blue energy soccer ball
      const ball = new THREE.Mesh(
        new THREE.SphereGeometry(1.4, 24, 24),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true })
      );
      ball.position.set(this.position.x + this.facing * 1.5, 1.8, 0);
      this.scene.add(ball);
      this.superProp = { mesh: ball, type: 'khela_hobe', target: opponent };
    } else {
      // Pure Satyagraha / Quantum shockwave blast
      const blast = new THREE.Mesh(
        new THREE.RingGeometry(0.2, 0.6, 32),
        new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
      );
      blast.rotation.x = Math.PI / 2;
      blast.position.set(this.position.x, 0.1, 0);
      this.scene.add(blast);
      this.superProp = { mesh: blast, type: 'shockwave', target: opponent };
    }
  }

  updateSuperAnimation(dt, opponent) {
    if (!this.superProp) return;

    this.auraMesh.rotation.y += dt * 8;

    if (this.superProp.type === 'chakra') {
      this.superProp.mesh.rotation.z += dt * 22;
      if (this.stateTime < 0.6) {
        const s = THREE.MathUtils.lerp(0.1, 1.0, this.stateTime / 0.6);
        this.superProp.mesh.scale.set(s, s, s);
      } else if (this.stateTime > 0.8 && this.superPhase === 1) {
        this.superPhase = 2; // Hurl it down
      }

      if (this.superPhase === 2) {
        this.superProp.mesh.position.lerp(
          new THREE.Vector3(opponent.position.x, 1.0, opponent.position.z),
          dt * 10
        );
        if (this.superProp.mesh.position.distanceTo(opponent.position) < 1.8) {
          this.triggerSuperImpact(opponent);
          opponent.takeDamage(this.charData.superMove?.damage || 45, true, true);
          this.finishSuper();
        }
      }
    } else if (this.superProp.type === 'gold_machine') {
      if (this.superProp.potato) {
        this.superProp.potato.position.y -= dt * 2.5;
      }
      if (this.stateTime > 1.1 && this.superPhase === 1) {
        this.triggerSuperImpact(opponent);
        opponent.takeDamage(this.charData.superMove?.damage || 45, true, true);
        this.finishSuper();
      }
    } else if (this.superProp.type === 'bulldozer') {
      this.superProp.mesh.position.x += this.facing * dt * 14;
      if (Math.abs(this.superProp.mesh.position.x - opponent.position.x) < 1.4 && this.superPhase === 1) {
        this.triggerSuperImpact(opponent);
        opponent.takeDamage(this.charData.superMove?.damage || 50, true, true);
        this.finishSuper();
      }
    } else if (this.superProp.type === 'tariff_wall') {
      if (this.superProp.wall) {
        this.superProp.wall.position.y = Math.max(2.2, this.superProp.wall.position.y - dt * 24);
      }
      if (this.stateTime > 0.5 && this.superPhase === 1) {
        this.triggerSuperImpact(opponent);
        opponent.takeDamage(this.charData.superMove?.damage || 46, true, true);
        this.finishSuper();
      }
    } else if (this.superProp.type === 'khela_hobe') {
      this.superProp.mesh.position.x += this.facing * dt * 12;
      this.superProp.mesh.rotation.z -= this.facing * dt * 15;
      if (Math.abs(this.superProp.mesh.position.x - opponent.position.x) < 1.5 && this.superPhase === 1) {
        this.triggerSuperImpact(opponent);
        opponent.takeDamage(this.charData.superMove?.damage || 44, true, true);
        this.finishSuper();
      }
    } else {
      // Shockwave expand
      const s = 1.0 + this.stateTime * 14;
      this.superProp.mesh.scale.set(s, s, s);
      if (this.stateTime > 0.6 && this.superPhase === 1) {
        this.triggerSuperImpact(opponent);
        opponent.takeDamage(this.charData.superMove?.damage || 45, true, true);
        this.finishSuper();
      }
    }

    if (this.stateTime >= 2.2) {
      this.finishSuper();
    }
  }

  triggerSuperImpact(opponent) {
    const impactPoint = new THREE.Vector3(
      (this.position.x + opponent.position.x) / 2,
      1.4,
      0
    );
    if (this.onSuperImpact) {
      this.onSuperImpact({
        impactPoint,
        opponent,
        attacker: this,
        moveName: this.charData.superMove?.name || 'SUPER IMPACT!',
        accent: this.charData.accentColor || '#ff9933',
        damage: this.charData.superMove?.damage || 45
      });
    } else {
      sound.playSuperExplosion();
    }
  }

  finishSuper() {
    this.auraMat.opacity = 0;
    this.invincible = false;
    if (this.superProp) {
      this.scene.remove(this.superProp.mesh);
      this.superProp = null;
    }
    this.setState(FIGHTER_STATE.IDLE);
  }

  // --- Combat Moves ---
  lightPunch() {
    if (this.isAttacking() || this.state === FIGHTER_STATE.HURT || this.state === FIGHTER_STATE.KNOCKDOWN) return;
    this.setState(FIGHTER_STATE.LIGHT_PUNCH);
    this.currentAttack = {
      type: 'LIGHT_PUNCH',
      name: this.charData.moveNames?.special1 || this.charData.moveNames?.jab || 'JAB!',
      damage: 8,
      range: 1.6,
      hitboxCenter: this.getFistPosition(),
      knockback: 1.5,
      isHeavy: false
    };
    sound.playWhoosh();
  }

  heavyPunch() {
    if (this.isAttacking() || this.state === FIGHTER_STATE.HURT || this.state === FIGHTER_STATE.KNOCKDOWN) return;
    this.setState(FIGHTER_STATE.HEAVY_PUNCH);
    this.currentAttack = {
      type: 'HEAVY_PUNCH',
      name: this.charData.moveNames?.finisher || this.charData.moveNames?.cross || 'HEAVY STRIKE!',
      damage: 15,
      range: 1.8,
      hitboxCenter: this.getFistPosition(),
      knockback: 4.5,
      isHeavy: true
    };
    sound.playWhoosh();
  }

  lightKick() {
    if (this.isAttacking() || this.state === FIGHTER_STATE.HURT || this.state === FIGHTER_STATE.KNOCKDOWN) return;
    this.setState(FIGHTER_STATE.LIGHT_KICK);
    this.currentAttack = {
      type: 'LIGHT_KICK',
      name: this.charData.moveNames?.special2 || this.charData.moveNames?.kick || 'KICK!',
      damage: 10,
      range: 1.9,
      hitboxCenter: this.getFootPosition(),
      knockback: 2.2,
      isHeavy: false
    };
    sound.playWhoosh();
  }

  lowSweep() {
    if (this.isAttacking() || this.state === FIGHTER_STATE.HURT || this.state === FIGHTER_STATE.KNOCKDOWN) return;
    this.setState(FIGHTER_STATE.LOW_SWEEP);
    this.currentAttack = {
      type: 'LOW_SWEEP',
      name: this.charData.moveNames?.sweep || 'SWEEP!',
      damage: 13,
      range: 2.0,
      hitboxCenter: this.getFootPosition(),
      knockback: 3.8,
      causesTrip: true,
      isHeavy: true
    };
    sound.playWhoosh();
  }

  uppercut() {
    if (this.isAttacking() || this.state === FIGHTER_STATE.HURT || this.state === FIGHTER_STATE.KNOCKDOWN) return;
    this.setState(FIGHTER_STATE.UPPERCUT);
    this.currentAttack = {
      type: 'UPPERCUT',
      name: this.charData.moveNames?.uppercut || 'UPPERCUT!',
      damage: 19,
      range: 1.8,
      hitboxCenter: this.getFistPosition(),
      knockback: 5.8,
      causesLaunch: true,
      isHeavy: true
    };
    this.velocity.y = 8.5;
    this.isGrounded = false;
    sound.playWhoosh();
  }

  jump() {
    if (!this.isGrounded || this.isAttacking() || this.state === FIGHTER_STATE.KNOCKDOWN) return;
    this.velocity.y = 12.5;
    this.isGrounded = false;
    this.setState(FIGHTER_STATE.JUMP);
    sound.playWhoosh();
    if (this.onDust) {
      this.onDust(new THREE.Vector3(this.position.x, 0.05, 0), 0.9);
    }
  }

  crouch() {
    if (!this.isGrounded || this.isAttacking() || this.state === FIGHTER_STATE.KNOCKDOWN) return;
    this.setState(FIGHTER_STATE.CROUCH);
  }

  block() {
    if (!this.isGrounded || this.isAttacking() || this.state === FIGHTER_STATE.KNOCKDOWN) return;
    this.setState(FIGHTER_STATE.BLOCK);
  }

  walk(direction) {
    if (!this.isGrounded || this.isAttacking() || this.state === FIGHTER_STATE.KNOCKDOWN) return;
    const speed = 4.6;
    this.velocity.x = direction * speed;
    if (direction === this.facing) {
      this.setState(FIGHTER_STATE.WALK_FWD);
    } else {
      this.setState(FIGHTER_STATE.WALK_BACK);
    }
  }

  stopWalking() {
    if (this.state === FIGHTER_STATE.WALK_FWD || this.state === FIGHTER_STATE.WALK_BACK) {
      this.velocity.x = 0;
      this.setState(FIGHTER_STATE.IDLE);
    }
  }

  takeDamage(amount, isUnblockable = false, causesTrip = false) {
    if (this.invincible || this.health <= 0) return { damageDealt: 0, blocked: false };

    const isBlocking = this.state === FIGHTER_STATE.BLOCK;
    if (isBlocking && !isUnblockable) {
      const chipDamage = Math.max(1, Math.round(amount * 0.15));
      this.health = Math.max(0, this.health - chipDamage);
      this.blockstun = 0.2;
      this.shakti = Math.min(100, this.shakti + 6);
      sound.playBlock();
      return { damageDealt: chipDamage, blocked: true };
    }

    this.health = Math.max(0, this.health - amount);
    this.shakti = Math.min(100, this.shakti + Math.round(amount * 0.5));

    if (causesTrip || this.health <= 0) {
      this.setState(FIGHTER_STATE.KNOCKDOWN);
      this.velocity.x = -this.facing * 3.8;
      sound.playHit(true);
    } else {
      this.setState(FIGHTER_STATE.HURT);
      this.hitstun = 0.25;
      this.velocity.x = -this.facing * 2.2;
      sound.playHit(amount > 12);
    }

    return { damageDealt: amount, blocked: false };
  }

  isAttacking() {
    return [
      FIGHTER_STATE.LIGHT_PUNCH,
      FIGHTER_STATE.HEAVY_PUNCH,
      FIGHTER_STATE.LIGHT_KICK,
      FIGHTER_STATE.LOW_SWEEP,
      FIGHTER_STATE.UPPERCUT,
      FIGHTER_STATE.SUPER
    ].includes(this.state);
  }

  setState(newState) {
    if (this.state === newState) return;
    this.state = newState;
    this.stateTime = 0;
    this.attackHitRegistered = false;
    if (!this.isAttacking()) {
      this.currentAttack = null;
    }
  }

  updatePosition() {
    this.group.position.copy(this.position);
  }

  resetPosition(x) {
    this.position.set(x, 0, 0);
    this.velocity.set(0, 0, 0);
    this.isGrounded = true;
    this.setState(FIGHTER_STATE.IDLE);
    this.updatePosition();
  }

  getFistPosition() {
    if (this.model.isReady && this.model.joints.RightForeArm) {
      return this.model.joints.RightForeArm.bone;
    }
    return this.rightFist;
  }

  getFootPosition() {
    if (this.model.isReady && this.model.joints.RightFoot) {
      return this.model.joints.RightFoot.bone;
    }
    return this.rightFoot;
  }

  destroy() {
    this.scene.remove(this.group);
  }
}
