import * as THREE from 'three';
import { TempleWorld } from '../temple_world.js';
import { ResourceInstance } from '../code/resource_tree.js';
import { TempleFieldBase } from './temple_field.js';

class TempleFieldContacts {
    constructor(public world : TempleWorld) {
    }

    updateNearestContactSync(world:TempleWorld) {
        throw "Not implimented.";
    }
};

class TempleFieldContactsRay extends TempleFieldContacts {
    origin : THREE.Vector3;
    direction : THREE.Vector3;
    min_distance = 0.01;
    max_distance = 1000.0;
    raycaster : THREE.Raycaster;
    hit_now = false;
    hit_pos : THREE.Vector3;
    possibles : Array<THREE.Object3D> = [];
    intersects : Array<THREE.Intersection<THREE.Object3D>> = [];
    
    constructor(world:TempleWorld) {
        super(world);
        this.origin = new THREE.Vector3();
        this.direction = new THREE.Vector3(0,-1.0,0);
        this.min_distance = 0.01;
        this.max_distance = 1000.0;
        this.raycaster = new THREE.Raycaster();
        this.hit_now = false;
        this.hit_pos = new THREE.Vector3();
        this.possibles = [];
        this.intersects = [];
    }

    updateNearestContactSync(world:TempleWorld) {
        if (!this.world) {
            if (world) {
                this.world = world;
            }
        }
        //console.assert(this.world);
        this.raycaster.near = this.min_distance;
        this.raycaster.far = this.max_distance;
        this.raycaster.set(this.origin, this.direction);
        this.raycaster.far = this.max_distance;
        this.intersects.length = 0;
        if (this.possibles.length == 0) {
            this.possibles = [ this.world.worldScene ];
        }
        this.possibles[0] = this.world.worldScene;
        const intersects = this.raycaster.intersectObjects( this.possibles, true, this.intersects );
        console.assert(intersects == this.intersects);
        if (intersects.length > 0) {
            let best: THREE.Intersection<THREE.Object3D> | null = null;
            let bestDistance = Infinity;
            const fieldBiasDistance = 2.0;

            for (const cur of intersects) {
                const distance = cur.distance;
                const field = TempleFieldBase.tryFieldFromObject3D(cur.object);
                const biasedDist = distance - (field ? fieldBiasDistance : 0.0);
                if (biasedDist < bestDistance) {
                    best = cur;
                    bestDistance = biasedDist;
                }
            }

            let chosen: THREE.Intersection<THREE.Object3D> | null = best;

            if (chosen) {
                this.hit_now = true;
                this.hit_pos.copy(chosen.point);
                return chosen;
            }
        }
        this.hit_now = false;
        return null;
    }
};

export { TempleFieldContacts, TempleFieldContactsRay }