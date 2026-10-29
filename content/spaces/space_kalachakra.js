import * as THREE from 'three';
// Original Great Pyramid dimensions, in world units (approximately metres).
// https://www.usna.edu/Users/math/meh/_files/documents/pyr.pdf
var GOLDEN_RATIO_INVERSE = (Math.sqrt(5) - 1) / 2;
// Tune overall size here: 1 = full size, 1/phi = 61.8%, 1/phi² = 38.2%.
// Width, height, floors and openings scale together; entrance clearance stays fixed.
var TEMPLE_SCALE = 0.15; // GOLDEN_RATIO_INVERSE  * GOLDEN_RATIO_INVERSE * GOLDEN_RATIO_INVERSE;
var TEMPLE_BASE_WIDTH = 230.3 * TEMPLE_SCALE;
var TEMPLE_HEIGHT = 146.6 * TEMPLE_SCALE;
var TEMPLE_BASE_ELEVATION = 0.2;
var R = GOLDEN_RATIO_INVERSE;
// Floors are numbered from the entrance (1). Floor 3 is at 61.8% of
// the base-to-tip height; floor 2 is 61.8% of that. Above floor 3,
// subdivide the remaining height by the same ratio, leaving a pointed roof.
var TEMPLE_FLOOR_FRACTIONS = [0, R * R, R, 1 - Math.pow(R, 3), 1 - Math.pow(R, 4)];
var TempleSpaceKalaChakra = /** @class */ (function () {
    function TempleSpaceKalaChakra(parentScene) {
        var _this = this;
        this.parentScene = parentScene;
        this.scene = new THREE.Group();
        this.scene.name = "TempleSpaceKalaChakra";
        // Preserve the old entrance edge at z = -9 as the footprint grows.
        this.scene.position.set(0, 0, -9 - TEMPLE_BASE_WIDTH / 2);
        parentScene.add(this.scene);
        var points = [];
        var floors = TEMPLE_FLOOR_FRACTIONS.map(function (fraction) { return ({
            height: TEMPLE_BASE_ELEVATION + fraction * TEMPLE_HEIGHT,
            radius: TEMPLE_BASE_WIDTH * (1 - fraction) / 2,
        }); });
        floors.forEach(function (floor, index) {
            _this.addSquareLines(points, floor.radius, floor.height);
            // Floor 1 is an uninterrupted flat outline. Only floors 2 and 3
            // have openings: vertical projections of floors 5 and 4 respectively.
            var openingFloor = index === 1 ? floors[4] : index === 2 ? floors[3] : undefined;
            if (openingFloor) {
                _this.addSquareLines(points, openingFloor.radius, floor.height);
            }
        });
        // Four straight hip edges establish the Giza silhouette and its tip.
        var apex = new THREE.Vector3(0, TEMPLE_BASE_ELEVATION + TEMPLE_HEIGHT, 0);
        for (var _i = 0, _a = [-1, 1]; _i < _a.length; _i++) {
            var x = _a[_i];
            for (var _b = 0, _c = [-1, 1]; _b < _c.length; _b++) {
                var z = _c[_b];
                points.push(new THREE.Vector3(x * floors[0].radius, floors[0].height, z * floors[0].radius), apex.clone());
            }
        }
        var geometry = new THREE.BufferGeometry().setFromPoints(points);
        var material = new THREE.LineBasicMaterial({ color: 0xccFFcc });
        // Independent segments avoid spurious lines across floors and openings.
        this.lines = new THREE.LineSegments(geometry, material);
        this.lines.name = "Temple floors, openings and pyramid edges";
        this.scene.add(this.lines);
    }
    TempleSpaceKalaChakra.prototype.addSquareLines = function (points, radius, height) {
        var corners = [
            new THREE.Vector3(-radius, height, -radius),
            new THREE.Vector3(radius, height, -radius),
            new THREE.Vector3(radius, height, radius),
            new THREE.Vector3(-radius, height, radius),
        ];
        for (var i = 0; i < corners.length; i++) {
            points.push(corners[i], corners[(i + 1) % corners.length]);
        }
    };
    return TempleSpaceKalaChakra;
}());
export { TempleSpaceKalaChakra };
