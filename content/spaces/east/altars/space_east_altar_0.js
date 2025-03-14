
import * as THREE from 'three';
import { TempleFieldJson } from '../../../fields/temple_field_json.js';
import { ResourceTree } from '../../../code/resource_tree.js';
import { SpaceAltarShuzzle } from './space_altar_shuzzle.js';

class SpaceEastAltar0 {

    constructor(sceneParent, resParent) {
        var jsonPath = "content/spaces/east/altars/east_altar_0.json"
        resParent = new ResourceTree()
        this.inner = resParent.subResource(jsonPath, SpaceAltarShuzzle.ResourceTypeShuzzle);
        this.inner.instanceAsync(sceneParent).then(shuzzle => {
            this.shuzzle = shuzzle;
            shuzzle.scene.position.set(-6.0, 0.5, 0);
            shuzzle.scene.rotateOnAxis(new THREE.Vector3(0,1,0), -Math.PI/2);
        });
    }


}

export { SpaceEastAltar0 };
