import { useEffect, useRef } from "react";
import * as THREE from "three";

type Props = {
  label: string;
  sublabel?: string;
  onClick: () => void;
  variant?: "primary" | "small";
};

export default function ThreeHero({
  label,
  sublabel = "ENTER THE ARENA",
  onClick,
  variant = "primary",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hostRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(20, 1, 1.1, 100);
    camera.position.set(0, 0, 7);
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    const group = new THREE.Group();
    scene.add(group);

    const geometry = new THREE.BoxGeometry(3.8, 1.45, 0.2);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffdf00,
      metalness: 0.55,
      roughness: 0.24,
    });
    const slab = new THREE.Mesh(geometry, material);
    slab.rotation.z = -0.055;
    group.add(slab);

    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry),
      new THREE.LineBasicMaterial({ color: 0x080808 }),
    );
    edge.rotation.copy(slab.rotation);
    edge.position.set(0.045, -0.045, 0.16);
    group.add(edge);

    const backGeometry = new THREE.BoxGeometry(3.8, 1.45, 0.18);
    const back = new THREE.Mesh(
      backGeometry,
      new THREE.MeshStandardMaterial({
        color: 0xe60012,
        metalness: 0.25,
        roughness: 0.5,
      }),
    );
    back.position.set(0.14, -0.14, -0.25);
    back.rotation.z = -0.055;
    group.add(back);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x282033, 2.3));
    const key = new THREE.DirectionalLight(0xffffff, 3.2);
    key.position.set(-3, 4, 6);
    scene.add(key);
    const rim = new THREE.PointLight(0x35d8ff, 10, 18);
    rim.position.set(3, -2, 4);
    scene.add(rim);

    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;
    let targetX = 0;
    let targetY = 0;
    const onPointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      targetY = ((event.clientX - rect.left) / rect.width - 0.5) * 1.14;
      targetX = ((event.clientY - rect.top) / rect.height - 0.5) * 1.08;
    };
    host.addEventListener("pointermove", onPointerMove);

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    const animate = () => {
      frame = requestAnimationFrame(animate);
      pointerX += (targetX - pointerX) * 0.145;
      pointerY += (targetY - pointerY) * 0.145;
      group.rotation.x =
        pointerX + Math.sin(performance.now() * 0.0007) * 0.025;
      group.rotation.y =
        pointerY + Math.sin(performance.now() * 0.0005) * 0.045;
      group.position.y = Math.sin(performance.now() * 0.0011) * 0.055;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      host.removeEventListener("pointermove", onPointerMove);
      geometry.dispose();
      backGeometry.dispose();
      material.dispose();
      (back.material as THREE.Material).dispose();
      (edge.material as THREE.Material).dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <button
      ref={hostRef}
      type="button"
      className={`gf-three-hero gf-three-${variant}`}
      onClick={onClick}
    >
      <canvas ref={canvasRef} aria-hidden="true" />
      <span className="gf-three-face">
        <strong>{label}</strong>
        <small>{sublabel}</small>
      </span>
    </button>
  );
}
