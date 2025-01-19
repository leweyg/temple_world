
import * as THREE from 'three';

class TempleAvatarControls {

    constructor(avatar, controlGroup) {
        this.isTempleAvatarControls = true;
        this.avatar = avatar;
        this.controlGroup = controlGroup;
        console.assert(this.controlGroup.isControllerGroup);
        var _this = this;
        this.controlGroup.listenControllerEvent((c,s,e) => {
            _this.onControllerEvent(c,s,e);
        });
    }

    onControllerEvent(cntrl, isStart, isEnd) {
        // do processing here
        console.log("Avatar recieved input.");
    }
}

export { TempleAvatarControls };

