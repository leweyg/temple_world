import { TempleFieldPrimeShape } from '../fields/temple_field_prime_shape.js';
var SpaceTrainingBoxes = /** @class */ (function () {
    function SpaceTrainingBoxes(sceneParent, resParent) {
        this.res = resParent.subResourceSceneClean("SpaceTrainingBoxes", sceneParent);
        this.prim = new TempleFieldPrimeShape(sceneParent, this.res);
        this.prim.instanceAsync(sceneParent)
            .then(function (k) { return k.asObject3D().position.set(4.0, 0.5, -2.0); });
    }
    return SpaceTrainingBoxes;
}());
export { SpaceTrainingBoxes };
