/** Real-only physical rendering. Original materials/geometry ownership and non-Real looks are preserved. */
import {ACESFilmicToneMapping, AmbientLight, DataTexture, DirectionalLight, DoubleSide, Float32BufferAttribute, Group, HemisphereLight, Mesh, MeshBasicMaterial, MeshDepthMaterial, MeshPhysicalMaterial, NoColorSpace, NormalBlending, PCFSoftShadowMap, PMREMGenerator, RepeatWrapping, RGBADepthPacking, RGBAFormat, SRGBColorSpace, UnsignedByteType, type BufferGeometry, type Camera, type Material, type Scene, type Texture, type WebGLRenderer} from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {makeFoldable, type FoldMasks, type FoldRole} from './fold.ts';
export type PbrKind='architecture'|'wood'|'fabric'|'metal'|'glass'|'stone';
export const PBR_KINDS: readonly PbrKind[]=['architecture','wood','fabric','metal','glass','stone'];
export function furniturePbrKind(type:string):PbrKind {
 if(/glass|window|shower|mirror/.test(type))return 'glass';
 if(/metal|sink|oven|fridge|refrigerator|stove|radiator|tap|steel/.test(type))return 'metal';
 if(/sofa|couch|bed|rug|carpet|armchair|cushion|curtain/.test(type))return 'fabric';
 if(/table|desk|cabinet|shelf|wardrobe|chair|wood|door/.test(type))return 'wood';
 return 'architecture';
}
export function floorPbrKind(type:string):PbrKind {return /wood|parquet|oak|laminate|herringbone/.test(type)?'wood':/carpet|fabric|rug/.test(type)?'fabric':'stone';}
export function pbrHeight(kind:PbrKind,x:number,y:number):number {
 if(kind==='wood')return .5+.22*Math.sin(x*.43+Math.sin(y*.11)*3)+.09*Math.sin(x*2.7+y*.08);
 if(kind==='fabric')return .5+.22*Math.sin(x*Math.PI/2)*Math.sin(y*Math.PI/2);
 if(kind==='stone')return .5+.14*Math.sin(x*.31+y*.17)*Math.cos(y*.28-x*.13);
 if(kind==='metal')return .5+.035*Math.sin(x*2.8);
 return .5+.05*Math.sin(x*.71+y*.49)*Math.cos(y*.83);
}
export interface PbrMaps { color:DataTexture;roughness:DataTexture;metalness:DataTexture;normal:DataTexture; }
export function makePbrMaps(kind:PbrKind,size=128):PbrMaps {
 const n=Math.max(16,Math.min(256,Math.round(size))),c=new Uint8Array(n*n*4),r=new Uint8Array(c.length),m=new Uint8Array(c.length),normal=new Uint8Array(c.length);
 const base:Record<PbrKind,[number,number,number]>={architecture:[224,217,205],wood:[177,124,77],fabric:[158,160,156],metal:[194,199,203],glass:[233,245,247],stone:[199,193,182]};
 const rough:Record<PbrKind,number>={architecture:.86,wood:.55,fabric:.94,metal:.27,glass:.08,stone:.68};
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=(y*n+x)*4,h=pbrHeight(kind,x*128/n,y*128/n),dx=pbrHeight(kind,(x+1)*128/n,y*128/n)-pbrHeight(kind,(x-1)*128/n,y*128/n),dy=pbrHeight(kind,x*128/n,(y+1)*128/n)-pbrHeight(kind,x*128/n,(y-1)*128/n);const length=Math.hypot(dx,dy,1);
  for(let k=0;k<3;k++){c[i+k]=Math.round(Math.min(255,Math.max(0,base[kind][k]*(.9+h*.2))));r[i+k]=Math.round(Math.max(.03,Math.min(1,rough[kind]+(h-.5)*.12))*255);m[i+k]=kind==='metal'?235:0;}
  normal[i]=Math.round((-.5*dx/length+.5)*255);normal[i+1]=Math.round((-.5*dy/length+.5)*255);normal[i+2]=Math.round((.5/length+.5)*255);c[i+3]=r[i+3]=m[i+3]=normal[i+3]=255;
 }
 const texture=(data:Uint8Array,color=false)=>{const t=new DataTexture(data,n,n,RGBAFormat,UnsignedByteType);t.wrapS=t.wrapT=RepeatWrapping;t.colorSpace=color?SRGBColorSpace:NoColorSpace;t.generateMipmaps=true;t.needsUpdate=true;return t;};
 return {color:texture(c,true),roughness:texture(r),metalness:texture(m),normal:texture(normal)};
}
export interface PbrGroup {start:number;end:number;kind:PbrKind;}
interface FoldData {masks:FoldMasks;role:FoldRole;}
interface CacheEntry {kind:PbrKind;material:MeshPhysicalMaterial;}
export class RealPbrRenderer {
 private maps=new Map<PbrKind,PbrMaps>();
 private materials=new WeakMap<Material,CacheEntry[]>();
 private owned=new Set<Material>();
 private subscriptions=new Map<Material,()=>void>();
 private depths=new WeakMap<Material,MeshDepthMaterial>();
 private geometryVersions=new WeakMap<BufferGeometry,{position:unknown;version:number;count:number}>();
 private lights=new Group();
 private environment:Texture|null=null;
 private pmrem:PMREMGenerator|null=null;
 private environmentTarget:ReturnType<PMREMGenerator['fromScene']>|null=null;
 readonly sun=new DirectionalLight(0xfff0dc,3.2);
 private renderer:WebGLRenderer;
 private low:boolean;
 constructor(renderer:WebGLRenderer,low=false){
  this.renderer=renderer;this.low=low;
  this.sun.position.set(7,12,8);this.sun.castShadow=!low;this.sun.shadow.mapSize.set(low?512:1024,low?512:1024);this.sun.shadow.camera.left=-25;this.sun.shadow.camera.right=25;this.sun.shadow.camera.top=25;this.sun.shadow.camera.bottom=-25;this.sun.shadow.camera.near=.1;this.sun.shadow.camera.far=70;this.sun.shadow.normalBias=.025;this.sun.shadow.bias=-.0002;this.sun.shadow.radius=3;
  this.lights.add(this.sun,new HemisphereLight(0xdce9ff,0x68604c,1.25),new AmbientLight(0xffffff,.15));
 }
 private textureSet(kind:PbrKind):PbrMaps {let maps=this.maps.get(kind);if(!maps){maps=makePbrMaps(kind,this.low?64:128);this.maps.set(kind,maps);}return maps;}
 private physical(original:MeshBasicMaterial,kind:PbrKind):MeshPhysicalMaterial {
  let entries=this.materials.get(original);if(!entries){entries=[];this.materials.set(original,entries);const owned=entries;const retire=()=>{for(const entry of owned){if(this.owned.delete(entry.material))entry.material.dispose();}owned.length=0;const depth=this.depths.get(original);if(depth&&this.owned.delete(depth))depth.dispose();this.materials.delete(original);this.depths.delete(original);original.removeEventListener('dispose',retire);this.subscriptions.delete(original);};this.subscriptions.set(original,retire);original.addEventListener('dispose',retire);}let material=entries.find(e=>e.kind===kind)?.material;
  if(!material){const maps=this.textureSet(kind);material=new MeshPhysicalMaterial({map:maps.color,roughnessMap:maps.roughness,metalnessMap:maps.metalness,normalMap:maps.normal,roughness:1,metalness:kind==='metal'?1:0,side:DoubleSide,vertexColors:false,envMapIntensity:kind==='metal'?1.3:.75,clearcoat:kind==='wood' ? 0.12 : 0,clearcoatRoughness:.4});material.normalScale.set(this.low ? 0.1 : 0.2,this.low ? 0.1 : 0.2);
   if(kind==='glass'){material.transmission=this.low?0:.92;material.ior=1.5;material.thickness=.06;material.roughness=.08;material.roughnessMap=null;material.normalMap=null;material.transparent=true;material.opacity=this.low ? 0.3 : 1;material.depthWrite=false;}
   const fold=original.userData.fp3dFold as FoldData|undefined;if(fold)makeFoldable(material,fold.masks,fold.role);
   entries.push({kind,material});this.owned.add(material);
  }
  const glass=kind==='glass';material.opacity=original.opacity*(glass?(this.low ? 0.3 : 1):1);material.transparent=glass||original.transparent;material.visible=original.visible;material.polygonOffset=original.polygonOffset;material.polygonOffsetFactor=original.polygonOffsetFactor;material.polygonOffsetUnits=original.polygonOffsetUnits;material.blending=NormalBlending;
  return material;
 }
 private prepareGeometry(g:BufferGeometry):void {
  const position=g.getAttribute('position');if(!position?.count)return;const version='data' in position?position.data.version:position.version;const previous=this.geometryVersions.get(g);if(previous?.position===position&&previous.version===version&&previous.count===position.count)return;
  g.computeVertexNormals();const normals=g.getAttribute('normal'),uv=new Float32Array(position.count*2);
  // World-scale planar coordinates per face, including walls and imported furniture without UVs.
  for(let i=0;i<position.count;i++){const x=position.getX(i),y=position.getY(i),z=position.getZ(i),nx=Math.abs(normals.getX(i)),ny=Math.abs(normals.getY(i)),nz=Math.abs(normals.getZ(i));uv[i*2]=ny>=nx&&ny>=nz?x:nx>=nz?z:x;uv[i*2+1]=ny>=nx&&ny>=nz?z:y;}
  // Keep native floor UVs; generated UVs are only a fallback for untextured geometry.
  if(!g.getAttribute('uv')||g.userData.aureonPbrUv){g.setAttribute('uv',new Float32BufferAttribute(uv,2));g.userData.aureonPbrUv=true;}
  this.geometryVersions.set(g,{position,version,count:position.count});
 }
 render(scene:Scene,camera:Camera):void {
  if(!this.environment){const room=new RoomEnvironment();this.pmrem=new PMREMGenerator(this.renderer);this.environmentTarget=this.pmrem.fromScene(room,.04,.1,100);this.environment=this.environmentTarget.texture;room.dispose();}
  const previous={environment:scene.environment,tone:this.renderer.toneMapping,exposure:this.renderer.toneMappingExposure,shadows:this.renderer.shadowMap.enabled,type:this.renderer.shadowMap.type};
  const restore:(()=>void)[]=[];
  try{
   scene.environment=this.environment;scene.add(this.lights);this.renderer.toneMapping=ACESFilmicToneMapping;this.renderer.toneMappingExposure=1;this.renderer.shadowMap.enabled=!this.low;this.renderer.shadowMap.type=PCFSoftShadowMap;
   scene.traverse(object=>{const mesh=object as Mesh;if(!mesh.isMesh||!mesh.userData.aureonPbrKind||Array.isArray(mesh.material)||!(mesh.material as MeshBasicMaterial).isMeshBasicMaterial)return;
    const original=mesh.material as MeshBasicMaterial,kind=mesh.userData.aureonPbrKind as PbrKind;if(!PBR_KINDS.includes(kind))return;this.prepareGeometry(mesh.geometry);
    const groups=mesh.userData.aureonPbrGroups as PbrGroup[]|undefined,oldGroups=mesh.geometry.groups,oldCast=mesh.castShadow,oldReceive=mesh.receiveShadow,oldDepth=mesh.customDepthMaterial;
    if(groups?.length){const materials:MeshPhysicalMaterial[]=[];mesh.geometry.groups=[];for(const group of groups){const physical=this.physical(original,group.kind);let index=materials.indexOf(physical);if(index<0){index=materials.length;materials.push(physical);}mesh.geometry.addGroup(group.start*3,(group.end-group.start)*3,index);}mesh.material=materials;}else mesh.material=this.physical(original,kind);
    mesh.castShadow=kind!=='glass';mesh.receiveShadow=true;
    const fold=original.userData.fp3dFold as FoldData|undefined;if(fold){let depth=this.depths.get(original);if(!depth){depth=new MeshDepthMaterial({depthPacking:RGBADepthPacking});makeFoldable(depth,fold.masks,fold.role);this.depths.set(original,depth);this.owned.add(depth);}mesh.customDepthMaterial=depth;}
    restore.push(()=>{mesh.material=original;mesh.geometry.groups=oldGroups;mesh.castShadow=oldCast;mesh.receiveShadow=oldReceive;mesh.customDepthMaterial=oldDepth;});
   });
   this.renderer.render(scene,camera);
  }finally{for(const fn of restore.reverse())fn();scene.remove(this.lights);scene.environment=previous.environment;this.renderer.toneMapping=previous.tone;this.renderer.toneMappingExposure=previous.exposure;this.renderer.shadowMap.enabled=previous.shadows;this.renderer.shadowMap.type=previous.type;}
 }
 dispose():void {for(const [original,listener] of this.subscriptions)original.removeEventListener('dispose',listener);this.subscriptions.clear();for(const material of this.owned)material.dispose();this.owned.clear();for(const maps of this.maps.values())for(const texture of Object.values(maps))texture.dispose();this.maps.clear();this.sun.shadow.map?.dispose();this.environmentTarget?.dispose();this.pmrem?.dispose();this.environment=null;}
}
