
import * as THREE from 'three';
import { TempleFieldJson } from '../../../fields/temple_field_json.js';
import { ResourceTree } from '../../../code/resource_tree.js';

class SpaceEastAltar0 {

    constructor(sceneParent, resParent) {
        var jsonPath = "content/spaces/east/altars/east_altar_0.json"
        this.inner = new TempleFieldJson(sceneParent, resParent, jsonPath);
    }


}

export { SpaceEastAltar0 };
