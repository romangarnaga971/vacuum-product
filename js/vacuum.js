import * as THREE from 'three';
import { watchQuality } from './quality.js';
import { RoomEnvironment } from '../vendor/three/RoomEnvironment.js';
import { RoundedBoxGeometry } from '../vendor/three/RoundedBoxGeometry.js';

// Model is built from code, not a file, so each part can move on its own when it comes apart.
const materials = {
  bone: new THREE.MeshPhysicalMaterial({ color: 0xf4f0e8, roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.4 }),
  copper: new THREE.MeshStandardMaterial({ color: 0xd97b45, metalness: 1, roughness: 0.2 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x14163a, roughness: 0.55, metalness: 0.2 }),
  smoke: new THREE.MeshPhysicalMaterial({
    color: 0x2a2f70, roughness: 0.06, transparent: true, opacity: 0.34,
    side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 1.6,
  }),
  glow: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xbfd0ff, emissiveIntensity: 2.5 }),
};

const mesh = (geometry, material, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z);
  return m;
};
const cylinder = (rTop, rBottom, h, seg = 64) => new THREE.CylinderGeometry(rTop, rBottom, h, seg);

function buildHead() {
  const g = new THREE.Group();
  g.add(mesh(new RoundedBoxGeometry(1.5, 0.2, 0.62, 6, 0.09), materials.bone, 0, -2.2, 0));
  g.add(mesh(new RoundedBoxGeometry(1.46, 0.06, 0.58, 4, 0.03), materials.dark, 0, -2.31, 0));

  const roller = mesh(cylinder(0.09, 0.09, 1.34), materials.dark, 0, -2.25, 0.27);
  roller.rotation.z = Math.PI / 2;
  g.add(roller);

  const light = mesh(new RoundedBoxGeometry(1.3, 0.03, 0.02, 2, 0.01), materials.glow, 0, -2.16, 0.315);
  g.add(light);

  for (const x of [-0.72, 0.72]) {
    const wheel = mesh(cylinder(0.1, 0.1, 0.06, 32), materials.copper, x, -2.26, -0.16);
    wheel.rotation.z = Math.PI / 2;
    g.add(wheel);
  }

  g.add(mesh(new THREE.SphereGeometry(0.13, 32, 24), materials.copper, 0, -2.08, -0.04));
  return g;
}

function buildWand() {
  const g = new THREE.Group();
  g.add(mesh(cylinder(0.062, 0.062, 2.2), materials.copper, 0, -0.85, 0));
  g.add(mesh(cylinder(0.09, 0.1, 0.16), materials.bone, 0, -1.93, 0));
  g.add(mesh(cylinder(0.1, 0.08, 0.2), materials.bone, 0, 0.22, 0));
  return g;
}

function buildBin() {
  const g = new THREE.Group();
  g.add(mesh(cylinder(0.36, 0.36, 1.02), materials.smoke, 0, 0.84, 0));
  g.add(mesh(cylinder(0.37, 0.37, 0.05), materials.bone, 0, 0.33, 0));
  g.add(mesh(cylinder(0.37, 0.37, 0.05), materials.copper, 0, 1.36, 0));

  // Spins inside the bin
  const cyclone = new THREE.Group();
  cyclone.position.y = 0.92;
  cyclone.add(mesh(cylinder(0.24, 0.05, 0.86, 32), materials.dark));
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const points = [];
    for (let t = 0; t <= 1; t += 0.05) {
      const angle = a + t * Math.PI * 3;
      const r = 0.07 + t * 0.2;
      points.push(new THREE.Vector3(Math.cos(angle) * r, t * 0.86 - 0.43, Math.sin(angle) * r));
    }
    cyclone.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 60, 0.012, 8), materials.copper));
  }
  g.add(cyclone);
  g.userData.cyclone = cyclone;
  return g;
}

function buildFan() {
  const g = new THREE.Group();
  const fan = new THREE.Group();
  fan.position.y = 1.47;
  fan.add(mesh(cylinder(0.08, 0.08, 0.1, 24), materials.copper));
  for (let i = 0; i < 9; i++) {
    const blade = mesh(new THREE.BoxGeometry(0.2, 0.08, 0.012), materials.copper);
    const a = (i / 9) * Math.PI * 2;
    blade.position.set(Math.cos(a) * 0.16, 0, Math.sin(a) * 0.16);
    blade.rotation.y = -a;
    blade.rotation.x = 0.5;
    fan.add(blade);
  }
  g.add(fan);
  g.userData.fan = fan;
  return g;
}

function buildMotor() {
  const g = new THREE.Group();
  g.add(mesh(cylinder(0.3, 0.34, 0.5), materials.bone, 0, 1.68, 0));
  for (let i = 0; i < 4; i++) {
    const vent = mesh(new THREE.TorusGeometry(0.312 + i * 0.008, 0.008, 8, 64), materials.dark, 0, 1.8 - i * 0.05, 0);
    vent.rotation.x = Math.PI / 2;
    g.add(vent);
  }
  const ring = mesh(new THREE.TorusGeometry(0.34, 0.012, 8, 64), materials.glow, 0, 1.44, 0);
  ring.rotation.x = Math.PI / 2;
  g.add(ring);
  return g;
}

function buildFilter() {
  const g = new THREE.Group();
  g.add(mesh(cylinder(0.26, 0.3, 0.2), materials.dark, 0, 2.03, 0));
  g.add(mesh(cylinder(0.27, 0.27, 0.03), materials.copper, 0, 2.15, 0));
  return g;
}

function buildHandle() {
  const g = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.72, -0.26),
    new THREE.Vector3(0, 1.82, -0.56),
    new THREE.Vector3(0, 1.62, -0.9),
    new THREE.Vector3(0, 1.22, -0.98),
    new THREE.Vector3(0, 1.0, -0.72),
  ]);
  g.add(mesh(new THREE.TubeGeometry(curve, 80, 0.065, 20), materials.bone));
  const trigger = mesh(new RoundedBoxGeometry(0.07, 0.16, 0.08, 3, 0.03), materials.copper, 0, 1.38, -0.86);
  trigger.rotation.x = 0.3;
  g.add(trigger);
  return g;
}

function buildBattery() {
  const g = new THREE.Group();
  g.add(mesh(new RoundedBoxGeometry(0.36, 0.72, 0.3, 6, 0.08), materials.dark, 0, 0.78, -0.56));
  g.add(mesh(new RoundedBoxGeometry(0.2, 0.05, 0.02, 2, 0.01), materials.glow, 0, 1.0, -0.72));
  g.add(mesh(new RoundedBoxGeometry(0.3, 0.2, 0.2, 4, 0.05), materials.bone, 0, 0.66, -0.34));
  return g;
}

function buildDust(count) {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const tints = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 11;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 7;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
    seeds[i] = Math.random();
    tints[i] = Math.random() < 0.18 ? 1 : 0;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute('aTint', new THREE.BufferAttribute(tints, 1));

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uSuck: { value: 0 },
      uTarget: { value: new THREE.Vector3() },
      uPixel: { value: 1 },
    },
    vertexShader: `
      attribute float aSeed;
      attribute float aTint;
      uniform float uTime, uSuck, uPixel;
      uniform vec3 uTarget;
      varying float vAlpha;
      varying float vTint;
      void main() {
        vec3 p = position;
        p.y += sin(uTime * .3 + aSeed * 40.) * .12;
        p.x += cos(uTime * .24 + aSeed * 30.) * .12;

        // Each speck starts at its own moment, then spirals in to the floor head
        float t = clamp((uSuck * 1.5 - aSeed * .5), 0., 1.);
        t = t * t * (3. - 2. * t);
        vec3 d = p - uTarget;
        float a = t * (5. + aSeed * 5.);
        float c = cos(a), s = sin(a);
        d = vec3(d.x * c - d.z * s, d.y, d.x * s + d.z * c);
        p = uTarget + d * (1. - t);

        vec4 mv = modelViewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (1. + aSeed * aSeed * 5.) * uPixel * (11. / -mv.z);
        vAlpha = (1. - smoothstep(.85, 1., t)) * (.25 + aSeed * .55);
        vTint = aTint;
      }`,
    fragmentShader: `
      varying float vAlpha;
      varying float vTint;
      void main() {
        float d = length(gl_PointCoord - .5);
        float a = smoothstep(.5, .15, d) * vAlpha;
        vec3 col = mix(vec3(.89, .90, .97), vec3(.90, .54, .31), vTint);
        gl_FragColor = vec4(col, a);
      }`,
  });
  return new THREE.Points(geometry, material);
}

export function createVacuumScene(canvas, { isSmall }) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  const dpr = Math.min(window.devicePixelRatio, isSmall ? 1.5 : 2);
  renderer.setPixelRatio(dpr);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.02).texture;

  const key = new THREE.DirectionalLight(0xffffff, 2);
  key.position.set(3, 5, 6);
  const rim = new THREE.DirectionalLight(0x6f7dff, 3);
  rim.position.set(-5, 2, -4);
  const floorLight = new THREE.PointLight(0xbfd0ff, 0, 5);
  floorLight.position.set(0, -2.1, 1);
  scene.add(key, rim);

  const parts = {
    head: buildHead(), wand: buildWand(), bin: buildBin(), fan: buildFan(),
    motor: buildMotor(), filter: buildFilter(), handle: buildHandle(), battery: buildBattery(),
  };
  const explodeBy = {
    head: [0, -0.75, 0.2], wand: [0, -0.32, 0], bin: [0, 0, 0], fan: [0, 0.34, 0],
    motor: [0, 0.68, 0], filter: [0, 1.15, 0], handle: [0, 0.68, -0.55], battery: [0, -0.1, -0.95],
  };
  // Where the DOM labels point, in model space, before the parts move
  const anchors = {
    filter: new THREE.Vector3(0.27, 2.05, 0),
    motor: new THREE.Vector3(0.32, 1.68, 0),
    bin: new THREE.Vector3(0.36, 0.84, 0),
    battery: new THREE.Vector3(0, 0.4, -0.56),
    head: new THREE.Vector3(0.7, -2.2, 0),
  };

  const model = new THREE.Group();
  Object.values(parts).forEach((p) => model.add(p));
  model.add(floorLight);
  scene.add(model);

  const dust = buildDust(isSmall ? 700 : 1600);
  dust.material.uniforms.uPixel.value = dpr;
  scene.add(dust);

  // GSAP tweens this object, the render loop reads it
  const state = {
    x: 0, y: 0, rotX: 0, rotY: 0.9, rotZ: 0, camZ: 11, explode: 0, suck: 0,
    floorGlow: 0, spin: 0.4, intro: 0,
  };
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  window.addEventListener('pointermove', (e) => {
    pointer.x = e.clientX / window.innerWidth - 0.5;
    pointer.y = e.clientY / window.innerHeight - 0.5;
  }, { passive: true });

  const resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', resize);
  resize();
  watchQuality(renderer, resize);

  const projected = new THREE.Vector3();
  let labels = [];
  const headTarget = new THREE.Vector3();

  function frame(time) {
    pointer.sx += (pointer.x - pointer.sx) * 0.06;
    pointer.sy += (pointer.y - pointer.sy) * 0.06;

    model.position.set(state.x, state.y, 0);
    model.rotation.set(
      state.rotX + pointer.sy * 0.12,
      state.rotY + pointer.sx * 0.3,
      state.rotZ,
    );
    camera.position.z = state.camZ;

    for (const name in parts) {
      const [x, y, z] = explodeBy[name];
      parts[name].position.set(x * state.explode, y * state.explode, z * state.explode);
    }
    parts.bin.userData.cyclone.rotation.y = time * state.spin * 3;
    parts.fan.userData.fan.rotation.y = time * state.spin * 6;
    floorLight.intensity = state.floorGlow * 14;

    model.updateMatrixWorld();
    headTarget.set(0, -2.2, 0.3);
    parts.head.localToWorld(headTarget);
    const u = dust.material.uniforms;
    u.uTime.value = time;
    u.uSuck.value = state.suck;
    u.uTarget.value.copy(headTarget);
    dust.visible = state.suck < 1;

    renderer.render(scene, camera);

    // Labels follow the parts they name
    const w = window.innerWidth;
    const h = window.innerHeight;
    const visible = Math.max(0, (state.explode - 0.7) / 0.3);
    for (const { el, name } of labels) {
      projected.copy(anchors[name]);
      parts[name].localToWorld(projected);
      projected.project(camera);
      const px = (projected.x * 0.5 + 0.5) * w;
      const py = (-projected.y * 0.5 + 0.5) * h;
      el.style.transform = `translate(${px}px, ${py}px) ${el.classList.contains('label--under') ? 'translateX(-50%)' : 'translateY(-50%)'}`;
      el.style.opacity = visible;
    }
  }

  return {
    state,
    frame,
    setLabels(els) {
      labels = els.map((el) => ({ el, name: el.dataset.part }));
    },
  };
}
