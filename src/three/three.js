import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { FontLoader } from "three/examples/jsm/Addons.js";
import { TextGeometry } from "three/examples/jsm/Addons.js";
import { TTFLoader } from "three/examples/jsm/Addons.js";
import { Color } from "three";

import { RenderPass } from "three/examples/jsm/Addons.js";
import { EffectComposer } from "three/examples/jsm/Addons.js";
import { UnrealBloomPass } from "three/examples/jsm/Addons.js";
import { RenderPixelatedPass } from "three/examples/jsm/Addons.js";

import { LineMaterial } from "three/examples/jsm/Addons.js";
import { LineGeometry } from "three/examples/jsm/Addons.js";
import { Line2 } from "three/examples/jsm/Addons.js";

import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { LuminosityShader } from "three/addons/shaders/LuminosityShader.js";
import { GlitchPass } from "three/examples/jsm/Addons.js";

import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

import spline from "./spline";

let camera;
let cameraHolder;
let scene;
let renderer;
let object,
  objectData = {},
  originalPositions,
  originalPositionSphere;
let textAbout, strokeGroup;
let lineMaterialAbout, strokeMeshAbout, totalDistanceLetterAbout;
let dancingSphere;

let textFeatured, textProject;
const uniforms = {
  u_resolution: {
    type: "v2",
    value: new THREE.Vector2(window.innerWidth, window.innerHeight),
  },
  u_time: { type: "f", value: 5.0 },
  u_opacity: { type: "f", value: 0.0 },
};

let glitchPass, effectComposer, pixelatedPass;
const Three = () => {
  scene = new THREE.Scene();
  // scene.fog = new THREE.Fog(0x000000, 1, 1000);
  //   CAMERA
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.3,
    1000
  );
  camera.position.set(0, 0, -45);

  cameraHolder = new THREE.Group();
  cameraHolder.add(camera);
  scene.add(cameraHolder);

  //   LIGHT
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(500, 500, 500);
  scene.add(directionalLight);

  //   RENDERER
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  // console.log("PIXEL RATIO ", window.devicePixelRatio);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x000000);
  document.body.appendChild(renderer.domElement);

  // PASSES (AKA FILTERS)
  effectComposer = new EffectComposer(renderer);
  const rendererPass = new RenderPass(scene, camera);
  glitchPass = new GlitchPass();
  pixelatedPass = new RenderPixelatedPass(10, scene, camera);
  // const outputPass = new OutputPass();
  effectComposer.addPass(rendererPass);
  // effectComposer.addPass(glitchPass);
  // const luminosityPass = new ShaderPass(LuminosityShader);
  // effectComposer.addPass(luminosityPass);
  // effectComposer.addPass(outputPass);
  effectComposer.setSize(window.innerWidth, window.innerHeight);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.75,
    0.1,
    0.1
  );
  effectComposer.addPass(bloomPass);

  // GRID AND AXIS HELPER
  const gridHelper = new THREE.GridHelper(200, 40);
  const axisHelper = new THREE.AxesHelper(200);
  // scene.add(axisHelper);
  // scene.add(gridHelper);

  // ADD STARS
  Array(200).fill().forEach(addStars);
  // addHighLightningStars();
  // ADD TEXT
  gsapScroll();
  addPointModel();
  addAboutText();
  addFeaturedText();
  addDancingSphere();
  // addTeamText();
  addProjectText();

  //   AUTO RENDER
  const clock = new THREE.Clock();
  function animate() {
    uniforms.u_time.value = clock.getElapsedTime();
    // renderer.render(scene, camera);
    effectComposer.render();
  }
  window.addEventListener("resize", onWindowResize, false);
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    animate();
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
  renderer.setAnimationLoop(animate);
};

const addPointModel = () => {
  const loader = new GLTFLoader();
  loader.load("/space_station_3.glb", (gltf) => {
    object = gltf.scene;
    // GETTING POSITION
    const positions = combineBuffer(object, "position");
    const targetPositions = createTargetPosition(positions);
    createMesh(positions, targetPositions, scene, 4.05, 0, 0, 0, 0xffffff);
  });

  function combineBuffer(model, bufferName) {
    let count = 0;

    model.traverse(function (child) {
      if (child.isMesh) {
        const buffer = child.geometry.attributes[bufferName];

        count += buffer.array.length;
      }
    });
    const combined = new Float32Array(count);

    let offset = 0;

    model.traverse(function (child) {
      if (child.isMesh) {
        const buffer = child.geometry.attributes[bufferName];
        combined.set(buffer.array, offset);
        offset += buffer.array.length;
      }
    });
    return new THREE.BufferAttribute(combined, 3);
  }

  function createTargetPosition(Positions) {
    const sphereRadius = 5; // Adjust based on your needs
    const sphereGeometry = new THREE.SphereGeometry(
      sphereRadius,
      32,
      32
    ).toNonIndexed();
    const spherePositions = sphereGeometry.attributes.position;
    const combined = new Float32Array(Positions.count * 3);
    let offset = 0;

    for (let i = 0; i < Positions.count * 3; i += 3) {
      // If we have more points than the sphere geometry, we'll wrap around
      const sphereIndex = offset % spherePositions.count;
      combined.set(
        [
          spherePositions.getX(sphereIndex),
          spherePositions.getY(sphereIndex),
          spherePositions.getZ(sphereIndex),
        ],
        i
      );
      offset += 1;
    }
    return new THREE.BufferAttribute(combined, 3);
  }

  function createMesh(positions, targetPositions, scene, scale, x, y, z, c) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", positions.clone());
    geometry.setAttribute("finalPosition", targetPositions.clone());

    // TO OPTIMIZE PERFORMANCE
    geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);

    const mesh = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({ size: 0.03, color: c })
    );
    mesh.scale.x = mesh.scale.y = mesh.scale.z = scale;
    mesh.position.x = x;
    mesh.position.y = y;
    mesh.position.z = z;

    mesh.rotation.y = 1;
    scene.add(mesh);

    objectData = {
      mesh: mesh,
      verticesUp: 0,
      verticesDown: 0,
      speed: 15,
      direction: 0,
      delay: Math.floor(200 + 200 * Math.random()),
      start: Math.floor(100 + 200 * Math.random()),
    };

    originalPositions = new Float32Array(
      mesh.geometry.attributes.position.array
    );
    originalPositionSphere = new Float32Array(
      mesh.geometry.attributes.finalPosition.array
    );
  }
};

const addDancingSphere = () => {
  const mat = new THREE.ShaderMaterial({
    // opacity: 1,
    wireframe: true,
    uniforms,
    transparent: true,
    vertexShader: document.getElementById("vertexshader").textContent,
    fragmentShader: document.getElementById("fragmentshader").textContent,
  });
  const geo = new THREE.IcosahedronGeometry(15, 15);
  // const geo = new THREE.SphereGeometry(10, 32, 32);
  dancingSphere = new THREE.Mesh(geo, mat);
  scene.add(dancingSphere);
};

const addStars = () => {
  const geometry = new THREE.SphereGeometry(0.25, 6, 2);
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const star = new THREE.Mesh(geometry, material);
  const closeGeometry = new THREE.SphereGeometry(0.1, 18, 6);

  const closeStar = new THREE.Mesh(closeGeometry, material);

  const [x, y, z] = Array(3)
    .fill()
    .map(() => THREE.MathUtils.randFloatSpread(400));
  star.position.set(x, y, z);
  scene.add(star);

  const [x1, y1, z1] = Array(3)
    .fill()
    .map(() => THREE.MathUtils.randFloatSpread(100));
  closeStar.position.set(x1, y1, z1);
  scene.add(closeStar);
};

// const addHighLightningStars = () => {
//   const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
//   const closeGeometry = new THREE.SphereGeometry(0.25, 6, 2);
//   const closeStar = new THREE.Mesh(closeGeometry, material);
//   closeStar.position.set(3, 2, 0.5);
//   scene.add(closeStar);
// };

const addAboutText = () => {
  const loader = new FontLoader();
  // promisify font loading
  function loadFont(url) {
    return new Promise((resolve, reject) => {
      loader.load(url, resolve, undefined, reject);
    });
  }
  async function doit() {
    const font = await loadFont("/Sarala_Regular.json");
    // loader.load("/Sarala_Regular.json", (font) => {
    const geometry = new TextGeometry("About", {
      font: font,
      size: 1,

      depth: 0.1,
      curveSegments: 6,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.01,
      bevelOffset: 0,
      bevelSegments: 2,
    });
    geometry.computeBoundingBox();
    const centerOffSet =
      -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
    const mat = new THREE.MeshPhysicalMaterial({
      roughness: 0.5,
      transmission: 1,
      transparent: true,
      thickness: 1,
    });
    textAbout = new THREE.Mesh(geometry, mat);
    textAbout.rotation.x = Math.PI / 2;
    textAbout.rotation.z = -Math.PI;
    textAbout.position.x = centerOffSet - 1;
    textAbout.position.y = 10;
    textAbout.position.z = 10;

    scene.add(textAbout);

    // LETS CREATE ANIMATION
    strokeGroup = new THREE.Group();

    strokeGroup.userData.update = (t) => {
      strokeGroup.children.forEach((c) => {
        c.userData.update?.(t);
      });
    };

    strokeGroup.rotation.x = Math.PI / 2;
    strokeGroup.rotation.z = -Math.PI;
    strokeGroup.position.x = centerOffSet - 1;
    strokeGroup.position.y = 10 - 0.15;
    strokeGroup.position.z = 10;
    lineMaterialAbout = new LineMaterial({
      color: 0x94a3b8,
      linewidth: 3,
      dashed: true,
    });

    const shapes = font.generateShapes("About", 1);
    shapes.forEach((s) => {
      let points = s.getPoints();
      let points3d = [];
      points.forEach((p) => {
        points3d.push(p.x, p.y, 0);
      });
      const lineGeo = new LineGeometry();
      lineGeo.setPositions(points3d);
      strokeMeshAbout = new Line2(lineGeo, lineMaterialAbout);
      strokeMeshAbout.computeLineDistances();
      totalDistanceLetterAbout = s.getLength() + 2;
      (lineMaterialAbout.dashSize = totalDistanceLetterAbout),
        (lineMaterialAbout.gapSize = totalDistanceLetterAbout),
        (lineMaterialAbout.dashOffset = totalDistanceLetterAbout),
        strokeGroup.add(strokeMeshAbout);

      // HOLES
      if (s.holes?.length > 0) {
        s.holes.forEach((h) => {
          let points = h.getPoints();
          let points3d = [];
          points.forEach((p) => {
            points3d.push(p.x, p.y, 0);
          });
          const lineGeo = new LineGeometry();
          lineGeo.setPositions(points3d);
          const strokeMeshAbout = new Line2(lineGeo, lineMaterialAbout);
          strokeMeshAbout.computeLineDistances();
          strokeGroup.add(strokeMeshAbout);
        });
      }
    });
    scene.add(strokeGroup);
  }
  doit();
};

const addFeaturedText = () => {
  const loader = new FontLoader();
  // promisify font loading
  function loadFont(url) {
    return new Promise((resolve, reject) => {
      loader.load(url, resolve, undefined, reject);
    });
  }
  async function doit() {
    const font = await loadFont("/Sarala_Regular.json");
    // loader.load("/Sarala_Regular.json", (font) => {
    const geometry = new TextGeometry("Featured Project", {
      font: font,
      size: 1.4,

      depth: 0.1,
      curveSegments: 6,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.01,
      bevelOffset: 0,
      bevelSegments: 2,
    });

    geometry.center();
    const mat = new THREE.MeshPhysicalMaterial({
      roughness: 0.5,
      transmission: 0.98,
      transparent: true,
      thickness: 1,
      opacity: 0,
    });
    textFeatured = new THREE.Mesh(geometry, mat);
    textFeatured.rotation.y = Math.PI;
    textFeatured.rotation.x = Math.PI / 2;
    scene.add(textFeatured);
  }
  doit();
};

const addProjectText = () => {
  const loader = new FontLoader();
  // promisify font loading
  function loadFont(url) {
    return new Promise((resolve, reject) => {
      loader.load(url, resolve, undefined, reject);
    });
  }
  async function doit() {
    const font = await loadFont("/Sarala_Regular.json");
    // loader.load("/Sarala_Regular.json", (font) => {
    const geometry = new TextGeometry("Projects", {
      font: font,
      size: 1.4,

      depth: 0.1,
      curveSegments: 6,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.01,
      bevelOffset: 0,
      bevelSegments: 2,
    });

    geometry.center();
    const mat = new THREE.MeshPhysicalMaterial({
      roughness: 0.5,
      transmission: 0.8,
      transparent: true,
      thickness: 1,
      opacity: 0,
    });
    textProject = new THREE.Mesh(geometry, mat);
    textProject.rotation.y = Math.PI;
    textProject.rotation.x = Math.PI / 2;
    textProject.visible = false;
    scene.add(textProject);
  }
  doit();
};

// const addTeamText = () => {
//   const loader = new FontLoader();
//   // promisify font loading
//   function loadFont(url) {
//     return new Promise((resolve, reject) => {
//       loader.load(url, resolve, undefined, reject);
//     });
//   }
//   async function doit() {
//     const font = await loadFont("/Pixel_Regular.json");
//     // loader.load("/Sarala_Regular.json", (font) => {
//     const geometry = new TextGeometry("Team", {
//       font: font,
//       size: 1.4,

//       depth: 0.1,
//       curveSegments: 6,
//       // bevelEnabled: true,
//       bevelThickness: 0.05,
//       bevelSize: 0.01,
//       bevelOffset: 0,
//       bevelSegments: 2,
//     });

//     geometry.center();
//     const mat = new THREE.MeshPhysicalMaterial({
//       roughness: 0.5,
//       transmission: 1,
//       transparent: true,
//       thickness: 1,
//       opacity: 1,
//     });
//     // const mat = new THREE.MeshBasicMaterial({
//     //   color: "#ffffff",
//     // });
//     textFeatured = new THREE.Mesh(geometry, mat);
//     textFeatured.position.y = 50;
//     textFeatured.rotation.y = Math.PI;
//     textFeatured.rotation.x = Math.PI / 2;
//     scene.add(textFeatured);
//   }
//   doit();
// };

const gsapScroll = () => {
  gsap.registerPlugin(ScrollTrigger);

  // REMOVE SCROLL DOWN ARROW
  let arrowItems = document.querySelectorAll(".invisible");
  arrowItems.forEach((item) => {
    gsap.fromTo(
      item,
      { opacity: 1 },
      {
        scrollTrigger: {
          trigger: ".header",
          start: "top top",
          end: "80% top",
          scrub: 0,
        },
        opacity: 0,
      }
    );
  });

  gsap.fromTo(
    camera.position,
    {
      z: -50,
    },
    {
      scrollTrigger: {
        trigger: ".header",
        scrub: 0,
      },
      x: 0,
      y: 0,
      z: -45,
    }
  );

  gsap.fromTo(
    camera.position,
    {
      x: 0,
      y: 0,
      z: -45,
    },
    {
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: 0,
      },
      x: 0,
      y: 0,
      z: 10,
      ease: "power4.out",
    }
  );
  gsap.fromTo(
    camera.position,
    {
      z: 10,
    },
    {
      scrollTrigger: {
        trigger: ".hero",
        start: "bottom top",
        endTrigger: ".hero__bottom",
        end: "bottom top",
        scrub: 0,
      },
      z: 0,
      y: 20,
    }
  );
  gsap.fromTo(
    camera.rotation,
    {
      x: 0,
      y: 0,
      z: 0,
    },
    {
      scrollTrigger: {
        trigger: ".hero__bottom",
        start: "top top",
        end: "bottom center",
        scrub: 0,
      },
      x: -Math.PI / 2,
      ease: "none",
    }
  );

  // ROTATE 180 DEG (PART -1)
  gsap.to(camera.rotation, {
    scrollTrigger: {
      trigger: ".about-rotation",
      start: "top top",
      end: "bottom top",
      scrub: 0,
    },
    y: -Math.PI,
    ease: "power3.out",
  });

  // MOVING WITH ROTATION (PART -2)
  gsap.fromTo(
    camera.position,
    {
      x: 0,
      y: 20,
      z: 0,
    },
    {
      scrollTrigger: {
        trigger: ".about-rotation",
        start: "30% top",
        end: "bottom top",
        scrub: 0,
      },
      x: -5,
      y: 5,
      z: 10,
    }
  );

  // A DUMMY OBJECT
  var perctAbout = {
    percent: 0,
  };

  // GLOW EFFECT TO 'ABOUT'
  gsap.to(perctAbout, {
    scrollTrigger: {
      trigger: ".about-display",
      start: "top top",
      end: "65% top",
      scrub: 0,
      onUpdate: ({ progress, direction, isActive }) => {
        if (lineMaterialAbout) {
          lineMaterialAbout.dashOffset =
            totalDistanceLetterAbout * (1 - progress);
        }
      },
    },
    percent: 1,
  });

  // "ABOUT" WILL BE DISPLAYED FOR 40% AND THEN CAMERA WILL MOVE FORWARD
  gsap.fromTo(
    camera.position,
    {
      x: -5,
      y: 5,
      z: 10,
    },
    {
      scrollTrigger: {
        trigger: ".about-display",
        start: "60% top",
        end: "100% top",
        scrub: 0,
      },
      x: 15,
      y: 40,
      z: 10,
    }
  );

  // ROTATED BACK TOWARDS THE SPACE STATION
  gsap.to(
    {},
    {
      scrollTrigger: {
        trigger: ".about__bottom",
        // trigger: ".featured-start",
        start: "10% top",
        // endTrigger: ".featured-start",
        end: "bottom top",
        scrub: 0,
        onUpdate: (progress, direction, isActive) => {
          let value = progress.progress;
          camera.position.x = 6.5 * value + (1 - value) * 15;
          camera.position.y = 10.2 * value + (1 - value) * 40;
          camera.position.z = 5.2 * value + (1 - value) * 10;

          camera.rotation.x =
            -Math.PI * 1.35 * value - (1 - value) * (Math.PI / 2);
          camera.rotation.y = -(Math.PI * 1.2) * value - (1 - value) * Math.PI;
        },
      },
      // z: Math.PI,
    }
  );

  // EXPLODE THE SPACE STATION
  gsap.to(perctAbout, {
    scrollTrigger: {
      trigger: ".featured-middle", // Replace with your container
      start: "top top",
      end: "bottom top",
      scrub: 0, // Smooth scrubbing effect

      onUpdate: (progress) => {
        if (object) {
          let data = objectData;
          const positions = data.mesh.geometry.attributes.finalPosition;
          const initialPositions = data.mesh.geometry.attributes.position;

          const count = positions.count;
          // Update positions based on progress

          for (let i = 0; i < count; i++) {
            const origX = originalPositions[i * 3];
            const origY = originalPositions[i * 3 + 1];
            const origZ = originalPositions[i * 3 + 2];

            let targetX = positions.getX(i);
            let targetY = positions.getY(i);
            let targetZ = positions.getZ(i);

            // Interpolate between original and target positions
            initialPositions.setX(
              i,
              origX + (targetX - origX) * progress.progress
            );
            initialPositions.setY(
              i,
              origY + (targetY - origY) * progress.progress
            );
            initialPositions.setZ(
              i,
              origZ + (targetZ - origZ) * progress.progress
            );
          }

          // Mark positions for update
          initialPositions.needsUpdate = true;

          if (dancingSphere) {
            // dancingSphere.geometry.rea
          }
        }
      },
    },
    percent: 1,
  });

  // FADE-IN FEATURED TEXT AND FADE-OUT {ABOUT TEXT DURING EXPLOSING [NOTE: ITS NOT IMPORTANT TO ANIMATE]}, ]
  gsap.to(
    {},
    {
      scrollTrigger: {
        trigger: ".featured-middle",
        scrub: 1,
        start: "top top",
        end: "bottom top",
        onLeaveBack: () => {
          if (textAbout) textAbout.visible = true;
        },
        onUpdate: (self) => {
          if (textFeatured) {
            textFeatured.material.opacity =
              (self.progress - 0.24) * (4.16 * self.progress ** 3);
          }
          if (textAbout) {
            if (lineMaterialAbout) {
              textAbout.visible = false;
              lineMaterialAbout.dashOffset =
                totalDistanceLetterAbout * self.progress;
            }
          }
        },
      },
    }
  );

  // MOVE TO Y-AXIS (LOOKAT 0) AND START PERLIN NOISE
  gsap.fromTo(
    camera.position,
    {
      x: 6.5,
      y: 10.2,
      z: 5.2,
    },
    {
      scrollTrigger: {
        trigger: ".featured-display",
        start: "top top",
        endTrigger: ".featured",
        end: "80% top",
        scrub: 0,
        onUpdate: (self) => {
          camera.rotation.x =
            -Math.PI * 1.5 * self.progress -
            (1 - self.progress) * (Math.PI * 1.35);
          camera.rotation.y =
            -Math.PI * self.progress - (1 - self.progress) * (Math.PI * 1.2);
          // uniforms.u_opacity.value = (self.progress) ** 4;
        },
      },
      x: 0,
      y: 30,
      z: 0,
    }
  );

  // SHOW DANCING SPHERE
  gsap.fromTo(
    uniforms.u_opacity,
    {
      value: 0.0,
    },
    {
      scrollTrigger: {
        trigger: ".featured-display",
        start: "top top",
        end: "50% top",
        scrub: 0,
      },
      value: 0.01,
    }
  );

  // MOVE AWAY FROM SPHERE IN Y-AXIS
  gsap.fromTo(
    camera.position,
    {
      x: 0,
      y: 30,
      z: 0,
    },
    {
      scrollTrigger: {
        trigger: ".team-start",
        scrub: 0,
        start: "top top",
        end: "bottom top",
      },
      x: 0,
      y: 60,
      z: 0,
    }
  );

  // ADD PIXELATED EFFECT WITH SETpIXELrATIO - REMOVE 'FEATURED TEXT' - ADD 'PROJECTS TEXT' - REMOVE DANCING SPHERE
  gsap.to(
    {},
    {
      scrollTrigger: {
        trigger: ".team-start",
        scrub: 0,
        start: "top top",
        endTrigger: ".team",
        end: "bottom top",
        onEnter: () => {
          effectComposer.addPass(pixelatedPass);
          if (textProject) textProject.visible = true;
        },
        onLeaveBack: () => {
          effectComposer.removePass(pixelatedPass);
          if (textProject) textProject.visible = false;
        },

        onUpdate: (self) => {
          // if (progress >= 0.8) glitchPass.goWild = true;
          // else glitchPass.goWild = false;
          if (pixelatedPass) {
            pixelatedPass.setPixelSize(self.progress ** 2 * 200 + 1);
          }
          if (textFeatured) {
            textFeatured.material.opacity = 1 - self.progress;
          }
          if (textProject) {
            textProject.material.opacity = self.progress ** 2;
          }
          uniforms.u_opacity.value = 0.01 * (1 - self.progress) + 0.0;
        },
      },
    }
  );

  gsap.fromTo(
    camera.position,
    {
      x: 0,
      y: 60,
      z: 0,
    },
    {
      scrollTrigger: {
        trigger: ".team-end",
        scrub: 0,
        start: "top top",
        end: "bottom top",
      },
      x: 0,
      y: 15,
      z: 0,
    }
  );

  gsap.to(
    {},
    {
      scrollTrigger: {
        trigger: ".team-end",
        scrub: 0,
        end: "bottom top",
        onLeave: () => {
          effectComposer.removePass(pixelatedPass);
          if (textFeatured) textFeatured.visible = false;
        },
        onEnterBack: () => {
          effectComposer.addPass(pixelatedPass);
          if (textFeatured) textFeatured.visible = true;
        },
        onUpdate: (self) => {
          // if (progress >= 0.8) glitchPass.goWild = true;
          // else glitchPass.goWild = false;
          if (pixelatedPass) {
            pixelatedPass.setPixelSize(202 - self.progress * 200 + 1);
          }
        },
      },
    }
  );

  // START THE GLITCHING WARNING: IT MAY HARM SOME PEOPLE SO GIVE WARNING
  // gsap.to(effectComposer, {
  //   scrollTrigger: {
  //     trigger: ".featured-glitch",
  //     start: "20% top",
  //     end: "bottom top",
  //     onEnter: () => {
  //       effectComposer.addPass(glitchPass);
  //     },
  //     onLeaveBack: () => {
  //       effectComposer.removePass(glitchPass);
  //     },
  //     onLeave: () => {
  //       effectComposer.removePass(glitchPass);
  //     },
  //     onEnterBack: () => {
  //       effectComposer.addPass(glitchPass);
  //     },
  //     onUpdate: ({ progress, direction, isActive }) => {
  //       if (progress >= 0.8) glitchPass.goWild = true;
  //       else glitchPass.goWild = false;
  //     },
  //     scrub: 0,
  //   },
  // });
  // USE LATER
};

// OPTION DROPPED [WILL NOT BE USED]
const addWormHall = () => {
  var cameraRotationProxyX = 3.14159;
  var cameraRotationProxyY = 0;

  // GETTING POSITIONS FOR POINTS
  const geometry = new THREE.TubeGeometry(spline, 64, 1.8, 16, false);
  const tubeVertex = geometry.attributes.position;

  const pointGeometry = new THREE.BufferGeometry();
};

export default Three;
