
import * as THREE from 'three';
import { TempleFieldPrimeShape } from '../fields/temple_field_prime_shape.js';
import { ResourceTree } from '../code/resource_tree.js';

class SpaceTrainingBoxes {
    res : ResourceTree;
    prim : TempleFieldPrimeShape;

    constructor(sceneParent:THREE.Object3D, resParent:ResourceTree) {
        this.res = resParent.subResourceSceneClean("SpaceTrainingBoxes",sceneParent);
        const node = this.res.ensureInstance().asObject3D();
        this.prim = new TempleFieldPrimeShape(node, this.res);
        this.prim.instanceAsync(node)
            .then( k => k.asObject3D().position.set(4.0, 0.5, -2.0) );
    }


}

export { SpaceTrainingBoxes };
