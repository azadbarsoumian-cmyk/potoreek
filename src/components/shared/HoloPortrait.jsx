import React, { useEffect, useRef } from "react";
import * as THREE from "three";

// Public image relay that adds CORS headers, for photo hosts that block
// WebGL from loading their images directly.
const corsSafe = (url) => `https://wsrv.nl/?url=${encodeURIComponent(url)}`;

const VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const FRAG = `
uniform sampler2D map;
uniform float uTime;
uniform float uOpacity;
uniform vec3 uTint;
varying vec2 vUv;
void main() {
  vec4 tex = texture2D(map, vUv);
  float scan = 0.82 + 0.18 * sin(vUv.y * 260.0 + uTime * 5.0);
  float flicker = 0.9 + 0.1 * sin(uTime * 34.0) * sin(uTime * 9.7);
  vec3 col = mix(tex.rgb, uTint, 0.45);
  float alpha = tex.a * 0.9 * scan * flicker * uOpacity;
  gl_FragColor = vec4(col * (0.6 + 0.4 * scan) + uTint * 0.2, alpha);
}`;

// Fallback plate when the story has no photo: the fidayi's name as a plaque
function makeNameTexture(name, year) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 768;
  const g = c.getContext("2d");
  g.fillStyle = "#0b0909";
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = "rgba(193,39,45,0.7)";
  g.lineWidth = 4;
  g.strokeRect(28, 28, c.width - 56, c.height - 56);
  g.textAlign = "center";
  g.fillStyle = "#e8d9a0";
  g.font = "700 64px Georgia, serif";
  const words = String(name || "").split(/\s+/);
  const lines = [];
  let line = "";
  words.forEach((w) => {
    if ((line + " " + w).trim().length > 18) { lines.push(line.trim()); line = w; }
    else line += " " + w;
  });
  if (line.trim()) lines.push(line.trim());
  const startY = c.height / 2 - (lines.length - 1) * 40;
  lines.slice(0, 6).forEach((l, i) => g.fillText(l, c.width / 2, startY + i * 80));
  if (year) {
    g.fillStyle = "#C1272D";
    g.font = "600 44px monospace";
    g.fillText(String(year), c.width / 2, startY + Math.min(lines.length, 6) * 80 + 40);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

export default function HoloPortrait({ imageUrl, name, year, className = "" }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;
    let disposed = false;

    const width = mount.clientWidth || 600;
    const height = mount.clientHeight || 400;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.1, 5.4);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const uniforms = {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uTint: { value: new THREE.Color(0xc1272d) },
      map: { value: makeNameTexture(name, year) },
    };
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.95), material);
    const group = new THREE.Group();
    group.add(plane);
    scene.add(group);

    // projection base rings
    const baseMat = () => new THREE.MeshBasicMaterial({ color: 0xc1272d, transparent: true, opacity: 0.45, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.05, 1.18, 64), baseMat());
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -1.35;
    const inner = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.6, 64), baseMat());
    inner.rotation.x = -Math.PI / 2;
    inner.position.y = -1.35;
    scene.add(ring);
    scene.add(inner);

    if (imageUrl) {
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin("anonymous");
      const show = (tex) => { if (!disposed) uniforms.map.value = tex; };
      const viaRelay = () => {
        if (/^https?:/.test(imageUrl)) loader.load(corsSafe(imageUrl), show, undefined, () => {});
      };
      loader.load(imageUrl, show, undefined, viaRelay);
    }

    // interaction + loop
    const start = performance.now();
    let dragX = 0;
    let targetDrag = 0;
    let dragging = false;
    let lastX = 0;
    const el = renderer.domElement;
    el.style.cursor = "grab";
    el.style.touchAction = "none";
    const down = (e) => { dragging = true; lastX = e.clientX; };
    const move = (e) => { if (!dragging) return; targetDrag += (e.clientX - lastX) * 0.01; lastX = e.clientX; };
    const up = () => { dragging = false; };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);

    let raf;
    const animate = () => {
      if (disposed) return;
      raf = requestAnimationFrame(animate);
      const t = (performance.now() - start) / 1000;
      uniforms.uTime.value = t;
      uniforms.uOpacity.value = Math.min(1, t / 1.2);
      dragX += (targetDrag - dragX) * 0.08;
      group.rotation.y = Math.sin(t * 0.45) * 0.3 + dragX;
      group.position.y = Math.sin(t * 1.1) * 0.06;
      ring.material.opacity = 0.35 + 0.15 * Math.sin(t * 2);
      inner.material.opacity = ring.material.opacity;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!mount.clientWidth) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("resize", onResize);
      el.removeEventListener("pointerdown", down);
      renderer.dispose();
      if (el.parentNode) el.parentNode.removeChild(el);
    };
  }, [imageUrl, name, year]);

  return <div ref={mountRef} className={`w-full h-full ${className}`} />;
}