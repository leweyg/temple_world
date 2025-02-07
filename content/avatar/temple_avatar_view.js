
import * as THREE from 'three';
import { TempleFieldContactsRay } from '../fields/temple_field_contacts.js';

class TempleAvatarView {

    constructor(avatar, cameraThree) {
        this.avatar = avatar;
        this.cameraThree = cameraThree;
        this.forwardLocal = new THREE.Vector3(0,0,-1);
        this.forwardWorld = new THREE.Vector3(0,0,-1);
        this.targetContact = new TempleFieldContactsRay();
        this.centerField = null;
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
            const field = hit.object.userData.field;
            if (field && field.is_focusable) {
                hitField = field;
            }
        }
        if (this.centerField != hitField) {
            if (this.centerField) this.centerField.doFocusedChanged(false);
            this.centerField = hitField;
            if (this.centerField) this.centerField.doFocusedChanged(true);
        }
    }

}

export { TempleAvatarView };
