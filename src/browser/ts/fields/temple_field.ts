import * as THREE from 'three';
import { ResourceInstance, ResourceTree, ResourceType, ResourceData } from "../code/resource_tree.js";

class TempleFieldBase extends ResourceTree {
    is_field : boolean = true;
    is_focusable : boolean = false;
    resourceParent : ResourceTree;

    constructor(pathName="TempleFieldBase", resourceParent : ResourceTree, resourceType : ResourceType) {
        super(pathName,resourceType);
        this.resourceParent = resourceParent;
        this.is_focusable = false;
    }

    doFocusedChanged(isHeld:boolean, isCentered:boolean) {
    }

    static isResTreeField(res:ResourceTree):boolean {
        if ((res as any).is_field) {
            return true;
        }
        return false;
    }

    static tryFieldFromRes(res:ResourceTree|null) : TempleFieldBase|null {
        for ( var r = res; r ; r = r.tree_parent ) {
            const tr = r;
            if (tr) {
                if (TempleFieldBase.isResTreeField(tr)) {
                    return tr as TempleFieldBase;
                }
            }
        }
        return null;
    }

    static tryFieldFromObject3D(obj : THREE.Object3D) : TempleFieldBase|null {
        const inst = ResourceInstance.tryFromObject3D(obj);
        if (inst) {
            console.assert(inst.is_res_inst);
            console.assert(inst.res_data.is_res_data);
            console.assert(inst.res_data.res.is_resource_tree);
        }
        return this.tryFieldFromRes( inst ? inst.res_data.res : null );
        
    }
};

export { TempleFieldBase }