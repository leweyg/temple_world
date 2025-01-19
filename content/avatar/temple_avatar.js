
import * as THREE from 'three';
import { TempleAvatarBody } from './temple_avatar_body.js'
import { TempleAvatarView } from './temple_avatar_view.js'
import { TempleAvatarControls } from './temple_avatar_controls.js';

class TempleAvatar {

    constructor(world, cameraThree, controlGroup) {
        this.world = world;
        this.scene = new THREE.Group();
        this.scene.name = "TempleAvatar";
        world.worldScene.add(this.scene);
        this.body = new TempleAvatarBody(this.scene);
        this.view = new TempleAvatarView(this, cameraThree);
        this.controls = new TempleAvatarControls(this, controlGroup);
    }


}

export { TempleAvatar };
