import * as THREE from 'three';
import { TempleFieldContactsRay } from '../fields/temple_field_contacts.js';
var TempleAvatarView = /** @class */ (function () {
    function TempleAvatarView(avatar, cameraThree) {
        this.avatar = avatar;
        this.cameraThree = cameraThree;
        this.centerField = null;
        this.cameraThree = cameraThree;
        this.forwardLocal = new THREE.Vector3(0, 0, -1);
        this.forwardWorld = new THREE.Vector3(0, 0, -1);
        this.targetContact = new TempleFieldContactsRay(avatar.world);
        this.centerField = null;
    }
    TempleAvatarView.prototype.latestCenterField = function () {
        return this.centerField;
    };
    TempleAvatarView.prototype.postCameraMoved = function () {
        var world = this.avatar.world;
        var origin = this.cameraThree.position;
        this.forwardWorld.copy(this.forwardLocal);
        this.cameraThree.localToWorld(this.forwardWorld);
        this.forwardWorld.sub(origin);
        this.forwardWorld.normalize();
        this.targetContact.origin.copy(origin);
        this.targetContact.direction.copy(this.forwardWorld);
        var hit = this.targetContact.updateNearestContactSync(world);
        var hitField = null;
        if (hit) {
            var field = hit.object.userData.field;
            if (field && field.is_focusable) {
                hitField = field;
            }
        }
        if (this.centerField != hitField) {
            this.centerField = hitField;
        }
    };
    return TempleAvatarView;
}());
export { TempleAvatarView };
