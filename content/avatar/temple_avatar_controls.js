
import * as THREE from 'three';

class TempleAvatarControls {

    constructor(avatar, controlGroup) {
        this.isTempleAvatarControls = true;
        this.avatar = avatar;
        this.controlGroup = controlGroup;
        console.assert(this.controlGroup.isControllerGroup);
        var _this = this;
        this.controlGroup.listenControllerEvent((c) => {
            _this.onControllerEvent(c);
        });
    }

    onControllerEvent(cntrl) {
        // do processing here
        if ((!cntrl.isDown) && (!cntrl.isEnd)) return;
        console.log("Avatar recieved input.");

    }
}

export { TempleAvatarControls };

