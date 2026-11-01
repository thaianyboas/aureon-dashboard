/** Real-only physical rendering. Original materials/geometry ownership and non-Real looks are preserved. */
import {CanvasTexture, Sprite, SpriteMaterial, AddEquation, AdditiveBlending, CustomBlending, OneFactor, SrcAlphaFactor, ZeroFactor, ACESFilmicToneMapping, AmbientLight, Box3, Color, PointLight, Vector3, DataTexture, DirectionalLight, DoubleSide, Float32BufferAttribute, Group, HemisphereLight, Mesh, MeshBasicMaterial, MeshDepthMaterial, MeshPhysicalMaterial, NoColorSpace, NormalBlending, PCFSoftShadowMap, PMREMGenerator, RepeatWrapping, RGBADepthPacking, RGBAFormat, SRGBColorSpace, UnsignedByteType, type BufferGeometry, type Camera, type Material, type Scene, type Texture, type WebGLRenderer} from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {DepthTexture, HalfFloatType, Vector2, WebGLRenderTarget} from 'three';
import {makeFoldable, type FoldMasks, type FoldRole} from './fold.ts';
export type PbrKind='architecture'|'wood'|'fabric'|'metal'|'glass'|'stone'|'tile'|'concrete'|'deck'|'parquet'|'paint';
export const PBR_KINDS: readonly PbrKind[]=['architecture','wood','fabric','metal','glass','stone','tile','concrete','deck','parquet','paint'];
export function furniturePbrKind(type:string):PbrKind {
 if(/glass|window|shower|mirror/.test(type))return 'glass';
 if(/metal|sink|oven|fridge|refrigerator|stove|radiator|tap|steel/.test(type))return 'metal';
 if(/sofa|couch|bed|rug|carpet|armchair|cushion|curtain/.test(type))return 'fabric';
 if(/table|desk|cabinet|shelf|wardrobe|chair|wood|door/.test(type))return 'wood';
 return 'architecture';
}
export function floorPbrKind(type:string):PbrKind {return type==='wood'?'deck':/parquet|oak|laminate|herringbone/.test(type)?'parquet':/carpet|fabric|rug/.test(type)?'fabric':type==='tiles'?'tile':type==='concrete'?'concrete':'stone';}
export function pbrHeight(kind:PbrKind,x:number,y:number):number {
 // wood (furniture): long fine grain, no waves; parquet (floors): 0.125 m boards with staggered joints and per-board tone
 if(kind==='wood')return .5+.1*Math.sin(x*.21+Math.sin(y*.9)*.6)+.06*Math.sin(x*1.9+y*.13)+.04*Math.sin(y*3.1);
 if(kind==='parquet'){const row=Math.floor(y/16),gy=((y%16)+16)%16,shift=(row*37)%64,gx=(((x+shift)%64)+64)%64,tone=((row*53+Math.floor((x+shift)/64)*29)%7)/7;return gy<1.1||gx<1.1?.12:.42+.16*tone+.06*Math.sin(x*.35+Math.sin(y*.7)*1.5)+.03*Math.sin(x*2.3);}
 if(kind==='fabric')return .5+.22*Math.sin(x*Math.PI/2)*Math.sin(y*Math.PI/2);
 if(kind==='stone'){const gx=((x%64)+64)%64,gy=((y%32)+32)%32;return gx<1.2||gy<1.2?.18:.5+.1*Math.sin(x*.31+y*.17)*Math.cos(y*.28-x*.13);}
 // tile: 0.5 m ceramic squares with grout; concrete: fine speckle; deck: 8 boards per metre with seams
 // paint: white lacquered doors and frames, almost smooth
 if(kind==='paint')return .5+.015*Math.sin(x*.9+y*.4);
 if(kind==='tile'){const gx=((x%64)+64)%64,gy=((y%64)+64)%64;return gx<1.4||gy<1.4?.15:.56+.03*Math.sin(x*.9+y*1.3);}
 if(kind==='concrete')return .5+.06*Math.sin(x*1.7+y*.9)*Math.sin(y*2.3-x*.7)+.04*Math.sin(x*5.1+y*4.3);
 if(kind==='deck'){const gy=((y%16)+16)%16;return gy<1.1?.12:.52+.16*Math.sin(x*.37+Math.sin(y*.21)*2)+.05*Math.sin(x*2.1);}
 if(kind==='metal')return .5+.035*Math.sin(x*2.8);
 return .5+.05*Math.sin(x*.71+y*.49)*Math.cos(y*.83);
}
export interface PbrMaps { color:DataTexture;roughness:DataTexture;metalness:DataTexture;normal:DataTexture; }
export function makePbrMaps(kind:PbrKind,size=128):PbrMaps {
 const n=Math.max(16,Math.min(256,Math.round(size))),c=new Uint8Array(n*n*4),r=new Uint8Array(c.length),m=new Uint8Array(c.length),normal=new Uint8Array(c.length);
 const base:Record<PbrKind,[number,number,number]>={paint:[238,236,230],architecture:[216,209,197],parquet:[182,124,72],wood:[150,104,66],fabric:[158,160,156],metal:[194,199,203],glass:[233,245,247],stone:[176,184,190],tile:[226,214,184],concrete:[186,184,178],deck:[132,118,102]};
 const rough:Record<PbrKind,number>={paint:.42,architecture:.86,parquet:.5,wood:.55,fabric:.94,metal:.27,glass:.08,stone:.62,tile:.38,concrete:.8,deck:.74};
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=(y*n+x)*4,h=pbrHeight(kind,x*128/n,y*128/n),dx=pbrHeight(kind,(x+1)*128/n,y*128/n)-pbrHeight(kind,(x-1)*128/n,y*128/n),dy=pbrHeight(kind,x*128/n,(y+1)*128/n)-pbrHeight(kind,x*128/n,(y-1)*128/n);const length=Math.hypot(dx,dy,1);
  for(let k=0;k<3;k++){c[i+k]=Math.round(Math.min(255,Math.max(0,base[kind][k]*(.9+h*.2)*(h<.2?.74:1))));r[i+k]=Math.round(Math.max(.03,Math.min(1,rough[kind]+(h-.5)*.12))*255);m[i+k]=kind==='metal'?235:0;}
  normal[i]=Math.round((-.5*dx/length+.5)*255);normal[i+1]=Math.round((-.5*dy/length+.5)*255);normal[i+2]=Math.round((.5/length+.5)*255);c[i+3]=r[i+3]=m[i+3]=normal[i+3]=255;
 }
 const texture=(data:Uint8Array,color=false)=>{const t=new DataTexture(data,n,n,RGBAFormat,UnsignedByteType);t.wrapS=t.wrapT=RepeatWrapping;t.colorSpace=color?SRGBColorSpace:NoColorSpace;t.generateMipmaps=true;t.needsUpdate=true;return t;};
 return {color:texture(c,true),roughness:texture(r),metalness:texture(m),normal:texture(normal)};
}
export interface PbrGroup {start:number;end:number;kind:PbrKind;}
/** Lit lamps of the active floors in world coordinates (linear colour 0..1, level 0..1). */
export interface PbrLamp {x:number;y:number;z:number;color:[number,number,number];level:number;}
/** `photo`: the path-traced refinement – lamps in physical units (candela), as the tracer has no painted light pools. */
export interface PbrFrame {night?:number;lamps?:readonly PbrLamp[];photo?:boolean;}
const MAX_LAMPS=8;
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
 private sky=new HemisphereLight(0xdce9ff,0x68604c,1.25);
 private lamps:PointLight[]=[];
 /** AUREON: a soft glow around each lit lamp (the shade lit from inside), blended without touching the canvas alpha. */
 private glows:Sprite[]=[];
 private glowTexture:CanvasTexture|null=null;
 /** AUREON: warm fill by night, so a lit room reads as lit beyond the lamp's pool (no black corners, no hot spot alone). */
 private warmFill=new HemisphereLight(0xffcf9a,0x3b2a1d,0);
 private ambient=new AmbientLight(0xffffff,.06);
 private bounds=new Box3();
 /** AUREON photo refinement: a lit lamp at full level (a warm ~700 lm bulb) and the exposure of the traced picture. */
 static PHOTO_CD=120;static PHOTO_EXPOSURE=1.2;
 /** AUREON: the live picture lit like the photo (physical lamps, no painted light pools), so moving and resting match. */
 static LIVE_PHYSICAL=false;
 private static DAY=new Color(0xfff0dc);private static MOON=new Color(0x9fb3e6);
 private renderer:WebGLRenderer;
 private low:boolean;
 /** AUREON: ambient occlusion in the live picture (corners, contact with the floor, between cushions) – quality "High" only. */
 private ao:boolean;
 static AO=true;
 private aoTarget:WebGLRenderTarget|null=null;private aoOut:WebGLRenderTarget|null=null;private gtao:GTAOPass|null=null;private output:OutputPass|null=null;private aoSize=new Vector2();
 constructor(renderer:WebGLRenderer,low=false,ao=false){
  this.renderer=renderer;this.low=low;this.ao=ao&&!low;
  this.sun.position.set(7,12,8);this.sun.castShadow=!low;this.sun.shadow.mapSize.set(low?512:2048,low?512:2048);this.sun.shadow.camera.left=-25;this.sun.shadow.camera.right=25;this.sun.shadow.camera.top=25;this.sun.shadow.camera.bottom=-25;this.sun.shadow.camera.near=.1;this.sun.shadow.camera.far=70;this.sun.shadow.normalBias=.025;this.sun.shadow.bias=-.0002;this.sun.shadow.radius=3;
  this.lights.add(this.sun,this.sun.target,this.sky,this.ambient);
  this.lights.add(this.warmFill);
  for(let i=0;i<(low?3:MAX_LAMPS);i++){const lamp=new PointLight(0xffd6a0,0,7.5,2);lamp.visible=false;if(!low&&i<2){lamp.castShadow=true;lamp.shadow.mapSize.set(512,512);lamp.shadow.bias=-.004;lamp.shadow.radius=6;lamp.shadow.camera.near=.08;lamp.shadow.camera.far=8;}this.lamps.push(lamp);this.lights.add(lamp);}
 }
 private glow(i:number):Sprite|null {
  if(this.glows[i])return this.glows[i];
  if(!this.glowTexture){const doc=globalThis.document;if(!doc?.createElement)return null;const c=doc.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');if(!x)return null;const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,0.9)');g.addColorStop(0.18,'rgba(255,255,255,0.55)');g.addColorStop(0.5,'rgba(255,255,255,0.14)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);this.glowTexture=new CanvasTexture(c);}
  const m=new SpriteMaterial({map:this.glowTexture,transparent:true,depthWrite:false,blending:CustomBlending});m.blendEquation=AddEquation;m.blendSrc=SrcAlphaFactor;m.blendDst=OneFactor;m.blendSrcAlpha=ZeroFactor;m.blendDstAlpha=OneFactor;
  const s=new Sprite(m);s.visible=false;s.renderOrder=5;this.glows[i]=s;this.lights.add(s);return s;
 }
 private textureSet(kind:PbrKind):PbrMaps {let maps=this.maps.get(kind);if(!maps){maps=makePbrMaps(kind,this.low?64:128);this.maps.set(kind,maps);}return maps;}
 private physical(original:MeshBasicMaterial,kind:PbrKind):MeshPhysicalMaterial {
  let entries=this.materials.get(original);if(!entries){entries=[];this.materials.set(original,entries);const owned=entries;const retire=()=>{for(const entry of owned){if(this.owned.delete(entry.material))entry.material.dispose();}owned.length=0;const depth=this.depths.get(original);if(depth&&this.owned.delete(depth))depth.dispose();this.materials.delete(original);this.depths.delete(original);original.removeEventListener('dispose',retire);this.subscriptions.delete(original);};this.subscriptions.set(original,retire);original.addEventListener('dispose',retire);}let material=entries.find(e=>e.kind===kind)?.material;
  if(!material){const maps=this.textureSet(kind);material=new MeshPhysicalMaterial({map:maps.color,roughnessMap:maps.roughness,metalnessMap:maps.metalness,normalMap:maps.normal,roughness:1,metalness:kind==='metal'?1:0,side:DoubleSide,vertexColors:false,envMapIntensity:kind==='metal'?1.3:.75,clearcoat:kind==='wood'||kind==='parquet'||kind==='tile' ? 0.12 : 0,clearcoatRoughness:.4});material.normalScale.set(this.low ? 0.1 : 0.2,this.low ? 0.1 : 0.2);
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
 /** Fits the sun's shadow to the house, dims day light by night and lights lit lamps warmly. */
 private stage(frame:PbrFrame):void {
  const night=Math.min(1,Math.max(0,frame.night??0)),box=this.bounds;
  const c=box.isEmpty()?new Vector3():box.getCenter(new Vector3()),r=box.isEmpty()?12:Math.max(4,box.getSize(new Vector3()).length()/2+1);
  this.sun.target.position.copy(c);this.sun.position.set(c.x+r*.9,c.y+r*1.7,c.z+r*1.1);
  const cam=this.sun.shadow.camera;if(cam.right!==r||cam.far!==r*5){cam.left=-r;cam.right=r;cam.top=r;cam.bottom=-r;cam.near=.1;cam.far=r*5;cam.updateProjectionMatrix();}
  this.sun.color.copy(RealPbrRenderer.DAY).lerp(RealPbrRenderer.MOON,night);this.sun.intensity=3.4*(1-night)+.35*night;
  this.sky.intensity=.7*(1-.8*night);this.ambient.intensity=.06*(1-.5*night);
  const lamps=(frame.lamps??[]).filter(l=>l.level>0).sort((a,b)=>b.level-a.level);
  // AUREON balance: a little softer per lamp (no hot spot right under a pendant), a warm fill by night instead
  // several lamps in one room share the budget (three lit lamps must not triple the light into hot spots)
  const share=2/(1+Math.min(this.lamps.length,lamps.length));
  this.lamps.forEach((light,i)=>{const l=lamps[i];light.visible=!!l;const glow=this.low?null:this.glow(i);if(glow)glow.visible=!!l;if(!l)return;light.position.set(l.x,l.y,l.z);light.color.setRGB(Math.min(1,l.color[0]),Math.min(1,l.color[1]),Math.min(1,l.color[2]));light.intensity=frame.photo||RealPbrRenderer.LIVE_PHYSICAL?l.level*RealPbrRenderer.PHOTO_CD*share:l.level*(.95+1.75*night)*share;light.distance=frame.photo||RealPbrRenderer.LIVE_PHYSICAL?0:9;
   if(glow){glow.position.set(l.x,l.y,l.z);const k=Math.min(1.2,l.level);glow.scale.setScalar(.45+.55*k);glow.material.color.setRGB(Math.min(1,l.color[0]),Math.min(1,l.color[1])*.92,Math.min(1,l.color[2])*.78);glow.material.opacity=(.18+.42*night)*k;}});
  for(let i=lamps.length;i<this.glows.length;i++)if(this.glows[i])this.glows[i].visible=false;
  const lit=Math.min(1,lamps.reduce((a,l)=>a+l.level,0)/3);this.warmFill.intensity=.16*night*lit;
 }
 render(scene:Scene,camera:Camera,frame:PbrFrame={}):void {this.run(scene,camera,frame,()=>this.ao&&RealPbrRenderer.AO?this.drawAo(scene,camera):this.renderer.render(scene,camera));}
 /**
  * AUREON: the scene once into a target with its depth, ambient occlusion from that depth (so cut walls and clipped
  * models are seen exactly as drawn), then tone mapping to the canvas. The canvas stays transparent around the house.
  */
 private drawAo(scene:Scene,camera:Camera):void {
  const r=this.renderer,size=r.getDrawingBufferSize(new Vector2());
  // a new size (rotated tablet, resized panel): the targets are made again (the pass cannot resize a given depth buffer)
  if(this.aoTarget&&!size.equals(this.aoSize)){this.aoTarget.depthTexture?.dispose();this.aoTarget.dispose();this.aoOut?.dispose();this.gtao?.dispose();this.output?.dispose();this.aoTarget=this.aoOut=null;this.gtao=null;this.output=null;}
  if(!this.aoTarget){const depth=new DepthTexture(size.x,size.y);this.aoTarget=new WebGLRenderTarget(size.x,size.y,{type:HalfFloatType,depthTexture:depth,samples:4});this.aoOut=new WebGLRenderTarget(size.x,size.y,{type:HalfFloatType});
   this.gtao=new GTAOPass(scene,camera,size.x,size.y);this.gtao.setGBuffer(depth); // made without, then given our depth (three's constructor path reads a missing target)
   this.gtao.blendIntensity=.85;
   this.gtao.updateGtaoMaterial({radius:.45,distanceExponent:1.4,thickness:1.2,scale:1.15,samples:12,distanceFallOff:1,screenSpaceRadius:false});
   this.gtao.updatePdMaterial({lumaPhi:10,depthPhi:2,normalPhi:3,radius:6,rings:2,samples:12});
   this.output=new OutputPass();this.aoSize.copy(size);}
  const g=this.gtao!;g.scene=scene;g.camera=camera;
  const prev=r.getRenderTarget(),prevClear=r.getClearAlpha();
  try{
   r.setRenderTarget(this.aoTarget);r.setClearAlpha(0);r.clear();r.render(scene,camera);
   g.render(r,this.aoOut!,this.aoTarget!,0,false);
   this.output!.renderToScreen=true;this.output!.render(r,null as unknown as WebGLRenderTarget,this.aoOut!,0,false);
  }finally{r.setRenderTarget(prev);r.setClearAlpha(prevClear);}
 }
 /** AUREON: runs `fn` with the Real look staged (materials, lights, environment, tone) – the photo refinement collects and draws in it. */
 staged(scene:Scene,camera:Camera,frame:PbrFrame,fn:()=>void):void {this.run(scene,camera,frame,fn);}
 private run(scene:Scene,_camera:Camera,frame:PbrFrame,draw:()=>void):void {
  if(!this.environment){const room=new RoomEnvironment();this.pmrem=new PMREMGenerator(this.renderer);this.environmentTarget=this.pmrem.fromScene(room,.04,.1,100);this.environment=this.environmentTarget.texture;room.dispose();}
  const previous={environment:scene.environment,tone:this.renderer.toneMapping,exposure:this.renderer.toneMappingExposure,shadows:this.renderer.shadowMap.enabled,type:this.renderer.shadowMap.type};
  const restore:(()=>void)[]=[];
  try{
   const night=Math.min(1,Math.max(0,frame.night??0)),previousIntensity=(scene as Scene&{environmentIntensity?:number}).environmentIntensity;
   restore.push(()=>{(scene as Scene&{environmentIntensity?:number}).environmentIntensity=previousIntensity;});
   (scene as Scene&{environmentIntensity?:number}).environmentIntensity=.42-.34*night;
   scene.environment=this.environment;scene.add(this.lights);this.renderer.toneMapping=ACESFilmicToneMapping;this.renderer.toneMappingExposure=frame.photo?RealPbrRenderer.PHOTO_EXPOSURE:1-.14*night;
   this.bounds.makeEmpty();this.renderer.shadowMap.enabled=!this.low;this.renderer.shadowMap.type=PCFSoftShadowMap;
   // Additive glows (window spill, light cones) add colour but must not write alpha into the transparent canvas,
   // otherwise they show as dark patches over a host page behind the stage.
   scene.traverse(object=>{const mesh=object as Mesh,m=mesh.material as Material|undefined;if(!mesh.isMesh||!m||Array.isArray(m)||m.blending!==AdditiveBlending)return;const prev={blending:m.blending,src:m.blendSrc,dst:m.blendDst,eq:m.blendEquation,srcA:m.blendSrcAlpha,dstA:m.blendDstAlpha};m.blending=CustomBlending;m.blendEquation=AddEquation;m.blendSrc=SrcAlphaFactor;m.blendDst=OneFactor;m.blendSrcAlpha=ZeroFactor;m.blendDstAlpha=OneFactor;restore.push(()=>{m.blending=prev.blending;m.blendSrc=prev.src;m.blendDst=prev.dst;m.blendEquation=prev.eq;m.blendSrcAlpha=prev.srcA;m.blendDstAlpha=prev.dstA;});});
   scene.traverse(object=>{if(object.userData.aureonHideInReal&&object.visible){object.visible=false;restore.push(()=>{object.visible=true;});}});
   if(frame.photo||RealPbrRenderer.LIVE_PHYSICAL)scene.traverse(object=>{const mesh=object as Mesh,m=mesh.material as Material|undefined;if(!mesh.isMesh||!m||Array.isArray(m)||!mesh.visible||(m.blending!==CustomBlending&&m.blending!==AdditiveBlending))return;mesh.visible=false;restore.push(()=>{mesh.visible=true;});});
   scene.traverse(object=>{const mesh=object as Mesh;if(!mesh.isMesh||!mesh.userData.aureonPbrKind||Array.isArray(mesh.material)||!(mesh.material as MeshBasicMaterial).isMeshBasicMaterial)return;
    const original=mesh.material as MeshBasicMaterial,kind=mesh.userData.aureonPbrKind as PbrKind;if(!PBR_KINDS.includes(kind))return;this.prepareGeometry(mesh.geometry);
    if(original.visible&&kind!=='glass'){if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();const b=mesh.geometry.boundingBox;if(b&&!b.isEmpty())this.bounds.union(b.clone().applyMatrix4(mesh.matrixWorld));}
    const groups=mesh.userData.aureonPbrGroups as PbrGroup[]|undefined,oldGroups=mesh.geometry.groups,oldCast=mesh.castShadow,oldReceive=mesh.receiveShadow,oldDepth=mesh.customDepthMaterial;
    if(groups?.length){const materials:MeshPhysicalMaterial[]=[];mesh.geometry.groups=[];for(const group of groups){const physical=this.physical(original,group.kind);let index=materials.indexOf(physical);if(index<0){index=materials.length;materials.push(physical);}mesh.geometry.addGroup(group.start*3,(group.end-group.start)*3,index);}mesh.material=materials;}else mesh.material=this.physical(original,kind);
    mesh.castShadow=kind!=='glass';mesh.receiveShadow=true;
    const fold=original.userData.fp3dFold as FoldData|undefined;if(fold){let depth=this.depths.get(original);if(!depth){depth=new MeshDepthMaterial({depthPacking:RGBADepthPacking});makeFoldable(depth,fold.masks,fold.role);this.depths.set(original,depth);this.owned.add(depth);}mesh.customDepthMaterial=depth;}
    restore.push(()=>{mesh.material=original;mesh.geometry.groups=oldGroups;mesh.castShadow=oldCast;mesh.receiveShadow=oldReceive;mesh.customDepthMaterial=oldDepth;});
   });
   this.stage(frame);
   draw();
  }finally{for(const fn of restore.reverse())fn();scene.remove(this.lights);scene.environment=previous.environment;this.renderer.toneMapping=previous.tone;this.renderer.toneMappingExposure=previous.exposure;this.renderer.shadowMap.enabled=previous.shadows;this.renderer.shadowMap.type=previous.type;}
 }
 dispose():void {this.aoTarget?.depthTexture?.dispose();this.aoTarget?.dispose();this.aoOut?.dispose();this.gtao?.dispose();this.output?.dispose();this.aoTarget=this.aoOut=null;this.gtao=null;this.output=null;for(const g of this.glows)g?.material.dispose();this.glows=[];this.glowTexture?.dispose();this.glowTexture=null;for(const [original,listener] of this.subscriptions)original.removeEventListener('dispose',listener);this.subscriptions.clear();for(const material of this.owned)material.dispose();this.owned.clear();for(const maps of this.maps.values())for(const texture of Object.values(maps))texture.dispose();this.maps.clear();this.sun.shadow.map?.dispose();this.environmentTarget?.dispose();this.pmrem?.dispose();this.environment=null;}
}
