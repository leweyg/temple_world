
import * as THREE from 'three';
import { ControllerMode, ControllerPhase } from '../controls/temple_controls.js';

class ControlSettings {
    static lookRateUpDown = 0.25
    static lookRateSide = 0.25
};

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

        var _this = this;
        this.avatar.world.time.listenToTime((time) => {
            _this.onTimeStepped(time);
        });
    }

    onTimeStepped(time) {
        var acts = this.controlGroup.getActives();
        for (var ci in acts) {
            var c = acts[ci];
            this.onUseControl(c, time);
        }
    }

    onControllerEvent(control) {
        // do processing here
        if ((!control.isDown) && (!control.isEnd)) return;

        if (control.isStart) {
            console.assert(control.mode == ControllerMode.None);
            const halfRangeX = control.rawRange.x * 0.5;
            if (control.rawInitial.x < halfRangeX) {
                control.mode = ControllerMode.Move;
            } else {
                control.mode = ControllerMode.Look;
            }
        }
        this.onUseControl(control, null);

        //console.log("Avatar recieved input.");
        var hand = this.avatar.body.hands[0];
        const tv1 = this.tv1;

        tv1.copy(control.unitCurrent);
        tv1.multiplyScalar(0.5);
        tv1.add(hand.initialPos);
        hand.scene.position.copy(tv1);

        this.avatar.world.time.requestUpdate();
    }

    onUseControl(control, time) {
        if (control.mode == ControllerMode.Move) {
            this.onUseControl_Move(control, time);
        } else if (control.mode == ControllerMode.Look) {
            this.onUseControl_Look(control, time);
        }
    }

    onUseControl_Move(control, time) {
        if (time == null) return;
        const tv1 = this.tv1;
        tv1.copy( control.unitCurrent );
        tv1.set( tv1.x, 0, tv1.y );
        tv1.multiplyScalar(1.0 * time.dt); // speed?
        this.avatar.pose.bodyPos.add(tv1);
    }

    _tq1 = new THREE.Quaternion();
    _tv1 = new THREE.Vector3();
    _tvUp = new THREE.Vector3(0,1.0,0);
    _tvAcross = new THREE.Vector3(1.0,0,0);
    onUseControl_Look(control, time) {
        if (time == null) return;
        const tq1 = this._tq1;
        const modFacing = this.avatar.pose.viewFacing;

        const avatarSide = this._tv1;
        avatarSide.copy(this._tvUp);
        avatarSide.cross(this.avatar.pose.bodyFacing);

        const dx = control.unitCurrent.x * time.dt * -ControlSettings.lookRateSide;
        tq1.setFromAxisAngle(this._tvUp, dx);
        modFacing.applyQuaternion(tq1);

        const dy = control.unitCurrent.y * time.dt * ControlSettings.lookRateUpDown;
        tq1.setFromAxisAngle(avatarSide, dy);
        modFacing.applyQuaternion(tq1);
        
        var facingY = modFacing.y;
        const maxY = 0.7;
        facingY = Math.max(-maxY, Math.min(maxY, facingY));
        modFacing.setY(facingY);
        modFacing.normalize();

        this.avatar.pose.adjustCameraForViewFacing();
    }
}

export { TempleAvatarControls };

