import * as THREE from 'three';

class TempleFieldContacts {
    constructor(world) {
        this.world = world;
    }

    updateNearestContactSync(world) {
        throw "Not implimented.";
    }
};

class TempleFieldContactsRay extends TempleFieldContacts {
    constructor(world) {
        super(world);
        this.origin = new THREE.Vector3();
        this.direction = new THREE.Vector3(0,-1.0,0);
        this.min_distance = 0.01;
        this.max_distance = 1000.0;
        this.raycaster = new THREE.Raycaster();
        this.hit_now = false;
        this.hit_pos = new THREE.Vector3();
        this.possibles = [null];
        this.intersects = [];
    }

    updateNearestContactSync(world) {
        if (!this.world) {
            if (world) {
                this.world = world;
            }
        }
        console.assert(this.world);
        this.raycaster.near = this.min_distance;
        this.raycaster.far = this.max_distance;
        this.raycaster.set(this.origin, this.direction);
        this.raycaster.far = this.max_distance;
        this.intersects.length = 0;
        this.possibles[0] = this.world.worldScene;
        const intersects = this.raycaster.intersectObjects( this.possibles, true, this.intersects );
        console.assert(intersects == this.intersects);
        if (intersects.length > 0) {
            const best = intersects[0];
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