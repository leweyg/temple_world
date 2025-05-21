
import * as THREE from 'three';
import { ControllerGroup, ControllerMode, ControllerPhase, ControllerStream } from '../controls/temple_controls.js';
import { TempleAvatar } from './temple_avatar.js';
import { TempleTime } from '../temple_time.js';

class ControlSettings {
    static lookRateUpDown = 0.5
    static lookRateSide = 0.5
    static lookRateAimScalar = 0.25
    static aimZoomScalar = 0.61
    static aimAnimDuration = 2.0;

    static speedWalk = 1.0;
    static speedRun = 3.0;
};

class TempleAvatarControls {
    avatar : TempleAvatar;
    controlGroup : ControllerGroup;
    isTempleAvatarControls : boolean = true;
    isDevMode = false;
    isDevModeChanged = false;
    controlSpace : THREE.Object3D;
    controlSpaceFly : THREE.Object3D;

    _tq1 = new THREE.Quaternion();
    _tv1 = new THREE.Vector3();
    _tv2 = new THREE.Vector3();
    _tvFacing = new THREE.Vector3();
    _tqFacing = new THREE.Quaternion();
    _tqFlatFacing = new THREE.Quaternion();
    _tvUp = new THREE.Vector3(0,1.0,0);
    _tvAcross = new THREE.Vector3(1.0,0,0);
    
    constructor(avatar:TempleAvatar, controlGroup:ControllerGroup) {
        this.isTempleAvatarControls = true;
        this.avatar = avatar;
        this.isDevMode = false;
        this.isDevModeChanged = false;

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

        var _this = this;
        this.avatar.world.time.listenToTime((time) => {
            _this.onTimeStepped(time);
        });
    }

    onTimeStepped(time:TempleTime) {
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

    onControllerEvent(control:ControllerStream) {
        // do processing here
        //if ((!control.isDown) && (!control.isEnd)) return;

        if (control.isStart && !control.isButton) {
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
        } else if (control.isStart && control.isButton) {
            control.mode = ControllerMode.DevMenu;
        }
        this.onUseControl(control, null);

        const animateHand = false;
        if (animateHand) {
            //console.log("Avatar recieved input.");
            var hand = this.avatar.body.hands[0];
            const tv1 = this._tv1;

            tv1.copy(control.unitCurrent);
            tv1.multiplyScalar(0.5);
            tv1.add(hand.initialPos);
            hand.scene.position.copy(tv1);
        }

        this.avatar.world.time.requestUpdate();
    }

    onUseControl(control : ControllerStream, time : TempleTime|null) {
        if (control.mode == ControllerMode.Walk) {
            this.onUseControl_WalkOrRun(control, time, false);
        } else if (control.mode == ControllerMode.Run) {
            this.onUseControl_WalkOrRun(control, time, true);
        } else if (control.mode == ControllerMode.Look) {
            this.onUseControl_LookOrAim(control, time, false);
        } else if (control.mode == ControllerMode.Aim) {
            this.onUseControl_LookOrAim(control, time, true);
        } else if (control.mode == ControllerMode.DevMenu) {
            this.onUseControl_DevMode(control);
        } else if (control.mode == ControllerMode.None) {
            // all good
        } else {
            console.log("TODO: onUseControl for '" + control.mode + "'.");
        }
    }

    onUseControl_DevMode(control : ControllerStream) {
        if (control.isEnd) {
            this.isDevMode = !this.isDevMode;
            this.isDevModeChanged = true;
        }
    }

    
    onUseControl_WalkOrRun(control:ControllerStream, time:TempleTime|null, isRun:boolean) {
        if (time == null) return;
        const tv1 = this._tv1;
        const tv2 = this._tv2;
        tv1.copy( control.unitCurrent );
        var motion = tv1.length();
        tv1.set( tv1.x, 0, tv1.y );
        const localToControl = this.controlSpace; // isRun ? this.controlSpaceFly : this.controlSpace;
        localToControl.localToWorld(tv1);
        tv2.copy(tv1);
        const baseSpeed = isRun ? ControlSettings.speedRun : ControlSettings.speedWalk
        tv1.multiplyScalar(baseSpeed * time.dt);
        const minToTurn = 0.1;
        if (motion > minToTurn) {
            this.avatar.pose.bodyPos.add(tv1);
            const heldScene = this.avatar.focus.heldScene();
            if (heldScene) {
                heldScene.position.add(tv1);
            }
            tv2.setY(0);
            tv2.normalize();
            this.avatar.pose.bodyFacing.copy(tv2);
        }
    }


    onUseControl_LookOrAim(control:ControllerStream, time:TempleTime|null, isAim:boolean) {
        if (time == null) {
            
            // start/stop stuff:
            if (isAim && (control.isStart || control.isEnd)) {
                time = this.avatar.world.time;
                time.requestRealtimeForDuration(ControlSettings.aimAnimDuration);


                if (control.isEnd) {
                    const centered = this.avatar.view.latestCenterField();
                    console.log("LatestCentered=" + centered);
                    const oldHeld = this.avatar.focus.held;
                    const newHeld = oldHeld ? null : centered;
                    console.log("NewHeld=" + newHeld + " old=" + oldHeld + " centered=" + centered);
                    this.avatar.focus.ensureFocus(newHeld, centered);
                }
                
            }
            
            return;
        }
        const tq1 = this._tq1;
        const prevFacing = this.avatar.pose.viewFacing;
        const nxtFacing = this._tvFacing;
        const lookSpeed = isAim ? ControlSettings.lookRateAimScalar : 1.0;
        nxtFacing.copy(prevFacing);

        const avatarSide = this._tv1;
        avatarSide.copy(this._tvAcross);
        this.controlSpace.localToWorld(avatarSide);
        const dy = control.unitCurrent.y * time.dt * lookSpeed * -ControlSettings.lookRateUpDown;
        tq1.setFromAxisAngle(avatarSide, dy);
        nxtFacing.applyQuaternion(tq1);

        const dx = control.unitCurrent.x * time.dt * lookSpeed * -ControlSettings.lookRateSide;
        tq1.setFromAxisAngle(this._tvUp, dx);
        nxtFacing.applyQuaternion(tq1);
        
        var facingY = nxtFacing.y;
        const maxY = 0.7;
        facingY = Math.max(-maxY, Math.min(maxY, facingY));
        nxtFacing.setY(facingY);
        nxtFacing.normalize();

        const deltaQuat = this._tqFacing;
        deltaQuat.setFromUnitVectors(prevFacing, nxtFacing);

        const deltaQuatFlat = this._tqFlatFacing;
        const nextFacingFlat = this._tv2;
        nextFacingFlat.copy(nxtFacing);
        nextFacingFlat.setY(prevFacing.y);
        deltaQuatFlat.setFromUnitVectors(prevFacing, nxtFacing);

        this.avatar.pose.viewFacing.copy(nxtFacing);
        this.avatar.pose.adjustCameraForViewFacing();
        this.avatar.pose.viewFovScale = isAim ? ControlSettings.aimZoomScalar : 1.0;

        if (isAim) {
            const centered = this.avatar.view.latestCenterField();
            this.avatar.focus.ensureCentered(centered);
        }
        const heldScene = this.avatar.focus.heldScene();
        if (heldScene) {
            //heldScene.applyQuaternion(deltaQuatFlat);
            const heldOffset = this._tv1;
            const rotateOriginWorld = this.avatar.scene.position;
            heldOffset.copy(heldScene.position);
            heldScene.parent?.localToWorld(heldOffset);
            heldOffset.sub(rotateOriginWorld);
            heldOffset.applyQuaternion(deltaQuat);
            heldOffset.add(rotateOriginWorld);
            heldScene.parent?.worldToLocal(heldOffset);
            heldScene.position.copy(heldOffset);
        }
    }
}

export { TempleAvatarControls };

