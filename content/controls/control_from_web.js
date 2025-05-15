import * as THREE from 'three';
var ControlFromWeb = /** @class */ (function () {
    function ControlFromWeb(domElement, controlGroup) {
        this.unitRadiusPixels = 100.0;
        this.keysId = -222; //"keys";
        this.keysDirByKey = {
            'a': new THREE.Vector3(-1, 0, 0),
            'd': new THREE.Vector3(1, 0, 0),
            'w': new THREE.Vector3(0, -1, 0),
            's': new THREE.Vector3(0, 1, 0),
        };
        this.keyToggles = {
            '`': "devmenu",
            '~': "devmenu"
        };
        this.keysDown = {};
        this.domElement = domElement;
        this.controlGroup = controlGroup;
        this.domElement.style.touchAction = "none"; // disables default scroll
        this.unitRadiusPixels = 100.0;
        // mouseup, mousedown.
        this.listenWithPointer('pointerdown', this.onPointerDown);
        this.listenWithPointer('pointermove', this.onPointerMove);
        this.listenWithPointer('pointerup', this.onPointerUp);
        this.listenWithPointer('pointerleave', this.onPointerDone);
        this.listenWithPointer('pointerout', this.onPointerDone);
        this.listenWithPointer('pointercancel', this.onPointerDone);
        this.listenWithKeyboard('keydown', this.onKeyDown, true);
        this.listenWithKeyboard('keyup', this.onKeyUp, true);
        this.listenWithKeyboard('focusout', this.onKeyFocusOut, true);
        this.domElement.addEventListener('contextmenu', function (ev) { return ev.preventDefault(); });
        this.domElement.addEventListener('touchstart', function (ev) { return ev.preventDefault(); });
    }
    ControlFromWeb.prototype.doPreventDefault = function (ev) {
        ev.preventDefault();
    };
    ControlFromWeb.prototype.listenWith = function (name, method, isDocLevel) {
        if (isDocLevel === void 0) { isDocLevel = false; }
        var callback = method.bind(this);
        var _this = this;
        function pointerCallback(ev) {
            ev.preventDefault();
            callback(ev);
        }
        ;
        if (!isDocLevel) {
            this.domElement.addEventListener(name, pointerCallback);
        }
        else {
            document.addEventListener(name, pointerCallback);
        }
    };
    ControlFromWeb.prototype.listenWithPointer = function (name, method, isDocLevel) {
        if (isDocLevel === void 0) { isDocLevel = false; }
        var callback = method.bind(this);
        var wrapper = (function (ev) {
            callback(ev);
        });
        this.listenWith(name, wrapper, isDocLevel);
    };
    ControlFromWeb.prototype.listenWithKeyboard = function (name, method, isDocLevel) {
        if (isDocLevel === void 0) { isDocLevel = false; }
        var callback = method.bind(this);
        var wrapper = (function (ev) {
            callback(ev);
        });
        this.listenWith(name, wrapper, isDocLevel);
    };
    ControlFromWeb.prototype.findStreamById = function (id) {
        var actives = this.controlGroup.getActives();
        console.assert(Array.isArray(actives));
        for (var i in actives) {
            var str = actives[i];
            if (str.rawId == id) {
                return str;
            }
        }
        return null;
    };
    ControlFromWeb.prototype.ensureStreamById = function (id) {
        var str = this.findStreamById(id);
        if (str)
            return str;
        return this.controlGroup.beginStream();
    };
    ControlFromWeb.prototype.cleanStream = function (str) {
        if (str != null) {
            this.controlGroup.endStream(str);
        }
        return this.controlGroup.beginStream();
    };
    ControlFromWeb.prototype.updateStreamFromPointer = function (stream, event, isStart, isEnd) {
        if (isStart === void 0) { isStart = false; }
        if (isEnd === void 0) { isEnd = false; }
        stream.rawId = event.pointerId;
        stream.rawPrevious.copy(stream.rawCurrent);
        // main coordinate transfer from HTML-DOM happens here:
        stream.rawCurrent.set(event.offsetX, event.offsetY, 0);
        stream.rawRange.set(this.domElement.scrollWidth, this.domElement.scrollHeight, 0);
        // Configure other properties:
        stream.isStart = isStart;
        stream.isEnd = isEnd;
        if (isStart) {
            stream.rawInitial.copy(stream.rawCurrent);
            stream.rawPrevious.copy(stream.rawCurrent);
            stream.rawDelta.set(0, 0, 0);
            stream.rawLengthPath = 0;
        }
        else {
            stream.rawDelta.copy(stream.rawCurrent);
            stream.rawDelta.sub(stream.rawPrevious);
            var rawStep = stream.rawDelta.length();
            stream.rawLengthPath += rawStep;
        }
        stream.unitCurrent.copy(stream.rawCurrent);
        stream.unitCurrent.sub(stream.rawInitial);
        stream.rawLengthCurrent = stream.unitCurrent.length();
        stream.unitCurrent.multiplyScalar(1.0 / this.unitRadiusPixels);
        var unitLen = stream.unitCurrent.length();
        if (unitLen > 1.0) {
            stream.unitCurrent.multiplyScalar(1.0 / unitLen);
        }
    };
    ControlFromWeb.prototype.onPointerDown = function (event) {
        var id = event.pointerId;
        var cur = this.ensureStreamById(id);
        cur.isDown = true;
        this.updateStreamFromPointer(cur, event, true);
        this.controlGroup.onControllerEvent(cur);
    };
    ControlFromWeb.prototype.onPointerMove = function (event) {
        var id = event.pointerId;
        var cur = this.ensureStreamById(id);
        this.updateStreamFromPointer(cur, event);
        this.controlGroup.onControllerEvent(cur);
    };
    ControlFromWeb.prototype.onPointerUp = function (event) {
        var id = event.pointerId;
        var cur = this.ensureStreamById(id);
        cur.isDown = false;
        this.updateStreamFromPointer(cur, event, false, true);
        this.controlGroup.onControllerEvent(cur);
        this.controlGroup.endStream(cur);
    };
    ControlFromWeb.prototype.onPointerDone = function (event) {
        var id = event.pointerId;
        var cur = this.ensureStreamById(id);
        if (cur.isDown || cur.isStart) {
            // continue
        }
        else {
            return; // drop event
        }
        cur.isDown = false;
        cur.isEnd = true;
        cur.isStart = false;
        // not valid: this.updateStreamFromPointer(cur, event, false, true);
        this.controlGroup.onControllerEvent(cur);
        this.controlGroup.endStream(cur);
    };
    ControlFromWeb.prototype.findAnyKeyDown = function () {
        for (var k in this.keysDown) {
            if (this.keysDown[k]) {
                return k;
            }
        }
        return null;
    };
    ControlFromWeb.prototype.updateKeyState = function (key, isDown, isForce) {
        if (isDown === void 0) { isDown = false; }
        if (isForce === void 0) { isForce = true; }
        //var key = ("" + keyRaw).toLowerCase();
        var keepSignal = false;
        var isButton = false;
        if (key in this.keyToggles) {
            //var cur = this.ensureStreamById(this.keysId);
            key = this.keyToggles[key];
            keepSignal = true;
            isButton = true;
        }
        if (key in this.keysDirByKey) {
            keepSignal = true;
        }
        if (!keepSignal) {
            return; // ignore this key
        }
        var wasDown = this.keysDown[key];
        if ((wasDown == isDown) && (!isForce)) {
            return; // no change
        }
        var wasAnyDown = (this.findAnyKeyDown() != null);
        this.keysDown[key] = isDown;
        //console.log("Key[" + key + "]=" + isDown);
        var isAnyDown = (this.findAnyKeyDown() != null);
        var cur = this.ensureStreamById(this.keysId);
        {
            // update the cursor:
            cur.rawId = this.keysId;
            cur.isDown = isAnyDown;
            cur.isStart = (isAnyDown && (!wasAnyDown));
            cur.isEnd = ((!isAnyDown) && wasAnyDown);
            cur.isButton = isButton;
            cur.rawCurrent.set(0, 0, 0);
            if (!isButton) {
                for (var k in this.keysDown) {
                    if (!this.keysDown[k])
                        continue;
                    var dir = this.keysDirByKey[k];
                    cur.rawCurrent.add(dir);
                }
                cur.unitCurrent.copy(cur.rawCurrent);
                cur.unitLen = cur.unitCurrent.length();
                if (cur.unitLen > 0.1) {
                    cur.unitCurrent.normalize();
                    console.assert(!cur.isEnd);
                }
                // This is a equivalent touch setup:
                cur.rawRange.set(1, 1, 1); // 0~1 pixel range
                cur.rawCurrent.set(0.25, 0.75, 0.25); // bottom left corner
                cur.rawInitial.copy(cur.rawCurrent);
            }
        }
        //console.log("Start=" + cur.isStart + " End=" + cur.isEnd);
        this.controlGroup.onControllerEvent(cur);
        if (cur.isEnd) {
            this.controlGroup.endStream(cur);
        }
    };
    ControlFromWeb.prototype.onKeyDown = function (event) {
        var id = event.key;
        this.updateKeyState(id, true);
    };
    ControlFromWeb.prototype.onKeyUp = function (event) {
        var id = event.key;
        this.updateKeyState(id, false);
    };
    ControlFromWeb.prototype.onKeyFocusOut = function (event) {
        var didChange = null;
        for (var k in this.keysDown) {
            if (this.keysDown[k]) {
                this.keysDown[k] = false;
                didChange = k;
            }
        }
        if (didChange) {
            this.updateKeyState(event.key, false, true);
        }
    };
    return ControlFromWeb;
}());
export { ControlFromWeb };
