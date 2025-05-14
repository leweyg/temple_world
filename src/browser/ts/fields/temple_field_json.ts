import * as THREE from 'three';
import { ResourceTree, ResourceTypeJson } from "../code/resource_tree.js";
import { TempleFieldBase } from "./temple_field.js";

class ResourceTypeFieldJson extends ResourceTypeJson {
    isSceneType() { return true; }
    static FieldJsonType = new ResourceTypeFieldJson();
    configureSceneFromJson(jsonRes) {
        console.log("TODO... big time...")
    }
    makeResourceInstanceFromLoaded(res, parent, parentRes) {
        var obj = new THREE.Group();
        if (parent) {
            parent.add(obj);
        }
        this.configureSceneFromJson(res);
        ResourceTree.RequestUpdate();
        return new Promise((resolve) => {
            resolve(obj);
        });
    }
    releaseResourceInstance(inst) {
        console.assert(inst.isObject3D);
        if (inst.parent) {
            inst.parent.remove(inst);
        }
    }
}


class TempleFieldJson extends TempleFieldBase {
    constructor(sceneParent, resourceParent, jsonPath="json_scene") {
        super("res_field_json@" + jsonPath,resourceParent);
        const _this = this;
        this.is_focusable = true;
        this.res = this.resourceParent.subResource(jsonPath, ResourceTypeFieldJson.FieldJsonType);
        resourceParent.instanceAsync(sceneParent).then(parentScene => {
            _this.res.instanceAsync(parentScene).then(meshInst => {
                meshInst.userData.field = _this;
            });
        });
    }

    doFocusedChanged(isHeld, isCentered) {
        const inst = this.res.latestInstance();
        const comn = this.res.latestLoaded();
        if (inst && comn) {
            inst.material = ( isHeld ? comn.matHeld : ( isCentered ? comn.matCentered : comn.matDefault ) );
            console.assert(inst.material);
        }
    }

    mainShape() {
        var shape = this.res.instanceTrySync();
        console.assert(shape);
        return shape;
    }
};


export { TempleFieldJson, ResourceTypeFieldJson }