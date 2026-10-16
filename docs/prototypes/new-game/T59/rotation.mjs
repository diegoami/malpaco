// [designed] Quantize the rotation matrix to binary fractions so shared integer
// vertices remain exactly shared after transformation. This is reference-layout
// construction, not a game rule or a claim about the predecessor's artwork.
export function rotation(degrees) {
  if(!Number.isFinite(degrees)||Math.abs(degrees)>10)throw Error('Use a finite angle between -10 and 10 degrees');
  const radians=degrees*Math.PI/180;
  const c=Math.round(Math.cos(radians)*256)/256,s=Math.round(Math.sin(radians)*256)/256;
  return {requestedDegrees:degrees,actualDegrees:Math.atan2(s,c)*180/Math.PI,scale:Math.hypot(c,s),c,s};
}
export function rotatePoint([x,y],[cx,cy],matrix) {
  return [cx+(x-cx)*matrix.c-(y-cy)*matrix.s,cy+(x-cx)*matrix.s+(y-cy)*matrix.c];
}
export function islandTransform({x,y,width,height,degrees=0}) {
  const matrix=rotation(degrees),center=[width/2,height/2];
  return point=>{const [u,v]=rotatePoint(point,center,matrix);return [x+u,y+v];};
}
