// import * as THREE from "three";
import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  LoadingManager,
  TextureLoader,
  Vector2,
  Group,
  AmbientLight,
  Clock,
  BufferAttribute,
  SphereGeometry,
  BufferGeometry,
  Points,
  PointsMaterial,
  DynamicDrawUsage,
  ShaderMaterial,
  IcosahedronGeometry,
  Mesh,
  MathUtils,
  InstancedMesh,
  Object3D,
  MeshPhysicalMaterial,
  RepeatWrapping,
  PlaneGeometry,
  Vector3,
  MeshBasicMaterial,
} from "three";
import { Quaternion } from "three";

import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { DRACOLoader } from "three/examples/jsm/Addons.js";
import { FontLoader } from "three/examples/jsm/Addons.js";
import { TextGeometry } from "three/examples/jsm/Addons.js";

import { RenderPass } from "three/examples/jsm/Addons.js";
import { EffectComposer } from "three/examples/jsm/Addons.js";
import { UnrealBloomPass } from "three/examples/jsm/Addons.js";
import { RenderPixelatedPass } from "three/examples/jsm/Addons.js";

import { LineMaterial } from "three/examples/jsm/Addons.js";
import { LineGeometry } from "three/examples/jsm/Addons.js";
import { Line2 } from "three/examples/jsm/Addons.js";

import { Water } from "three/examples/jsm/Addons.js";
import { Sky } from "three/examples/jsm/Addons.js";

import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { MeshSurfaceSampler } from "three/examples/jsm/Addons.js";

let AMOUNT = 50000;
let camera, cameraFov;
let cameraHolder;
let ambientLight;
let scene;
let renderer;
let object,
  objectData = {},
  originalPositions;
let dancingSphere;
let effectComposer, pixelatedPass;
let star, closeStar;
let water, sky, endingEnv;

let pixelatedPixelSize = 20;
if (window.innerWidth < 640) {
  pixelatedPixelSize = 20;
} else if (window.innerWidth < 1280) {
  pixelatedPixelSize = 40;
} else {
  pixelatedPixelSize = 60;
}
// let bloomness =
let textAbout,
  strokeGroup,
  lineMaterialAbout,
  strokeMeshAbout,
  totalDistanceLetterAbout;
let textFeatured, textProject, textConclusion;
let overlay, overlayMaterial;

let loadingManager = new LoadingManager();

const dLoader = new DRACOLoader();
dLoader.setDecoderPath(
  "https://www.gstatic.com/draco/versioned/decoders/1.5.7/"
);
dLoader.setDecoderConfig({ type: "js" });

const uniforms = {
  u_resolution: {
    type: "v2",
    value: new Vector2(
      Math.max(Math.min(window.innerWidth, 1900), 375),
      Math.max(Math.min(window.innerHeight, 854), 812)
    ),
  },
  u_time: { type: "f", value: 5.0 },
  u_opacity: { type: "f", value: 0.0 },
  u_texture: {
    value: new TextureLoader().load("/effectImages/waternormals.jpg"),
  },
};

const loader = new FontLoader();
function loadFont(url) {
  return new Promise((resolve, reject) => {
    loader.load(url, resolve, undefined, reject);
  });
}

async function initializeFont() {
  const font = await loadFont("/Sarala_Regular.json");
  return font;
}
let currentPixelSize = Math.min(window.devicePixelRatio, 2);
const resetPixelation = () => {
  pixelatedPass.setPixelSize(Math.min(window.devicePixelRatio, 2));
  currentPixelSize = Math.min(window.devicePixelRatio, 2);
  if (effectComposer.passes.includes(pixelatedPass)) {
    effectComposer.removePass(pixelatedPass);
  }
};

const setCameraFov = () => {
  return (
    96 - ((Math.max(Math.min(1920, window.innerWidth), 320) - 320) * 21) / 1600
  );
};

const Three = () => {
  // const stats = new Stats();
  scene = new Scene();
  cameraFov = setCameraFov();
  console.log(cameraFov);
  camera = new PerspectiveCamera(
    cameraFov,
    window.innerWidth / window.innerHeight,
    0.3,
    1000
  );
  camera.position.set(0, 0, -45);

  cameraHolder = new Group();
  cameraHolder.add(camera);
  scene.add(cameraHolder);

  //   LIGHT
  ambientLight = new AmbientLight(0xffffff, 1.3);
  scene.add(ambientLight);

  //   RENDERER
  renderer = new WebGLRenderer({
    powerPreference: "low-power",
    antialias: false,
    stencil: false,
    depth: false,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  document.body.appendChild(renderer.domElement);

  // PASSES (AKA FILTERS)
  effectComposer = new EffectComposer(renderer);
  const rendererPass = new RenderPass(scene, camera);
  pixelatedPass = new RenderPixelatedPass(
    Math.min(window.devicePixelRatio, 2),
    scene,
    camera
  );
  pixelatedPass.setPixelSize(Math.min(window.devicePixelRatio, 2));
  // resetPixelation();

  const bloomPass = new UnrealBloomPass(
    new Vector2(window.innerWidth, window.innerHeight),
    0.75,
    0.1,
    0.1
  );
  effectComposer.addPass(rendererPass);
  effectComposer.addPass(bloomPass);
  effectComposer.setSize(window.innerWidth, window.innerHeight);

  // LoadingManager
  let percentageLoaded = document.querySelector(".loadingManager__percentage");
  let loadingManagerContainer = document.querySelector(
    ".loadingManager__container"
  );
  let heroTitle = document.querySelector(".hero__title path");
  loadingManager.onProgress = (url, Loaded, total) => {
    if (0.2 <= Loaded / total && Loaded / total < 0.9) {
      percentageLoaded.textContent =
        "0" + `${Math.trunc((Loaded / total) * 100)}`;
    } else if (Loaded / total >= 0.99)
      percentageLoaded.textContent = `${Math.trunc((Loaded / total) * 100)}`;
  };
  loadingManager.onLoad = () => {
    loadingManagerContainer.style.display = "none";
    document.body.style.overflowY = "auto";
    heroTitle.style.animation = "outline 2s ease-in both";
  };

  // ADD STARS
  addStars();

  // START GSAP
  gsapScroll();

  // ADD EYE EFFECT
  addEyeEffect();

  // ADD MODELS
  addPointModel();
  addDancingSphere();

  // ADD TEXT
  addAboutText();
  addFeaturedText();
  addProjectText();
  addConclusionText();

  // ADD WATER AND SKY
  addEndingScene();

  // Black overlay setup
  const overlayGeometry = new PlaneGeometry(10, 10); // Covers entire viewport
  overlayMaterial = new MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0,
  });
  overlayMaterial.depthWrite = false;
  overlayMaterial.depthTest = false;
  overlay = new Mesh(overlayGeometry, overlayMaterial);
  overlay.position.z = -1; // Position in front of camera
  overlay.visible = false;

  //   AUTO RENDER
  const clock = new Clock();
  function animate() {
    let value = clock.getDelta();
    if (
      uniforms.u_opacity.value > 0.0 ||
      (textConclusion && textConclusion.visible)
    )
      uniforms.u_time.value += value;
    if (water && endingEnv.visible) {
      water.material.uniforms["time"].value += value * 0.5;
    }
    effectComposer.render(0.1);
  }

  window.addEventListener("resize", onWindowResize);
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    console.log(setCameraFov());
    camera.fov = setCameraFov();
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    effectComposer.setSize(window.innerWidth, window.innerHeight);
    effectComposer.render(0.1);

    animate();
  }

  renderer.setAnimationLoop(animate);
};

const addEyeEffect = () => {
  let mouse = { x: 0, y: 0 };
  let effectEnabled = true;
  let cameraStartQuaternion = new Quaternion();
  const lookSensitivity = 0.0015;
  const dampingFactor = 0.01;
  let lastTouchX = 0;
  let lastTouchY = 0;
  let startTouchX = 0;
  let startTouchY = 0;
  let isTouching = false;
  let initialTouch = false;
  let isVerticalScroll = false;

  // Handle mouse movement
  function onMouseMove(event) {
    if (!effectEnabled || isTouching) return;
    mouse.x = (event.clientX - window.innerWidth / 2) * lookSensitivity;
    mouse.y = (event.clientY - window.innerHeight / 2) * lookSensitivity;
  }

  function onTouchStart(event) {
    if (!effectEnabled) return;
    isTouching = true;
    initialTouch = true;
    const touch = event.touches[0];
    startTouchX = touch.clientX;
    startTouchY = touch.clientY;
    lastTouchX = startTouchX;
    lastTouchY = startTouchY;
  }

  function onTouchMove(event) {
    if (!effectEnabled) return;
    const touch = event.touches[0];
    const currentX = touch.clientX;
    const currentY = touch.clientY;

    if (initialTouch) {
      const deltaXInitial = currentX - startTouchX;
      const deltaYInitial = currentY - startTouchY;
      if (
        Math.abs(deltaYInitial) > Math.abs(deltaXInitial) &&
        Math.abs(deltaYInitial) > 5
      ) {
        isVerticalScroll = true;
      } else {
        isVerticalScroll = false;
        event.preventDefault();
      }
      initialTouch = false;
    }

    if (isVerticalScroll) return; // Allow default scrolling

    event.preventDefault(); // Prevent default for camera movement

    const deltaX = currentX - lastTouchX;
    const deltaY = currentY - lastTouchY;

    mouse.x += deltaX * lookSensitivity;
    mouse.y += deltaY * lookSensitivity;

    mouse.x = Math.max(Math.min(mouse.x, 0.5), -0.5);
    mouse.y = Math.max(Math.min(mouse.y, 0.5), -0.5);

    lastTouchX = currentX;
    lastTouchY = currentY;
  }

  function onTouchEnd() {
    isTouching = false;
    initialTouch = false;
    isVerticalScroll = false;
    gsap.to(mouse, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: "power2.out",
    });
  }

  const neutralQuaternion = new Quaternion();
  const tempCamera = camera.clone();
  tempCamera.rotation.set(0, 0, 0);
  neutralQuaternion.copy(tempCamera.quaternion);

  gsap.to(
    {},
    {
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "80% top",
        scrub: 0,
        onEnter: () => {
          effectEnabled = false;
        },
        onLeaveBack: () => {
          effectEnabled = true;
        },
        onUpdate: (self) => {
          if (!effectEnabled) {
            camera.quaternion.slerpQuaternions(
              cameraStartQuaternion,
              neutralQuaternion,
              self.progress
            );
          }
        },
      },
    }
  );

  function updateCameraLook() {
    if (effectEnabled) {
      cameraStartQuaternion.copy(camera.quaternion);

      const lookTarget = new Vector3();
      camera.getWorldPosition(lookTarget);
      lookTarget.x += mouse.x;
      lookTarget.y -= mouse.y;
      lookTarget.z -= 1;

      const tempCamera = camera.clone();
      tempCamera.lookAt(lookTarget);

      camera.quaternion.slerpQuaternions(
        cameraStartQuaternion,
        tempCamera.quaternion,
        dampingFactor
      );
    }
    requestAnimationFrame(updateCameraLook);
  }

  function cleanup() {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("touchstart", onTouchStart);
    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("touchend", onTouchEnd);
  }

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("touchstart", onTouchStart);
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("touchend", onTouchEnd);
  updateCameraLook();

  return cleanup;
};

const addPointModel = () => {
  const loader = new GLTFLoader(loadingManager);
  loader.setDRACOLoader(dLoader);
  loader.load("/models/space_station_c.glb", (gltf) => {
    object = gltf.scene;
    // GETTING POSITION
    const positions = getInitalPosition(object, "position", 1.5);
    const targetPositions = createTargetPosition(15);
    createMesh(positions, targetPositions, scene, 1);
  });

  function getInitalPosition(model, name, scale = 1) {
    let geometries = [];
    model.traverse((child) => {
      if (child.isMesh) {
        let g = child.geometry.clone().toNonIndexed();
        for (let attribute in g.attributes) {
          if (attribute != name) {
            g.deleteAttribute(attribute);
          }
        }
        g.applyMatrix4(child.matrixWorld);
        geometries.push(g);
      }
    });
    let combinedGeometry = mergeGeometries(geometries)
      .center()
      .scale(scale, scale, scale);

    let material = new MeshBasicMaterial();
    let mesh = new Mesh(combinedGeometry, material);

    let sampler = new MeshSurfaceSampler(mesh).build();
    let pointsData = [];
    const position = new Vector3();

    for (let i = 0; i < AMOUNT; i++) {
      sampler.sample(position);
      position.add(new Vector3(-2, 0, 0));
      position.toArray(pointsData, i * 3);
    }

    return new BufferAttribute(new Float32Array(pointsData), 3);
  }

  function createTargetPosition(radius = 5, offset = [0, 0, 0]) {
    const sphereGeometry = new SphereGeometry(radius, 32, 32)
      .toNonIndexed()
      .center();

    const material = new MeshBasicMaterial();
    const mesh = new Mesh(sphereGeometry, material);
    const sampler = new MeshSurfaceSampler(mesh).build();
    let pointsData = [];
    const position = new Vector3();
    for (let i = 0; i < AMOUNT; i++) {
      sampler.sample(position);
      position.add(new Vector3(offset[0], offset[1], offset[2]));

      position.toArray(pointsData, i * 3);
    }
    return new BufferAttribute(new Float32Array(pointsData), 3);
  }

  function createMesh(
    positions,
    targetPositions,
    scene,
    scale = 1,
    x = 0,
    y = 0,
    z = 0,
    c = 0xffffff
  ) {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", positions.clone());
    geometry.setAttribute("finalPosition", targetPositions.clone());

    // TO OPTIMIZE PERFORMANCE
    geometry.attributes.position.setUsage(DynamicDrawUsage);

    const mesh = new Points(
      geometry,
      new PointsMaterial({ size: 0.02, color: c })
    );
    mesh.scale.x = mesh.scale.y = mesh.scale.z = scale;
    mesh.position.x = x;
    mesh.position.y = y;
    mesh.position.z = z;

    mesh.rotation.y = 0.6;
    mesh.rotation.z = -0.6;
    mesh.rotation.x = 0.6;
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
    // originalPositionSphere = new Float32Array(
    //   mesh.geometry.attributes.finalPosition.array
    // );
  }
};

const addDancingSphere = () => {
  const mat = new ShaderMaterial({
    wireframe: true,
    uniforms,
    transparent: true,
    vertexShader: document.getElementById("vertexshader").textContent,
    fragmentShader: document.getElementById("fragmentshader").textContent,
  });
  const geo = new IcosahedronGeometry(15, 15);
  dancingSphere = new Mesh(geo, mat);
  dancingSphere.visible = false;
  scene.add(dancingSphere);
};

const addStars = () => {
  // FAR STARS
  let farStars = 200;
  const geometry = new SphereGeometry(0.25, 8, 4);
  const material = new MeshBasicMaterial({ color: 0xffffff });
  star = new InstancedMesh(geometry, material, farStars);
  scene.add(star);
  const dummyStar = new Object3D();
  for (let i = 0; i < farStars; i++) {
    dummyStar.position.x = MathUtils.randFloatSpread(500);
    dummyStar.position.y = MathUtils.randFloatSpread(500);
    dummyStar.position.z = MathUtils.randFloatSpread(500);

    dummyStar.updateMatrix();

    star.setMatrixAt(i, dummyStar.matrix);
  }

  // CLOSE STARS
  let closeStars = 200;
  const closeStarGeometry = new SphereGeometry(0.1, 24, 12);
  const closeStarMaterial = new MeshBasicMaterial({ color: 0xffffff });
  closeStar = new InstancedMesh(
    closeStarGeometry,
    closeStarMaterial,
    closeStars
  );
  scene.add(closeStar);

  const closeDummyStar = new Object3D();
  for (let i = 0; i < closeStars; i++) {
    closeDummyStar.position.x = MathUtils.randFloatSpread(100);
    closeDummyStar.position.y = MathUtils.randFloatSpread(100);
    closeDummyStar.position.z = MathUtils.randFloatSpread(100);

    closeDummyStar.updateMatrix();

    closeStar.setMatrixAt(i, closeDummyStar.matrix);
  }
  star.matrixAutoUpdate = false;
  closeStar.matrixAutoUpdate = false;
};

const addAboutText = () => {
  async function doit(font) {
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
    const mat = new MeshPhysicalMaterial({
      roughness: 0.5,
      transmission: 1,
      transparent: true,
      thickness: 1,
    });
    textAbout = new Mesh(geometry, mat);
    textAbout.rotation.x = Math.PI / 2;
    textAbout.rotation.z = -Math.PI;
    textAbout.position.x = centerOffSet - 1;
    textAbout.position.y = 11;
    textAbout.position.z = 10;

    scene.add(textAbout);
    // textAbout.matrixAutoUpdate = false;

    // LETS CREATE ANIMATION
    strokeGroup = new Group();

    strokeGroup.userData.update = (t) => {
      strokeGroup.children.forEach((c) => {
        c.userData.update?.(t);
      });
    };

    strokeGroup.rotation.x = Math.PI / 2;
    strokeGroup.rotation.z = -Math.PI;
    strokeGroup.position.x = centerOffSet - 1;
    strokeGroup.position.y = 11 - 0.15;
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
  initializeFont().then((font) => {
    doit(font);
  });
};

const addFeaturedText = () => {
  async function doit(font) {
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
    const mat = new MeshPhysicalMaterial({
      roughness: 0.5,
      transmission: 0.98,
      transparent: true,
      thickness: 1,
      opacity: 0,
    });
    textFeatured = new Mesh(geometry, mat);
    textFeatured.rotation.y = Math.PI;
    textFeatured.rotation.x = Math.PI / 2;
    scene.add(textFeatured);
  }
  initializeFont().then((font) => {
    doit(font);
  });
};

const addProjectText = () => {
  async function doit(font) {
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
    const mat = new MeshPhysicalMaterial({
      roughness: 0.5,
      transmission: 0.8,
      transparent: true,
      thickness: 1,
      opacity: 0,
    });
    textProject = new Mesh(geometry, mat);
    textProject.rotation.y = Math.PI;
    textProject.rotation.x = Math.PI / 2;
    textProject.visible = false;
    scene.add(textProject);
  }
  initializeFont().then((font) => {
    doit(font);
  });
};

const addConclusionText = () => {
  async function doit(font) {
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
    const mat = new ShaderMaterial({
      uniforms,
      vertexShader: `
      varying vec2 vUv;
      uniform float u_time;
      void main() { 
        vUv = uv;
        float newPositionZ =  sin(position.z +u_time + 0.1);
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
    textConclusion = new Mesh(geometry, mat);
    textConclusion.rotation.y = Math.PI;
    textConclusion.rotation.x = Math.PI / 2;
    textConclusion.visible = false;
    scene.add(textConclusion);
  }
  initializeFont().then((font) => {
    doit(font);
  });
};

const addEndingScene = () => {
  endingEnv = new Group();

  // Water setup
  const waterGeometry = new PlaneGeometry(1000, 1000);
  const waterNormals = new TextureLoader().load(
    "/effectImages/waternormals.jpg"
  );
  waterNormals.wrapS = waterNormals.wrapT = RepeatWrapping;

  water = new Water(waterGeometry, {
    waterNormals,
    sunDirection: new Vector3(0, -1, 0), // Light from above
    sunColor: 0x3366ff, // Blue-tinted light
    waterColor: 0x001133, // Deeper blue color
    distortionScale: 3.7, // Increased distortion
    alpha: 0.0,
  });

  // water.material.sunDirection = new Vector3(0, 10, 0);

  water.material.transparent = true;
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -6, 0);
  endingEnv.add(water);

  sky = new Sky();
  sky.scale.setScalar(1000);
  endingEnv.add(sky);

  sky.material.uniforms.opacity = { type: "f", value: 0.0 };

  // CONSOLE.LOG SKY AND CHEKC MATERIAL->FRAGMENTSHADER->LAST FEW LINES
  const fragmentShader = sky.material.fragmentShader.replace(
    "varying vec3 vWorldPosition;",
    "varying vec3 vWorldPosition;\n\n\tuniform float opacity;"
  );

  const modifiedShader = fragmentShader.replace(
    "gl_FragColor = vec4( retColor, 1.0 );",
    "gl_FragColor = vec4( retColor, opacity );"
  );

  sky.material.fragmentShader = modifiedShader;
  sky.material.transparent = true;

  sky.material.uniforms["turbidity"].value = 10;
  sky.material.uniforms["rayleigh"].value = 0.01;
  sky.material.uniforms["mieCoefficient"].value = 0.005;
  sky.material.uniforms["mieDirectionalG"].value = 0.8;
  sky.material.uniforms["sunPosition"].value = new Vector3(0, 1000, -2000);

  // console.log(sky.material);

  // sky.material.uniforms["sunPosition"].value = new Vector3(0, -20, 2000);
  // const sunPosition = new Vector3(0, -17, 2000);
  // sunPosition.normalize(); // Important for consistent sun shape
  // sky.material.uniforms["sunPosition"].value.copy(sunPosition);

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
        onEnter: () => {
          if (dancingSphere) dancingSphere.visible = true;
        },
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
      // y: 50,
      y: 50,
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
          pixelatedPass.setPixelSize(Math.min(window.devicePixelRatio, 2));
          currentPixelSize = Math.min(window.devicePixelRatio, 2);

          if (dancingSphere) {
            gsap.fromTo(
              uniforms.u_opacity,
              {
                value: 0.01,
              },
              {
                scrollTrigger: {
                  trigger: ".team-start",
                  scrub: 0,
                  start: "top top",
                  end: "30% top",
                  onEnterBack: () => {
                    dancingSphere.visible = true;
                    resetPixelation();
                  },
                },
                value: 0,
                ease: "power2.inOut",
                onComplete: () => {
                  dancingSphere.visible = false;
                  if (!effectComposer.passes.includes(pixelatedPass)) {
                    effectComposer.addPass(pixelatedPass);
                  }
                },
              }
            );
          }
        },

        onUpdate: (self) => {
          if (effectComposer.passes.includes(pixelatedPass)) {
            const easedProgress = gsap.parseEase("power2.inOut")(self.progress);
            currentPixelSize =
              easedProgress ** 2 * pixelatedPixelSize +
              Math.min(window.devicePixelRatio, 2);
            pixelatedPass.setPixelSize(currentPixelSize);
          }
          if (textFeatured) {
            textFeatured.material.opacity = gsap.parseEase("power2.inOut")(
              1 - self.progress * 4
            );
          }
          if (textProject) {
            textProject.material.opacity = gsap.parseEase("power2.inOut")(
              self.progress
            );
          }
        },
        onEnterBack: () => {
          if (textProject) textProject.visible = false;
        },
      },
    }
  );

  // GET CAMERA TO Y: 15 FROM 60
  gsap.fromTo(
    camera.position,
    {
      x: 0,
      y: 50,
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
        start: "top top",
        end: "80% top",
        onEnter: () => {
          if (textProject) textProject.visible = true;
        },
        onLeave: () => {
          if (textFeatured) {
            textFeatured.material.opacity = 1; // Reset to default
            textFeatured.visible = false;
          }
          resetPixelation();
        },
        onEnterBack: () => {
          if (!effectComposer.passes.includes(pixelatedPass)) {
            effectComposer.addPass(pixelatedPass);
          }
          if (textFeatured) textFeatured.visible = true;
        },
        onUpdate: (self) => {
          if (pixelatedPass) {
            pixelatedPass.setPixelSize(
              (pixelatedPixelSize + Math.min(window.devicePixelRatio, 2)) *
                (1 - self.progress) +
                1
            );
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
        onLeave: (self) => {
          if (textProject) textProject.visible = false;
          // if (scene) scene.background = new Color("#001633");
        },
        onLeaveBack: (self) => {
          if (textProject) textProject.visible = true;
          // if (scene) scene.background = null;
        },
      },
    }
  );

  let achievements = document.querySelector(".achievements");
  // ENABEL POINTER EVENTS ACHIEVEMENTS SECTION
  gsap.to(
    {},
    {
      scrollTrigger: {
        trigger: ".model__container",
        start: "top bottom",
        end: "bottom top",
        scrub: 0,
        onEnter: () => {
          // if (dancer) dancer.visible = true;
          achievements.style.pointerEvents = "all";
        },
        onEnterBack: () => {
          // if (dancer) dancer.visible = true;
          achievements.style.pointerEvents = "all";
        },
        onLeave: () => {
          // if (dancer) dancer.visible = false;
          achievements.style.pointerEvents = "none";
        },
        onLeaveBack: () => {
          // if (dancer) dancer.visible = false;
          achievements.style.pointerEvents = "none";
        },
      },
    }
  );

  // ADD CONCLUSION TEXT
  gsap.to(
    {},
    {
      scrollTrigger: {
        trigger: ".model__container",
        start: "top center",
        end: "bottom top",
        scrub: true,
        onEnter: () => {
          if (textConclusion) textConclusion.visible = true;
        },
        onLeaveBack: () => {
          if (textConclusion) textConclusion.visible = false;
        },
      },
    }
  );

  // GET THE WATER APPEAR
  gsap.to(
    {},
    {
      scrollTrigger: {
        trigger: ".sea__thirdLayer",
        start: "top top",
        end: "bottom top",
        scrub: true,
        onEnter: () => {
          if (endingEnv) endingEnv.visible = true;
        },
        onLeaveBack: () => {
          if (endingEnv) endingEnv.visible = false;
        },
        onUpdate: (self) => {
          if (water)
            water.material.uniforms["alpha"].value = Math.sin(
              self.progress * (1.57 - 0.2)
            );
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
        trigger: ".conclusion-rotation",
        scrub: 0,
        start: "top top",
        end: "bottom top",
        onLeaveBack: () => {
          if (sky) sky.material.uniforms["opacity"].value = 0;
        },
        onEnter: () => {
          if (sky) sky.material.uniforms["opacity"].value = 0;
        },
        onUpdate: (self) => {
          camera.rotation.x =
            -Math.PI * 1.5 * (1 - self.progress ** 3) +
            Math.PI * 0.05 * self.progress ** 3;
          // LETS MAKE SKY APPEAR
          if (self.progress >= 0.5 && sky) {
            sky.material.uniforms["opacity"].value = 2 * (self.progress - 0.5);
          }
        },
      },
      x: 10,
      y: 5,
      z: -200,
    }
  );

  // SCENE FADE OUT
  gsap.to(
    {},
    {
      scrollTrigger: {
        trigger: ".conclusion",
        start: "top top",
        // end: "bottom top",
        // scrub: 0,
        onEnter: () => {
          if (overlay) {
            overlay.visible = true;
            camera.add(overlay);
          }
        },
        onLeaveBack: () => {
          if (overlay) {
            overlay.visible = false;
            camera.remove(overlay);
          }
        },
      },
    }
  );

  gsap.to(
    {},
    {
      scrollTrigger: {
        trigger: ".conclusion",
        start: "30% top",
        endTrigger: ".fade__out",
        end: "bottom top",
        // scrub: 0,
        onUpdate: (self) => {
          if (overlay) {
            const easedProgress = gsap.parseEase("power2.inOut")(self.progress);
            overlay.material.opacity = easedProgress;
          }
        },
      },
    }
  );
};

export default Three;
