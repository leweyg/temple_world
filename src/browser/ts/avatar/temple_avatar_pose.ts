
import * as THREE from 'three';
import { TempleTime } from '../temple_time';
import { TempleAvatar } from './temple_avatar';

class TempleAvatarPose {
    bodyPos = new THREE.Vector3();
    bodyFacing = new THREE.Vector3(0,0,-1);
    viewOffset = new THREE.Vector3(0,2.0,0);
    viewFacing = new THREE.Vector3(0,-0.25,-1.0);
    viewDistanceBase = 7.0;
    viewDistanceAdjusted = this.viewDistanceBase;
    viewFovScale = 1.0;
    viewFovBase = 40;
    viewFovRate = 12.5;

    constructor(public avatar : TempleAvatar) {
        this.viewFacing.normalize();
    }

    applyToAvatarAll(time:TempleTime) {
        this.applyToBody(time);
        this.applyToControlSpace(time);
        this.applyToCamera(time);
    }

    applyToBody(time:TempleTime) {
        const to = this.avatar.scene;
        to.position.copy(this.bodyPos);
        this.applyFacingAsRotation(to, this.bodyFacing);
    }

    _cv1 = new THREE.Vector3();
    applyToControlSpace(time:TempleTime) {
        var facing = this._cv1;
        facing.copy(this.viewFacing);

        facing.normalize();
        const controlSpaceFly = this.avatar.controls.controlSpaceFly;
        this.applyFacingAsRotation(controlSpaceFly, facing);
        controlSpaceFly.position.set(0,0,0);

        facing.setY(0.0);
        facing.normalize();
        const controlSpace = this.avatar.controls.controlSpace;
        this.applyFacingAsRotation(controlSpace, facing);
        controlSpace.position.set(0,0,0);
    }

    _tv1 = new THREE.Vector3();
    _tv2 = new THREE.Vector3();
    applyToCamera(time:TempleTime) {
        var camPos = this._tv1;
        var extra = this._tv2;

        camPos.copy(this.bodyPos);
        camPos.add(this.viewOffset);
        extra.copy(this.viewFacing);
        extra.normalize();
        extra.multiplyScalar(-this.viewDistanceAdjusted);
        camPos.add(extra);

        var view = this.avatar.view;
        var camScene = view.cameraThree;
        camScene.position.copy(camPos);
        this.applyFacingAsRotation(camScene, this.viewFacing);

        const nextFov = this.viewFovBase * this.viewFovScale;
        const camRaw = camScene as any;
        camRaw.fov = time.fadeFloatRealTime( camRaw.fov, nextFov, this.viewFovRate );
        camRaw.updateProjectionMatrix();

        view.postCameraMoved();
    }

    _tvZero = new THREE.Vector3();
    _tvUp = new THREE.Vector3(0,1.0,0);
    _tq1 = new THREE.Quaternion();
    _tm1 = new THREE.Matrix4();
    applyFacingAsRotation(scene:THREE.Object3D, facing:THREE.Vector3) {
        this._tm1.lookAt(this._tvZero, facing, this._tvUp);
        this._tq1.setFromRotationMatrix(this._tm1);
        scene.quaternion.copy(this._tq1);
    }

    adjustCameraForViewFacing() {
        var dist = this.viewDistanceBase;
        const viewY = this.viewFacing.y;
        if (viewY >= 0.0) {
            // looking up:
            dist *= Math.sqrt(1.0 - viewY);
        } else {
            dist *= 1.0;
        }
        this.viewDistanceAdjusted = dist;
    }

}

export { TempleAvatarPose };
