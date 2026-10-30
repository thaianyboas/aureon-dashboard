// Cross-provider contract only: caller must obtain real coordinates and explicit calibration.
// This does not derive live position from a camera image or install a vendor backend.
export function floorPosition(sample,calibration,{now=Date.now(),maxAgeMs=15000}={}){
  if(!sample || !calibration || sample.mapId!==calibration.mapId || sample.units!==calibration.units || !calibration.floorId)return null;
  const {x,y}=sample,{matrix}=calibration;const at=Date.parse(sample.updatedAt);
  if(![x,y,at,now,maxAgeMs].every(Number.isFinite)||maxAgeMs<=0||now-at>maxAgeMs||at-now>5000||!Array.isArray(matrix)||matrix.length!==6||!matrix.every(Number.isFinite))return null;
  const [a,b,c,d,e,f]=matrix;if(Math.abs(a*d-b*c)<1e-12)return null;
  const result={x:a*x+c*y+e,z:b*x+d*y+f,floorId:calibration.floorId,mapId:sample.mapId,updatedAt:sample.updatedAt};
  return Number.isFinite(result.x)&&Number.isFinite(result.z)?result:null;
}
