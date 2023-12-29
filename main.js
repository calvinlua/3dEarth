import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";
import atmosphereVertexShader from "./shaders/atmosphereVertex.glsl";
import atmosphereFragmentShader from "./shaders/atmosphereFragment.glsl";
import gsap from "gsap";

// console.log(vertexShader); //check if custom vertexShader is working
// console.log(fragmentShader);
const scene = new THREE.Scene();
// console.log(scene); // Check whether the import is done
const camera = new THREE.PerspectiveCamera(
  75, //fov
  innerWidth / innerHeight, //aspect
  0.1, //near
  1000 //far
);
scene.add(camera);

//Prepare "3D Canvas" with rendered WEBGL
const renderer = new THREE.WebGLRenderer({
  antialias: true, //remove jaggy edge
});
renderer.setSize(innerWidth, innerHeight); // Set canvas same as innerWidth and innerHeight for windows
renderer.setPixelRatio(window.devicePixelRatio); // increase pixels as screen size increase
document.body.appendChild(renderer.domElement); //.domElement is a canvas where the renderer draws its output

//create a sphere
//create with mesh needs 2 things - GEOMETRY (radius, width segments , height segments -polygons) , 2nd MATERIAL MESH
const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(5, 50, 50),
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

camera.position.z = 15;

const mouse = {
  x: undefined,
  y: undefined,
};

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  sphere.rotation.y += 0.001;
  group.rotation.y = mouse.x;
}

animate();

addEventListener("mousemove", () => {
  mouse.x = (event.clientX / innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / innerHeight) * 2 + 1;

  console.log(mouse.x, mouse.y);
});
