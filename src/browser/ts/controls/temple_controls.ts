
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
    static RotatingObject = "RotatingObject";
    static DevMenu = "DevMenu";
};

class ControllerStream {
    isControllerStream = true;
    rawId : number;
    rawInitial : THREE.Vector3;
    rawCurrent : THREE.Vector3;
    rawRange : THREE.Vector3;
    rawPrevious : THREE.Vector3;
    rawDelta : THREE.Vector3;
    unitInitial : THREE.Vector3;
    unitCurrent : THREE.Vector3;
    unitLen : number = 0;

    isActive = false;
    isStart = false;
    isEnd = false;
    isDown = false;
    isButton = false;
    phase = ControllerPhase.None;
    mode = ControllerMode.None;
    rawLengthPath = 0;
    rawLengthCurrent = 0;

    constructor() {
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
    isControllerGroup = true;
    cache : CachedAlloc<ControllerStream>;
    callbacks : Array<(arg:ControllerStream)=>void>;

    constructor() {
        this.isControllerGroup = true;
        this.cache = new CachedAlloc(
            () => new ControllerStream(),
            (resetMe) => resetMe.resetStream());
        this.callbacks = [];
    }
    getActives():ControllerStream[] {
        return this.cache.active;
    }
    beginStream():ControllerStream {
        var stream = this.cache.alloc();
        //stream.resetStream();
        return stream;
    }
    endStream(str:ControllerStream) {
        console.assert(str.isControllerStream);
        this.cache.free(str);
    }
    onControllerEvent(cntrl:ControllerStream) {
        for (var i in this.callbacks) {
            var cb = this.callbacks[i];
            cb(cntrl);
        }
    }
    listenControllerEvent(callback : (arg:ControllerStream)=>void ) {
        this.callbacks.push(callback);
    }
};

export {
    ControllerGroup, ControllerStream,
    ControllerPhase, ControllerMode };
