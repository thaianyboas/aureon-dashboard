// Synthetic two-room plan for reproducible renderer checks. Never an application default or private plan.
import {FloorplanViewer} from '../../neonplan3d-main/frontend/src/viewer/viewer3d.ts';
import {emptyBuilding,newFloor,type Building} from '../../neonplan3d-main/frontend/src/model.ts';
import type {Theme} from '../../neonplan3d-main/frontend/src/themes.ts';
const building=emptyBuilding(),floor=newFloor('fixture-floor','Renderer fixture',0);
floor.rooms=[{id:'room-a',name:'Room A',area_id:null,points:[[0,0],[5,0],[5,5],[0,5]],floor_material:'wood'},{id:'room-b',name:'Room B',area_id:null,points:[[5,0],[8,0],[8,5],[5,5]],floor_material:'tiles'}];
floor.openings=[{id:'fixture-window',room_id:'room-a',edge:0,offset:2.5,width:1.8,type:'window',sill:.8,height:1.3,hinge:'left',leaves:2,swing:'in',contact2:null,contact:null,cover:null},{id:'fixture-door',room_id:'room-a',edge:1,offset:2.4,width:1,type:'door',sill:0,height:2.1,hinge:'left',leaves:1,swing:'in',contact2:null,contact:null,cover:null}];
floor.furniture=[{id:'sofa',type:'sofa',x:1.2,z:3.4,rotation:0,w:2.4,d:.9,h:.8,variant:null},{id:'table',type:'table',x:2.4,z:2.4,rotation:0,w:1.6,d:.8,h:.75,variant:null},{id:'bed',type:'bed',x:6.5,z:3.3,rotation:0,w:1.6,d:2,h:.55,variant:null},{id:'sink',type:'sink',x:6.2,z:.7,rotation:0,w:1.1,d:.6,h:.9,variant:null}];
building.floors=[floor];
const host=document.querySelector('#viewer') as HTMLElement;
const viewer=new FloorplanViewer(host,{quality:'high',explode:false});viewer.setBuilding(building as Building);viewer.setHideRoof(true);viewer.setFloor(floor.id,false);viewer.setWallMode('cut');
const w=globalThis as unknown as Record<string,unknown>;
w.viewer=viewer;w.changeLook=(theme:Theme)=>viewer.setTheme(theme);
w.rendererMetrics=()=>{const v=viewer as unknown as {renderer:{info:{render:{calls:number;triangles:number};programs:{diagnostics?:{runnable:boolean}}[]}}};return {calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles,programsValid:v.renderer.info.programs.every(p=>p.diagnostics?.runnable!==false)};};
w.disposeViewer=()=>viewer.dispose();
