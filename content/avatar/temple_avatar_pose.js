import * as THREE from 'three';
var TempleAvatarPose = /** @class */ (function () {
    function TempleAvatarPose(avatar) {
        this.avatar = avatar;
        this.bodyPos = new THREE.Vector3();
        this.bodyFacing = new THREE.Vector3(0, 0, -1);
        this.viewOffset = new THREE.Vector3(0, 2.0, 0);
        this.viewFacing = new THREE.Vector3(0, -0.25, -1.0);
        this.viewDistanceBase = 7.0;
        this.viewDistanceAdjusted = this.viewDistanceBase;
        this.viewFovScale = 1.0;
        this.viewFovBase = 40;
        this.viewFovRate = 12.5;
        this._cv1 = new THREE.Vector3();
        this._tv1 = new THREE.Vector3();
        this._tv2 = new THREE.Vector3();
        this._tvZero = new THREE.Vector3();
        this._tvUp = new THREE.Vector3(0, 1.0, 0);
        this._tq1 = new THREE.Quaternion();
        this._tm1 = new THREE.Matrix4();
        this.viewFacing.normalize();
    }
    TempleAvatarPose.prototype.applyToAvatarAll = function (time) {
        this.applyToBody(time);
        this.applyToControlSpace(time);
        this.applyToCamera(time);
    };
    TempleAvatarPose.prototype.applyToBody = function (time) {
        var to = this.avatar.scene;
        to.position.copy(this.bodyPos);
        this.applyFacingAsRotation(to, this.bodyFacing);
    };
    TempleAvatarPose.prototype.applyToControlSpace = function (time) {
        var facing = this._cv1;
        facing.copy(this.viewFacing);
        facing.normalize();
        var controlSpaceFly = this.avatar.controls.controlSpaceFly;
        this.applyFacingAsRotation(controlSpaceFly, facing);
        controlSpaceFly.position.set(0, 0, 0);
        facing.setY(0.0);
        facing.normalize();
        var controlSpace = this.avatar.controls.controlSpace;
        this.applyFacingAsRotation(controlSpace, facing);
        controlSpace.position.set(0, 0, 0);
    };
    TempleAvatarPose.prototype.applyToCamera = function (time) {
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
        var nextFov = this.viewFovBase * this.viewFovScale;
        var camRaw = camScene;
        camRaw.fov = time.fadeFloatRealTime(camRaw.fov, nextFov, this.viewFovRate);
        camRaw.updateProjectionMatrix();
        view.postCameraMoved();
    };
    TempleAvatarPose.prototype.applyFacingAsRotation = function (scene, facing) {
        this._tm1.lookAt(this._tvZero, facing, this._tvUp);
        this._tq1.setFromRotationMatrix(this._tm1);
        scene.quaternion.copy(this._tq1);
    };
    TempleAvatarPose.prototype.adjustCameraForViewFacing = function () {
        var dist = this.viewDistanceBase;
        var viewY = this.viewFacing.y;
        if (viewY >= 0.0) {
            // looking up:
            dist *= Math.sqrt(1.0 - viewY);
        }
        else {
            dist *= 1.0;
        }
        this.viewDistanceAdjusted = dist;
    };
    return TempleAvatarPose;
}());
export { TempleAvatarPose };
