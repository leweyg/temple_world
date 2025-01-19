
import * as THREE from 'three';
import { CachedAlloc } from '../code/cachealloc.js'

class ControllerMode {
    None = "None";
    Hold = "Hold";
    Tap = "Tap";
    LongPress = "LongPress";
    Move = "Move";
    Run = "Run";
    Look = "Look";
    Aim = "Aim";
};

class ControllerStream {
    constructor() {
        this.isControllerStream = true;
        this.resetStream();
        this.rawInitial = new THREE.Vector3();
        this.rawCurrent = new THREE.Vector3();
        this.unitInitial = new THREE.Vector3();
        this.unitCurrent = new THREE.Vector3();
    }
    resetStream() {
        this.isActive = false;
        this.mode = ControllerMode.None;
        this.rawLengthPath = 0;
        this.rawLengthCurrent = 0;
    }
}

class ControllerGroup {
    constructor() {
        this.isControllerGroup = true;
        this.cache = new CachedAlloc(() => new ControllerStream());
        this.callbacks = [];
    }
    beginStream() {
        return this.cache.alloc();
    }
    endStream(str) {
        console.assert(str.isControllerStream);
        this.cache.free(str);
    }
    onControllerEvent(cntrl, isStart, isEnd) {
        for (var i in this.callbacks) {
            var cb = this.callbacks[i];
            cb(cntrl, isStart, isEnd);
        }
    }
    listenControllerEvent(callback) {
        this.callbacks.push(callback);
    }
};

export { ControllerGroup, ControllerStream, ControllerMode };
