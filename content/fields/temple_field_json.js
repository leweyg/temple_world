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
import { ResourceTree, ResourceTypeJson, ResourceInstance } from "../code/resource_tree.js";
import { TempleFieldBase } from "./temple_field.js";
var ResourceTypeFieldJson = /** @class */ (function (_super) {
    __extends(ResourceTypeFieldJson, _super);
    function ResourceTypeFieldJson() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ResourceTypeFieldJson.prototype.isSceneType = function () { return true; };
    ResourceTypeFieldJson.prototype.configureSceneFromJson = function (jsonRes) {
        console.log("TODO... big time...");
    };
    ResourceTypeFieldJson.prototype.makeResourceInstanceFromLoaded = function (res, parent) {
        var obj = new THREE.Group();
        if (parent) {
            parent.add(obj);
        }
        this.configureSceneFromJson(res.data);
        var inst = ResourceInstance.fromObject3D(obj, res);
        ResourceTree.RequestUpdate();
        return new Promise(function (resolve) {
            resolve(inst);
        });
    };
    ResourceTypeFieldJson.prototype.releaseResourceInstance = function (resInst) {
        console.assert(resInst.isObject3D);
        var inst = resInst.asObject3D();
        if (inst.parent) {
            inst.parent.remove(inst);
        }
    };
    ResourceTypeFieldJson.FieldJsonType = new ResourceTypeFieldJson();
    return ResourceTypeFieldJson;
}(ResourceTypeJson));
var TempleFieldJson = /** @class */ (function (_super) {
    __extends(TempleFieldJson, _super);
    function TempleFieldJson(sceneParent, resourceParent, resType, jsonPath) {
        if (jsonPath === void 0) { jsonPath = "json_scene"; }
        var _this_1 = _super.call(this, "res_field_json@" + jsonPath, resourceParent, resType) || this;
        _this_1.midParentScene = null;
        var _this = _this_1;
        _this_1.is_focusable = true;
        _this_1.sceneParent = sceneParent;
        _this_1.res = _this_1.resourceParent.subResource(jsonPath, ResourceTypeFieldJson.FieldJsonType);
        resourceParent.instanceAsync(sceneParent).then(function (midParentScene) {
            _this.midParentScene = midParentScene.asObject3D();
            _this.res.instanceAsync(midParentScene.asObject3D()).then(function (meshInst) {
                //meshInst.asObject3D().userData.field = _this;
            });
        });
        return _this_1;
    }
    TempleFieldJson.prototype.doFocusedChanged = function (isHeld, isCentered) {
        var _a, _b;
        var inst = (_a = this.res.latestInstance()) === null || _a === void 0 ? void 0 : _a.asObject3D();
        var comn = (_b = this.res.latestLoaded()) === null || _b === void 0 ? void 0 : _b.data;
        if (inst && comn) {
            inst.material = (isHeld ? comn.matHeld : (isCentered ? comn.matCentered : comn.matDefault));
            //console.assert(inst.material);
        }
    };
    TempleFieldJson.prototype.mainShape = function () {
        if (!this.midParentScene)
            throw "No mid parent yet.";
        var shape = this.res.instanceTrySync(this.midParentScene);
        if (shape)
            return shape.asObject3D();
        throw "Not allocated yet";
    };
    return TempleFieldJson;
}(TempleFieldBase));
;
export { TempleFieldJson, ResourceTypeFieldJson };
