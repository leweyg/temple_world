import * as THREE from 'three';

// Original Great Pyramid dimensions, in world units (approximately metres).
// https://www.usna.edu/Users/math/meh/_files/documents/pyr.pdf
const GOLDEN_RATIO_INVERSE = (Math.sqrt(5) - 1) / 2;
// Tune overall size here: 1 = full size, 1/phi = 61.8%, 1/phi² = 38.2%.
// Width, height, floors and openings scale together; entrance clearance stays fixed.
const TEMPLE_SCALE = 0.15; // GOLDEN_RATIO_INVERSE  * GOLDEN_RATIO_INVERSE * GOLDEN_RATIO_INVERSE;
const TEMPLE_BASE_WIDTH = 230.3 * TEMPLE_SCALE;
const TEMPLE_HEIGHT = 146.6 * TEMPLE_SCALE;
const TEMPLE_BASE_ELEVATION = 0.2;

// Floors are numbered from the entrance (1), evenly spaced in height.
// Leave one equal interval above floor 5 for the pointed roof.
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

        floors.forEach((floor, index) => {
            this.addSquareLines(points, floor.radius, floor.height);
            // Floor 1 is an uninterrupted flat outline. Only floors 2 and 3
            // have openings: vertical projections of floors 5 and 4 respectively.
            const openingFloor = index === 1 ? floors[4] : index === 2 ? floors[3] : undefined;
            if (openingFloor) {
                this.addSquareLines(points, openingFloor.radius, floor.height);
            }
        });

        // Four straight hip edges establish the Giza silhouette and its tip.
        const apex = new THREE.Vector3(0, TEMPLE_BASE_ELEVATION + TEMPLE_HEIGHT, 0);
        for (const x of [-1, 1]) {
            for (const z of [-1, 1]) {
                points.push(new THREE.Vector3(x * floors[0].radius, floors[0].height,
                    z * floors[0].radius), apex.clone());
            }
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: 0xccFFcc });
        // Independent segments avoid spurious lines across floors and openings.
        this.lines = new THREE.LineSegments(geometry, material);
        this.lines.name = "Temple floors, openings and pyramid edges";
        this.scene.add(this.lines);
    }

    addSquareLines(points: THREE.Vector3[], radius: number, height: number) {
        const corners = [
            new THREE.Vector3(-radius, height, -radius),
            new THREE.Vector3(radius, height, -radius),
            new THREE.Vector3(radius, height, radius),
            new THREE.Vector3(-radius, height, radius),
        ];
        for (let i = 0; i < corners.length; i++) {
            points.push(corners[i], corners[(i + 1) % corners.length]);
        }
    }
}

export { TempleSpaceKalaChakra };
