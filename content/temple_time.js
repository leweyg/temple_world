import * as THREE from 'three';
import { CachedAlloc } from './code/cachealloc.js'

class TempleTime {
    constructor(requestRedrawCallback) {

        this.requestRedrawCallback = requestRedrawCallback;
        
        var _this = this;
        this.timeUsers = new CachedAlloc(() => new TimeUser(_this));
        this.realtimeUsers = new CachedAlloc(() => new RealtimeUser(_this));

        this.timeWallStarted = TempleTime.timeNowSeconds();
        this.timeWallPrevious = this.timeWallStarted;
        this.timeWallStep = 0.0;
        
        this.timeVirtualRate = 1.0;
        this.timeVirtualStarted = 100.0; // arbitrary, non-zero for clarity
        this.timeVirtualStep = 0.0;
        this.timeVirtualCurrent = this.timeVirtualStarted;
        this.timeVirtualPrevious = this.timeVirtualStarted;

        this.timeCallbacks = [];
    }

    requestUpdate() {
        this.requestRedrawCallback();
    }

    listenToTime(callback) {
        var listner = this.timeUsers.alloc();
        listner.callback = callback;
        return listner;
    }

    listenInRealtime(callback) {
        var listner = this.realtimeUsers.alloc();
        listner.callback = callback;
        return listner;
    }

    stepTime() {
        var cur = TempleTime.timeNowSeconds();
        var delta = cur - this.timeWallPrevious;
        this.timeWallPrevious = cur;
        this.timeWallStep = delta;

        this.timeVirtualStep = delta * this.timeVirtualRate;
        this.timeVirtualPrevious = this.timeVirtualCurrent;
        this.timeVirtualCurrent += this.timeVirtualStep;

        for (var i in this.realtimeUsers.active) {
            var tl = this.realtimeUsers.active[i];
            tl.callback(this);
        }
        for (var i in this.timeUsers.active) {
            var tl = this.timeUsers.active[i];
            tl.callback(this);
        }
    }

    static timeNowSeconds() {
        var tm = new Date();
        var secs = tm.getTime() / 1000;
        return secs;
    }

    static primary = null;
};


class TimeUser {
    constructor(timer) {
        this.isTimeUser = true;
        this.timer = timer;
        this.name = "unnamed";
        this.callback = null;
    }
    dispose() {
        this.timer.timeUsers.free(this);
    }
};

class RealtimeUser {
    constructor(timer) {
        this.isRealtimeUser = true;
        this.timer = timer;
        this.name = "unnamed";
        this.callback = null;
    }
    dispose() {
        this.timer.realtimeUsers.free(this);
    }
};

export { TempleTime };
