// Kinematics and Inverse Kinematics Engine for Fight Karo (Sansad Showdown)
// Drives the 3D Mixamo rigged biped skeletons with character-specific satirical poses

const Je = 0.45; // Thigh length
const Ye = 0.45; // Shin length
const Xe = 0.07; // Ankle ground offset
const Ze = 0.97; // Hip rest height

export const POSE_KEYS = [
  'rootY', 'rootZ',
  'hipsF', 'hipsT', 'hipsS',
  'spineF', 'spineT', 'spineS',
  'chestF', 'chestT',
  'headF', 'headT', 'headS',
  'lShF', 'lShO', 'lShT', 'lEl', 'lHand', 'lWf', 'lWr',
  'rShF', 'rShO', 'rShT', 'rEl', 'rHand', 'rWf', 'rWr',
  'lThF', 'lThO', 'lKn', 'lAnk',
  'rThF', 'rThO', 'rKn', 'rAnk'
];

export function createEmptyPose() {
  const p = {};
  for (const k of POSE_KEYS) p[k] = 0;
  return p;
}

export function clonePose(p) {
  return { ...p };
}

export function mergePoses(a, b) {
  return { ...a, ...b };
}

export function lerpPose(a, b, t, out = createEmptyPose()) {
  for (const k of POSE_KEYS) {
    out[k] = (a[k] ?? 0) + ((b[k] ?? 0) - (a[k] ?? 0)) * t;
  }
  return out;
}

const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));
const easeOutCubic = (t) => 1 - Math.pow(1 - clamp(t), 3);
const easeInOutCubic = (t) => {
  const c = clamp(t);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
};

// 2-Bone Inverse Kinematics for Legs
export function solveLegIK(targetY, targetZ, groundOffset = 0) {
  const r = Math.max(0.05, targetY - Xe - groundOffset);
  const i = targetZ;
  const maxReach = Je + Ye - 0.000001;
  const dist = Math.min(maxReach, Math.max(0.05, Math.hypot(r, i)));
  const cosKnee = (Je * Je + Ye * Ye - dist * dist) / (2 * Je * Ye);
  const kneeAngle = Math.PI - Math.acos(clamp(cosKnee, -1, 1));
  const baseAngle = Math.atan2(i, r);
  const cosThigh = (Je * Je + dist * dist - Ye * Ye) / (2 * Je * dist);
  const thighAngle = baseAngle + Math.acos(clamp(cosThigh, -1, 1));
  return { thF: thighAngle, kn: kneeAngle };
}

export function solveBothLegs(rootY, leftZ, rightZ, leftOff = 0, rightOff = 0) {
  const hipY = Ze + rootY;
  const left = solveLegIK(hipY, leftZ, leftOff);
  const right = solveLegIK(hipY, rightZ, rightOff);
  return {
    lThF: left.thF,
    lKn: left.kn,
    lAnk: left.thF - left.kn,
    rThF: right.thF,
    rKn: right.kn,
    rAnk: right.thF - right.kn
  };
}

export function solveSingleLeg(rootY, z) {
  const leg = solveLegIK(Ze + rootY, z);
  return { lThF: leg.thF, lKn: leg.kn, lAnk: leg.thF - leg.kn };
}

const GUARD_ARMS = {
  lShF: 1.05, lShO: 0.18, lShT: 0, lEl: 1.85, lHand: 0,
  rShF: 0.75, rShO: 0.22, rShT: 0, rEl: 2.15, rHand: 0
};

// --- Poses by Character State ---

// Idle / Combat Stance
export function getStancePose(time, charId = 'modi') {
  const breath = Math.sin(time * 4.2) * 0.012;
  const sway = Math.sin(time * 1.3);
  const armPulse = Math.sin(time * 4.2 + 0.9);
  const rootY = -0.07 + breath;

  const pose = {
    ...createEmptyPose(),
    rootY,
    hipsT: -0.25 + sway * 0.04,
    hipsS: sway * 0.025,
    spineF: 0.1 + breath * 1.5,
    spineT: -0.05 - sway * 0.03,
    spineS: -sway * 0.02,
    chestF: 0.04,
    headF: -0.08 - breath,
    headT: 0.3 + Math.sin(time * 0.7) * 0.05,
    lThO: 0.06,
    rThO: 0.1,
    ...GUARD_ARMS,
    ...solveBothLegs(rootY, 0.24 + sway * 0.015, -0.26 + sway * 0.015)
  };

  pose.lShF += armPulse * 0.04;
  pose.rShF -= armPulse * 0.035;
  pose.lEl += armPulse * 0.05;

  // Character specific stance flair
  if (charId === 'modi' || charId === 'mitraman') {
    pose.spineF = 0.05 + breath;
  } else if (charId === 'didi' || charId === 'deedee') {
    pose.spineF = 0.02 + breath;
    pose.headF = -0.14 - breath;
    pose.rootY += Math.max(0, Math.sin(time * 6.3)) * 0.008;
  } else if (charId === 'trump' || charId === 'taruftaau') {
    pose.spineF = -0.02 + breath;
    pose.chestF = -0.04;
    pose.headF = -0.18 - breath;
    pose.hipsS = Math.sin(time * 1.3) * 0.02;
  } else if (charId === 'yogi' || charId === 'dozerdada') {
    pose.spineF = 0.03 + breath * 0.6;
    pose.chestF = 0;
    pose.headF = -0.05 - breath * 0.5;
    pose.rootY -= breath * 0.4;
  } else {
    pose.rootY += Math.max(0, Math.sin(time * 4.2)) * 0.012;
  }

  return pose;
}

// Walking Forward / Backward
export function getWalkPose(time, walkCycleTime, direction, charId = 'modi') {
  const base = getStancePose(time, charId);
  const cycle = (walkCycleTime / 0.55) * Math.PI;
  const dirSign = direction >= 0 ? 1 : -1;
  const stepSin = Math.sin(cycle) * dirSign;
  const stepCos = Math.cos(cycle);
  const rootY = -0.07 + Math.abs(stepCos) * 0.025;

  return {
    ...base,
    rootY,
    ...solveBothLegs(
      rootY,
      0.24 + stepSin * 0.13,
      -0.26 - stepSin * 0.13,
      Math.max(0, stepCos) * 0.06,
      Math.max(0, -stepCos) * 0.06
    ),
    hipsT: base.hipsT + stepSin * 0.08,
    spineT: -0.05 - stepSin * 0.1,
    spineF: base.spineF + dirSign * 0.05,
    spineS: stepCos * 0.03,
    lShF: base.lShF - stepSin * 0.08,
    rShF: base.rShF + stepSin * 0.08
  };
}

// Crouch
export function getCrouchPose(time, charId = 'modi', isBlock = false) {
  const bob = -0.42 + Math.sin(time * 4) * 0.008;
  const base = getStancePose(time, charId);
  return {
    ...base,
    rootY: bob,
    spineF: 0.42,
    headF: -0.3,
    lShF: isBlock ? 1.3 : 1.0,
    lEl: isBlock ? 2.2 : 1.7,
    rShF: isBlock ? 1.1 : 0.8,
    rEl: 2.2,
    ...solveBothLegs(bob, 0.3, -0.18)
  };
}

// Defensive Block
export function getBlockPose(time, charId = 'modi') {
  const base = getStancePose(time, charId);
  return {
    ...base,
    spineF: 0.18,
    headF: 0.2,
    lShF: 1.35,
    lShO: -0.05,
    lEl: 2.4,
    rShF: 1.25,
    rShO: -0.05,
    rEl: 2.45
  };
}

// Airborne Jump
export function getJumpPose(velocityY, charId = 'modi') {
  const n = clamp(1 - Math.abs(velocityY) / 8);
  const base = getStancePose(0, charId);
  return {
    ...base,
    rootY: 0,
    spineF: 0.15,
    lThF: 0.5 + n * 0.7,
    lKn: 0.6 + n * 1.2,
    lAnk: 0.3,
    rThF: 0.2 + n * 0.6,
    rKn: 0.8 + n * 1.0,
    rAnk: 0.3,
    lShF: 1.3,
    lEl: 1.6,
    rShF: 1.0,
    rEl: 1.9
  };
}

// Attack Poses: Windup & Strike keyframes
export function getAttackFrames(moveId, charId = 'modi') {
  switch (moveId) {
    case 'jab':
    case 'LIGHT_PUNCH':
      return {
        windup: { lShF: 1.2, lEl: 2.1, spineT: -0.1 },
        strike: { lShF: 1.58, lShO: -0.12, lShT: 0, lEl: 0.05, spineT: -0.38, hipsT: -0.35, rootZ: 0.06, headT: 0.4 }
      };

    case 'cross':
    case 'HEAVY_PUNCH':
      return {
        windup: { rShF: 0.8, rEl: 2.3, spineT: -0.3 },
        strike: { rShF: 1.6, rShO: -0.3, rEl: 0.05, spineT: 0.45, hipsT: 0.15, rootZ: 0.1, lShF: 1.0, lEl: 2.2, headT: 0 }
      };

    case 'kick':
    case 'LIGHT_KICK': {
      const y = -0.03;
      return {
        windup: { rThF: 1.3, rKn: 1.9, spineF: -0.05, rootY: y },
        strike: { rootY: y, rThF: 1.45, rKn: 0.15, rAnk: 0.2, spineF: -0.22, hipsT: 0.1, ...solveSingleLeg(y, 0.06) }
      };
    }

    case 'uppercut':
    case 'UPPERCUT': {
      const y = -0.3;
      return {
        windup: { rootY: y, ...solveBothLegs(y, 0.32, -0.3), spineF: 0.4, spineT: -0.25, lShF: 0.2, lShO: 0.1, lEl: 1.7 },
        strike: { rootY: 0.03, ...solveBothLegs(0.03, 0.16, -0.3), spineF: -0.28, spineT: -0.3, hipsT: -0.4, lShF: 2.85, lShO: -0.1, lEl: 0.45, rShF: 0.9, rEl: 2.2, headF: -0.35, rootZ: 0.05 }
      };
    }

    case 'roundhouse': {
      return {
        windup: { rootY: 0, hipsT: -0.9, spineT: 0.3, rThF: 0.7, rThO: 0.3, rKn: 1.7, ...solveSingleLeg(0, 0.05) },
        strike: { rootY: 0, hipsT: 1.1, spineT: -0.45, spineF: -0.5, spineS: 0.25, rThF: 1.75, rThO: 1.0, rKn: 0.05, rAnk: 0.2, lShF: 0.5, lShO: 1.0, lEl: 0.5, rShF: 0.3, rShO: 0.9, rEl: 0.6, headT: 0.6, ...solveSingleLeg(0, 0) }
      };
    }

    case 'lowJab': {
      const y = -0.42;
      return {
        windup: { lShF: 0.9, lEl: 2.0, rootY: y, spineF: 0.42 },
        strike: { rootY: y, spineF: 0.5, lShF: 1.2, lShO: -0.1, lEl: 0.08, spineT: -0.35, ...solveBothLegs(y, 0.3, -0.18) }
      };
    }

    case 'sweep':
    case 'LOW_SWEEP': {
      const y = -0.55;
      const leg = solveLegIK(Ze + y, -0.32);
      return {
        windup: { rootY: y, spineF: 0.5, lShF: 1.3, lEl: 2.2, rShF: 0.6, rEl: 1.4, lThF: leg.thF, lKn: leg.kn, lAnk: leg.thF - leg.kn, rThF: 0.4, rKn: 0.8 },
        strike: { rootY: y, spineF: 0.45, spineT: 0.5, hipsT: 0.4, lThF: 1.1, lKn: 1.7, lAnk: 0.3, rThF: 1.6, rThO: 0.6, rKn: 0.05, rAnk: 0.2, lShF: 0.5, lEl: 1.2, rShF: 1.4, rEl: 0.3 }
      };
    }

    default: // generic punch
      return {
        windup: { lShF: 1.2, lEl: 2.1, spineT: -0.1 },
        strike: { lShF: 1.58, lShO: -0.12, lShT: 0, lEl: 0.05, spineT: -0.38, hipsT: -0.35, rootZ: 0.06, headT: 0.4 }
      };
  }
}

// Compute interpolated Attack Pose based on state progress (0 -> 1)
export function getAttackPose(moveId, progress, time, charId = 'modi') {
  const base = getStancePose(time, charId);
  const frames = getAttackFrames(moveId, charId);
  const windupPose = mergePoses(base, frames.windup);
  const strikePose = mergePoses(base, frames.strike);

  // 0.0 -> 0.25: Windup
  // 0.25 -> 0.5: Strike extension
  // 0.5 -> 1.0: Recovery back to base
  if (progress <= 0.25) {
    const t = easeOutCubic(progress / 0.25);
    return lerpPose(base, windupPose, t);
  } else if (progress <= 0.5) {
    const t = easeInOutCubic((progress - 0.25) / 0.25);
    return lerpPose(windupPose, strikePose, t);
  } else {
    const t = easeOutCubic((progress - 0.5) / 0.5);
    return lerpPose(strikePose, base, t);
  }
}

// Hurt Reaction Pose
export function getHurtPose(stateTime, hitHeight = 'mid', time = 0, charId = 'modi') {
  const base = getStancePose(time, charId);
  const progress = clamp(stateTime / 0.3);
  const recoil = Math.sin(stateTime * 15) * Math.exp(-stateTime * 6) * 0.25;

  const isLow = hitHeight === 'low';
  const isHigh = hitHeight === 'high';

  const target = {
    ...base,
    spineF: isLow ? 0.55 : isHigh ? -0.5 : -0.3,
    spineT: base.spineT + (isHigh ? 0.25 : 0.1),
    chestF: isLow ? 0.2 : -0.2,
    headF: isLow ? 0.45 : isHigh ? -0.7 : -0.45,
    headT: base.headT + (isHigh ? 0.35 : 0.15),
    headS: 0.25 + recoil,
    lShF: 0.45,
    lShO: 0.55,
    lEl: 0.75,
    rShF: 0.25,
    rShO: 0.7,
    rEl: 0.55,
    rootY: isLow ? -0.18 : -0.1,
    ...solveBothLegs(isLow ? -0.18 : -0.1, 0.16, -0.34),
    lHand: 1,
    rHand: 1
  };

  const pose = lerpPose(base, target, (1 - progress * 0.75) * easeOutCubic(progress));
  pose.spineS += recoil * 0.4;
  return pose;
}

// Knockdown Fall (Airborne flip backward)
export function getFallPose(progress) {
  const t = clamp(progress);
  return {
    ...createEmptyPose(),
    rootY: -0.1,
    hipsF: -0.4 - t * 1.0,
    spineF: -0.3,
    headF: -0.5,
    lShF: 2.2,
    lShO: 0.7,
    lEl: 0.5,
    lHand: 1,
    rShF: 2.0,
    rShO: 0.8,
    rEl: 0.6,
    rHand: 1,
    lThF: 0.7,
    lKn: 0.9,
    rThF: 0.4,
    rKn: 0.6
  };
}

// Ground Lay Pose
export function getGroundPose(time = 0) {
  return {
    ...createEmptyPose(),
    rootY: -(Ze - 0.13),
    hipsF: -Math.PI / 2,
    spineF: 0.04,
    headF: -0.15 + Math.sin(time * 30) * 0.04,
    headT: 0.5,
    lShF: 0.3,
    lShO: 1.1,
    lEl: 0.4,
    lHand: 1,
    rShF: 0.5,
    rShO: 1.0,
    rEl: 0.7,
    rHand: 1,
    lThF: 0.15,
    lThO: 0.15,
    lKn: 0.2,
    lAnk: 0.4,
    rThF: 0.35,
    rThO: 0.1,
    rKn: 0.7,
    rAnk: 0.4
  };
}

// Knockdown Sequence (Air fall -> Ground bounce/lay)
export function getKnockdownPose(isGrounded, downProgress, time) {
  if (!isGrounded) {
    return getFallPose(downProgress);
  }
  const t = easeOutCubic(clamp(downProgress));
  return lerpPose(getFallPose(1.0), getGroundPose(time), t);
}

// Get Up Sequence
export function getGetUpPose(progress, time, charId = 'modi') {
  const crouch = getCrouchPose(time, charId, true);
  const crouchLow = { ...crouch, rootY: -0.6, hipsF: -0.4, spineF: 0.8 };
  const stance = getStancePose(time, charId);

  if (progress < 0.5) {
    return lerpPose(getGroundPose(time), crouchLow, easeInOutCubic(progress / 0.5));
  } else {
    return lerpPose(crouchLow, stance, easeInOutCubic((progress - 0.5) / 0.5));
  }
}

// Character Specific Victory Pose
export function getVictoryPose(time, charId = 'modi') {
  const stance = getStancePose(time, charId);

  if (charId === 'modi' || charId === 'mitraman') {
    // Both hands raised high waving to the crowd
    const wave = Math.sin(time * 2.5) * 0.08;
    return {
      ...stance,
      rootY: 0,
      ...solveBothLegs(0, 0.1, -0.1),
      hipsT: 0,
      spineT: 0,
      spineF: -0.05,
      headT: 0.6,
      headF: -0.1,
      lShF: 0.5 + wave,
      lShO: 1.0,
      lShT: 0.6,
      lEl: 0.5,
      lHand: 1,
      rShF: 0.5 - wave,
      rShO: 1.0,
      rShT: 0.6,
      rEl: 0.5,
      rHand: 1
    };
  }

  if (charId === 'didi' || charId === 'deedee') {
    // Khela Finished finger wag & head tilt
    const wag = Math.sin(time * 9) * 0.22;
    return {
      ...stance,
      rootY: 0,
      ...solveBothLegs(0, 0.1, -0.12),
      hipsT: 0.1,
      hipsS: 0.05,
      spineT: 0.05,
      spineS: -0.05,
      headT: 0.45,
      headF: -0.18,
      headS: wag * 0.25,
      rShF: 1.45,
      rShO: 0.05,
      rShT: wag,
      rEl: 0.55,
      rHand: 0.35,
      lShF: -0.15,
      lShO: 0.55,
      lShT: -0.4,
      lEl: 1.75,
      lHand: 0
    };
  }

  if (charId === 'trump' || charId === 'taruftaau') {
    // Trump dance double fist pumps
    const pump = Math.sin(time * 3.2);
    return {
      ...stance,
      rootY: 0,
      ...solveBothLegs(0, 0.12, -0.12),
      hipsT: 0,
      spineT: 0.05,
      spineF: -0.06,
      chestF: -0.05,
      headT: 0.55,
      headF: -0.22 + Math.abs(pump) * 0.05,
      headS: pump * 0.06,
      lShF: 1.05,
      lShO: 0.25 + pump * 0.22,
      lShT: 0.35,
      lEl: 1.1,
      lHand: 1,
      rShF: 1.05,
      rShO: 0.25 + pump * 0.22,
      rShT: 0.35,
      rEl: 1.1,
      rHand: 1
    };
  }

  // Default victory: raised victory arm
  return {
    ...stance,
    rootY: 0,
    ...solveBothLegs(0, 0.12, -0.12),
    hipsT: 0,
    spineT: 0.1,
    headT: 0.6,
    rShF: 1.3,
    rShO: 0.3,
    rShT: 0,
    rEl: 1.4,
    rHand: 1,
    lShF: 0.1,
    lShO: 0.15,
    lEl: 0.2,
    lHand: 1
  };
}
