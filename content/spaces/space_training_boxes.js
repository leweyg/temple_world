import { TempleFieldPrimeShape } from '../fields/temple_field_prime_shape.js';
var SpaceTrainingBoxes = /** @class */ (function () {
    function SpaceTrainingBoxes(sceneParent, resParent) {
        this.res = resParent.subResourceSceneClean("SpaceTrainingBoxes", sceneParent);
        var node = this.res.ensureInstance().asObject3D();
        this.prim = new TempleFieldPrimeShape(node, this.res);
        this.prim.instanceAsync(node)
            .then(function (k) { return k.asObject3D().position.set(4.0, 0.5, -2.0); });
    }
    return SpaceTrainingBoxes;
}());
export { SpaceTrainingBoxes };
