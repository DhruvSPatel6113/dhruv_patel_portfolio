import * as THREE from 'three';
import {
  KitInstance,
  SocketDescriptor,
  ColliderDescriptor,
  materialFor,
  bevelledBox,
  part,
  createSocket,
  createBraidedCableTextures,
} from './kitCore';
import { LoaderStage } from './beepRobotKit';

export interface TowCableAnimState {
  stage: LoaderStage;
  progress: number;
  elapsed: number;
  floorY: number;
  anchorX: number;
  anchorY: number;
  gripWorldPos: THREE.Vector3;
}

export interface TowCableKit extends KitInstance<TowCableAnimState> {
  badgePosition: THREE.Vector3;
  resetVerlet: (anchorX: number, anchorY: number, gripPos: THREE.Vector3) => void;
}

const NODE_COUNT = 14;
const TUBE_SEGMENTS = 36;
const RADIAL_SEGMENTS = 10;
const CABLE_RADIUS = 0.036;

/**
 * 3dviz-pro-max Tow Cable & Pulley Winch Kit
 * - Pre-allocated tubular BufferGeometry updated in-place (zero per-frame allocations)
 * - Diagonal-weave braided synthetic/steel cable texture
 * - Wall-mounted pulley sheave + metallic shackle
 * - Dual-mode solver: tensioned catenary while pulling -> 14-node Verlet whip & floor settle on snap
 */
export function createTowCableAssembly({
  anchorX,
  anchorY,
}: {
  anchorX: number;
  anchorY: number;
}): TowCableKit {
  const group = new THREE.Group();
  group.name = 'tow_cable_assembly';

  const geometries: THREE.BufferGeometry[] = [];
  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };

  const steelMat = materialFor('#94a3b8', { roughness: 0.25, metalness: 0.85 });
  const darkSteelMat = materialFor('#1e293b', { roughness: 0.35, metalness: 0.78 });
  const accentMat = materialFor('#0284c7', { roughness: 0.3, metalness: 0.4 });

  const cableTextures = createBraidedCableTextures();
  const cableMat = materialFor('#ffffff', {
    roughness: 0.62,
    metalness: 0.22,
    map: cableTextures.map,
    roughnessMap: cableTextures.roughnessMap,
  });

  // ==========================================================================
  // 1. WALL-MOUNTED FAIRLEAD BRACKET & ROTATING PULLEY SHEAVE
  // ==========================================================================
  const winchGroup = new THREE.Group();
  winchGroup.position.set(anchorX, anchorY, 0);
  group.add(winchGroup);

  const bracketGeo = trackGeo(bevelledBox({ width: 0.16, height: 0.26, depth: 0.14, bevel: 0.02, segments: 2 }));
  const sheaveGeo = trackGeo(new THREE.CylinderGeometry(0.082, 0.082, 0.055, 24));
  const sheaveRimGeo = trackGeo(new THREE.TorusGeometry(0.082, 0.014, 10, 24));
  const axlePinGeo = trackGeo(new THREE.CylinderGeometry(0.024, 0.024, 0.16, 12));

  winchGroup.add(part(bracketGeo, darkSteelMat, [-0.04, 0, 0]));
  const pulleyWheel = new THREE.Group();
  pulleyWheel.position.set(0.04, 0, 0);
  pulleyWheel.add(part(sheaveGeo, steelMat, [0, 0, 0], [Math.PI / 2, 0, 0]));
  pulleyWheel.add(part(sheaveRimGeo, accentMat, [0, 0, 0]));
  winchGroup.add(pulleyWheel);
  winchGroup.add(part(axlePinGeo, steelMat, [0.04, 0, 0], [Math.PI / 2, 0, 0]));

  const sockets: Record<string, SocketDescriptor> = {
    anchorExit: createSocket(winchGroup, 'anchorExit', [0.07, 0, 0], [1, 0, 0]),
  };

  // ==========================================================================
  // 2. METALLIC CARABINER / SHACKLE AT CABLE TIP
  // ==========================================================================
  const shackleGroup = new THREE.Group();
  const shackleLoopGeo = trackGeo(new THREE.TorusGeometry(0.052, 0.013, 10, 18));
  const shackleCollarGeo = trackGeo(new THREE.CylinderGeometry(0.044, 0.044, 0.06, 14));
  shackleGroup.add(part(shackleLoopGeo, steelMat));
  shackleGroup.add(part(shackleCollarGeo, accentMat, [-0.045, 0, 0], [0, 0, Math.PI / 2]));
  group.add(shackleGroup);
  sockets.cableTip = createSocket(shackleGroup, 'cableTip', [0, 0, 0], [1, 0, 0]);

  // ==========================================================================
  // 3. PRE-ALLOCATED BRAIDED CABLE BUFFER GEOMETRY (ZERO GC ALLOCATION)
  // ==========================================================================
  const ringVerts = RADIAL_SEGMENTS + 1;
  const vertCount = (TUBE_SEGMENTS + 1) * ringVerts;
  const positions = new Float32Array(vertCount * 3);
  const normals = new Float32Array(vertCount * 3);
  const uvs = new Float32Array(vertCount * 2);
  const indices: number[] = [];

  for (let i = 0; i <= TUBE_SEGMENTS; i++) {
    const u = i / TUBE_SEGMENTS;
    for (let j = 0; j <= RADIAL_SEGMENTS; j++) {
      const v = j / RADIAL_SEGMENTS;
      const idx = i * ringVerts + j;
      uvs[idx * 2] = u;
      uvs[idx * 2 + 1] = v;
    }
  }

  for (let i = 0; i < TUBE_SEGMENTS; i++) {
    for (let j = 0; j < RADIAL_SEGMENTS; j++) {
      const a = i * ringVerts + j;
      const b = (i + 1) * ringVerts + j;
      const c = (i + 1) * ringVerts + (j + 1);
      const d = i * ringVerts + (j + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const cableGeo = trackGeo(new THREE.BufferGeometry());
  cableGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  cableGeo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  cableGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  cableGeo.setIndex(indices);

  const cableMesh = new THREE.Mesh(cableGeo, cableMat);
  cableMesh.castShadow = true;
  cableMesh.receiveShadow = true;
  cableMesh.frustumCulled = false;
  group.add(cableMesh);

  // ==========================================================================
  // 4. VERLET PHYSICS STATE & SCRATCH VECTORS
  // ==========================================================================
  const nodes: THREE.Vector3[] = Array.from({ length: NODE_COUNT }, () => new THREE.Vector3());
  const prevNodes: THREE.Vector3[] = Array.from({ length: NODE_COUNT }, () => new THREE.Vector3());
  let segmentRestLength = 0.25;
  let wasPulling = true;

  const badgePosition = new THREE.Vector3(anchorX * 0.5, anchorY + 0.2, 0.1);

  const curve = new THREE.CatmullRomCurve3(nodes);
  const sampledPos = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const normalVec = new THREE.Vector3();
  const binormal = new THREE.Vector3();
  const upRef = new THREE.Vector3(0, 0, 1);
  const altUp = new THREE.Vector3(0, 1, 0);

  const updateTubeFromNodes = () => {
    for (let i = 0; i <= TUBE_SEGMENTS; i++) {
      const t = i / TUBE_SEGMENTS;
      curve.getPoint(t, sampledPos);
      curve.getTangent(t, tangent).normalize();

      const ref = Math.abs(tangent.dot(upRef)) > 0.92 ? altUp : upRef;
      binormal.crossVectors(tangent, ref).normalize();
      normalVec.crossVectors(binormal, tangent).normalize();

      for (let j = 0; j <= RADIAL_SEGMENTS; j++) {
        const theta = (j / RADIAL_SEGMENTS) * Math.PI * 2;
        const cos = Math.cos(theta);
        const sin = Math.sin(theta);

        const nx = normalVec.x * cos + binormal.x * sin;
        const ny = normalVec.y * cos + binormal.y * sin;
        const nz = normalVec.z * cos + binormal.z * sin;

        const idx = (i * ringVerts + j) * 3;
        positions[idx] = sampledPos.x + CABLE_RADIUS * nx;
        positions[idx + 1] = sampledPos.y + CABLE_RADIUS * ny;
        positions[idx + 2] = sampledPos.z + CABLE_RADIUS * nz;

        normals[idx] = nx;
        normals[idx + 1] = ny;
        normals[idx + 2] = nz;
      }
    }
    cableGeo.attributes.position.needsUpdate = true;
    cableGeo.attributes.normal.needsUpdate = true;
  };

  const resetVerlet = (ax: number, ay: number, gripPos: THREE.Vector3) => {
    for (let i = 0; i < NODE_COUNT; i++) {
      const alpha = i / (NODE_COUNT - 1);
      nodes[i].lerpVectors(new THREE.Vector3(ax, ay, 0), gripPos, alpha);
      prevNodes[i].copy(nodes[i]);
    }
    wasPulling = true;
  };

  const animate = (dt: number, state: TowCableAnimState): boolean => {
    if (dt <= 0) return false;
    const clampedDt = Math.min(dt, 0.033);
    const { stage, progress, elapsed, floorY, anchorX: ax, anchorY: ay, gripWorldPos } = state;

    winchGroup.position.set(ax, ay, 0);
    const exitX = ax + 0.07;
    const exitY = ay;

    if (stage === 'pulling') {
      wasPulling = true;
      const tension = progress / 100;
      const naturalSag = 0.11 * (1 - tension * 0.78);
      const strainAmp = tension > 0.6 ? 0.012 * ((tension - 0.6) / 0.4) : 0;

      for (let i = 0; i < NODE_COUNT; i++) {
        const alpha = i / (NODE_COUNT - 1);
        const sagWeight = Math.sin(alpha * Math.PI);
        const vibe = Math.sin(elapsed * 48 + alpha * 6) * strainAmp * sagWeight;

        nodes[i].set(
          THREE.MathUtils.lerp(exitX, gripWorldPos.x, alpha),
          THREE.MathUtils.lerp(exitY, gripWorldPos.y, alpha) - naturalSag * sagWeight + vibe,
          THREE.MathUtils.lerp(0, gripWorldPos.z, alpha)
        );
        prevNodes[i].copy(nodes[i]);
      }

      const totalDist = nodes[0].distanceTo(nodes[NODE_COUNT - 1]);
      segmentRestLength = Math.max(0.08, totalDist / (NODE_COUNT - 1));

      // Rotate pulley wheel proportionally to pay-out
      pulleyWheel.rotation.z = -tension * Math.PI * 5;

      // Lock shackle to robot's ropeGrip socket
      shackleGroup.visible = true;
      shackleGroup.position.copy(gripWorldPos);
      const dir = new THREE.Vector3().subVectors(gripWorldPos, nodes[NODE_COUNT - 2]).normalize();
      shackleGroup.rotation.z = Math.atan2(dir.y, dir.x);

      // Midpoint badge position tracks cable tangent
      const badgeAlpha = 0.28 + tension * 0.62;
      const badgeSag = Math.sin(badgeAlpha * Math.PI) * naturalSag;
      badgePosition.set(
        THREE.MathUtils.lerp(exitX, gripWorldPos.x, badgeAlpha),
        THREE.MathUtils.lerp(exitY, gripWorldPos.y, badgeAlpha) - badgeSag + 0.22,
        gripWorldPos.z * badgeAlpha + 0.1
      );
    } else {
      // Snap transition impulse: whip tip nodes toward left winch
      if (wasPulling) {
        wasPulling = false;
        for (let i = Math.floor(NODE_COUNT * 0.5); i < NODE_COUNT; i++) {
          prevNodes[i].x += 0.09;
          prevNodes[i].y -= 0.04;
        }
      }

      // Verlet integration + gravity + floor contact
      const gravity = -22.0;
      const damping = 0.965;
      const floorClamp = floorY + CABLE_RADIUS;

      for (let i = 1; i < NODE_COUNT; i++) {
        const cur = nodes[i];
        const prev = prevNodes[i];
        const vx = (cur.x - prev.x) * damping;
        const vy = (cur.y - prev.y) * damping;
        const vz = (cur.z - prev.z) * damping;

        prev.copy(cur);
        cur.x += vx;
        cur.y += vy + gravity * clampedDt * clampedDt;
        cur.z += vz;

        if (cur.y <= floorClamp) {
          cur.y = floorClamp;
          // Ground friction
          prev.x = THREE.MathUtils.lerp(prev.x, cur.x, 0.28);
          prev.z = THREE.MathUtils.lerp(prev.z, cur.z, 0.28);
        }
      }

      // Pin node 0 at winch exit & relax distance constraints
      const relaxIters = 4;
      for (let iter = 0; iter < relaxIters; iter++) {
        nodes[0].set(exitX, exitY, 0);
        for (let i = 0; i < NODE_COUNT - 1; i++) {
          const a = nodes[i];
          const b = nodes[i + 1];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dz = b.z - a.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.0001;
          const diff = (dist - segmentRestLength) / dist;

          if (i === 0) {
            b.x -= dx * diff;
            b.y -= dy * diff;
            b.z -= dz * diff;
          } else {
            a.x += dx * diff * 0.5;
            a.y += dy * diff * 0.5;
            a.z += dz * diff * 0.5;
            b.x -= dx * diff * 0.5;
            b.y -= dy * diff * 0.5;
            b.z -= dz * diff * 0.5;
          }
          if (b.y < floorClamp) b.y = floorClamp;
        }
      }

      // Shackle rides tip node onto the floor
      const tip = nodes[NODE_COUNT - 1];
      shackleGroup.position.copy(tip);
      const tipDir = new THREE.Vector3().subVectors(tip, nodes[NODE_COUNT - 2]).normalize();
      shackleGroup.rotation.z = Math.atan2(tipDir.y, tipDir.x);
    }

    updateTubeFromNodes();
    return true;
  };

  const colliders: ColliderDescriptor[] = [
    { name: 'winchAnchor', centre_m: [anchorX, anchorY, 0], size_m: [0.22, 0.28, 0.18] },
  ];

  const dispose = () => {
    geometries.forEach((g) => g.dispose());
    cableTextures.dispose();
    cableMat.dispose();
  };

  return {
    group,
    sockets,
    colliders,
    badgePosition,
    resetVerlet,
    animate,
    dispose,
  };
}
