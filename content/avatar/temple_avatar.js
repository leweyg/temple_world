
import * as THREE from 'three';
import { TempleAvatarBody } from './temple_avatar_body.js'
import { TempleAvatarView } from './temple_avatar_view.js'
import { TempleAvatarControls } from './temple_avatar_controls.js';
import { TempleAvatarPose } from './temple_avatar_pose.js'
import { TempleAvatarFocus } from './temple_avatar_focus.js';

class TempleAvatar {

    constructor(world, cameraThree, controlGroup) {
        this.world = world;
        this.scene = new THREE.Group();
        this.scene.name = "TempleAvatar";
        world.worldScene.add(this.scene);

        this.pose = new TempleAvatarPose(this);
        this.body = new TempleAvatarBody(this.scene);
        this.view = new TempleAvatarView(this, cameraThree);
        this.focus = new TempleAvatarFocus(this);
        this.controls = new TempleAvatarControls(this, controlGroup);

        var _this = this;
        this.world.time.listenToTime((time) => {
            _this.onTimeStepped(time);
        });
    }

    onTimeStepped(time) {
        this.controls.onTimeStepped(time);
        this.pose.applyToAvatarAll(time);
    }
}

export { TempleAvatar };
