import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import "./style.css";

gsap.registerPlugin(ScrollTrigger);


/* --------------------------------
   THREE SETUP
-------------------------------- */

const canvas = document.querySelector("#bg");

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});

renderer.setClearColor(0x000000, 0);

renderer.setSize(
  window.innerWidth,
  window.innerHeight
);

renderer.setPixelRatio(
  Math.min(window.devicePixelRatio, 2)
);


/* --------------------------------
   LIGHTS
-------------------------------- */

const ambientLight = new THREE.AmbientLight(
  0xffffff,
  1.5
);

scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(
  0xffffff,
  3
);

directionalLight.position.set(4, 5, 5);

scene.add(directionalLight);


/* --------------------------------
   MODEL
-------------------------------- */

const gltfLoader = new GLTFLoader();

let model;

gltfLoader.load(
  "/models/head_of_the_greek_god_hades.glb",
  (gltf) => {

    model = gltf.scene;

    model.scale.set(
      0.2,
      0.2,
      0.2
    );

    model.position.set(
      1.7,
      -0.5,
      0
    );

    model.rotation.set(
      0,
      -0.4,
      0
    );

    scene.add(model);

    setupModelAnimations();
  }
);


/* --------------------------------
   MODEL SCROLL ANIMATIONS
-------------------------------- */

function setupModelAnimations() {

  /* HERO -> ABOUT */

  const aboutTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: ".about",
      start: "top bottom",
      end: "top center",
      scrub: 1,
    },
  });

  aboutTimeline.to(
    model.position,
    {
      x: -1.7,
      y: -0.3,
      z: 0.2,
    },
    0
  );

  aboutTimeline.to(
    model.rotation,
    {
      x: 0.15,
      y: Math.PI * 0.7,
      z: -0.12,
    },
    0
  );

  aboutTimeline.to(
    model.scale,
    {
      x: 0.23,
      y: 0.23,
      z: 0.23,
    },
    0
  );


  /* ABOUT -> PROFILE */

  const profileTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: ".profile",
      start: "top bottom",
      end: "top center",
      scrub: 1,
    },
  });

  profileTimeline.to(
    model.position,
    {
      x: 1.5,
      y: 0.3,
      z: 0,
    },
    0
  );

  profileTimeline.to(
    model.rotation,
    {
      x: -0.1,
      y: Math.PI * 1.3,
      z: 0.1,
    },
    0
  );

  profileTimeline.to(
    model.scale,
    {
      x: 0.21,
      y: 0.21,
      z: 0.21,
    },
    0
  );


  /* MODEL EXIT */

  const modelExit = gsap.timeline({
    scrollTrigger: {
      trigger: ".projects",
      start: "top bottom",
      end: "top center",
      scrub: 1,
    },
  });

  modelExit.to(
    model.position,
    {
      y: -3,
      z: -2,
    },
    0
  );

  modelExit.to(
    model.rotation,
    {
      x: 0.6,
      y: Math.PI * 2,
      z: 0.3,
    },
    0
  );

  modelExit.to(
    model.scale,
    {
      x: 0,
      y: 0,
      z: 0,
    },
    0
  );
}


/* --------------------------------
   PROJECT SLIDES
-------------------------------- */

const projectSlides =
  document.querySelectorAll(".project-slide");

gsap.set(projectSlides, {
  autoAlpha: 0,
});

gsap.set(".project-1", {
  autoAlpha: 1,
});


const projectTimeline = gsap.timeline({
  scrollTrigger: {
    trigger: ".projects",

    start: "top top",

    end: "+=3000",

    scrub: 1,

    pin: true,

    // markers: true,
  },
});


/* HOLD PROJECT 1 */

projectTimeline.to({}, {
  duration: 0.5,
});


/* PROJECT 1 -> PROJECT 2 */

projectTimeline.to(
  ".project-1",
  {
    x: -150,
    autoAlpha: 0,
    duration: 1,
  }
);

projectTimeline.fromTo(
  ".project-2",

  {
    x: 150,
    autoAlpha: 0,
  },

  {
    x: 0,
    autoAlpha: 1,
    duration: 1,
  },

  "<"
);


/* HOLD PROJECT 2 */

projectTimeline.to({}, {
  duration: 0.5,
});


/* PROJECT 2 -> PROJECT 3 */

projectTimeline.to(
  ".project-2",
  {
    x: -150,
    autoAlpha: 0,
    duration: 1,
  }
);

projectTimeline.fromTo(
  ".project-3",

  {
    x: 150,
    autoAlpha: 0,
  },

  {
    x: 0,
    autoAlpha: 1,
    duration: 1,
  },

  "<"
);


/* HOLD PROJECT 3 */

projectTimeline.to({}, {
  duration: 0.7,
});


/* PROJECT PROGRESS */

gsap.to(".project-progress-bar", {
  scaleX: 1,

  scrollTrigger: {
    trigger: ".projects",

    start: "top top",

    end: "+=3000",

    scrub: true,
  },
});


/* --------------------------------
   SKILLS
-------------------------------- */

gsap.from(".skills-header", {
  y: 100,
  autoAlpha: 0,

  scrollTrigger: {
    trigger: ".skills",

    start: "top 75%",

    end: "top 40%",

    scrub: 1,
  },
});


const leftSkills =
  document.querySelectorAll(".left-skill");

leftSkills.forEach((skill) => {

  gsap.from(skill, {
    x: -120,
    autoAlpha: 0,

    scrollTrigger: {
      trigger: skill,

      start: "top 90%",

      end: "top 60%",

      scrub: 1,
    },
  });

});


const rightSkills =
  document.querySelectorAll(".right-skill");

rightSkills.forEach((skill) => {

  gsap.from(skill, {
    x: 120,
    autoAlpha: 0,

    scrollTrigger: {
      trigger: skill,

      start: "top 90%",

      end: "top 60%",

      scrub: 1,
    },
  });

});


/* --------------------------------
   RENDER
-------------------------------- */

function animate() {

  requestAnimationFrame(animate);

  renderer.render(
    scene,
    camera
  );
}

animate();


/* --------------------------------
   RESIZE
-------------------------------- */

window.addEventListener("resize", () => {

  camera.aspect =
    window.innerWidth /
    window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );

  renderer.setPixelRatio(
    Math.min(
      window.devicePixelRatio,
      2
    )
  );

  ScrollTrigger.refresh();
});