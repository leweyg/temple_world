import { TempleAvatar } from "./temple_avatar";

class TempleControlsOverlay {
    controlsOverlayTopLeft : HTMLElement | null = null;
    prevHeld = false;

    constructor() {
        this.findFromDocument();
    }

    findFromDocument() {
        this.controlsOverlayTopLeft = document.getElementById("controls-overlay-top-left");
    }

    updateFromAvatar(avatar : TempleAvatar) {

        // TODO: if exceptions are being thrown the binding
        //  to web-UI named elements ins't working. Consider
        //  just disable this system or replace "!." with "?."

        const isHeld = avatar.focus.held != null;
        if (isHeld != this.prevHeld) {
            this.prevHeld = isHeld;
            this.controlsOverlayTopLeft!.textContent = (isHeld ? "rotate" : "glide");
        }
    }
}

export { TempleControlsOverlay }