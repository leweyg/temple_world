
import * as THREE from 'three';
import { ControllerMode, ControllerPhase } from '../controls/temple_controls.js';

class ControlSettings {
    static lookRateUpDown = 0.5
    static lookRateSide = 0.5
    static lookRateAimScalar = 0.25
    static aimZoomScalar = 0.5
    static aimAnimDuration = 2.0;

    static speedWalk = 1.0;
    static speedRun = 3.0;
};

class TempleAvatarControls {

    constructor(avatar, controlGroup) {
        this.isTempleAvatarControls = true;
        this.avatar = avatar;

        this.controlSpace = new THREE.Object3D();
        this.controlSpace.name = "controlSpace";
        this.avatar.world.worldScene.add(this.controlSpace);
        this.controlSpaceFly = new THREE.Object3D();
        this.controlSpaceFly.name = "controlSpaceFly";
        this.avatar.world.worldScene.add(this.controlSpaceFly);

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
        // before controllers:
        this.avatar.pose.viewFovScale = 1.0;

        // controllers:
        var anyDown = false;
        var acts = this.controlGroup.getActives();
        for (var ci in acts) {
            var c = acts[ci];
            this.onUseControl(c, time);
            if (c.isDown) {
                anyDown = true;
            }
        }

        // after controllers
        if (anyDown) {
            this.avatar.world.time.requestUpdate();
        }
    }

    onControllerEvent(control) {
        // do processing here
        //if ((!control.isDown) && (!control.isEnd)) return;

        if (control.isStart) {
            console.assert(control.mode == ControllerMode.None);
            const halfRangeX = control.rawRange.x * 0.5;
            const halfRangeY = control.rawRange.y * 0.5;
            const isTopY = (control.rawInitial.y < halfRangeY);
            if (control.rawInitial.x < halfRangeX) {
                if (isTopY) {
                    control.mode = ControllerMode.Run;
                } else {
                    control.mode = ControllerMode.Walk;
                }
            } else {
                if (isTopY) {
                    control.mode = ControllerMode.Aim;
                } else {
                    control.mode = ControllerMode.Look;
                }
            }
        }
        this.onUseControl(control, null);

        const animateHand = false;
        if (animateHand) {
            //console.log("Avatar recieved input.");
            var hand = this.avatar.body.hands[0];
            const tv1 = this.tv1;

            tv1.copy(control.unitCurrent);
            tv1.multiplyScalar(0.5);
            tv1.add(hand.initialPos);
            hand.scene.position.copy(tv1);
        }

        this.avatar.world.time.requestUpdate();
    }

    onUseControl(control, time) {
        if (control.mode == ControllerMode.Walk) {
            this.onUseControl_WalkOrRun(control, time, false);
        } else if (control.mode == ControllerMode.Run) {
            this.onUseControl_WalkOrRun(control, time, true);
        } else if (control.mode == ControllerMode.Look) {
            this.onUseControl_LookOrAim(control, time, false);
        } else if (control.mode == ControllerMode.Aim) {
            this.onUseControl_LookOrAim(control, time, true);
        } else if (control.mode == ControllerMode.None) {
            // all good
        } else {
            console.log("TODO: onUseControl for '" + control.mode + "'.");
        }
    }

    onUseControl_WalkOrRun(control, time, isRun) {
        if (time == null) return;
        const tv1 = this._tv1;
        const tv2 = this._tv2;
        tv1.copy( control.unitCurrent );
        var motion = tv1.length();
        tv1.set( tv1.x, 0, tv1.y );
        const localToControl = isRun ? this.controlSpaceFly : this.controlSpace;
        localToControl.localToWorld(tv1);
        tv2.copy(tv1);
        const baseSpeed = isRun ? ControlSettings.speedRun : ControlSettings.speedWalk
        tv1.multiplyScalar(baseSpeed * time.dt);
        const minToTurn = 0.1;
        if (motion > minToTurn) {
            this.avatar.pose.bodyPos.add(tv1);
            tv2.setY(0);
            tv2.normalize();
            this.avatar.pose.bodyFacing.copy(tv2);
        }
    }

    _tq1 = new THREE.Quaternion();
    _tv1 = new THREE.Vector3();
    _tv2 = new THREE.Vector3();
    _tvUp = new THREE.Vector3(0,1.0,0);
    _tvAcross = new THREE.Vector3(1.0,0,0);
    onUseControl_LookOrAim(control, time, isAim) {
        if (time == null) {
            // start/stop stuff:
            if (isAim && (control.isStart || control.isEnd)) {
                time = this.avatar.world.time;
                time.requestRealtimeForDuration(ControlSettings.aimAnimDuration);
            }
            
            return;
        }
        const tq1 = this._tq1;
        const modFacing = this.avatar.pose.viewFacing;
        const lookSpeed = isAim ? ControlSettings.lookRateAimScalar : 1.0;

        const avatarSide = this._tv1;
        avatarSide.copy(this._tvAcross);
        this.controlSpace.localToWorld(avatarSide);
        const dy = control.unitCurrent.y * time.dt * lookSpeed * -ControlSettings.lookRateUpDown;
        tq1.setFromAxisAngle(avatarSide, dy);
        modFacing.applyQuaternion(tq1);

        const dx = control.unitCurrent.x * time.dt * lookSpeed * -ControlSettings.lookRateSide;
        tq1.setFromAxisAngle(this._tvUp, dx);
        modFacing.applyQuaternion(tq1);
        
        var facingY = modFacing.y;
        const maxY = 0.7;
        facingY = Math.max(-maxY, Math.min(maxY, facingY));
        modFacing.setY(facingY);
        modFacing.normalize();

        this.avatar.pose.adjustCameraForViewFacing();
        this.avatar.pose.viewFovScale = isAim ? ControlSettings.aimZoomScalar : 1.0;
    }
}

export { TempleAvatarControls };

