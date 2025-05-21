
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
    is_res_data : boolean = true;

    constructor(source_type:ResourceType, data:any, res:ResourceTree) {
        this.source_type = source_type;
        this.data = data;
        this.res = res;
    }

    assertHasResource() {
        console.assert(this.res.is_resource_tree);
    }
}

class ResourceInstance {
    is_res_inst : boolean = true;
    inst_data : any;
    res_data : ResourceData;
    isObject3D : boolean = false;
    unique_id = 0;
    static unique_counter = 1;
    

    constructor( inst: any, src_data:ResourceData, res_tree : ResourceTree) {
        this.res_data = src_data;
        this.inst_data = inst;
        this.res_data.assertHasResource();
        this.unique_id = (ResourceInstance.unique_counter++);
    }
    static fromObject3D(obj:THREE.Object3D,src_data:ResourceData):ResourceInstance {
        const inst = new ResourceInstance(obj, src_data, src_data.res);
        inst.isObject3D = true;
        obj.userData.resInstPtr = inst;
        return inst;
    }
    static tryFromObject3D(obj:THREE.Object3D) : ResourceInstance|null {
        const resInstAny = obj.userData.resInstPtr;
        if (resInstAny) {
            const resInst = resInstAny as ResourceInstance;
            console.assert(resInst.is_res_inst);
            return resInst;
        }
        return null;
    }
    asObject3D() : THREE.Object3D {
        console.assert(this.isObject3D);
        const obj = this.inst_data as THREE.Object3D;
        if(obj.userData.resInstPtr.unique_id != this.unique_id) {
            console.log("Userdata doesn't match this:" + obj.userData.resInst)
        }
        return obj;
    }
}

class ResourceType {
    name="ResourceType"

    isSceneType() { return false; }
    isSyncAlloc() { return false; }
    thisResourceType():ResourceType { return this; }
    makeResourcePromiseFromPath(resTree:ResourceTree)
        :Promise<ResourceData> {
        throw "NotOverloaded: ResourceType.makeResourcePromiseFromPath";
    }
    makeSyncResourceInstanceFromPath(resTree:ResourceTree):ResourceInstance {
        console.assert(this.isSyncAlloc());
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
        var ans = fetch(resTree.resource_path)
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
    override isSceneType() { return true; }
    override isSyncAlloc(): boolean { return true; }
    setupObject3dInstance(resData:ResourceData,parent:THREE.Object3D|null):ResourceInstance {
        var obj = new THREE.Group();
        obj.name = resData.res.resource_path;
        if (parent) {
            parent.add(obj);
            ResourceTree.RequestUpdate();
        }
        const inst = ResourceInstance.fromObject3D(obj, resData);
        inst.isObject3D = true;
        return inst;
    }
    override makeSyncResourceInstanceFromPath(resTree: ResourceTree): ResourceInstance {
        const resData = new ResourceData(this.thisResourceType(), resTree.resource_path, resTree);
        if (resTree.tree_parent) {
            const parentObj3d = resTree.tree_parent!.ensureInstance().asObject3D();
            return this.setupObject3dInstance(resData, parentObj3d);
        } else {
            console.log("Create parent-less object3d:" + resTree.fullPathStr() );
            return this.setupObject3dInstance(resData, null);
        }
    }
    override makeResourcePromiseFromPath(resTree:ResourceTree):Promise<ResourceData> {
        const resData = new ResourceData(this.thisResourceType(), resTree.resource_path, resTree);
        return new Promise((resolve) => {
            resolve(resData);
        });
    }
    override makeResourceInstanceFromLoaded(
        res:ResourceData,
        parent:THREE.Object3D)
        :Promise<ResourceInstance>
    {
        const inst = this.setupObject3dInstance(res, parent);
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
    is_resource_tree : boolean = false;
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
        this.is_resource_tree = true;
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
        return this.subResourceScene(name, parent, (a,b)=>{});
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
                callback(inst.inst_data as THREE.Object3D, res);
            });
            res.state_instance_callback(this.ensureInstance());
        }
        if (parent) {
            res.ensureInstance();
        }
        return res;
    }

    resourceLoadAsync():Promise<ResourceData> {
        console.assert(!this.state_disposed);
        if (this.state_loader) {
            return this.state_loader;
        }
        this.state_loader = this.resource_type.makeResourcePromiseFromPath(this);
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
        if (this.resource_type.isSyncAlloc()) {
            this.ensureInstance();
            console.assert(this.state_instancer != null);
            const syncInstancer = this.state_instancer!;
            return syncInstancer;
        }
        var _this = this;
        var prom = this.resourceLoadAsync();
        this.state_instancer = prom.then((subSceneData:ResourceData) => {
            var instProm = _this.resource_type.makeResourceInstanceFromLoaded(
                subSceneData, parentScene );
            instProm.then(inst => {
                console.assert(!_this.state_instance_latest);
                _this.state_instance_latest = inst;
                if (_this.state_instance_callback) {
                    _this.state_instance_callback(inst);
                }
            });
            return instProm;
        });
        return this.state_instancer;
    }

    ensureInstance():ResourceInstance {
        if (this.state_instance_latest) {
            return this.state_instance_latest;
        }
        if (this.resource_type.isSyncAlloc()) {
            const inst = this.resource_type.makeSyncResourceInstanceFromPath(this);
            this.state_instance_latest = inst;
            this.state_loaded_latest = inst.res_data;
            this.state_instancer = this.resource_type.simplePromise(inst);
            return this.state_instance_latest;
        }
        throw new Error("Ensure failed on ensureInstance");
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

    fullPath() : Array<string> {
        const ans : Array<string> = [];
        for ( var r : ResourceTree|null = this; r ; r = r.tree_parent ) {
            const cr = r;
            if (cr) {
                ans.push( cr.resource_path );
            }
        }
        return ans;
    }

    fullPathStr() : string {
        var lst = this.fullPath();
        return lst.join("/");
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

    resourceAddChild(child:ResourceTree) {
        console.assert(!child.tree_parent);
        child.tree_parent = this;
        this.tree_children.push(child);
    }

    resourceAddChildByPath(path:string, type=ResourceTree.TypeGeneric):ResourceTree {
        console.assert(!this.resourceFindByPath(path,false));
        var res = new ResourceTree(path, type);
        res.tree_parent = this;
        this.tree_children.push(res);
        if (type.isSyncAlloc()) {
            res.ensureInstance();
            
        }
        return res;
    }

};



export { ResourceTree, ResourceType, ResourceTypeJson, ResourceData, ResourceInstance }

