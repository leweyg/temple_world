import { TempleTime } from './temple_time.js';
import { TempleAvatar } from './avatar/temple_avatar.js';
import { TempleSpace } from './spaces/temple_space.js';
import { ControllerGroup } from './controls/temple_controls.js';
import { ResourceTree } from './code/resource_tree.js';
import { TempleReflection } from './reflect/temple_reflection.js';
var TempleWorld = /** @class */ (function () {
    function TempleWorld(parentScene, cameraThree, requestRedrawCallback, devElement, devMenuOverlay, devMenuContent) {
        var _this = this;
        this.parentScene = parentScene;
        this.requestRedrawCallback = requestRedrawCallback;
        this.devElement = devElement;
        this.devMenuOverlay = devMenuOverlay;
        this.devMenuContent = devMenuContent;
        this.time = new TempleTime(requestRedrawCallback);
        this.reflector = new TempleReflection(this);
        ResourceTree.RequestUpdate = (function () { return _this.time.requestUpdate(); });
        this.resourceRoot = new ResourceTree("TempleWorld", ResourceTree.TypeThreeGroup);
        this.worldScene = this.resourceRoot.ensureInstance().asObject3D();
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
                this.devMenuContent.innerHTML = this.reflector.texter.drawHTMLReflection();
                this.devMenuOverlay.style.display = 'block';
                // Setup jump-to dropdown handler
                var selectElem = this.devMenuContent.querySelector('#jumpto-select');
                if (selectElem) {
                    selectElem.onchange = function (e) {
                        var value = e.target.value;
                        if (value) {
                            window.jumpToItem(value);
                            e.target.value = '';
                        }
                    };
                }
            }
            else {
                this.devMenuOverlay.style.display = 'none';
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
