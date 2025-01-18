
import * as THREE from 'three';
import { TempleSpaceDirectionsBuilder } from './space_directions.js'
import { TempleLights } from './space_lights.js'

class TempleSpace {

    constructor(parentScene) {
        this.scene = new THREE.Group();
        this.scene.name = "TempleSpace";
        parentScene.add(this.scene);

        this.level = new TempleSpaceDirectionsBuilder(this.scene);
        this.lights = new TempleLights(this.scene);
    }


}

export { TempleSpace };
