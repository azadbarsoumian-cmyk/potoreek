import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Shows a .glb model (e.g. a fedayi's 3D portrait relief) with drag-to-turn.
export default function ModelViewer({ url, className = "" }) {
  const mountRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !url) return undefined;
    let disposed = false;
    const width = mount.clientWidth || 480;
    const height = mount.clientHeight || 480;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.2);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xfff1dc, 0.55));
    const key = new THREE.DirectionalLight(0xffe2b8, 1.6);
    key.position.set(-2, 2.5, 3);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xc1272d, 0.9);
    rim.position.set(2.5, -1, -1);
    scene.add(rim);

    const group = new THREE.Group();
    scene.add(group);
    new GLTFLoader().load(
      url,
      (gltf) => {
        if (disposed) return;
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3()).length() || 1;
        model.position.sub(box.getCenter(new THREE.Vector3()));
        group.scale.setScalar(2.6 / size);
        group.add(model);
      },
      undefined,
      () => setFailed(true)
    );

    let target = 0, current = 0, dragging = false, lastX = 0;
    const el = renderer.domElement;
    el.style.cursor = "grab";
    el.style.touchAction = "none";
    const down = (e) => { dragging = true; lastX = e.clientX; };
    const move = (e) => { if (dragging) { target += (e.clientX - lastX) * 0.01; lastX = e.clientX; } };
    const up = () => { dragging = false; };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);

    let raf;
    const start = performance.now();
    const animate = () => {
      if (disposed) return;
      raf = requestAnimationFrame(animate);
      const t = (performance.now() - start) / 1000;
      current += (target - current) * 0.08;
      group.rotation.y = Math.sin(t * 0.4) * 0.35 + current;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      el.removeEventListener("pointerdown", down);
      renderer.dispose();
      el.remove();
    };
  }, [url]);

  if (failed) return null;
  return <div ref={mountRef} className={`w-full h-full ${className}`} />;
}
