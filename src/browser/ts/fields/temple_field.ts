//import * as THREE from 'three';

import { ResourceTree } from "../code/resource_tree.js";

class TempleFieldBase extends ResourceTree {
    is_focusable : boolean = false;
    resourceParent : ResourceTree;

    constructor(pathName="TempleFieldBase", resourceParent : ResourceTree) {
        super(pathName);
        this.resourceParent = resourceParent;
        this.is_focusable = false;
    }
};

export { TempleFieldBase }