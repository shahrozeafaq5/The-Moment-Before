import * as THREE from "three";

import gsap from "gsap";

import {
  ScrollTrigger
} from "gsap/ScrollTrigger";

import "./style.css";


gsap.registerPlugin(
  ScrollTrigger
);


/* --------------------------------
   THREE SETUP
-------------------------------- */

const canvas =
  document.querySelector("#bg");


const scene =
  new THREE.Scene();


const camera =
  new THREE.PerspectiveCamera(
    75,
    window.innerWidth /
      window.innerHeight,
    0.1,
    1000
  );


camera.position.z = 5;


const renderer =
  new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });


renderer.setClearColor(
  0x000000,
  0
);


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


/* --------------------------------
   TEMP MODEL
-------------------------------- */

const geometry =
  new THREE.BoxGeometry(
    1.7,
    1.7,
    1.7
  );


const material =
  new THREE.MeshStandardMaterial({
    color: 0x252525,

    roughness: 0.35,

    metalness: 0.1,
  });


const cube =
  new THREE.Mesh(
    geometry,
    material
  );


cube.position.set(
  1.7,
  0,
  0
);


cube.rotation.set(
  0.1,
  -0.4,
  0
);


scene.add(cube);


/* --------------------------------
   LIGHTS
-------------------------------- */

const ambientLight =
  new THREE.AmbientLight(
    0xffffff,
    1.5
  );


scene.add(
  ambientLight
);


const directionalLight =
  new THREE.DirectionalLight(
    0xffffff,
    3
  );


directionalLight.position.set(
  4,
  5,
  5
);


scene.add(
  directionalLight
);


/* --------------------------------
   HERO -> ABOUT
-------------------------------- */

const aboutTimeline =
  gsap.timeline({
    scrollTrigger: {

      trigger: ".about",

      start: "top bottom",

      end: "top center",

      scrub: 1,

    },
  });


aboutTimeline.to(
  cube.position,
  {
    x: -1.7,

    y: -0.3,

    z: 0.2,
  },
  0
);


aboutTimeline.to(
  cube.rotation,
  {
    x: 0.15,

    y: Math.PI * 0.7,

    z: -0.12,
  },
  0
);


aboutTimeline.to(
  cube.scale,
  {
    x: 1.1,

    y: 1.1,

    z: 1.1,
  },
  0
);


/* --------------------------------
   ABOUT -> PROFILE
-------------------------------- */

const profileTimeline =
  gsap.timeline({
    scrollTrigger: {

      trigger: ".profile",

      start: "top bottom",

      end: "top center",

      scrub: 1,

    },
  });


profileTimeline.to(
  cube.position,
  {
    x: 1.5,

    y: 0.5,

    z: 0,
  },
  0
);


profileTimeline.to(
  cube.rotation,
  {
    x: -0.15,

    y: Math.PI * 1.35,

    z: 0.15,
  },
  0
);


profileTimeline.to(
  cube.scale,
  {
    x: 0.9,

    y: 0.9,

    z: 0.9,
  },
  0
);


/* --------------------------------
   MODEL EXIT
-------------------------------- */

const modelExit =
  gsap.timeline({
    scrollTrigger: {

      trigger: ".projects",

      start: "top bottom",

      end: "top center",

      scrub: 1,

    },
  });


modelExit.to(
  cube.position,
  {
    x: 0,

    y: -3,

    z: -2,
  },
  0
);


modelExit.to(
  cube.rotation,
  {
    x: 0.8,

    y: Math.PI * 2,

    z: 0.5,
  },
  0
);


modelExit.to(
  cube.scale,
  {
    x: 0,

    y: 0,

    z: 0,
  },
  0
);


/* --------------------------------
   PROJECT SLIDES
-------------------------------- */

const projectSlides =
  document.querySelectorAll(
    ".project-slide"
  );


gsap.set(
  projectSlides,
  {
    autoAlpha: 0,
  }
);


gsap.set(
  ".project-1",
  {
    autoAlpha: 1,
  }
);


const projectTimeline =
  gsap.timeline({
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

projectTimeline.to(
  {},
  {
    duration: 0.5,
  }
);


/* PROJECT 1 OUT */

projectTimeline.to(
  ".project-1",
  {
    x: -150,

    autoAlpha: 0,

    duration: 1,
  }
);


/* PROJECT 2 IN */

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

projectTimeline.to(
  {},
  {
    duration: 0.5,
  }
);


/* PROJECT 2 OUT */

projectTimeline.to(
  ".project-2",
  {
    x: -150,

    autoAlpha: 0,

    duration: 1,
  }
);


/* PROJECT 3 IN */

projectTimeline.fromTo(
  ".project-3",

  {
    x: -150,

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

projectTimeline.to(
  {},
  {
    duration: 0.7,
  }
);


/* --------------------------------
   RENDER
-------------------------------- */

function animate() {

  requestAnimationFrame(
    animate
  );


  renderer.render(
    scene,
    camera
  );

}


animate();


/* --------------------------------
   RESIZE
-------------------------------- */

window.addEventListener(
  "resize",
  () => {

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

  }
);