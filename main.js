import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { SparkRenderer, SplatMesh } from "@sparkjsdev/spark";

const CLEAR = 0x0c0c12;
const SPLAT_URL = new URL("./assets/tardigrade.ply", import.meta.url).href;

// PCA of this SAM 3D card (file = Spark local coords): long/mid span the
// painted face, long × mid faces the readable side after alignment.
const CARD_LONG = new THREE.Vector3(-0.84370425, -0.51973402, 0.13431195);
const CARD_MID = new THREE.Vector3(-0.53661569, 0.80987354, -0.23695664);

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
  48,
  window.innerWidth / window.innerHeight,
  0.05,
  200,
);
camera.position.set(-3.2, 1.4, 7.5);

const spark = new SparkRenderer({ renderer });
scene.add(spark);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = true;
controls.minDistance = 1;
controls.maxDistance = 40;
controls.target.set(0, 0, 0);

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

function orientCard(mesh) {
  const xAxis = CARD_LONG.clone().normalize();
  const zAxis = new THREE.Vector3().crossVectors(xAxis, CARD_MID).normalize();
  const yAxis = new THREE.Vector3().crossVectors(zAxis, xAxis).normalize();
  const basis = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
  mesh.quaternion.setFromRotationMatrix(basis.clone().invert());

  const localCenter = mesh.getBoundingBox(true).getCenter(new THREE.Vector3());
  mesh.position.copy(localCenter).applyQuaternion(mesh.quaternion).negate();
  mesh.updateMatrixWorld(true);
}

function frameCard(mesh) {
  orientCard(mesh);

  const worldBox = mesh.getBoundingBox(true).applyMatrix4(mesh.matrixWorld);
  const center = worldBox.getCenter(new THREE.Vector3());
  const size = worldBox.getSize(new THREE.Vector3());
  const radius = Math.max(size.x, size.y) * 0.55;
  const fit =
    radius / Math.sin(THREE.MathUtils.degToRad(camera.fov * 0.5));

  // Three-quarter of the standing card, matching the Blender still:
  // slightly left, slightly above, looking at the painted face.
  const dir = new THREE.Vector3(-0.62, 0.2, 1).normalize();
  camera.position.copy(center).addScaledVector(dir, fit * 1.05);
  camera.near = Math.max(0.02, fit / 80);
  camera.far = Math.max(80, fit * 12);
  camera.updateProjectionMatrix();

  controls.target.copy(center);
  controls.minDistance = radius * 0.45;
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
