
// ResourceTree ans assocaited types:
//
// USAGE:
//  var allLoaded = new ResourceTree();
//  var tempScene = allLoaded.subResource("temp_scene");
//  tempScene.subResource("scene.json").instanceAsync(sceneParent);
//  tempScene.dispose();

import * as THREE from 'three';

class ResourceType {
    isSceneType() { return false; }
    makeResourcePromiseFromPath(path) {
        throw "NotOverloaded: ResourceType.makeResourcePromiseFromPath";
    }
    makeResourceInstanceFromLoaded(res, parent, parentRes) {
        throw "NotOverloaded: ResourceType.doResourceInstance";
    }
    releaseResourceInstance(inst) {
        throw "NotOverloaded: ResourceType.releaseResourceInstance";
    }
    releaseResourcePromise(loader) {
        // usually empty nullify
    }
    simplePromise(val) {
        return new Promise((resolve) => {
            resolve(val);
        });
    }

};

class ResourceTypeJson extends ResourceType {
    makeResourcePromiseFromPath(path) {
        var ans = fetch(`.../get/user/by/${id}`);
        ans = ans.then(res => res.json());
        return ans;
    }
    makeResourceInstanceFromLoaded(res, parent, parentRes) {
        throw "TODO";
    }
}

class ResourceTypeThreeGroup extends ResourceType {
    isSceneType() { return true; }
    makeResourcePromiseFromPath(path) {
        return new Promise((resolve) => {
            resolve(path);
        });
    }
    releaseResourcePromise(loader) {
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
    constructor(path=ResourceTree.NameDefault, resource_type=ResourceTree.TypeGeneric) {
        console.assert(path);
        // Resource:
        this.resource_path = path;
        this.resource_type = (resource_type) ? resource_type : ResourceTree.TypeGeneric;
        this.state_loader = null;
        this.state_instancer = null;
        this.state_instance_callback = null;
        this.state_instance_latest = null;
        this.state_disposed = false;

        // Tree:
        this.tree_children = [];
        this.tree_parent = null;
    }

    static NameDefault = "(resource_root)";
    static TypeGeneric = new ResourceType();
    static TypeThreeGroup = new ResourceTypeThreeGroup();
    static TypeJson = new ResourceTypeJson();
    static RequestUpdate = (() => {});

    subResource(path, type=ResourceTree.TypeGeneric) {
        console.assert(!this.state_disposed);
        var existing = this.resourceFindByPath(path);
        if (existing) return existing;
        return this.resourceAddChildByPath(path, type);
    }

    // Creates a scene-typed resource
    //  If a parent is given, the resource is instantiated
    //  If a callback is given, it is passed the created scene
    subResourceScene(name, parent=null, callback=null) {
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
                console.assert(!_this.state_loaded);
                _this.state_loaded = k;
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
        this.state_loaded = null;
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

    resourceFindByPath(path, lookUp=true) {
        console.assert(path);
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
        return undefined;
    }

    resourceAddChildByPath(path, type=ResourceTree.TypeGeneric) {
        console.assert(!this.resourceFindByPath(path,false));
        var res = new ResourceTree(path, type);
        res.tree_parent = this;
        this.tree_children.push(res);
        return res;
    }

};



export { ResourceTree, ResourceType }

