import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { Quaternion } from "three";

import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { DRACOLoader } from "three/examples/jsm/Addons.js";
import { FontLoader } from "three/examples/jsm/Addons.js";
import { TextGeometry } from "three/examples/jsm/Addons.js";

import { RenderPass } from "three/examples/jsm/Addons.js";
import { EffectComposer } from "three/examples/jsm/Addons.js";
import { UnrealBloomPass } from "three/examples/jsm/Addons.js";
import { RenderPixelatedPass } from "three/examples/jsm/Addons.js";
import { GlitchPass } from "three/examples/jsm/Addons.js";

import { LineMaterial } from "three/examples/jsm/Addons.js";
import { LineGeometry } from "three/examples/jsm/Addons.js";
import { Line2 } from "three/examples/jsm/Addons.js";

import { Water } from "three/examples/jsm/Addons.js";
import { Sky } from "three/examples/jsm/Addons.js";

import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import Stats from "three/examples/jsm/libs/stats.module.js";

let camera;
let cameraHolder;
let scene;
let renderer;
let object,
  objectData = {},
  originalPositions,
  originalPositionSphere;
let dancingSphere;
let glitchPass, effectComposer, pixelatedPass;
let mixer, dancer;
let star, closeStar;
let water, sky, endingEnv;
let jackShip,
  mixerShip,
  actionShip,
  turn = "left";

let textAbout,
  strokeGroup,
  lineMaterialAbout,
  strokeMeshAbout,
  totalDistanceLetterAbout;
let textFeatured, textProject, textConclusion;

const dLoader = new DRACOLoader();
dLoader.setDecoderPath(
  "https://www.gstatic.com/draco/versioned/decoders/1.5.7/"
);
dLoader.setDecoderConfig({ type: "js" });

const uniforms = {
  u_resolution: {
    type: "v2",
    value: new THREE.Vector2(window.innerWidth, window.innerHeight),
  },
  u_time: { type: "f", value: 5.0 },
  u_opacity: { type: "f", value: 0.0 },
  u_texture: {
    value: new THREE.TextureLoader().load("/effectImages/ripple.png"),
  },
};

const loader = new FontLoader();
function loadFont(url) {
  return new Promise((resolve, reject) => {
    loader.load(url, resolve, undefined, reject);
  });
}
const font = await loadFont("/Sarala_Regular.json");

const Three = () => {
  const stats = new Stats();
  document.body.appendChild(stats.dom);

  scene = new THREE.Scene();
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
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  // PASSES (AKA FILTERS)
  effectComposer = new EffectComposer(renderer);
  const rendererPass = new RenderPass(scene, camera);
  glitchPass = new GlitchPass();
  pixelatedPass = new RenderPixelatedPass(
    window.devicePixelRatio,
    scene,
    camera
  );
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
  addStars();

  // START GSAP
  gsapScroll();

  // ADD EYE EFFECT
  // addEyeEffect();

  // ADD MODELS
  addPointModel();
  addDancingSphere();
  addDomModel();
  addShipModel();

  // ADD TEXT
  addAboutText();
  addFeaturedText();
  addProjectText();
  addConclusionText();

  // ADD WATER AND SKY
  addEndingScene();

  //   AUTO RENDER
  // window.scrollTo({ top: 0, behavior: "smooth" }); NOT WORKING!!!
  const clock = new THREE.Clock();
  function animate() {
    stats.update();
    let value = clock.getDelta();
    if (uniforms.u_opacity.value > 0.0) uniforms.u_time.value += value;
    if (water && endingEnv.visible) {
      water.material.uniforms["time"].value += value * 0.5;
    }
    // if (mixerShip && jackShip.visible) {
    //   mixerShip.update(value);

    //   if (turn === "left") {
    //     jackShip.rotation.z -= Math.cos(value) * 0.001 * Math.random();
    //     if (jackShip.rotation.z <= -0.1 - Math.random() * 0.1) {
    //       turn = "right";
    //     }
    //   }
    //   if (turn === "right") {
    //     jackShip.rotation.z += Math.cos(value) * 0.001 * Math.random();
    //     if (jackShip.rotation.z >= 0.1 + Math.random() * 0.1) {
    //       turn = "left";
    //     }
    //   }

    //   jackShip.position.z += Math.sin(value);
    // }
    // Optimize ship animations with delta-based updates
    if (mixerShip && jackShip.visible) {
      mixerShip.update(value);

      // Cache values to avoid recalculation
      const rotationSpeed = Math.cos(value) * 0.001;
      const randomFactor = Math.random() * 0.1;

      if (turn === "left") {
        jackShip.rotation.z -= rotationSpeed * Math.random();
        if (jackShip.rotation.z <= -0.1 - randomFactor) {
          turn = "right";
        }
      } else {
        jackShip.rotation.z += rotationSpeed * Math.random();
        if (jackShip.rotation.z >= 0.1 + randomFactor) {
          turn = "left";
        }
      }

      jackShip.position.z += Math.sin(value);
    }
    if (mixer && dancer.visible) mixer.update(value);
    effectComposer.render(0.1);
  }
  window.addEventListener("resize", onWindowResize, true);
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    effectComposer.setSize(window.innerWidth, window.innerHeight);
    animate();
  }

  renderer.setAnimationLoop(animate);
};

// I DON'T UNDERSTAND THIS FULLY
const addEyeEffect = () => {
  // Mouse and camera state tracking
  let mouse = { x: 0, y: 0 };
  let isAtTop = true;
  let isTransitioning = false;
  let effectEnabled = true;
  let cameraStartQuaternion = new THREE.Quaternion();
  const lookSensitivity = 0.0015;
  const dampingFactor = 0.05;
  const transitionDuration = 1.0; // seconds
  let transitionStartTime = 0;

  // Track mouse movement
  function onMouseMove(event) {
    if (!effectEnabled) return;

    mouse.x = (event.clientX - window.innerWidth / 2) * lookSensitivity;
    mouse.y = (event.clientY - window.innerHeight / 2) * lookSensitivity;
  }

  // Handle scroll events
  function onScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const wasAtTop = isAtTop;
    isAtTop = scrollTop < 10; // Small threshold for "at top"

    // Detect when we start scrolling away from top
    if (wasAtTop && !isAtTop && effectEnabled) {
      disableEffect();
    }
    // Detect when we return to top
    else if (!wasAtTop && isAtTop && !effectEnabled) {
      enableEffect();
    }
  }

  function enableEffect() {
    effectEnabled = true;
    mouse.x = 0;
    mouse.y = 0;
  }

  function disableEffect() {
    effectEnabled = false;
    isTransitioning = true;
    transitionStartTime = performance.now();
  }

  // Add the look-around effect
  function updateCameraLook() {
    if (effectEnabled) {
      // Store current camera state
      cameraStartQuaternion.copy(camera.quaternion);

      // Create look target
      const lookTarget = new THREE.Vector3();
      camera.getWorldPosition(lookTarget);
      lookTarget.x += mouse.x;
      lookTarget.y -= mouse.y;
      lookTarget.z -= 1;

      // Create temporary camera for look rotation
      const tempCamera = camera.clone();
      tempCamera.lookAt(lookTarget);

      // Smoothly interpolate to look rotation
      camera.quaternion.slerpQuaternions(
        cameraStartQuaternion,
        tempCamera.quaternion,
        dampingFactor
      );
    } else if (isTransitioning) {
      // Handle transition back to neutral rotation
      const elapsed = (performance.now() - transitionStartTime) / 1000;
      const progress = Math.min(elapsed / transitionDuration, 1);

      // Create target quaternion (neutral rotation)
      const targetQuaternion = new THREE.Quaternion();
      const tempCamera = camera.clone();
      tempCamera.rotation.set(0, 0, 0);
      targetQuaternion.copy(tempCamera.quaternion);

      // Interpolate to neutral rotation
      camera.quaternion.slerpQuaternions(
        cameraStartQuaternion,
        targetQuaternion,
        progress
      );

      // Check if transition is complete
      if (progress === 1) {
        isTransitioning = false;
      }
    }

    requestAnimationFrame(updateCameraLook);
  }

  // Cleanup when needed
  function cleanup() {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("scroll", onScroll);
  }

  // Setup
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("scroll", onScroll);
  updateCameraLook();
};

const addPointModel = () => {
  const loader = new GLTFLoader();
  loader.setDRACOLoader(dLoader);
  loader.load("/models/space_station_c.glb", (gltf) => {
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
  // FAR STARS
  let farStars = 200;
  const geometry = new THREE.SphereGeometry(0.25, 8, 4);
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
  star = new THREE.InstancedMesh(geometry, material, farStars);
  scene.add(star);
  const dummyStar = new THREE.Object3D();
  for (let i = 0; i < farStars; i++) {
    dummyStar.position.x = THREE.MathUtils.randFloatSpread(500);
    dummyStar.position.y = THREE.MathUtils.randFloatSpread(500);
    dummyStar.position.z = THREE.MathUtils.randFloatSpread(500);

    dummyStar.updateMatrix();

    star.setMatrixAt(i, dummyStar.matrix);
  }

  // CLOSE STARS
  let closeStars = 200;
  const closeStarGeometry = new THREE.SphereGeometry(0.1, 24, 12);
  const closeStarMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  closeStar = new THREE.InstancedMesh(
    closeStarGeometry,
    closeStarMaterial,
    closeStars
  );
  scene.add(closeStar);

  const closeDummyStar = new THREE.Object3D();
  for (let i = 0; i < closeStars; i++) {
    closeDummyStar.position.x = THREE.MathUtils.randFloatSpread(100);
    closeDummyStar.position.y = THREE.MathUtils.randFloatSpread(100);
    closeDummyStar.position.z = THREE.MathUtils.randFloatSpread(100);

    closeDummyStar.updateMatrix();

    closeStar.setMatrixAt(i, closeDummyStar.matrix);
  }
};

const addDomModel = () => {
  const loader = new GLTFLoader();
  loader.setDRACOLoader(dLoader);
  loader.load("/models/space_dance_c.glb", (gltf) => {
    dancer = gltf.scene;
    scene.add(dancer);
    dancer.scale.x = dancer.scale.y = dancer.scale.z = 2;
    dancer.rotation.x = -Math.PI / 2;
    dancer.rotation.z = Math.PI;
    dancer.position.y = 6;
    dancer.visible = false;
    mixer = new THREE.AnimationMixer(dancer);
    mixer.clipAction(gltf.animations[0]).play();
  });
};

const addShipModel = () => {
  const loader = new GLTFLoader();
  loader.setDRACOLoader(dLoader);
  loader.load(
    "/models/jack_ship_c.glb",
    (gltf) => {
      jackShip = gltf.scene;
      jackShip.rotation.y = Math.PI * 1.2;
      jackShip.position.y = -13;
      jackShip.position.x = 10;
      // jackShip.scale.x = jackShip.scale.y = jackShip.scale.z = 0.5;
      let animations = gltf.animations[0];
      mixerShip = new THREE.AnimationMixer(jackShip);
      actionShip = mixerShip.clipAction(animations);
      actionShip.play();
      endingEnv.add(jackShip);
      jackShip.visible = false;
    },
    undefined,
    undefined
  );
};

const addAboutText = () => {
  async function doit() {
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
  async function doit() {
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
  async function doit() {
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

const addConclusionText = () => {
  async function doit() {
    const geometry = new TextGeometry("Conclusion", {
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
    const mat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
      varying vec2 vUv;
      uniform float u_time;
      void main() { 
        vUv = uv;
        float newPositionZ =  sin(position.z +u_time);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position.x, position.y, newPositionZ, 1.0);
        }
      `,
      fragmentShader: `
      uniform sampler2D u_texture;
      varying vec2 vUv;
      uniform float u_time;
      void main() {
        vec4 color = texture2D(u_texture, vUv);
        gl_FragColor = vec4(color.rgb, 0.5);
        }
      `,
      // opacity: 0,
    });
    textConclusion = new THREE.Mesh(geometry, mat);
    textConclusion.rotation.y = Math.PI;
    textConclusion.rotation.x = Math.PI / 2;
    textConclusion.visible = false;
    scene.add(textConclusion);
  }
  doit();
};

const addEndingScene = () => {
  endingEnv = new THREE.Group();

  // Water setup
  const waterGeometry = new THREE.PlaneGeometry(1000, 1000);
  const waterNormals = new THREE.TextureLoader().load(
    "/effectImages/waternormals.jpg"
  );
  waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;

  water = new Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals,
    sunDirection: new THREE.Vector3(0, -1, 0), // Light from above
    sunColor: 0x3366ff, // Blue-tinted light
    waterColor: 0x001133, // Deeper blue color
    distortionScale: 3.7, // Increased distortion
  });
  // water.material.side = THREE.DoubleSide;

  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -8, -520);
  endingEnv.add(water);

  // Sky setup
  sky = new Sky();
  sky.scale.setScalar(10000);
  endingEnv.add(sky);

  sky.material.uniforms["turbidity"].value = 0.1;
  sky.material.uniforms["rayleigh"].value = 0.01;
  sky.material.uniforms["mieCoefficient"].value = 0.0005;
  sky.material.uniforms["mieDirectionalG"].value = 0.8;
  sky.material.uniforms["sunPosition"].value = new THREE.Vector3(
    0,
    1000,
    -2000
  );
  // sky.material.wireframe = true;
  sky.position.y = 50;
  scene.add(endingEnv);
  endingEnv.visible = false;
};

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

  // CAMERA MOVES BACKWARD [TRIGGER: HEADER]
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

  // MOVE TO Y-AXIS (LOOKAT 0) + ROTATION
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
          if (pixelatedPass) {
            pixelatedPass.setPixelSize(
              self.progress ** 2 * 200 + window.devicePixelRatio
            );
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

  // GET CAMERA TO Y: 15 FROM 60
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

  // REMOVE PIXELATED EFFECT
  gsap.to(
    {},
    {
      scrollTrigger: {
        trigger: ".team-end",
        scrub: 0,
        end: "80% top",
        onLeave: () => {
          effectComposer.removePass(pixelatedPass);
          if (textFeatured) textFeatured.visible = false;
        },
        onEnterBack: () => {
          effectComposer.addPass(pixelatedPass);
          if (textFeatured) textFeatured.visible = true;
        },
        onUpdate: (self) => {
          if (pixelatedPass) {
            pixelatedPass.setPixelSize(202 - self.progress * 200 + 1);
          }
        },
      },
    }
  );

  // REMOVE THE PROJECT TEXT
  gsap.to(
    {},
    {
      scrollTrigger: {
        trigger: ".project",
        start: "top top",
        end: "bottom top",
        onEnter: (self) => {
          if (textProject) textProject.visible = false;
          // if (scene) scene.background = new THREE.Color("#000c1a");
          if (scene) scene.background = new THREE.Color("#001633");
        },
        onLeaveBack: (self) => {
          if (textProject) textProject.visible = true;
          if (scene) scene.background = null;
        },
      },
    }
  );

  let achievements = document.querySelector(".achievements");
  // MOVE THE DANCER THE THE ACHIEVEMENTS SECTION
  gsap.to(
    {},
    {
      scrollTrigger: {
        trigger: ".model__container",
        start: "top bottom",
        end: "bottom top",
        scrub: 0,
        onEnter: () => {
          if (dancer) dancer.visible = true;
          achievements.style.pointerEvents = "all";
        },
        onEnterBack: () => {
          if (dancer) dancer.visible = true;
          achievements.style.pointerEvents = "all";
        },
        onLeave: () => {
          if (dancer) dancer.visible = false;
          achievements.style.pointerEvents = "none";
        },
        onLeaveBack: () => {
          if (dancer) dancer.visible = false;
          achievements.style.pointerEvents = "none";
        },
        onUpdate: (self) => {
          if (dancer) {
            dancer.position.z = -10 * (1 - self.progress) + 8 * self.progress;
          }
        },
      },
    }
  );

  const sun = document.querySelector(".sun");
  const sky = document.querySelector(".sky");
  const sunSet = document.querySelector(".sunSet");
  const sunDay = document.querySelector(".sunDay");
  const horizon = document.querySelector(".horizon");
  const moon = document.querySelector(".moon");
  const horizonNight = document.querySelector(".horizonNight");

  // DAY TO SUNSET
  gsap.to(
    {},
    {
      scrollTrigger: {
        trigger: ".project",
        start: "bottom top",
        endTrigger: ".achievements",
        end: "20% top",
        scrub: true,
        onUpdate: (self) => {
          let sunSetTime = 0.3;
          if (self.progress < 0.5)
            sun.style.setProperty("--sunMeter", self.progress);

          sun.style.opacity = 0.1 * (1 - self.progress) + 0.8 * self.progress;

          sky.style.opacity = 0.52 * (1 - self.progress) + 0.1 * self.progress;
          if (self.progress > sunSetTime)
            sunSet.style.opacity =
              ((self.progress - sunSetTime) / (1 - sunSetTime)) * 0.3;
          sunDay.style.opacity = self.progress * 0.5 * 0.5;
          horizon.style.opacity = self.progress * 0.99;
        },
      },
    }
  );

  // SUNSET TO NIGHT
  gsap.to(
    {},
    {
      scrollTrigger: {
        trigger: ".achievements",
        start: "25% top",

        end: "bottom top",
        scrub: true,
        onUpdate: (self) => {
          sun.style.opacity = 0.8 * (1 - self.progress) + 0.01 * self.progress;

          moon.style.opacity = 0.85 * self.progress;
          sunSet.style.opacity = 0.3 * (1 - self.progress);
          sunDay.style.opacity = 0.25 * (1 - self.progress);
          horizon.style.opacity = 0.99 * (1 - self.progress);
          horizonNight.style.opacity = 0.8 * self.progress;
        },
        onLeave: (self) => {
          if (textConclusion) {
            textConclusion.visible = true;
          }
        },
        onEnterBack: (self) => {
          if (textConclusion) textConclusion.visible = false;
        },
      },
    }
  );

  // GET THE WATER BELOW SEA
  gsap.to(
    {},
    {
      scrollTrigger: {
        trigger: ".sea__firstLayer",
        start: "center bottom",
        end: "bottom top",
        scrub: 0,
        onEnter: (self) => {
          if (endingEnv) endingEnv.visible = true;
        },
        onLeaveBack: (self) => {
          if (endingEnv) endingEnv.visible = false;
        },
        onUpdate: (self) => {
          if (endingEnv) {
            water.position.z = -520 * (1 - self.progress) - 480 * self.progress;
          }
        },
      },
    }
  );

  // ROTATION
  gsap.fromTo(
    camera.position,
    {
      x: 0,
      y: 15,
      z: 0,
    },
    {
      scrollTrigger: {
        trigger: ".sea__thirdLayer",
        scrub: 0,
        start: "center top",
        end: "bottom top",
        onUpdate: (self) => {
          camera.rotation.x =
            -Math.PI * 1.5 * (1 - self.progress) +
            Math.PI * 0.05 * self.progress;
          // camera.rotation.y =
          //   -Math.PI * self.progress - (1 - self.progress) * (Math.PI * 1.2);
        },
      },
      x: 100,
      y: 5,
      z: -400,
    }
  );

  // MAKE THE SHIP MODEL APPEAR
  gsap.to(
    {},
    {
      scrollTrigger: {
        trigger: ".conclusion",
        start: "center bottom",
        end: "bottom top",
        onEnter: (self) => {
          if (jackShip) jackShip.visible = true;
        },
        onLeaveBack: (self) => {
          if (jackShip) jackShip.visible = false;
        },
      },
    }
  );
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
