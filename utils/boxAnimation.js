import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { earthRadius, group } from "../main";
import gsap from "gsap";

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

export { createBox };
