varying vec2 vertexUV;//pass x and y coordinates to fragment.sglsl
varying vec3 vertexNormal; // where the direction of the vertex is facing

void main(){
//  glsl language , type 
// vertex shader to display correctly 
vertexUV = uv; // attribute vec2 uv; provided by threejs by default
vertexNormal= normal;// attribute vec2 normal; provided by threejs by default
gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );  //x,y,z,translate/transform w
 
}