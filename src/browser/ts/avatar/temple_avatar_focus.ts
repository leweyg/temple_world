import { TempleFieldBase } from "../fields/temple_field";
import { TempleAvatar } from "./temple_avatar";
import * as THREE from 'three';

class TempleAvatarFocus {
    centered : TempleFieldBase|null;
    held : TempleFieldBase|null;

    constructor(public avatar:TempleAvatar) {
        //this.avatar = avatar;

        this.centered = null;
        this.held = null;
    }

    heldScene():THREE.Object3D|null {
        if (!this.held) {
            return null;
        }
        const res = this.held.latestInstance();
        if (res) {
            return res.asObject3D();
        }
        return null;
    }

    ensureCentered(newCentered:TempleFieldBase|null) {
        this.ensureFocus(this.held, newCentered);
    }

    ensureFocus(newHeld:TempleFieldBase|null, newCentered:TempleFieldBase|null) {
        if ((this.held == newHeld) && (this.centered == newCentered)) {
            return;
        }
        if (this.centered != newCentered) {
            console.log("Centered changing...");
            if (newCentered) console.assert(newCentered.is_focusable);
            if (this.centered) this.centered.doFocusedChanged(this.centered==newHeld, this.centered==newCentered);
            this.centered = newCentered;
            if (this.centered) this.centered.doFocusedChanged(this.centered==newHeld, this.centered==newCentered);
        }
        if (this.held != newHeld) {
            console.log("Held changing...");
            if (newHeld) console.assert(newHeld.is_focusable);
            if (this.held) this.held.doFocusedChanged(this.held==newHeld, this.held==newCentered);
            this.held = newHeld;
            if (this.held) this.held.doFocusedChanged(this.held==newHeld, this.held==newCentered);
        }
    }
}

export { TempleAvatarFocus }