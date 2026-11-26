import * as THREE from 'three';
import {
  KitInstance,
  SocketDescriptor,
  ColliderDescriptor,
  materialFor,
  bevelledBox,
  part,
  createSocket,
} from './kitCore';

export type RobotVariant = 'floor' | 'overhead';

export type LoaderStage =
  | 'pulling'
  | 'snap'
  | 'standup'
  | 'dizzy'
  | 'wave'
  | 'curtain_half'
  | 'curtain_strain'
  | 'curtain_final';

export interface BeepRobotAnimState {
  stage: LoaderStage;
  progress: number;
  elapsed: number;
  floorY: number;
  viewportWidth: number;
  viewportHeight: number;
}

export interface BeepRobotKit extends KitInstance<BeepRobotAnimState> {
  setFaceTexture: (tex: THREE.Texture | null) => void;
  getSocketWorldPosition: (name: string, target: THREE.Vector3) => THREE.Vector3;
}

/**
 * 3dviz-pro-max Unified Robot Kit ("BEEP")
 * Shared chamfered construction, recessed OLED visor, machined axles, and socket contract
 * used by both the floor tug-of-war bot and the overhead curtain hoist bot.
 */
export function createBeepRobot({
  variant,
  faceTexture = null,
}: {
  variant: RobotVariant;
  faceTexture?: THREE.Texture | null;
}): BeepRobotKit {
  const group = new THREE.Group();
  group.name = `beep_robot_${variant}`;

  const bodyGroup = new THREE.Group();
  group.add(bodyGroup);

  const geometries: THREE.BufferGeometry[] = [];
  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };

  // Distinct material family (object-craft.md)
  const chassisMat = materialFor('#f8fafc', { roughness: 0.24, metalness: 0.04 });
  const accentMat = materialFor('#0284c7', { roughness: 0.28, metalness: 0.38 });
  const darkRubberMat = materialFor('#1e293b', { roughness: 0.85, metalness: 0.04 });
  const steelMat = materialFor('#cbd5e1', { roughness: 0.26, metalness: 0.78 });
  const darkSteelMat = materialFor('#334155', { roughness: 0.3, metalness: 0.82 });
  const coreGlowMat = materialFor('#38bdf8', {
    roughness: 0.2,
    metalness: 0.1,
    emissive: '#0284c7',
    emissiveIntensity: 1.25,
  });

  const oledMat = new THREE.MeshBasicMaterial({
    map: faceTexture ?? null,
    color: faceTexture ? '#ffffff' : '#030712',
  });

  const sockets: Record<string, SocketDescriptor> = {};

  // ==========================================================================
  // 1. TANK TREADS & DRIVE BASE (grounded at y = 0 for floor variant)
  // ==========================================================================
  const leftWheelsGroup = new THREE.Group();
  const rightWheelsGroup = new THREE.Group();

  if (variant === 'floor') {
    const treadHousingGeo = trackGeo(bevelledBox({ width: 0.56, height: 0.22, depth: 0.15, bevel: 0.035, segments: 2 }));
    const treadLugGeo = trackGeo(bevelledBox({ width: 0.055, height: 0.025, depth: 0.16, bevel: 0.006, segments: 1 }));
    const wheelHubGeo = trackGeo(new THREE.CylinderGeometry(0.088, 0.088, 0.166, 20));
    const wheelCapGeo = trackGeo(new THREE.CylinderGeometry(0.042, 0.042, 0.175, 16));
    const axleGeo = trackGeo(new THREE.CylinderGeometry(0.042, 0.042, 0.2, 14));
    const chassisDeckGeo = trackGeo(bevelledBox({ width: 0.34, height: 0.11, depth: 0.42, bevel: 0.025, segments: 2 }));

    const buildTreadPod = (zSign: number, wheelGroup: THREE.Group) => {
      const pod = new THREE.Group();
      pod.position.set(0, 0.11, zSign * 0.27);
      pod.add(part(treadHousingGeo, darkRubberMat));

      // Top & bottom tread lugs for silhouette detail
      for (const xOff of [-0.18, -0.06, 0.06, 0.18]) {
        pod.add(part(treadLugGeo, darkSteelMat, [xOff, 0.112, 0]));
        pod.add(part(treadLugGeo, darkSteelMat, [xOff, -0.112, 0]));
      }

      // Rotating dual drive wheels
      for (const xWheel of [-0.17, 0.17]) {
        wheelGroup.add(part(wheelHubGeo, accentMat, [xWheel, 0, 0], [Math.PI / 2, 0, 0]));
        wheelGroup.add(part(wheelCapGeo, steelMat, [xWheel, 0, 0], [Math.PI / 2, 0, 0]));
      }
      pod.add(wheelGroup);
      bodyGroup.add(pod);
    };

    buildTreadPod(1, leftWheelsGroup);
    buildTreadPod(-1, rightWheelsGroup);

    // Suspension struts + lower deck
    bodyGroup.add(part(axleGeo, steelMat, [0, 0.19, 0.18]));
    bodyGroup.add(part(axleGeo, steelMat, [0, 0.19, -0.18]));
    bodyGroup.add(part(chassisDeckGeo, steelMat, [0, 0.25, 0]));
  }

  // ==========================================================================
  // 2. CHAMFERED TORSO & RECESSED POWER CORE
  // ==========================================================================
  const torsoY = variant === 'floor' ? 0.49 : 0;
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, torsoY, 0);
  bodyGroup.add(torsoGroup);

  const torsoGeo = trackGeo(bevelledBox({ width: 0.38, height: 0.35, depth: 0.36, bevel: 0.055, segments: 3 }));
  const waistCollarGeo = trackGeo(bevelledBox({ width: 0.4, height: 0.055, depth: 0.38, bevel: 0.015, segments: 2 }));
  const coreRingGeo = trackGeo(new THREE.TorusGeometry(0.072, 0.014, 12, 24));
  const coreDiscGeo = trackGeo(new THREE.CircleGeometry(0.062, 24));

  torsoGroup.add(part(torsoGeo, chassisMat));
  torsoGroup.add(part(waistCollarGeo, accentMat, [0, -0.145, 0]));

  if (variant === 'floor') {
    torsoGroup.add(part(coreRingGeo, darkSteelMat, [0.188, 0.02, 0], [0, Math.PI / 2, 0]));
    torsoGroup.add(part(coreDiscGeo, coreGlowMat, [0.194, 0.02, 0], [0, Math.PI / 2, 0]));
    sockets.chestCore = createSocket(torsoGroup, 'chestCore', [0.195, 0.02, 0], [1, 0, 0]);
  }

  // ==========================================================================
  // 3. HEAD & RECESSED OLED VISOR BEZEL
  // ==========================================================================
  const headGroup = new THREE.Group();
  headGroup.position.set(0, variant === 'floor' ? 0.92 : 0.36, variant === 'floor' ? 0 : 0.04);
  bodyGroup.add(headGroup);

  const neckGeo = trackGeo(new THREE.CylinderGeometry(0.075, 0.095, 0.12, 18));
  const headShellGeo = trackGeo(bevelledBox({ width: 0.54, height: 0.43, depth: 0.52, bevel: 0.075, segments: 3 }));
  const visorBezelGeo = trackGeo(bevelledBox({ width: 0.045, height: 0.35, depth: 0.43, bevel: 0.014, segments: 2 }));
  const oledPlaneGeo = trackGeo(new THREE.PlaneGeometry(0.39, 0.30));
  const earCapGeo = trackGeo(new THREE.CylinderGeometry(0.095, 0.095, 0.055, 24));
  const earRimGeo = trackGeo(new THREE.TorusGeometry(0.092, 0.012, 10, 24));

  if (variant === 'floor') {
    headGroup.add(part(neckGeo, steelMat, [0, -0.22, 0]));
    headGroup.add(part(headShellGeo, chassisMat));
    // Visor faces +X on floor bot
    headGroup.add(part(visorBezelGeo, accentMat, [0.258, 0, 0]));
    const screenMesh = new THREE.Mesh(oledPlaneGeo, oledMat);
    screenMesh.position.set(0.283, 0, 0);
    screenMesh.rotation.set(0, Math.PI / 2, 0);
    headGroup.add(screenMesh);

    headGroup.add(part(earCapGeo, accentMat, [0, 0, 0.265], [Math.PI / 2, 0, 0]));
    headGroup.add(part(earRimGeo, steelMat, [0, 0, 0.292], [0, 0, 0]));
    headGroup.add(part(earCapGeo, accentMat, [0, 0, -0.265], [Math.PI / 2, 0, 0]));
    headGroup.add(part(earRimGeo, steelMat, [0, 0, -0.292], [0, 0, 0]));
  } else {
    // Overhead bot faces +Z toward camera
    const ohHeadGeo = trackGeo(bevelledBox({ width: 0.54, height: 0.43, depth: 0.48, bevel: 0.075, segments: 3 }));
    const ohBezelGeo = trackGeo(bevelledBox({ width: 0.44, height: 0.35, depth: 0.045, bevel: 0.014, segments: 2 }));
    headGroup.add(part(neckGeo, steelMat, [0, -0.22, 0]));
    headGroup.add(part(ohHeadGeo, chassisMat));
    headGroup.add(part(ohBezelGeo, accentMat, [0, 0, 0.228]));
    const screenMesh = new THREE.Mesh(oledPlaneGeo, oledMat);
    screenMesh.position.set(0, 0, 0.253);
    headGroup.add(screenMesh);

    headGroup.add(part(earCapGeo, accentMat, [0.275, 0, 0], [0, 0, Math.PI / 2]));
    headGroup.add(part(earCapGeo, accentMat, [-0.275, 0, 0], [0, 0, Math.PI / 2]));
  }

  sockets.headTop = createSocket(headGroup, 'headTop', [0, 0.34, 0], [0, 1, 0]);

  // ==========================================================================
  // 4. ARTICULATED ARMS & SOCKET CONTRACT
  // ==========================================================================
  const leftArmGroup = new THREE.Group();
  const rightArmGroup = new THREE.Group();

  const shoulderGeo = trackGeo(new THREE.SphereGeometry(0.064, 16, 16));
  const forearmGeo = trackGeo(new THREE.CylinderGeometry(0.038, 0.034, 0.29, 14));
  const wristCollarGeo = trackGeo(new THREE.CylinderGeometry(0.042, 0.042, 0.03, 14));
  const handClampGeo = trackGeo(bevelledBox({ width: 0.095, height: 0.088, depth: 0.088, bevel: 0.02, segments: 2 }));

  if (variant === 'floor') {
    leftArmGroup.position.set(0.05, 0.54, 0.225);
    leftArmGroup.add(part(shoulderGeo, steelMat));
    leftArmGroup.add(part(forearmGeo, chassisMat, [0.16, -0.02, -0.055], [0, 0.24, Math.PI / 2]));
    leftArmGroup.add(part(wristCollarGeo, darkSteelMat, [0.275, -0.035, -0.095], [0, 0.24, Math.PI / 2]));
    leftArmGroup.add(part(handClampGeo, accentMat, [0.31, -0.04, -0.105]));
    sockets.leftHand = createSocket(leftArmGroup, 'leftHand', [0.31, -0.04, -0.105], [1, 0, 0]);
    bodyGroup.add(leftArmGroup);

    rightArmGroup.position.set(0.05, 0.54, -0.225);
    rightArmGroup.add(part(shoulderGeo, steelMat));
    rightArmGroup.add(part(forearmGeo, chassisMat, [0.16, -0.02, 0.055], [0, -0.24, Math.PI / 2]));
    rightArmGroup.add(part(wristCollarGeo, darkSteelMat, [0.275, -0.035, 0.095], [0, -0.24, Math.PI / 2]));
    rightArmGroup.add(part(handClampGeo, accentMat, [0.31, -0.04, 0.105]));
    sockets.rightHand = createSocket(rightArmGroup, 'rightHand', [0.31, -0.04, 0.105], [1, 0, 0]);
    bodyGroup.add(rightArmGroup);

    // Exact midpoint grip socket between both hands
    sockets.ropeGrip = createSocket(bodyGroup, 'ropeGrip', [0.32, 0.50, 0], [1, 0, 0]);
  } else {
    // Overhead bot arms reaching downward to grip the steel spreader bar
    const ohForearmGeo = trackGeo(new THREE.CylinderGeometry(0.038, 0.034, 0.36, 14));
    leftArmGroup.position.set(-0.26, -0.06, 0.14);
    leftArmGroup.add(part(shoulderGeo, steelMat));
    leftArmGroup.add(part(ohForearmGeo, chassisMat, [0, -0.18, 0.06], [0.32, 0, 0]));
    leftArmGroup.add(part(handClampGeo, accentMat, [0, -0.34, 0.115]));
    sockets.leftHand = createSocket(leftArmGroup, 'leftHand', [0, -0.34, 0.115], [0, -1, 0]);
    bodyGroup.add(leftArmGroup);

    rightArmGroup.position.set(0.26, -0.06, 0.14);
    rightArmGroup.add(part(shoulderGeo, steelMat));
    rightArmGroup.add(part(ohForearmGeo, chassisMat, [0, -0.18, 0.06], [0.32, 0, 0]));
    rightArmGroup.add(part(handClampGeo, accentMat, [0, -0.34, 0.115]));
    sockets.rightHand = createSocket(rightArmGroup, 'rightHand', [0, -0.34, 0.115], [0, -1, 0]);
    bodyGroup.add(rightArmGroup);

    // Machined steel spreader bar
    const barGeo = trackGeo(new THREE.CylinderGeometry(0.032, 0.032, 0.72, 16));
    const endCapGeo = trackGeo(new THREE.CylinderGeometry(0.044, 0.044, 0.045, 16));

    bodyGroup.add(part(barGeo, darkSteelMat, [0, -0.41, 0.255], [0, 0, Math.PI / 2]));
    bodyGroup.add(part(endCapGeo, accentMat, [-0.36, -0.41, 0.255], [0, 0, Math.PI / 2]));
    bodyGroup.add(part(endCapGeo, accentMat, [0.36, -0.41, 0.255], [0, 0, Math.PI / 2]));
    sockets.hoistBar = createSocket(bodyGroup, 'hoistBar', [0, -0.41, 0.255], [0, -1, 0]);
  }

  // Colliders
  const colliders: ColliderDescriptor[] = [
    { name: 'treadBase', centre_m: [0, 0.11, 0], size_m: [0.58, 0.22, 0.70] },
    { name: 'torso', centre_m: [0, torsoY, 0], size_m: [0.40, 0.36, 0.38] },
    { name: 'head', centre_m: [0, variant === 'floor' ? 0.92 : 0.36, 0], size_m: [0.56, 0.44, 0.54] },
  ];

  // ==========================================================================
  // 5. AUTHORITATIVE KINEMATIC ANIMATION
  // ==========================================================================
  const animate = (dt: number, state: BeepRobotAnimState): boolean => {
    if (dt <= 0) return false;
    const { stage, progress, elapsed, floorY, viewportWidth, viewportHeight } = state;

    if (variant === 'floor') {
      const startX = -viewportWidth * 0.04;
      const endX = viewportWidth * 0.22;
      const tumbleX = viewportWidth * 0.28;
      const centerRightX = viewportWidth * 0.08;

      if (stage === 'pulling') {
        const targetX = THREE.MathUtils.lerp(startX, endX, progress / 100);
        const prevX = group.position.x;
        group.position.x = THREE.MathUtils.damp(group.position.x, targetX, 6, dt);
        group.position.y = floorY + Math.abs(Math.sin(elapsed * 9)) * 0.02;
        group.position.z = 0;

        group.rotation.y = -Math.PI + 0.38;
        group.rotation.z = 0.32;
        group.rotation.x = 0;
        bodyGroup.rotation.set(0, 0, 0);

        leftArmGroup.rotation.set(0, -0.25, 0.15);
        rightArmGroup.rotation.set(0, 0.25, 0.15);

        // Wheel spin proportional to motion + winch torque
        const spinDelta = dt * 6.5 + Math.abs(group.position.x - prevX) * 5;
        leftWheelsGroup.rotation.z += spinDelta;
        rightWheelsGroup.rotation.z += spinDelta;
      } else if (stage === 'snap') {
        group.position.x = THREE.MathUtils.damp(group.position.x, tumbleX, 7, dt);
        group.position.y = THREE.MathUtils.damp(group.position.y, floorY + 0.14, 7, dt);
        group.rotation.z = THREE.MathUtils.damp(group.rotation.z, 1.35, 8, dt);
        group.rotation.y = THREE.MathUtils.damp(group.rotation.y, -Math.PI + 0.55, 6, dt);

        leftArmGroup.rotation.z = THREE.MathUtils.damp(leftArmGroup.rotation.z, 1.1, 10, dt);
        leftArmGroup.rotation.y = THREE.MathUtils.damp(leftArmGroup.rotation.y, 0.5, 10, dt);
        rightArmGroup.rotation.z = THREE.MathUtils.damp(rightArmGroup.rotation.z, 1.1, 10, dt);
        rightArmGroup.rotation.y = THREE.MathUtils.damp(rightArmGroup.rotation.y, -0.5, 10, dt);
      } else if (stage === 'standup' || stage === 'dizzy') {
        group.position.x = THREE.MathUtils.damp(group.position.x, centerRightX, 4.5, dt);
        group.position.y = THREE.MathUtils.damp(group.position.y, floorY, 5.0, dt);
        group.rotation.z = THREE.MathUtils.damp(group.rotation.z, 0, 5.5, dt);
        group.rotation.x = THREE.MathUtils.damp(group.rotation.x, 0, 5.5, dt);
        group.rotation.y = THREE.MathUtils.damp(group.rotation.y, -Math.PI / 2, 4.5, dt);

        leftArmGroup.rotation.z = THREE.MathUtils.damp(leftArmGroup.rotation.z, -0.7, 5, dt);
        leftArmGroup.rotation.y = THREE.MathUtils.damp(leftArmGroup.rotation.y, 0, 5, dt);
        const rubTargetZ = stage === 'dizzy' ? 1.45 + Math.sin(elapsed * 10) * 0.15 : -0.7;
        rightArmGroup.rotation.z = THREE.MathUtils.damp(rightArmGroup.rotation.z, rubTargetZ, 6, dt);
        rightArmGroup.rotation.y = THREE.MathUtils.damp(rightArmGroup.rotation.y, 0, 5, dt);
      } else {
        group.position.x = THREE.MathUtils.damp(group.position.x, centerRightX, 4, dt);
        group.position.y = THREE.MathUtils.damp(group.position.y, floorY, 4, dt);
        group.rotation.z = THREE.MathUtils.damp(group.rotation.z, 0, 4.5, dt);
        group.rotation.y = THREE.MathUtils.damp(group.rotation.y, -Math.PI / 2, 4.5, dt);

        leftArmGroup.rotation.z = THREE.MathUtils.damp(leftArmGroup.rotation.z, -0.75, 5, dt);
        rightArmGroup.rotation.z = 1.35 + Math.sin(elapsed * 10) * 0.35;
        rightArmGroup.rotation.y = 0;
      }
    } else {
      // Overhead variant synced to stage
      const topHiddenY = viewportHeight * 0.5 + 1.2;
      const peekY = viewportHeight * 0.5 - 0.65;
      const lowerStrainY = viewportHeight * 0.5 - 1.05;

      let targetY = topHiddenY;
      if (stage === 'wave' || stage === 'curtain_half') {
        targetY = peekY;
      } else if (stage === 'curtain_strain') {
        targetY = lowerStrainY;
      } else if (stage === 'curtain_final') {
        targetY = peekY + 0.35;
      }

      group.position.y = THREE.MathUtils.damp(group.position.y, targetY, 5.5, dt);

      if (stage === 'curtain_strain') {
        bodyGroup.rotation.x = THREE.MathUtils.damp(bodyGroup.rotation.x, 0.15, 6, dt);
        bodyGroup.position.x = Math.sin(elapsed * 38) * 0.025;
      } else if (stage === 'curtain_final') {
        bodyGroup.rotation.x = THREE.MathUtils.damp(bodyGroup.rotation.x, -0.15, 6, dt);
        bodyGroup.position.x = 0;
      } else {
        bodyGroup.rotation.x = THREE.MathUtils.damp(bodyGroup.rotation.x, 0.35, 5, dt);
        bodyGroup.position.x = 0;
      }
    }

    return true;
  };

  const scratch = new THREE.Vector3();
  const getSocketWorldPosition = (name: string, target: THREE.Vector3): THREE.Vector3 => {
    const socket = sockets[name];
    if (!socket?.anchor) return target.set(0, 0, 0);
    socket.anchor.getWorldPosition(scratch);
    return target.copy(scratch);
  };

  const setFaceTexture = (tex: THREE.Texture | null) => {
    oledMat.map = tex;
    oledMat.color.set(tex ? '#ffffff' : '#030712');
    oledMat.needsUpdate = true;
  };

  const dispose = () => {
    geometries.forEach((g) => g.dispose());
    oledMat.dispose();
  };

  return {
    group,
    sockets,
    colliders,
    animate,
    setFaceTexture,
    getSocketWorldPosition,
    dispose,
  };
}
