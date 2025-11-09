
import * as THREE from 'three';
import { TempleSpaceDirectionsBuilder } from './space_directions.js'
import { TempleLights } from './space_lights.js'
import { TempleSpaceMapBuilder } from './space_map.js'
import { TempleSpaceSandBuilder } from './space_sand.js'
import { TempleSpaceKalaChakra } from './space_kalachakra.js'
import { TempleSpaceCodaChakra } from './space_codachakra.js'
import { ResourceTree } from '../code/resource_tree.js';
import { SpaceTrainingBoxes } from './space_training_boxes.js';
import { SpaceEastAltar0 } from './east/altars/space_east_altar_0.js';
import { TempleWorld } from '../temple_world.js';
import { call } from 'three/tsl';

class TempleSpace {
    world:TempleWorld;
    scene:THREE.Object3D;
    levels:ResourceTree;
    resources:ResourceTree;
    lights : TempleLights;

    constructor(world:TempleWorld) {
        this.world = world;
        this.scene = new THREE.Group();
        this.scene.name = "TempleSpace";
        world.worldScene.add(this.scene);

        this.levels = world.resourceRoot.subResourceSceneClean("ActiveSpaces", this.scene);
        this.resources = this.levels;
        this.registerLevelByCallback("Floor", k => {
            new TempleSpaceDirectionsBuilder(k);
        });
        this.registerLevelByCallback("Map", k => {
            new TempleSpaceMapBuilder(k);
        });
        this.registerLevelByCallback("Sand", k => {
            new TempleSpaceSandBuilder(k, world);
        });
        this.registerLevelByCallback("KalaChakra", k => {
            new TempleSpaceKalaChakra(k);
        }, true);
        this.registerLevelByCallback("CodaChakra", k => {
            new TempleSpaceCodaChakra(k);
        }, true);
        this.registerLevelByCallback("TrainingBoxes", k => {
            new SpaceTrainingBoxes(k, this.resources);
        }, true);
        this.registerLevelByCallback("SpaceEastAltar0", k => {
            new SpaceEastAltar0(k, this.resources);
        }, true);
        this.ensureLevel("Floor");
        this.ensureLevel("TrainingBoxes");
        this.ensureLevel("Map");
        this.ensureLevel("Sand");

        const testUnload = false;
        if (testUnload) {
            this.testLevelLeaving();
        }

        this.lights = new TempleLights(this.scene);
    }

    testLevelLeaving() {
        var _this = this;
        setTimeout(() => {
            _this.leaveLevel("Floor");
            ResourceTree.RequestUpdate();
            setTimeout(() => {
                _this.ensureLevel("Floor");
                ResourceTree.RequestUpdate();
            }, 1000);
        }, 1000);
    }

    registerLevelByCallback(name:string, callback:(k:THREE.Object3D)=>void, autoLoad=false) {
        var res = this.levels.subResourceScene(name, this.scene, 
            (inst:THREE.Object3D,instRes:ResourceTree)=>{
                callback(inst);
        });
        if (autoLoad) {
            res.instanceAsync(this.scene);
        }
        return res;
    }

    ensureLevel(name:string):ResourceTree {
        var res = this.levels.resourceFindByPath(name);
        if (res) {
            res.instanceAsync(this.scene);
            return res;
        } else {
            throw ("Unknown level '" + name + "'.");
        }
    }

    leaveLevel(name:string) {
        const res = this.levels.resourceFindByPath(name);
        if (res) {
            res.disposeInstance();
            res.disposeLoad();
        }
    }


}

export { TempleSpace };
