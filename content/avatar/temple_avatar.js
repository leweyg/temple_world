
import * as THREE from 'three';
import { TempleAvatarBody } from './temple_avatar_body.js'
import { TempleAvatarView } from './temple_avatar_view.js'

class TempleAvatar {

    constructor(parentScene, cameraThree) {
        this.scene = new THREE.Group();
        this.scene.name = "TempleAvatar";
        parentScene.add(this.scene);
        this.body = new TempleAvatarBody(this.scene);
        this.view = new TempleAvatarView(this, cameraThree);
    }


}

export { TempleAvatar };
