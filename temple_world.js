
import * as THREE from 'three';
import { TempleAvatar } from './content/avatar/temple_avatar.js'
import { TempleSpaceDirectionsBuilder } from './content/spaces/space_directions.js'

class TempleWorld {

    constructor(parentScene) {
        this.worldScene = new THREE.Group();
        this.worldScene.name = "TempleWorld";
        parentScene.add(this.worldScene);
        this.env = new TempleSpaceDirectionsBuilder(this.worldScene);
        this.avatar = new TempleAvatar(this.worldScene);
    }


}

export { TempleWorld };
