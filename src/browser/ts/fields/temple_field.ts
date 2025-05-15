//import * as THREE from 'three';

import { ResourceTree, ResourceType } from "../code/resource_tree.js";

class TempleFieldBase extends ResourceTree {
    is_focusable : boolean = false;
    resourceParent : ResourceTree;

    constructor(pathName="TempleFieldBase", resourceParent : ResourceTree, resourceType : ResourceType) {
        super(pathName,resourceType);
        this.resourceParent = resourceParent;
        this.is_focusable = false;
    }

    doFocusedChanged(isHeld:boolean, isCentered:boolean) {
    }
};

export { TempleFieldBase }