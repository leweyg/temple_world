var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import * as THREE from 'three';
var TempleFieldContacts = /** @class */ (function () {
    function TempleFieldContacts(world) {
        this.world = world;
    }
    TempleFieldContacts.prototype.updateNearestContactSync = function (world) {
        throw "Not implimented.";
    };
    return TempleFieldContacts;
}());
;
var TempleFieldContactsRay = /** @class */ (function (_super) {
    __extends(TempleFieldContactsRay, _super);
    function TempleFieldContactsRay(world) {
        var _this = _super.call(this, world) || this;
        _this.min_distance = 0.01;
        _this.max_distance = 1000.0;
        _this.hit_now = false;
        _this.possibles = [];
        _this.intersects = [];
        _this.origin = new THREE.Vector3();
        _this.direction = new THREE.Vector3(0, -1.0, 0);
        _this.min_distance = 0.01;
        _this.max_distance = 1000.0;
        _this.raycaster = new THREE.Raycaster();
        _this.hit_now = false;
        _this.hit_pos = new THREE.Vector3();
        _this.possibles = [];
        _this.intersects = [];
        return _this;
    }
    TempleFieldContactsRay.prototype.updateNearestContactSync = function (world) {
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
            this.possibles = [this.world.worldScene];
        }
        this.possibles[0] = this.world.worldScene;
        var intersects = this.raycaster.intersectObjects(this.possibles, true, this.intersects);
        console.assert(intersects == this.intersects);
        if (intersects.length > 0) {
            var best = intersects[0];
            this.hit_now = true;
            this.hit_pos.copy(best.point);
            return intersects[0];
        }
        else {
            this.hit_now = false;
        }
        return null;
    };
    return TempleFieldContactsRay;
}(TempleFieldContacts));
;
export { TempleFieldContacts, TempleFieldContactsRay };
