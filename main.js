import "./tailwind.css"; //to avoid caching issues and to preload before main.js
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";
import atmosphereVertexShader from "./shaders/atmosphereVertex.glsl";
import atmosphereFragmentShader from "./shaders/atmosphereFragment.glsl";
import gsap from "gsap";
import { fetchVisitorData } from "./controllers/posthog";
import { performLineAnimations } from "./utils/lineAnimation";
import ThreeGlobe from "three-globe";

import { TrackballControls } from "three/addons/controls/TrackballControls.js";

const canvasContainer = document.querySelector("#canvasContainer");

// 1. Declare Scene
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

// 2. Create Earth Sphere
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

// 3. Create Atmosphere
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

//4. Declare Three.js Group
// to add a secondary spin effect
const group = new THREE.Group();
group.add(sphere); //similar like adding scene
scene.add(group);

//5. Declare point geometry
const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
});

const starVertices = []; //create an empty array
for (let i = 0; i < 10000; i++) {
  const x = (Math.random() - 0.5) * 2000; //make sure the random number lays between -0.5 to 0.5
  const y = (Math.random() - 0.5) * 2000;
  // const z = -Math.random() * 2000;
  const z = (Math.random() - 0.5) * 2000;

  starVertices.push(x, y, z); //push into an array for starVertices
}

// console.log(starVertices);
starGeometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(starVertices, 3)
);

const stars = new THREE.Points(starGeometry, starMaterial);
group.add(stars);

camera.position.z = 15;

//6.

//call for posthog rest api
function lineAnimationWithRestCall() {
  fetchVisitorData(
    "GET",
    "https://app.posthog.com/api/projects/55183/session_recordings/?limit=5"
  )
    .then((data) => {
      console.log(data.results); // Log the resolved value
      data.results.forEach((item) => {
        console.log(item);
        // Do something with each item in the array

        // const origin = {
        //   //Singapore
        //   latitude: 1.3521,
        //   longitude: 103.8198,
        // };

        const origin = {
          //Kuala Lumpur
          latitude: 3.1319,
          longitude: 101.6841,
        };

        // Extracting data
        var startTime = item.start_time;
        var geoipLatitude = item.person.properties["$geoip_latitude"];
        var geoipLongitude = item.person.properties["$geoip_longitude"];
        var os = item.person.properties["$os"];
        var browser = item.person.properties["$browser"];
        var deviceType = item.person.properties["$device_type"];
        var geoipCityName = item.person.properties["$geoip_city_name"];
        var geoipCountryCode = item.person.properties["$geoip_country_code"];
        var osVersion = item.person.properties["$os_version"];
        var initialReferrer = item.person.properties["$initial_referrer"];
        var geoipContinentName =
          item.person.properties["$geoip_continent_name"];
        var uuid = item.person.uuid;

        //parse the date time
        // Parse the timestamp
        const date = new Date(startTime);

        // Extract hour, minute, and second components
        const hours = date.getUTCHours();
        const minutes = date.getUTCMinutes();
        const seconds = date.getUTCSeconds();

        // Format components to ensure two digits (e.g., 01 instead of 1)
        const formattedHours = String(hours).padStart(2, "0");
        const formattedMinutes = String(minutes).padStart(2, "0");
        const formattedSeconds = String(seconds).padStart(2, "0");

        // Concatenate components to form the 24-hour time string
        const time24Hours = `${date} ${formattedHours}:${formattedMinutes}:${formattedSeconds}`;

        //TubeGeometry Animation
        let showOriginVisitorLineAnimation = performLineAnimations({
          startLatitude: geoipLatitude,
          startLongitude: geoipLongitude,
          endLatitude: origin.latitude,
          endLongitude: origin.longitude,
        });
        group.add(showOriginVisitorLineAnimation);

        //     console.log(time24Hours); // Output: 14:20:50

        //     // Output the extracted data
        //     console.log("start_time:", startTime);
        //     console.log("geoip_latitude:", geoipLatitude);
        //     console.log("geoip_longitude:", geoipLongitude);
        //     console.log("os:", os);
        //     console.log("browser:", browser);
        //     console.log("device_type:", deviceType);
        //     console.log("geoip_city_name:", geoipCityName);
        //     console.log("geoip_country_code:", geoipCountryCode);
        //     console.log("os_version:", osVersion);
        //     console.log("initial_referrer:", initialReferrer);
        //     console.log("geoip_continent_name:", geoipContinentName);
        //     console.log("uuid:", uuid);
        //   })

        // console.log(getdata);
        // tubeGeometry.country = getdata;
        // tubeGeometry.population = "111";
      });
    })
    .catch((error) => {
      console.error(error); // Log any errors
    });
}
lineAnimationWithRestCall();

// Fetch data every 5 seconds (adjust the interval as needed)
setInterval(() => {
  console.log("Repeat animation triggered");
  lineAnimationWithRestCall();
}, 10000);

// //TubeGeometry Animation
// const tubeGeometry1 = performLineAnimations({
//   startLatitude: 39.9042,
//   startLongitude: 116.4074,
//   endLatitude: 1.3521,
//   endLongitude: 103.8198,
// });
// group.add(tubeGeometry1);

// putting {} inside the param function will not need to care about the order you put into the data
function createBox({ lat, long, country, population }) {
  //can use raycaster in three.js to show some value on the sphere point
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.1, 0.4), //scale x , scale y , scale z
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
    new THREE.Matrix4().makeTranslation(0, 0, -0.2) //translate object in 3d SPACE x,y,z , 0.8/2
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
// }\\
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
      const geometryType = mesh.geometry.type;
      return geometryType === "BoxGeometry" || geometryType === "TubeGeometry";
    })
  );

  // Check if any intersection involves a TubeGeometry
  const isIntersectingTube = intersects.some((intersection) => {
    return intersection.object.geometry.type === "TubeGeometry";
  });

  // Check if any intersection involves a TubeGeometry
  const isIntersectingBox = intersects.some((intersection) => {
    return intersection.object.geometry.type === "BoxGeometry";
  });

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
    const intersectedObjects = intersects[i].object;
    // console.log(intersects[i]);
    // console.log("detected");
    // intersects[i].object.material.color.set(0xff0000);

    gsap.set(popUpEl, {
      display: "block",
    });

    intersectedObjects.material.opacity = 1; //if intersect any object change opacity to 1

    if (isIntersectingBox) {
      populationEl.innerHTML = intersectedObjects.country;
      populationValueEl.innerHTML = intersectedObjects.population;
    } else if (isIntersectingTube) {
      populationEl.innerHTML = intersectedObjects.country;
      populationValueEl.innerHTML = intersectedObjects.population;
    }
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
