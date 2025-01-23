
import * as THREE from 'three';
import { CachedAlloc } from '../code/cachealloc.js'

class ControllerPhase {
    static None = "None";
    static Hold = "Hold";
    static Tap = "Tap";
    static LongPress = "LongPress";
    static LongTap = "LongTap";
    static Across = "Across";
};

class ControllerMode {
    static None = "None";
    static Walk = "Walk";
    static Run = "Run";
    static Look = "Look";
    static Aim = "Aim";
};

class ControllerStream {
    constructor() {
        this.isControllerStream = true;
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
    resetStream() {
        this.isActive = false;
        this.isStart = false;
        this.isEnd = false;
        this.isDown = false;
        this.phase = ControllerPhase.None;
        this.mode = ControllerMode.None;
        this.rawLengthPath = 0;
        this.rawLengthCurrent = 0;
    }
}

class ControllerGroup {
    constructor() {
        this.isControllerGroup = true;
        this.cache = new CachedAlloc(
            () => new ControllerStream(),
            (resetMe) => resetMe.resetStream());
        this.callbacks = [];
    }
    getActives() {
        return this.cache.active;
    }
    beginStream() {
        var stream = this.cache.alloc();
        //stream.resetStream();
        return stream;
    }
    endStream(str) {
        console.assert(str.isControllerStream);
        this.cache.free(str);
    }
    onControllerEvent(cntrl) {
        for (var i in this.callbacks) {
            var cb = this.callbacks[i];
            cb(cntrl);
        }
    }
    listenControllerEvent(callback) {
        this.callbacks.push(callback);
    }
};

export {
    ControllerGroup, ControllerStream,
    ControllerPhase, ControllerMode };
