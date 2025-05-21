import * as THREE from 'three';
import { ResourceTree, ResourceTypeJson, ResourceData, ResourceInstance, ResourceType } from "../code/resource_tree.js";
import { TempleFieldBase } from "./temple_field.js";
import { TempleFieldGeoData } from "./temple_field_prime_shape.js"

class ResourceTypeFieldJson extends ResourceTypeJson {
    isSceneType() { return true; }
    static FieldJsonType = new ResourceTypeFieldJson();
    configureSceneFromJson(jsonRes:any) {
        console.log("TODO... big time...")
    }
    makeResourceInstanceFromLoaded(
        res:ResourceData,
        parent:THREE.Object3D)
        :Promise<ResourceInstance> {
        var obj = new THREE.Group();
        if (parent) {
            parent.add(obj);
        }
        this.configureSceneFromJson(res.data);
        const inst = ResourceInstance.fromObject3D(obj, res);
        ResourceTree.RequestUpdate();
        return new Promise((resolve) => {
            resolve(inst);
        });
    }
    releaseResourceInstance(resInst:ResourceInstance) {
        console.assert(resInst.isObject3D);
        const inst = resInst.asObject3D();
        if (inst.parent) {
            inst.parent.remove(inst);
        }
    }
}


class TempleFieldJson extends TempleFieldBase {
    res : ResourceTree;
    sceneParent:THREE.Object3D;
    midParentScene:THREE.Object3D|null = null;

    constructor(sceneParent:THREE.Object3D, resourceParent:ResourceTree, resType : ResourceType, jsonPath="json_scene") {
        super("res_field_json@" + jsonPath,resourceParent, resType);
        const _this = this;
        this.is_focusable = true;
        this.sceneParent = sceneParent;
        this.res = this.resourceParent.subResource(jsonPath, ResourceTypeFieldJson.FieldJsonType);
        resourceParent.instanceAsync(sceneParent).then(midParentScene => {
            _this.midParentScene = midParentScene.asObject3D();
            _this.res.instanceAsync(midParentScene.asObject3D()).then(meshInst => {
                //meshInst.asObject3D().userData.field = _this;
            });
        });
    }

    override doFocusedChanged(isHeld:boolean, isCentered:boolean) {
        const inst = this.res.latestInstance()?.asObject3D() as THREE.Mesh;
        const comn = this.res.latestLoaded()?.data as TempleFieldGeoData;
        if (inst && comn) {
            inst.material = ( isHeld ? comn.matHeld : ( isCentered ? comn.matCentered : comn.matDefault ) );
            //console.assert(inst.material);
        }
    }

    mainShape() : THREE.Object3D|null {
        if (!this.midParentScene) throw "No mid parent yet.";
        const shape = this.res.instanceTrySync(this.midParentScene);
        if (shape) return shape.asObject3D();
        throw "Not allocated yet";
    }
};


export { TempleFieldJson, ResourceTypeFieldJson }