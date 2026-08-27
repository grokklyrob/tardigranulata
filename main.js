import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { SparkRenderer, SplatMesh } from "@sparkjsdev/spark";

const CLEAR = 0x0c0c12;
const SPLAT_URL = new URL("./assets/tardigrade.ply", import.meta.url).href;

const canvas = document.querySelector("#viewport");
const statusEl = document.querySelector("#status");

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: false,
  alpha: false,
});
renderer.setClearColor(CLEAR, 1);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color(CLEAR);

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.05,
  200,
);
camera.position.set(4, 1.2, -6);

const spark = new SparkRenderer({ renderer });
scene.add(spark);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = true;
controls.minDistance = 1;
controls.maxDistance = 40;
controls.target.set(0, 0, 2.7);

const splat = new SplatMesh({
  url: SPLAT_URL,
  onProgress(event) {
    if (!event.lengthComputable) return;
    const pct = Math.round((event.loaded / event.total) * 100);
    setStatus(`loading splat… ${pct}%`);
  },
});
scene.add(splat);

splat.initialized
  .then(() => {
    frameCard(splat);
    setStatus("ready", "ready");
  })
  .catch((err) => {
    console.error(err);
    setStatus("could not load splat", "error");
  });

function frameCard(mesh) {
  const box = mesh.getBoundingBox(true);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const radius = size.length() * 0.5;
  const fit =
    radius / Math.sin(THREE.MathUtils.degToRad(camera.fov * 0.5));

  // SAM 3D painted this as a near-flat XY card. The drawing reads from the
  // -Z face; offset +X / -Z for a Blender-like three-quarter view.
  const dir = new THREE.Vector3(0.78, 0.18, -1).normalize();
  camera.position.copy(center).addScaledVector(dir, fit * 0.86);
  camera.near = Math.max(0.02, fit / 80);
  camera.far = Math.max(80, fit * 12);
  camera.updateProjectionMatrix();

  controls.target.copy(center);
  controls.minDistance = radius * 0.4;
  controls.maxDistance = radius * 8;
  controls.update();
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

function setStatus(text, state) {
  statusEl.textContent = text;
  if (state) statusEl.dataset.state = state;
  else delete statusEl.dataset.state;
}

window.addEventListener("resize", resize);
resize();

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});
