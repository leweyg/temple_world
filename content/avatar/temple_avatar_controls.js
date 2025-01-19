
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
        this.tv1 = new THREE.Vector3();
    }

    onControllerEvent(cntrl) {
        // do processing here
        if ((!cntrl.isDown) && (!cntrl.isEnd)) return;

        //console.log("Avatar recieved input.");
        var hand = this.avatar.body.hands[0];
        const tv1 = this.tv1;

        tv1.copy(cntrl.unitCurrent);
        tv1.multiplyScalar(0.5);
        tv1.add(hand.initialPos);
        hand.scene.position.copy(tv1);

        this.avatar.world.time.requestUpdate();
    }
}

export { TempleAvatarControls };

