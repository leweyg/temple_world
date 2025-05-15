import * as THREE from 'three';
import { TempleSpaceDirectionsBuilder } from './space_directions.js';
import { TempleLights } from './space_lights.js';
import { TempleSpaceKalaChakra } from './space_kalachakra.js';
import { TempleSpaceCodaChakra } from './space_codachakra.js';
import { ResourceTree } from '../code/resource_tree.js';
import { SpaceTrainingBoxes } from './space_training_boxes.js';
import { SpaceEastAltar0 } from './east/altars/space_east_altar_0.js';
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
            new TempleSpaceDirectionsBuilder(k);
        });
        this.registerLevelByCallback("KalaChakra", function (k) {
            new TempleSpaceKalaChakra(k);
        }, true);
        this.registerLevelByCallback("CodaChakra", function (k) {
            new TempleSpaceCodaChakra(k);
        }, true);
        this.registerLevelByCallback("TrainingBoxes", function (k) {
            new SpaceTrainingBoxes(k, _this_1.resources);
        }, true);
        this.registerLevelByCallback("SpaceEastAltar0", function (k) {
            new SpaceEastAltar0(k, _this_1.resources);
        }, true);
        this.ensureLevel("Floor");
        this.ensureLevel("TrainingBoxes");
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
