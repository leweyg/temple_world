import * as THREE from 'three';
var TempleAvatarReticle = /** @class */ (function () {
    function TempleAvatarReticle(avatar, cameraThree) {
        this.avatar = avatar;
        this.cameraZBack = -1.5;
        this.radius = 0.01;
        //this.avatar = avatar;
        this.scene = new THREE.Group();
        this.scene.name = "TempleAvatarReticle";
        var parentScene = cameraThree;
        parentScene.add(this.scene);
        this.cameraZBack = -1.5;
        this.radius = 0.01;
        var material = new THREE.LineBasicMaterial({
            color: 0xccFFcc, transparent: true,
            opacity: 0.5
        });
        var points = [];
        this.addDirectionLines(points, this.radius);
        var geometry = new THREE.BufferGeometry().setFromPoints(points);
        this.lines = new THREE.Line(geometry, material);
        this.scene.add(this.lines);
        this.scene.position.set(0, 0, this.cameraZBack);
    }
    TempleAvatarReticle.prototype.addDirectionLines = function (points, radius) {
        if (radius === void 0) { radius = 1.0; }
        points.push(new THREE.Vector3(0, 0, 0));
        points.push(new THREE.Vector3(radius, 0, 0));
        points.push(new THREE.Vector3(0, 0, 0));
        points.push(new THREE.Vector3(0, -radius, 0));
    };
    return TempleAvatarReticle;
}());
;
export { TempleAvatarReticle };
