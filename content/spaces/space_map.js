import * as THREE from 'three';
var TempleSpaceMapBuilder = /** @class */ (function () {
    function TempleSpaceMapBuilder(parentScene) {
        this.parentScene = parentScene;
        this.scene = new THREE.Group();
        this.scene.name = "TempleSpaceMap";
        parentScene.add(this.scene);
        var material = new THREE.LineBasicMaterial({ color: 0xccFFcc });
        var points = [];
        this.addMapGrid(points, 1.0);
        var geometry = new THREE.BufferGeometry().setFromPoints(points);
        this.lines = new THREE.Line(geometry, material);
        this.scene.add(this.lines);
    }
    TempleSpaceMapBuilder.prototype.addMapGrid = function (points, radius) {
        if (radius === void 0) { radius = 1.0; }
        var gridShape = [8, 8];
        for (var gy = 1; gy < gridShape[0]; gy++) {
            for (var gx = 1; gx < gridShape[1]; gx++) {
                points.push(new THREE.Vector3(gx - 1, 0, -gy));
                points.push(new THREE.Vector3(gx, 0, -gy));
                points.push(new THREE.Vector3(gx, 0, -gy - 1));
                points.push(new THREE.Vector3(gx - 1, 0, -gy - 1));
            }
        }
    };
    return TempleSpaceMapBuilder;
}());
export { TempleSpaceMapBuilder };
