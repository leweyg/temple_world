
import * as THREE from 'three';
import { TempleAvatarBody } from './temple_avatar_body.js'

class TempleAvatar {

    constructor(parentScene) {
        this.scene = new THREE.Group();
        this.scene.name = "TempleAvatar";
        parentScene.add(this.scene);
        this.body = new TempleAvatarBody(this.scene);
    }


}

export { TempleAvatar };
