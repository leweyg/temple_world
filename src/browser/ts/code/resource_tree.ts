
// ResourceTree ans assocaited types:
//
// USAGE:
//  var allLoaded = new ResourceTree();
//  var tempScene = allLoaded.subResource("temp_scene");
//  tempScene.subResource("scene.json").instanceAsync(sceneParent);
//  tempScene.dispose();

import * as THREE from 'three';

class ResourceData {
    source_type : ResourceType;
    data : any = null;

    constructor(source_type:ResourceType, data:any) {
        this.source_type = source_type;
        this.data = data;
    }
}

class ResourceInstance {
    src_data !: ResourceData;
    inst : any;

    constructor(src_data:ResourceData, inst: any) {
        this.src_data = src_data;
        this.inst = inst;
    }
}

class ResourceType {
    name="ResourceType"

    isSceneType() { return false; }
    thisResourceType():ResourceType { return this; }
    makeResourcePromiseFromPath(path:string)
        :Promise<ResourceData> {
        throw "NotOverloaded: ResourceType.makeResourcePromiseFromPath";
    }
    makeResourceInstanceFromLoaded(
        res:ResourceData,
        parent:THREE.Object3D,
        parentRes:ResourceTree)
        :Promise<ResourceInstance>{
        throw "NotOverloaded: ResourceType.doResourceInstance";
    }
    releaseResourceInstance(inst:ResourceInstance) {
        throw "NotOverloaded: ResourceType.releaseResourceInstance";
    }
    releaseResourcePromise(data:ResourceData) {
        // usually empty nullify
    }
    simplePromise<T>(value: T): Promise<T> {
        return Promise.resolve(value) as Promise<T>;
    }

};

class ResourceTypeJson extends ResourceType {
    name="ResourceTypeJson"
    override makeResourcePromiseFromPath(path:string)
        : Promise<ResourceData> {
        var rt = this.thisResourceType();
        var ans = fetch(path)
            .then(res => res.json())
            .then(res => new ResourceData(rt,res));
        return ans;
    }
    override makeResourceInstanceFromLoaded(
        res:ResourceData,
        parent:THREE.Object3D,
        parentRes:ResourceTree) {
        throw "TODO";
    }
}

class ResourceTypeThreeGroup extends ResourceType {
    name="ResourceTypeThreeGroup"
    isSceneType() { return true; }
    override makeResourcePromiseFromPath(path) {
        return new Promise((resolve) => {
            resolve(path);
        });
    }
    override releaseResourcePromise(loader) {
    }
    makeResourceInstanceFromLoaded(res, parent, parentRes) {
        var obj = new THREE.Group();
        obj.name = res;
        if (parent) {
            parent.add(obj);
            ResourceTree.RequestUpdate();
        }
        return new Promise((resolve) => {
            resolve(obj);
        });
    }
    releaseResourceInstance(inst) {
        console.assert(inst.isObject3D);
        if (inst.parent) {
            inst.parent.remove(inst);
        }
    }
}


class ResourceHelpers {
    static removeFromArray(array, item) {
        const index = array.indexOf(item);
        if (index > -1) { // only splice array when item is found
            array.splice(index, 1); // 2nd parameter means remove one item only
        }
        return array;
    }
}

class ResourceTree {
    resource_path : string;
    resource_type : ResourceType;
    tree_parent : ResourceTree|null = null;
    tree_children : Array<ResourceTree> = [];

    state_disposed = false;

    constructor(path:string=ResourceTree.NameDefault, resource_type=ResourceTree.TypeGeneric) {
        // Resource:
        this.resource_path = path;
        this.resource_type = (resource_type) ? resource_type : ResourceTree.TypeGeneric;
        this.state_loader = null;
        this.state_loaded_latest = null;
        this.state_instancer = null;
        this.state_instance_callback = null;
        this.state_instance_latest = null;
        this.state_disposed = false;
    }

    static NameDefault = "(resource_root)";
    static TypeGeneric = new ResourceType();
    static TypeThreeGroup = new ResourceTypeThreeGroup();
    static TypeJson = new ResourceTypeJson();
    static RequestUpdate = (() => {});

    subResource(path:string, type=ResourceTree.TypeGeneric):ResourceTree {
        console.assert(!this.state_disposed);
        var existing = this.resourceFindByPath(path);
        if (existing) return existing;
        return this.resourceAddChildByPath(path, type);
    }

    // Creates a scene-typed resource
    //  If a parent is given, the resource is instantiated
    //  If a callback is given, it is passed the created scene
    subResourceScene(name:string, parent=null, callback=null) {
        var res = this.resourceFindByPath(name);
        if (res) return res;

        var res = this.resourceAddChildByPath(name, ResourceTree.TypeThreeGroup);
        res.state_instance_callback = callback;
        if (parent) {
            res.instanceAsync(parent);
        }
        return res;
    }

    resourceLoadAsync() {
        console.assert(!this.state_disposed);
        if (this.state_loader) {
            return this.state_loader;
        }
        console.assert(this.resource_type);
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

    instanceAsync(parent) {
        console.assert(!this.state_disposed);
        if (this.state_instancer) {
            return this.state_instancer;
        }
        var _this = this;
        var prom = this.resourceLoadAsync();
        this.state_instancer = prom.then(subScene => {
            var instProm = _this.resource_type.makeResourceInstanceFromLoaded(
                subScene, parent, _this );
            console.assert(instProm);
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

    instanceTrySync() {
        if (this.state_instance_latest) {
            return this.state_instance_latest;
        }
        // begin request:
        if (!this.state_instancer) {
            this.instanceAsync();
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



export { ResourceTree, ResourceType, ResourceTypeJson }

