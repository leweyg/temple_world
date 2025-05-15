import * as THREE from 'three';
import { TempleFieldBase } from './temple_field.js';
import { ResourceTree, ResourceType, ResourceData, ResourceInstance } from '../code/resource_tree.js';

class TempleFieldGeoData {
    constructor(
        public geo : THREE.BufferGeometry,
        public mat : THREE.Material,
        public matDefault : THREE.Material,
        public matCentered : THREE.Material,
        public matHeld : THREE.Material ) {
    }
}

class TempleFieldPrimeShapeType extends ResourceType {
    static PrimType = new TempleFieldPrimeShapeType();
    makeResourcePromiseFromPath(resTree:ResourceTree)
        :Promise<ResourceData> {
        const geo = new THREE.BoxGeometry(1.61, 0.15, 1.61);
        const matDefault = new THREE.MeshToonMaterial({color:0x00FF00});
        const matCentered = new THREE.MeshToonMaterial({color:0xccCCcc});
        const matHeld= new THREE.MeshToonMaterial({color:0x0000FF});
        var res : TempleFieldGeoData = {
            geo : geo,
            mat : matDefault,
            matDefault : matDefault,
            matCentered : matCentered,
            matHeld : matHeld,
        };
        var resInst = new ResourceData(this.thisResourceType(), res, resTree);
        return this.simplePromise(resInst);
    }
    makeResourceInstanceFromLoaded(
        resData:ResourceData,
        parent:THREE.Object3D)
        :Promise<ResourceInstance> {
        const res = resData.data as TempleFieldGeoData;
        const inst = new THREE.Mesh(res.geo, res.mat);
        parent.add(inst);
        const resInst = ResourceInstance.fromObject3D(inst, resData);
        return this.simplePromise( resInst );
    }
    releaseResourceInstance(resInst:ResourceInstance) {
        const inst = resInst.asObject3D();
        inst.parent?.remove(inst);
    }
}

class TempleFieldPrimeShape extends TempleFieldBase {
    res : ResourceTree;
    sceneParent:THREE.Object3D;
    
    constructor(sceneParent:THREE.Object3D, resourceParent:ResourceTree, subtype="plane") {
        super("primshape_" + subtype,resourceParent);
        this.sceneParent = sceneParent;
        const _this = this;
        this.is_focusable = true;
        this.res = this.resourceParent.subResource(subtype, TempleFieldPrimeShapeType.PrimType);
        resourceParent.instanceAsync(sceneParent).then(parentScene => {
            _this.res.instanceAsync(sceneParent).then(meshInst => {
                meshInst.asObject3D().userData.field = _this;
            });
        });
    }

    override doFocusedChanged(isHeld:boolean, isCentered:boolean) {
        const inst = this.res.latestInstance()?.asObject3D() as THREE.Mesh;
        const comn = this.res.latestLoaded()?.data as TempleFieldGeoData;
        if (inst && comn) {
            inst.material = ( isHeld ? comn.matHeld : ( isCentered ? comn.matCentered : comn.matDefault ) );
            //console.assert(inst.material);
        }
    }

    mainShape() {
        var shape = this.res.instanceTrySync(this.sceneParent);
        if (shape) {
            return shape.asObject3D();
        }
        throw "No shape allocated yet";
    }
};

export { TempleFieldPrimeShape, TempleFieldGeoData }