

class CachedAlloc {
    constructor(allocCallback) {
        this.allocCallback = allocCallback;
        this.active = [];
        this.cached = [];
    }
    alloc() {
        var cur = this.ensureAllocStream();
        console.assert(!cur.isActive);
        cur.isActive = true;
        this.active.push(cur);
        return cur;
    }
    free(str) {
        console.assert(cur.isActive);
        cur.isActive = false;
        var ndx = this.active.indexOf(cur);
        console.assert(ndx >= 0);
        this.active.splice(ndx, 1);
        ndx = this.active.indexOf(cur);
        console.assert(ndx < 0);
        this.cached.push(cur);
    }
    ensureAllocStream() {
        if (this.cached.length > 0) {
            var cur = this.cached.pop();
            return cur;
        }
        var cur = this.allocCallback();
        return cur;
    }
};

export { CachedAlloc }
