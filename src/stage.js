// 3D Arena Stage, Multi-Theme Environments & Satirical Events for FIGHT KARO

import * as THREE from 'three';
import { sound } from './audio.js';

export class ArenaStage {
  constructor(scene) {
    this.scene = scene;
    this.currentTheme = 'sansad'; // 'sansad', 'jantar', 'sadak'

    // Scene container for current stage props
    this.stageRoot = new THREE.Group();
    this.scene.add(this.stageRoot);

    // Dynamic objects & event state
    this.particles = [];
    this.flashes = [];
    this.flyingCup = null;
    this.gaumata = null;
    this.chaiwala = null;

    this.flashTimer = 2.0;
    this.chaiShoutTimer = 4.0;
    this.cowSpawnTimer = 18.0; // Automatically strolls across after 18s

    this.setupLighting();
    this.buildStage(this.currentTheme);
  }

  setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0xffedd5, 1.3);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfdba74, 2.2);
    this.sunLight.position.set(10, 24, 16);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 65;
    this.sunLight.shadow.camera.left = -18;
    this.sunLight.shadow.camera.right = 18;
    this.sunLight.shadow.camera.top = 18;
    this.sunLight.shadow.camera.bottom = -4;
    this.sunLight.shadow.bias = -0.0004;
    this.scene.add(this.sunLight);

    this.rimLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
    this.rimLight.position.set(-14, 12, -14);
    this.scene.add(this.rimLight);
  }

  setStage(theme) {
    if (this.currentTheme === theme) return;
    this.currentTheme = theme;
    this.buildStage(theme);
  }

  buildStage(theme) {
    // Clear existing stage props
    while (this.stageRoot.children.length > 0) {
      const child = this.stageRoot.children[0];
      this.stageRoot.remove(child);
    }
    this.flashes = [];

    if (theme === 'sansad') {
      this.buildSansadStage();
    } else if (theme === 'jantar') {
      this.buildJantarMantarStage();
    } else if (theme === 'sadak') {
      this.buildDesiSadakStage();
    }
  }

  // --- STAGE 1: SANSAD SHOWDOWN ---
  buildSansadStage() {
    this.scene.background = new THREE.Color(0xf59e0b);
    this.scene.fog = new THREE.FogExp2(0xf59e0b, 0.015);

    // Sandstone ground
    const floorGeo = new THREE.PlaneGeometry(65, 42);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xdeb887, roughness: 0.85 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.stageRoot.add(floor);

    // Concentric Star Rangoli
    this.buildRangoli();

    // Parliament Colonnade & Central Dome
    this.buildSansadColonnade();

    // Spectator Crowd Grandstand
    this.buildCrowdGrandstand();

    // Chai Stall & Reactive Chaiwala
    this.buildChaiStall();
  }

  buildRangoli() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    const cx = 512, cy = 512;

    const layers = [
      { r: 490, color: '#2563eb', points: 28 },
      { r: 430, color: '#facc15', points: 24 },
      { r: 370, color: '#db2777', points: 20 },
      { r: 300, color: '#16a34a', points: 18 },
      { r: 230, color: '#ea580c', points: 16 },
      { r: 150, color: '#eab308', points: 12 },
      { r: 70,  color: '#ffffff', points: 8 }
    ];

    layers.forEach(({ r, color, points }) => {
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i <= points * 2; i++) {
        const angle = (i * Math.PI) / points;
        const currentR = (i % 2 === 0) ? r : r - 28;
        const px = cx + Math.cos(angle) * currentR;
        const py = cy + Math.sin(angle) * currentR;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.stroke();
      ctx.restore();
    });

    const tex = new THREE.CanvasTexture(canvas);
    const rangoli = new THREE.Mesh(
      new THREE.CircleGeometry(7.5, 64),
      new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.75 })
    );
    rangoli.rotation.x = -Math.PI / 2;
    rangoli.position.set(0, 0.02, 0);
    rangoli.receiveShadow = true;
    this.stageRoot.add(rangoli);
  }

  buildSansadColonnade() {
    const pillarCount = 28;
    const radius = 24;
    const pillarHeight = 13;
    const pillarGeo = new THREE.CylinderGeometry(0.52, 0.56, pillarHeight, 16);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.72 });

    for (let i = 0; i < pillarCount; i++) {
      const angle = Math.PI * 0.08 + (i / (pillarCount - 1)) * Math.PI * 0.84;
      const x = Math.cos(angle) * radius;
      const z = -Math.sin(angle) * radius * 0.52 - 8;

      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(x, pillarHeight / 2, z);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      this.stageRoot.add(pillar);
    }

    // Curved Upper Architrave Beam
    const beam = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.85, 12, 48, Math.PI * 0.84),
      new THREE.MeshStandardMaterial({ color: 0xba9e83, roughness: 0.8 })
    );
    beam.rotation.x = Math.PI / 2;
    beam.rotation.z = Math.PI * 0.08;
    beam.position.set(0, pillarHeight, -8);
    this.stageRoot.add(beam);

    // Central Parliament Dome
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(15, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
      new THREE.MeshStandardMaterial({ color: 0xc89d6e, roughness: 0.85 })
    );
    dome.position.set(0, pillarHeight - 1, -20);
    this.stageRoot.add(dome);

    // Indian Tricolor Flag
    this.buildNationalFlag(0, pillarHeight + 8, -14);
  }

  buildNationalFlag(x, y, z) {
    const flagGroup = new THREE.Group();
    flagGroup.position.set(x, y, z);

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 5, 8),
      new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9 })
    );
    pole.position.y = 2.5;
    flagGroup.add(pole);

    const flagCanvas = document.createElement('canvas');
    flagCanvas.width = 300;
    flagCanvas.height = 200;
    const fctx = flagCanvas.getContext('2d');
    fctx.fillStyle = '#ff9933';
    fctx.fillRect(0, 0, 300, 67);
    fctx.fillStyle = '#ffffff';
    fctx.fillRect(0, 67, 300, 66);
    fctx.fillStyle = '#138808';
    fctx.fillRect(0, 133, 300, 67);

    // Ashoka Chakra
    fctx.strokeStyle = '#000080';
    fctx.lineWidth = 3;
    fctx.beginPath();
    fctx.arc(150, 100, 24, 0, Math.PI * 2);
    fctx.stroke();

    const flagTex = new THREE.CanvasTexture(flagCanvas);
    const flagMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 1.6),
      new THREE.MeshStandardMaterial({ map: flagTex, roughness: 0.6, side: THREE.DoubleSide })
    );
    flagMesh.position.set(1.2, 4.0, 0);
    flagGroup.add(flagMesh);

    this.stageRoot.add(flagGroup);
  }

  buildCrowdGrandstand() {
    const crowdGroup = new THREE.Group();
    crowdGroup.position.set(-13, 0, -4);

    const spectatorColors = [0x2563eb, 0xdc2626, 0x16a34a, 0xfacc15, 0xdb2777, 0x9333ea, 0x0891b2];
    const placardTexts = ['JAI HIND', 'VOTE!', 'BADLAV', 'SUNO!', 'BHASHAN', 'PAKKA'];

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 8; col++) {
        const x = (col - 4) * 0.7;
        const y = row * 0.6 + 0.9;
        const z = -row * 0.7;

        const color = spectatorColors[(row * 7 + col) % spectatorColors.length];
        const body = new THREE.Mesh(
          new THREE.CylinderGeometry(0.22, 0.22, 0.8, 8),
          new THREE.MeshStandardMaterial({ color })
        );
        body.position.set(x, y, z);
        crowdGroup.add(body);

        const head = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 8, 8),
          new THREE.MeshStandardMaterial({ color: 0xd4a373 })
        );
        head.position.set(x, y + 0.55, z);
        crowdGroup.add(head);

        // Placard
        if ((row + col) % 3 === 0) {
          const stick = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 1.2, 4),
            new THREE.MeshStandardMaterial({ color: 0x78350f })
          );
          stick.position.set(x + 0.15, y + 0.9, z + 0.1);
          crowdGroup.add(stick);

          const signCanvas = document.createElement('canvas');
          signCanvas.width = 160;
          signCanvas.height = 80;
          const sctx = signCanvas.getContext('2d');
          sctx.fillStyle = '#fef08a';
          sctx.fillRect(0, 0, 160, 80);
          sctx.strokeStyle = '#854d0e';
          sctx.lineWidth = 4;
          sctx.strokeRect(0, 0, 160, 80);
          sctx.fillStyle = '#000000';
          sctx.font = 'bold 26px sans-serif';
          sctx.textAlign = 'center';
          sctx.textBaseline = 'middle';
          sctx.fillText(placardTexts[(row + col) % placardTexts.length], 80, 40);

          const sign = new THREE.Mesh(
            new THREE.PlaneGeometry(0.8, 0.4),
            new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(signCanvas), side: THREE.DoubleSide })
          );
          sign.position.set(x + 0.15, y + 1.45, z + 0.1);
          crowdGroup.add(sign);
        }

        // Camera flash point lights (Press paparazzi)
        if (row === 1 && (col === 2 || col === 5)) {
          const flashLight = new THREE.PointLight(0xffffff, 0, 12);
          flashLight.position.set(x - 13, y + 1.2, z - 4);
          this.stageRoot.add(flashLight);
          this.flashes.push({ light: flashLight, cooldown: 1.5 + Math.random() * 3 });
        }
      }
    }

    this.stageRoot.add(crowdGroup);
  }

  buildChaiStall() {
    this.stallGroup = new THREE.Group();
    this.stallGroup.position.set(12.5, 0, -2);

    // Counter table
    const counter = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 1.4, 2.0),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 })
    );
    counter.position.y = 0.7;
    counter.castShadow = true;
    this.stallGroup.add(counter);

    // Brass Kettle
    const kettle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.48, 0.85, 16),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.25 })
    );
    kettle.position.set(-0.7, 1.85, 0);
    this.stallGroup.add(kettle);

    // Crate with tea glasses
    const crate = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.45, 0.85),
      new THREE.MeshStandardMaterial({ color: 0x0284c7 })
    );
    crate.position.set(0.7, 1.65, 0);
    this.stallGroup.add(crate);

    // Interactive Cutting Chai Glass Cup (flying cup event target)
    this.buildChaiCup();

    // Chaiwala Character
    this.chaiwala = new THREE.Group();
    this.chaiwala.position.set(0, 0, -1.5);

    const chaiBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.36, 1.5, 8),
      new THREE.MeshStandardMaterial({ color: 0x18181b })
    );
    chaiBody.position.y = 1.35;
    this.chaiwala.add(chaiBody);

    const chaiHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xd4a373 })
    );
    chaiHead.position.y = 2.4;
    this.chaiwala.add(chaiHead);

    const glasses = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.08, 0.04),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    glasses.position.set(0, 2.44, 0.27);
    this.chaiwala.add(glasses);

    const armGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.75, 8);
    const armMat = new THREE.MeshStandardMaterial({ color: 0x18181b });

    this.chaiLeftArm = new THREE.Mesh(armGeo, armMat);
    this.chaiLeftArm.position.set(-0.45, 1.8, 0);
    this.chaiLeftArm.rotation.z = 0.3;
    this.chaiwala.add(this.chaiLeftArm);

    this.chaiRightArm = new THREE.Mesh(armGeo, armMat);
    this.chaiRightArm.position.set(0.45, 1.8, 0);
    this.chaiRightArm.rotation.z = -0.3;
    this.chaiwala.add(this.chaiRightArm);

    this.stallGroup.add(this.chaiwala);
    this.stageRoot.add(this.stallGroup);
  }

  buildChaiCup() {
    this.chaiCup = new THREE.Group();
    this.chaiCup.position.set(0.2, 1.5, 0.4);

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xbae6fd,
      transparent: true,
      opacity: 0.7,
      roughness: 0.1
    });
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.26, 12), glassMat);
    this.chaiCup.add(glass);

    // Amber Tea Liquid
    const teaMat = new THREE.MeshBasicMaterial({ color: 0x92400e });
    const tea = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.2, 12), teaMat);
    tea.position.y = -0.02;
    this.chaiCup.add(tea);

    this.stallGroup.add(this.chaiCup);
  }

  // --- STAGE 2: JANTAR MANTAR (Protest & Monument Ground) ---
  buildJantarMantarStage() {
    this.scene.background = new THREE.Color(0xd97706);
    this.scene.fog = new THREE.FogExp2(0xd97706, 0.015);

    // Terracotta red sandstone floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(65, 42),
      new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.9 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.stageRoot.add(floor);

    // Giant Astronomical Ramp (Samrat Yantra diagonal stairs)
    const rampGroup = new THREE.Group();
    rampGroup.position.set(0, 0, -14);

    const rampGeo = new THREE.BoxGeometry(22, 12, 3);
    const rampMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.85 });
    const ramp = new THREE.Mesh(rampGeo, rampMat);
    ramp.rotation.z = 0.35;
    ramp.position.y = 4.5;
    rampGroup.add(ramp);
    this.stageRoot.add(rampGroup);

    // Barricades on left & right
    for (let x of [-11, 11]) {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(4.5, 1.4, 0.2),
        new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.6 })
      );
      bar.position.set(x, 0.7, -2);
      this.stageRoot.add(bar);
    }

    this.buildChaiStall();
  }

  // --- STAGE 3: DESI SADAK (Indian Expressway & Fastag Toll Plaza) ---
  buildDesiSadakStage() {
    this.scene.background = new THREE.Color(0x38bdf8);
    this.scene.fog = new THREE.FogExp2(0x38bdf8, 0.012);

    // Dark asphalt road
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(65, 42),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 })
    );
    road.rotation.x = -Math.PI / 2;
    road.receiveShadow = true;
    this.stageRoot.add(road);

    // Center yellow divider stripes
    for (let x = -28; x < 30; x += 5) {
      const stripe = new THREE.Mesh(
        new THREE.PlaneGeometry(2.8, 0.25),
        new THREE.MeshBasicMaterial({ color: 0xfacc15 })
      );
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(x, 0.02, 0);
      this.stageRoot.add(stripe);
    }

    // Milestone Signboard on right: "NEW DELHI 24 KM"
    const milestone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 1.3, 16),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.7 })
    );
    milestone.position.set(12, 0.65, -3);
    this.stageRoot.add(milestone);

    this.buildChaiStall();
  }

  // --- Flying Chai Cup Collateral Event ---
  spillChaiCup(kickerName = 'Fighter', onSpill = null) {
    if (this.flyingCup || !this.chaiCup) return;

    sound.playChaiTing();
    sound.playCupBreak();
    sound.playNewsSting();

    // Detach cup to world space
    const cupWorldPos = new THREE.Vector3();
    this.chaiCup.getWorldPosition(cupWorldPos);
    this.stallGroup.remove(this.chaiCup);

    this.flyingCup = {
      mesh: this.chaiCup,
      pos: cupWorldPos,
      vel: new THREE.Vector3(-3.5, 8.5, (Math.random() - 0.5) * 2),
      rotVel: new THREE.Vector3(12, 8, 15),
      life: 2.2
    };
    this.scene.add(this.chaiCup);

    // Chaiwala raises arms up in utter dismay!
    this.isChaiUpset = true;
    this.chaiUpsetTimer = 3.0;

    // Splatter tea particles
    for (let i = 0; i < 18; i++) {
      const drop = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0x78350f })
      );
      drop.position.copy(cupWorldPos);
      this.scene.add(drop);
      this.particles.push({
        mesh: drop,
        vx: (Math.random() - 0.5) * 4.5,
        vy: 3 + Math.random() * 5,
        vz: (Math.random() - 0.5) * 3,
        life: 1.2
      });
    }

    if (onSpill) {
      onSpill({
        shout: 'Arre! Mera cup! ₹10 kaun dega?!',
        headline: `Collateral chai! Minor loss for the nation! ${kickerName} kicked the chai bhaiya's cup! Shame!`
      });
    }
  }

  // --- Sacred Cow (Gaumata) Crossing Event ---
  spawnGaumata(onCowEvent = null) {
    if (this.gaumata) return;

    sound.playCowBell();

    const cowGroup = new THREE.Group();
    cowGroup.position.set(-15, 0, 1.8);

    // Body (Cream White with gentle hump)
    const cowMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.85 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 1.1), cowMat);
    body.position.y = 1.35;
    cowGroup.add(body);

    // Hump
    const hump = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 12), cowMat);
    hump.position.set(-0.3, 2.1, 0);
    hump.scale.set(1.1, 1.3, 0.9);
    cowGroup.add(hump);

    // Head with gentle horns
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.75, 0.65), cowMat);
    head.position.set(1.4, 1.7, 0);
    cowGroup.add(head);

    const hornMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
    const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.45, 8), hornMat);
    hornL.position.set(1.4, 2.2, 0.28);
    hornL.rotation.x = 0.4;
    cowGroup.add(hornL);

    const hornR = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.45, 8), hornMat);
    hornR.position.set(1.4, 2.2, -0.28);
    hornR.rotation.x = -0.4;
    cowGroup.add(hornR);

    // Cow Bell around neck
    const bell = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.16, 0.22, 8),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9 })
    );
    bell.position.set(1.1, 1.05, 0);
    cowGroup.add(bell);

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.75, 8);
    for (let [lx, lz] of [[-0.8, -0.4], [-0.8, 0.4], [0.8, -0.4], [0.8, 0.4]]) {
      const leg = new THREE.Mesh(legGeo, cowMat);
      leg.position.set(lx, 0.38, lz);
      cowGroup.add(leg);
    }

    this.scene.add(cowGroup);

    this.gaumata = {
      group: cowGroup,
      x: -15,
      speed: 2.2,
      phase: 'WALK_IN', // 'WALK_IN', 'PAUSE_MID', 'WALK_OUT', 'DONE'
      pauseTimer: 2.6,
      mooed: false,
      onCowEvent
    };
  }

  // --- Animation & Physics Update Loop ---
  update(dt, onEvent = null) {
    // 1. Camera Flashes in Press Gallery
    this.flashTimer -= dt;
    if (this.flashTimer <= 0) {
      this.flashTimer = 1.2 + Math.random() * 2.5;
      const flash = this.flashes[Math.floor(Math.random() * this.flashes.length)];
      if (flash) {
        flash.light.intensity = 16;
        sound.playCameraClicks();
        setTimeout(() => {
          flash.light.intensity = 0;
        }, 90);
      }
    }

    // 2. Flying Chai Cup Physics
    if (this.flyingCup) {
      const c = this.flyingCup;
      c.vel.y -= 26 * dt; // Gravity
      c.pos.addScaledVector(c.vel, dt);
      c.mesh.position.copy(c.pos);

      c.mesh.rotation.x += c.rotVel.x * dt;
      c.mesh.rotation.y += c.rotVel.y * dt;
      c.mesh.rotation.z += c.rotVel.z * dt;

      c.life -= dt;
      if (c.pos.y <= 0.1 || c.life <= 0) {
        this.scene.remove(c.mesh);
        this.flyingCup = null;
        // Re-spawn intact cup back on table after 4s
        setTimeout(() => this.buildChaiCup(), 4000);
      }
    }

    // 3. Chaiwala Reactions
    if (this.isChaiUpset) {
      this.chaiUpsetTimer -= dt;
      // Both arms held up high in grief
      this.chaiLeftArm.rotation.z = 2.4;
      this.chaiRightArm.rotation.z = -2.4;
      if (this.chaiUpsetTimer <= 0) {
        this.isChaiUpset = false;
        this.chaiLeftArm.rotation.z = 0.3;
        this.chaiRightArm.rotation.z = -0.3;
      }
    } else {
      // Periodic vendor shouts
      this.chaiShoutTimer -= dt;
      if (this.chaiShoutTimer <= 0) {
        this.chaiShoutTimer = 8.0 + Math.random() * 6.0;
        const shouts = ['Chai! Chai!', 'Garam cutting chai, ₹10!', 'Adrak wali chai le lo!'];
        const shout = shouts[Math.floor(Math.random() * shouts.length)];
        sound.playChaiTing();
        if (onEvent) onEvent({ type: 'CHAI_SHOUT', shout });
      }
    }

    // 4. Sacred Cow (Gaumata) Stroll State Machine
    if (this.gaumata) {
      const g = this.gaumata;
      if (g.phase === 'WALK_IN') {
        g.x += g.speed * dt;
        g.group.position.x = g.x;
        // Subtle walking leg swing & tail wag
        g.group.rotation.y = Math.PI / 2;
        g.group.position.y = Math.abs(Math.sin(g.x * 5)) * 0.08;

        if (g.x >= 0) {
          g.x = 0;
          g.group.position.x = 0;
          g.phase = 'PAUSE_MID';
          g.group.rotation.y = Math.PI / 2 + 0.3; // Turns slightly to look at camera!
          sound.playMoo();
          sound.playCowBell();
          sound.playNewsSting();
          if (g.onCowEvent) {
            g.onCowEvent({
              type: 'COW_ENTER',
              shout: 'MOOOOO!',
              headline: 'BREAKING: Cow crosses Sansad floor. All bills paused. Cow diplomacy at peak!'
            });
          }
        }
      } else if (g.phase === 'PAUSE_MID') {
        g.pauseTimer -= dt;
        if (g.pauseTimer <= 0) {
          g.phase = 'WALK_OUT';
          g.group.rotation.y = Math.PI / 2;
        }
      } else if (g.phase === 'WALK_OUT') {
        g.x += g.speed * dt;
        g.group.position.x = g.x;
        g.group.position.y = Math.abs(Math.sin(g.x * 5)) * 0.08;
        if (g.x >= 16) {
          this.scene.remove(g.group);
          this.gaumata = null;
          sound.announce('fight');
          if (onEvent) onEvent({ type: 'COW_EXIT' });
        }
      }
    } else {
      // Auto-trigger Cow Stroll after timer
      this.cowSpawnTimer -= dt;
      if (this.cowSpawnTimer <= 0) {
        this.cowSpawnTimer = 35.0; // Next cow visit in 35s
        this.spawnGaumata(onEvent);
      }
    }

    // 5. Tea droplet particles update
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.vy -= 18 * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.life -= dt;
      if (p.life <= 0 || p.mesh.position.y <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }
  }

  cheer() {
    this.isChaiUpset = true;
    this.chaiUpsetTimer = 2.0;
  }

  triggerPaparazzi(count = 6) {
    if (this.flashes.length === 0) return;
    sound.playCameraClicks();
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const flash = this.flashes[Math.floor(Math.random() * this.flashes.length)];
        if (flash) {
          flash.light.intensity = 22;
          setTimeout(() => { flash.light.intensity = 0; }, 65);
        }
      }, i * 55);
    }
  }
}
