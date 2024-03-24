import "./tailwind.css"; //to avoid caching issues and to preload before main.js
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";
import atmosphereVertexShader from "./shaders/atmosphereVertex.glsl";
import atmosphereFragmentShader from "./shaders/atmosphereFragment.glsl";
import gsap from "gsap";
import posthog from "posthog-js";
import ThreeGlobe from "three-globe";
import { geoDistance, geoInterpolate } from "d3-geo";
import { polar2Cartesian } from "./utils/coordTranslate";

import { TrackballControls } from "three/addons/controls/TrackballControls.js";

posthog.init("phc_NRzswrA9ri7puagtOLxF1kO9rtl296tLJWXLOpmDFgd", {
  api_host: "https://app.posthog.com",
});

const canvasContainer = document.querySelector("#canvasContainer");

const scene = new THREE.Scene();

let camera = new THREE.PerspectiveCamera(
  75, //fov
  canvasContainer.offsetWidth / canvasContainer.offsetHeight, //aspect
  0.1, //near
  1000 //far
);
scene.add(camera);

//Prepare "3D Canvas" with rendered WEBGL
const renderer = new THREE.WebGLRenderer({
  antialias: true, //remove jaggy edge,
  canvas: document.querySelector("canvas"),
});
// renderer.setSize(innerWidth, innerHeight); // Set canvas same as innerWidth and innerHeight for windows
renderer.setSize(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
renderer.setPixelRatio(window.devicePixelRatio); // increase pixels as screen size increase
// document.body.appendChild(renderer.domElement); //.domElement is a canvas where the renderer draws its output

function arcLines({ startLat, startLng, endLat, endLng }) {
  const arcsData = {
    startLat: (Math.random() - 0.5) * 180,
    startLng: (Math.random() - 0.5) * 360,
    endLat: (Math.random() - 0.5) * 180,
    endLng: (Math.random() - 0.5) * 360,
    color: ["red", "white", "blue", "green"][Math.round(Math.random() * 3)],
  };
}

//create a sphere with mesh needs 2 things - GEOMETRY (radius, width segments , height segments -polygons) , 2nd MATERIAL MESH
const earthRadius = 5;
const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(earthRadius, 50, 50),
  // new THREE.MeshBasicMaterial  ({
  // color: 0xff0000,
  // map: new THREE.TextureLoader().load("/globe.jpg"), }) );

  // custom Shader
  new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: {
      //declare what need to pass through to texture
      globeTexture: {
        value: new THREE.TextureLoader().load("/globe.jpg"),
      },
    },
  })
);

// create outer 2nd atmosphere
const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(5, 50, 50),
  new THREE.ShaderMaterial({
    vertexShader: atmosphereVertexShader,
    fragmentShader: atmosphereFragmentShader,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
  })
);
atmosphere.scale.set(1.2, 1.2, 1.2);
scene.add(atmosphere);

//Three.js Group - to add a secondary spin effect
const group = new THREE.Group();
group.add(sphere); //similar like adding scene
scene.add(group);

const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
});

const starVertices = []; //create an empty array
for (let i = 0; i < 10000; i++) {
  const x = (Math.random() - 0.5) * 2000; //make sure the random number lays between -0.5 to 0.5
  const y = (Math.random() - 0.5) * 2000;
  const z = -Math.random() * 2000;
  starVertices.push(x, y, z); //push into an array for starVertices
}

// console.log(starVertices);
starGeometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(starVertices, 3)
);

const stars = new THREE.Points(starGeometry, starMaterial);
// console.log(stars);
scene.add(stars);

camera.position.z = 15;

function performAnimations({
  startLatitude,
  startLongitude,
  endLatitude,
  endLongitude,
}) {
  function drawArcOnGlobe({
    alt,
    altAutoScale,
    startLat,
    startLng,
    endLat,
    endLng,
  }) {
    console.log(startLat, startLng, endLat, endLng);
    const getVec = ([lng, lat, alt]) => {
      const { x, y, z } = polar2Cartesian(lat, lng, alt);
      return new THREE.Vector3(x, y, z);
    };

    // Calculate curve
    const startPnt = [startLng, startLat];
    const endPnt = [endLng, endLat];

    let altitude = alt;
    (altitude === null || altitude === undefined) &&
      // By default set altitude proportional to the great-arc distance
      (altitude = (geoDistance(startPnt, endPnt) / 2) * altAutoScale);

    if (altitude) {
      const interpolate = geoInterpolate(startPnt, endPnt);
      const [m1Pnt, m2Pnt] = [0.25, 0.75].map((t) => [
        ...interpolate(t),
        altitude * 1.5,
      ]);
      const curvePoints = [startPnt, m1Pnt, m2Pnt, endPnt].map(getVec);
      const curve = new THREE.CubicBezierCurve3(...curvePoints);

      return curve;
    } else {
      // Ground line
      const alt = 0.001; // Slightly above the ground to prevent occlusion
      return calcSphereArc(
        ...[
          [...startPnt, alt],
          [...endPnt, alt],
        ].map(getVec)
      );
    }

    function calcSphereArc(startVec, endVec) {
      const angle = startVec.angleTo(endVec);
      const getGreatCirclePoint =
        angle === 0
          ? () => startVec.clone() // Points exactly overlap
          : (t) =>
              new THREE.Vector3()
                .addVectors(
                  startVec.clone().multiplyScalar(Math.sin((1 - t) * angle)),
                  endVec.clone().multiplyScalar(Math.sin(t * angle))
                )
                .divideScalar(Math.sin(angle));

      const sphereArc = new THREE.Curve();
      sphereArc.getPoint = getGreatCirclePoint;

      return sphereArc;
    }
  }

  // let startLatitude = 39.904;
  // let startLongitude = 116.4074;
  // let endLatitude = 1.3521;
  // let endLongitude = 103.8198;
  let curve = drawArcOnGlobe({
    alt: 0.5,
    altAutoScale: 1,
    startLat: startLatitude, //39.9042
    startLng: startLongitude, //116.4074
    endLat: endLatitude, //1.3521
    endLng: endLongitude, //103.8198
  });
  // const nMax = tubeGeometry.attributes.position.count;
  const points = curve.getPoints(50);

  console.log(points);

  // Define the number of segments for the tube
  const tubularSegments = 50; // Adjust as needed
  const radialSegments = 8;
  const radius = 0.01; // Adjust as needed

  // Create a tube geometry using the cubic Bezier curve
  const tubeGeometry = new THREE.TubeGeometry(
    curve,
    tubularSegments,
    radius,
    radialSegments,
    false
  );

  // Count the faces
  console.log(`no. vertices:${tubeGeometry.index.count}`); // total vertices or points in the geometry
  const faces = tubeGeometry.index.count / 3; // Each face is composed of three vertices assumed it is triangle
  console.log(`no. faces:${faces}`); //total faces

  function checkFacesIsTriangle(geometry) {
    //geometry must be composed of vector3
    if (geometry.index.count % 3 == 0) {
      console.log(
        `It is a geometry composed of triangle with ${
          geometry.index.count
        } vertices and ${geometry.index.count / 3} faces`
      );
    } else {
      console.log(" it is a geometry composed by other shapes than triangle");
    }
  }
  checkFacesIsTriangle(tubeGeometry);

  console.log(tubeGeometry);

  const tubeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

  // Create a mesh using the tube geometry and material
  const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
  // tubeGeometry.setDrawRange(0, tubeGeometry.index.count);
  tubeGeometry.setDrawRange(0, 0);
  // Add the tube mesh to the scene
  group.add(tubeMesh);

  // Animate the drawing of the curve using GSAP
  // const totalPoints = points.length;
  let drawRange = { value: 0 };
  const totalPoints = tubeGeometry.index.count;
  gsap.to(drawRange, {
    duration: 2, // Animation duration in seconds
    delay: 1, // Delay before animation starts
    ease: "sine.inOut", // Easing function
    value: totalPoints, // Draw up to the total number of points
    onUpdate: function () {
      tubeMesh.geometry.setDrawRange(0, Math.floor(drawRange.value));
    },
    onComplete: function () {
      console.log(`draw animation complete`);
      let drawRange = { value: 0 };
      // Animate slicing the points array point by point from point 0 to point 50
      gsap.to(drawRange, {
        duration: 2, // Animation duration in seconds
        delay: 1, // Delay before animation starts
        ease: "sine.inOut", // Easing function
        value: totalPoints, // Draw up to the total number of points
        onUpdate: function () {
          // Update the line geometry with the new points
          // geometry.setDrawRange(
          //   points.slice(Math.floor(drawRange.value), totalPoints)
          // );
          // console.log(drawRange);
          tubeMesh.geometry.setDrawRange(
            Math.floor(drawRange.value),
            totalPoints
          );
        },
        onComplete: function () {
          // Animation complete
          console.log("Points animation complete");
          // Call the function again after a delay to repeat the animations
          setTimeout(
            performAnimations({
              startLatitude: startLatitude,
              startLongitude: startLongitude,
              endLatitude: endLatitude,
              endLongitude: endLongitude,
            }),
            5000
          ); // Adjust the delay as needed
          console.log("repeat animation triggered");
        },
      });
      // on animation complete, run animation remove point by point of the line arc or trigger another function
    },
  });
}
performAnimations({
  startLatitude: 39.9042,
  startLongitude: 116.4074,
  endLatitude: 1.3521,
  endLongitude: 103.8198,
});

// putting {} inside the param function will not need to care about the order you put into the data
function createBox({ lat, long, country, population }) {
  //can use raycaster in three.js to show some value on the sphere point
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.2, 0.8), //scale x , scale y , scale z
    new THREE.MeshBasicMaterial({
      color: "#3BF7FF",
      opacity: 0.4, // need to make transparent property true only work
      transparent: true,
    })
  );

  //latitude +ve °N upper half , -ve °S lower half
  //longitude +ve °E right half , -ve °W left half of globe
  //convert degree angle to radian
  const latitude = (lat / 180) * Math.PI;
  const longitude = (long / 180) * Math.PI;

  // formula for the 3D space on longitude and latitude, the angle here is radian (latitude and longitude)
  const x = earthRadius * Math.cos(latitude) * Math.sin(longitude);
  const y = earthRadius * Math.sin(latitude);
  const z = earthRadius * Math.cos(latitude) * Math.cos(longitude);

  box.position.x = x;
  box.position.y = y;
  box.position.z = z;

  box.lookAt(0, 0, 0); //perpendicular , boxgeometry always look at the center because sphere is default at 0,0,0
  box.geometry.applyMatrix4(
    new THREE.Matrix4().makeTranslation(0, 0, -0.4) //translate object in 3d SPACE x,y,z , 0.8/2
  ); //translate those boxs that are hiding inside the globe

  group.add(box);

  gsap.to(box.scale, {
    z: 1.4,
    duration: 2, // 5 sec animation
    yoyo: true,
    repeat: -1, //repeat infinite times
    ease: "linear",
    delay: Math.random(),
  });

  box.country = country; //define country property
  box.population = population; //define population of visitor
  // box.scale.z = 0; // scaling the box in z direction
}

createBox({
  lat: 1.3521,
  long: 103.8198,
  country: "Singapore",
  population: "50",
}); // Singapore
createBox({
  lat: 3.1319,
  long: 101.6841,
  country: "Kuala Lumpur",
  population: "23",
}); //KL
createBox({
  lat: 39.9042,
  long: 116.4074,
  country: "Beijing",
  population: "21",
}); // Beijing 39.9042° N, 116.4074° E
createBox({
  lat: 23.6345,
  long: -102.5528,
  country: "Mexico ",
  population: "11",
}); //mexico 23.6345° N, 102.5528° W
createBox({
  lat: -14.235,
  long: -51.9235,
  country: "Brazil",
  population: "22",
}); // Brazil 14.2350° S, 51.9253° W

console.log(group.children);

sphere.rotation.y = -Math.PI / 2; //correct the initial overlay position of texture image to the sphere

group.rotation.offset = {
  x: 0,
  y: 0,
};

const mouse = {
  x: undefined,
  y: undefined,
  down: false,
  xPrev: undefined,
  yPrev: undefined,
}; // vector 2 pointer based on raycaster threejs

const raycaster = new THREE.Raycaster();

const popUpEl = document.querySelector("#popUpEl");
const populationEl = document.querySelector("#populationEl");
const populationValueEl = document.querySelector("#populationValueEl");

console.log(populationValueEl); // to check if we are select things
// function sleep(ms) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);

  group.rotation.y += 0.002;

  //Raycaster rendering function
  // update the picking ray with the camera and pointer position
  raycaster.setFromCamera(mouse, camera);

  // calculate objects intersecting the picking ray , can console log out the filter to see what is it
  const intersects = raycaster.intersectObjects(
    group.children.filter((mesh) => {
      return mesh.geometry.type === "TubeGeometry";
    })
  );
  // console.log(intersects);
  // console.log(group.children);
  group.children.forEach((mesh) => {
    mesh.material.opacity = 0.4; //initialise 0.4 opacity for boxgeometry
    // console.log(mesh); //console out each mesh inside the group.childresn
  });

  //popUpEl invible when not showing
  gsap.set(popUpEl, {
    display: "none",
  });

  //if intersecting
  for (let i = 0; i < intersects.length; i++) {
    const box = intersects[i].object;
    // console.log(intersects[i]);
    // console.log("detected");
    // intersects[i].object.material.color.set(0xff0000);
    box.material.opacity = 1;
    gsap.set(popUpEl, {
      display: "block",
    });

    populationEl.innerHTML = box.country;
    populationValueEl.innerHTML = box.population;
  }
  renderer.render(scene, camera);
}

animate();

//add mouse click and drag
canvasContainer.addEventListener("mousedown", ({ clientX, clientY }) => {
  mouse.down = true;
  mouse.xPrev = clientX;
  mouse.yPrev = clientY;
  // console.log(mouse.down);
});

//follow mouse move
addEventListener("mousemove", (event) => {
  //for xl screen size
  if (innerWidth >= 1200) {
    mouse.x = ((event.clientX - innerWidth / 2) / (innerWidth / 2)) * 2 - 1; // range from -1 to 1 raycasting into the region canvas
    mouse.y = -(event.clientY / innerHeight) * 2 + 1;
    // console.log(mouse.y);
  } else {
    //get the offset from canvasContainer
    const offset = canvasContainer.getBoundingClientRect().top;
    // console.log(offset);
    mouse.x = (event.clientX / innerWidth) * 2 - 1; // range from -1 to 1 raycasting into the region canvas
    mouse.y = -(event.clientY / innerHeight) * 2 + 1;
    // console.log(mouse.y);
  }

  // let the popup follow our mouse
  gsap.set(popUpEl, {
    x: event.clientX,
    y: event.clientY,
  });

  if (mouse.down) {
    event.preventDefault();
    // console.log("turn the earth");
    const deltaX = event.clientX - mouse.xPrev;
    const deltaY = event.clientY - mouse.yPrev;

    group.rotation.offset.x += deltaY * 0.005;
    group.rotation.offset.y += deltaX * 0.005;

    gsap.to(group.rotation, {
      x: group.rotation.offset.x,
      y: group.rotation.offset.y,
      duration: 2,
    });

    mouse.xPrev = event.clientX;
    mouse.yPrev = event.clientY;
    // console.log(deltaX);
  }
});

//release mouse could happen outside canvasContainer
addEventListener("mouseup", (event) => {
  mouse.down = false;
  // console.log(mouse.down);
});

//by default already window.addEventListener, no need to quote out
addEventListener("resize", () => {
  renderer.setSize(canvasContainer.offsetWidth, canvasContainer.offsetHeight);

  camera = new THREE.PerspectiveCamera(
    75, //fov
    canvasContainer.offsetWidth / canvasContainer.offsetHeight, //aspect
    0.1, //near
    1000 //far
  );

  //has to recall so the camera is futher back because  THREE.PerspectiveCamera was call
  camera.position.z = 15;

  // console.log("resize");
});

canvasContainer.addEventListener("touchstart", (event) => {
  mouse.down = true;
  event.clientX = event.touches[0].clientX;
  event.clientY = event.touches[0].clientY;

  mouse.xPrev = event.clientX;
  mouse.yPrev = event.clientY;
});

// mobile responsiveness
//follow mouse move
addEventListener(
  "touchmove",
  (event) => {
    // console.log(event);
    // console.log("touchmove scroll:" + window.blockMenuHeaderScroll);

    event.clientX = event.touches[0].clientX;
    event.clientY = event.touches[0].clientY;
    // console.log(event.clientX);
    // console.log("mousedown:" + mouse.down);
    const doesIntersect = raycaster.intersectObjects([sphere]);
    console.log(doesIntersect);

    //get the offset from canvasContainer
    const offset = canvasContainer.getBoundingClientRect().top;
    // console.log(offset);
    mouse.x = (event.clientX / innerWidth) * 2 - 1; // range from -1 to 1 raycasting into the region canvas
    mouse.y = -(event.clientY / innerHeight) * 2 + 1;
    console.log(offset, mouse.x, mouse.y);

    // let the popup follow our mouse
    gsap.set(popUpEl, {
      x: event.clientX,
      y: event.clientY,
    });
    // window.blockMenuHeaderScroll = true;

    //for locking scroll when rotating the globe
    if (doesIntersect.length > 0) {
      //if does intersect any mesh, then run the rest of the code
      window.blockMenuHeaderScroll = true;
      console.log("touchmove scroll:" + window.blockMenuHeaderScroll);

      // mouse.down = true;
      // console.log("mousedown:" + mouse.down);
    }

    if (window.blockMenuHeaderScroll) {
      event.preventDefault();
      console.log("blocked");
    }

    if (mouse.down) {
      console.log(event.clientX, event.clientY);

      // console.log("turn the earth");
      const deltaX = event.clientX - mouse.xPrev;
      const deltaY = event.clientY - mouse.yPrev;

      console.log(mouse.xPrev, mouse.yPrev, deltaX, deltaY);
      group.rotation.offset.x += deltaY * 0.008;
      group.rotation.offset.y += deltaX * 0.008;

      gsap.to(group.rotation, {
        x: group.rotation.offset.x,
        y: group.rotation.offset.y,
        duration: 2,
      });

      mouse.xPrev = event.clientX;
      mouse.yPrev = event.clientY;
      // console.log(deltaX);
    }
  },
  { passive: false }
);

//release mouse could happen outside canvasContainer
addEventListener("touchend", (event) => {
  mouse.down = false;
  window.blockMenuHeaderScroll = false;
  console.log("touchend scroll:" + window.blockMenuHeaderScroll);
});
