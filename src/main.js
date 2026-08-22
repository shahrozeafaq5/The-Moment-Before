import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import Lenis from "lenis";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const observationVideo = document.querySelector("#observationVideo");
const captureCanvas = document.querySelector("#captureCanvas");
const threeCanvas = document.querySelector("#threeCanvas");
const chapterNumber = document.querySelector("#chapterNumber");

const prefersReducedMotion =
  window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

const observationLoopStart = 0.04;
const observationLoopEndPadding = 0.12;

function restartObservationVideo() {
  observationVideo.currentTime = observationLoopStart;

  if (!prefersReducedMotion) {
    observationVideo.play().catch(() => {});
  }
}

function maintainObservationLoop() {
  if (
    Number.isFinite(observationVideo.duration) &&
    observationVideo.currentTime >=
      observationVideo.duration - observationLoopEndPadding
  ) {
    restartObservationVideo();
  }

  observationVideo.requestVideoFrameCallback(
    maintainObservationLoop
  );
}

if ("requestVideoFrameCallback" in observationVideo) {
  observationVideo.requestVideoFrameCallback(
    maintainObservationLoop
  );
} else {
  observationVideo.addEventListener(
    "timeupdate",
    () => {
      if (
        Number.isFinite(observationVideo.duration) &&
        observationVideo.currentTime >=
          observationVideo.duration - observationLoopEndPadding
      ) {
        restartObservationVideo();
      }
    }
  );
}

// Safety fallback if a browser reaches the end before the pre-end seek runs.
observationVideo.addEventListener(
  "ended",
  restartObservationVideo
);

const isSmallViewport =
  window.matchMedia(
    "(max-width: 768px)"
  ).matches;

const lenis = prefersReducedMotion
  ? null
  : new Lenis({
      smoothWheel: true,
      lerp: 0.09,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.1,
      syncTouch: false,
      anchors: true,
      autoRaf: false,
      autoResize: true,
      overscroll: true,
      respectReducedMotion: true
    });

if (lenis) {
  lenis.on(
    "scroll",
    ScrollTrigger.update
  );

  gsap.ticker.add(time => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
}

class FrameSequence {
  constructor({
    canvas,
    frameCount,
    folder,
    prefix = "frame_",
    extension = "jpg",
    padding = 4,
    maxCachedFrames =
      isSmallViewport ? 8 : 12
  }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.frameCount = frameCount;
    this.folder = folder;
    this.prefix = prefix;
    this.extension = extension;
    this.padding = padding;
    this.maxCachedFrames =
      maxCachedFrames;

    this.preloadRadius =
      isSmallViewport ? 2 : 4;

    this.currentFrame = 1;
    this.images = new Map();
    this.loading = new Set();

    this.resize();

    window.addEventListener("resize", () => {
      this.resize();
    });

    this.loadFrame(1);
  }

  getURL(frame) {
    const number = String(frame).padStart(this.padding, "0");

    return `${this.folder}/${this.prefix}${number}.${this.extension}`;
  }

  loadFrame(frame) {
    frame = Math.max(
      1,
      Math.min(frame, this.frameCount)
    );

    if (this.images.has(frame)) {
      this.draw(
        this.images.get(frame)
      );

      return;
    }

    this.requestFrame(frame);
  }

  requestFrame(frame) {
    if (
      this.images.has(frame) ||
      this.loading.has(frame)
    ) {
      return;
    }

    this.loading.add(frame);

    const image = new Image();

    image.src = this.getURL(frame);

    image.onload = () => {
      this.loading.delete(frame);

      this.images.set(
        frame,
        image
      );

      this.trimCache();

      if (frame === this.currentFrame) {
        this.draw(image);
      }
    };

    image.onerror = () => {
      this.loading.delete(frame);
    };
  }

  setFrame(frame) {
    frame = Math.round(frame);

    frame = Math.max(
      1,
      Math.min(frame, this.frameCount)
    );

    this.currentFrame = frame;

    this.loadFrame(frame);

    for (
      let offset = 1;
      offset <= this.preloadRadius;
      offset++
    ) {
      const next = frame + offset;
      const previous = frame - offset;

      if (next <= this.frameCount) {
        this.preload(next);
      }

      if (previous >= 1) {
        this.preload(previous);
      }
    }
  }

  preload(frame) {
    this.requestFrame(frame);
  }

  trimCache() {
    if (
      this.images.size <=
      this.maxCachedFrames
    ) {
      return;
    }

    const framesByDistance =
      [...this.images.keys()]
        .filter(
          frame =>
            frame !== this.currentFrame
        )
        .sort(
          (a, b) =>
            Math.abs(
              b - this.currentFrame
            ) -
            Math.abs(
              a - this.currentFrame
            )
        );

    while (
      this.images.size >
        this.maxCachedFrames &&
      framesByDistance.length
    ) {
      this.images.delete(
        framesByDistance.shift()
      );
    }
  }

  draw(image) {
    if (!image) return;

    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;

    const imageRatio =
      image.width / image.height;

    const canvasRatio =
      canvasWidth / canvasHeight;

    let drawWidth;
    let drawHeight;

    if (imageRatio > canvasRatio) {
      drawHeight = canvasHeight;
      drawWidth = drawHeight * imageRatio;
    } else {
      drawWidth = canvasWidth;
      drawHeight = drawWidth / imageRatio;
    }

    const x =
      (canvasWidth - drawWidth) / 2;

    const y =
      (canvasHeight - drawHeight) / 2;

    this.ctx.clearRect(
      0,
      0,
      canvasWidth,
      canvasHeight
    );

    this.ctx.drawImage(
      image,
      x,
      y,
      drawWidth,
      drawHeight
    );
  }

  resize() {
    const dpr = Math.min(
      window.devicePixelRatio,
      2
    );

    this.canvas.width =
      window.innerWidth * dpr;

    this.canvas.height =
      window.innerHeight * dpr;

    this.canvas.style.width =
      `${window.innerWidth}px`;

    this.canvas.style.height =
      `${window.innerHeight}px`;

    const current =
      this.images.get(
        this.currentFrame
      );

    if (current) {
      this.draw(current);
    }
  }
}

const CAPTURE_FRAME_COUNT = 250;

const captureSequence = new FrameSequence({
  canvas: captureCanvas,
  frameCount: CAPTURE_FRAME_COUNT,
  folder: "/assets/frames2",
  prefix: "ezgif-frame-",
  extension: "jpg",
  padding: 3
});

const scene =
  new THREE.Scene();

const camera =
  new THREE.PerspectiveCamera(
    35,
    window.innerWidth /
      window.innerHeight,
    0.1,
    100
  );

camera.position.set(
  0,
  0,
  6
);

const renderer =
  new THREE.WebGLRenderer({
    canvas: threeCanvas,
    antialias: true,
    alpha: true
  });

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

renderer.setClearColor(
  0x000000,
  0
);

const ambientLight =
  new THREE.AmbientLight(
    0xffffff,
    1.3
  );

scene.add(ambientLight);

const keyLight =
  new THREE.DirectionalLight(
    0xffffff,
    4
  );

keyLight.position.set(
  4,
  4,
  5
);

scene.add(keyLight);

const rimLight =
  new THREE.DirectionalLight(
    0xffffff,
    2
  );

rimLight.position.set(
  -4,
  1,
  -3
);

scene.add(rimLight);

const loader =
  new GLTFLoader();

let cameraModel = null;
let cameraRig = null;
let cameraVignette = null;
let cameraMotionProgress = 0;

function createCameraVignette() {
  const vignetteCanvas =
    document.createElement("canvas");

  vignetteCanvas.width = 512;
  vignetteCanvas.height = 512;

  const context =
    vignetteCanvas.getContext("2d");

  const gradient =
    context.createRadialGradient(
      256,
      256,
      0,
      256,
      256,
      256
    );

  gradient.addColorStop(
    0,
    "rgba(255, 255, 250, 0.72)"
  );
  gradient.addColorStop(
    0.32,
    "rgba(246, 245, 238, 0.38)"
  );
  gradient.addColorStop(
    0.68,
    "rgba(238, 238, 232, 0.1)"
  );
  gradient.addColorStop(
    1,
    "rgba(238, 238, 232, 0)"
  );

  context.fillStyle = gradient;
  context.fillRect(
    0,
    0,
    vignetteCanvas.width,
    vignetteCanvas.height
  );

  const texture =
    new THREE.CanvasTexture(
      vignetteCanvas
    );

  const material =
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      opacity: 0.68
    });

  const vignette =
    new THREE.Sprite(material);

  vignette.position.z = -1.35;
  vignette.scale.set(
    5.1,
    4.15,
    1
  );

  return vignette;
}

function normalizeModel(
  model,
  targetSize = 3
) {
  const box =
    new THREE.Box3()
      .setFromObject(model);

  const size =
    box.getSize(
      new THREE.Vector3()
    );

  const center =
    box.getCenter(
      new THREE.Vector3()
    );

  const maxDimension =
    Math.max(
      size.x,
      size.y,
      size.z
    );

  const scale =
    targetSize /
    maxDimension;

  model.scale.setScalar(scale);

  model.position.sub(
    center.multiplyScalar(
      scale
    )
  );
}

function updateCameraRig(progress) {
  if (!cameraRig) return;

  const rawEntrance =
    Math.min(progress / 0.28, 1);

  const entrance =
    rawEntrance * rawEntrance *
    (3 - 2 * rawEntrance);

  const motion =
    Math.max(
      0,
      (progress - 0.22) / 0.78
    );

  const entranceOffset =
    prefersReducedMotion
      ? 0.25
      : isSmallViewport
        ? 0.6
        : 1.2;

  const horizontalDrift =
    prefersReducedMotion
      ? 0.15
      : isSmallViewport
        ? 0.35
        : 0.7;

  cameraRig.rotation.y =
    -1.35 + entrance * 0.55 +
    motion * Math.PI * 1.5;

  cameraRig.rotation.x =
    -0.12 + entrance * 0.17 +
    motion * 0.15;

  cameraRig.rotation.z =
    -0.08 * (1 - entrance);

  cameraRig.position.x =
    -entranceOffset * (1 - entrance) +
    Math.sin(motion * Math.PI) *
      horizontalDrift;

  cameraRig.position.y =
    0.2 +
    (prefersReducedMotion ? 0.15 : 0.55) *
      (1 - entrance) -
    motion *
      (prefersReducedMotion ? 0.08 : 0.25);

  cameraRig.scale.setScalar(
    0.72 + entrance * 0.28
  );

  if (cameraVignette) {
    cameraVignette.position.x =
      cameraRig.position.x;
    cameraVignette.position.y =
      cameraRig.position.y;

    const vignetteScale =
      0.82 + entrance * 0.18;

    cameraVignette.scale.set(
      5.1 * vignetteScale,
      4.15 * vignetteScale,
      1
    );
  }
}

loader.load(
  "/assets/models/old_8mm_camera.glb",

  (gltf) => {
    cameraModel = gltf.scene;

    normalizeModel(
      cameraModel,
      3.1
    );

    cameraRig = new THREE.Group();
    cameraRig.add(cameraModel);
    scene.add(cameraRig);

    cameraVignette =
      createCameraVignette();
    scene.add(cameraVignette);

    cameraRig.rotation.set(
      0.05,
      -0.8,
      0
    );

    cameraRig.position.set(
      0,
      0.2,
      0
    );

    updateCameraRig(cameraMotionProgress);
  },

  undefined,

  (error) => {
    console.error(
      "Camera model error:",
      error
    );
  }
);

let renderThreeScene = false;

gsap.ticker.add(() => {
  if (!renderThreeScene) return;

  renderer.render(
    scene,
    camera
  );
});

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
  }
);

gsap.from(
  ".hero-variant--white .hero-title .title-mask > span",
  {
    yPercent:
      prefersReducedMotion ? 20 : 120,
    duration: 1.4,
    stagger: 0.1,
    ease: "power4.out"
  }
);

gsap.from(
  ".hero-variant--white .hero-eyebrow, .hero-variant--white .hero-bottom",
  {
    autoAlpha: 0,
    y: 20,
    duration: 1,
    stagger: 0.15,
    delay: 0.5
  }
);

gsap.timeline({
  scrollTrigger: {
    trigger: ".hero",
    start: "top top",
    end:
      isSmallViewport
        ? "+=900"
        : "+=1400",
    scrub: 1,
    pin: true,
    pinSpacing: true
  }
})
.fromTo(
  ".hero-variant--dark",
  {
    clipPath:
      "inset(100% 0% 0% 0%)"
  },
  {
    clipPath:
      "inset(0% 0% 0% 0%)",
    ease: "none"
  }
);

gsap.set(
  observationVideo,
  {
    autoAlpha: 1
  }
);

if (prefersReducedMotion) {
  observationVideo.pause();
} else {
  observationVideo.play().catch(() => {});
}

gsap.to(
  ".hero",
  {
    autoAlpha: 0,
    ease: "none",

    scrollTrigger: {
      trigger: "#before-frame",
      start: "top bottom",
      end: "top 30%",
      scrub: 1.3
    }
  }
);

gsap.to(
  ".cinematic-copy",
  {
    autoAlpha: 0,
    y: -60,
    ease: "none",

    scrollTrigger: {
      trigger:
        "#before-frame",

      start:
        "top top",

      end:
        "+=500",

      scrub:
        true
    }
  }
);

const wordsTl =
  gsap.timeline({
    scrollTrigger: {
      trigger:
        "#before-frame",

      start:
        "top top",

      end:
        "bottom bottom",

      scrub:
        true
    }
  });

wordsTl

.fromTo(
  ".word-light",
  {
    autoAlpha: 0,
    y: 80
  },
  {
    autoAlpha: 1,
    y: 0,
    duration: 0.08
  },
  0.15
)

.to(
  ".word-light",
  {
    autoAlpha: 0,
    y: -30,
    duration: 0.08
  },
  0.28
)

.fromTo(
  ".word-space",
  {
    autoAlpha: 0,
    y: 60
  },
  {
    autoAlpha: 1,
    y: 0,
    duration: 0.08
  },
  0.32
)

.to(
  ".word-space",
  {
    autoAlpha: 0,
    y: -40,
    duration: 0.08
  },
  0.45
)

.fromTo(
  ".word-movement",
  {
    autoAlpha: 0,
    y: 60
  },
  {
    autoAlpha: 1,
    y: 0,
    duration: 0.08
  },
  0.50
)

.to(
  ".word-movement",
  {
    autoAlpha: 0,
    y: -40,
    duration: 0.08
  },
  0.64
)

.fromTo(
  ".word-waiting",
  {
    autoAlpha: 0,
    y: 60
  },
  {
    autoAlpha: 1,
    y: 0,
    duration: 0.08
  },
  0.70
)

.to(
  ".word-waiting",
  {
    autoAlpha: 0,
    y: -30,
    duration: 0.08
  },
  0.86
);

const observeTransition =
  gsap.timeline({
    scrollTrigger: {
      trigger:
        "#observe",

      start:
        "top 100%",

      end:
        "top 35%",

      scrub:
        true
    }
  });

observeTransition

.fromTo(
  "#observe",
  {
    clipPath:
      "inset(100% 0% 0% 0%)"
  },
  {
    clipPath:
      "inset(0% 0% 0% 0%)",

    ease:
      "none"
  },
  0
)

.to(
  observationVideo,
  {
    autoAlpha: 0,
    ease: "none"
  },
  0.65
);
gsap.fromTo(
  ".observe-image",
  {
    yPercent:
      prefersReducedMotion ? 0 : 10,
    scale:
      prefersReducedMotion ? 1.02 : 1.12
  },
  {
    yPercent:
      prefersReducedMotion ? 0 : -10,
    scale: 1,
    ease: "none",

    scrollTrigger: {
      trigger: ".observe-image-wrap",
      start: "top bottom",
      end: "bottom top",
      scrub: true
    }
  }
);
gsap.set(".observe-image-wrap", {
  clipPath: "inset(100% 0% 0% 0%)"
});

gsap.to(".observe-image-wrap", {
  clipPath: "inset(0% 0% 0% 0%)",
  ease: "none",

  scrollTrigger: {
    trigger: ".observe-image-wrap",
    start: "top 85%",
    end: "top 35%",
    scrub: true
  }
});
const observeTextTl = gsap.timeline({
  scrollTrigger: {
    trigger: ".observe-copy",
    start: "top 75%"
  }
});

observeTextTl

.from(".observe-copy .micro-label", {
  autoAlpha: 0,
  y: 20,
  duration: 0.7
})

.from(".observe-copy .display-heading", {
  autoAlpha: 0,
  yPercent: 40,
  duration: 1,
  ease: "power4.out"
}, "-=0.3")

.from(".observe-copy .editorial-copy", {
  autoAlpha: 0,
  y: 40,
  duration: 0.8
}, "-=0.4");
gsap.to("#observe", {
  autoAlpha: 0,
  ease: "none",

  scrollTrigger: {
    trigger: "#camera",
    start: "top bottom",
    end: "top 35%",
    scrub: true
  }
});


gsap.fromTo(
  threeCanvas,

  {
    autoAlpha: 0
  },

  {
    autoAlpha: 1,
    ease: "none",

    scrollTrigger: {
      trigger: "#camera",
      start: "top bottom",
      end: "top 35%",
      scrub: true
    }
  }
);


gsap.fromTo(
  ".camera-intro-copy",
  {
    autoAlpha: 0,
    y: 40
  },
  {
    autoAlpha: 1,
    y: 0,
    ease: "none",
    scrollTrigger: {
      trigger: ".camera-intro-copy",
      start: "top 95%",
      end: "top 55%",
      scrub: true
    }
  }
);


ScrollTrigger.create({
  trigger: "#camera",

  start: "top bottom",
  endTrigger: "#capture",
  end: "top 55%",

  onToggle(self) {
    renderThreeScene = self.isActive;
  },

  onUpdate(self) {
    cameraMotionProgress = self.progress;
    updateCameraRig(cameraMotionProgress);
  }
});


gsap.fromTo(
  ".camera-copy-left",

  {
    autoAlpha: 0,
    x:
      prefersReducedMotion ? -20 : -80
  },

  {
    autoAlpha: 1,
    x: 0,
    ease: "none",

    scrollTrigger: {
      trigger:
        ".camera-copy-left",

      start:
        "top 85%",

      end:
        "top 50%",

      scrub:
        true
    }
  }
);


gsap.fromTo(
  ".camera-copy-right",

  {
    autoAlpha: 0,
    x:
      prefersReducedMotion ? 20 : 80
  },

  {
    autoAlpha: 1,
    x: 0,
    ease: "none",

    scrollTrigger: {
      trigger:
        ".camera-copy-right",

      start:
        "top 85%",

      end:
        "top 50%",

      scrub:
        true
    }
  }
);


gsap.fromTo(
  ".camera-enter-copy",

  {
    autoAlpha: 0,
    y:
      prefersReducedMotion ? 15 : 50
  },

  {
    autoAlpha: 1,
    y: 0,
    ease: "none",

    scrollTrigger: {
      trigger:
        ".camera-enter-copy",

      start:
        "top 85%",

      end:
        "top 55%",

      scrub:
        true
    }
  }
);


ScrollTrigger.create({
  trigger:
    ".camera-enter-copy",

  start:
    "top 75%",

  end:
    "bottom 10%",

  onUpdate(self) {
    if (!cameraRig) return;

    const p = self.progress;
    const zoom =
      1 + p *
      (prefersReducedMotion ? 0.75 : 2.5);

    cameraRig.scale.setScalar(zoom);
    cameraRig.position.z =
      p *
      (prefersReducedMotion ? 0.4 : 1.5);
  }
});
gsap.to(".observe-copy .display-heading", {
  scale: 1.08,
  transformOrigin: "left center",

  scrollTrigger: {
    trigger: "#observe",
    start: "top top",
    end: "bottom bottom",
    scrub: true
  }
});

const cameraToCapture =
  gsap.timeline({
    scrollTrigger: {
      trigger:
        "#capture",

      start:
        "top 100%",

      end:
        "top 55%",

      scrub:
        true
    }
  });

cameraToCapture

.to(
  threeCanvas,
  {
    autoAlpha: 0,
    ease: "none"
  },
  0
)

.fromTo(
  captureCanvas,
  {
    autoAlpha: 0
  },
  {
    autoAlpha: 1,
    ease: "none"
  },
  0
);

ScrollTrigger.create({
  trigger:
    "#capture",

  start:
    "top top",

  end:
    "bottom bottom",

  onUpdate(self) {
    const progress =
      Math.min(
        self.progress /
        0.65,
        1
      );

    const frame =
      1 +
      progress *
      (
        captureSequence.frameCount -
        1
      );

    captureSequence
      .setFrame(frame);
  }
});

gsap.to(
  ".capture-time",
  {
    scale:
      prefersReducedMotion ? 1.08 : 1.4,
    autoAlpha: 0,
    ease: "none",

    scrollTrigger: {
      trigger:
        "#capture",

      start:
        "top top",

      end:
        "30% top",

      scrub:
        true
    }
  }
);

gsap.fromTo(
  ".capture-subtitle",

  {
    autoAlpha: 0,
    y: 100
  },

  {
    autoAlpha: 1,
    y: 0,
    ease: "none",

    scrollTrigger: {
      trigger:
        "#capture",

      start:
        "15% top",

      end:
        "35% top",

      scrub:
        true
    }
  }
);

gsap.fromTo(
  ".capture-result",

  {
    autoAlpha: 0,
    y: 100
  },

  {
    autoAlpha: 1,
    y: 0,
    ease: "none",

    scrollTrigger: {
      trigger:
        ".capture-result",

      start:
        "top 90%",

      end:
        "top 55%",

      scrub:
        true
    }
  }
);

gsap.fromTo(
  ".capture-process-copy",
  {
    autoAlpha: 0,
    y: 60
  },
  {
    autoAlpha: 1,
    y: 0,
    ease: "none",
    scrollTrigger: {
      trigger: ".capture-process-copy",
      start: "top 88%",
      end: "top 55%",
      scrub: true
    }
  }
);

const captureToDarkroom =
  gsap.timeline({
    scrollTrigger: {
      trigger:
        "#darkroom",

      start:
        "top 95%",

      end:
        "top 50%",

      scrub:
        true
    }
  });

captureToDarkroom

.to(
  captureCanvas,
  {
    autoAlpha: 0,
    ease: "none"
  },
  0
);

const darkroomIntro = gsap.timeline({
  scrollTrigger: {
    trigger: ".darkroom-top",
    start: "top 70%"
  }
});

darkroomIntro
  .fromTo(
    ".darkroom-top .micro-label",
    {
      autoAlpha: 0,
      y: 15
    },
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.7,
      ease: "power3.out"
    }
  )
  .fromTo(
    ".darkroom-top .display-heading",
    {
      autoAlpha: 0,
      yPercent: 30
    },
    {
      autoAlpha: 1,
      yPercent: 0,
      duration: 1.25,
      ease: "power4.out"
    },
    "-=0.35"
  )
  .fromTo(
    ".darkroom-copy",
    {
      autoAlpha: 0,
      y: 40
    },
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.9,
      ease: "power3.out"
    },
    "-=0.55"
  );

gsap.fromTo(
  ".developed-image",
  {
    clipPath:
      "inset(100% 0% 0% 0%)",

    filter:
      "grayscale(1) brightness(0.03) contrast(1.8)",

    scale:
      prefersReducedMotion ? 1 : 1.05
  },
  {
    clipPath:
      "inset(0% 0% 0% 0%)",

    filter:
      "grayscale(1) brightness(1) contrast(1.1)",

    scale: 1,

    ease:
      "none",

    scrollTrigger: {
      trigger:
        ".development-stage",

      start:
        "top 75%",

      end:
        "center 30%",

      scrub:
        true
    }
  }
);

const developmentSteps =
  document.querySelectorAll(
    ".development-steps span"
  );

developmentSteps.forEach(
  step => {
    gsap.fromTo(
      step,
      {
        opacity: 0.2,
        x: 15
      },
      {
        opacity: 1,
        x: 0,

        scrollTrigger: {
          trigger: step,

          start:
            "top 80%",

          end:
            "top 60%",

          scrub:
            true
        }
      }
    );
  }
);

const contactHeading = gsap.timeline({
  scrollTrigger: {
    trigger: ".contact-heading",
    start: "top 80%"
  }
});

contactHeading
  .fromTo(
    ".contact-heading .micro-label",
    {
      autoAlpha: 0,
      y: 20
    },
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.65,
      ease: "power3.out"
    }
  )
  .fromTo(
    ".contact-heading h3",
    {
      autoAlpha: 0,
      y: 45
    },
    {
      autoAlpha: 1,
      y: 0,
      duration: 1,
      ease: "power3.out"
    },
    "-=0.3"
  );

gsap.fromTo(
  ".contact-frame",

  {
    autoAlpha: 0,
    y: 60,
    scale: 0.96
  },

  {
    autoAlpha: 1,
    y: 0,
    scale: 1,
    stagger: 0.08,
    duration: 0.8,
    ease: "power3.out",

    scrollTrigger: {
      trigger:
        ".contact-grid",

      start:
        "top 75%"
    }
  }
);

const darkroomToMemory = gsap.timeline({
  scrollTrigger: {
    trigger: "#memory",
    start: "top 95%",
    end: "top 55%",
    scrub: true
  }
});

darkroomToMemory
  .to(
    "#darkroom",
    {
      opacity: 0,
      ease: "none"
    },
    0
  )
  .fromTo(
    ".memory-panel:first-of-type",
    {
      autoAlpha: 0
    },
    {
      autoAlpha: 1,
      ease: "none"
    },
    0
  );

const memoryPanels =
  document.querySelectorAll(
    ".memory-panel"
  );

memoryPanels.forEach(
  (panel, index) => {
      const image =
        panel.querySelector(
          ".memory-image"
        );

      const text =
        panel.querySelector(
          ".memory-text"
        );

      gsap.fromTo(
        image,
        {
          yPercent:
            prefersReducedMotion
              ? 0
              : isSmallViewport
                ? -4
                : -8,
          scale:
            prefersReducedMotion
              ? 1
              : isSmallViewport
                ? 1.02
                : 1.05
        },
        {
          yPercent:
            prefersReducedMotion
              ? 2
              : isSmallViewport
                ? 7
                : 12,
          scale: 1,
          ease: "none",

          scrollTrigger: {
            trigger: panel,

            start:
              "top bottom",

            end:
              "bottom top",

            scrub:
              true
          }
        }
      );

      const textTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: panel,
          start: "top 70%",
          end:
            index === memoryPanels.length - 1
              ? "bottom 5%"
              : "bottom 20%",
          scrub: true
        }
      });

      textTimeline
        .fromTo(
          text,
          {
            autoAlpha: 0,
            y: 70,
            scale: 0.98
          },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.3,
            ease: "none"
          }
        )
        .to(
          text,
          {
            autoAlpha: 1,
            y: 0,
            duration:
              index === memoryPanels.length - 1
                ? 0.55
                : 0.4,
            ease: "none"
          }
        )
        .to(
          text,
          {
            autoAlpha:
              index === memoryPanels.length - 1
                ? 0.2
                : 0,
            y: -40,
            duration: 0.3,
            ease: "none"
          }
        );
  }
);

const archiveItems =
  document.querySelectorAll(
    ".archive-item"
  );

const archivePreview =
  document.querySelector(
    ".archive-preview"
  );

const archivePreviewImage =
  document.querySelector(
    "#archivePreviewImage"
  );

gsap.fromTo(
  "#archive",
  {
    clipPath:
      "inset(100% 0% 0% 0%)"
  },
  {
    clipPath:
      "inset(0% 0% 0% 0%)",
    ease: "none",
    scrollTrigger: {
      trigger: "#archive",
      start: "top 100%",
      end: "top 35%",
      scrub: true
    }
  }
);

const archiveHeader = gsap.timeline({
  scrollTrigger: {
    trigger: ".archive-header",
    start: "top 70%"
  }
});

archiveHeader
  .fromTo(
    ".archive-header .micro-label",
    {
      autoAlpha: 0,
      y: 15
    },
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.6,
      ease: "power3.out"
    }
  )
  .fromTo(
    ".archive-header .display-heading",
    {
      autoAlpha: 0,
      yPercent: 30
    },
    {
      autoAlpha: 1,
      yPercent: 0,
      duration: 1,
      ease: "power4.out"
    },
    "-=0.25"
  )
  .fromTo(
    ".archive-header > p",
    {
      autoAlpha: 0,
      y: 20
    },
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.65,
      ease: "power3.out"
    },
    "-=0.55"
  );

const hasFinePointer =
  window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  ).matches;

if (hasFinePointer) {
  archiveItems.forEach(
    item => {
      const heading =
        item.querySelector("h3");

      const arrow =
        item.lastElementChild;

      item.addEventListener(
        "mouseenter",
        () => {
          archivePreviewImage.src =
            item.dataset.image;

          archivePreviewImage.alt =
            `${heading.textContent.trim()} archive preview`;

          gsap.to(archivePreview, {
            autoAlpha: 1,
            scale: 1,
            duration: 0.35,
            ease: "power3.out"
          });

          gsap.to(heading, {
            x: 20,
            duration: 0.3,
            ease: "power3.out"
          });

          gsap.to(arrow, {
            x: 6,
            y: -6,
            duration: 0.3,
            ease: "power3.out"
          });

          gsap.to(item, {
            backgroundColor:
              "rgba(0, 0, 0, 0.035)",
            duration: 0.3
          });
        }
      );

      item.addEventListener(
        "mouseleave",
        () => {
          gsap.to(archivePreview, {
            autoAlpha: 0,
            scale: 0.94,
            duration: 0.25,
            ease: "power2.out"
          });

          gsap.to(heading, {
            x: 0,
            duration: 0.3,
            ease: "power3.out"
          });

          gsap.to(arrow, {
            x: 0,
            y: 0,
            duration: 0.3,
            ease: "power3.out"
          });

          gsap.to(item, {
            backgroundColor:
              "rgba(0, 0, 0, 0)",
            duration: 0.3
          });
        }
      );
    }
  );

  const previewX = gsap.quickTo(
    archivePreview,
    "x",
    {
      duration: 0.35,
      ease: "power3"
    }
  );

  const previewY = gsap.quickTo(
    archivePreview,
    "y",
    {
      duration: 0.35,
      ease: "power3"
    }
  );

  window.addEventListener(
    "mousemove",
    event => {
      previewX(event.clientX + 30);
      previewY(event.clientY - 150);
    }
  );
}

gsap.from(
  ".archive-item",
  {
    autoAlpha: 0,
    y: 50,
    stagger: 0.1,
    duration: 0.8,
    ease: "power3.out",

    scrollTrigger: {
      trigger:
        ".archive-list",

      start:
        "top 75%"
    }
  }
);

gsap.fromTo(
  "#ending",
  {
    clipPath:
      "inset(100% 0% 0% 0%)"
  },
  {
    clipPath:
      "inset(0% 0% 0% 0%)",
    ease: "none",
    scrollTrigger: {
      trigger: "#ending",
      start: "top 100%",
      end: "top 35%",
      scrub: true
    }
  }
);

gsap.fromTo(
  ".ending-content > p",
  {
    autoAlpha: 0,
    y: 15
  },
  {
    autoAlpha: 1,
    y: 0,
    ease: "none",
    scrollTrigger: {
      trigger: ".ending",
      start: "top 80%",
      end: "top 60%",
      scrub: true
    }
  }
);

gsap.from(
  ".ending-content h2",
  {
    yPercent:
      prefersReducedMotion ? 10 : 40,
    autoAlpha: 0,

    scrollTrigger: {
      trigger:
        ".ending",

      start:
        "top 70%",

      end:
        "top 20%",

      scrub:
        true
    }
  }
);

gsap.fromTo(
  ".ending-footer",
  {
    autoAlpha: 0,
    y: 15
  },
  {
    autoAlpha: 1,
    y: 0,
    ease: "none",
    scrollTrigger: {
      trigger: ".ending",
      start: "top 40%",
      end: "top 20%",
      scrub: true
    }
  }
);

const chapters =
  document.querySelectorAll(
    "[data-chapter]"
  );

chapters.forEach(
  chapter => {
    ScrollTrigger.create({
      trigger: chapter,

      start:
        "top center",

      end:
        "bottom center",

      onEnter() {
        chapterNumber.textContent =
          chapter.dataset.chapter;
      },

      onEnterBack() {
        chapterNumber.textContent =
          chapter.dataset.chapter;
      }
    });
  }
);

window.addEventListener(
  "load",
  () => {
    ScrollTrigger.refresh();
  },
  {
    once: true
  }
);
