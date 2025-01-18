
import * as THREE from 'three';
import { TempleAvatar } from './avatar/temple_avatar.js'
import { TempleSpaceDirectionsBuilder } from './spaces/space_directions.js'

class TempleWorld {

    constructor(parentScene) {
        this.worldScene = new THREE.Group();
        this.worldScene.name = "TempleWorld";
        parentScene.add(this.worldScene);
        this.environment = new TempleSpaceDirectionsBuilder(this.worldScene);
        this.avatar = new TempleAvatar(this.worldScene);
    }


}

export { TempleWorld };
