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
      powerPreference: "high-performance",
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));

    renderer.setClearColor(0x000000, 0);

    container.appendChild(renderer.domElement);

    // --------------------------------------------------
    // TOON GRADIENT
    // --------------------------------------------------

    const gradientMap = new THREE.DataTexture(
      new Uint8Array([
        // Deep shadow
        4, 4, 4, 255,

        // Dark neutral
        30, 30, 30, 255,

        // Strong yellow
        255, 217, 0, 255,

        // Highlight
        255, 255, 255, 255,
      ]),
      4,
      1,
      THREE.RGBAFormat,
    );

    gradientMap.minFilter = THREE.NearestFilter;
    gradientMap.magFilter = THREE.NearestFilter;
    gradientMap.generateMipmaps = false;
    gradientMap.needsUpdate = true;

    // --------------------------------------------------
    // LIGHTS
    // --------------------------------------------------

    const ambientLight = new THREE.AmbientLight(0x111111, 0.2);
    scene.add(ambientLight);

    const yellowLight = new THREE.DirectionalLight(0xffd900, 5);
    yellowLight.position.set(4, 1, 5);
    scene.add(yellowLight);

    const blueLight = new THREE.DirectionalLight(0x168cff, 4);
    blueLight.position.set(-4, -1, 3);
    scene.add(blueLight);

    const frontLight = new THREE.DirectionalLight(0xffffff, 0.2);
    frontLight.position.set(0, 0, 6);
    scene.add(frontLight);

    // --------------------------------------------------
    // TEXT GROUP
    // --------------------------------------------------

    const textGroup = new THREE.Group();

    scene.add(textGroup);

    let animationFrame = 0;
    let disposed = false;

    // --------------------------------------------------
    // MOUSE TRACKING
    // --------------------------------------------------

    const mouseTarget = new THREE.Vector2(0, 0);
    const mouseCurrent = new THREE.Vector2(0, 0);

    const handleMouseMove = (event: MouseEvent) => {
      mouseTarget.x = (event.clientX / window.innerWidth) * 2 - 1;

      mouseTarget.y = (event.clientY / window.innerHeight) * 2 - 1;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // --------------------------------------------------
    // FONT
    // --------------------------------------------------

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
          depth: 0.58,
          curveSegments: 5,

          bevelEnabled: true,
          bevelThickness: 0.045,
          bevelSize: 0.025,
          bevelSegments: 1,
        });

        geometry.computeBoundingBox();

        const bounds = geometry.boundingBox;

        if (bounds) {
          const width = bounds.max.x - bounds.min.x;

          const height = bounds.max.y - bounds.min.y;

          geometry.translate(-width / 2, -height / 2, 0);
        }

        // --------------------------------------------------
        // BLACK OUTLINE
        // --------------------------------------------------

        const outlineMaterial = new THREE.MeshBasicMaterial({
          color: 0x050505,
          side: THREE.BackSide,
        });

        const outline = new THREE.Mesh(geometry, outlineMaterial);

        outline.scale.set(1.045, 1.045, 1.045);

        outline.position.z = -0.035;

        textGroup.add(outline);

        // --------------------------------------------------
        // TOON MATERIAL
        // --------------------------------------------------

        const material = new THREE.MeshToonMaterial({
          color: 0xffffff,
          gradientMap,
        });

        const text = new THREE.Mesh(geometry, material);

        text.rotation.x = -0.08;
        text.rotation.y = -0.12;

        textGroup.add(text);
      },
    );

    // --------------------------------------------------
    // RESIZE
    // --------------------------------------------------

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

    // --------------------------------------------------
    // ANIMATION
    // --------------------------------------------------

    const clock = new THREE.Clock();

    const animate = () => {
      if (disposed) {
        return;
      }

      animationFrame = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();

      mouseCurrent.lerp(mouseTarget, 0.055);

      // Floating.

      textGroup.position.y = Math.sin(elapsed * 0.9) * 0.08;

      // Existing rotation.

      const floatRotationY = Math.sin(elapsed * 0.4) * 0.12;

      const floatRotationZ = Math.sin(elapsed * 0.6) * 0.025;

      // Mouse influence.

      const mouseRotationY = mouseCurrent.x * 0.22;

      const mouseRotationX = mouseCurrent.y * 0.12;

      textGroup.rotation.x = mouseRotationX;

      textGroup.rotation.y = floatRotationY + mouseRotationY;

      textGroup.rotation.z = floatRotationZ;

      renderer.render(scene, camera);
    };

    animate();

    // --------------------------------------------------
    // CLEANUP
    // --------------------------------------------------

    return () => {
      disposed = true;

      cancelAnimationFrame(animationFrame);

      window.removeEventListener("mousemove", handleMouseMove);

      resizeObserver.disconnect();

      gradientMap.dispose();

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
