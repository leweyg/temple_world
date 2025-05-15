import * as THREE from 'three';
var TempleSpaceKalaChakra = /** @class */ (function () {
    function TempleSpaceKalaChakra(parentScene) {
        this.parentScene = parentScene;
        this.scene = new THREE.Group();
        this.scene.name = "TempleSpaceKalaChakra";
        this.scene.position.set(0, 0, -14.0);
        parentScene.add(this.scene);
        var material = new THREE.LineBasicMaterial({ color: 0xccFFcc });
        var points = [];
        this.addLayerLines(points, 5.0, 0.0);
        this.addLayerLines(points, 4.0, 2.0);
        this.addLayerLines(points, 3.0, 4.0);
        this.addLayerLines(points, 2.0, 6.0);
        this.addLayerLines(points, 1.0, 8.0);
        var geometry = new THREE.BufferGeometry().setFromPoints(points);
        this.lines = new THREE.Line(geometry, material);
        this.scene.add(this.lines);
    }
    TempleSpaceKalaChakra.prototype.addLayerLines = function (points, radius, height) {
        if (radius === void 0) { radius = 1.0; }
        if (height === void 0) { height = 0.0; }
        points.push(new THREE.Vector3(0, height, 0));
        points.push(new THREE.Vector3(radius, height, 0));
        points.push(new THREE.Vector3(radius, height, radius));
        points.push(new THREE.Vector3(radius, height, -radius));
        points.push(new THREE.Vector3(-radius, height, -radius));
        points.push(new THREE.Vector3(-radius, height, radius));
        points.push(new THREE.Vector3(radius, height, radius));
        points.push(new THREE.Vector3(radius, height, 0));
        points.push(new THREE.Vector3(0, height, 0));
    };
    return TempleSpaceKalaChakra;
}());
export { TempleSpaceKalaChakra };
