import * as THREE from 'three';
var TempleAvatarBodyPart = /** @class */ (function () {
    function TempleAvatarBodyPart(scene) {
        this.scene = scene;
        this.isBodyPart = true;
        this.isBodyPart = true;
        this.initialPos = this.scene.position.clone();
    }
    return TempleAvatarBodyPart;
}());
var TempleAvatarBody = /** @class */ (function () {
    function TempleAvatarBody(parentScene) {
        this.isAvatarBody = true;
        this.primary = [];
        this.hands = [];
        this.scene = new THREE.Group();
        this.scene.name = "TempleAvatarBody";
        parentScene.add(this.scene);
        var radius = 1.0 / 6.0;
        var seg_around = 32;
        var seg_height = 15;
        var geometry = new THREE.SphereGeometry(radius, seg_around, seg_height);
        var material = new THREE.MeshToonMaterial({ color: 0x00FF00 });
        this.primary = [];
        for (var i = 0; i < 3; i++) {
            var sphere = new THREE.Mesh(geometry, material);
            sphere.position.setY(radius * (1.0 + (i * 2.0)));
            this.scene.add(sphere);
            var part = new TempleAvatarBodyPart(sphere);
            this.primary.push(part);
        }
        this.hands = [];
        for (var i = 0; i < 2; i++) {
            var iSign = (i - 0.5) * 2.0;
            var sphere = new THREE.Mesh(geometry, material);
            sphere.position.setY(radius * 4.0);
            sphere.position.setX(radius * 2.0 * iSign);
            this.scene.add(sphere);
            var part = new TempleAvatarBodyPart(sphere);
            this.hands.push(part);
        }
    }
    return TempleAvatarBody;
}());
export { TempleAvatarBody };
