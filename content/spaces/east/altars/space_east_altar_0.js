import * as THREE from 'three';
import { ResourceTree } from '../../../code/resource_tree.js';
import { SpaceAltarShuzzle } from './space_altar_shuzzle.js';
var SpaceEastAltar0 = /** @class */ (function () {
    function SpaceEastAltar0(sceneParent, resParent) {
        var _this = this;
        this.shuzzle = null;
        var jsonPath = "content/spaces/east/altars/east_altar_0.json";
        resParent = new ResourceTree();
        this.inner = resParent.subResource(jsonPath, SpaceAltarShuzzle.ResourceTypeShuzzle);
        this.inner.instanceAsync(sceneParent).then(function (shuzzleResInst) {
            var shuzzle = shuzzleResInst.inst_data;
            _this.shuzzle = shuzzle;
            shuzzle.scene.position.set(-6.0, 0.5, 0);
            shuzzle.scene.rotateOnAxis(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
        });
    }
    return SpaceEastAltar0;
}());
export { SpaceEastAltar0 };
