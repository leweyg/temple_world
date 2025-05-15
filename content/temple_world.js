import * as THREE from 'three';
import { TempleTime } from './temple_time.js';
import { TempleAvatar } from './avatar/temple_avatar.js';
import { TempleSpace } from './spaces/temple_space.js';
import { ControllerGroup } from './controls/temple_controls.js';
import { ResourceTree } from './code/resource_tree.js';
import { TempleReflection } from './reflect/temple_reflection.js';
var TempleWorld = /** @class */ (function () {
    function TempleWorld(parentScene, cameraThree, requestRedrawCallback, devElement) {
        var _this = this;
        this.parentScene = parentScene;
        this.requestRedrawCallback = requestRedrawCallback;
        this.devElement = devElement;
        this.time = new TempleTime(requestRedrawCallback);
        this.reflector = new TempleReflection(this);
        ResourceTree.RequestUpdate = (function () { return _this.time.requestUpdate(); });
        this.resourceRoot = new ResourceTree();
        this.worldScene = new THREE.Group();
        this.worldScene.name = "TempleWorld";
        parentScene.add(this.worldScene);
        this.space = new TempleSpace(this);
        this.controlGroup = new ControllerGroup();
        this.avatar = new TempleAvatar(this, cameraThree, this.controlGroup);
        this.stats = new TempleWorldStats();
    }
    TempleWorld.prototype.onPreRender = function () {
        this.stats.count_renders++;
        this.time.stepTime();
        if (this.avatar.controls.isDevModeChanged) {
            this.avatar.controls.isDevModeChanged = false;
            if (this.avatar.controls.isDevMode) {
                this.devElement.textContent = this.reflector.texter.drawTextReflection();
            }
            else {
                this.devElement.textContent = "~";
            }
        }
    };
    return TempleWorld;
}());
var TempleWorldStats = /** @class */ (function () {
    function TempleWorldStats() {
        this.count_renders = 0;
    }
    return TempleWorldStats;
}());
export { TempleWorld };
