
import * as THREE from 'three';
import { TempleFieldJson } from '../../../fields/temple_field_json.js';
import { ResourceTree } from '../../../code/resource_tree.js';
import { SpaceAltarShuzzle } from './space_altar_shuzzle.js';

class SpaceEastAltar0 {

    constructor(sceneParent, resParent) {
        var jsonPath = "content/spaces/east/altars/east_altar_0.json"
        resParent = new ResourceTree()
        this.inner = resParent.subResource(jsonPath, SpaceAltarShuzzle.ResourceTypeShuzzle);
        this.inner.instanceAsync(sceneParent);
    }


}

export { SpaceEastAltar0 };
