
import * as THREE from 'three';
import { TempleFieldContactsRay } from '../fields/temple_field_contacts.js';
import { TempleAvatar } from './temple_avatar.js';
import { TempleFieldBase } from '../fields/temple_field.js';
import { ResourceInstance } from '../code/resource_tree.js'

class TempleAvatarView {
    forwardLocal : THREE.Vector3;
    forwardWorld : THREE.Vector3;
    targetContact : TempleFieldContactsRay;
    centerField : TempleFieldBase|null = null;

    constructor(public avatar : TempleAvatar, public cameraThree : THREE.Camera) {
        this.cameraThree = cameraThree;
        this.forwardLocal = new THREE.Vector3(0,0,-1);
        this.forwardWorld = new THREE.Vector3(0,0,-1);
        this.targetContact = new TempleFieldContactsRay(avatar.world);
        this.centerField = null;
    }

    latestCenterField() {
        return this.centerField;
    }

    postCameraMoved() {
        const world = this.avatar.world;
        const origin = this.cameraThree.position;

        this.forwardWorld.copy(this.forwardLocal);
        this.cameraThree.localToWorld(this.forwardWorld);
        this.forwardWorld.sub(origin);
        this.forwardWorld.normalize();

        this.targetContact.origin.copy(origin);
        this.targetContact.direction.copy(this.forwardWorld);
        const hit = this.targetContact.updateNearestContactSync(world);
        var hitField = null;
        if (hit) {
            const hitInst = ResourceInstance.tryFromObject3D(hit.object);
            const field = TempleFieldBase.tryFieldFromObject3D(hit.object);
            if (field && field.is_focusable) {
                //console.log("Focusable hit...");
                hitField = field;
            } else {
                //console.log("Hit not focusable.");
            }
        }
        if (this.centerField != hitField) {
            console.log("Center field changed...");
            this.centerField = hitField;
        }
    }

}

export { TempleAvatarView };
