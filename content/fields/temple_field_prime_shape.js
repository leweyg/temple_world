import * as THREE from 'three';
import { TempleFieldBase } from './temple_field.js';
import { ResourceType } from '../code/resource_tree.js';

class TempleFieldPrimeShapeType extends ResourceType {
    static PrimType = new TempleFieldPrimeShapeType();
    makeResourcePromiseFromPath(path) {
        const geo = new THREE.BoxGeometry(1, 1, 1);
        const matDef = new THREE.MeshToonMaterial({color:0x00FF00});
        const matSel = new THREE.MeshToonMaterial({color:0xccCCcc});
        var res = {
            geo : geo,
            mat : matDef,
            matSel : matSel,
            matDef : matDef,
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
        const _this = this;
        this.is_focusable = true;
        this.res = this.resourceParent.subResource(subtype, TempleFieldPrimeShapeType.PrimType);
        resourceParent.instanceAsync(sceneParent).then(parentScene => {
            _this.res.instanceAsync(parentScene).then(meshInst => {
                meshInst.userData.field = _this;
            });
        });
    }

    doFocusedChanged(isFocused) {
        const inst = this.res.latestInstance();
        const comn = this.res.latestLoaded();
        inst.material = isFocused ? comn.matSel : comn.matDef;
    }

    mainShape() {
        var shape = this.res.instanceTrySync();
        console.assert(shape);
        return shape;
    }
};

export { TempleFieldPrimeShape }