var TempleAvatarFocus = /** @class */ (function () {
    function TempleAvatarFocus(avatar) {
        //this.avatar = avatar;
        this.avatar = avatar;
        this.centered = null;
        this.held = null;
    }
    TempleAvatarFocus.prototype.heldScene = function () {
        if (!this.held)
            return null;
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
        if (newHeld) {
            console.assert(newHeld.is_focusable);
        }
        if (newCentered) {
            console.assert(newCentered.is_focusable);
        }
        if (this.held)
            this.held.doFocusedChanged(this.held == newHeld, this.held == newCentered);
        if (this.centered)
            this.centered.doFocusedChanged(this.centered == newHeld, this.centered == newCentered);
        this.held = newHeld;
        this.centered = newCentered;
        if (this.held)
            this.held.doFocusedChanged(this.held == newHeld, this.held == newCentered);
        if (this.centered)
            this.centered.doFocusedChanged(this.centered == newHeld, this.centered == newCentered);
    };
    return TempleAvatarFocus;
}());
export { TempleAvatarFocus };
