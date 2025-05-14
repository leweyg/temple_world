
import * as THREE from 'three';
import { TempleFieldPrimeShape } from '../fields/temple_field_prime_shape.js';

class SpaceTrainingBoxes {

    constructor(sceneParent, resParent) {
        this.res = resParent.subResourceScene("SpaceTrainingBoxes",sceneParent);
        this.prim = new TempleFieldPrimeShape(sceneParent, this.res);
        this.prim.res
            .instanceAsync(sceneParent)
            .then( k => k.position.set(4.0, 0.5, -2.0) );
    }


}

export { SpaceTrainingBoxes };
