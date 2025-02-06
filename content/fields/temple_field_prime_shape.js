import * as THREE from 'three';
import { TempleFieldBase } from './temple_field.js';
import { ResourceType } from '../code/resource_tree.js';

class TempleFieldPrimeShapeType extends ResourceType {
    static PrimType = new TempleFieldPrimeShapeType();
    makeResourcePromiseFromPath(path) {
        const geo = new THREE.BoxGeometry(1, 1, 1);
        const mat = new THREE.MeshToonMaterial({color:0x00FF00});
        var res = {
            geo : geo,
            mat : mat,
        };
        return this.simplePromise(res);
    }
    makeResourceInstanceFromLoaded(res, parent, parentRes) {
        const inst = new THREE.Mesh(res.geo, res.mat);
        parent.add(inst);
        return this.simplePromise( inst );
    }
    releaseResourceInstance(inst) {
        inst.parent.remove(inst);
    }
}

class TempleFieldPrimeShape extends TempleFieldBase {
    constructor(sceneParent, resourceParent, subtype="box") {
        super("primshape_" + subtype,resourceParent);
        this.res = this.resourceParent.subResource(subtype, TempleFieldPrimeShapeType.PrimType);
        resourceParent.instanceAsync(sceneParent).then(parentScene => {
            this.res.instanceAsync(parentScene);
        });
    }

    mainShape() {
        var shape = this.res.instanceTrySync();
        console.assert(shape);
        return shape;
    }
};

export { TempleFieldPrimeShape }