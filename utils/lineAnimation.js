import { geoDistance, geoInterpolate } from "d3-geo";
import { polar2Cartesian } from "./coordTranslate";
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import gsap from "gsap";

function performLineAnimations({
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

  // Define the number of segments for the tube
  const tubularSegments = 50; // Adjust as needed
  const radialSegments = 9;
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

  // if (doesIntersectTubeGeometry) {
  //   tubeMesh.MeshBasicMaterial({ color: 0xffffff });
  // }

  tubeGeometry.setDrawRange(0, 0);
  // Add the tube mesh to the scene
  // group.add(tubeMesh);

  // Animate the drawing of the curve using GSAP
  let drawRange = { value: 0 };
  const totalPoints = tubeGeometry.index.count;

  console.log(`drawing start from"${drawRange.value} to ${totalPoints}`);

  // Nested GSAP loop
  const tl = gsap.timeline({ pause: false }); // Create a timeline for each box

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
      drawRange = { value: 0 }; //reinitialize drawRange
      console.log(`erasing start from"${drawRange.value} to ${totalPoints}`);
      // Animate slicing the points array point by point from point 0 to point 50
      // tl.pause();
      // console.log("Pausing Animation for 10 seconds");
      // setTimeout(tl.resume(), 10000);

      gsap.to(drawRange, {
        duration: 2, // Animation duration in seconds
        delay: 1, // Delay before animation starts
        ease: "sine.inOut", // Easing function
        value: totalPoints, // Draw up to the total number of points
        onUpdate: function () {
          tubeMesh.geometry.setDrawRange(
            Math.floor(drawRange.value) * 3,
            totalPoints
          );
        },
        onComplete: function () {
          // Animation complete
          console.log("Points animation complete");
          // Call the function again after a delay to repeat the animations
          // setTimeout(function () {
          //   performLineAnimations({
          //     startLatitude: startLatitude,
          //     startLongitude: startLongitude,
          //     endLatitude: endLatitude,
          //     endLongitude: endLongitude,
          //   });
          // }, 5000);
          console.log("repeat animation triggered");
        },
      });
    },
  });

  return tubeMesh;
}

export { performLineAnimations };
