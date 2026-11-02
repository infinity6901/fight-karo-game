// Exact GPU Particle, Shockwave & Comic Popup Effects Engine for FIGHT KARO
// Replicating Fight Karo's exact FxEngine (ShaderMaterial, AdditiveBlending, Soft Radial Gradient)

import * as THREE from 'three';

let cachedParticleTexture = null;

export function getParticleTexture() {
  if (cachedParticleTexture) return cachedParticleTexture;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.75)');
  gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.18)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  cachedParticleTexture = new THREE.CanvasTexture(canvas);
  return cachedParticleTexture;
}

const MAX_PARTICLES = 3000;

export class ParticleSystem {
  constructor(scene) {
    this.pos = new Float32Array(MAX_PARTICLES * 3);
    this.col = new Float32Array(MAX_PARTICLES * 3);
    this.size = new Float32Array(MAX_PARTICLES);
    this.alpha = new Float32Array(MAX_PARTICLES);
    this.vel = new Float32Array(MAX_PARTICLES * 3);
    this.life = new Float32Array(MAX_PARTICLES);
    this.maxLife = new Float32Array(MAX_PARTICLES);
    this.grav = new Float32Array(MAX_PARTICLES);
    this.drag = new Float32Array(MAX_PARTICLES);
    this.baseSize = new Float32Array(MAX_PARTICLES);
    this.cursor = 0;
    this.tmpColor = new THREE.Color();

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(this.size, 1));
    geo.setAttribute('alpha', new THREE.BufferAttribute(this.alpha, 1));

    // Custom GPU ShaderMaterial matching Fight Karo
    const mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: getParticleTexture() } },
      vertexShader: `
        attribute float size;
        attribute float alpha;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = color;
          vAlpha = alpha;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (420.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec4 t = texture2D(map, gl_PointCoord);
          gl_FragColor = vec4(vColor * t.rgb * vAlpha * 1.6, t.a * vAlpha);
        }
      `,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true
    });

    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  emit(pos, opts) {
    this.tmpColor.set(opts.color);
    for (let n = 0; n < opts.count; n++) {
      const idx = this.cursor;
      this.cursor = (this.cursor + 1) % MAX_PARTICLES;
      const jitter = opts.jitter ?? 0;
      this.pos[idx * 3] = pos.x + (Math.random() - 0.5) * jitter * 2;
      this.pos[idx * 3 + 1] = pos.y + (Math.random() - 0.5) * jitter * 2;
      this.pos[idx * 3 + 2] = pos.z + (Math.random() - 0.5) * jitter * 2;

      let rx = Math.random() * 2 - 1;
      let ry = Math.random() * 2 - 1;
      let rz = Math.random() * 2 - 1;
      const len = Math.hypot(rx, ry, rz) || 1;
      rx /= len;
      ry /= len;
      rz /= len;

      if (opts.dir) {
        const spread = opts.spread ?? 0.5;
        rx = opts.dir.x + rx * spread;
        ry = opts.dir.y + ry * spread;
        rz = opts.dir.z + rz * spread;
      }

      const speed = opts.speed * (0.4 + Math.random() * 0.8);
      this.vel[idx * 3] = rx * speed;
      this.vel[idx * 3 + 1] = ry * speed;
      this.vel[idx * 3 + 2] = rz * speed;

      const life = opts.life * (0.6 + Math.random() * 0.6);
      this.life[idx] = life;
      this.maxLife[idx] = life;
      this.grav[idx] = opts.gravity ?? 0;
      this.drag[idx] = opts.drag ?? 1.5;
      this.baseSize[idx] = opts.size * (0.6 + Math.random() * 0.8);

      const variation = 0.85 + Math.random() * 0.3;
      this.col[idx * 3] = this.tmpColor.r * variation;
      this.col[idx * 3 + 1] = this.tmpColor.g * variation;
      this.col[idx * 3 + 2] = this.tmpColor.b * variation;
    }
  }

  update(dt) {
    for (let t = 0; t < MAX_PARTICLES; t++) {
      if (this.life[t] <= 0) {
        this.alpha[t] = 0;
        this.size[t] = 0;
        continue;
      }
      this.life[t] -= dt;
      const norm = Math.max(0, this.life[t] / this.maxLife[t]);
      const r = Math.exp(-this.drag[t] * dt);
      this.vel[t * 3] *= r;
      this.vel[t * 3 + 1] = this.vel[t * 3 + 1] * r - this.grav[t] * dt;
      this.vel[t * 3 + 2] *= r;

      this.pos[t * 3] += this.vel[t * 3] * dt;
      this.pos[t * 3 + 1] += this.vel[t * 3 + 1] * dt;
      this.pos[t * 3 + 2] += this.vel[t * 3 + 2] * dt;

      this.alpha[t] = norm;
      this.size[t] = this.baseSize[t] * (0.4 + norm * 0.6);
    }
    const geo = this.points.geometry;
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
    geo.attributes.size.needsUpdate = true;
    geo.attributes.alpha.needsUpdate = true;
  }
}

export class FxEngine {
  constructor(scene) {
    this.scene = scene;
    this.particles = new ParticleSystem(scene);
    this.waves = [];
    this.sparkDir = new THREE.Vector3();
    this.ringGeo = new THREE.RingGeometry(0.6, 0.85, 48);
    this.popupsContainer = document.getElementById('popups');
  }

  // Exact Fight Karo hit spark emitter
  hitSpark(pos, strength = 0.5, isBlocked = false, direction = 1) {
    const col = isBlocked ? 0x7fd4ff : 0xffc34d; // Cyan (8378111) if blocked, Gold (16761677) if hit
    this.particles.emit(pos, {
      count: Math.round(14 + strength * 18),
      speed: 4 + strength * 4,
      color: col,
      life: 0.35,
      size: 0.12 + strength * 0.06,
      gravity: 6,
      drag: 3,
      dir: this.sparkDir.set(direction, 0.3, 0.2),
      spread: 1.1
    });

    // Intense white flash core
    this.particles.emit(pos, {
      count: 4,
      speed: 0.3,
      color: 0xffffff,
      life: 0.12,
      size: 0.6 + strength * 0.4,
      drag: 6
    });

    // Additive billboard expanding shockwave on heavy unblocked hits
    if (!isBlocked && strength > 0.6) {
      this.shockwave(pos, 0xffc37a, 0.22, 0.28 * strength, true);
    }
  }

  // Exact Fight Karo ground dust puffs
  dust(pos, countMultiplier = 1) {
    this.particles.emit(pos, {
      count: Math.round(18 * countMultiplier),
      speed: 2.2,
      color: 0x8a6b4a, // 9071434
      life: 0.8,
      size: 0.35,
      gravity: -0.5,
      drag: 3,
      dir: new THREE.Vector3(0, 0.3, 0),
      spread: 1.4
    });
  }

  // Expanding shockwave ring with additive glow
  shockwave(pos, color = 0xffc37a, life = 0.22, grow = 0.3, billboard = false) {
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(this.ringGeo, mat);
    mesh.position.copy(pos);
    if (billboard) {
      mesh.userData.billboard = true;
    } else {
      mesh.rotation.x = -Math.PI / 2;
    }
    mesh.scale.setScalar(0.3);
    this.scene.add(mesh);
    this.waves.push({ mesh, life, max: life, grow });
  }

  // Screen Flash
  flash(color = 'rgba(255, 255, 255, 0.65)', duration = 75) {
    const flashEl = document.getElementById('flash');
    if (!flashEl) return;
    flashEl.style.backgroundColor = color;
    flashEl.style.opacity = '0.75';
    setTimeout(() => {
      flashEl.style.opacity = '0';
    }, duration);
  }

  // Comic Action Popup Word in Screen Space (like THAPPAD!, CHATAAK!, VIKAS UPPERCUT!)
  popup(text, worldPos, color = '#ffd84a', camera, renderer) {
    if (!this.popupsContainer || !camera || !renderer) return;

    const projected = worldPos.clone();
    projected.project(camera);

    const halfW = renderer.domElement.clientWidth / 2;
    const halfH = renderer.domElement.clientHeight / 2;
    const screenX = (projected.x * halfW) + halfW;
    const screenY = -(projected.y * halfH) + halfH;

    const el = document.createElement('div');
    el.className = 'popup';
    el.textContent = text;
    el.style.left = `${screenX}px`;
    el.style.top = `${screenY}px`;
    el.style.color = color;

    this.popupsContainer.appendChild(el);
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1100);
  }

  update(dt, camera) {
    this.particles.update(dt);
    for (let n = this.waves.length - 1; n >= 0; n--) {
      const r = this.waves[n];
      r.life -= dt;
      const progress = 1 - r.life / r.max;
      r.mesh.scale.setScalar(0.3 + progress * r.grow * 3.5);
      r.mesh.material.opacity = Math.max(0, 1 - progress);
      if (r.mesh.userData.billboard && camera) {
        r.mesh.quaternion.copy(camera.quaternion);
      }
      if (r.life <= 0) {
        this.scene.remove(r.mesh);
        r.mesh.material.dispose();
        this.waves.splice(n, 1);
      }
    }
  }
}
