// ResourceTree ans assocaited types:
//
// USAGE:
//  var allLoaded = new ResourceTree();
//  var tempScene = allLoaded.subResource("temp_scene");
//  tempScene.subResource("scene.json").instanceAsync(sceneParent);
//  tempScene.dispose();
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import * as THREE from 'three';
var ResourceData = /** @class */ (function () {
    function ResourceData(source_type, data, res) {
        this.data = null;
        this.source_type = source_type;
        this.data = data;
        this.res = res;
    }
    return ResourceData;
}());
var ResourceInstance = /** @class */ (function () {
    function ResourceInstance(inst, src_data, res_tree) {
        this.isObject3D = false;
        this.res_data = src_data;
        this.inst_data = inst;
    }
    ResourceInstance.fromObject3D = function (obj, src_data) {
        var inst = new ResourceInstance(obj, src_data, src_data.res);
        inst.isObject3D = true;
        return inst;
    };
    ResourceInstance.prototype.asObject3D = function () {
        console.assert(this.isObject3D);
        return this.inst_data;
    };
    return ResourceInstance;
}());
var ResourceType = /** @class */ (function () {
    function ResourceType() {
        this.name = "ResourceType";
    }
    ResourceType.prototype.isSceneType = function () { return false; };
    ResourceType.prototype.thisResourceType = function () { return this; };
    ResourceType.prototype.makeResourcePromiseFromPath = function (resTree) {
        throw "NotOverloaded: ResourceType.makeResourcePromiseFromPath";
    };
    ResourceType.prototype.makeResourceInstanceFromLoaded = function (res, parent) {
        throw "NotOverloaded: ResourceType.doResourceInstance";
    };
    ResourceType.prototype.releaseResourceInstance = function (inst) {
        throw "NotOverloaded: ResourceType.releaseResourceInstance";
    };
    ResourceType.prototype.releaseResourcePromise = function (data) {
        // usually empty nullify
    };
    ResourceType.prototype.simplePromise = function (value) {
        var ans = new Promise(function (resolve, reject) {
            resolve(value);
        });
        return ans;
    };
    return ResourceType;
}());
;
var ResourceTypeJson = /** @class */ (function (_super) {
    __extends(ResourceTypeJson, _super);
    function ResourceTypeJson() {
        var _this_1 = _super !== null && _super.apply(this, arguments) || this;
        _this_1.name = "ResourceTypeJson";
        return _this_1;
    }
    ResourceTypeJson.prototype.makeResourcePromiseFromPath = function (resTree) {
        var rt = this.thisResourceType();
        var ans = fetch(resTree.resource_path)
            .then(function (res) { return res.json(); })
            .then(function (res) { return new ResourceData(rt, res, resTree); });
        return ans;
    };
    ResourceTypeJson.prototype.makeResourceInstanceFromLoaded = function (res, parent) {
        throw "TODO";
    };
    return ResourceTypeJson;
}(ResourceType));
var ResourceTypeThreeGroup = /** @class */ (function (_super) {
    __extends(ResourceTypeThreeGroup, _super);
    function ResourceTypeThreeGroup() {
        var _this_1 = _super !== null && _super.apply(this, arguments) || this;
        _this_1.name = "ResourceTypeThreeGroup";
        return _this_1;
    }
    ResourceTypeThreeGroup.prototype.isSceneType = function () { return true; };
    ResourceTypeThreeGroup.prototype.makeResourcePromiseFromPath = function (resTree) {
        var _this_1 = this;
        return new Promise(function (resolve) {
            resolve(new ResourceData(_this_1.thisResourceType(), resTree.resource_path, resTree));
        });
    };
    ResourceTypeThreeGroup.prototype.makeResourceInstanceFromLoaded = function (res, parent) {
        var obj = new THREE.Group();
        obj.name = res.res.resource_path;
        if (parent) {
            parent.add(obj);
            ResourceTree.RequestUpdate();
        }
        var inst = ResourceInstance.fromObject3D(obj, res);
        inst.isObject3D = true;
        return new Promise(function (resolve) {
            resolve(inst);
        });
    };
    ResourceTypeThreeGroup.prototype.releaseResourceInstance = function (inst) {
        console.assert(inst.isObject3D);
        var obj = inst.asObject3D();
        if (obj.parent) {
            obj.parent.remove(obj);
        }
    };
    return ResourceTypeThreeGroup;
}(ResourceType));
var ResourceHelpers = /** @class */ (function () {
    function ResourceHelpers() {
    }
    ResourceHelpers.removeFromArray = function (array, item) {
        var index = array.indexOf(item);
        if (index > -1) { // only splice array when item is found
            array.splice(index, 1); // 2nd parameter means remove one item only
        }
        return array;
    };
    return ResourceHelpers;
}());
var ResourceTree = /** @class */ (function () {
    function ResourceTree(path, resource_type) {
        if (path === void 0) { path = ResourceTree.NameDefault; }
        if (resource_type === void 0) { resource_type = ResourceTree.TypeGeneric; }
        this.tree_parent = null;
        this.tree_children = [];
        this.state_disposed = false;
        this.state_instance_callback = null;
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
    ResourceTree.prototype.latestInstance = function () { return this.state_instance_latest; };
    ResourceTree.prototype.latestLoaded = function () { return this.state_loaded_latest; };
    ResourceTree.prototype.subResource = function (path, type) {
        if (type === void 0) { type = ResourceTree.TypeGeneric; }
        console.assert(!this.state_disposed);
        var existing = this.resourceFindByPath(path);
        if (existing)
            return existing;
        return this.resourceAddChildByPath(path, type);
    };
    ResourceTree.prototype.subResourceSceneClean = function (name, parent) {
        return this.subResourceScene(name, parent, function (a, b) { });
    };
    // Creates a scene-typed resource
    //  If a parent is given, the resource is instantiated
    //  If a callback is given, it is passed the created scene
    ResourceTree.prototype.subResourceScene = function (name, parent, callback) {
        var resExist = this.resourceFindByPath(name);
        if (resExist)
            return resExist;
        var res = this.resourceAddChildByPath(name, ResourceTree.TypeThreeGroup);
        if (callback) {
            res.state_instance_callback = (function (inst) {
                callback(inst.inst_data, res);
            });
        }
        if (parent) {
            res.instanceAsync(parent);
        }
        return res;
    };
    ResourceTree.prototype.resourceLoadAsync = function () {
        console.assert(!this.state_disposed);
        if (this.state_loader) {
            return this.state_loader;
        }
        this.state_loader = this.resource_type.makeResourcePromiseFromPath(this);
        var _this = this;
        this.state_loader.then(function (k) {
            if (k) {
                console.assert(!_this.state_loaded_latest);
                _this.state_loaded_latest = k;
            }
        });
        return this.state_loader;
    };
    ResourceTree.prototype.instanceAsync = function (parentScene) {
        console.assert(!this.state_disposed);
        if (this.state_instancer) {
            return this.state_instancer;
        }
        var _this = this;
        var prom = this.resourceLoadAsync();
        this.state_instancer = prom.then(function (subSceneData) {
            var instProm = _this.resource_type.makeResourceInstanceFromLoaded(subSceneData, parentScene);
            instProm.then(function (inst) {
                console.assert(!_this.state_instance_latest);
                _this.state_instance_latest = inst;
                if (_this.state_instance_callback) {
                    _this.state_instance_callback(inst);
                }
            });
            return instProm;
        });
        return this.state_instancer;
    };
    ResourceTree.prototype.instanceTrySync = function (parentScene) {
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
    };
    ResourceTree.prototype.disposeInstance = function () {
        if (this.state_instance_latest) {
            this.state_instance_latest = null;
        }
        if (this.state_instancer) {
            var _this = this;
            this.state_instancer.then(function (inst) {
                _this.resource_type.releaseResourceInstance(inst);
            });
            this.state_instancer = null;
        }
    };
    ResourceTree.prototype.disposeLoad = function () {
        this.state_loaded_latest = null;
        if (this.state_loader) {
            this.resource_type.releaseResourcePromise(this.state_loader);
            this.state_loader = null;
        }
    };
    ResourceTree.prototype.disposeTree = function () {
        if (this.tree_parent) {
            ResourceHelpers.removeFromArray(this.tree_parent.tree_children, this);
            this.tree_parent = null;
        }
    };
    ResourceTree.prototype.dispose = function () {
        this.disposeInstance();
        this.disposeLoad();
        this.disposeTree();
    };
    ResourceTree.prototype.resourceFindByPath = function (path, lookUp) {
        if (lookUp === void 0) { lookUp = true; }
        if (this.resource_path == path) {
            return this;
        }
        if (lookUp && this.tree_parent) {
            return this.tree_parent.resourceFindByPath(path);
        }
        for (var i in this.tree_children) {
            var child = this.tree_children[i];
            var ans = child.resourceFindByPath(path, false);
            if (ans)
                return ans;
        }
        return null;
    };
    ResourceTree.prototype.resourceAddChildByPath = function (path, type) {
        if (type === void 0) { type = ResourceTree.TypeGeneric; }
        console.assert(!this.resourceFindByPath(path, false));
        var res = new ResourceTree(path, type);
        res.tree_parent = this;
        this.tree_children.push(res);
        return res;
    };
    ResourceTree.NameDefault = "(resource_root)";
    ResourceTree.TypeGeneric = new ResourceType();
    ResourceTree.TypeThreeGroup = new ResourceTypeThreeGroup();
    ResourceTree.TypeJson = new ResourceTypeJson();
    ResourceTree.RequestUpdate = (function () { });
    return ResourceTree;
}());
;
export { ResourceTree, ResourceType, ResourceTypeJson, ResourceData, ResourceInstance };
