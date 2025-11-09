import * as THREE from 'three';
import { TempleLights } from './space_lights.js';
import { TempleSpaceSandBuilder } from './space_sand.js';
import { ResourceTree } from '../code/resource_tree.js';
import { SpaceTrainingBoxes } from './space_training_boxes.js';
var TempleSpace = /** @class */ (function () {
    function TempleSpace(world) {
        var _this_1 = this;
        this.world = world;
        this.scene = new THREE.Group();
        this.scene.name = "TempleSpace";
        world.worldScene.add(this.scene);
        this.levels = world.resourceRoot.subResourceSceneClean("ActiveSpaces", this.scene);
        this.resources = this.levels;
        this.registerLevelByCallback("Floor", function (k) {
            //new TempleSpaceDirectionsBuilder(k);
        });
        this.registerLevelByCallback("Map", function (k) {
            //new TempleSpaceMapBuilder(k);
        });
        this.registerLevelByCallback("Sand", function (k) {
            new TempleSpaceSandBuilder(k, world);
        });
        this.registerLevelByCallback("KalaChakra", function (k) {
            //new TempleSpaceKalaChakra(k);
        }, true);
        this.registerLevelByCallback("CodaChakra", function (k) {
            //new TempleSpaceCodaChakra(k);
        }, true);
        this.registerLevelByCallback("TrainingBoxes", function (k) {
            new SpaceTrainingBoxes(k, _this_1.resources);
        }, true);
        this.registerLevelByCallback("SpaceEastAltar0", function (k) {
            //new SpaceEastAltar0(k, this.resources);
        }, true);
        this.ensureLevel("Floor");
        this.ensureLevel("TrainingBoxes");
        //this.ensureLevel("Map");
        this.ensureLevel("Sand");
        var testUnload = false;
        if (testUnload) {
            this.testLevelLeaving();
        }
        this.lights = new TempleLights(this.scene);
    }
    TempleSpace.prototype.testLevelLeaving = function () {
        var _this = this;
        setTimeout(function () {
            _this.leaveLevel("Floor");
            ResourceTree.RequestUpdate();
            setTimeout(function () {
                _this.ensureLevel("Floor");
                ResourceTree.RequestUpdate();
            }, 1000);
        }, 1000);
    };
    TempleSpace.prototype.registerLevelByCallback = function (name, callback, autoLoad) {
        if (autoLoad === void 0) { autoLoad = false; }
        var res = this.levels.subResourceScene(name, this.scene, function (inst, instRes) {
            callback(inst);
        });
        if (autoLoad) {
            res.instanceAsync(this.scene);
        }
        return res;
    };
    TempleSpace.prototype.ensureLevel = function (name) {
        var res = this.levels.resourceFindByPath(name);
        if (res) {
            res.instanceAsync(this.scene);
            return res;
        }
        else {
            throw ("Unknown level '" + name + "'.");
        }
    };
    TempleSpace.prototype.leaveLevel = function (name) {
        var res = this.levels.resourceFindByPath(name);
        if (res) {
            res.disposeInstance();
            res.disposeLoad();
        }
    };
    return TempleSpace;
}());
export { TempleSpace };
