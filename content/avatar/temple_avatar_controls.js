import * as THREE from 'three';
import { ControllerMode } from '../controls/temple_controls.js';
import { TempleControlsOverlay } from './temple_controls_overlay.js';
var ControlSettings = /** @class */ (function () {
    function ControlSettings() {
    }
    ControlSettings.lookRateUpDown = 0.5;
    ControlSettings.lookRateSide = 0.5;
    ControlSettings.lookRateAimScalar = 0.25;
    ControlSettings.aimZoomScalar = 0.61;
    ControlSettings.aimRotatingScalar = 1.1;
    ControlSettings.aimAnimDuration = 2.0;
    ControlSettings.speedWalk = 1.0;
    ControlSettings.speedRun = 3.0;
    return ControlSettings;
}());
;
var TempleAvatarControls = /** @class */ (function () {
    function TempleAvatarControls(avatar, controlGroup) {
        this.isTempleAvatarControls = true;
        this.isDevMode = false;
        this.isDevModeChanged = false;
        this._tq1 = new THREE.Quaternion();
        this._tv1 = new THREE.Vector3();
        this._tv2 = new THREE.Vector3();
        this._tv3 = new THREE.Vector3();
        this._tvFacing = new THREE.Vector3();
        this._tqFacing = new THREE.Quaternion();
        this._tqFlatFacing = new THREE.Quaternion();
        this._tvUp = new THREE.Vector3(0, 1.0, 0);
        this._tvAcross = new THREE.Vector3(1.0, 0, 0);
        this._tm1 = new THREE.Matrix4();
        this._te1 = new THREE.Euler();
        this.isTempleAvatarControls = true;
        this.avatar = avatar;
        this.isDevMode = false;
        this.isDevModeChanged = false;
        this.overlay = new TempleControlsOverlay();
        this.controlSpace = new THREE.Object3D();
        this.controlSpace.name = "controlSpace";
        this.avatar.world.worldScene.add(this.controlSpace);
        this.controlSpaceFly = new THREE.Object3D();
        this.controlSpaceFly.name = "controlSpaceFly";
        this.avatar.world.worldScene.add(this.controlSpaceFly);
        this.controlGroup = controlGroup;
        console.assert(this.controlGroup.isControllerGroup);
        var _this = this;
        this.controlGroup.listenControllerEvent(function (c) {
            _this.onControllerEvent(c);
        });
        var _this = this;
        this.avatar.world.time.listenToTime(function (time) {
            _this.onTimeStepped(time);
        });
    }
    TempleAvatarControls.prototype.onTimeStepped = function (time) {
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
        // overlay after controllers:
        this.overlay.updateFromAvatar(this.avatar);
    };
    TempleAvatarControls.prototype.onControllerEvent = function (control) {
        // do processing here
        //if ((!control.isDown) && (!control.isEnd)) return;
        var nextMode = control.mode;
        if (control.isStart && !control.isButton) {
            console.assert(control.mode == ControllerMode.None);
            var halfRangeX = control.rawRange.x * 0.5;
            var halfRangeY = control.rawRange.y * 0.5;
            var isTopY = (control.rawInitial.y < halfRangeY);
            var isMoveSide = (control.rawInitial.x < halfRangeX);
            var isHoldingObject = this.avatar.focus.heldScene();
            if (isMoveSide) {
                if (isTopY) {
                    if (isHoldingObject) {
                        control.changeMode(ControllerMode.PushingObject);
                    }
                    else {
                        control.changeMode(ControllerMode.Run);
                    }
                }
                else {
                    control.mode = ControllerMode.Walk;
                }
            }
            else {
                if (isTopY) {
                    if (isHoldingObject) {
                        control.changeMode(ControllerMode.RotatingObject);
                    }
                    else {
                        control.mode = ControllerMode.Aim;
                    }
                }
                else {
                    control.mode = ControllerMode.Look;
                }
            }
        }
        else if (control.isStart && control.isButton) {
            control.mode = ControllerMode.DevMenu;
        }
        if (control.isStart || control.isEnd) {
            //console.log("ControlMode='" + control.mode + "' go=" + control.isStart);
        }
        this.onUseControl(control, null);
        var animateHand = false;
        if (animateHand) {
            //console.log("Avatar recieved input.");
            var hand = this.avatar.body.hands[0];
            var tv1 = this._tv1;
            tv1.copy(control.unitCurrent);
            tv1.multiplyScalar(0.5);
            tv1.add(hand.initialPos);
            hand.scene.position.copy(tv1);
        }
        this.avatar.world.time.requestUpdate();
    };
    TempleAvatarControls.prototype.onUseControl = function (control, time) {
        if (control.mode == ControllerMode.Walk) {
            this.onUseControl_WalkOrRun(control, time, false);
        }
        else if (control.mode == ControllerMode.Run) {
            this.onUseControl_WalkOrRun(control, time, true);
        }
        else if (control.mode == ControllerMode.Look) {
            this.onUseControl_LookOrAim(control, time, false);
        }
        else if (control.mode == ControllerMode.Aim) {
            this.onUseControl_LookOrAim(control, time, true);
        }
        else if (control.mode == ControllerMode.RotatingObject) {
            this.onUseControl_RotatingObject(control, time, true);
        }
        else if (control.mode == ControllerMode.PushingObject) {
            this.onUseControl_PushObject(control, time, false);
        }
        else if (control.mode == ControllerMode.DevMenu) {
            this.onUseControl_DevMode(control);
        }
        else if (control.mode == ControllerMode.None) {
            // all good
        }
        else {
            console.log("TODO: onUseControl for '" + control.mode + "'.");
        }
    };
    TempleAvatarControls.prototype.onUseControl_DevMode = function (control) {
        if (control.isEnd) {
            this.isDevMode = !this.isDevMode;
            this.isDevModeChanged = true;
        }
    };
    TempleAvatarControls.prototype.onUseControl_WalkOrRun = function (control, time, isRun) {
        if (time == null)
            return;
        var tv1 = this._tv1;
        var tv2 = this._tv2;
        var tv3 = this._tv3;
        var tm1 = this._tm1;
        tv1.copy(control.unitCurrent);
        var motion = tv1.length();
        tv1.set(tv1.x, 0, tv1.y);
        var localToControl = this.controlSpace; // isRun ? this.controlSpaceFly : this.controlSpace;
        localToControl.localToWorld(tv1);
        tv2.copy(tv1);
        var baseSpeed = isRun ? ControlSettings.speedRun : ControlSettings.speedWalk;
        tv1.multiplyScalar(baseSpeed * time.dt);
        var minToTurn = 0.1;
        if (motion > minToTurn) {
            this.avatar.pose.bodyPos.add(tv1);
            var heldScene = this.avatar.focus.heldScene();
            if (heldScene) {
                tv3.copy(tv1);
                if (heldScene.parent) {
                    tm1.extractRotation(heldScene.parent.matrixWorld).invert();
                    tv3.applyMatrix4(tm1);
                }
                heldScene.position.add(tv3);
            }
            tv2.setY(0);
            tv2.normalize();
            this.avatar.pose.bodyFacing.copy(tv2);
        }
    };
    TempleAvatarControls.prototype.onUseControl_LookOrAim = function (control, time, isAim) {
        var _a, _b;
        if (time == null) {
            // start/stop stuff:
            if (isAim && (control.isStart || control.isEnd)) {
                time = this.avatar.world.time;
                time.requestRealtimeForDuration(ControlSettings.aimAnimDuration);
                var oldHeld = this.avatar.focus.held;
                if (control.isEnd) {
                    console.log("Aim end...");
                    if (oldHeld) {
                        if (control.isGestureDrag) {
                            console.log("Hold was held due to drag.");
                            // was holding, still holding
                        }
                        else {
                            var centered = this.avatar.view.latestCenterField();
                            var newHeld = null;
                            this.avatar.focus.ensureFocus(newHeld, centered);
                        }
                    }
                    else {
                        console.log("IsDrag=" + control.isGestureDrag);
                        var centered = this.avatar.view.latestCenterField();
                        var newHeld = oldHeld ? null : centered;
                        this.avatar.focus.ensureFocus(newHeld, centered);
                    }
                }
            }
            return;
        }
        var tq1 = this._tq1;
        var prevFacing = this.avatar.pose.viewFacing;
        var nxtFacing = this._tvFacing;
        var lookSpeed = isAim ? ControlSettings.lookRateAimScalar : 1.0;
        nxtFacing.copy(prevFacing);
        var avatarSide = this._tv1;
        avatarSide.copy(this._tvAcross);
        this.controlSpace.localToWorld(avatarSide);
        var dy = control.unitCurrent.y * time.dt * lookSpeed * -ControlSettings.lookRateUpDown;
        tq1.setFromAxisAngle(avatarSide, dy);
        nxtFacing.applyQuaternion(tq1);
        var dx = control.unitCurrent.x * time.dt * lookSpeed * -ControlSettings.lookRateSide;
        tq1.setFromAxisAngle(this._tvUp, dx);
        nxtFacing.applyQuaternion(tq1);
        var facingY = nxtFacing.y;
        var maxY = 0.7;
        facingY = Math.max(-maxY, Math.min(maxY, facingY));
        nxtFacing.setY(facingY);
        nxtFacing.normalize();
        var deltaQuat = this._tqFacing;
        deltaQuat.setFromUnitVectors(prevFacing, nxtFacing);
        var deltaQuatFlat = this._tqFlatFacing;
        var nextFacingFlat = this._tv2;
        nextFacingFlat.copy(nxtFacing);
        nextFacingFlat.setY(prevFacing.y);
        deltaQuatFlat.setFromUnitVectors(prevFacing, nxtFacing);
        this.avatar.pose.viewFacing.copy(nxtFacing);
        this.avatar.pose.adjustCameraForViewFacing();
        this.avatar.pose.viewFovScale = isAim ? ControlSettings.aimZoomScalar : 1.0;
        if (isAim) {
            var centered = this.avatar.view.latestCenterField();
            this.avatar.focus.ensureCentered(centered);
        }
        var heldScene = this.avatar.focus.heldScene();
        if (heldScene) {
            //heldScene.applyQuaternion(deltaQuatFlat);
            var heldOffset = this._tv1;
            var rotateOriginWorld = this.avatar.scene.position;
            heldOffset.copy(heldScene.position);
            (_a = heldScene.parent) === null || _a === void 0 ? void 0 : _a.localToWorld(heldOffset);
            heldOffset.sub(rotateOriginWorld);
            heldOffset.applyQuaternion(deltaQuat);
            heldOffset.add(rotateOriginWorld);
            (_b = heldScene.parent) === null || _b === void 0 ? void 0 : _b.worldToLocal(heldOffset);
            heldScene.position.copy(heldOffset);
        }
    };
    TempleAvatarControls.prototype.onUseControl_RotatingObject = function (control, time, isAim) {
        var _a, _b;
        if (time == null) {
            // start/stop stuff:
            if (control.isStart || control.isEnd) {
                time = this.avatar.world.time;
                time.requestRealtimeForDuration(ControlSettings.aimAnimDuration);
                var heldScene = this.avatar.focus.heldScene();
                var heldField = heldScene ? (_a = heldScene.userData) === null || _a === void 0 ? void 0 : _a.field : null;
                if (control.isEnd && heldField && heldField.isGridSnappable && typeof heldField.snapToGrid === 'function') {
                    heldField.snapToGrid();
                }
                var oldHeld = this.avatar.focus.held;
                if (control.isEnd) {
                    if (oldHeld) {
                        if (control.isGestureTap) {
                            console.log("Dropping object after tap+rotate:");
                            this.avatar.focus.ensureHeld(null);
                        }
                    }
                }
            }
            return;
        }
        var held = this.avatar.focus.heldScene();
        if (!held) {
            console.log("No held scene for rotating.");
            return;
        }
        this.avatar.pose.viewFovScale = isAim ? ControlSettings.aimRotatingScalar : 1.0;
        var tq1 = this._tq1;
        var prevFacing = this.avatar.pose.viewFacing;
        var nxtFacing = this._tvFacing;
        var lookSpeed = isAim ? ControlSettings.lookRateAimScalar : 1.0;
        var rotateSpeed = 4.0;
        nxtFacing.copy(prevFacing);
        var avatarSide = this._tv1;
        avatarSide.copy(this._tvAcross);
        this.controlSpace.localToWorld(avatarSide);
        var dy = control.unitCurrent.y * time.dt * lookSpeed * rotateSpeed * -ControlSettings.lookRateUpDown;
        tq1.setFromAxisAngle(avatarSide, dy);
        nxtFacing.applyQuaternion(tq1);
        var dx = control.unitCurrent.x * time.dt * lookSpeed * rotateSpeed * -ControlSettings.lookRateSide;
        tq1.setFromAxisAngle(this._tvUp, dx);
        nxtFacing.applyQuaternion(tq1);
        var facingY = nxtFacing.y;
        var maxY = 0.7;
        facingY = Math.max(-maxY, Math.min(maxY, facingY));
        nxtFacing.setY(facingY);
        nxtFacing.normalize();
        var deltaQuat = this._tqFacing;
        deltaQuat.setFromUnitVectors(prevFacing, nxtFacing);
        var deltaQuatAxis = this._tqFlatFacing;
        this.projectRotationOntoDominantAxis(deltaQuat, deltaQuatAxis);
        if (held) {
            var heldField = (_b = held.userData) === null || _b === void 0 ? void 0 : _b.field;
            if (heldField && heldField.isGridSnappable && typeof heldField.applyRotationDelta === 'function') {
                heldField.applyRotationDelta(deltaQuatAxis);
            }
            else {
                var heldQuat = this._tq1;
                heldQuat.copy(held.quaternion);
                heldQuat.multiply(deltaQuatAxis);
                held.quaternion.copy(heldQuat);
            }
        }
    };
    TempleAvatarControls.prototype.projectRotationOntoDominantAxis = function (deltaQuat, outputQuat) {
        var q = deltaQuat;
        var qw = Math.max(-1.0, Math.min(1.0, q.w));
        var angle = 2.0 * Math.acos(qw);
        if (angle === 0.0) {
            outputQuat.identity();
            return;
        }
        var s = Math.sqrt(1.0 - qw * qw);
        var axis = this._tv1;
        if (s < 0.0001) {
            axis.set(1.0, 0.0, 0.0);
        }
        else {
            axis.set(q.x / s, q.y / s, q.z / s);
        }
        var absX = Math.abs(axis.x);
        var absY = Math.abs(axis.y);
        var absZ = Math.abs(axis.z);
        if (absY >= absX && absY >= absZ) {
            axis.set(0.0, axis.y < 0.0 ? -1.0 : 1.0, 0.0);
        }
        else if (absZ >= absX && absZ >= absY) {
            axis.set(0.0, 0.0, axis.z < 0.0 ? -1.0 : 1.0);
        }
        else {
            axis.set(axis.x < 0.0 ? -1.0 : 1.0, 0.0, 0.0);
        }
        outputQuat.setFromAxisAngle(axis, angle);
    };
    TempleAvatarControls.prototype.onUseControl_PushObject = function (control, time, isRun) {
        var _a, _b;
        if (time == null) {
            // start/stop stuff:
            if (control.isStart || control.isEnd) {
                time = this.avatar.world.time;
                time.requestRealtimeForDuration(ControlSettings.aimAnimDuration);
                var heldScene = this.avatar.focus.heldScene();
                var heldField_1 = heldScene ? (_a = heldScene.userData) === null || _a === void 0 ? void 0 : _a.field : null;
                if (control.isEnd && heldField_1 && heldField_1.isGridSnappable && typeof heldField_1.snapToGrid === 'function') {
                    heldField_1.snapToGrid();
                }
                var oldHeld = this.avatar.focus.held;
                if (control.isEnd) {
                    if (oldHeld) {
                        if (control.isGestureTap) {
                            console.log("Dropping object after tap+rotate:");
                            this.avatar.focus.ensureHeld(null);
                        }
                    }
                }
            }
            return;
        }
        var held = this.avatar.focus.heldScene();
        if (!held) {
            console.log("No held scene for pushing.");
            return;
        }
        var tv1 = this._tv1;
        var tv2 = this._tv2;
        var tv3 = this._tv3;
        var tm1 = this._tm1;
        tv1.copy(control.unitCurrent);
        var motion = tv1.length();
        tv1.set(tv1.x, 0, tv1.y);
        var localToControl = this.controlSpace;
        localToControl.localToWorld(tv1);
        tv2.copy(tv1);
        var baseSpeed = isRun ? ControlSettings.speedRun : ControlSettings.speedWalk;
        tv1.multiplyScalar(baseSpeed * time.dt);
        tv3.copy(tv1);
        if (held.parent) {
            tm1.extractRotation(held.parent.matrixWorld).invert();
            tv3.applyMatrix4(tm1);
        }
        var heldField = (_b = held.userData) === null || _b === void 0 ? void 0 : _b.field;
        if (heldField && heldField.isGridSnappable && typeof heldField.applyPositionDelta === 'function') {
            heldField.applyPositionDelta(tv3, isRun);
        }
        else {
            held.position.add(tv3);
        }
        // TODO: keep avatar looking at the object (probably gradually):
    };
    return TempleAvatarControls;
}());
export { TempleAvatarControls };
