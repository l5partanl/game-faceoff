import { useEffect, useRef } from "react";
import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";

interface ThreeTextProps {
  children: string;
}

function ThreeText({ children }: ThreeTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);

    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    renderer.setClearColor(0x000000, 0);

    container.appendChild(renderer.domElement);

    // Lights

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);

    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.5);

    keyLight.position.set(-2, 2, 5);

    scene.add(keyLight);

    const sideLight = new THREE.DirectionalLight(0xffd900, 5);

    sideLight.position.set(4, 0, 2);

    scene.add(sideLight);

    const rimLight = new THREE.DirectionalLight(0x168cff, 2.5);

    rimLight.position.set(3, -2, -3);

    scene.add(rimLight);

    // Text group

    const textGroup = new THREE.Group();

    scene.add(textGroup);

    let animationFrame = 0;
    let disposed = false;

    // Font

    const fontLoader = new FontLoader();

    fontLoader.load(
      "https://threejs.org/examples/fonts/helvetiker_bold.typeface.json",
      (font) => {
        if (disposed) {
          return;
        }

        const geometry = new TextGeometry(children, {
          font,
          size: 1.42,
          depth: 0.7,
          curveSegments: 8,
          bevelEnabled: true,
          bevelThickness: 0.06,
          bevelSize: 0.035,
          bevelSegments: 3,
        });

        geometry.computeBoundingBox();

        const bounds = geometry.boundingBox;

        if (bounds) {
          const width = bounds.max.x - bounds.min.x;
          const height = bounds.max.y - bounds.min.y;

          geometry.translate(-width / 2, -height / 2, 0);
        }

        const material = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.38,
          metalness: 0.65,
        });

        const text = new THREE.Mesh(geometry, material);

        text.rotation.x = -0.08;
        text.rotation.y = -0.12;

        textGroup.add(text);
      },
    );

    // Resize

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;

      if (!width || !height) {
        return;
      }

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height, false);
    };

    resize();

    const resizeObserver = new ResizeObserver(resize);

    resizeObserver.observe(container);

    // Animation

    const clock = new THREE.Clock();

    const animate = () => {
      if (disposed) {
        return;
      }

      animationFrame = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();

      textGroup.position.y = Math.sin(elapsed * 0.9) * 0.08;

      textGroup.rotation.y = Math.sin(elapsed * 0.4) * 0.12;

      textGroup.rotation.z = Math.sin(elapsed * 0.6) * 0.025;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup

    return () => {
      disposed = true;

      cancelAnimationFrame(animationFrame);

      resizeObserver.disconnect();

      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;

        if (mesh.geometry) {
          mesh.geometry.dispose();
        }

        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((material) => material.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      });

      renderer.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [children]);

  return <div ref={containerRef} className="three-text" aria-hidden="true" />;
}

export default ThreeText;
