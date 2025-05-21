import * as THREE from 'three';
import { TempleWorld } from '../temple_world.js';
import { ResourceInstance } from '../code/resource_tree.js';

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
            var best = intersects[0];
            var bestInst : ResourceInstance|null = null;
            for (var hitIndex=0; hitIndex<intersects.length; hitIndex++) {
                const cur = intersects[hitIndex];
                const resInst = ResourceInstance.tryFromObject3D(cur.object);
                if (resInst) {
                    bestInst = resInst;
                    best = cur;
                    break;
                }
            }
            this.hit_now = true;
            this.hit_pos.copy(best.point);
            return intersects[0];

        } else {
            this.hit_now = false;
        }
        return null;
    }
};

export { TempleFieldContacts, TempleFieldContactsRay }