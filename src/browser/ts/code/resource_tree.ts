
// ResourceTree ans assocaited types:
//
// USAGE:
//  var allLoaded = new ResourceTree();
//  var tempScene = allLoaded.subResource("temp_scene");
//  tempScene.subResource("scene.json").instanceAsync(sceneParent);
//  tempScene.dispose();

import * as THREE from 'three';
import { call } from 'three/tsl';

class ResourceData {
    data : any = null;
    source_type : ResourceType;
    res : ResourceTree;

    constructor(source_type:ResourceType, data:any, res:ResourceTree) {
        this.source_type = source_type;
        this.data = data;
        this.res = res;
    }
}

class ResourceInstance {
    inst_data : any;
    res_data !: ResourceData;
    isObject3D : boolean = false;

    constructor( inst: any, src_data:ResourceData, res_tree : ResourceTree) {
        this.res_data = src_data;
        this.inst_data = inst;
    }
    static fromObject3D(obj:THREE.Object3D,src_data:ResourceData):ResourceInstance {
        var inst = new ResourceInstance(obj, src_data, src_data.res);
        inst.isObject3D = true;
        return inst;
    }
    asObject3D() : THREE.Object3D {
        console.assert(this.isObject3D);
        return this.inst_data as THREE.Object3D;
    }
}

class ResourceType {
    name="ResourceType"

    isSceneType() { return false; }
    thisResourceType():ResourceType { return this; }
    makeResourcePromiseFromPath(resTree:ResourceTree)
        :Promise<ResourceData> {
        throw "NotOverloaded: ResourceType.makeResourcePromiseFromPath";
    }
    makeResourceInstanceFromLoaded(
        res:ResourceData,
        parent:THREE.Object3D)
        :Promise<ResourceInstance>{
        throw "NotOverloaded: ResourceType.doResourceInstance";
    }
    releaseResourceInstance(inst:ResourceInstance) {
        throw "NotOverloaded: ResourceType.releaseResourceInstance";
    }
    releaseResourcePromise(data:Promise<ResourceData>) {
        // usually empty nullify
    }
    simplePromise<T>(value: T): Promise<T> {
        const ans:any = new Promise((resolve:any, reject:any) => {
            resolve(value)
          });
        return ans as Promise<T>;
    }
};

class ResourceTypeJson extends ResourceType {
    name="ResourceTypeJson"
    override makeResourcePromiseFromPath(resTree:ResourceTree)
        : Promise<ResourceData> {
        var rt = this.thisResourceType();
        var ans = fetch(path)
            .then(res => res.json())
            .then(res => new ResourceData(rt,res,resTree));
        return ans;
    }
    override makeResourceInstanceFromLoaded(
        res:ResourceData,
        parent:THREE.Object3D):Promise<ResourceInstance> {
        throw "TODO";
    }
}

class ResourceTypeThreeGroup extends ResourceType {
    name="ResourceTypeThreeGroup"
    isSceneType() { return true; }
    override makeResourcePromiseFromPath(resTree:ResourceTree):Promise<ResourceData> {
        return new Promise((resolve) => {
            resolve(new ResourceData(this.thisResourceType(), resTree.resource_path, resTree));
        });
    }
    override makeResourceInstanceFromLoaded(
        res:ResourceData,
        parent:THREE.Object3D)
        :Promise<ResourceInstance> {
        var obj = new THREE.Group();
        obj.name = res.res.resource_path;
        if (parent) {
            parent.add(obj);
            ResourceTree.RequestUpdate();
        }
        const inst = ResourceInstance.fromObject3D(obj, res);
        inst.isObject3D = true;
        return new Promise((resolve) => {
            resolve(inst);
        });
    }
    releaseResourceInstance(inst:ResourceInstance) {
        console.assert(inst.isObject3D);
        var obj = inst.asObject3D();
        if (obj.parent) {
            obj.parent.remove(obj);
        }
    }
}


class ResourceHelpers {
    static removeFromArray(array:Array<any>, item:any) {
        const index = array.indexOf(item);
        if (index > -1) { // only splice array when item is found
            array.splice(index, 1); // 2nd parameter means remove one item only
        }
        return array;
    }
}

interface UtilAction<T> {
    (arg:T) : void
}

interface UtilFunc<A,B> {
    (arg:A) : B
}

class ResourceTree {
    resource_path : string;
    resource_type : ResourceType;
    tree_parent : ResourceTree|null = null;
    tree_children : Array<ResourceTree> = [];

    state_disposed = false;
    state_instance_callback : UtilAction<ResourceInstance>|null = null;
    state_loader : Promise<ResourceData>|null;
    state_loaded_latest : ResourceData|null;
    state_instance_latest : ResourceInstance|null;
    state_instancer : Promise<ResourceInstance>|null;


    constructor(path:string=ResourceTree.NameDefault, resource_type=ResourceTree.TypeGeneric) {
        // Resource:
        this.resource_path = path;
        this.resource_type = (resource_type) ? resource_type : ResourceTree.TypeGeneric;
        this.state_loader = null;
        this.state_loaded_latest = null;
        this.state_instancer = null;
        //this.state_instance_callback = null;
        this.state_instance_latest = null;
        this.state_disposed = false;
    }

    static NameDefault = "(resource_root)";
    static TypeGeneric = new ResourceType();
    static TypeThreeGroup = new ResourceTypeThreeGroup();
    static TypeJson = new ResourceTypeJson();
    static RequestUpdate = (() => {});

    latestInstance() : ResourceInstance|null { return this.state_instance_latest; }
    latestLoaded() : ResourceData|null { return this.state_loaded_latest; }

    subResource(path:string, type=ResourceTree.TypeGeneric):ResourceTree {
        console.assert(!this.state_disposed);
        var existing = this.resourceFindByPath(path);
        if (existing) return existing;
        return this.resourceAddChildByPath(path, type);
    }

    subResourceSceneClean(
        name:string, 
        parent:THREE.Object3D)
        : ResourceTree
    {
        return subResourceScene(name, parent, null);
    }
    // Creates a scene-typed resource
    //  If a parent is given, the resource is instantiated
    //  If a callback is given, it is passed the created scene
    subResourceScene(
        name:string, 
        parent:THREE.Object3D,
        callback:(inst:THREE.Object3D, instTree:ResourceTree)=>void|null)
        : ResourceTree
    {
        var resExist = this.resourceFindByPath(name);
        if (resExist) return resExist;

        var res = this.resourceAddChildByPath(name, ResourceTree.TypeThreeGroup);
        if (callback) {
            res.state_instance_callback = ((inst:ResourceInstance)=>{
                callback(inst.inst_data as THREE.Object3D, inst.res_data);
            });
        }
        if (parent) {
            res.instanceAsync(parent);
        }
        return res;
    }

    resourceLoadAsync():Promise<ResourceData> {
        console.assert(!this.state_disposed);
        if (this.state_loader) {
            return this.state_loader;
        }
        this.state_loader = this.resource_type.makeResourcePromiseFromPath(this.resource_path);
        var _this = this;
        this.state_loader.then(k => {
            if (k) {
                console.assert(!_this.state_loaded_latest);
                _this.state_loaded_latest = k;
            }
        });
        return this.state_loader;
    }

    instanceAsync(parentScene:THREE.Object3D):Promise<ResourceInstance> {
        console.assert(!this.state_disposed);
        if (this.state_instancer) {
            return this.state_instancer;
        }
        var _this = this;
        var prom = this.resourceLoadAsync();
        this.state_instancer = prom.then((subSceneData:ResourceData) => {
            var instProm = _this.resource_type.makeResourceInstanceFromLoaded(
                subSceneData, parentScene, _this );
            instProm.then(inst => {
                console.assert(!_this.state_instance_latest);
                _this.state_instance_latest = inst;
                if (_this.state_instance_callback) {
                    _this.state_instance_callback(inst,_this);
                }
            });
            return instProm;
        });
        return this.state_instancer;
    }

    instanceTrySync(parentScene:THREE.Object3D):ResourceInstance|null {
        if (this.state_instance_latest) {
            return this.state_instance_latest;
        }
        // begin request:
        if (!this.state_instancer) {
            this.instanceAsync(parentScene);
            if (this.state_instance_latest) {
                return this.state_instance_latest;
            }
        }
        return null;
    }

    disposeInstance() {
        if (this.state_instance_latest) {
            this.state_instance_latest = null;
        }
        if (this.state_instancer) {
            var _this = this;
            this.state_instancer.then(inst => {
                _this.resource_type.releaseResourceInstance(inst);
            });
            this.state_instancer = null;
        }
    }

    disposeLoad() {
        this.state_loaded_latest = null;
        if (this.state_loader) {
            this.resource_type.releaseResourcePromise(this.state_loader);
            this.state_loader = null;
        }
    }

    disposeTree() {
        if (this.tree_parent) {
            ResourceHelpers.removeFromArray(this.tree_parent.tree_children, this);
            this.tree_parent = null;
        }
    }

    dispose() {
        this.disposeInstance();
        this.disposeLoad();
        this.disposeTree();
    }

    resourceFindByPath(path:string, lookUp=true):ResourceTree|null {
        if (this.resource_path == path) {
            return this;
        }
        if (lookUp && this.tree_parent) {
            return this.tree_parent.resourceFindByPath(path);
        }
        for (var i in this.tree_children) {
            var child = this.tree_children[i];
            var ans = child.resourceFindByPath(path, false);
            if (ans) return ans;
        }
        return null;
    }

    resourceAddChildByPath(path:string, type=ResourceTree.TypeGeneric):ResourceTree {
        console.assert(!this.resourceFindByPath(path,false));
        var res = new ResourceTree(path, type);
        res.tree_parent = this;
        this.tree_children.push(res);
        return res;
    }

};



export { ResourceTree, ResourceType, ResourceTypeJson, ResourceData, ResourceInstance }

