import * as THREE from 'three';
import { CachedAlloc } from './code/cachealloc.js'

class TempleTime {
    constructor(requestRedrawCallback) {
        this.requestRedrawCallback = requestRedrawCallback;
        this.realtimeUsers = new CachedAlloc(() => new RealtimeUser());

        this.timeWallStarted = TempleTime.timeNowSeconds();
        this.timeWallPrevious = this.timeWallStarted;
        this.timeWallStep = 0.0;
        
        this.timeVirtualRate = 1.0;
        this.timeVirtualStarted = 100.0; // arbitrary, non-zero for clarity
        this.timeVirtualStep = 0.0;
        this.timeVirtualCurrent = this.timeVirtualStarted;
        this.timeVirtualPrevious = this.timeVirtualStarted;
    }

    requestUpdate() {
        this.requestRedrawCallback();
    }

    realtimeBegin() {
        return this.realtimeUsers.alloc();
    }

    realtimeEnd(token) {
        this.realtimeUsers.free(token);
    }

    stepTime() {
        var cur = TempleTime.timeNowSeconds();
        var delta = cur - this.timeWallPrevious;
        this.timeWallPrevious = cur;
        this.timeWallStep = delta;

        this.timeVirtualStep = delta * this.timeVirtualRate;
        this.timeVirtualPrevious = this.timeVirtualCurrent;
        this.timeVirtualCurrent += this.timeVirtualStep;

    }

    static timeNowSeconds() {
        var tm = new Date();
        var secs = tm.getTime() / 1000;
        return secs;
    }
};

class RealtimeUser {
    constructor() {
        this.isRealtimeUser = true;
        this.name = "unnamed";
    }
};

export { TempleTime };
