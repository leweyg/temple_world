


class CachedAlloc<T> {
    allocCallback : ()=>T;
    resetCallback : (obj:T)=>void;
    active : Array<T> = [];
    cached : Array<T> = [];
    constructor(allocCallback:()=>T, resetCallback: (obj:T)=>void) {
        this.allocCallback = allocCallback;
        this.resetCallback = resetCallback;
        this.active = [];
        this.cached = [];
    }
    isEmpty():boolean {
        return (this.active.length == 0);
    }
    alloc():T {
        var cur = this.internalAlloc();
        if (this.resetCallback) {
            this.resetCallback(cur);
        }
        this.active.push(cur);
        return cur;
    }
    free(cur:T) {
        var ndx = this.active.indexOf(cur);
        console.assert(ndx >= 0);
        this.active.splice(ndx, 1);
        ndx = this.active.indexOf(cur);
        console.assert(ndx < 0);
        this.cached.push(cur);
    }
    internalAlloc():T {
        if (this.cached.length > 0) {
            var cur = this.cached.pop();
            return cur!;
        }
        return this.allocCallback();
    }
};

export { CachedAlloc }
