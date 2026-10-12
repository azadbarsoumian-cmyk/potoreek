// 3D portrait relief: the photo becomes a height map on a square plaque with a
// raised frame. Exported as GLB (for the website's 3D viewer) and as a closed,
// printable STL (for 3D printing). This is a relief, not a full figure.
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
import { makeCanvas, drawCover } from "./canvas";

const SIZE = 2; // plaque width in scene units (≈ 100 mm when printed at 50 mm/unit)
const BASE = 0.06; // plaque thickness under the relief
const DEPTH = 0.22; // relief height range
const FRAME = 0.07; // frame width (fraction of the plaque)

// Height field in [0, 1] from the portrait (bright = raised), with a raised frame.
function heightField(portrait, n) {
  const [canvas, ctx] = makeCanvas(n, n);
  if (portrait) {
    ctx.filter = "grayscale(1) contrast(1.2) blur(1.2px)";
    drawCover(ctx, portrait, 0, 0, n, n, 0.3);
  } else {
    ctx.fillStyle = "#555";
    ctx.fillRect(0, 0, n, n);
  }
  const d = ctx.getImageData(0, 0, n, n).data;
  const h = new Float32Array(n * n);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const i = (y * n + x) * 4;
      let v = (d[i] + d[i + 1] + d[i + 2]) / (3 * 255);
      const ex = Math.min(x, n - 1 - x) / (n - 1), ey = Math.min(y, n - 1 - y) / (n - 1);
      const edge = Math.min(ex, ey);
      if (edge < FRAME) v = 1.05; // the frame
      else if (edge < FRAME + 0.015) v = 0; // a groove inside the frame
      h[y * n + x] = v;
    }
  }
  return h;
}

// Closed mesh: relief top, flat bottom and four side walls.
function buildGeometry(h, n, { closed }) {
  const positions = [];
  const index = [];
  const at = (x, y) => [((x / (n - 1)) - 0.5) * SIZE, (0.5 - y / (n - 1)) * SIZE];
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const [px, py] = at(x, y);
      positions.push(px, py, BASE + h[y * n + x] * DEPTH);
    }
  const top = (x, y) => y * n + x;
  for (let y = 0; y < n - 1; y++)
    for (let x = 0; x < n - 1; x++) {
      const a = top(x, y), b = top(x + 1, y), c = top(x, y + 1), d = top(x + 1, y + 1);
      index.push(a, c, b, b, c, d);
    }

  if (closed) {
    // Bottom corners and walls around the edge.
    const offset = positions.length / 3;
    const ring = [];
    for (let x = 0; x < n; x++) ring.push([x, 0]);
    for (let y = 1; y < n; y++) ring.push([n - 1, y]);
    for (let x = n - 2; x >= 0; x--) ring.push([x, n - 1]);
    for (let y = n - 2; y > 0; y--) ring.push([0, y]);
    ring.forEach(([x, y]) => {
      const [px, py] = at(x, y);
      positions.push(px, py, 0);
    });
    for (let i = 0; i < ring.length; i++) {
      const j = (i + 1) % ring.length;
      const t1 = top(...ring[i]), t2 = top(...ring[j]);
      const b1 = offset + i, b2 = offset + j;
      index.push(t1, t2, b1, t2, b2, b1);
    }
    // Bottom face as a fan from the centre, facing down (-z).
    const center = positions.length / 3;
    positions.push(0, 0, 0);
    for (let i = 0; i < ring.length; i++) {
      const j = (i + 1) % ring.length;
      index.push(center, offset + i, offset + j);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  return geometry;
}

const bronze = () => new THREE.MeshStandardMaterial({ color: 0xb08d57, metalness: 0.65, roughness: 0.42 });

export async function buildRelief(portrait) {
  const preview = new THREE.Mesh(buildGeometry(heightField(portrait, 160), 160, { closed: true }), bronze());
  preview.name = "PortraitRelief";

  const glb = await new Promise((resolve, reject) =>
    new GLTFExporter().parse(preview, (result) => resolve(new Blob([result], { type: "model/gltf-binary" })), reject, { binary: true })
  );

  const printMesh = new THREE.Mesh(buildGeometry(heightField(portrait, 256), 256, { closed: true }), bronze());
  // STL in millimetres: 50 mm per scene unit gives a 100 mm plaque.
  printMesh.scale.setScalar(50);
  printMesh.updateMatrixWorld(true);
  const stlData = new STLExporter().parse(printMesh, { binary: true });
  const stl = new Blob([stlData], { type: "model/stl" });

  return { glb, stl };
}
