import * as THREE from "three";
import { CSS2DObject, CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const MODEL_SCALE = 0.03;
const DEFAULT_SIZE = [80, 80, 13];
const PAPER_COLOR = 0xf4f1e8;
const ORANGE = 0xf27a0a;

function lineBetween(start, end, material, radius = 0.018) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const line = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, direction.length(), 10),
    material,
  );
  line.position.copy(start).add(end).multiplyScalar(0.5);
  line.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  return line;
}

function arrowHead(position, direction, material) {
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.24, 16), material);
  head.position.copy(position);
  head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  return head;
}

function doubleArrow(start, end, material) {
  const arrow = new THREE.Group();
  arrow.add(lineBetween(start, end, material));
  arrow.add(arrowHead(start, start.clone().sub(end), material));
  arrow.add(arrowHead(end, end.clone().sub(start), material));
  return arrow;
}

function measurementLabel(text, position) {
  const element = document.createElement("span");
  element.className = "thermal-measure-label";
  element.textContent = text;
  const label = new CSS2DObject(element);
  label.position.copy(position);
  return label;
}

function createRoll([diameter, width, coreDiameter]) {
  const OUTER_RADIUS = diameter * MODEL_SCALE / 2;
  const CORE_RADIUS = coreDiameter * MODEL_SCALE / 2;
  const ROLL_WIDTH = width * MODEL_SCALE;
  const roll = new THREE.Group();
  roll.name = "thermal-roll";

  const paper = new THREE.MeshStandardMaterial({
    color: PAPER_COLOR,
    roughness: 0.88,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  const paperEdge = new THREE.MeshStandardMaterial({
    color: 0xe4e0d6,
    roughness: 0.96,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  const cardboard = new THREE.MeshStandardMaterial({
    color: 0x9a7452,
    roughness: 1,
    metalness: 0,
    side: THREE.DoubleSide,
  });

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(OUTER_RADIUS, OUTER_RADIUS, ROLL_WIDTH, 128, 1, true),
    paper,
  );
  body.rotation.z = Math.PI / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  roll.add(body);

  [-1, 1].forEach((side) => {
    const face = new THREE.Mesh(
      new THREE.RingGeometry(CORE_RADIUS, OUTER_RADIUS, 128, 12),
      paperEdge,
    );
    face.rotation.y = Math.PI / 2;
    face.position.x = side * ROLL_WIDTH / 2;
    face.castShadow = true;
    roll.add(face);

    const coreRim = new THREE.Mesh(
      new THREE.RingGeometry(CORE_RADIUS * 0.78, CORE_RADIUS, 64),
      cardboard,
    );
    coreRim.rotation.y = Math.PI / 2;
    coreRim.position.x = side * (ROLL_WIDTH / 2 + 0.012);
    roll.add(coreRim);
  });

  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(CORE_RADIUS * 0.78, CORE_RADIUS * 0.78, ROLL_WIDTH + 0.04, 64, 1, true),
    cardboard,
  );
  core.rotation.z = Math.PI / 2;
  roll.add(core);

  // Finas bandas en el canto sugieren las capas de papel sin usar texturas ni imágenes.
  const rings = new THREE.Group();
  for (let radius = CORE_RADIUS + 0.08; radius < OUTER_RADIUS; radius += 0.105) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius, radius + 0.012, 96),
      new THREE.MeshBasicMaterial({ color: 0xcac5b9, transparent: true, opacity: 0.42, side: THREE.DoubleSide }),
    );
    ring.rotation.y = Math.PI / 2;
    ring.position.x = ROLL_WIDTH / 2 + 0.018;
    rings.add(ring);
  }
  roll.add(rings);

  const measureMaterial = new THREE.MeshBasicMaterial({
    color: ORANGE,
    transparent: true,
    opacity: 1,
    depthTest: false,
  });
  const measures = new THREE.Group();
  measures.name = "roll-measures";
  measures.renderOrder = 10;

  const frontX = ROLL_WIDTH / 2 + 0.16;
  const diameterOffset = -OUTER_RADIUS - 0.38;
  const diameterStart = new THREE.Vector3(frontX, -OUTER_RADIUS, diameterOffset);
  const diameterEnd = new THREE.Vector3(frontX, OUTER_RADIUS, diameterOffset);
  measures.add(doubleArrow(diameterStart, diameterEnd, measureMaterial));
  measures.add(lineBetween(
    new THREE.Vector3(frontX, -OUTER_RADIUS, 0),
    diameterStart,
    measureMaterial,
    0.012,
  ));
  measures.add(lineBetween(
    new THREE.Vector3(frontX, OUTER_RADIUS, 0),
    diameterEnd,
    measureMaterial,
    0.012,
  ));
  const diameterLabel = measurementLabel("DIÁMETRO EXTERIOR", new THREE.Vector3(frontX, OUTER_RADIUS + 0.2, diameterOffset));
  measures.add(diameterLabel);

  const widthY = -OUTER_RADIUS - 0.34;
  const widthStart = new THREE.Vector3(-ROLL_WIDTH / 2, widthY, 0);
  const widthEnd = new THREE.Vector3(ROLL_WIDTH / 2, widthY, 0);
  measures.add(doubleArrow(widthStart, widthEnd, measureMaterial));
  const widthLabel = measurementLabel("ANCHO", new THREE.Vector3(0, widthY - 0.18, 0));
  measures.add(widthLabel);

  const coreX = ROLL_WIDTH / 2 + 0.08;
  const coreZ = 0;
  const coreStart = new THREE.Vector3(coreX, -CORE_RADIUS * 0.78, coreZ);
  const coreEnd = new THREE.Vector3(coreX, CORE_RADIUS * 0.78, coreZ);
  const coreArrow = doubleArrow(coreStart, coreEnd, measureMaterial);
  measures.add(coreArrow);
  const coreLabel = measurementLabel("TUCO", new THREE.Vector3(coreX, -CORE_RADIUS - 0.24, coreZ));
  measures.add(coreLabel);

  roll.add(measures);
  return {
    roll,
    measures,
    measureMaterial,
    dimensions: [diameter, width, coreDiameter],
    labels: { diameter: diameterLabel.element, width: widthLabel.element, core: coreLabel.element },
  };
}

export function initThermalRoll3D() {
  const section = document.querySelector(".roll-measure-section");
  const stage = document.querySelector("#thermal-roll-stage");
  const canvasHost = stage?.querySelector(".thermal-roll-canvas");
  const interactionHint = stage?.querySelector(".thermal-roll-hint");
  const mobileToggle = stage?.querySelector(".mobile-3d-toggle");
  if (!section || !stage || !canvasHost) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0.15, 10.7);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  canvasHost.appendChild(renderer.domElement);

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.className = "thermal-label-layer";
  canvasHost.appendChild(labelRenderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.enableZoom = true;
  controls.enablePan = false;
  controls.rotateSpeed = 0.65;
  controls.zoomSpeed = 0.75;
  controls.minDistance = 6.4;
  controls.maxDistance = 13.2;
  controls.minPolarAngle = Math.PI * 0.18;
  controls.maxPolarAngle = Math.PI * 0.82;
  const mobileInteraction = window.matchMedia("(max-width: 600px)");
  let mobile3DActive = false;
  function configureTouchControls() {
    controls.touches.ONE = THREE.TOUCH.ROTATE;
    controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
    controls.enabled = !mobileInteraction.matches || mobile3DActive;
    stage.classList.toggle("mobile-3d-active", mobileInteraction.matches && mobile3DActive);
    if (mobileToggle) {
      mobileToggle.hidden = !mobileInteraction.matches;
      mobileToggle.classList.toggle("active", mobile3DActive);
      mobileToggle.setAttribute("aria-pressed", String(mobile3DActive));
      mobileToggle.innerHTML = mobile3DActive ? "<span>×</span> Terminar" : "<span>↻</span> Mover 3D";
    }
  }
  configureTouchControls();
  mobileInteraction.addEventListener("change", configureTouchControls);
  mobileToggle?.addEventListener("click", () => {
    mobile3DActive = !mobile3DActive;
    configureTouchControls();
    if (mobile3DActive) postponeInteractionHint();
  });
  controls.target.set(0, 0, 0);
  controls.update();
  controls.saveState();

  scene.add(new THREE.HemisphereLight(0xffffff, 0x77736b, 2.3));
  const key = new THREE.DirectionalLight(0xffffff, 4.2);
  key.position.set(4, 6, 7);
  key.castShadow = true;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffc08a, 2.1);
  rim.position.set(-5, 1, -3);
  scene.add(rim);

  const rollGroup = new THREE.Group();
  let currentModel = createRoll(DEFAULT_SIZE);
  rollGroup.add(currentModel.roll);
  scene.add(rollGroup);

  rollGroup.rotation.set(0, -0.48, 0);
  let labelElements = currentModel.measures.children
    .filter((child) => child.isCSS2DObject)
    .map((child) => child.element);
  labelElements.forEach((element) => { element.style.opacity = "1"; });

  function resize() {
    const { width, height } = canvasHost.getBoundingClientRect();
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    labelRenderer.setSize(width, height);
  }

  let frame;
  function render() {
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
    frame = requestAnimationFrame(render);
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top 78%",
      end: "bottom 22%",
      scrub: reducedMotion ? false : 1,
      invalidateOnRefresh: true,
    },
  });

  timeline.to(rollGroup.rotation, { x: 0, y: -Math.PI / 2, z: 0, ease: "none", duration: 1 }, 0);

  const sizeButtons = [...section.querySelectorAll("[data-roll-size]")];
  function selectSize(button) {
    const dimensions = button.dataset.rollSize.split(",").map(Number);
    const previousModel = currentModel;
    const nextModel = createRoll(dimensions);
    gsap.killTweensOf(previousModel.measureMaterial);
    previousModel.measures.visible = false;
    previousModel.measureMaterial.opacity = 0;
    previousModel.measures.children
      .filter((child) => child.isCSS2DObject)
      .forEach((child) => { child.element.style.opacity = "0"; });
    nextModel.roll.scale.setScalar(0.88);
    nextModel.roll.traverse((object) => {
      if (object.material?.transparent) object.material.opacity = object.material === nextModel.measureMaterial ? 0 : object.material.opacity;
    });
    rollGroup.add(nextModel.roll);
    currentModel = nextModel;
    nextModel.measures.visible = true;
    setLabelValues(true);

    gsap.to(previousModel.roll.scale, { x: 0.82, y: 0.82, z: 0.82, duration: 0.25, ease: "power2.in" });
    gsap.delayedCall(0.25, () => rollGroup.remove(previousModel.roll));
    gsap.to(nextModel.roll.scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: "back.out(1.35)" });
    gsap.to(nextModel.measureMaterial, { opacity: 1, duration: 0.35, delay: 0.15 });
    nextModel.measures.children.filter((child) => child.isCSS2DObject).forEach((child) => {
      child.element.style.opacity = "1";
    });

    sizeButtons.forEach((item) => item.classList.remove("active"));
    viewButtons.forEach((item) => {
      item.classList.remove("active");
      item.setAttribute("aria-pressed", "false");
    });
  }

  sizeButtons.forEach((button) => button.addEventListener("click", () => selectSize(button)));

  const viewButtons = [...section.querySelectorAll("[data-roll-view]")];
  let hintTimer;
  function postponeInteractionHint() {
    interactionHint?.classList.add("is-used");
    window.clearTimeout(hintTimer);
    hintTimer = window.setTimeout(() => interactionHint?.classList.remove("is-used"), 18000);
  }
  function setLabelValues(showValues) {
    const [diameter, width, coreDiameter] = currentModel.dimensions;
    currentModel.labels.diameter.textContent = showValues ? `DIÁMETRO ${diameter} mm` : "DIÁMETRO EXTERIOR";
    currentModel.labels.width.textContent = showValues ? `ANCHO ${width} mm` : "ANCHO";
    currentModel.labels.core.textContent = showValues ? `TUCO ${coreDiameter} mm` : "TUCO";
  }

  function setMeasuresVisible(visible) {
    gsap.killTweensOf(currentModel.measureMaterial);
    currentModel.measures.visible = visible;
    currentModel.measureMaterial.opacity = visible ? 1 : 0;
    currentModel.measures.children
      .filter((child) => child.isCSS2DObject)
      .forEach((child) => { child.element.style.opacity = visible ? "1" : "0"; });
  }

  function resetToDefaultView() {
    gsap.killTweensOf(rollGroup.rotation);
    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(controls.target);
    setMeasuresVisible(true);
    setLabelValues(false);
    viewButtons.forEach((button) => {
      button.classList.remove("active");
      button.setAttribute("aria-pressed", "false");
    });
    gsap.to(rollGroup.rotation, { x: 0, y: -0.48, z: 0, duration: 0.8, ease: "power3.inOut" });
    gsap.to(camera.position, { x: 0.38, y: 0, z: 10.7, duration: 0.8, ease: "power3.inOut", onUpdate: () => controls.update() });
    gsap.to(controls.target, { x: -0.12, y: 0, z: 0, duration: 0.8, ease: "power3.inOut", onUpdate: () => controls.update() });
  }

  function selectView(view, button) {
    gsap.killTweensOf(rollGroup.rotation);
    gsap.killTweensOf(camera.position);
    const lateral = view === "width";
    const coreCloseUp = view === "core";
    setMeasuresVisible(true);
    setLabelValues(true);
    gsap.killTweensOf(controls.target);
    gsap.to(rollGroup.rotation, {
      x: 0,
      y: lateral ? 0 : -Math.PI / 2,
      z: 0,
      duration: 0.75,
      ease: "power2.inOut",
    });
    gsap.to(camera.position, {
      x: 0,
      y: 0,
      z: coreCloseUp ? 7.15 : 10.7,
      duration: 1.05,
      ease: "power3.inOut",
      onUpdate: () => controls.update(),
    });
    gsap.to(controls.target, {
      x: 0,
      y: 0,
      z: 0,
      duration: 1.05,
      ease: "power3.inOut",
      onUpdate: () => controls.update(),
    });
    viewButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
  }

  viewButtons.forEach((button) => {
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => selectView(button.dataset.rollView, button));
  });

  controls.addEventListener("start", () => {
    postponeInteractionHint();
    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(controls.target);
  });

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let pointerStart = null;
  renderer.domElement.addEventListener("pointerdown", (event) => {
    pointerStart = { x: event.clientX, y: event.clientY };
  });
  renderer.domElement.addEventListener("pointerup", (event) => {
    if (!pointerStart || Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 5) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const rollMeshes = [];
    currentModel.roll.traverse((object) => {
      if (object.isMesh && !currentModel.measures.getObjectById(object.id)) rollMeshes.push(object);
    });
    if (raycaster.intersectObjects(rollMeshes, false).length === 0) resetToDefaultView();
    pointerStart = null;
  });

  document.addEventListener("pointerdown", (event) => {
    if (!stage.contains(event.target) && !event.target.closest("[data-roll-view]")) resetToDefaultView();
  });

  const resizeObserver = new ResizeObserver(() => {
    resize();
    ScrollTrigger.refresh();
  });
  resizeObserver.observe(canvasHost);
  resize();
  render();

  window.addEventListener("pagehide", () => {
    window.clearTimeout(hintTimer);
    mobileInteraction.removeEventListener("change", configureTouchControls);
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    timeline.scrollTrigger?.kill();
    renderer.dispose();
    controls.dispose();
  }, { once: true });
}
