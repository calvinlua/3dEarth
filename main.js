import "./tailwind.css"; //to avoid caching issues and to preload before main.js
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";
import atmosphereVertexShader from "./shaders/atmosphereVertex.glsl";
import atmosphereFragmentShader from "./shaders/atmosphereFragment.glsl";
import gsap from "gsap";

const canvasContainer = document.querySelector("#canvasContainer");

// console.log(vertexShader); //check if custom vertexShader is working
// console.log(fragmentShader);
const scene = new THREE.Scene();
// console.log(scene); // Check whether the import is done
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

//create a sphere
//create with mesh needs 2 things - GEOMETRY (radius, width segments , height segments -polygons) , 2nd MATERIAL MESH
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
// console.log(sphere); //check if sphere working

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
// console.log(sphere); //check if sphere working
atmosphere.scale.set(1.15, 1.15, 1.15);
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

//// for the 3D animated lines to travel from one point to another (from CHATGPT)
// // Determine start and end points on the globe's surface
// var startPoint = new THREE.Vector3(5, 0, 0); // Example start point
// var endPoint = new THREE.Vector3(0, 5, 0); // Example end point

// // Create a line geometry between the start and end points
// var lineGeometry = new THREE.BufferGeometry().setFromPoints([
//   startPoint,
//   endPoint,
// ]);
// var lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
// var line = new THREE.Line(lineGeometry, lineMaterial);
// scene.add(line);

// // Animate the line's vertices
// var animationDuration = 5000; // in milliseconds
// var animationStartTime = Date.now();

camera.position.z = 15;

function createPoint(lat, long) {
  //can use raycaster in three.js to show some value on the sphere point
  const point = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.1, 0.8), //scale x , scale y , scale z
    new THREE.MeshBasicMaterial({
      color: "#ff0000",
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

  point.position.x = x;
  point.position.y = y;
  point.position.z = z;

  point.lookAt(0, 0, 0); //perpendicular , boxgeometry always look at the center because sphere is default at 0,0,0
  point.geometry.applyMatrix4(
    new THREE.Matrix4().makeTranslation(0, 0, -0.4) //translate object in 3d SPACE x,y,z , 0.8/2
  ); //translate those points that are hiding inside the globe

  group.add(point);
}

// 1.3521° N, 103.8198° E singapore ( in degree)
// 3.1319° N, 101.6841° E KL (in angle degree)
createPoint(1.3521, 103.8198); // Singapore
createPoint(3.1319, 101.6841); //KL
createPoint(23.6345, -102.5528); //mexico 23.6345° N, 102.5528° W
createPoint(-14.235, -51.9235); // Brazil 14.2350° S, 51.9253° W
createPoint(39.9042, 116.4074); // Beijing 39.9042° N, 116.4074° E

// point.position.z = earthRadius + 1; // because globe radius is 5 , inside it cant be seen

sphere.rotation.y = -Math.PI / 2; //correct the initial overlay position of texture image to the sphere

const mouse = {
  x: undefined,
  y: undefined,
};

function animate() {
  requestAnimationFrame(animate);
  //// for the 3D animated lines to travel from one point to another (from CHATGPT)
  // var now = Date.now();
  // var progress = (now - animationStartTime) / animationDuration;

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

  renderer.render(scene, camera);
  // sphere.rotation.y += 0.002;
  // avoid globe not loading waiting for mouse input
  if (mouse.x) {
    gsap.to(group.rotation, {
      x: -mouse.y * 1.8,
      y: mouse.x * 1.8,
      duration: 2,
    });
  }

  //// for the 3D animated lines to travel from one point to another (from CHATGPT)
  // // Stop animation when progress reaches 1
  // if (progress >= 1) {
  //   cancelAnimationFrame(animate);
  // }
}

animate();

addEventListener("mousemove", () => {
  mouse.x = (event.clientX / innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / innerHeight) * 2 + 1;

  // console.log(mouse.x, mouse.y);
});
