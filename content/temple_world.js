
import * as THREE from 'three';
import { TempleAvatar } from './avatar/temple_avatar.js'
import { TempleSpaceDirectionsBuilder } from './spaces/space_directions.js'
import { TempleLights } from './spaces/space_lights.js'

class TempleWorld {

    constructor(parentScene, cameraThree, requestRedrawCallback) {
        this.parentScene = parentScene;
        this.requestRedrawCallback = requestRedrawCallback;

        this.worldScene = new THREE.Group();
        this.worldScene.name = "TempleWorld";
        parentScene.add(this.worldScene);

        this.environment = new TempleSpaceDirectionsBuilder(this.worldScene);
        this.avatar = new TempleAvatar(this.worldScene, cameraThree);
        this.lights = new TempleLights(this.worldScene);

        this.stats = {
            count_renders : 0,
        };
    }

    onPreRender() {
        this.stats.count_renders++;
    }

}

export { TempleWorld };
