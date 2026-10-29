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
// Floors are numbered from the entrance (1), evenly spaced in height.
// Leave one equal interval above floor 5 for the logical, undrawn roof tip.
var TEMPLE_FLOOR_FRACTIONS = [0, 0.2, 0.4, 0.6, 0.8];
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
        var topFloor = floors[floors.length - 1];
        floors.forEach(function (floor, index) {
            // Retain floor 5 for openings and edge endpoints, but hide its outline.
            if (floor !== topFloor) {
                _this.addSquareLines(points, floor.radius, floor.height);
            }
            // Floor 2's opening projects floor 5. Floor 3's opening is halfway
            // between that projection and floor 4's outline in radius.
            var openingRadius = index === 1 ? topFloor.radius
                : index === 2 ? (floors[3].radius + topFloor.radius) / 2 : undefined;
            if (openingRadius !== undefined) {
                _this.addSquareLines(points, openingRadius, floor.height);
            }
        });
        // Keep the sloping edges up to floor 5; omit their extensions to the tip.
        for (var _i = 0, _a = [-1, 1]; _i < _a.length; _i++) {
            var x = _a[_i];
            for (var _b = 0, _c = [-1, 1]; _b < _c.length; _b++) {
                var z = _c[_b];
                points.push(new THREE.Vector3(x * floors[0].radius, floors[0].height, z * floors[0].radius), new THREE.Vector3(x * topFloor.radius, topFloor.height, z * topFloor.radius));
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
