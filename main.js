import "./tailwind.css"; //to avoid caching issues and to preload before main.js
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";
import atmosphereVertexShader from "./shaders/atmosphereVertex.glsl";
import atmosphereFragmentShader from "./shaders/atmosphereFragment.glsl";
import gsap from "gsap";

const canvasContainer = document.querySelector("#canvasContainer");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
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

//// for the 3D animated lines to travel from one point to another

// Determine start and end points on the globe's surface
var startPoint = new THREE.Vector3(5, 0, earthRadius); // Example start point
var endPoint = new THREE.Vector3(0, 5, earthRadius); // Example end point

// Create a curved line using Bezier curve
var curve = new THREE.QuadraticBezierCurve3(
  startPoint,
  new THREE.Vector3(0, 10, 0), // Control point for the curve
  endPoint
);

// var points = curve.getPoints(50); // Number of points along the curve

// Create a line geometry between the start and end points
// var lineGeometry = new THREE.BufferGeometry().setFromPoints([
//   startPoint,
//   endPoint,
// ]);
// var lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
// var line = new THREE.Line(lineGeometry, lineMaterial);
// group.add(line);

// Animate the line's vertices with parameter
var animationDuration = 5000; // in milliseconds
var animationStartTime = Date.now();

camera.position.z = 15;

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

// 1.3521° N, 103.8198° E singapore ( in degree)
// 3.1319° N, 101.6841° E KL (in angle degree)
createBox({
  lat: 1.3521,
  long: 103.8198,
  country: "Singapore",
  population: "5.454 million",
}); // Singapore
createBox({
  lat: 3.1319,
  long: 101.6841,
  country: "Kuala Lumpur",
  population: "1.808 million",
}); //KL
createBox({
  lat: 39.9042,
  long: 116.4074,
  country: "Beijing",
  population: "21.54 million",
}); // Beijing 39.9042° N, 116.4074° E
createBox({
  lat: 23.6345,
  long: -102.5528,
  country: "Mexico ",
  population: "126.7 million",
}); //mexico 23.6345° N, 102.5528° W
createBox({
  lat: -14.235,
  long: -51.9235,
  country: "Brazil",
  population: "214.3 million",
}); // Brazil 14.2350° S, 51.9253° W

console.log(group.children);
// point.position.z = earthRadius + 1; // because globe radius is 5 , inside it cant be seen

sphere.rotation.y = -Math.PI / 2; //correct the initial overlay position of texture image to the sphere

const mouse = {
  x: undefined,
  y: undefined,
}; // vector 2 pointer based on raycaster threejs

const raycaster = new THREE.Raycaster();

const popUpEl = document.querySelector("#popUpEl");
const populationEl = document.querySelector("#populationEl");
const populationValueEl = document.querySelector("#populationValueEl");

console.log(populationValueEl); // to check if we are select things

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);

  // group.rotation.y += 0.002;

  // avoid globe not loading waiting for mouse input
  if (mouse.x) {
    gsap.to(group.rotation, {
      x: -mouse.y * 1.8,
      y: mouse.x * 1.8,
      duration: 2,
    });
  }

  var now = Date.now();
  var progress = (now - animationStartTime) / animationDuration;

  // Update sphere position based on animation progress along the curve
  var currentPosition = curve.getPointAt(progress);
  group.position.copy(currentPosition);

  // // Update line position based on animation progress
  // var currentPosition = new THREE.Vector3()
  //   .copy(startPoint)
  //   .lerp(endPoint, progress);
  // line.geometry.attributes.position.setXYZ(
  //   1,
  //   currentPosition.x,
  //   currentPosition.y,
  //   currentPosition.z
  // );
  // line.geometry.attributes.position.needsUpdate = true;

  // Stop animation when progress reaches 1
  if (progress >= 1) {
    cancelAnimationFrame(animate);
  }

  //Raycaster rendering function
  // update the picking ray with the camera and pointer position
  raycaster.setFromCamera(mouse, camera);

  // calculate objects intersecting the picking ray , can console log out the filter to see what is it
  const intersects = raycaster.intersectObjects(
    group.children.filter((mesh) => {
      return mesh.geometry.type === "BoxGeometry";
    })
  );

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
    console.log(box);
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

addEventListener("mousemove", (event) => {
  mouse.x = ((event.clientX - innerWidth / 2) / (innerWidth / 2)) * 2 - 1; // range from -1 to 1 raycasting into the region canvas
  mouse.y = -(event.clientY / innerHeight) * 2 + 1;

  // let the popup follow our mouse
  gsap.set(popUpEl, {
    x: event.clientX,
    y: event.clientY,
  });
});
