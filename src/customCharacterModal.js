// Custom Fighter Creator & Interactive 3D Preview for FIGHT KARO

import * as THREE from 'three';
import { updateCustomFighter, customFighter } from './characters.js';
import { CharacterModel } from './fighterModel.js';
import { getStancePose } from './kinematics.js';

export class CustomCharacterModal {
  constructor(onSavedCallback) {
    this.onSavedCallback = onSavedCallback;
    this.modal = document.getElementById('custom-char-modal');
    this.previewCanvas = document.getElementById('custom-preview-canvas');

    // Form inputs
    this.baseModelSelect = document.getElementById('custom-base-model');
    this.nameInput = document.getElementById('custom-name-input');
    this.teamInput = document.getElementById('custom-team-input');
    this.faceUpload = document.getElementById('custom-face-upload');
    this.outfitSelect = document.getElementById('custom-outfit-select');
    this.primaryColor = document.getElementById('custom-primary-color');
    this.pantsColor = document.getElementById('custom-pants-color');
    this.superSelect = document.getElementById('custom-super-select');
    this.quoteStart = document.getElementById('custom-quote-start');
    this.quoteSuper = document.getElementById('custom-quote-super');

    this.presetChips = document.querySelectorAll('.preset-chip');
    this.btnSave = document.getElementById('btn-save-custom-char');
    this.btnClose = document.getElementById('btn-close-builder');

    this.customFaceDataUrl = customFighter.customFaceDataUrl || null;
    this.previewModel = null;

    // 3D Mini Scene for Live Preview
    this.initMiniPreview();
    this.bindEvents();
  }

  initMiniPreview() {
    this.previewScene = new THREE.Scene();
    this.previewScene.background = new THREE.Color(0x0f172a);

    const aspect = 260 / 340;
    this.previewCamera = new THREE.PerspectiveCamera(45, aspect, 0.1, 50);
    this.previewCamera.position.set(0, 1.45, 3.8);

    this.previewRenderer = new THREE.WebGLRenderer({
      canvas: this.previewCanvas,
      antialias: true
    });
    this.previewRenderer.setSize(260, 340);
    this.previewRenderer.setPixelRatio(window.devicePixelRatio || 1);

    // Preview lighting
    const amb = new THREE.AmbientLight(0xffffff, 1.4);
    this.previewScene.add(amb);
    const dir = new THREE.DirectionalLight(0xf59e0b, 1.8);
    dir.position.set(2, 4, 3);
    this.previewScene.add(dir);

    const fill = new THREE.DirectionalLight(0x38bdf8, 0.8);
    fill.position.set(-2, 2, -2);
    this.previewScene.add(fill);

    // Pedestal
    const pedGeo = new THREE.CylinderGeometry(1.2, 1.3, 0.15, 24);
    const pedMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
    const ped = new THREE.Mesh(pedGeo, pedMat);
    ped.position.y = 0;
    this.previewScene.add(ped);

    this.previewGroup = new THREE.Group();
    this.previewScene.add(this.previewGroup);

    this.rebuildPreviewModel();

    // Render loop for rotating preview
    const animate = () => {
      if (!this.modal.classList.contains('hidden')) {
        this.previewGroup.rotation.y += 0.012;
        this.previewRenderer.render(this.previewScene, this.previewCamera);
      }
      requestAnimationFrame(animate);
    };
    animate();
  }

  rebuildPreviewModel() {
    // Clear existing model from previewGroup
    while (this.previewGroup.children.length > 0) {
      const child = this.previewGroup.children[0];
      this.previewGroup.remove(child);
    }

    const baseModel = this.baseModelSelect?.value || customFighter.baseModel || 'modi';
    const baseMapping = {
      modi: './models/modi.glb',
      rahul: './models/rahul.glb',
      didi: './models/didi.glb',
      trump: './models/trump.glb',
      yogi: './models/yogi.glb',
      nitin: './models/nitin.glb',
      mbapu: './models/mbapu.glb'
    };

    const previewCharData = {
      ...customFighter,
      modelUrl: baseMapping[baseModel] || './models/modi.glb',
      modelId: baseModel,
      primaryColor: this.primaryColor?.value || customFighter.primaryColor,
      pantsColor: this.pantsColor?.value || customFighter.pantsColor,
      customFaceDataUrl: this.customFaceDataUrl,
      isCustom: true
    };

    this.previewModel = new CharacterModel(previewCharData, (cm) => {
      // Apply stance pose
      const pose = getStancePose(0, baseModel);
      cm.applyPose(pose);
    });

    this.previewGroup.add(this.previewModel.root);
  }

  bindEvents() {
    // Re-render preview on base model, color, or outfit changes
    [this.baseModelSelect, this.primaryColor, this.pantsColor, this.outfitSelect].forEach(input => {
      if (input) {
        input.addEventListener('input', () => this.rebuildPreviewModel());
      }
    });

    // Face photo upload handling
    this.faceUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          this.processUploadedPhoto(event.target.result);
        };
        reader.readAsDataURL(file);
      }
    });

    // Preset face chips
    this.presetChips.forEach(chip => {
      chip.addEventListener('click', () => {
        this.presetChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.selectedFacePreset = chip.dataset.face;
        this.customFaceDataUrl = null;
        this.rebuildPreviewModel();
      });
    });

    // Save Character
    this.btnSave.addEventListener('click', () => {
      const superOptions = {
        chakra: { id: 'chakra', name: 'QUANTUM CHAKRA', desc: 'Levitates and hurls an omnidirectional energy chakra!', damage: 46 },
        gold_machine: { id: 'gold_machine', name: 'GOLD FORGE MACHINE', desc: 'Zaps opponent into an alchemical transformation forge!', damage: 46 },
        bulldozer: { id: 'bulldozer', name: 'BULLDOZER ACTION', desc: 'Summons a bright yellow demolition bulldozer charge!', damage: 50 },
        tariff_wall: { id: 'tariff_wall', name: 'THE TARIFF SLAM', desc: 'Drops an impenetrable trade tariff wall from the sky!', damage: 46 },
        khela_hobe: { id: 'khela_hobe', name: 'KHELA HOBE', desc: 'Volleys a spinning high-energy kinetic soccer ball!', damage: 44 },
        satyagraha: { id: 'satyagraha', name: 'DANDI MARCH SLAM', desc: 'Summons an expanding ring of non-violent moral force!', damage: 45 }
      };

      const selectedSuper = superOptions[this.superSelect.value] || superOptions.chakra;
      const baseModel = this.baseModelSelect?.value || 'modi';

      const baseMapping = {
        modi: './models/modi.glb',
        rahul: './models/rahul.glb',
        didi: './models/didi.glb',
        trump: './models/trump.glb',
        yogi: './models/yogi.glb',
        nitin: './models/nitin.glb',
        mbapu: './models/mbapu.glb'
      };

      const updated = updateCustomFighter({
        baseModel,
        modelId: baseModel,
        modelUrl: baseMapping[baseModel] || './models/modi.glb',
        name: this.nameInput.value.trim().toUpperCase() || 'MY FIGHTER',
        team: this.teamInput.value.trim() || 'Custom Force',
        portrait: this.customFaceDataUrl || `./textures/card_${baseModel === 'modi' ? 'mitraman' : baseModel === 'rahul' ? 'yatraboy' : baseModel === 'didi' ? 'deedee' : baseModel === 'trump' ? 'tariff' : baseModel === 'yogi' ? 'dozer' : baseModel === 'nitin' ? 'tollman' : 'mbapu'}_hi.jpg`,
        customFaceDataUrl: this.customFaceDataUrl,
        facePreset: this.selectedFacePreset || 'warrior',
        outfitStyle: this.outfitSelect.value,
        primaryColor: this.primaryColor.value,
        pantsColor: this.pantsColor.value,
        superMove: selectedSuper,
        quotes: {
          start: this.quoteStart.value.trim() || 'Ready to fight!',
          super: this.quoteSuper.value.trim() || 'Unlimited power!',
          hit: 'Not bad!',
          win: 'I stand victorious!'
        }
      });

      this.close();
      if (this.onSavedCallback) {
        this.onSavedCallback(updated);
      }
    });

    this.btnClose.addEventListener('click', () => this.close());
  }

  processUploadedPhoto(dataUrl) {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      // Center & crop square
      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;
      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 512, 512);

      this.customFaceDataUrl = canvas.toDataURL('image/png');

      // Dynamically update existing preview model texture if present
      if (this.previewModel) {
        this.previewModel.updateFaceTexture(this.customFaceDataUrl);
      } else {
        this.rebuildPreviewModel();
      }
    };
  }

  open() {
    this.modal.classList.remove('hidden');
    if (this.baseModelSelect) {
      this.baseModelSelect.value = customFighter.baseModel || 'modi';
    }
    this.rebuildPreviewModel();
  }

  close() {
    this.modal.classList.add('hidden');
  }
}
