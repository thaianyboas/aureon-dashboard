import assert from "node:assert/strict";
import { test } from "node:test";
import { emptyBuilding, newFloor } from "./model.ts";
import { copyFloor, exportFile, parseExport } from "./transfer.ts";

function building() {
  const b = emptyBuilding();
  const f = newFloor("eg", "EG", 0);
  f.rooms = [{ id: "r", name: "Wohnen", area_id: "living_room", points: [[0, 0], [4, 0], [4, 3], [0, 3]], floor_material: "wood" }];
  f.furniture = [{ id: "m", type: "lamp_ceiling", x: 2, z: 1.5, rotation: 0, w: 0.4, d: 0.4, h: 0.08, variant: null, entity: "light.decke", power: null }];
  f.placements = [{ entity_id: "sensor.temp", x: 1, z: 1, y: null }];
  f.background = { image_id: "img", x: 0, z: 0, width: 10, opacity: 0.5 };
  b.floors = [f];
  b.energy.grid = "sensor.grid";
  b.presence = [{ person: "person.mia", sensor: "sensor.mia" }];
  return b;
}

test("a shareable export has no entities, areas or images", () => {
  const file = exportFile(building(), true);
  const f = file.building.floors[0];
  assert.equal(f.rooms[0].area_id, null);
  assert.equal(f.furniture[0].entity, null);
  assert.deepEqual(f.placements, []);
  assert.equal(f.background, null);
  assert.equal(file.building.energy.grid, null);
  assert.deepEqual(file.building.presence, []);
  // the room shape and the lamp stay
  assert.equal(f.rooms[0].points.length, 4);
  assert.equal(f.furniture[0].type, "lamp_ceiling");
});

test("import reads export files and plain buildings, and rejects anything else", () => {
  const full = exportFile(building(), false);
  const back = parseExport(JSON.stringify(full));
  assert.equal(back.floors[0].furniture[0].entity, "light.decke");
  assert.equal(back.floors[0].background, null, "images are not imported");
  assert.equal(parseExport(JSON.stringify(building())).floors.length, 1);
  assert.throws(() => parseExport("{}"));
  assert.throws(() => parseExport("kein json"));
});


test("share template strips nested energy, opening, climate, outdoor, car and module links", () => {
  const b = building();
  b.energy.consumption = "sensor.private_consumption";b.energy.gas = "sensor.private_gas";b.energy.water = "sensor.private_water";
  const f=b.floors[0];f.ha_floor="private_floor";f.rooms[0].climate={temperature:"sensor.private_temp",humidity:"sensor.private_humidity"};f.rooms[0].panel=["light.private_panel"];f.rooms[0].hidden=["sensor.private_hidden"];
  f.furniture[0]={...f.furniture[0],state_entity:"binary_sensor.private_occupied",color_entity:"light.private_color",gangs:[{entity:"switch.private_socket",power:"sensor.private_watts"}],car:{device:"sensor.private_car",tracker:"device_tracker.private_car"},mods:{example:{secret:"private_module_data"}}};
  f.openings=[{id:"window",room_id:"r",edge:0,offset:1,width:1,type:"window",sill:.8,height:1.2,hinge:"left",leaves:2,swing:"in",sensor:"handle",contact:"sensor.private_handle",contact2:"binary_sensor.private_contact",cover:"cover.private",tilt:"binary_sensor.private_tilt",tilt2:"binary_sensor.private_tilt2",position:"sensor.private_position"}];
  f.outdoor=[{id:"garden",type:"lawn",points:[[0,0],[1,0],[1,1]],area_id:"private_garden",panel:["sensor.private_garden"]}];
  const source=JSON.stringify(b),shared=exportFile(b,true).building,text=JSON.stringify(shared);
  assert.equal(text.includes("private_"),false);assert.equal(JSON.stringify(b),source);assert.equal(shared.floors[0].furniture[0].type,"lamp_ceiling");assert.equal(shared.floors[0].rooms[0].points.length,4);assert.equal(shared.floors[0].openings[0].sensor,"handle");
});

test("share template removes local actions, media destinations and images while full backup preserves them", () => {
  const b=building();b.settings.buttons=[{id:"local",label:"Local",action:"service",target:"script.private_action",data:{password:"private_payload"}}];b.settings.media_presets=[{id:"private_uri",label:"Local",type:"music",content:"https://private.invalid/stream"}];b.settings.favorites=["scene.private"];
  b.settings.director={doorbell_entity:"binary_sensor.private",doorbell_camera:"camera.private",triggers:[{entity:"binary_sensor.private",camera:"camera.private"}]};b.settings.backdrop={kind:"image",image:"private_image"};b.floors[0].furniture[0].pictures=[{entity:"sensor.private",state:"on",image:"private_photo"}];
  const text=JSON.stringify(exportFile(b,true));assert.equal(text.includes("private"),false);assert.deepEqual(exportFile(b,false).building,b);assert.equal(b.settings.buttons.length,1);
});

test("share cleanup preserves numeric geometry and appearance values with reference-like names", () => {
  const b=building();b.settings.grid=.25;b.floors[0].furniture[0].tilt=45;b.floors[0].rooms[0].floor_material="wood.oak";b.floors[0].furniture[0].type="pack:custom.model";b.floors[0].furniture[0].name="lamp.personal.design";
  const copy=exportFile(b,true).building;assert.equal(copy.settings.grid,.25);assert.equal(copy.floors[0].furniture[0].tilt,45);assert.equal(copy.floors[0].rooms[0].floor_material,"wood.oak");assert.equal(copy.floors[0].furniture[0].type,"pack:custom.model");assert.equal(copy.floors[0].furniture[0].name,"lamp.personal.design");
});

test("a shareable export leaves no entity anywhere, however new the field", () => {
  const b = building();
  const f = b.floors[0];
  const extra = {
    lock: "lock.haustuer",
    fan_entity: "fan.decke",
    sensors: ["sensor.gas", "sensor.wasser"],
    by_entity: { "light.decke": { x: 1 } },
    nested: { deep: [{ rain: "binary_sensor.regen", label: "Regen" }] },
    device_id: "abc123",
    file: "plan.json",
    version: "2.0.11",
    color: "#ff00aa",
  };
  Object.assign(f.furniture[0], extra);
  Object.assign(b.settings, { rain_entity: "binary_sensor.regen", outage_entity: "binary_sensor.netz" });
  const out = exportFile(b, true).building;
  const text = JSON.stringify(out);
  for (const id of ["lock.haustuer", "fan.decke", "sensor.gas", "light.decke", "binary_sensor.regen", "binary_sensor.netz", "abc123", "living_room"]) assert.ok(!text.includes(id), id);
  const m = out.floors[0].furniture[0] as unknown as Record<string, unknown>;
  assert.deepEqual(m.sensors, []);
  assert.deepEqual(m.by_entity, {});
  assert.equal(m.lock, null);
  // what is no link stays
  assert.equal(m.file, "plan.json");
  assert.equal(m.version, "2.0.11");
  assert.equal(m.color, "#ff00aa");
  assert.deepEqual(m.nested, { deep: [{ rain: null, label: "Regen" }] });
  // the original plan is untouched
  assert.equal((f.furniture[0] as unknown as Record<string, unknown>).lock, "lock.haustuer");
});

test("a duplicated floor gets new ids, keeps its references and loses its links (#443)", () => {
  const b = building();
  b.floors[0].openings = [{ id: "o", room_id: "r", edge: 0, offset: 1, width: 1, type: "window", sill: 0.9, cover: "cover.blind" } as never];
  let n = 0;
  const copy = copyFloor(b, "eg", (p) => `${p}_n${n++}`, "OG", 3)!;
  assert.notEqual(copy.id, "eg");
  assert.equal(copy.elevation, 3);
  assert.notEqual(copy.rooms[0].id, "r");
  assert.equal(copy.openings[0].room_id, copy.rooms[0].id, "the window stays on the copied room");
  assert.equal(copy.rooms[0].area_id, null);
  assert.equal(copy.furniture[0].entity, null);
  assert.equal(copy.openings[0].cover, null);
  assert.deepEqual(copy.placements, []);
  // the original is untouched
  assert.equal(b.floors[0].furniture[0].entity, "light.decke");
});
