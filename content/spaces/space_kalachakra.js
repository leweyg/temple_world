var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
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
// Shared floor/corner thickness at the base, in metres (2 feet).
// Both taper proportionally with the pyramid's width at each height.
var TEMPLE_THICKNESS = 2 * 0.3048;
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
        var fourthFloor = floors[3];
        var material = new THREE.MeshStandardMaterial({
            color: 0x99bb99, roughness: 0.85, side: THREE.DoubleSide,
        });
        var baseRadius = TEMPLE_BASE_WIDTH / 2;
        var slope = baseRadius / TEMPLE_HEIGHT;
        floors.forEach(function (floor, index) {
            // Floor 4 remains logical only. Floor 5 is an isolated slab.
            if (floor === fourthFloor)
                return;
            var openingRadius = index === 1 ? topFloor.radius
                : index === 2 ? (fourthFloor.radius + topFloor.radius) / 2 : undefined;
            var thickness = TEMPLE_THICKNESS * floor.radius / baseRadius;
            var bottomHeight = floor.height - thickness;
            // Slabs extend downward, preserving the existing floor elevations.
            // Their outer bevel lies exactly on the pyramid's sloping envelope.
            var top = _this.squareCorners(floor.radius, floor.height);
            var bottom = _this.squareCorners(floor.radius + thickness * slope, bottomHeight);
            var vertices = [];
            _this.joinRings(vertices, bottom, top);
            if (openingRadius !== undefined) {
                // Keep the existing openings clear through the full slab depth.
                var innerTop = _this.squareCorners(openingRadius, floor.height);
                var innerBottom = _this.squareCorners(openingRadius, bottomHeight);
                _this.joinRings(vertices, innerTop, innerBottom);
                _this.joinRings(vertices, top, innerTop);
                _this.joinRings(vertices, innerBottom, bottom);
            }
            else {
                _this.addQuad.apply(_this, __spreadArray([vertices], top, false));
                _this.addQuad.apply(_this, __spreadArray([vertices], bottom, false));
            }
            _this.addSolid(vertices, material, points, "Floor ".concat(index + 1));
        });
        // Four inward-extending corner supports follow the pyramid edges,
        // tapering with the same thickness rule as the floors. Stop at floor 4.
        var cornerRing = function (height, x, z) {
            var radius = baseRadius - (height - TEMPLE_BASE_ELEVATION) * slope;
            var inner = radius - TEMPLE_THICKNESS * radius / baseRadius;
            return [
                new THREE.Vector3(x * radius, height, z * radius),
                new THREE.Vector3(x * inner, height, z * radius),
                new THREE.Vector3(x * inner, height, z * inner),
                new THREE.Vector3(x * radius, height, z * inner),
            ];
        };
        for (var _i = 0, _a = [-1, 1]; _i < _a.length; _i++) {
            var x = _a[_i];
            for (var _b = 0, _c = [-1, 1]; _b < _c.length; _b++) {
                var z = _c[_b];
                var bottom = cornerRing(floors[0].height - TEMPLE_THICKNESS, x, z);
                var top_1 = cornerRing(fourthFloor.height, x, z);
                var vertices = [];
                this.joinRings(vertices, bottom, top_1);
                this.addQuad.apply(this, __spreadArray([vertices], bottom, false));
                this.addQuad.apply(this, __spreadArray([vertices], top_1, false));
                this.addSolid(vertices, material, points, "Corner ".concat(x, ", ").concat(z));
            }
        }
        var geometry = new THREE.BufferGeometry().setFromPoints(points);
        var lineMaterial = new THREE.LineBasicMaterial({ color: 0xccFFcc });
        // Independent segments avoid spurious lines across floors and openings.
        this.lines = new THREE.LineSegments(geometry, lineMaterial);
        this.lines.name = "Temple floors, openings and pyramid edges";
        this.scene.add(this.lines);
    }
    TempleSpaceKalaChakra.prototype.squareCorners = function (radius, height) {
        return [
            new THREE.Vector3(-radius, height, -radius),
            new THREE.Vector3(radius, height, -radius),
            new THREE.Vector3(radius, height, radius),
            new THREE.Vector3(-radius, height, radius),
        ];
    };
    TempleSpaceKalaChakra.prototype.addQuad = function (vertices, a, b, c, d) {
        for (var _i = 0, _a = [a, b, c, a, c, d]; _i < _a.length; _i++) {
            var point = _a[_i];
            vertices.push(point.x, point.y, point.z);
        }
    };
    TempleSpaceKalaChakra.prototype.joinRings = function (vertices, a, b) {
        for (var i = 0; i < 4; i++) {
            var next = (i + 1) % 4;
            this.addQuad(vertices, a[i], a[next], b[next], b[i]);
        }
    };
    TempleSpaceKalaChakra.prototype.addSolid = function (vertices, material, points, name) {
        var geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.computeVertexNormals();
        var mesh = new THREE.Mesh(geometry, material);
        mesh.name = name;
        this.scene.add(mesh);
        var edges = new THREE.EdgesGeometry(geometry);
        var positions = edges.getAttribute('position');
        for (var i = 0; i < positions.count; i++) {
            points.push(new THREE.Vector3().fromBufferAttribute(positions, i));
        }
        edges.dispose();
    };
    return TempleSpaceKalaChakra;
}());
export { TempleSpaceKalaChakra };
