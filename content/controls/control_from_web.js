
import * as THREE from 'three';

class ControlFromWeb {

    constructor(domElement, controlGroup) {
        this.domElement = domElement;
        this.controlGroup = controlGroup;
        this.domElement.style['touch-action'] = "none"; // disables default scroll

        this.unitRadiusPixels = 100.0;

        // mouseup, mousedown.
		this.listenWith( 'pointerdown', this.onPointerDown );
        this.listenWith( 'pointermove', this.onPointerMove );
		this.listenWith( 'pointerup', this.onPointerUp );

        this.listenWith( 'pointerleave', this.onPointerDone );
        this.listenWith( 'pointerout', this.onPointerDone );
        this.listenWith( 'pointercancel', this.onPointerDone );

        this.listenWith( 'keydown', this.onKeyDown, true );
        this.listenWith( 'keyup', this.onKeyUp, true );
        this.listenWith( 'focusout', this.onKeyFocusOut, true );

        var justPreventDefault = ((e) => {
            e.preventDefault();
          });
        this.domElement.addEventListener('contextmenu', justPreventDefault);
        this.domElement.addEventListener('touchstart', justPreventDefault);
        
        this.keysId = "keys";
        this.keysDirByKey = {
            'a':new THREE.Vector3(-1, 0, 0),
            'd':new THREE.Vector3( 1, 0, 0),
            'w':new THREE.Vector3( 0, -1,0),
            's':new THREE.Vector3( 0, 1, 0),
        }
        this.keyToggles = {
            '`':"devmenu",
            '~':"devmenu"
        }
        this.keysDown = {};
    }

    listenWith(name, method, isDocLevel=false) {
        var callback = method.bind(this);
        var _this = this;
        function pointerCallback(ev) {
            ev.preventDefault();
            callback(ev);
        };
        if ( ! isDocLevel) {
            this.domElement.addEventListener( name, pointerCallback );
        } else {
            document.addEventListener( name, pointerCallback );
        }
    }

    findStreamById(id) {
        var actives = this.controlGroup.getActives();
        console.assert(Array.isArray(actives));
        for (var i in actives) {
            var str = actives[i];
            if (str.rawId == id) {
                return str;
            }
        }
        return null;
    }

    ensureStreamById(id) {
        var str = this.findStreamById(id);
        if (str) return str;
        return this.controlGroup.beginStream();
    }

    cleanStream(str) {
        if (str != null) {
            this.controlGroup.endStream(str);
            str = null;
        }
        return this.controlGroup.beginStream();
    }

    updateStreamFromPointer( stream, event, isStart=false, isEnd=false ) {
        stream.rawId = event.pointerId;
        stream.rawPrevious.copy(stream.rawCurrent);

        // main coordinate transfer from HTML-DOM happens here:
        stream.rawCurrent.set( event.offsetX, event.offsetY, 0 );
        stream.rawRange.set( this.domElement.scrollWidth, this.domElement.scrollHeight, 0 );

        // Configure other properties:
        stream.isStart = isStart;
        stream.isEnd = isEnd;
        if (isStart) {
            stream.rawInitial.copy(stream.rawCurrent);
            stream.rawPrevious.copy(stream.rawCurrent);
            stream.rawDelta.set(0,0,0);
            stream.rawLengthPath = 0;
        } else {
            stream.rawDelta.copy(stream.rawCurrent);
            stream.rawDelta.sub(stream.rawPrevious);
            const rawStep = stream.rawDelta.length();
            stream.rawLengthPath += rawStep;
        }
        stream.unitCurrent.copy(stream.rawCurrent);
        stream.unitCurrent.sub(stream.rawInitial);
        stream.rawLengthCurrent = stream.unitCurrent.length();
        stream.unitCurrent.multiplyScalar(1.0 / this.unitRadiusPixels);
        const unitLen = stream.unitCurrent.length();
        if (unitLen > 1.0) {
            stream.unitCurrent.multiplyScalar(1.0 / unitLen);
        }
    }

    onPointerDown( event ) {
        var id = event.pointerId
        var cur = this.ensureStreamById(id);
        cur.isDown = true;
        this.updateStreamFromPointer(cur, event, true);
        this.controlGroup.onControllerEvent(cur);
    }

    onPointerMove( event ) {
        var id = event.pointerId
        var cur = this.ensureStreamById(id);
        this.updateStreamFromPointer(cur, event);
        this.controlGroup.onControllerEvent(cur);
    }

    onPointerUp(event) {
        var id = event.pointerId
        var cur = this.ensureStreamById(id);
        cur.isDown = false;
        this.updateStreamFromPointer(cur, event, false, true);
        this.controlGroup.onControllerEvent(cur);
        this.controlGroup.endStream(cur);
    }

    onPointerDone(event) {
        var id = event.pointerId
        var cur = this.ensureStreamById(id);
        if (cur.isDown || cur.isStart) {
            // continue
        } else {
            return; // drop event
        }
        cur.isDown = false;
        cur.isEnd = true;
        cur.isStart = false;
        // not valid: this.updateStreamFromPointer(cur, event, false, true);
        this.controlGroup.onControllerEvent(cur);
        this.controlGroup.endStream(cur);
    }

    findAnyKeyDown() {
        for (var k in this.keysDown) {
            if (this.keysDown[k]) {
                return k;
            }
        }
        return null;
    }

    updateKeyState(key, isDown=false, isForce=true) {
        key = ("" + key).toLowerCase();
        var keepSignal = false;
        var isButton = false;
        if (key in this.keyToggles) {
            var cur = this.ensureStreamById(this.keysId);
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

            cur.rawCurrent.set(0,0,0);
            if (!isButton) {
                for (var k in this.keysDown) {
                    if (!this.keysDown[k]) continue;

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
                cur.rawRange.set(1,1,1); // 0~1 pixel range
                cur.rawCurrent.set(0.25, 0.75, 0.25); // bottom left corner
                cur.rawInitial.copy(cur.rawCurrent);
            }
        }
        //console.log("Start=" + cur.isStart + " End=" + cur.isEnd);
        this.controlGroup.onControllerEvent(cur);
        if (cur.isEnd) {
            this.controlGroup.endStream(cur);
        }
    }

    onKeyDown(event) {
        var id = event.key
        this.updateKeyState(id, true);
    }

    onKeyUp(event) {
        var id = event.key
        this.updateKeyState(id, false);
    }

    onKeyFocusOut(event) {
        var didChange = null;
        for (var k in this.keysDown) {
            if (this.keysDown[k]) {
                this.keysDown[k] = false;
                didChange = k;
            }
        }
        if (didChange) {
            this.updateKeyState(didChange, false, true);
        }
    }
}

export { ControlFromWeb };

