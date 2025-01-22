
import * as THREE from 'three';
import { TempleSpaceDirectionsBuilder } from './space_directions.js'
import { TempleLights } from './space_lights.js'
import { TempleSpaceKalaChakra } from './space_kalachakra.js'

class TempleSpace {

    constructor(parentScene) {
        this.scene = new THREE.Group();
        this.scene.name = "TempleSpace";
        parentScene.add(this.scene);

        this.levels = [
            new TempleSpaceDirectionsBuilder(this.scene),
            new TempleSpaceKalaChakra(this.scene),
        ];
        this.lights = new TempleLights(this.scene);
    }


}

export { TempleSpace };
