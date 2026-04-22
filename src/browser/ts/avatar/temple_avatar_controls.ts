
import * as THREE from 'three';
import { ControllerGroup, ControllerMode, ControllerPhase, ControllerStream } from '../controls/temple_controls.js';
import { TempleAvatar } from './temple_avatar.js';
import { TempleTime } from '../temple_time.js';
import { TempleControlsOverlay } from './temple_controls_overlay.js'

class ControlSettings {
    static lookRateUpDown = 0.5
    static lookRateSide = 0.5
    static lookRateAimScalar = 0.25
    static aimZoomScalar = 0.61
    static aimRotatingScalar = 1.1
    static aimAnimDuration = 2.0;

    static speedWalk = 1.0;
    static speedRun = 3.0;
};

class TempleAvatarControls {
    avatar : TempleAvatar;
    controlGroup : ControllerGroup;
    overlay : TempleControlsOverlay;
    isTempleAvatarControls : boolean = true;
    isDevMode = false;
    isDevModeChanged = false;
    controlSpace : THREE.Object3D;
    controlSpaceFly : THREE.Object3D;

    _tq1 = new THREE.Quaternion();
    _tv1 = new THREE.Vector3();
    _tv2 = new THREE.Vector3();
    _tv3 = new THREE.Vector3();
    _tvFacing = new THREE.Vector3();
    _tqFacing = new THREE.Quaternion();
    _tqFlatFacing = new THREE.Quaternion();
    _tvUp = new THREE.Vector3(0,1.0,0);
    _tvAcross = new THREE.Vector3(1.0,0,0);
    _tm1 = new THREE.Matrix4();
    _te1 = new THREE.Euler();
    
    // Discrete rotation state
    _lastRotationDirection : string = "none";
    _discreteRotationThreshold : number = 0.5;
    _discreteRotationSnapAngle : number = Math.PI / 2; // 90 degrees
    _accumulatedRotationMotion : number = 0; // Accumulates motion to trigger next rotation
    _rotationMotionPerSnap : number = 0.5; // Distance needed to trigger another snap
    
    // Smooth rotation animation
    _targetRotationForHeldObject : THREE.Quaternion = new THREE.Quaternion();
    _rotationAnimStartTime : number = 0;
    _rotationAnimDuration : number = 0.15; // Duration of smooth rotation snap in seconds
    _isRotationAnimating : boolean = false;
    _rotationAnimStartQuat : THREE.Quaternion = new THREE.Quaternion();
    
    // Discrete push state (for push object)
    _lastPushDirection : string = "none";
    _discretePushThreshold : number = 0.3;
    _accumulatedPushMotion : number = 0;
    _pushMotionPerSnap : number = 0.4; // Distance needed to trigger push movement (1m increments)
    
    constructor(avatar:TempleAvatar, controlGroup:ControllerGroup) {
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
        this.controlGroup.listenControllerEvent((c) => {
            _this.onControllerEvent(c);
        });

        var _this = this;
        this.avatar.world.time.listenToTime((time) => {
            _this.onTimeStepped(time);
        });
    }

    updateHeldObjectRotationAnimation(time:TempleTime) {
        if (!this._isRotationAnimating) {
            return;
        }
        
        const held = this.avatar.focus.heldScene();
        if (!held) {
            this._isRotationAnimating = false;
            return;
        }
        
        const elapsedTime = time.timeVirtualCurrent - this._rotationAnimStartTime;
        if (elapsedTime >= this._rotationAnimDuration) {
            // Animation complete
            held.quaternion.copy(this._targetRotationForHeldObject);
            this._isRotationAnimating = false;
        } else {
            // Interpolate between start and target
            const t = elapsedTime / this._rotationAnimDuration;
            const smoothT = t * t * (3.0 - 2.0 * t); // Smoothstep interpolation
            const result = new THREE.Quaternion();
            result.copy(this._rotationAnimStartQuat);
            result.slerp(this._targetRotationForHeldObject, smoothT);
            held.quaternion.copy(result);
        }
    }

    onTimeStepped(time:TempleTime) {
        // Apply smooth rotation animation to held object
        this.updateHeldObjectRotationAnimation(time);
        
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
    }

    onControllerEvent(control:ControllerStream) {
        // do processing here
        //if ((!control.isDown) && (!control.isEnd)) return;

        var nextMode = control.mode;
        if (control.isStart && !control.isButton) {
            console.assert(control.mode == ControllerMode.None);
            const halfRangeX = control.rawRange.x * 0.5;
            const halfRangeY = control.rawRange.y * 0.5;
            const isTopY = (control.rawInitial.y < halfRangeY);
            const isMoveSide = (control.rawInitial.x < halfRangeX);
            const isHoldingObject = this.avatar.focus.heldScene();
            if (isMoveSide) {
                if (isTopY) {
                    if (isHoldingObject) {
                        control.changeMode( ControllerMode.PushingObject );
                    } else {
                        control.changeMode( ControllerMode.Run );
                    }
                } else {
                    control.mode = ControllerMode.Walk;
                }
            } else {
                if (isTopY) {
                    if (isHoldingObject) {
                        control.changeMode( ControllerMode.RotatingObject );
                    } else {
                        control.mode = ControllerMode.Aim;
                    }
                } else {
                    control.mode = ControllerMode.Look;
                }
            }
        } else if (control.isStart && control.isButton) {
            control.mode = ControllerMode.DevMenu;
        }
        if (control.isStart || control.isEnd) {
            //console.log("ControlMode='" + control.mode + "' go=" + control.isStart);
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
        } else if (control.mode == ControllerMode.RotatingObject) {
            this.onUseControl_RotatingObject(control, time, true);
        } else if (control.mode == ControllerMode.PushingObject) {
            this.onUseControl_PushObject(control, time, false);
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
        const tv3 = this._tv3;
        const tm1 = this._tm1;
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
    }


    onUseControl_LookOrAim(control:ControllerStream, time:TempleTime|null, isAim:boolean) {
        if (time == null) {
            
            // start/stop stuff:
            if (isAim && (control.isStart || control.isEnd)) {
                time = this.avatar.world.time;
                time.requestRealtimeForDuration(ControlSettings.aimAnimDuration);


                const oldHeld = this.avatar.focus.held;
                if (control.isEnd) {
                    console.log("Aim end...");
                    if (oldHeld) {
                        if (control.isGestureDrag) {
                            console.log("Hold was held due to drag.");
                            // was holding, still holding
                        } else {
                            const centered = this.avatar.view.latestCenterField();
                            const newHeld = null;
                            this.avatar.focus.ensureFocus(newHeld, centered);
                        }
                    } else {
                        console.log("IsDrag=" + control.isGestureDrag);
                        const centered = this.avatar.view.latestCenterField();
                        const newHeld = oldHeld ? null : centered;
                        this.avatar.focus.ensureFocus(newHeld, centered);
                    }
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


    onUseControl_RotatingObject(control:ControllerStream, time:TempleTime|null, isAim:boolean) {
        if (time == null) {
            
            // start/stop stuff:
            if (control.isStart || control.isEnd) {
                time = this.avatar.world.time;
                time.requestRealtimeForDuration(ControlSettings.aimAnimDuration);

                const oldHeld = this.avatar.focus.held;
                if (control.isEnd) {
                    if (oldHeld) {
                        if (control.isGestureTap) {
                            console.log("Dropping object after tap+rotate:")
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

        const held = this.avatar.focus.heldScene();
        if (!held) {
            console.log("No held scene for rotating.");
            return;
        }

        this.avatar.pose.viewFovScale = isAim ? ControlSettings.aimRotatingScalar : 1.0;

        // Discrete 90-degree rotation based on stick direction
        const stickX = control.unitCurrent.x;
        const stickY = control.unitCurrent.y;
        const stickMagnitude = Math.sqrt(stickX * stickX + stickY * stickY);

        // Determine current cardinal direction
        let currentDirection = "none";
        if (stickMagnitude > this._discreteRotationThreshold) {
            const absX = Math.abs(stickX);
            const absY = Math.abs(stickY);
            
            if (absX > absY) {
                currentDirection = stickX > 0 ? "right" : "left";
            } else {
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
                
                const tq1 = this._tq1;
                let rotationAxis = this._tv1;
                let rotationAngle = this._discreteRotationSnapAngle;

                // Determine rotation axis based on direction
                if (currentDirection === "left" || currentDirection === "right") {
                    // Rotate around Y axis (up/down)
                    rotationAxis.copy(this._tvUp);
                    if (currentDirection === "left") {
                        rotationAngle = -rotationAngle;
                    }
                } else {
                    // Rotate around X axis (side to side in world space)
                    rotationAxis.copy(this._tvAcross);
                    this.controlSpace.localToWorld(rotationAxis);
                    if (currentDirection === "down") {
                        rotationAngle = -rotationAngle;
                    }
                }

                // Create rotation quaternion
                tq1.setFromAxisAngle(rotationAxis, rotationAngle);
                
                if (held) {
                    const heldField = held.userData?.field;
                    if (heldField && heldField.isGridSnappable && typeof heldField.applyRotationDelta === 'function') {
                        heldField.applyRotationDelta(tq1);
                    } else {
                        // Compute new target rotation: start with current held quaternion and apply snap
                        const tempQuat = new THREE.Quaternion();
                        tempQuat.copy(held.quaternion);
                        tempQuat.multiply(tq1);
                        
                        // Start animation if not already animating
                        if (!this._isRotationAnimating) {
                            this._rotationAnimStartQuat.copy(held.quaternion);
                            this._rotationAnimStartTime = this.avatar.world.time.timeVirtualCurrent;
                            this._isRotationAnimating = true;
                        } else {
                            // If already animating, restart from current position for smooth continuation
                            this._rotationAnimStartQuat.copy(held.quaternion);
                            this._rotationAnimStartTime = this.avatar.world.time.timeVirtualCurrent;
                        }
                        
                        this._targetRotationForHeldObject.copy(tempQuat);
                    }
                }
            }
        }
    }

    projectRotationOntoDominantAxis(deltaQuat: THREE.Quaternion, outputQuat: THREE.Quaternion) {
        const q = deltaQuat;
        const qw = Math.max(-1.0, Math.min(1.0, q.w));
        const angle = 2.0 * Math.acos(qw);
        if (angle === 0.0) {
            outputQuat.identity();
            return;
        }

        const s = Math.sqrt(1.0 - qw * qw);
        const axis = this._tv1;
        if (s < 0.0001) {
            axis.set(1.0, 0.0, 0.0);
        } else {
            axis.set(q.x / s, q.y / s, q.z / s);
        }

        const absX = Math.abs(axis.x);
        const absY = Math.abs(axis.y);
        const absZ = Math.abs(axis.z);
        if (absY >= absX && absY >= absZ) {
            axis.set(0.0, axis.y < 0.0 ? -1.0 : 1.0, 0.0);
        } else if (absZ >= absX && absZ >= absY) {
            axis.set(0.0, 0.0, axis.z < 0.0 ? -1.0 : 1.0);
        } else {
            axis.set(axis.x < 0.0 ? -1.0 : 1.0, 0.0, 0.0);
        }

        outputQuat.setFromAxisAngle(axis, angle);
    }


    onUseControl_PushObject(control:ControllerStream, time:TempleTime|null, isRun:boolean) {
        if (time == null) {
            
            // start/stop stuff:
            if (control.isStart || control.isEnd) {
                time = this.avatar.world.time;
                time.requestRealtimeForDuration(ControlSettings.aimAnimDuration);

                const oldHeld = this.avatar.focus.held;
                if (control.isEnd) {
                    if (oldHeld) {
                        if (control.isGestureTap) {
                            console.log("Dropping object after tap+push:")
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

        const held = this.avatar.focus.heldScene();
        if (!held) {
            console.log("No held scene for pushing.");
            return;
        }

        // Discrete push motion based on stick direction
        const stickX = control.unitCurrent.x;
        const stickY = control.unitCurrent.y;
        const stickMagnitude = Math.sqrt(stickX * stickX + stickY * stickY);

        // Determine current cardinal direction
        let currentDirection = "none";
        if (stickMagnitude > this._discretePushThreshold) {
            const absX = Math.abs(stickX);
            const absY = Math.abs(stickY);
            
            if (absX > absY) {
                currentDirection = stickX > 0 ? "right" : "left";
            } else {
                currentDirection = stickY > 0 ? "up" : "down";
            }
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
                
                const tv1 = this._tv1;
                const tv3 = this._tv3;
                const tm1 = this._tm1;
                
                // Calculate push direction based on current direction
                tv1.set(0, 0, 0);
                if (currentDirection === "right") {
                    tv1.x = 1;
                } else if (currentDirection === "left") {
                    tv1.x = -1;
                } else if (currentDirection === "up") {
                    tv1.y = 0;
                    tv1.z = 1;
                } else if (currentDirection === "down") {
                    tv1.y = 0;
                    tv1.z = -1;
                }
                
                const localToControl = this.controlSpace;
                localToControl.localToWorld(tv1);
                tv1.normalize();
                
                // Move 1m per snap (fixed discrete increment)
                tv1.multiplyScalar(1.0);

                tv3.copy(tv1);
                if (held.parent) {
                    tm1.extractRotation(held.parent.matrixWorld).invert();
                    tv3.applyMatrix4(tm1);
                }

                const heldField = held.userData?.field;
                if (heldField && heldField.isGridSnappable && typeof heldField.applyPositionDelta === 'function') {
                    heldField.applyPositionDelta(tv3, isRun);
                } else {
                    held.position.add(tv3);
                }
            }
        }

        // TODO: keep avatar looking at the object (probably gradually):
    }
}

export { TempleAvatarControls };

