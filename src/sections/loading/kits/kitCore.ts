import * as THREE from 'three';

export interface SocketDescriptor {
  name: string;
  position_m: [number, number, number];
  normal: [number, number, number];
  anchor?: THREE.Object3D;
}

export interface ColliderDescriptor {
  name: string;
  centre_m: [number, number, number];
  size_m: [number, number, number];
}

export interface KitInstance<TState = unknown> {
  group: THREE.Group;
  sockets: Record<string, SocketDescriptor>;
  colliders: ColliderDescriptor[];
  animate?: (dt: number, state: TState) => boolean;
  dispose: () => void;
}

export interface MaterialOptions {
  roughness?: number;
  metalness?: number;
  emissive?: string | number | null;
  emissiveIntensity?: number;
  map?: THREE.Texture | null;
  normalMap?: THREE.Texture | null;
  roughnessMap?: THREE.Texture | null;
  flatShading?: boolean;
  transparent?: boolean;
  opacity?: number;
}

const materialCache = new Map<string, THREE.MeshStandardMaterial>();

/**
 * Cached MeshStandardMaterial matching 3dviz-pro-max kit-core pattern.
 * Materials carrying custom texture maps bypass the shared cache so they can be disposed cleanly.
 */
export function materialFor(
  color: string | number,
  {
    roughness = 0.65,
    metalness = 0,
    emissive = null,
    emissiveIntensity = 0,
    map = null,
    normalMap = null,
    roughnessMap = null,
    flatShading = false,
    transparent = false,
    opacity = 1,
  }: MaterialOptions = {}
): THREE.MeshStandardMaterial {
  const options: THREE.MeshStandardMaterialParameters = {
    color,
    roughness,
    metalness,
    flatShading,
    transparent,
    opacity,
  };
  if (emissive !== null) {
    options.emissive = emissive;
    options.emissiveIntensity = emissiveIntensity;
  }
  if (map || normalMap || roughnessMap) {
    if (map) options.map = map;
    if (normalMap) options.normalMap = normalMap;
    if (roughnessMap) options.roughnessMap = roughnessMap;
    return new THREE.MeshStandardMaterial(options);
  }

  const key = JSON.stringify([
    color,
    roughness,
    metalness,
    emissive,
    emissiveIntensity,
    flatShading,
    transparent,
    opacity,
  ]);
  if (!materialCache.has(key)) {
    materialCache.set(key, new THREE.MeshStandardMaterial(options));
  }
  return materialCache.get(key)!;
}

/**
 * Box with real chamfered bevel geometry (extruded along +Z and re-centred on origin).
 */
export function bevelledBox({
  width,
  height,
  depth,
  bevel = 0.03,
  segments = 2,
}: {
  width: number;
  height: number;
  depth: number;
  bevel?: number;
  segments?: number;
}): THREE.ExtrudeGeometry {
  const b = Math.max(0.001, Math.min(bevel, width / 2.05, height / 2.05, depth / 2.05));
  const w = width / 2 - b;
  const h = height / 2 - b;

  const shape = new THREE.Shape();
  shape.moveTo(-w, -h);
  shape.lineTo(w, -h);
  shape.lineTo(w, h);
  shape.lineTo(-w, h);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.002, depth - 2 * b),
    bevelEnabled: true,
    bevelThickness: b,
    bevelSize: b,
    bevelOffset: 0,
    bevelSegments: segments,
    curveSegments: 1,
    steps: 1,
  });
  geometry.translate(0, 0, -(depth / 2 - b));
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Creates a shadowed THREE.Mesh positioned and rotated in local kit space.
 */
export function part(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position: [number, number, number] = [0, 0, 0],
  rotation: [number, number, number] = [0, 0, 0]
): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Registers a named local-space socket descriptor and attaches an Object3D anchor to parent.
 */
export function createSocket(
  parent: THREE.Object3D,
  name: string,
  position_m: [number, number, number],
  normal: [number, number, number] = [0, 1, 0]
): SocketDescriptor {
  const anchor = new THREE.Object3D();
  anchor.name = `socket_${name}`;
  anchor.position.set(...position_m);
  parent.add(anchor);
  return { name, position_m, normal, anchor };
}

/**
 * Attaches a child Object3D to a named socket on a kit instance.
 */
export function attachToSocket(
  sockets: Record<string, SocketDescriptor>,
  name: string,
  child: THREE.Object3D
): boolean {
  const socket = sockets[name];
  if (!socket?.anchor) return false;
  socket.anchor.add(child);
  return true;
}

/**
 * Generates procedural diagonal-weave braided cable textures (albedo + roughness/bump)
 * so the tow cable reads as a tactile multi-strand synthetic/steel line under studio light.
 */
export function createBraidedCableTextures(): {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  dispose: () => void;
} {
  const width = 256;
  const height = 256;

  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = width;
  albedoCanvas.height = height;
  const aCtx = albedoCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = width;
  roughCanvas.height = height;
  const rCtx = roughCanvas.getContext('2d')!;

  aCtx.fillStyle = '#141821';
  aCtx.fillRect(0, 0, width, height);

  rCtx.fillStyle = '#a8a8a8';
  rCtx.fillRect(0, 0, width, height);

  // Interlocking diagonal braided strands
  const strandCount = 12;
  const step = width / strandCount;
  for (let i = -strandCount; i < strandCount * 2; i++) {
    const x0 = i * step;

    // Primary dark graphite strand
    aCtx.strokeStyle = i % 2 === 0 ? '#1e293b' : '#0f172a';
    aCtx.lineWidth = step * 0.48;
    aCtx.beginPath();
    aCtx.moveTo(x0, 0);
    aCtx.lineTo(x0 + width, height);
    aCtx.stroke();

    // Specular ridge in roughness map
    rCtx.strokeStyle = i % 2 === 0 ? '#686868' : '#b8b8b8';
    rCtx.lineWidth = step * 0.42;
    rCtx.beginPath();
    rCtx.moveTo(x0, 0);
    rCtx.lineTo(x0 + width, height);
    rCtx.stroke();

    // Cross-weave cobalt/slate tracer strand
    aCtx.strokeStyle = i % 4 === 0 ? '#0369a1' : '#273244';
    aCtx.lineWidth = step * 0.34;
    aCtx.beginPath();
    aCtx.moveTo(x0 + width, 0);
    aCtx.lineTo(x0, height);
    aCtx.stroke();

    rCtx.strokeStyle = i % 4 === 0 ? '#505050' : '#969696';
    rCtx.lineWidth = step * 0.32;
    rCtx.beginPath();
    rCtx.moveTo(x0 + width, 0);
    rCtx.lineTo(x0, height);
    rCtx.stroke();
  }

  const map = new THREE.CanvasTexture(albedoCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(14, 2);
  map.colorSpace = THREE.SRGBColorSpace;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(14, 2);

  return {
    map,
    roughnessMap,
    dispose: () => {
      map.dispose();
      roughnessMap.dispose();
    },
  };
}
