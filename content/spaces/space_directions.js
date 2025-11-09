import * as THREE from 'three';
var TempleSpaceDirectionsBuilder = /** @class */ (function () {
    function TempleSpaceDirectionsBuilder(parentScene) {
        this.parentScene = parentScene;
        this.scene = new THREE.Group();
        this.scene.name = "TempleSpaceDirections";
        parentScene.add(this.scene);
        var material = new THREE.LineBasicMaterial({ color: 0xccFFcc });
        var points = [];
        this.addDirectionLines(points, 1.0);
        this.addDirectionLines(points, 3.0);
        var geometry = new THREE.BufferGeometry().setFromPoints(points);
        this.lines = new THREE.Line(geometry, material);
        this.scene.add(this.lines);
        this.lines.visible = false;
    }
    TempleSpaceDirectionsBuilder.prototype.addDirectionLines = function (points, radius) {
        if (radius === void 0) { radius = 1.0; }
        points.push(new THREE.Vector3(0, 0, 0));
        points.push(new THREE.Vector3(radius, 0, 0));
        points.push(new THREE.Vector3(0, 0, radius));
        points.push(new THREE.Vector3(-radius, 0, 0));
        points.push(new THREE.Vector3(0, 0, -radius));
    };
    return TempleSpaceDirectionsBuilder;
}());
export { TempleSpaceDirectionsBuilder };
