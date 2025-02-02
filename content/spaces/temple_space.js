
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

        this.levels = world.resourceRoot.subResourceScene("ActiveSpaces");
        this.addLevelByCallback("Floor", k => {
            new TempleSpaceDirectionsBuilder(k);
        });
        this.addLevelByCallback("KalaChakra", k => {
            new TempleSpaceKalaChakra(k);
        });

        this.lights = new TempleLights(this.scene);
    }

    addLevelByCallback(name, callback) {
        console.assert(callback);
        var res = this.levels.subResourceScene(name, this.scene, callback);
        return res;
    }


}

export { TempleSpace };
