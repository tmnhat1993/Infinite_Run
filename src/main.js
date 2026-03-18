import "./styles/main.scss";
import * as THREE from "three";

// ─── State ───────────────────────────────────────────────────────────────────
let gameState = "start"; // start | play | end
let score = 0,
  hearts = 3;
let baseSpeed = 12,
  speed = baseSpeed;
const MAX_SPEED = 38;
const SPEED_RAMP_TIME = 180; // seconds
let elapsed = 0;

// ─── Scene setup ─────────────────────────────────────────────────────────────
const canvas = document.getElementById("canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050a0f);
scene.fog = new THREE.Fog(0x050a0f, 20, 55);

// 45-degree angled camera — positioned behind and above the player
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
// Eye is behind+above the player's Z position; lookAt is slightly ahead
const CAM_Y = 11; // height above road
const CAM_DZ = 11; // how far behind the player (positive Z = behind in our setup)
const CAM_LOOK_DZ = -6; // look ahead of player

camera.position.set(0, CAM_Y, 8 + CAM_DZ);
camera.lookAt(0, 0, 8 + CAM_LOOK_DZ);
// Store player reference Z (player stays at fixed Z=8 in world)
const PLAYER_Z = 8;

function resizeCamera() {
  const w = window.innerWidth,
    h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
resizeCamera();
window.addEventListener("resize", resizeCamera);

// ─── Lighting ─────────────────────────────────────────────────────────────────
const ambient = new THREE.AmbientLight(0x112233, 1.2);
scene.add(ambient);
const dirLight = new THREE.DirectionalLight(0x88ddff, 1.5);
dirLight.position.set(5, 20, 0);
dirLight.castShadow = true;
scene.add(dirLight);
const pointL1 = new THREE.PointLight(0x00ffff, 2, 25);
pointL1.position.set(-2, 5, 0);
scene.add(pointL1);
const pointL2 = new THREE.PointLight(0xff00ff, 2, 25);
pointL2.position.set(2, 5, 0);
scene.add(pointL2);

// ─── Road ─────────────────────────────────────────────────────────────────────
const LANE_X = [-1.6, 1.6];
const ROAD_Z_START = -10,
  ROAD_Z_END = 30;
const TILE_LEN = 12;
const NUM_TILES = 6;
const roadMat = new THREE.MeshLambertMaterial({ color: 0x111820 });
const edgeMat = new THREE.MeshLambertMaterial({
  color: 0x0a3355,
  emissive: 0x0a3355,
  emissiveIntensity: 0.4,
});
const dashMat = new THREE.MeshLambertMaterial({
  color: 0xffcc00,
  emissive: 0xffcc00,
  emissiveIntensity: 0.3,
});

const roadTiles = [];
function makeTile(z) {
  const g = new THREE.Group();
  // Base road
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(5.2, 0.3, TILE_LEN),
    roadMat,
  );
  base.receiveShadow = true;
  g.add(base);
  // Left edge glow
  const le = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.35, TILE_LEN),
    edgeMat,
  );
  le.position.x = -2.7;
  g.add(le);
  // Right edge glow
  const re = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.35, TILE_LEN),
    edgeMat,
  );
  re.position.x = 2.7;
  g.add(re);
  // Center divider dashes
  for (let i = 0; i < 4; i++) {
    const dash = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.36, 1.2),
      dashMat,
    );
    dash.position.z = -TILE_LEN / 2 + 1.5 + i * 3;
    g.add(dash);
  }
  g.position.set(0, 0, z);
  scene.add(g);
  roadTiles.push(g);
  return g;
}
for (let i = 0; i < NUM_TILES; i++) makeTile(ROAD_Z_START + i * TILE_LEN);

// ─── Player ───────────────────────────────────────────────────────────────────
const playerGroup = new THREE.Group();
scene.add(playerGroup);

const bodyMat = new THREE.MeshLambertMaterial({
  color: 0x00ddff,
  emissive: 0x002233,
});
const headMat = new THREE.MeshLambertMaterial({ color: 0xffd0a0 });
const legMat = new THREE.MeshLambertMaterial({ color: 0x1144aa });
const armMat = new THREE.MeshLambertMaterial({ color: 0x00aacc });
const eyeMat = new THREE.MeshLambertMaterial({ color: 0x000022 });
const glowMat = new THREE.MeshLambertMaterial({
  color: 0x00ffff,
  emissive: 0x00ffff,
  emissiveIntensity: 0.8,
});

const playerBody = new THREE.Mesh(
  new THREE.BoxGeometry(0.6, 0.8, 0.35),
  bodyMat,
);
playerBody.position.y = 0.85;
playerGroup.add(playerBody);

const playerHead = new THREE.Mesh(
  new THREE.BoxGeometry(0.45, 0.45, 0.45),
  headMat,
);
playerHead.position.y = 1.55;
playerGroup.add(playerHead);

// Eyes
const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.07, 0.1), eyeMat);
eyeL.position.set(-0.12, 1.58, 0.23);
playerGroup.add(eyeL);
const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.07, 0.1), eyeMat);
eyeR.position.set(0.12, 1.58, 0.23);
playerGroup.add(eyeR);

const legL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.5, 0.28), legMat);
legL.position.set(-0.18, 0.27, 0);
playerGroup.add(legL);
const legR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.5, 0.28), legMat);
legR.position.set(0.18, 0.27, 0);
playerGroup.add(legR);

const armL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 0.22), armMat);
armL.position.set(-0.43, 0.85, 0);
playerGroup.add(armL);
const armR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 0.22), armMat);
armR.position.set(0.43, 0.85, 0);
playerGroup.add(armR);

// Glow base
const glowBase = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.5), glowMat);
glowBase.position.y = 0.04;
playerGroup.add(glowBase);

// Player physics
let playerLane = 0; // 0 = left, 1 = right
let playerTargetX = LANE_X[0];
let playerY = 0;
let velY = 0;
let isJumping = false;
let isCrouching = false;
let isInvincible = false;
let invincibleTimer = 0;
const INVINCIBLE_TIME = 1.8;
const JUMP_VEL = 9.5;
const GRAVITY = -22;
let laneChanging = false;
const LANE_CHANGE_SPEED = 8;

// ─── Fire / Speed FX ─────────────────────────────────────────────────────────
const fireParticles = [];
const fireMats = [
  new THREE.MeshBasicMaterial({ color: 0xff2200, transparent: true }),
  new THREE.MeshBasicMaterial({ color: 0xff7700, transparent: true }),
  new THREE.MeshBasicMaterial({ color: 0xffcc00, transparent: true }),
  new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true }),
];
let speedRatio = 0; // 0..1 from baseSpeed to MAX_SPEED
let wasMaxSpeed = false;

function spawnFireParticle() {
  // pick colour based on intensity: hot white/yellow at max speed
  let mat;
  if (speedRatio > 0.9) mat = fireMats[Math.floor(Math.random() * 4)];
  else if (speedRatio > 0.6) mat = fireMats[Math.floor(Math.random() * 3)];
  else mat = fireMats[Math.floor(Math.random() * 2)];

  const sz = 0.06 + Math.random() * 0.12 * speedRatio;
  const m = new THREE.Mesh(new THREE.BoxGeometry(sz, sz, sz), mat.clone());
  // spawn at player feet / back
  const ox = (Math.random() - 0.5) * 0.5;
  const oy = Math.random() * 0.6;
  m.position.set(
    playerGroup.position.x + ox,
    playerGroup.position.y + oy,
    playerGroup.position.z + 0.3 + Math.random() * 0.4,
  );
  scene.add(m);
  const life = 0.25 + Math.random() * 0.35;
  fireParticles.push({
    mesh: m,
    vx: (Math.random() - 0.5) * 0.8,
    vy: 1.5 + Math.random() * 2.5,
    vz: 1.5 + Math.random() * 2.0,
    life,
    maxLife: life,
  });
}

function updateFireParticles(dt) {
  // Spawn rate scales with speedRatio
  const spawnCount = Math.floor(speedRatio * speedRatio * 6);
  for (let i = 0; i < spawnCount; i++) spawnFireParticle();

  for (let i = fireParticles.length - 1; i >= 0; i--) {
    const p = fireParticles[i];
    p.life -= dt;
    if (p.life <= 0) {
      scene.remove(p.mesh);
      fireParticles.splice(i, 1);
      continue;
    }
    p.mesh.position.x += p.vx * dt;
    p.mesh.position.y += p.vy * dt;
    p.mesh.position.z += p.vz * dt;
    p.vy -= 4 * dt; // gravity drag
    const t = p.life / p.maxLife;
    p.mesh.material.opacity = t * 0.85;
    const s = t * 0.9 + 0.1;
    p.mesh.scale.set(s, s, s);
  }
}

// ─── Obstacles ────────────────────────────────────────────────────────────────
const obstacles = [];
let obstacleTimer = 0;
let obstacleInterval = 2.2;

const OBS_TYPES = [
  // Tường chắn — cao từ đất lên tận trên, KHÔNG thể nhảy qua (h=3.5 bao phủ toàn bộ chiều cao nhảy)
  {
    id: "wall",
    color: 0xff3311,
    emissive: 0x441100,
    w: 0.85,
    h: 3.5,
    d: 0.7,
    avoidance: ["lane"],
    yOff: 0,
  },
  // Chướng ngại thấp — nằm sát đất, nhảy qua hoặc né làn
  {
    id: "low",
    color: 0xffaa00,
    emissive: 0x332200,
    w: 0.9,
    h: 0.55,
    d: 0.9,
    avoidance: ["jump", "lane"],
    yOff: 0,
  },
  // Vật bay — float cao trên đầu (~1.4 lên tới ~2.2), phải cúi hoặc né làn
  {
    id: "high",
    color: 0xff00cc,
    emissive: 0x330033,
    w: 0.95,
    h: 0.55,
    d: 0.9,
    avoidance: ["crouch", "lane"],
    yOff: 1.4,
  },
];

// particle pool
const particles = [];

function spawnObstacle() {
  const type = OBS_TYPES[Math.floor(Math.random() * OBS_TYPES.length)];
  const lane = Math.random() < 0.5 ? 0 : 1;
  const mat = new THREE.MeshLambertMaterial({
    color: type.color,
    emissive: type.emissive,
    emissiveIntensity: 0.5,
  });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(type.w, type.h, type.d), mat);
  const yBase = type.yOff || 0;
  mesh.position.set(LANE_X[lane], yBase + type.h / 2, -16);
  mesh.castShadow = true;
  scene.add(mesh);

  // Glow ring
  const ringMat = new THREE.MeshLambertMaterial({
    color: type.color,
    emissive: type.color,
    emissiveIntensity: 1.2,
    wireframe: true,
  });
  const ring = new THREE.Mesh(
    new THREE.BoxGeometry(type.w * 1.3, type.h * 1.3, type.d * 1.3),
    ringMat,
  );
  ring.position.copy(mesh.position);
  scene.add(ring);

  obstacles.push({ mesh, ring, lane, type, alive: true });
}

function spawnParticles(pos, color) {
  for (let i = 0; i < 10; i++) {
    const mat = new THREE.MeshBasicMaterial({ color });
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), mat);
    m.position.copy(pos);
    scene.add(m);
    const vx = (Math.random() - 0.5) * 5;
    const vy = Math.random() * 6 + 2;
    const vz = (Math.random() - 0.5) * 3;
    particles.push({ mesh: m, vx, vy, vz, life: 0.6 });
  }
}

// ─── Input ────────────────────────────────────────────────────────────────────
const keys = {};
window.addEventListener("keydown", (e) => {
  if (keys[e.code]) return;
  keys[e.code] = true;
  if (gameState !== "play") return;

  if (["KeyA", "ArrowLeft"].includes(e.code)) tryChangeLane(-1);
  if (["KeyD", "ArrowRight"].includes(e.code)) tryChangeLane(1);
  if (["KeyW", "ArrowUp", "Space"].includes(e.code)) tryJump();
  if (["KeyS", "ArrowDown"].includes(e.code)) tryCrouch(true);
  e.preventDefault();
});
window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
  if (["KeyS", "ArrowDown"].includes(e.code)) tryCrouch(false);
});

// ─── Touch / Swipe input ─────────────────────────────────────────────────────
let touchStartX = null,
  touchStartY = null;
const SWIPE_MIN = 35; // px

window.addEventListener(
  "touchstart",
  (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  },
  { passive: true },
);

window.addEventListener(
  "touchend",
  (e) => {
    if (touchStartX === null) return;
    if (gameState !== "play") return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    touchStartX = null;
    touchStartY = null;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) < SWIPE_MIN) return;
      tryChangeLane(dx > 0 ? 1 : -1);
    } else {
      if (Math.abs(dy) < SWIPE_MIN) return;
      if (dy < 0) tryJump(); // swipe up → jump
      else tryCrouch(true); // swipe down → crouch
    }
  },
  { passive: true },
);

// Release crouch after a brief hold when swiped down
window.addEventListener(
  "touchstart",
  () => {
    // when a new touch begins, release any held crouch
    if (isCrouching) setTimeout(() => tryCrouch(false), 400);
  },
  { passive: true },
);

function tryChangeLane(dir) {
  if (laneChanging) return;
  const newLane = playerLane + dir;
  if (newLane < 0 || newLane > 1) return;
  playerLane = newLane;
  playerTargetX = LANE_X[playerLane];
  laneChanging = true;
}

function tryJump() {
  if (!isJumping && !isCrouching) {
    velY = JUMP_VEL;
    isJumping = true;
  }
}

function tryCrouch(down) {
  if (isJumping) return;
  isCrouching = down;
}

// ─── Collision ────────────────────────────────────────────────────────────────
function checkCollision(obs) {
  if (!obs.alive || isInvincible) return false;
  const px = playerGroup.position.x;
  const pz = playerGroup.position.z;
  const oz = obs.mesh.position.z;
  const ox = obs.mesh.position.x;
  const type = obs.type;

  if (Math.abs(px - ox) > 0.72) return false;
  if (Math.abs(pz - oz) > 0.62) return false;

  // Player height: standing = 0 → 1.9, crouching = 0 → 0.75, jumping shifts playerY up
  const playerBot = playerY;
  const playerTop = playerY + (isCrouching ? 0.75 : 1.9);

  // Obstacle vertical bounds
  const obsBot = type.yOff || 0;
  const obsTop = obsBot + type.h;

  // No vertical overlap → no collision
  if (playerTop <= obsBot + 0.08) return false;
  if (playerBot >= obsTop - 0.08) return false;

  return true;
}

function takeHit(obsPos) {
  hearts--;
  updateHearts();
  isInvincible = true;
  invincibleTimer = INVINCIBLE_TIME;
  spawnParticles(obsPos, 0xff3311);
  flashScreen();
  showStateIndicator("💥 ĐÃ BỊ HIT!");
  if (hearts <= 0) endGame();
}

function flashScreen() {
  const el = document.getElementById("flash");
  el.style.opacity = "1";
  setTimeout(() => {
    el.style.opacity = "0";
  }, 250);
}

function updateHearts() {
  for (let i = 1; i <= 3; i++) {
    const h = document.getElementById("h" + i);
    if (i > hearts) h.classList.add("lost");
    else h.classList.remove("lost");
  }
}

// ─── Background decorations ───────────────────────────────────────────────────
const bgDecos = [];
const decoMats = [
  new THREE.MeshLambertMaterial({ color: 0x002244, emissive: 0x001122 }),
  new THREE.MeshLambertMaterial({ color: 0x220044, emissive: 0x110022 }),
];
function spawnDeco(z) {
  const side = Math.random() < 0.5 ? -1 : 1;
  const x = side * (3.5 + Math.random() * 4);
  const sz = 0.3 + Math.random() * 1.2;
  const h = 0.5 + Math.random() * 3;
  const mat = decoMats[Math.floor(Math.random() * decoMats.length)];
  const m = new THREE.Mesh(new THREE.BoxGeometry(sz, h, sz), mat);
  m.position.set(x, h / 2, z);
  scene.add(m);
  bgDecos.push({ mesh: m });
  return m;
}
for (let i = 0; i < 20; i++) spawnDeco(-10 + i * 3.5);

// ─── HUD ──────────────────────────────────────────────────────────────────────
let scoreEl, speedFill;
function initHUD() {
  scoreEl = document.getElementById("score");
  speedFill = document.getElementById("speed-fill");
  document.getElementById("hud").classList.remove("hidden");
  updateHearts();
}

function updateHUD() {
  if (scoreEl) scoreEl.textContent = Math.floor(score);
  if (speedFill) {
    const pct = Math.min(
      ((speed - baseSpeed) / (MAX_SPEED - baseSpeed)) * 100,
      100,
    );
    speedFill.style.width = pct + "%";
  }
}

let stateIndicatorTimeout;
function showStateIndicator(msg) {
  const el = document.getElementById("state-indicator");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(stateIndicatorTimeout);
  stateIndicatorTimeout = setTimeout(() => el.classList.remove("show"), 1200);
}

// ─── Game flow ────────────────────────────────────────────────────────────────
function startGame() {
  gameState = "play";
  score = 0;
  hearts = 3;
  elapsed = 0;
  speed = baseSpeed;
  playerLane = 0;
  playerTargetX = LANE_X[0];
  playerY = 0;
  velY = 0;
  isJumping = false;
  isCrouching = false;
  isInvincible = false;
  invincibleTimer = 0;
  laneChanging = false;
  playerGroup.position.set(LANE_X[0], 0, 8);
  obstacles.forEach((o) => {
    scene.remove(o.mesh);
    scene.remove(o.ring);
  });
  obstacles.length = 0;
  particles.forEach((p) => scene.remove(p.mesh));
  particles.length = 0;
  fireParticles.forEach((p) => scene.remove(p.mesh));
  fireParticles.length = 0;
  speedRatio = 0;
  wasMaxSpeed = false;
  document.getElementById("max-vignette").classList.remove("active");
  document.getElementById("max-badge").classList.remove("show");
  obstacleTimer = 0;
  obstacleInterval = 2.2;
  document.getElementById("start-screen").classList.add("hidden");
  document.getElementById("end-screen").classList.add("hidden");
  initHUD();
}

document.getElementById("btn-start").addEventListener("click", startGame);
document.getElementById("btn-restart").addEventListener("click", startGame);

// ─── Main loop ────────────────────────────────────────────────────────────────
let last = 0;
function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;

  if (gameState === "play") update(dt);

  // Road tile recycling (always)
  roadTiles.forEach((t) => {
    if (gameState === "play") t.position.z += speed * dt;
    if (t.position.z > ROAD_Z_END) t.position.z -= NUM_TILES * TILE_LEN;
  });

  // Background deco movement
  bgDecos.forEach((d) => {
    if (gameState === "play") d.mesh.position.z += speed * dt;
    if (d.mesh.position.z > 32) d.mesh.position.z -= 75;
  });

  // Camera smoothly follows player X, fixed 45-degree angle offset
  const targetCamX = playerGroup.position.x;
  camera.position.x += (targetCamX - camera.position.x) * 0.1;
  camera.position.y = CAM_Y + playerY * 0.3;
  camera.position.z = PLAYER_Z + CAM_DZ;
  camera.lookAt(camera.position.x, 0, PLAYER_Z + CAM_LOOK_DZ);

  // Point lights near player
  pointL1.position.x = playerGroup.position.x - 2;
  pointL1.position.y = 4;
  pointL1.position.z = playerGroup.position.z - 2;
  pointL2.position.x = playerGroup.position.x + 2;
  pointL2.position.y = 4;
  pointL2.position.z = playerGroup.position.z - 2;

  renderer.render(scene, camera);
}

function update(dt) {
  elapsed += dt;

  // Speed ramp
  const t = Math.min(elapsed / SPEED_RAMP_TIME, 1);
  speed = baseSpeed + (MAX_SPEED - baseSpeed) * (t * t);
  speedRatio = (speed - baseSpeed) / (MAX_SPEED - baseSpeed);

  // Max speed FX toggle
  const isMaxNow = speedRatio >= 0.99;
  if (isMaxNow !== wasMaxSpeed) {
    wasMaxSpeed = isMaxNow;
    document.getElementById("max-vignette").classList.toggle("active", isMaxNow);
    document.getElementById("max-badge").classList.toggle("show", isMaxNow);
    if (isMaxNow) showStateIndicator("🔥 MAX SPEED! x2 SCORE");
  }

  // Fire glow on point lights
  if (speedRatio > 0.05) {
    const fireIntensity = speedRatio * speedRatio;
    const fireColor = new THREE.Color().setHSL(
      0.08 - fireIntensity * 0.08,
      1.0,
      0.5 + fireIntensity * 0.2,
    );
    pointL1.color.copy(fireColor);
    pointL2.color.copy(fireColor);
    pointL1.intensity = 2 + fireIntensity * 8;
    pointL2.intensity = 2 + fireIntensity * 8;
    pointL1.distance = 15 + fireIntensity * 20;
    pointL2.distance = 15 + fireIntensity * 20;
    // Also tint body emissive to fiery orange at max
    bodyMat.emissive.setHSL(
      0.08 - fireIntensity * 0.08,
      1.0,
      fireIntensity * 0.25,
    );
    glowMat.emissiveIntensity = 0.8 + fireIntensity * 3.0;
    glowMat.color.setHSL(0.5 - fireIntensity * 0.4, 1.0, 0.5 + fireIntensity * 0.2);
    glowMat.emissive.copy(glowMat.color);
  } else {
    pointL1.color.set(0x00ffff);
    pointL2.color.set(0xff00ff);
    pointL1.intensity = 2;
    pointL2.intensity = 2;
    pointL1.distance = 25;
    pointL2.distance = 25;
    bodyMat.emissive.set(0x002233);
    glowMat.color.set(0x00ffff);
    glowMat.emissive.set(0x00ffff);
    glowMat.emissiveIntensity = 0.8;
  }

  const scoreMult = speedRatio >= 0.99 ? 2.0 : 1.0 + speedRatio * 0.8;
  score += speed * dt * 0.5 * scoreMult;
  updateHUD();

  // Obstacle interval shrinks with speed
  obstacleInterval = Math.max(
    0.9,
    2.2 - ((speed - baseSpeed) / (MAX_SPEED - baseSpeed)) * 1.3,
  );

  // Spawn obstacles
  obstacleTimer -= dt;
  if (obstacleTimer <= 0) {
    spawnObstacle();
    obstacleTimer = obstacleInterval + Math.random() * 0.4;
  }

  // Move obstacles
  obstacles.forEach((o) => {
    if (!o.alive) return;
    o.mesh.position.z += speed * dt;
    o.ring.position.z += speed * dt;
    o.ring.rotation.y += dt * 1.5;

    if (o.mesh.position.z > 14) {
      scene.remove(o.mesh);
      scene.remove(o.ring);
      o.alive = false;
      score += 5;
    }

    if (checkCollision(o)) {
      scene.remove(o.mesh);
      scene.remove(o.ring);
      o.alive = false;
      takeHit(o.mesh.position.clone());
    }
  });

  // Remove dead obstacles
  for (let i = obstacles.length - 1; i >= 0; i--) {
    if (!obstacles[i].alive) obstacles.splice(i, 1);
  }

  // Lane change
  if (laneChanging) {
    const dx = playerTargetX - playerGroup.position.x;
    const step = LANE_CHANGE_SPEED * dt;
    if (Math.abs(dx) <= step) {
      playerGroup.position.x = playerTargetX;
      laneChanging = false;
    } else {
      playerGroup.position.x += Math.sign(dx) * step;
    }
  }

  // Jump physics
  if (isJumping) {
    velY += GRAVITY * dt;
    playerY += velY * dt;
    if (playerY <= 0) {
      playerY = 0;
      velY = 0;
      isJumping = false;
    }
  }

  // Crouch visual
  const targetScaleY = isCrouching ? 0.48 : 1;
  playerGroup.scale.y += (targetScaleY - playerGroup.scale.y) * 10 * dt;
  playerGroup.position.y = playerY;

  // Player blink when invincible
  if (isInvincible) {
    invincibleTimer -= dt;
    playerGroup.visible = Math.floor(invincibleTimer * 8) % 2 === 0;
    if (invincibleTimer <= 0) {
      isInvincible = false;
      playerGroup.visible = true;
    }
  }

  // Player animation
  const legSwing = isJumping ? 0 : Math.sin(elapsed * 10) * 0.3;
  legL.rotation.x = legSwing;
  legR.rotation.x = -legSwing;
  armL.rotation.x = -legSwing * 0.7;
  armR.rotation.x = legSwing * 0.7;

  // Tilt while lane changing
  playerGroup.rotation.z +=
    (laneChanging
      ? (playerLane === 1 ? -0.25 : 0.25) - playerGroup.rotation.z
      : -playerGroup.rotation.z) *
    12 *
    dt;

  // Fire effect
  if (gameState === "play") updateFireParticles(dt);

  // Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      scene.remove(p.mesh);
      particles.splice(i, 1);
      continue;
    }
    p.mesh.position.x += p.vx * dt;
    p.mesh.position.y += p.vy * dt;
    p.mesh.position.z += p.vz * dt;
    p.vy += GRAVITY * 0.3 * dt;
    p.mesh.material.opacity = p.life / 0.6;
    p.mesh.rotation.x += 3 * dt;
    p.mesh.rotation.z += 2 * dt;
  }
}

// ═══════════════════════════════════════════════════════════
// ── LEADERBOARD (Google Sheets via Apps Script) ──────────
// ═══════════════════════════════════════════════════════════
// 👉 Paste your Apps Script Web App URL here:
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwljzZu7F5OmRS4BcdxhMmvI4ERFxiPjUxmvs5uU_oR6QiAYiUliKVOhLpRKF7JBI_C6g/exec";

let leaderboardData = [];
let playerBestScore = 0;
let scoreSubmitted = false;

async function fetchLeaderboard() {
  setLbStatus("Đang tải...");
  try {
    const res = await fetch(APPS_SCRIPT_URL + "?action=get", {
      mode: "cors",
    });
    const json = await res.json();
    leaderboardData = json.scores || [];
    renderLeaderboard();
  } catch {
    setLbStatus("Không thể kết nối 😢");
  }
}

async function submitScore(name, newScore) {
  setSubmitStatus("Đang lưu...");
  document.getElementById("btn-submit-score").disabled = true;
  try {
    const url = `${APPS_SCRIPT_URL}?action=post&name=${encodeURIComponent(name)}&score=${newScore}`;
    const res = await fetch(url, { mode: "cors" });
    const json = await res.json();
    if (json.success) {
      setSubmitStatus("✅ Đã lưu!");
      scoreSubmitted = true;
      await fetchLeaderboard(); // refresh bảng
    } else {
      setSubmitStatus("❌ Lỗi lưu điểm");
    }
  } catch {
    setSubmitStatus("❌ Lỗi kết nối");
    document.getElementById("btn-submit-score").disabled = false;
  }
}

function renderLeaderboard(highlightScore = null) {
  const list = document.getElementById("lb-list");
  list.innerHTML = "";
  setLbStatus("");

  if (!leaderboardData.length) {
    setLbStatus("Chưa có điểm nào. Hãy là người đầu tiên!");
    return;
  }

  leaderboardData.forEach((entry, i) => {
    const li = document.createElement("li");
    const isYou =
      highlightScore !== null && entry.score === highlightScore && !li.dataset.claimed;
    if (isYou) li.classList.add("you");

    const medals = ["🥇", "🥈", "🥉"];
    li.innerHTML = `
      <span class="rank">${medals[i] || i + 1}</span>
      <span class="lb-name">${escHtml(entry.name)}${isYou ? " 👈" : ""}</span>
      <span class="lb-score">${Number(entry.score).toLocaleString()}</span>
    `;
    list.appendChild(li);
    // stagger reveal animation
    setTimeout(() => li.classList.add("show"), 80 + i * 60);
  });
}

function setLbStatus(msg) {
  const el = document.getElementById("lb-status");
  el.textContent = msg;
  el.style.display = msg ? "block" : "none";
}
function setSubmitStatus(msg) {
  document.getElementById("submit-status").textContent = msg;
}
function escHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

document.getElementById("btn-submit-score").addEventListener("click", () => {
  const name = document.getElementById("player-name-input").value.trim() || "Anonymous";
  const currentScore = Math.floor(playerBestScore);
  submitScore(name, currentScore);
});

document.getElementById("player-name-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("btn-submit-score").click();
  e.stopPropagation(); // không trigger game keys
});

// ═══════════════════════════════════════════════════════════
// ── EXPLOSION + DRAMA GAME OVER ──────────────────────────
// ═══════════════════════════════════════════════════════════
const expOverlay = document.getElementById("explosion-overlay");

// CSS particle explosion using divs (on top of canvas)
function triggerExplosion(callback) {
  expOverlay.innerHTML = "";
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;

  const colors = ["#ff2200", "#ff6600", "#ffaa00", "#ffff00", "#ffffff", "#ff0088"];
  const count = 80;

  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    const angle = ((Math.PI * 2) / count) * i + Math.random() * 0.3;
    const dist = 80 + Math.random() * 260;
    const size = 4 + Math.random() * 14;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const dur = 0.6 + Math.random() * 0.7;
    const delay = Math.random() * 0.18;

    el.style.cssText = `
      position:absolute;
      left:${cx}px; top:${cy}px;
      width:${size}px; height:${size * (0.5 + Math.random())}px;
      background:${color};
      border-radius:${Math.random() > 0.5 ? "50%" : "2px"};
      transform-origin: center;
      box-shadow: 0 0 ${size * 2}px ${color};
      animation: explode-${i} ${dur}s ${delay}s ease-out forwards;
    `;

    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;
    const rot = Math.random() * 720 - 360;

    const keyframe = `
      @keyframes explode-${i} {
        0%   { transform: translate(-50%,-50%) scale(1) rotate(0deg); opacity:1; }
        100% { transform: translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0.1) rotate(${rot}deg); opacity:0; }
      }`;
    const style = document.createElement("style");
    style.textContent = keyframe;
    document.head.appendChild(style);
    expOverlay.appendChild(el);
  }

  // Screen shake
  document.getElementById("canvas").classList.add("shake");
  setTimeout(() => document.getElementById("canvas").classList.remove("shake"), 600);

  // Flash white
  const flash = document.getElementById("flash");
  flash.style.background = "rgba(255,255,255,0.9)";
  flash.style.opacity = "1";
  setTimeout(() => {
    flash.style.background = "rgba(255,60,60,0.35)";
    flash.style.opacity = "0";
  }, 120);

  // Three.js also spawn big explosion on player
  spawnBigExplosion();

  // Clean up after animation + call callback
  setTimeout(() => {
    expOverlay.innerHTML = "";
    if (callback) callback();
  }, 1100);
}

function spawnBigExplosion() {
  const pos = playerGroup.position.clone();
  const colors3 = [0xff2200, 0xff6600, 0xffaa00, 0xffff00, 0xffffff];
  for (let i = 0; i < 40; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: colors3[Math.floor(Math.random() * colors3.length)],
      transparent: true,
    });
    const sz = 0.1 + Math.random() * 0.4;
    const m = new THREE.Mesh(new THREE.BoxGeometry(sz, sz, sz), mat);
    m.position.copy(pos);
    m.position.y += Math.random() * 1.5;
    scene.add(m);
    const angle = Math.random() * Math.PI * 2;
    const spd = 3 + Math.random() * 8;
    const vx = Math.cos(angle) * spd;
    const vy = 4 + Math.random() * 12;
    const vz = Math.sin(angle) * spd * 0.4;
    const life = 0.8 + Math.random() * 0.5;
    particles.push({ mesh: m, vx, vy, vz, life });
  }
}

// ── Override endGame to use explosion then drama reveal ──
function endGame() {
  gameState = "end";
  playerBestScore = Math.floor(score);
  scoreSubmitted = false;

  // Hide player visually
  playerGroup.visible = false;

  triggerExplosion(() => {
    // Show screen
    const endScreen = document.getElementById("end-screen");
    endScreen.classList.remove("hidden");
    document.getElementById("final-score").textContent = playerBestScore.toLocaleString();
    document.getElementById("submit-status").textContent = "";
    document.getElementById("btn-submit-score").disabled = false;
    document.getElementById("player-name-input").value = "";
    setLbStatus("Đang tải...");
    document.getElementById("lb-list").innerHTML = "";

    // Trigger CSS transition for drama reveal
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        endScreen.classList.add("visible");
      });
    });

    document.getElementById("hud").classList.add("hidden");

    // Load leaderboard
    if (APPS_SCRIPT_URL !== "YOUR_APPS_SCRIPT_URL_HERE") {
      fetchLeaderboard();
    } else {
      setLbStatus("⚙️ Chưa cấu hình Apps Script URL");
    }
  });
}

// ── Patch startGame to also reset end-screen ──
const _origStartGame = startGame;
function startGamePatched() {
  const endScreen = document.getElementById("end-screen");
  endScreen.classList.add("hidden");
  endScreen.classList.remove("visible");
  playerGroup.visible = true;
  _origStartGame();
}

// Re-bind buttons to the patched startGame
document.getElementById("btn-start").onclick = startGamePatched;
document.getElementById("btn-restart").onclick = startGamePatched;

requestAnimationFrame(animate);

