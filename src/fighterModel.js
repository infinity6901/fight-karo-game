import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

let dracoLoader = null;
let gltfLoader = null;
const modelCache = new Map();

function getLoader() {
  if (!gltfLoader) {
    dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);
  }
  return gltfLoader;
}

export async function fetchGLTF(url) {
  if (!modelCache.has(url)) {
    const loader = getLoader();
    const promise = loader.loadAsync(url);
    modelCache.set(url, promise);
  }
  return modelCache.get(url);
}

// Math vectors & quaternions for bone kinematics
const axisX = new THREE.Vector3(1, 0, 0);
const axisZ = new THREE.Vector3(0, 0, 1);
const tempEuler = new THREE.Euler(0, 0, 0, 'XYZ');
const tempQuat = new THREE.Quaternion();
const tempQuatArm = new THREE.Quaternion();
const tempQuatElbow = new THREE.Quaternion();

const ARM_REST_ANGLE = THREE.MathUtils.degToRad(82);
const A0L = new THREE.Quaternion().setFromAxisAngle(axisZ, -ARM_REST_ANGLE);
const A0R = new THREE.Quaternion().setFromAxisAngle(axisZ, ARM_REST_ANGLE);
const A0Linv = A0L.clone().invert();
const A0Rinv = A0R.clone().invert();

function findBone(root, name) {
  let found = null;
  const re = new RegExp(`^${name}(_\\d+)?$`, 'i');
  root.traverse(child => {
    if (!found && child.isBone && re.test(child.name)) {
      found = child;
    }
  });
  return found;
}

export class CharacterModel {
  constructor(charData, onLoad = null) {
    this.charData = charData;
    this.onLoad = onLoad;
    this.root = new THREE.Group();
    this.isReady = false;

    this.joints = {};
    this.hipsRestPos = new THREE.Vector3();
    this.scale = 1.0;
    this.headBone = null;
    this.headMaterials = [];

    this.initModel();
  }

  async initModel() {
    const url = this.charData.modelUrl || './models/modi.glb';
    try {
      console.log(`[3D] Loading GLTF model for ${this.charData.name} from ${url}`);
      const gltf = await fetchGLTF(url);
      console.log(`[3D] Loaded GLTF scene for ${this.charData.name}, cloning...`);
      this.setupClone(gltf);
      this.isReady = true;
      console.log(`[3D] Character model READY for ${this.charData.name}`);
      if (this.onLoad) this.onLoad(this);
    } catch (err) {
      console.warn(`[3D] Failed loading 3D model for ${this.charData.name} from ${url}:`, err);
    }
  }

  setupClone(gltf) {
    // Clone full skinned mesh hierarchy
    this.model = SkeletonUtils.clone(gltf.scene);

    // Apply materials, shadows, and face textures
    this.applyMaterialsAndTextures();

    // Map bones
    const boneNames = [
      'Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'Head',
      'LeftArm', 'LeftForeArm', 'RightArm', 'RightForeArm',
      'LeftUpLeg', 'LeftLeg', 'LeftFoot',
      'RightUpLeg', 'RightLeg', 'RightFoot'
    ];

    for (const name of boneNames) {
      const bone = findBone(this.model, name);
      if (bone) {
        const parentQ = new THREE.Quaternion();
        if (bone.parent) {
          bone.parent.getWorldQuaternion(parentQ);
        }
        this.joints[name] = {
          bone,
          rest: bone.quaternion.clone(),
          P: parentQ,
          Pinv: parentQ.clone().invert()
        };
      }
    }

    if (this.joints.Hips) {
      this.hipsRestPos.copy(this.joints.Hips.bone.position);
    }

    // Caricature proportion: scale Head bone by 1.32 (icons of Sansad Showdown)
    if (this.joints.Head) {
      this.headBone = this.joints.Head.bone;
      this.headBone.scale.multiplyScalar(1.32);
    }

    // Normalizing scale so characters match arena ground
    this.model.updateMatrixWorld(true);
    const leftUpLeg = findBone(this.model, 'LeftUpLeg');
    let legWorldY = 0.97;
    if (leftUpLeg) {
      const legPos = new THREE.Vector3();
      leftUpLeg.getWorldPosition(legPos);
      if (legPos.y > 0.1) legWorldY = legPos.y;
    }

    // Standard fighting scale
    const targetScale = 1.38 * (0.97 / legWorldY);
    this.scale = targetScale;
    this.model.scale.setScalar(targetScale);

    this.root.add(this.model);
  }

  applyMaterialsAndTextures() {
    const texLoader = new THREE.TextureLoader();

    // Determine custom or high-res face texture
    let customFaceTex = null;
    const faceSrc = this.charData.customFaceDataUrl || this.charData.faceTexture;
    if (faceSrc) {
      customFaceTex = texLoader.load(faceSrc);
      customFaceTex.colorSpace = THREE.SRGBColorSpace;
      customFaceTex.flipY = false;
    }

    this.model.traverse(node => {
      if (!node.isMesh) return;
      node.castShadow = true;
      node.receiveShadow = true;
      node.frustumCulled = false;

      const mats = Array.isArray(node.material) ? node.material : [node.material];
      for (let m of mats) {
        if (!m || !m.isMeshStandardMaterial) continue;

        const name = m.name || '';

        // Face & Body materials
        if (/AvatarHead|trump_head|yogi_head|nitin_head/i.test(name)) {
          m.roughness = 0.62;
          m.metalness = 0.02;
          if (customFaceTex) {
            m.map = customFaceTex;
            m.needsUpdate = true;
          }
          this.headMaterials.push(m);
        } else if (/AvatarBody/i.test(name)) {
          m.roughness = 0.65;
        } else if (/trump_body/i.test(name)) {
          m.roughness = 0.78;
          m.metalness = 0;
          if (this.charData.isCustom && this.charData.primaryColor) {
            m.color = new THREE.Color(this.charData.primaryColor);
          }
        } else if (/outfit_top|didi_sari|yogi_body/i.test(name)) {
          m.roughness = 0.85;
          if (this.charData.isCustom && this.charData.primaryColor) {
            m.color = new THREE.Color(this.charData.primaryColor);
          }
        } else if (/outfit_bottom/i.test(name)) {
          m.roughness = 0.85;
          if (this.charData.isCustom && this.charData.pantsColor) {
            m.color = new THREE.Color(this.charData.pantsColor);
          }
        } else if (/glasses/i.test(name)) {
          m.roughness = 0.1;
          m.metalness = 0.8;
        }
      }
    });
  }

  // Update face texture dynamically (e.g. when photo uploaded in custom character modal)
  updateFaceTexture(imageSrc) {
    const texLoader = new THREE.TextureLoader();
    const newTex = texLoader.load(imageSrc, () => {
      newTex.colorSpace = THREE.SRGBColorSpace;
      newTex.flipY = false;
      for (const m of this.headMaterials) {
        m.map = newTex;
        m.needsUpdate = true;
      }
    });
  }

  // Set Bone rotation relative to Mixamo parent orientation
  setJointQuat(joint, rotQuat) {
    if (!joint) return;
    joint.bone.quaternion
      .copy(joint.Pinv)
      .multiply(rotQuat)
      .multiply(joint.P)
      .multiply(joint.rest);
  }

  fromEuler(x, y, z, factor = 1) {
    tempEuler.set(x * factor, y * factor, z * factor, 'XYZ');
    return tempQuat.setFromEuler(tempEuler);
  }

  // Apply Pose from Kinematics Engine to 3D Bones
  applyPose(pose) {
    if (!this.isReady) return;

    const j = this.joints;
    const n = this.scale;

    // Root / Hips positioning & tilting
    if (j.Hips) {
      j.Hips.bone.position.set(
        this.hipsRestPos.x,
        this.hipsRestPos.y + (pose.rootY || 0) / n,
        this.hipsRestPos.z + (pose.rootZ || 0) / n
      );
      this.setJointQuat(j.Hips, this.fromEuler(pose.hipsF || 0, pose.hipsT || 0, pose.hipsS || 0));
    }

    // Spine chain
    if (j.Spine) this.setJointQuat(j.Spine, this.fromEuler(pose.spineF || 0, pose.spineT || 0, pose.spineS || 0, 0.5));
    if (j.Spine1) this.setJointQuat(j.Spine1, this.fromEuler(pose.spineF || 0, pose.spineT || 0, pose.spineS || 0, 0.5));
    if (j.Spine2) this.setJointQuat(j.Spine2, this.fromEuler((pose.chestF || 0), pose.chestT || 0, 0));

    // Neck & Head
    if (j.Neck) this.setJointQuat(j.Neck, this.fromEuler(pose.headF || 0, pose.headT || 0, pose.headS || 0, 0.4));
    if (j.Head) this.setJointQuat(j.Head, this.fromEuler(pose.headF || 0, pose.headT || 0, pose.headS || 0, 0.6));

    // Left Arm & Forearm (via rest T-pose down quaternion A0L)
    if (j.LeftArm) {
      tempEuler.set(-(pose.lShF || 0), pose.lShT || 0, pose.lShO || 0, 'XYZ');
      tempQuatArm.setFromEuler(tempEuler).multiply(A0L);
      this.setJointQuat(j.LeftArm, tempQuatArm);
    }
    if (j.LeftForeArm) {
      tempQuatElbow.setFromAxisAngle(axisX, -(pose.lEl || 0));
      tempQuatArm.copy(A0Linv).multiply(tempQuatElbow).multiply(A0L);
      this.setJointQuat(j.LeftForeArm, tempQuatArm);
    }

    // Right Arm & Forearm (via rest T-pose down quaternion A0R)
    if (j.RightArm) {
      tempEuler.set(-(pose.rShF || 0), -(pose.rShT || 0), -(pose.rShO || 0), 'XYZ');
      tempQuatArm.setFromEuler(tempEuler).multiply(A0R);
      this.setJointQuat(j.RightArm, tempQuatArm);
    }
    if (j.RightForeArm) {
      tempQuatElbow.setFromAxisAngle(axisX, -(pose.rEl || 0));
      tempQuatArm.copy(A0Rinv).multiply(tempQuatElbow).multiply(A0R);
      this.setJointQuat(j.RightForeArm, tempQuatArm);
    }

    // Left Leg
    if (j.LeftUpLeg) this.setJointQuat(j.LeftUpLeg, this.fromEuler(-(pose.lThF || 0), 0, pose.lThO || 0));
    if (j.LeftLeg) {
      tempQuat.setFromAxisAngle(axisX, pose.lKn || 0);
      this.setJointQuat(j.LeftLeg, tempQuat);
    }
    if (j.LeftFoot) {
      tempQuat.setFromAxisAngle(axisX, pose.lAnk || 0);
      this.setJointQuat(j.LeftFoot, tempQuat);
    }

    // Right Leg
    if (j.RightUpLeg) this.setJointQuat(j.RightUpLeg, this.fromEuler(-(pose.rThF || 0), 0, -(pose.rThO || 0)));
    if (j.RightLeg) {
      tempQuat.setFromAxisAngle(axisX, pose.rKn || 0);
      this.setJointQuat(j.RightLeg, tempQuat);
    }
    if (j.RightFoot) {
      tempQuat.setFromAxisAngle(axisX, pose.rAnk || 0);
      this.setJointQuat(j.RightFoot, tempQuat);
    }
  }
}
