
import * as THREE from 'three';
import { TempleAvatar } from './avatar/temple_avatar.js'
import { TempleSpace } from './spaces/temple_space.js'
import { ControllerGroup } from './controls/temple_controls.js'

class TempleWorld {

    constructor(parentScene, cameraThree, requestRedrawCallback) {
        this.parentScene = parentScene;
        this.requestRedrawCallback = requestRedrawCallback;

        this.worldScene = new THREE.Group();
        this.worldScene.name = "TempleWorld";
        parentScene.add(this.worldScene);

        this.controlGroup = new ControllerGroup();

        this.space = new TempleSpace(this.worldScene);
        this.avatar = new TempleAvatar(this.worldScene, cameraThree, this.controlGroup);

        this.stats = {
            count_renders : 0,
        };
    }

    onPreRender() {
        this.stats.count_renders++;
    }

}

export { TempleWorld };
