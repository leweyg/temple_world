import { CachedAlloc } from './code/cachealloc.js';
var TempleTime = /** @class */ (function () {
    function TempleTime(requestRedrawCallback) {
        this.requestRedrawCallback = requestRedrawCallback;
        var _this = this;
        this.timeUsers = new CachedAlloc(function () { return new TimeUser(_this); }, function (tu) { return tu.resetTimeUser(); });
        this.realtimeUsers = new CachedAlloc(function () { return new RealtimeUser(_this); }, function (tu) { });
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
        this.updateCallbackInternal = (function () { return _this.onTimeInterupt(); });
    }
    TempleTime.prototype.requestRealtimeForDuration = function (duration) {
        if (duration === void 0) { duration = 1.0; }
        if (duration > this.updateRealtimeCountdown) {
            this.updateRealtimeCountdown = duration;
        }
        this.requestUpdate();
    };
    TempleTime.prototype.requestUpdate = function (isForce) {
        if (isForce === void 0) { isForce = false; }
        if (this.updateIsRequested && !isForce) {
            return; // already requested
        }
        this.updateIsRequested = true;
        var _this = this;
        var minTimeoutMS = 1000.0 / (3.0 * this.updateHzMax);
        // TODO: make sure only one request at a time
        setTimeout(this.updateCallbackInternal, minTimeoutMS);
    };
    TempleTime.prototype.listenToTime = function (callback) {
        var listner = this.timeUsers.alloc();
        listner.callback = callback;
        return listner;
    };
    TempleTime.prototype.listenInRealtime = function (callback) {
        var listner = this.realtimeUsers.alloc();
        listner.callback = callback;
        return listner;
    };
    TempleTime.prototype.isRealtimeActive = function () {
        if (this.updateRealtimeCountdown > 0) {
            return true;
        }
        if (!(this.realtimeUsers.isEmpty())) {
            return true;
        }
        return false;
    };
    TempleTime.prototype.onTimeInterupt = function () {
        this.updateIsRequested = false;
        var cur = TempleTime.timeNowSeconds();
        var delta = cur - this.timeWallPrevious;
        var minTimeStep = 1.0 / this.updateHzMax;
        if (delta >= minTimeStep) {
            this.requestRedrawCallback();
            if (this.isRealtimeActive()) {
                this.requestUpdate();
            }
            return true;
        }
        else {
            // request again:
            this.requestUpdate();
            return false;
        }
    };
    TempleTime.prototype.stepTime = function () {
        var cur = TempleTime.timeNowSeconds();
        var delta = cur - this.timeWallPrevious;
        var maxTimeStep = 1.0 / 5.0;
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
    };
    TempleTime.prototype.dispatchTime = function () {
        for (var i in this.realtimeUsers.active) {
            var tl = this.realtimeUsers.active[i];
            if (tl.callback) {
                tl.callback();
            }
        }
        for (var i in this.timeUsers.active) {
            var tr = this.timeUsers.active[i];
            tr.callback(this);
        }
    };
    TempleTime.mathSign = function (x) {
        return ((x >= 0.0) ? 1.0 : -1.0);
    };
    TempleTime.prototype.fadeFloatRealTime = function (from, to, distPerSecond) {
        if (distPerSecond === void 0) { distPerSecond = 1.0; }
        var dt = this.realDt;
        var maxChange = dt * distPerSecond;
        var curChange = (to - from);
        var absChange = Math.abs(curChange);
        if (absChange < maxChange) {
            return to;
        }
        else {
            var dv = maxChange * TempleTime.mathSign(curChange);
            return from + dv;
        }
    };
    TempleTime.timeNowSeconds = function () {
        var tm = new Date();
        var secs = tm.getTime() / 1000;
        return secs;
    };
    TempleTime.primary = null;
    return TempleTime;
}());
;
var TimeUser = /** @class */ (function () {
    function TimeUser(timer) {
        this.isTimeUser = true;
        this.timer = timer;
        this.name = "unnamed";
        this.callback = function () { };
    }
    TimeUser.prototype.resetTimeUser = function () {
    };
    TimeUser.prototype.dispose = function () {
        this.timer.timeUsers.free(this);
    };
    return TimeUser;
}());
;
var RealtimeUser = /** @class */ (function () {
    function RealtimeUser(timer) {
        this.isRealtimeUser = true;
        this.timer = timer;
        this.name = "unnamed";
        this.callback = function () { };
    }
    RealtimeUser.prototype.dispose = function () {
        this.timer.realtimeUsers.free(this);
    };
    return RealtimeUser;
}());
;
export { TempleTime };
