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
        this._tv4 = new THREE.Vector3();
        this._tvFacing = new THREE.Vector3();
        this._tvControlForward = new THREE.Vector3();
        this._tvControlRight = new THREE.Vector3();
        this._tqFacing = new THREE.Quaternion();
        this._tqFlatFacing = new THREE.Quaternion();
        this._tq2 = new THREE.Quaternion();
        this._tq3 = new THREE.Quaternion();
        this._tq4 = new THREE.Quaternion();
        this._tq5 = new THREE.Quaternion();
        this._tvUp = new THREE.Vector3(0, 1.0, 0);
        this._tvAcross = new THREE.Vector3(1.0, 0, 0);
        this._tm1 = new THREE.Matrix4();
        this._te1 = new THREE.Euler();
        // Discrete rotation state
        this._lastRotationDirection = "none";
        this._discreteRotationThreshold = 0.5;
        this._discreteRotationSnapAngle = Math.PI / 2; // 90 degrees
        this._accumulatedRotationMotion = 0; // Accumulates motion to trigger next rotation
        this._rotationMotionPerSnap = 0.5; // Distance needed to trigger another snap
        // Smooth held object animation
        this._rotationAnimatedObject = null;
        this._targetRotationForHeldObject = new THREE.Quaternion();
        this._rotationAnimStartTime = 0;
        this._rotationAnimDuration = 0.15; // Duration of smooth rotation snap in seconds
        this._isRotationAnimating = false;
        this._rotationAnimStartQuat = new THREE.Quaternion();
        this._positionAnimatedObject = null;
        this._targetPositionForHeldObject = new THREE.Vector3();
        this._positionAnimStartTime = 0;
        this._positionAnimDuration = 0.15;
        this._isPositionAnimating = false;
        this._positionAnimStartPos = new THREE.Vector3();
        this._activeVisualSnapFields = [];
        // Discrete push state (for push object)
        this._lastPushDirection = "none";
        this._discretePushThreshold = 0.3;
        this._accumulatedPushMotion = 0;
        this._pushMotionPerSnap = 0.4; // Distance needed to trigger push movement (1m increments)
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
    TempleAvatarControls.prototype.updateHeldObjectRotationAnimation = function (time) {
        if (!this._isRotationAnimating) {
            return;
        }
        var held = this._rotationAnimatedObject;
        if (!held) {
            this._isRotationAnimating = false;
            return;
        }
        var elapsedTime = time.timeVirtualCurrent - this._rotationAnimStartTime;
        if (elapsedTime >= this._rotationAnimDuration) {
            // Animation complete
            held.quaternion.copy(this._targetRotationForHeldObject);
            this._isRotationAnimating = false;
            this._rotationAnimatedObject = null;
        }
        else {
            // Interpolate between start and target
            var t = elapsedTime / this._rotationAnimDuration;
            var smoothT = t * t * (3.0 - 2.0 * t); // Smoothstep interpolation
            var result = this._tq1;
            result.copy(this._rotationAnimStartQuat);
            result.slerp(this._targetRotationForHeldObject, smoothT);
            held.quaternion.copy(result);
        }
    };
    TempleAvatarControls.prototype.updateHeldObjectPositionAnimation = function (time) {
        if (!this._isPositionAnimating) {
            return;
        }
        var held = this._positionAnimatedObject;
        if (!held) {
            this._isPositionAnimating = false;
            return;
        }
        var elapsedTime = time.timeVirtualCurrent - this._positionAnimStartTime;
        if (elapsedTime >= this._positionAnimDuration) {
            held.position.copy(this._targetPositionForHeldObject);
            this._isPositionAnimating = false;
            this._positionAnimatedObject = null;
        }
        else {
            var t = elapsedTime / this._positionAnimDuration;
            var smoothT = t * t * (3.0 - 2.0 * t);
            held.position.lerpVectors(this._positionAnimStartPos, this._targetPositionForHeldObject, smoothT);
        }
    };
    TempleAvatarControls.prototype.updateVisualSnapAnimations = function (time) {
        if (this._activeVisualSnapFields.length === 0) {
            return;
        }
        var stillAnimating = [];
        for (var i in this._activeVisualSnapFields) {
            var field = this._activeVisualSnapFields[i];
            if (field && typeof field.updateVisualSnapAnimation === 'function') {
                if (field.updateVisualSnapAnimation(time)) {
                    stillAnimating.push(field);
                }
            }
        }
        this._activeVisualSnapFields = stillAnimating;
    };
    TempleAvatarControls.prototype.startHeldObjectRotationAnimation = function (held, targetQuat, startTime) {
        this._rotationAnimatedObject = held;
        this._rotationAnimStartQuat.copy(held.quaternion);
        this._targetRotationForHeldObject.copy(targetQuat);
        this._rotationAnimStartTime = startTime;
        this._isRotationAnimating = true;
    };
    TempleAvatarControls.prototype.startHeldObjectPositionAnimation = function (held, targetPos, startTime) {
        this._positionAnimatedObject = held;
        this._positionAnimStartPos.copy(held.position);
        this._targetPositionForHeldObject.copy(targetPos);
        this._positionAnimStartTime = startTime;
        this._isPositionAnimating = true;
    };
    TempleAvatarControls.prototype.ensureVisualSnapFieldTracked = function (field) {
        if (this._activeVisualSnapFields.indexOf(field) >= 0) {
            return;
        }
        this._activeVisualSnapFields.push(field);
    };
    TempleAvatarControls.prototype.getFlatViewForwardWorld = function (output) {
        output.copy(this.avatar.pose.viewFacing);
        output.setY(0.0);
        if (output.lengthSq() < 0.0001) {
            output.copy(this.avatar.pose.bodyFacing);
            output.setY(0.0);
        }
        if (output.lengthSq() < 0.0001) {
            output.set(0.0, 0.0, -1.0);
        }
        else {
            output.normalize();
        }
    };
    TempleAvatarControls.prototype.getFlatViewRightWorld = function (output) {
        var forward = this._tvControlForward;
        this.getFlatViewForwardWorld(forward);
        output.copy(forward);
        output.cross(this._tvUp);
        if (output.lengthSq() < 0.0001) {
            output.set(1.0, 0.0, 0.0);
        }
        else {
            output.normalize();
        }
    };
    TempleAvatarControls.prototype.getControlInputWorldFlat = function (control, output) {
        var forward = this._tvControlForward;
        var right = this._tvControlRight;
        this.getFlatViewForwardWorld(forward);
        this.getFlatViewRightWorld(right);
        output.copy(right);
        output.multiplyScalar(control.unitCurrent.x);
        output.addScaledVector(forward, control.unitCurrent.y);
    };
    TempleAvatarControls.prototype.snapWorldVectorToCardinalXZ = function (source, output) {
        var absX = Math.abs(source.x);
        var absZ = Math.abs(source.z);
        if ((absX < 0.0001) && (absZ < 0.0001)) {
            output.set(0.0, 0.0, 0.0);
            return "none";
        }
        if (absX > absZ) {
            output.set(source.x >= 0.0 ? 1.0 : -1.0, 0.0, 0.0);
            return source.x >= 0.0 ? "right" : "left";
        }
        output.set(0.0, 0.0, source.z >= 0.0 ? 1.0 : -1.0);
        return source.z >= 0.0 ? "up" : "down";
    };
    TempleAvatarControls.prototype.getHeldBaseLocalQuaternion = function (held, output) {
        if (this._isRotationAnimating && (this._rotationAnimatedObject === held)) {
            output.copy(this._targetRotationForHeldObject);
        }
        else {
            output.copy(held.quaternion);
        }
    };
    TempleAvatarControls.prototype.getHeldBaseLocalPosition = function (held, output) {
        if (this._isPositionAnimating && (this._positionAnimatedObject === held)) {
            output.copy(this._targetPositionForHeldObject);
        }
        else {
            output.copy(held.position);
        }
    };
    TempleAvatarControls.prototype.convertWorldDeltaToHeldParentLocal = function (held, worldDelta, output) {
        output.copy(worldDelta);
        if (held.parent) {
            held.parent.updateWorldMatrix(true, false);
            held.parent.getWorldQuaternion(this._tq2);
            this._tq2.invert();
            output.applyQuaternion(this._tq2);
        }
    };
    TempleAvatarControls.prototype.computeHeldTargetLocalRotationFromWorldDelta = function (held, worldDeltaQuat, output) {
        var currentLocalQuat = this._tq2;
        var parentWorldQuat = this._tq3;
        var targetWorldQuat = this._tq4;
        this.getHeldBaseLocalQuaternion(held, currentLocalQuat);
        if (held.parent) {
            held.parent.updateWorldMatrix(true, false);
            held.parent.getWorldQuaternion(parentWorldQuat);
        }
        else {
            parentWorldQuat.identity();
        }
        targetWorldQuat.copy(parentWorldQuat);
        targetWorldQuat.multiply(currentLocalQuat);
        targetWorldQuat.premultiply(worldDeltaQuat);
        output.copy(parentWorldQuat);
        output.invert();
        output.multiply(targetWorldQuat);
    };
    TempleAvatarControls.prototype.computeHeldLocalRotationDeltaFromWorldDelta = function (held, worldDeltaQuat, output) {
        var currentLocalQuat = this._tq5;
        var targetLocalQuat = this._tq3;
        this.getHeldBaseLocalQuaternion(held, currentLocalQuat);
        this.computeHeldTargetLocalRotationFromWorldDelta(held, worldDeltaQuat, targetLocalQuat);
        output.copy(currentLocalQuat);
        output.invert();
        output.multiply(targetLocalQuat);
    };
    TempleAvatarControls.prototype.onTimeStepped = function (time) {
        // Apply smooth visual animation to held objects
        this.updateHeldObjectRotationAnimation(time);
        this.updateHeldObjectPositionAnimation(time);
        this.updateVisualSnapAnimations(time);
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
        if (anyDown || this._isRotationAnimating || this._isPositionAnimating || (this._activeVisualSnapFields.length > 0)) {
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
        var _a;
        if (time == null) {
            // start/stop stuff:
            if (control.isStart || control.isEnd) {
                time = this.avatar.world.time;
                time.requestRealtimeForDuration(ControlSettings.aimAnimDuration);
                var oldHeld = this.avatar.focus.held;
                if (control.isEnd) {
                    if (oldHeld) {
                        if (control.isGestureTap) {
                            console.log("Dropping object after tap+rotate:");
                            this.avatar.focus.ensureHeld(null);
                        }
                    }
                    // Reset discrete rotation state when control ends
                    this._lastRotationDirection = "none";
                    this._accumulatedRotationMotion = 0;
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
        // Discrete 90-degree rotation based on stick direction
        var stickX = control.unitCurrent.x;
        var stickY = control.unitCurrent.y;
        var stickMagnitude = Math.sqrt(stickX * stickX + stickY * stickY);
        // Determine current cardinal direction
        var currentDirection = "none";
        if (stickMagnitude > this._discreteRotationThreshold) {
            var absX = Math.abs(stickX);
            var absY = Math.abs(stickY);
            if (absX > absY) {
                currentDirection = stickX > 0 ? "right" : "left";
            }
            else {
                currentDirection = stickY > 0 ? "up" : "down";
            }
        }
        // Reset accumulation on direction change
        if (currentDirection !== this._lastRotationDirection) {
            this._lastRotationDirection = currentDirection;
            this._accumulatedRotationMotion = 0;
        }
        // Accumulate motion and apply rotations as threshold is crossed
        if (currentDirection !== "none") {
            this._accumulatedRotationMotion += stickMagnitude * time.dt;
            // Apply rotations while accumulated motion exceeds threshold
            while (this._accumulatedRotationMotion >= this._rotationMotionPerSnap) {
                this._accumulatedRotationMotion -= this._rotationMotionPerSnap;
                var tq1 = this._tq1;
                var rotationAxis = this._tv1;
                var rotationAngle = this._discreteRotationSnapAngle;
                // Determine rotation axis based on direction
                if (currentDirection === "left" || currentDirection === "right") {
                    // Rotate around Y axis (up/down)
                    rotationAxis.copy(this._tvUp);
                    if (currentDirection === "left") {
                        rotationAngle = -rotationAngle;
                    }
                }
                else {
                    // Rotate around the camera-relative horizontal axis, snapped onto world X/Z.
                    this.getFlatViewRightWorld(rotationAxis);
                    this.snapWorldVectorToCardinalXZ(rotationAxis, rotationAxis);
                    if (currentDirection === "down") {
                        rotationAngle = -rotationAngle;
                    }
                }
                // Create rotation quaternion
                tq1.setFromAxisAngle(rotationAxis, rotationAngle);
                if (held) {
                    var heldField = (_a = held.userData) === null || _a === void 0 ? void 0 : _a.field;
                    if (heldField && heldField.isGridSnappable && typeof heldField.applyRotationDelta === 'function') {
                        var localDeltaQuat = this._tqFacing;
                        this.computeHeldLocalRotationDeltaFromWorldDelta(held, tq1, localDeltaQuat);
                        heldField.applyRotationDelta(localDeltaQuat, time.timeVirtualCurrent);
                        this.ensureVisualSnapFieldTracked(heldField);
                    }
                    else {
                        // Convert the camera-relative world rotation into the held object's local space.
                        var targetLocalQuat = this._tqFacing;
                        this.computeHeldTargetLocalRotationFromWorldDelta(held, tq1, targetLocalQuat);
                        this.startHeldObjectRotationAnimation(held, targetLocalQuat, time.timeVirtualCurrent);
                    }
                }
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
        var _a;
        if (time == null) {
            // start/stop stuff:
            if (control.isStart || control.isEnd) {
                time = this.avatar.world.time;
                time.requestRealtimeForDuration(ControlSettings.aimAnimDuration);
                var oldHeld = this.avatar.focus.held;
                if (control.isEnd) {
                    if (oldHeld) {
                        if (control.isGestureTap) {
                            console.log("Dropping object after tap+push:");
                            this.avatar.focus.ensureHeld(null);
                        }
                    }
                    // Reset discrete push state when control ends
                    this._lastPushDirection = "none";
                    this._accumulatedPushMotion = 0;
                }
            }
            return;
        }
        var held = this.avatar.focus.heldScene();
        if (!held) {
            console.log("No held scene for pushing.");
            return;
        }
        // Discrete push motion based on the camera-relative control direction rotated into world space.
        var controlWorld = this._tv1;
        var snappedWorldDirection = this._tv2;
        this.getControlInputWorldFlat(control, controlWorld);
        var stickMagnitude = controlWorld.length();
        // Determine current cardinal direction
        var currentDirection = "none";
        if (stickMagnitude > this._discretePushThreshold) {
            currentDirection = this.snapWorldVectorToCardinalXZ(controlWorld, snappedWorldDirection);
        }
        else {
            snappedWorldDirection.set(0.0, 0.0, 0.0);
        }
        // Reset accumulation on direction change
        if (currentDirection !== this._lastPushDirection) {
            this._lastPushDirection = currentDirection;
            this._accumulatedPushMotion = 0;
        }
        // Accumulate motion and apply pushes as threshold is crossed
        if (currentDirection !== "none") {
            this._accumulatedPushMotion += stickMagnitude * time.dt;
            // Apply push movements while accumulated motion exceeds threshold
            while (this._accumulatedPushMotion >= this._pushMotionPerSnap) {
                this._accumulatedPushMotion -= this._pushMotionPerSnap;
                var tv1 = this._tv1;
                var tv3 = this._tv3;
                // Step along the snapped world axis that is nearest to the camera-relative input.
                tv1.copy(snappedWorldDirection);
                // Move 1m per snap (fixed discrete increment)
                tv1.multiplyScalar(1.0);
                this.convertWorldDeltaToHeldParentLocal(held, tv1, tv3);
                var heldField = (_a = held.userData) === null || _a === void 0 ? void 0 : _a.field;
                if (heldField && heldField.isGridSnappable && typeof heldField.applyPositionDelta === 'function') {
                    heldField.applyPositionDelta(tv3, isRun, time.timeVirtualCurrent);
                    this.ensureVisualSnapFieldTracked(heldField);
                }
                else {
                    var nextPos = this._tv4;
                    this.getHeldBaseLocalPosition(held, nextPos);
                    nextPos.add(tv3);
                    this.startHeldObjectPositionAnimation(held, nextPos, time.timeVirtualCurrent);
                }
            }
        }
        // TODO: keep avatar looking at the object (probably gradually):
    };
    return TempleAvatarControls;
}());
export { TempleAvatarControls };
