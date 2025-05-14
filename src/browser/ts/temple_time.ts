import * as THREE from 'three';
import { CachedAlloc } from './code/cachealloc.js'

class TempleTime {
    requestRedrawCallback : ()=>void;
    timeUsers : CachedAlloc<TimeUser>;
    realtimeUsers : CachedAlloc<RealtimeUser>;

    timeWallStarted: number;
    timeWallPrevious : number;
    timeWallStep : number;
    realDt : number;

    timeVirtualRate : number;
    timeVirtualStarted : number;
    timeVirtualStep : number;
    dt : number;
    timeVirtualCurrent : number;
    timeVirtualPrevious : number;

    timeCallbacks : Array<()=>void>;
    updateIsRequested : boolean;
    updateHzMax : number;
    updateRealtimeCountdown : number;
    updateCallbackInternal : ()=>void;


    constructor(requestRedrawCallback : ()=>void) {

        this.requestRedrawCallback = requestRedrawCallback;

        var _this = this;
        this.timeUsers = new CachedAlloc<TimeUser>(
            () => new TimeUser(_this),
            (tu:TimeUser) => tu.resetTimeUser());
        this.realtimeUsers = new CachedAlloc<RealtimeUser>(
            () => new RealtimeUser(_this),
            (tu:RealtimeUser)=>{} );

        this.timeWallStarted = TempleTime.timeNowSeconds();
        this.timeWallPrevious = this.timeWallStarted;
        this.timeWallStep = 0.0;
        this.realDt = this.timeWallStep; // real world delta-time
        
        this.timeVirtualRate = 1.0;
        this.timeVirtualStarted = 100.0; // arbitrary, non-zero for clarity
        this.timeVirtualStep = 0.0;
        this.dt = this.timeVirtualStep; // delta-time
        this.timeVirtualCurrent = this.timeVirtualStarted;
        this.timeVirtualPrevious = this.timeVirtualStarted;

        this.timeCallbacks = [];
        this.updateIsRequested = false;
        this.updateHzMax = 60;
        this.updateRealtimeCountdown = 0.0;
        this.updateCallbackInternal = (() => _this.onTimeInterupt());
    }

    requestRealtimeForDuration(duration = 1.0) {
        if (duration > this.updateRealtimeCountdown) {
            this.updateRealtimeCountdown = duration;
        }
        this.requestUpdate();
    }

    requestUpdate(isForce=false) {
        if (this.updateIsRequested && !isForce) {
            return; // already requested
        }
        this.updateIsRequested = true;
        var _this = this;
        const minTimeoutMS = 1000.0 / (3.0 * this.updateHzMax);
        // TODO: make sure only one request at a time
        setTimeout(this.updateCallbackInternal, minTimeoutMS);
    }

    listenToTime(callback:()=>void) {
        var listner = this.timeUsers.alloc();
        listner.callback = callback;
        return listner;
    }

    listenInRealtime(callback:()=>void) {
        var listner = this.realtimeUsers.alloc();
        listner.callback = callback;
        return listner;
    }

    isRealtimeActive() {
        if (this.updateRealtimeCountdown > 0) {
            return true;
        }
        if (!(this.realtimeUsers.isEmpty())) {
            return true;
        }
        return false;
    }

    onTimeInterupt() {
        this.updateIsRequested = false;
        const cur = TempleTime.timeNowSeconds();
        const delta = cur - this.timeWallPrevious;
        const minTimeStep = 1.0 / this.updateHzMax;
        if (delta >= minTimeStep) {
            this.requestRedrawCallback();
            if (this.isRealtimeActive()) {
                this.requestUpdate();
            }
            return true;
        } else {
            // request again:
            this.requestUpdate();
            return false;
        }
    }

    stepTime() {
        var cur = TempleTime.timeNowSeconds();
        var delta = cur - this.timeWallPrevious;
        const maxTimeStep = 1.0 / 5.0;
        if (delta > maxTimeStep) {
            delta = maxTimeStep;
        }
        this.timeWallPrevious = cur;
        this.timeWallStep = delta;
        this.realDt = this.timeWallStep;

        this.timeVirtualStep = delta * this.timeVirtualRate;
        this.timeVirtualPrevious = this.timeVirtualCurrent;
        this.timeVirtualCurrent += this.timeVirtualStep;
        this.dt = this.timeVirtualStep;

        var realtimeLeft = this.updateRealtimeCountdown;
        if (realtimeLeft > 0) {
            realtimeLeft -= this.realDt;
            if (realtimeLeft < 0) {
                realtimeLeft = 0;
            }
            this.updateRealtimeCountdown = realtimeLeft;
        }

        this.dispatchTime();
    }

    dispatchTime() {
        for (var i in this.realtimeUsers.active) {
            var tl = this.realtimeUsers.active[i];
            if (tl.callback) {
                tl.callback();
            }
        }
        for (var i in this.timeUsers.active) {
            var tr = this.timeUsers.active[i];
            tr.callback();
        }
    }

    static mathSign(x:number):number {
        return ((x>=0.0)?1.0:-1.0);
    }

    fadeFloatRealTime(from:number, to:number, distPerSecond=1.0):number {
        const dt = this.realDt;
        const maxChange = dt * distPerSecond;
        const curChange = (to - from);
        const absChange = Math.abs( curChange );
        if (absChange < maxChange) {
            return to;
        } else {
            const dv = maxChange * TempleTime.mathSign( curChange );
            return from + dv;
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
    name : string;
    timer:TempleTime;
    isTimeUser : boolean;
    callback : ()=>void;

    constructor(timer:TempleTime) {
        this.isTimeUser = true;
        this.timer = timer;
        this.name = "unnamed";
        this.callback = ()=>{};
    }
    resetTimeUser() {

    }
    dispose() {
        this.timer.timeUsers.free(this);
    }
};

class RealtimeUser {
    name : string;
    isRealtimeUser : boolean;
    timer : TempleTime;
    callback : ()=>void;

    constructor(timer : TempleTime) {
        this.isRealtimeUser = true;
        this.timer = timer;
        this.name = "unnamed";
        this.callback =  ()=>{};
    }
    dispose() {
        this.timer.realtimeUsers.free(this);
    }
};

export { TempleTime };
