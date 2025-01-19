
import * as THREE from 'three';
import { TempleAvatarBody } from './temple_avatar_body.js'
import { TempleAvatarView } from './temple_avatar_view.js'
import { TempleAvatarControls } from './temple_avatar_controls.js';

class TempleAvatar {

    constructor(parentScene, cameraThree, controlGroup) {
        this.scene = new THREE.Group();
        this.scene.name = "TempleAvatar";
        parentScene.add(this.scene);
        this.body = new TempleAvatarBody(this.scene);
        this.view = new TempleAvatarView(this, cameraThree);
        this.controls = new TempleAvatarControls(this, controlGroup);
    }


}

export { TempleAvatar };
