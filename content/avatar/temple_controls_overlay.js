var TempleControlsOverlay = /** @class */ (function () {
    function TempleControlsOverlay() {
        this.controlsOverlayTopLeft = null;
        this.controlsOverlayTopRight = null;
        this.prevHeld = false;
        this.findFromDocument();
    }
    TempleControlsOverlay.prototype.findFromDocument = function () {
        this.controlsOverlayTopLeft = document.getElementById("controls-overlay-top-left");
        this.controlsOverlayTopRight = document.getElementById("controls-overlay-top-right");
    };
    TempleControlsOverlay.prototype.updateFromAvatar = function (avatar) {
        // TODO: if exceptions are being thrown the binding
        //  to web-UI named elements ins't working. Consider
        //  just disable this system or replace "!." with "?."
        var isHeld = avatar.focus.held != null;
        if (isHeld != this.prevHeld) {
            this.prevHeld = isHeld;
            this.controlsOverlayTopLeft.textContent = (isHeld ? "push" : "glide");
            this.controlsOverlayTopRight.textContent = (isHeld ? "rotate" : "focus");
        }
    };
    return TempleControlsOverlay;
}());
export { TempleControlsOverlay };
