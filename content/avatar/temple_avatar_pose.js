
import * as THREE from 'three';

class TempleAvatarPose {

    constructor(avatar) {
        this.avatar = avatar;

        this.bodyPos = new THREE.Vector3();
        this.bodyFacing = new THREE.Vector3(0,0,-1);

        this.viewOffset = new THREE.Vector3(0,2.0,0);
        this.viewFacing = new THREE.Vector3(0,-0.25,-1.0);
        this.viewFacing.normalize();
        this.viewDistanceBase = 7.0;
        this.viewDistanceAdjusted = this.viewDistanceBase;

        this.viewZoomScale = 1.0;
    }

    applyToAvatar() {
        const to = this.avatar.scene;
        to.position.copy(this.bodyPos);
        this.applyFacingAsRotation(to, this.bodyFacing);
    }

    _tv1 = new THREE.Vector3();
    _tv2 = new THREE.Vector3();
    applyToCamera() {
        var camPos = this._tv1;
        var extra = this._tv2;

        camPos.copy(this.bodyPos);
        camPos.add(this.viewOffset);
        extra.copy(this.viewFacing);
        extra.normalize();
        extra.multiplyScalar(-this.viewDistanceAdjusted);
        camPos.add(extra);

        var camScene = this.avatar.view.cameraThree;
        camScene.position.copy(camPos);
        this.applyFacingAsRotation(camScene, this.viewFacing);
    }

    _tvZero = new THREE.Vector3();
    _tvUp = new THREE.Vector3(0,1.0,0);
    _tq1 = new THREE.Quaternion();
    _tm1 = new THREE.Matrix4();
    applyFacingAsRotation(scene, facing) {
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
