varying vec3 vertexNormal; // where the direction of the vertex is facing

void main(){
vertexNormal= normalize(normalMatrix * normal);// attribute vec2 normal; normal Matrix and normal are provided by threejs by default
gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );  //x,y,z,translate/transform w
 
}