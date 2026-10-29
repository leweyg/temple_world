import * as THREE from 'three';
import { ResourceTree } from '../code/resource_tree.js';

// Original Great Pyramid dimensions, in world units (approximately metres).
// https://www.usna.edu/Users/math/meh/_files/documents/pyr.pdf
const GOLDEN_RATIO_INVERSE = (Math.sqrt(5) - 1) / 2;
// Tune overall size here: 1 = full size, 1/phi = 61.8%, 1/phi² = 38.2%.
// Width, height, floors and openings scale together; entrance clearance stays fixed.
const TEMPLE_SCALE = 0.15; // GOLDEN_RATIO_INVERSE  * GOLDEN_RATIO_INVERSE * GOLDEN_RATIO_INVERSE;
const TEMPLE_BASE_WIDTH = 230.3 * TEMPLE_SCALE;
const TEMPLE_HEIGHT = 146.6 * TEMPLE_SCALE;
const TEMPLE_BASE_ELEVATION = 0.2;
// Shared floor/corner thickness at the base, in metres (2 feet).
// Both taper proportionally with the pyramid's width at each height.
const TEMPLE_THICKNESS = 2 * 0.3048;
// Wall depth toward the center, independent of its perpendicular thickness.
const TEMPLE_CORNER_DEPTH_FRACTION = 3 / 16;
// Metres per full texture repeat, and adjustable normal-map relief strength.
const TEMPLE_NORMAL_TILE_SIZE = 1;
const TEMPLE_NORMAL_STRENGTH = 1;

// Floors are numbered from the entrance (1), evenly spaced in height.
// Leave one equal interval above floor 5 for the logical, undrawn roof tip.
const TEMPLE_FLOOR_FRACTIONS = [0, 0.2, 0.4, 0.6, 0.8];

class TempleSpaceKalaChakra {
    parentScene: THREE.Object3D;
    scene: THREE.Object3D;
    lines: THREE.LineSegments;

    constructor(parentScene: THREE.Object3D) {
        this.parentScene = parentScene;
        this.scene = new THREE.Group();
        this.scene.name = "TempleSpaceKalaChakra";
        // Preserve the old entrance edge at z = -9 as the footprint grows.
        this.scene.position.set(0, 0, -9 - TEMPLE_BASE_WIDTH / 2);
        parentScene.add(this.scene);

        const points: THREE.Vector3[] = [];
        const floors = TEMPLE_FLOOR_FRACTIONS.map(fraction => ({
            height: TEMPLE_BASE_ELEVATION + fraction * TEMPLE_HEIGHT,
            radius: TEMPLE_BASE_WIDTH * (1 - fraction) / 2,
        }));

        const topFloor = floors[floors.length - 1];
        const fourthFloor = floors[3];
        const normalMap = new THREE.TextureLoader().load(
            'content/images/double_dorje_tiled_normals.jpg',
            () => ResourceTree.RequestUpdate(),
        );
        normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
        normalMap.colorSpace = THREE.NoColorSpace;
        const material = new THREE.MeshStandardMaterial({
            color: 0x99bb99, roughness: 0.85, side: THREE.DoubleSide,
            normalMap,
            normalScale: new THREE.Vector2(TEMPLE_NORMAL_STRENGTH, TEMPLE_NORMAL_STRENGTH),
        });
        const baseRadius = TEMPLE_BASE_WIDTH / 2;
        const slope = baseRadius / TEMPLE_HEIGHT;
        floors.forEach((floor, index) => {
            // Floor 4 remains logical only. Floor 5 is an isolated slab.
            if (floor === fourthFloor) return;
            const openingRadius = index === 1 ? topFloor.radius
                : index === 2 ? (fourthFloor.radius + topFloor.radius) / 2 : undefined;
            const thickness = TEMPLE_THICKNESS * floor.radius / baseRadius;
            const bottomHeight = floor.height - thickness;
            // Slabs extend downward, preserving the existing floor elevations.
            // Their outer bevel lies exactly on the pyramid's sloping envelope.
            const top = this.squareCorners(floor.radius, floor.height);
            const bottom = this.squareCorners(floor.radius + thickness * slope, bottomHeight);
            const vertices: number[] = [];
            this.joinRings(vertices, bottom, top);
            if (openingRadius !== undefined) {
                // Keep the existing openings clear through the full slab depth.
                const innerTop = this.squareCorners(openingRadius, floor.height);
                const innerBottom = this.squareCorners(openingRadius, bottomHeight);
                this.joinRings(vertices, innerTop, innerBottom);
                this.joinRings(vertices, top, innerTop);
                this.joinRings(vertices, innerBottom, bottom);
            } else {
                this.addQuad(vertices, ...top);
                this.addQuad(vertices, ...bottom);
            }
            this.addSolid(vertices, material, points, `Floor ${index + 1}`);
        });

        // Four diagonal supporting walls follow the pyramid edges,
        // tapering with the same thickness rule as the floors. Stop at floor 4.
        const cornerRing = (height: number, x: number, z: number) => {
            const radius = baseRadius - (height - TEMPLE_BASE_ELEVATION) * slope;
            const thickness = TEMPLE_THICKNESS * radius / baseRadius;
            const halfOffset = thickness / (2 * Math.SQRT2);
            // Offset the outer center inward so the wall stays inside the pyramid.
            const outer = radius - halfOffset;
            const inner = outer - radius * TEMPLE_CORNER_DEPTH_FRACTION;
            return [
                new THREE.Vector3(x * (outer + halfOffset), height, z * (outer - halfOffset)),
                new THREE.Vector3(x * (outer - halfOffset), height, z * (outer + halfOffset)),
                new THREE.Vector3(x * (inner - halfOffset), height, z * (inner + halfOffset)),
                new THREE.Vector3(x * (inner + halfOffset), height, z * (inner - halfOffset)),
            ] as [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3];
        };
        for (const x of [-1, 1]) {
            for (const z of [-1, 1]) {
                const bottom = cornerRing(floors[0].height - TEMPLE_THICKNESS, x, z);
                const top = cornerRing(fourthFloor.height, x, z);
                const vertices: number[] = [];
                this.joinRings(vertices, bottom, top);
                this.addQuad(vertices, ...bottom);
                this.addQuad(vertices, ...top);
                this.addSolid(vertices, material, points, `Corner ${x}, ${z}`);
            }
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xccFFcc });
        // Independent segments avoid spurious lines across floors and openings.
        this.lines = new THREE.LineSegments(geometry, lineMaterial);
        this.lines.name = "Temple floors, openings and pyramid edges";
        this.scene.add(this.lines);
    }

    squareCorners(radius: number, height: number): [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3] {
        return [
            new THREE.Vector3(-radius, height, -radius),
            new THREE.Vector3(radius, height, -radius),
            new THREE.Vector3(radius, height, radius),
            new THREE.Vector3(-radius, height, radius),
        ];
    }

    addQuad(vertices: number[], a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3) {
        for (const point of [a, b, c, a, c, d]) {
            vertices.push(point.x, point.y, point.z);
        }
    }

    joinRings(vertices: number[], a: THREE.Vector3[], b: THREE.Vector3[]) {
        for (let i = 0; i < 4; i++) {
            const next = (i + 1) % 4;
            this.addQuad(vertices, a[i], a[next], b[next], b[i]);
        }
    }

    addSolid(vertices: number[], material: THREE.Material, points: THREE.Vector3[], name: string) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        // Each quad is two consecutive triangles. Project onto its own plane
        // with orthonormal axes so bevels and tapered walls retain tile scale.
        const uvs: number[] = [];
        const up = new THREE.Vector3(0, 1, 0);
        for (let offset = 0; offset < vertices.length; offset += 18) {
            const a = new THREE.Vector3().fromArray(vertices, offset);
            const b = new THREE.Vector3().fromArray(vertices, offset + 3);
            const c = new THREE.Vector3().fromArray(vertices, offset + 6);
            const normal = b.sub(a).cross(c.sub(a)).normalize();
            const horizontal = Math.abs(normal.y) > 0.999;
            const u = horizontal ? new THREE.Vector3(1, 0, 0)
                : new THREE.Vector3().crossVectors(up, normal).normalize();
            const v = horizontal ? new THREE.Vector3(0, 0, 1)
                : new THREE.Vector3().crossVectors(normal, u).normalize();
            for (let i = 0; i < 18; i += 3) {
                const point = new THREE.Vector3().fromArray(vertices, offset + i);
                uvs.push(point.dot(u) / TEMPLE_NORMAL_TILE_SIZE,
                    point.dot(v) / TEMPLE_NORMAL_TILE_SIZE);
            }
        }
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.computeVertexNormals();
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = name;
        this.scene.add(mesh);
        const edges = new THREE.EdgesGeometry(geometry);
        const positions = edges.getAttribute('position');
        for (let i = 0; i < positions.count; i++) {
            points.push(new THREE.Vector3().fromBufferAttribute(positions, i));
        }
        edges.dispose();
    }
}

export { TempleSpaceKalaChakra };
