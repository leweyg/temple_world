//import * as THREE from 'three';

import { ResourceTree } from "../code/resource_tree.js";

class TempleFieldBase extends ResourceTree {
    constructor(pathName="TempleFieldBase", resourceParent) {
        super(pathName);
        this.resourceParent = resourceParent;
        this.is_focusable = false;
    }

    doFocusedChanged() {}
};

export { TempleFieldBase }