
import * as THREE from 'three';
import { TempleSpaceDirectionsBuilder } from './space_directions.js'
import { TempleLights } from './space_lights.js'
import { TempleSpaceKalaChakra } from './space_kalachakra.js'
import { ResourceTree } from '../code/resource_tree.js';

class TempleSpace {

    constructor(world) {
        this.scene = new THREE.Group();
        this.scene.name = "TempleSpace";
        world.worldScene.add(this.scene);

        this.levels = world.resourceRoot.subResourceScene("ActiveSpaces", this.scene);
        this.registerLevelByCallback("Floor", k => {
            new TempleSpaceDirectionsBuilder(k);
        });
        this.registerLevelByCallback("KalaChakra", k => {
            new TempleSpaceKalaChakra(k);
        }, true);
        this.ensureLevel("Floor");

        this.lights = new TempleLights(this.scene);
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
        res.disposeInstance(); // TODO
    }


}

export { TempleSpace };
