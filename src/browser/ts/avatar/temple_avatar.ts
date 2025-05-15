
import * as THREE from 'three';
import { TempleAvatarBody } from './temple_avatar_body.js'
import { TempleAvatarView } from './temple_avatar_view.js'
import { TempleAvatarControls } from './temple_avatar_controls.js';
import { TempleAvatarPose } from './temple_avatar_pose.js'
import { TempleAvatarFocus } from './temple_avatar_focus.js';
import { TempleAvatarReticle } from './temple_avatar_reticle.js';
import { TempleWorld } from '../temple_world.js';
import { ControllerGroup } from '../controls/temple_controls.js';
import { TempleTime } from '../temple_time.js';

class TempleAvatar {
    world : TempleWorld;
    scene : THREE.Object3D;

    pose : TempleAvatarPose;
    body : TempleAvatarBody;
    view : TempleAvatarView;
    focus : TempleAvatarFocus;
    controls : TempleAvatarControls;
    reticle : TempleAvatarReticle;

    constructor(world:TempleWorld, 
        cameraThree:THREE.Camera,
        controlGroup:ControllerGroup) {

        this.world = world;
        this.scene = new THREE.Group();
        this.scene.name = "TempleAvatar";
        world.worldScene.add(this.scene);

        this.pose = new TempleAvatarPose(this);
        this.body = new TempleAvatarBody(this.scene);
        this.view = new TempleAvatarView(this, cameraThree);
        this.focus = new TempleAvatarFocus(this);
        this.controls = new TempleAvatarControls(this, controlGroup);
        this.reticle = new TempleAvatarReticle(this, cameraThree);

        var _this = this;
        this.world.time.listenToTime((time) => {
            _this.onTimeStepped(time);
        });
    }

    onTimeStepped(time:TempleTime) {
        this.controls.onTimeStepped(time);
        this.pose.applyToAvatarAll(time);
    }
}

export { TempleAvatar };
