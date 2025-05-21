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
import { TempleFieldBase } from './temple_field.js';
import { ResourceType, ResourceData, ResourceInstance } from '../code/resource_tree.js';
var TempleFieldGeoData = /** @class */ (function () {
    function TempleFieldGeoData(geo, mat, matDefault, matCentered, matHeld) {
        this.geo = geo;
        this.mat = mat;
        this.matDefault = matDefault;
        this.matCentered = matCentered;
        this.matHeld = matHeld;
    }
    return TempleFieldGeoData;
}());
var TempleFieldPrimeShapeType = /** @class */ (function (_super) {
    __extends(TempleFieldPrimeShapeType, _super);
    function TempleFieldPrimeShapeType() {
        var _this_1 = _super.call(this) || this;
        _this_1.name = "TempleFieldPrimeShapeType";
        return _this_1;
    }
    TempleFieldPrimeShapeType.prototype.isSyncAlloc = function () {
        return true;
    };
    TempleFieldPrimeShapeType.prototype.makeSyncResourceInstanceFromPath = function (resTree) {
        return this.internalMakeDataSync(resTree, resTree.tree_parent.ensureInstance().asObject3D());
    };
    TempleFieldPrimeShapeType.prototype.internalMakeDataSync = function (resTree, parent) {
        var geo = new THREE.BoxGeometry(1.61, 0.15, 1.61);
        var matDefault = new THREE.MeshToonMaterial({ color: 0x00FF00 });
        var matCentered = new THREE.MeshToonMaterial({ color: 0xccCCcc });
        var matHeld = new THREE.MeshToonMaterial({ color: 0x0000FF });
        var res = {
            geo: geo,
            mat: matDefault,
            matDefault: matDefault,
            matCentered: matCentered,
            matHeld: matHeld,
        };
        var resData = new ResourceData(this.thisResourceType(), res, resTree);
        var inst = new THREE.Mesh(res.geo, res.mat);
        parent.add(inst);
        var resInst = ResourceInstance.fromObject3D(inst, resData);
        return resInst;
    };
    TempleFieldPrimeShapeType.prototype.releaseResourceInstance = function (resInst) {
        var _a;
        var inst = resInst.asObject3D();
        (_a = inst.parent) === null || _a === void 0 ? void 0 : _a.remove(inst);
    };
    TempleFieldPrimeShapeType.PrimType = new TempleFieldPrimeShapeType();
    return TempleFieldPrimeShapeType;
}(ResourceType));
var TempleFieldPrimeShape = /** @class */ (function (_super) {
    __extends(TempleFieldPrimeShape, _super);
    function TempleFieldPrimeShape(sceneParent, resourceParent, subtype) {
        if (subtype === void 0) { subtype = "plane"; }
        var _this_1 = _super.call(this, "primshape_" + subtype, resourceParent, TempleFieldPrimeShapeType.PrimType) || this;
        _this_1.sceneParent = sceneParent;
        var _this = _this_1;
        _this_1.is_focusable = true;
        _this_1.resourceParent.resourceAddChild(_this_1);
        _this_1.res = _this_1.subResource(subtype, TempleFieldPrimeShapeType.PrimType);
        _this_1.res.instanceAsync(sceneParent);
        return _this_1;
    }
    TempleFieldPrimeShape.prototype.doFocusedChanged = function (isHeld, isCentered) {
        var _a, _b;
        var inst = (_a = this.res.latestInstance()) === null || _a === void 0 ? void 0 : _a.asObject3D();
        var comn = (_b = this.res.latestLoaded()) === null || _b === void 0 ? void 0 : _b.data;
        if (inst && comn) {
            inst.material = (isHeld ? comn.matHeld : (isCentered ? comn.matCentered : comn.matDefault));
            //console.assert(inst.material);
        }
    };
    TempleFieldPrimeShape.prototype.mainShape = function () {
        var shape = this.res.instanceTrySync(this.sceneParent);
        if (shape) {
            return shape.asObject3D();
        }
        throw "No shape allocated yet";
    };
    return TempleFieldPrimeShape;
}(TempleFieldBase));
;
export { TempleFieldPrimeShape, TempleFieldGeoData };
