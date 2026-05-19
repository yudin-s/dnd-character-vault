"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const FLOOR_Y = -0.62;
const ARENA_X = 2.28;
const ARENA_Z = 1.2;
const ARENA_TOP = 1.68;
const ORTHO_VIEW_HEIGHT = 2.92;
const SINGLE_DIE_SCALE = 0.82;
const GRAVITY = 14;
const FRICTION_AIR = 0.994;
const FRICTION_FLOOR = 0.82;
const BOUNCE_DAMPING = 0.36;
const SPIN_DAMPING = 0.972;
const STOP_LINEAR_SPEED_SQ = 0.00018;
const STOP_SPIN_SPEED_SQ = 0.00018;
const MIN_ROLL_DURATION_MS = 540;
const MAX_ROLL_DURATION_MS = 2200;
const LANDING_BLEND_MS = 160;
const RESULT_FACE_CONFIDENCE = 0.82;
const OUTWARD_Z = new THREE.Vector3(0, 0, 1);
const TARGET_FACE_NORMAL = new THREE.Vector3(0, 1, 0);
const BOTTOM_FACE_NORMAL = new THREE.Vector3(0, -1, 0);
const DICE_PALETTES = {
  4: { base: "#1f8f64", highlight: "#8af7be", shadow: "#0a3b31", emissive: "#29d184", edge: "#c8ffd8", glow: "#5dffb4" },
  6: { base: "#218da0", highlight: "#89f0ff", shadow: "#08334b", emissive: "#24cde2", edge: "#d5fbff", glow: "#51e9ff" },
  8: { base: "#7d42d7", highlight: "#dfb5ff", shadow: "#2e174f", emissive: "#9d5cff", edge: "#f1d9ff", glow: "#b36cff" },
  10: { base: "#b73887", highlight: "#ffc1e8", shadow: "#4d1238", emissive: "#ff66bd", edge: "#ffe1f2", glow: "#ff7ac8" },
  12: { base: "#b7353b", highlight: "#ffb28f", shadow: "#4b1418", emissive: "#ff5949", edge: "#ffd9c5", glow: "#ff7561" },
  20: { base: "#d79a24", highlight: "#fff08d", shadow: "#5b2b0d", emissive: "#f3b331", edge: "#fff0b8", glow: "#ffd35b" }
};

function canvasRgba(hex, alpha) {
  const color = new THREE.Color(hex);
  return `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${alpha})`;
}

function dieScale(total) {
  if (total <= 1) return SINGLE_DIE_SCALE;
  if (total <= 3) return 0.6;
  return 0.42;
}

function dieRadius(total) {
  return Math.max(0.34, dieScale(total) * 0.76);
}

function launchLane(index, total) {
  if (total <= 1) return 0;
  return (index - (total - 1) / 2) / ((total - 1) / 2);
}

function launchPosition(index, total, radius) {
  const lane = launchLane(index, total);
  const spread = total <= 3 ? 0.82 : 1.38;
  return new THREE.Vector3(
    lane * spread + (Math.random() - 0.5) * 0.42,
    1.08 + Math.random() * 0.48,
    -ARENA_Z + radius + 0.12 + Math.random() * 0.52
  );
}

function launchVelocity(index, total) {
  const lane = launchLane(index, total);
  const horizontal = total <= 3 ? 2.8 : 2.1;
  const lift = total <= 1 ? 3.25 : total <= 3 ? 2.85 : 2.05;
  const liftRange = total <= 3 ? 1.25 : 0.9;
  return new THREE.Vector3(
    -lane * 0.28 + (Math.random() - 0.5) * horizontal,
    lift + Math.random() * liftRange,
    1.15 + Math.random() * (total <= 3 ? 2.45 : 2.15)
  );
}

function paletteForSides(sides) {
  return DICE_PALETTES[sides] || DICE_PALETTES[20];
}

function shadeFace(base, highlight, shadow, normal, faceIndex) {
  const lit = Math.max(0, normal.y * 0.45 + normal.z * 0.35 + 0.32);
  const shimmer = ((faceIndex * 37) % 11) / 50;
  return base.clone()
    .lerp(shadow, Math.max(0, 0.2 - lit) + 0.1)
    .lerp(highlight, Math.min(0.58, lit * 0.42 + shimmer));
}

function colorizeFacets(geometry, palette) {
  const working = geometry.toNonIndexed();
  const positions = working.getAttribute("position");
  const colors = [];
  const base = new THREE.Color(palette.base);
  const highlight = new THREE.Color(palette.highlight);
  const shadow = new THREE.Color(palette.shadow);
  const pointA = new THREE.Vector3();
  const pointB = new THREE.Vector3();
  const pointC = new THREE.Vector3();
  const normal = new THREE.Vector3();

  for (let index = 0; index < positions.count; index += 3) {
    pointA.fromBufferAttribute(positions, index);
    pointB.fromBufferAttribute(positions, index + 1);
    pointC.fromBufferAttribute(positions, index + 2);
    normal.copy(pointB).sub(pointA).cross(pointC.clone().sub(pointA)).normalize();
    const color = shadeFace(base, highlight, shadow, normal, index / 3);
    for (let vertex = 0; vertex < 3; vertex += 1) {
      colors.push(color.r, color.g, color.b);
    }
  }

  working.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  working.computeVertexNormals();
  return working;
}

function prepareGeometry(sides, palette) {
  const geometry = createGeometry(sides);
  if (sides === 12) return geometry;
  return colorizeFacets(geometry, palette);
}

function createFeltTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  const base = context.createLinearGradient(0, 0, 512, 512);
  base.addColorStop(0, "#244f38");
  base.addColorStop(0.46, "#173829");
  base.addColorStop(1, "#5b1725");
  context.fillStyle = base;
  context.fillRect(0, 0, 512, 512);

  const image = context.getImageData(0, 0, 512, 512);
  for (let index = 0; index < image.data.length; index += 4) {
    const grain = (Math.random() - 0.5) * 26;
    image.data[index] = Math.max(0, Math.min(255, image.data[index] + grain * 0.6));
    image.data[index + 1] = Math.max(0, Math.min(255, image.data[index + 1] + grain));
    image.data[index + 2] = Math.max(0, Math.min(255, image.data[index + 2] + grain * 0.72));
  }
  context.putImageData(image, 0, 0);

  context.globalAlpha = 0.12;
  context.strokeStyle = "#fff8e8";
  for (let row = -512; row < 512; row += 14) {
    context.beginPath();
    context.moveTo(0, row);
    context.lineTo(512, row + 512);
    context.stroke();
  }
  context.globalAlpha = 0.16;
  context.strokeStyle = "#081b13";
  for (let row = 0; row < 1024; row += 18) {
    context.beginPath();
    context.moveTo(0, row);
    context.lineTo(512, row - 512);
    context.stroke();
  }
  context.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.needsUpdate = true;
  return texture;
}

function createTrayGuide() {
  const ring = new THREE.Group();
  const material = new THREE.LineBasicMaterial({
    color: "#d6a832",
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending
  });
  const makeLoop = (x, z) => {
    const points = [
      new THREE.Vector3(-x, FLOOR_Y + 0.018, -z),
      new THREE.Vector3(x, FLOOR_Y + 0.018, -z),
      new THREE.Vector3(x, FLOOR_Y + 0.018, z),
      new THREE.Vector3(-x, FLOOR_Y + 0.018, z),
      new THREE.Vector3(-x, FLOOR_Y + 0.018, -z)
    ];
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material.clone());
  };
  ring.add(makeLoop(1.62, 0.72));
  const inner = makeLoop(0.82, 0.36);
  inner.material.color = new THREE.Color("#9d5cff");
  inner.material.opacity = 0.12;
  ring.add(inner);
  return ring;
}

function createDiceTray() {
  const group = new THREE.Group();
  const felt = new THREE.Mesh(
    new THREE.PlaneGeometry(ARENA_X * 2 + 0.38, ARENA_Z * 2 + 0.34),
    new THREE.MeshStandardMaterial({
      color: "#ffffff",
      map: createFeltTexture(),
      roughness: 0.97,
      metalness: 0.02,
      emissive: new THREE.Color("#123122"),
      emissiveIntensity: 0.14
    })
  );
  felt.rotation.x = -Math.PI / 2;
  felt.position.y = FLOOR_Y;
  felt.receiveShadow = true;

  const railMaterial = new THREE.MeshStandardMaterial({
    color: "#241711",
    roughness: 0.88,
    metalness: 0.08,
    emissive: new THREE.Color("#150b08"),
    emissiveIntensity: 0.18
  });
  const railHeight = 0.34;
  const railWidth = 0.16;
  const railY = FLOOR_Y + railHeight / 2;
  const horizontalRail = new THREE.BoxGeometry(ARENA_X * 2 + railWidth * 2, railHeight, railWidth);
  const verticalRail = new THREE.BoxGeometry(railWidth, railHeight, ARENA_Z * 2);
  const rails = [
    new THREE.Mesh(horizontalRail, railMaterial),
    new THREE.Mesh(horizontalRail.clone(), railMaterial.clone()),
    new THREE.Mesh(verticalRail, railMaterial.clone()),
    new THREE.Mesh(verticalRail.clone(), railMaterial.clone())
  ];
  rails[0].position.set(0, railY, -ARENA_Z - railWidth / 2);
  rails[1].position.set(0, railY, ARENA_Z + railWidth / 2);
  rails[2].position.set(-ARENA_X - railWidth / 2, railY, 0);
  rails[3].position.set(ARENA_X + railWidth / 2, railY, 0);
  rails.forEach((rail) => {
    rail.castShadow = true;
    rail.receiveShadow = true;
    group.add(rail);
  });

  group.add(felt, createTrayGuide());
  return group;
}

function createD10Geometry() {
  const vertices = [[0, 0.9, 0], [0, -0.9, 0]];
  for (let index = 0; index < 10; index += 1) {
    const angle = (index / 10) * Math.PI * 2;
    const radius = index % 2 ? 0.82 : 1.02;
    vertices.push([Math.cos(angle) * radius, 0, Math.sin(angle) * radius]);
  }

  const indices = [];
  for (let index = 0; index < 10; index += 1) {
    const current = 2 + index;
    const next = 2 + ((index + 1) % 10);
    indices.push(0, current, next);
    indices.push(1, next, current);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices.flat(), 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createOctahedronGeometry() {
  const vertices = [
    [1.06, 0, 0], [-1.06, 0, 0], [0, 1.06, 0],
    [0, -1.06, 0], [0, 0, 1.06], [0, 0, -1.06]
  ];
  const faces = [
    [2, 0, 4], [2, 4, 1], [2, 1, 5], [2, 5, 0],
    [3, 4, 0], [3, 1, 4], [3, 5, 1], [3, 0, 5]
  ];

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices.flat(), 3));
  geometry.setIndex(faces.flat());
  geometry.computeVertexNormals();
  return geometry;
}

function createIcosahedronGeometry() {
  const phi = (1 + Math.sqrt(5)) / 2;
  const normalizer = 1 / Math.sqrt(1 + phi * phi);
  const vertices = [
    [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
    [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
    [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
  ].map(([x, y, z]) => [x * normalizer, y * normalizer, z * normalizer]);
  const faces = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
  ];

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices.flat(), 3));
  geometry.setIndex(faces.flat());
  geometry.computeVertexNormals();
  return geometry;
}

function createGeometry(sides) {
  if (sides === 4) return new THREE.TetrahedronGeometry(1.06, 0);
  if (sides === 6) return new THREE.BoxGeometry(1.28, 1.28, 1.28);
  if (sides === 8) return createOctahedronGeometry();
  if (sides === 10) return createD10Geometry();
  if (sides === 12) return new THREE.DodecahedronGeometry(1, 0);
  if (sides === 20) return createIcosahedronGeometry();
  return createIcosahedronGeometry();
}

function numberTexture(value, emphasis = false, palette = DICE_PALETTES[20]) {
  const canvas = document.createElement("canvas");
  canvas.width = 384;
  canvas.height = 384;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.lineJoin = "round";
  context.miterLimit = 2;

  const text = String(value);
  const x = 192;
  const y = 202;
  const glow = palette.glow || DICE_PALETTES[20].glow;
  const edge = palette.edge || DICE_PALETTES[20].edge;
  const fill = context.createLinearGradient(0, 82, 0, 268);
  fill.addColorStop(0, "#fffdf2");
  fill.addColorStop(0.54, edge);
  fill.addColorStop(1, glow);

  context.font = `900 ${emphasis ? 204 : 178}px ui-sans-serif, system-ui, sans-serif`;
  context.shadowColor = canvasRgba(glow, emphasis ? 0.92 : 0.86);
  context.shadowBlur = emphasis ? 44 : 34;
  context.lineWidth = emphasis ? 44 : 34;
  context.strokeStyle = canvasRgba(glow, emphasis ? 0.46 : 0.5);
  context.strokeText(text, x, y);
  context.strokeText(text, x, y);

  context.shadowBlur = 0;
  context.lineWidth = emphasis ? 34 : 28;
  context.strokeStyle = "rgba(13, 6, 18, 0.98)";
  context.strokeText(text, x, y);

  context.shadowColor = canvasRgba(glow, emphasis ? 0.95 : 0.9);
  context.shadowBlur = emphasis ? 18 : 14;
  context.lineWidth = emphasis ? 13 : 11;
  context.strokeStyle = canvasRgba(glow, emphasis ? 0.95 : 0.84);
  context.strokeText(text, x, y);

  context.shadowColor = canvasRgba(glow, emphasis ? 0.74 : 0.62);
  context.shadowBlur = emphasis ? 12 : 8;
  context.fillStyle = fill;
  context.fillText(text, x, y);

  context.shadowBlur = 0;
  context.lineWidth = emphasis ? 3 : 2.4;
  context.strokeStyle = canvasRgba("#fffef7", emphasis ? 0.92 : 0.8);
  context.strokeText(text, x, y);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function faceSpecsFromTriangles(geometry) {
  const specs = [];
  const positions = geometry.getAttribute("position");
  const index = geometry.index;
  const pointA = new THREE.Vector3();
  const pointB = new THREE.Vector3();
  const pointC = new THREE.Vector3();
  const center = new THREE.Vector3();
  const normal = new THREE.Vector3();

  const readPoint = (vertexIndex, target) => target.fromBufferAttribute(positions, vertexIndex);
  const triangleCount = index ? index.count / 3 : positions.count / 3;

  for (let faceIndex = 0; faceIndex < triangleCount; faceIndex += 1) {
    const a = index ? index.getX(faceIndex * 3) : faceIndex * 3;
    const b = index ? index.getX(faceIndex * 3 + 1) : faceIndex * 3 + 1;
    const c = index ? index.getX(faceIndex * 3 + 2) : faceIndex * 3 + 2;
    readPoint(a, pointA);
    readPoint(b, pointB);
    readPoint(c, pointC);
    center.copy(pointA).add(pointB).add(pointC).multiplyScalar(1 / 3);
    normal.copy(pointB).sub(pointA).cross(pointC.clone().sub(pointA)).normalize();
    if (normal.dot(center) < 0) normal.negate();
    const distance = Math.max(0.01, center.dot(normal));
    const existing = specs.find((spec) => spec.normal.dot(normal) > 0.995 && Math.abs(spec.distance - distance) < 0.04);
    if (existing) {
      existing.center.add(center);
      existing.count += 1;
    } else {
      specs.push({
        normal: normal.clone(),
        distance,
        center: center.clone(),
        count: 1
      });
    }
  }

  return specs.map((spec) => ({
    normal: spec.normal,
    distance: spec.center.multiplyScalar(1 / spec.count).dot(spec.normal)
  })).sort((left, right) => {
    if (Math.abs(right.normal.y - left.normal.y) > 0.01) return right.normal.y - left.normal.y;
    return Math.atan2(left.normal.z, left.normal.x) - Math.atan2(right.normal.z, right.normal.x);
  });
}

function cubeFaceSpecs() {
  return [
    [0, 1, 0], [0, 0, 1], [1, 0, 0], [-1, 0, 0], [0, 0, -1], [0, -1, 0]
  ].map(([x, y, z]) => ({ normal: new THREE.Vector3(x, y, z), distance: 0.65 }));
}

function d10FaceSpecs() {
  return Array.from({ length: 10 }, (_, index) => {
    const angle = (-Math.PI / 2) + (index / 10) * Math.PI * 2;
    return {
      normal: new THREE.Vector3(Math.cos(angle), index % 2 ? -0.16 : 0.16, Math.sin(angle)).normalize(),
      distance: 0.78
    };
  });
}

function faceSpecs(sides, geometry) {
  if (sides === 6) return cubeFaceSpecs();
  if (sides === 10) return d10FaceSpecs();
  return faceSpecsFromTriangles(geometry);
}

function labelSize(sides, emphasis = false) {
  const base = (() => {
    if (sides === 4) return 0.34;
    if (sides === 6) return 0.46;
    if (sides === 8) return 0.4;
    if (sides === 10) return 0.32;
    if (sides === 12) return 0.36;
    return 0.34;
  })();
  return emphasis ? base * 1.72 : base;
}

function createFaceLabel(value, sides, spec, palette, emphasis = false) {
  const size = labelSize(sides, emphasis);
  const texture = numberTexture(value, emphasis, palette);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: emphasis ? 1 : 0.98,
    depthWrite: false,
    toneMapped: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4
  });
  const label = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  label.scale.set(size, size, size);
  label.position.copy(spec.normal).multiplyScalar(spec.distance + (emphasis ? 0.026 : 0.022));
  label.quaternion.setFromUnitVectors(OUTWARD_Z, spec.normal);
  label.renderOrder = emphasis ? 10 : 8;
  label.userData.diceLabel = {
    value,
    sides,
    faceIndex: value - 1,
    normal: spec.normal.clone(),
    distance: spec.distance,
    palette: { edge: palette.edge, glow: palette.glow },
    emphasis
  };
  return label;
}

function updateFaceLabel(label, value, emphasis) {
  const data = label.userData.diceLabel;
  if (!data) return;
  const nextValue = Number(value) || data.value;
  const changed = data.emphasis !== emphasis || data.value !== nextValue;
  if (!changed) return;
  data.value = nextValue;
  data.emphasis = emphasis;
  label.material.map?.dispose?.();
  label.material.map = numberTexture(data.value, emphasis, data.palette);
  label.material.opacity = emphasis ? 1 : 0.98;
  label.material.needsUpdate = true;
  const size = labelSize(data.sides, emphasis);
  label.scale.set(size, size, size);
  label.position.copy(data.normal).multiplyScalar(data.distance + (emphasis ? 0.026 : 0.022));
  label.renderOrder = emphasis ? 10 : 8;
}

function setResultFaceLabel(body, resultFaceIndex) {
  const faceCount = body.specs.length;
  const clampedFaceIndex = Math.min(Math.max(Math.trunc(resultFaceIndex) || 0, 0), Math.max(0, faceCount - 1));
  let resolvedValue = clampedFaceIndex + 1;
  body.group.traverse((child) => {
    const label = child.userData?.diceLabel;
    if (!label) return;
    const isResult = label.faceIndex === clampedFaceIndex;
    if (isResult) resolvedValue = label.value;
    updateFaceLabel(child, label.value, isResult);
  });

  return resolvedValue;
}

function resolveTopFaceIndex(specs, quaternion) {
  let bestIndex = 0;
  let bestDot = -Infinity;
  const normal = new THREE.Vector3();

  specs.forEach((spec, index) => {
    const worldNormal = normal.copy(spec.normal).applyQuaternion(quaternion);
    const elevation = worldNormal.dot(TARGET_FACE_NORMAL);
    if (elevation > bestDot) {
      bestDot = elevation;
      bestIndex = index;
    }
  });

  return bestIndex;
}

function resolveBottomFaceIndex(specs, quaternion) {
  let bestIndex = 0;
  let bestDot = Infinity;
  const normal = new THREE.Vector3();

  specs.forEach((spec, index) => {
    const worldNormal = normal.copy(spec.normal).applyQuaternion(quaternion);
    const elevation = worldNormal.dot(TARGET_FACE_NORMAL);
    if (elevation < bestDot) {
      bestDot = elevation;
      bestIndex = index;
    }
  });

  return bestIndex;
}

function supportDistance(body) {
  const normal = new THREE.Vector3();
  return body.specs.reduce((distance, spec) => {
    const worldNormal = normal.copy(spec.normal).applyQuaternion(body.group.quaternion);
    const support = Math.max(0, -worldNormal.y * spec.distance * body.visualScale);
    return Math.max(distance, support);
  }, 0.02);
}

function snapBodyToResultFace(body, resultFaceIndex) {
  const spec = body.specs[resultFaceIndex] || body.specs[0];
  if (!spec) return;
  const targetNormal = body.face.sides === 4 ? BOTTOM_FACE_NORMAL : TARGET_FACE_NORMAL;
  const worldNormal = spec.normal.clone().applyQuaternion(body.group.quaternion).normalize();
  const align = new THREE.Quaternion().setFromUnitVectors(worldNormal, targetNormal);
  body.group.quaternion.premultiply(align);
  body.group.position.y = FLOOR_Y + supportDistance(body);
}

function resolveResultFaceIndex(body) {
  return body.face.sides === 4
    ? resolveBottomFaceIndex(body.specs, body.group.quaternion)
    : resolveTopFaceIndex(body.specs, body.group.quaternion);
}

function resultFaceConfidence(body, resultFaceIndex) {
  const spec = body.specs[resultFaceIndex] || body.specs[0];
  if (!spec) return 1;
  const targetNormal = body.face.sides === 4 ? BOTTOM_FACE_NORMAL : TARGET_FACE_NORMAL;
  return spec.normal.clone().applyQuaternion(body.group.quaternion).normalize().dot(targetNormal);
}

function landingTarget(body, resultFaceIndex) {
  const spec = body.specs[resultFaceIndex] || body.specs[0];
  const targetNormal = body.face.sides === 4 ? BOTTOM_FACE_NORMAL : TARGET_FACE_NORMAL;
  const worldNormal = spec.normal.clone().applyQuaternion(body.group.quaternion).normalize();
  const align = new THREE.Quaternion().setFromUnitVectors(worldNormal, targetNormal);
  const quaternion = body.group.quaternion.clone().premultiply(align);
  const probe = { ...body, group: { quaternion } };
  return {
    quaternion,
    y: FLOOR_Y + supportDistance(probe)
  };
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

function startLandingBlend(body, time, face = body.face) {
  if (body.landingBlend || body.hasSettled) return;
  const resultFaceIndex = resolveResultFaceIndex(body);
  const target = landingTarget(body, resultFaceIndex);
  body.face = { ...body.face, ...face };
  body.velocity.set(0, 0, 0);
  body.spin.set(0, 0, 0);
  body.landingBlend = {
    startedAt: time,
    startY: body.group.position.y,
    startQuaternion: body.group.quaternion.clone(),
    resultFaceIndex,
    targetQuaternion: target.quaternion,
    targetY: target.y
  };
}

function updateLandingBlend(body, time) {
  if (!body.landingBlend) return;
  const blend = body.landingBlend;
  const progress = Math.min(1, Math.max(0, (time - blend.startedAt) / LANDING_BLEND_MS));
  const eased = easeOutCubic(progress);
  body.group.quaternion.slerpQuaternions(blend.startQuaternion, blend.targetQuaternion, eased);
  body.group.position.y = THREE.MathUtils.lerp(blend.startY, blend.targetY, eased);
  if (progress < 1) return;

  body.group.quaternion.copy(blend.targetQuaternion);
  body.group.position.y = blend.targetY;
  const resultValue = setResultFaceLabel(body, blend.resultFaceIndex);
  body.face = { ...body.face, value: resultValue };
  body.finalPosition = body.group.position.clone();
  body.landingBlend = null;
  body.hasSettled = true;
}

function glowTexture(hex) {
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 160;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(80, 80, 2, 80, 80, 78);
  gradient.addColorStop(0, "rgba(255, 248, 232, 0.8)");
  gradient.addColorStop(0.32, hex);
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createGlowSprite(palette, total) {
  const texture = glowTexture(palette.glow);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: total > 3 ? 0.5 : 0.66,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const sprite = new THREE.Sprite(material);
  const size = total > 3 ? 1.72 : 2.02;
  sprite.scale.set(size, size, size);
  sprite.renderOrder = -1;
  return sprite;
}

function createGemAura(geometry, palette, total) {
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(palette.glow),
    transparent: true,
    opacity: total > 3 ? 0.08 : 0.13,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.BackSide,
    toneMapped: false
  });
  const aura = new THREE.Mesh(geometry, material);
  aura.scale.setScalar(1.035);
  aura.renderOrder = -2;
  return aura;
}

function disposeObject(object) {
  object.traverse((child) => {
    child.geometry?.dispose?.();
    if (Array.isArray(child.material)) {
      child.material.forEach((material) => {
        material.map?.dispose?.();
        material.dispose?.();
      });
    } else {
      child.material?.map?.dispose?.();
      child.material?.dispose?.();
    }
  });
}

function normalizeFaces(faces, fallbackSides) {
  return faces.map((face, index) => ({
    key: face.key || `${face.sides || fallbackSides}-${index}`,
    sides: Number(face.sides || fallbackSides || 20),
    value: Number(face.value ?? face) || 1,
    groupKey: face.groupKey
  }));
}

function settledPosition(index, total, bodyRadius) {
  if (total <= 1) return new THREE.Vector3(0, FLOOR_Y + bodyRadius, 0);
  const layoutRadius = total <= 3 ? 0.82 : 1.34;
  const angle = (-Math.PI / 2) + (Math.PI * 2 * index) / total;
  return new THREE.Vector3(
    Math.cos(angle) * layoutRadius,
    FLOOR_Y + bodyRadius,
    Math.sin(angle) * layoutRadius * 0.58
  );
}

function createDie(face, index, total, isRolling) {
  const group = new THREE.Group();
  const visualScale = dieScale(total);
  const radius = dieRadius(total);
  const palette = paletteForSides(face.sides);
  const geometry = prepareGeometry(face.sides, palette);
  const specs = faceSpecs(face.sides, geometry);
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(face.sides === 12 ? palette.base : "#ffffff"),
    vertexColors: Boolean(geometry.getAttribute("color")),
    emissive: new THREE.Color(palette.emissive),
    emissiveIntensity: 0.5,
    roughness: 0.26,
    metalness: 0.5,
    flatShading: true
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const edge = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry, 10),
    new THREE.LineBasicMaterial({
      color: palette.edge,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending
    })
  );

  const innerLight = new THREE.PointLight(palette.glow, total > 3 ? 0.78 : 1.12, 2.75);
  innerLight.position.set(0, 0.16, 0.04);

  group.add(createGlowSprite(palette, total), createGemAura(geometry, palette, total), mesh, edge, innerLight);
  const resultIndex = isRolling ? -1 : Math.min(Math.max(Number(face.value) - 1, 0), specs.length - 1);
  specs.forEach((spec, faceIndex) => {
    group.add(createFaceLabel(faceIndex + 1, face.sides, spec, palette, faceIndex === resultIndex));
  });
  group.scale.setScalar(visualScale);

  const finalPosition = settledPosition(index, total, radius);
  if (isRolling) {
    group.position.copy(launchPosition(index, total, radius));
    group.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  } else {
    group.position.copy(finalPosition);
  }

  const body = {
    face,
    group,
    velocity: launchVelocity(index, total),
    spin: new THREE.Vector3(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10
    ),
    radius,
    visualScale,
    finalPosition,
    specs,
    hasSettled: !isRolling,
    landingBlend: null
  };

  if (!isRolling) {
    updateLanding(body, face);
  }

  return body;
}

function sameBodyShape(body, face) {
  return Boolean(body) && body.face.sides === face.sides;
}

function clearBodies(scene, bodies) {
  bodies.forEach((body) => {
    scene.remove(body.group);
    disposeObject(body.group);
  });
}

function updateLanding(body, face = body.face) {
  const resultFaceIndex = resolveResultFaceIndex(body);
  snapBodyToResultFace(body, resultFaceIndex);
  const resultValue = setResultFaceLabel(body, resultFaceIndex);
  body.face = { ...body.face, ...face, value: resultValue };
  body.finalPosition = body.group.position.clone();
  body.spin.set(0, 0, 0);
  body.velocity.set(0, 0, 0);
  body.landingBlend = null;
  body.hasSettled = true;
}

function resolveCollisions(bodies, iterations = 3) {
  for (let pass = 0; pass < iterations; pass += 1) {
    for (let leftIndex = 0; leftIndex < bodies.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < bodies.length; rightIndex += 1) {
        const left = bodies[leftIndex];
        const right = bodies[rightIndex];
        if (left.hasSettled && right.hasSettled) continue;
        const verticalDistance = Math.abs(right.group.position.y - left.group.position.y);
        if (verticalDistance > (left.radius + right.radius) * 0.75) continue;
        const delta = new THREE.Vector3(
          right.group.position.x - left.group.position.x,
          0,
          right.group.position.z - left.group.position.z
        );
        const rawDistance = delta.length();
        if (rawDistance < 0.001) {
          const angle = ((leftIndex + pass * 0.37) / Math.max(1, bodies.length)) * Math.PI * 2;
          delta.set(Math.cos(angle), 0, Math.sin(angle));
        }
        const distance = Math.max(delta.length(), 0.001);
        const minDistance = (left.radius + right.radius) * 0.94;
        if (distance >= minDistance) continue;
        const normal = delta.multiplyScalar(1 / distance);
        const overlap = (minDistance - distance) * 0.5;
        if (!left.hasSettled) left.group.position.addScaledVector(normal, -overlap);
        if (!right.hasSettled) right.group.position.addScaledVector(normal, overlap);
        const relativeVelocity = right.velocity.clone().sub(left.velocity);
        const impact = relativeVelocity.dot(normal);
        if (impact < 0) {
          const impulse = normal.multiplyScalar(-impact * 0.48);
          if (!left.hasSettled) left.velocity.addScaledVector(impulse, -0.5);
          if (!right.hasSettled) right.velocity.addScaledVector(impulse, 0.5);
        }
      }
    }
  }
}

export default function ThreeDiceStage({
  faces,
  fallbackSides,
  isRolling,
  rollId,
  onSettledRoll,
  emptyText
}) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const bodiesRef = useRef([]);
  const frameRef = useRef(null);
  const lastFrameRef = useRef(0);
  const rollingRef = useRef(false);
  const settleTokenRef = useRef(null);
  const onSettledRollRef = useRef(null);
  const emissionRef = useRef(false);
  const rollStartedAtRef = useRef(0);
  const normalizedFaces = useMemo(() => normalizeFaces(faces, fallbackSides), [faces, fallbackSides]);

  useEffect(() => {
    onSettledRollRef.current = onSettledRoll;
  }, [onSettledRoll]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#211611");

    const camera = new THREE.OrthographicCamera(-2.6, 2.6, 1.6, -1.6, 0.1, 100);
    camera.position.set(0, 7.2, 0);
    camera.up.set(0, 0, -1);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const ambient = new THREE.HemisphereLight("#fff0c5", "#162f25", 2.45);
    const key = new THREE.DirectionalLight("#fff1bf", 3.05);
    key.position.set(-2.8, 5.2, 3.8);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    const rim = new THREE.PointLight("#a464ff", 1.35, 8);
    rim.position.set(2.6, 1.8, 1.8);
    const ember = new THREE.PointLight("#ffd35b", 0.95, 6);
    ember.position.set(-1.8, 0.62, -0.9);

    scene.add(ambient, key, rim, ember, createDiceTray());
    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      const viewWidth = ORTHO_VIEW_HEIGHT * (width / height);
      camera.left = -viewWidth / 2;
      camera.right = viewWidth / 2;
      camera.top = ORTHO_VIEW_HEIGHT / 2;
      camera.bottom = -ORTHO_VIEW_HEIGHT / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    const tick = (time) => {
      const dt = Math.min(0.033, Math.max(0.001, (time - (lastFrameRef.current || time)) / 1000));
      lastFrameRef.current = time;
      const bodies = bodiesRef.current;
      if (rollingRef.current) {
        const elapsed = time - rollStartedAtRef.current;
        bodies.forEach((body) => {
          updateLandingBlend(body, time);
          if (body.hasSettled) return;
          if (body.landingBlend) return;
          body.velocity.y -= GRAVITY * dt;
          body.group.position.addScaledVector(body.velocity, dt);
          body.group.rotation.x += body.spin.x * dt;
          body.group.rotation.y += body.spin.y * dt;
          body.group.rotation.z += body.spin.z * dt;
          body.velocity.multiplyScalar(FRICTION_AIR);
          body.spin.multiplyScalar(SPIN_DAMPING);

          if (body.group.position.y <= FLOOR_Y + body.radius) {
            body.group.position.y = FLOOR_Y + body.radius;
            if (Math.abs(body.velocity.y) <= 0.035) {
              body.velocity.y = 0;
            } else {
              body.velocity.y = -body.velocity.y * BOUNCE_DAMPING;
            }
            body.velocity.x *= FRICTION_FLOOR;
            body.velocity.z *= FRICTION_FLOOR;
            body.spin.multiplyScalar(0.82);
          }
          if (body.group.position.y > ARENA_TOP) {
            body.group.position.y = ARENA_TOP;
            body.velocity.y = -Math.abs(body.velocity.y) * BOUNCE_DAMPING;
          }
          const xLimit = ARENA_X - body.radius;
          const zLimit = ARENA_Z - body.radius;
          if (Math.abs(body.group.position.x) > xLimit) {
            body.group.position.x = Math.sign(body.group.position.x) * xLimit;
            body.velocity.x *= -0.72;
          }
          if (Math.abs(body.group.position.z) > zLimit) {
            body.group.position.z = Math.sign(body.group.position.z) * zLimit;
            body.velocity.z *= -0.72;
          }
          if (
            body.group.position.y <= FLOOR_Y + body.radius + 0.001 &&
            elapsed >= MIN_ROLL_DURATION_MS &&
            (
              elapsed >= MAX_ROLL_DURATION_MS ||
              (
                body.velocity.lengthSq() < STOP_LINEAR_SPEED_SQ &&
                body.spin.lengthSq() < STOP_SPIN_SPEED_SQ &&
                resultFaceConfidence(body, resolveResultFaceIndex(body)) >= RESULT_FACE_CONFIDENCE
              )
            )
          ) {
            startLandingBlend(body, time);
          }
        });
        resolveCollisions(bodies);
      } else {
        bodies.forEach((body) => {
          updateLandingBlend(body, time);
          if (body.hasSettled || body.landingBlend) return;
          body.spin.multiplyScalar(SPIN_DAMPING);
          body.velocity.multiplyScalar(0.92);
          if (!body.hasSettled && body.spin.lengthSq() < STOP_SPIN_SPEED_SQ && body.velocity.lengthSq() < STOP_LINEAR_SPEED_SQ) {
            startLandingBlend(body, time);
          }
          const xLimit = ARENA_X - body.radius;
          const zLimit = ARENA_Z - body.radius;
          body.group.position.x = Math.max(-xLimit, Math.min(xLimit, body.group.position.x));
          body.group.position.z = Math.max(-zLimit, Math.min(zLimit, body.group.position.z));
        });
        resolveCollisions(bodies);
      }

      if (
        settleTokenRef.current &&
        !emissionRef.current &&
        bodies.length > 0 &&
        bodies.every((body) => body.hasSettled)
      ) {
        const token = settleTokenRef.current;
        const values = bodies.map((body) => body.face.value);
        emissionRef.current = true;
        settleTokenRef.current = null;
        onSettledRollRef.current?.(values, token);
      }

      renderer.render(scene, camera);
      frameRef.current = window.requestAnimationFrame(tick);
    };
    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      resizeObserver.disconnect();
      window.cancelAnimationFrame(frameRef.current);
      bodiesRef.current.forEach((body) => disposeObject(body.group));
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const shapeChanged =
      bodiesRef.current.length !== normalizedFaces.length ||
      normalizedFaces.some((face, index) => !sameBodyShape(bodiesRef.current[index], face));
    const shouldLaunch = isRolling && !rollingRef.current;

    if (shapeChanged || shouldLaunch) {
      settleTokenRef.current = rollId;
      emissionRef.current = false;
      rollStartedAtRef.current = performance.now();
      clearBodies(scene, bodiesRef.current);
      bodiesRef.current = normalizedFaces.map((face, index) => createDie(face, index, normalizedFaces.length, isRolling));
      bodiesRef.current.forEach((body) => scene.add(body.group));
    } else if (!isRolling) {
      bodiesRef.current.forEach((body, index) => {
        const face = normalizedFaces[index];
        if (face) {
          if (body.hasSettled) {
            body.face = { ...body.face, ...face };
            setResultFaceLabel(body, Math.max(0, Math.min(body.specs.length - 1, Number(face.value) - 1)));
          } else {
            body.face = { ...body.face, ...face };
          }
        }
      });
    }

    rollingRef.current = isRolling;
  }, [isRolling, normalizedFaces, rollId]);

  return (
    <div className="dice-stage">
      <span className="dice-stage__glow" aria-hidden="true" />
      <div ref={containerRef} className="dice-stage__canvas" aria-hidden="true" />
      {!normalizedFaces.length ? (
        <div className="dice-stage__empty">
          {emptyText}
        </div>
      ) : null}
    </div>
  );
}
