var CachedAlloc = /** @class */ (function () {
    function CachedAlloc(allocCallback, resetCallback) {
        this.active = [];
        this.cached = [];
        this.allocCallback = allocCallback;
        this.resetCallback = resetCallback;
        this.active = [];
        this.cached = [];
    }
    CachedAlloc.prototype.isEmpty = function () {
        return (this.active.length == 0);
    };
    CachedAlloc.prototype.alloc = function () {
        var cur = this.internalAlloc();
        if (this.resetCallback) {
            this.resetCallback(cur);
        }
        this.active.push(cur);
        return cur;
    };
    CachedAlloc.prototype.free = function (cur) {
        var ndx = this.active.indexOf(cur);
        console.assert(ndx >= 0);
        this.active.splice(ndx, 1);
        ndx = this.active.indexOf(cur);
        console.assert(ndx < 0);
        this.cached.push(cur);
    };
    CachedAlloc.prototype.internalAlloc = function () {
        if (this.cached.length > 0) {
            var cur = this.cached.pop();
            return cur;
        }
        return this.allocCallback();
    };
    return CachedAlloc;
}());
;
export { CachedAlloc };
