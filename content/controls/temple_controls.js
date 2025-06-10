import * as THREE from 'three';
import { CachedAlloc } from '../code/cachealloc.js';
var ControllerPhase = /** @class */ (function () {
    function ControllerPhase() {
    }
    ControllerPhase.None = "None";
    ControllerPhase.Hold = "Hold";
    ControllerPhase.Tap = "Tap";
    ControllerPhase.LongPress = "LongPress";
    ControllerPhase.LongTap = "LongTap";
    ControllerPhase.Across = "Across";
    return ControllerPhase;
}());
;
var ControllerMode = /** @class */ (function () {
    function ControllerMode() {
    }
    ControllerMode.None = "None";
    ControllerMode.Walk = "Walk";
    ControllerMode.Run = "Run";
    ControllerMode.Look = "Look";
    ControllerMode.Aim = "Aim";
    ControllerMode.RotatingObject = "RotatingObject";
    ControllerMode.DevMenu = "DevMenu";
    return ControllerMode;
}());
;
var ControllerStream = /** @class */ (function () {
    function ControllerStream() {
        this.isControllerStream = true;
        this.unitLen = 0;
        this.isActive = false;
        this.isStart = false;
        this.isEnd = false;
        this.isDown = false;
        this.isButton = false;
        this.isGestureStart = false;
        this.isGestureDrag = false;
        this.isGestureHold = false;
        this.isGestureTap = false;
        this.phase = ControllerPhase.None;
        this.mode = ControllerMode.None;
        this.rawLengthPath = 0;
        this.rawLengthCurrent = 0;
        this.rawId = -1;
        this.resetStream();
        this.rawInitial = new THREE.Vector3();
        this.rawCurrent = new THREE.Vector3();
        this.rawRange = new THREE.Vector3();
        this.rawPrevious = new THREE.Vector3();
        this.rawDelta = new THREE.Vector3();
        this.unitInitial = new THREE.Vector3();
        this.unitCurrent = new THREE.Vector3();
    }
    ControllerStream.prototype.resetStream = function () {
        //console.log("Controller stream reset: " + this.rawId);
        this.isActive = false;
        this.isStart = false;
        this.isEnd = false;
        this.isDown = false;
        this.phase = ControllerPhase.None;
        this.mode = ControllerMode.None;
        this.rawLengthPath = 0;
        this.rawLengthCurrent = 0;
        this.isGestureStart = true;
        this.isGestureDrag = false;
        this.isGestureHold = false;
        this.isGestureTap = false;
    };
    ControllerStream.prototype.changeMode = function (mode) {
        if (this.mode == mode) {
            return;
        }
        this.mode = mode;
    };
    return ControllerStream;
}());
var ControllerGroup = /** @class */ (function () {
    function ControllerGroup() {
        this.isControllerGroup = true;
        this.isControllerGroup = true;
        this.cache = new CachedAlloc(function () { return new ControllerStream(); }, function (resetMe) { return resetMe.resetStream(); });
        this.callbacks = [];
    }
    ControllerGroup.prototype.getActives = function () {
        return this.cache.active;
    };
    ControllerGroup.prototype.beginStream = function () {
        var stream = this.cache.alloc();
        //stream.resetStream();
        return stream;
    };
    ControllerGroup.prototype.endStream = function (str) {
        console.assert(str.isControllerStream);
        this.cache.free(str);
    };
    ControllerGroup.prototype.onControllerEvent = function (cntrl) {
        for (var i in this.callbacks) {
            var cb = this.callbacks[i];
            cb(cntrl);
        }
    };
    ControllerGroup.prototype.listenControllerEvent = function (callback) {
        this.callbacks.push(callback);
    };
    return ControllerGroup;
}());
;
export { ControllerGroup, ControllerStream, ControllerPhase, ControllerMode };
