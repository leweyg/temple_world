
class TempleAvatarFocus {
    constructor(avatar) {
        this.avatar = avatar;

        this.centered = null;
        this.held = null;
    }

    heldScene() {
        if (!this.held) return null;
        const res = this.held.res;
        if (res) {
            return res.latestInstance();
        }
        return null;
    }

    ensureCentered(newCentered) {
        this.ensureFocus(this.held, newCentered);
    }

    ensureFocus(newHeld, newCentered) {
        if ((this.held == newHeld) && (this.centered == newCentered)) {
            return;
        }
        if (newHeld) {
            console.assert(newHeld.is_focusable);
        }
        if (newCentered) {
            console.assert(newCentered.is_focusable);
        }

        if (this.held) this.held.doFocusedChanged(this.held==newHeld, this.held==newCentered);
        if (this.centered) this.centered.doFocusedChanged(this.centered==newHeld, this.centered==newCentered);
        this.held = newHeld;
        this.centered = newCentered;
        if (this.held) this.held.doFocusedChanged(this.held==newHeld, this.held==newCentered);
        if (this.centered) this.centered.doFocusedChanged(this.centered==newHeld, this.centered==newCentered);
        
    }
}

export { TempleAvatarFocus }