
import * as THREE from 'three';
import { TempleSpaceDirectionsBuilder } from './space_directions.js'
import { TempleLights } from './space_lights.js'
import { TempleSpaceKalaChakra } from './space_kalachakra.js'
import { ResourceTree } from '../code/resource_tree.js';
import { SpaceTrainingBoxes } from './space_training_boxes.js';
import { SpaceEastAltar0 } from './east/altars/space_east_altar_0.js';

class TempleSpace {

    constructor(world) {
        this.scene = new THREE.Group();
        this.scene.name = "TempleSpace";
        world.worldScene.add(this.scene);

        this.levels = world.resourceRoot.subResourceScene("ActiveSpaces", this.scene);
        this.resources = this.levels;
        this.registerLevelByCallback("Floor", k => {
            new TempleSpaceDirectionsBuilder(k);
        });
        this.registerLevelByCallback("KalaChakra", k => {
            new TempleSpaceKalaChakra(k);
        }, true);
        this.registerLevelByCallback("TrainingBoxes", k => {
            new SpaceTrainingBoxes(k, this.resources);
        }, true);
        this.registerLevelByCallback("SpaceEastAltar0", k => {
            new SpaceEastAltar0(k, this.resources);
        }, true);
        this.ensureLevel("Floor");
        this.ensureLevel("TrainingBoxes");

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

    registerLevelByCallback(name, callback, autoLoad=false) {
        console.assert(callback);
        var res = this.levels.subResourceScene(name, null, callback);
        if (autoLoad) {
            res.instanceAsync(this.scene);
        }
        return res;
    }

    ensureLevel(name) {
        var res = this.levels.resourceFindByPath(name);
        console.assert(res);
        res.instanceAsync(this.scene);
    }

    leaveLevel(name) {
        var res = this.levels.resourceFindByPath(name);
        console.assert(res);
        res.disposeInstance();
        res.disposeLoad();
    }


}

export { TempleSpace };
