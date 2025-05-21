var TempleAvatarFocus = /** @class */ (function () {
    function TempleAvatarFocus(avatar) {
        //this.avatar = avatar;
        this.avatar = avatar;
        this.centered = null;
        this.held = null;
    }
    TempleAvatarFocus.prototype.heldScene = function () {
        if (!this.held) {
            return null;
        }
        var res = this.held.latestInstance();
        if (res) {
            return res.asObject3D();
        }
        return null;
    };
    TempleAvatarFocus.prototype.ensureCentered = function (newCentered) {
        this.ensureFocus(this.held, newCentered);
    };
    TempleAvatarFocus.prototype.ensureFocus = function (newHeld, newCentered) {
        if ((this.held == newHeld) && (this.centered == newCentered)) {
            return;
        }
        if (this.centered != newCentered) {
            console.log("Centered changing...");
            if (newCentered)
                console.assert(newCentered.is_focusable);
            if (this.centered)
                this.centered.doFocusedChanged(this.centered == newHeld, this.centered == newCentered);
            this.centered = newCentered;
            if (this.centered)
                this.centered.doFocusedChanged(this.centered == newHeld, this.centered == newCentered);
        }
        if (this.held != newHeld) {
            console.log("Held changing to: " + (newHeld ? newHeld.fullPathStr() : "none"));
            if (newHeld)
                console.assert(newHeld.is_focusable);
            if (this.held)
                this.held.doFocusedChanged(this.held == newHeld, this.held == newCentered);
            this.held = newHeld;
            if (this.held)
                this.held.doFocusedChanged(this.held == newHeld, this.held == newCentered);
        }
    };
    return TempleAvatarFocus;
}());
export { TempleAvatarFocus };
