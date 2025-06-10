
import * as THREE from 'three';
import { ControllerGroup, ControllerStream } from '../controls/temple_controls.js'
import { bool } from 'three/tsl';

class ControlFromWeb {
    domElement : HTMLElement;
    controlGroup : ControllerGroup;
    unitRadiusPixels = 100.0;
    keysId = -222; //"keys";
    keysDirByKey : {[k:string]:THREE.Vector3} = {
        'a':new THREE.Vector3(-1, 0, 0),
        'd':new THREE.Vector3( 1, 0, 0),
        'w':new THREE.Vector3( 0, -1,0),
        's':new THREE.Vector3( 0, 1, 0),
    };
    keyToggles : {[k:string]:string} = {
        '`':"devmenu",
        '~':"devmenu"
    };
    keysDown : {[k:string]:boolean} = {};

    constructor(domElement:HTMLElement, controlGroup : ControllerGroup) {
        this.domElement = domElement;
        this.controlGroup = controlGroup;
        this.domElement.style.touchAction = "none"; // disables default scroll

        this.unitRadiusPixels = 100.0;

        // mouseup, mousedown.
		this.listenWithPointer( 'pointerdown', this.onPointerDown );
        this.listenWithPointer( 'pointermove', this.onPointerMove );
		this.listenWithPointer( 'pointerup', this.onPointerUp );

        this.listenWithPointer( 'pointerleave', this.onPointerDone );
        this.listenWithPointer( 'pointerout', this.onPointerDone );
        this.listenWithPointer( 'pointercancel', this.onPointerDone );

        this.listenWithKeyboard( 'keydown', this.onKeyDown, true );
        this.listenWithKeyboard( 'keyup', this.onKeyUp, true );
        this.listenWithKeyboard( 'focusout', this.onKeyFocusOut, true );

        this.domElement.addEventListener('contextmenu', ev => ev.preventDefault());
        this.domElement.addEventListener('touchstart', ev => ev.preventDefault());
    }

    doPreventDefault(ev:PointerEvent) {
        ev.preventDefault();
    }

    listenWith(
        name:string, 
        method:(evarg:Event)=>void, 
        isDocLevel=false)
    {
        var callback = method.bind(this);
        var _this = this;
        function pointerCallback(ev:Event) {
            ev.preventDefault();
            callback(ev);
        };
        if ( ! isDocLevel) {
            this.domElement.addEventListener( name, pointerCallback );
        } else {
            document.addEventListener( name, pointerCallback );
        }
    }

    listenWithPointer(
        name:string, 
        method:(evarg:PointerEvent)=>void, 
        isDocLevel=false)
    {
        var callback = method.bind(this);
        var wrapper = ((ev:Event)=>{
            callback(ev as PointerEvent);
        });
        this.listenWith(name, wrapper, isDocLevel);
    }

    listenWithKeyboard(
        name:string, 
        method:(evarg:KeyboardEvent)=>void, 
        isDocLevel=false)
    {
        var callback = method.bind(this);
        var wrapper = ((ev:Event)=>{
            callback(ev as KeyboardEvent);
        });
        this.listenWith(name, wrapper, isDocLevel);
    }

    findStreamById(id:number):ControllerStream|null {
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

    ensureStreamById(id:number):ControllerStream {
        var str = this.findStreamById(id);
        if (str) return str;
        return this.controlGroup.beginStream();
    }

    cleanStream(str:ControllerStream) {
        if (str != null) {
            this.controlGroup.endStream(str);
        }
        return this.controlGroup.beginStream();
    }

    updateStreamFromPointer(
        stream:ControllerStream, 
        event:PointerEvent, 
        isStart=false, 
        isEnd=false )
    {
        stream.rawId = event.pointerId;
        if (isStart) {
            // TODO: close previous stream
            stream.resetStream();
        }
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
            stream.isGestureStart = true;
        } else { // end or update:
            stream.rawDelta.copy(stream.rawCurrent);
            stream.rawDelta.sub(stream.rawPrevious);
            const rawStep = stream.rawDelta.length();
            //console.log("RawStep=" + rawStep);
            stream.rawLengthPath += rawStep;
            
            const distForDrag = 30.0;
            if (stream.isGestureStart) {
                //console.log("stream.rawLengthPath  = " + stream.rawLengthPath );
                if (stream.rawLengthPath > distForDrag) {
                    //console.log("Drag started.")
                    stream.isGestureStart = false;
                    stream.isGestureDrag = true;
                } else {
                    //console.log("Drag not started yet.")
                }
                // if long time -> isGestureHold
            }
            if (isEnd) {
                //console.log("END: stream.rawLengthPath  = " + stream.rawLengthPath );
                stream.isGestureTap = !stream.isGestureDrag;
                stream.isGestureStart = false;
            }
        }
        stream.unitCurrent.copy(stream.rawCurrent);
        stream.unitCurrent.sub(stream.rawInitial);
        stream.rawLengthCurrent = stream.unitCurrent.length();
        stream.unitCurrent.multiplyScalar(1.0 / this.unitRadiusPixels);
        stream.rawPrevious.copy(stream.rawCurrent);
        const unitLen = stream.unitCurrent.length();
        if (unitLen > 1.0) {
            stream.unitCurrent.multiplyScalar(1.0 / unitLen);
        }
    }

    onPointerDown( event:PointerEvent ) {
        var id = event.pointerId
        var cur = this.ensureStreamById(id);
        cur.isDown = true;
        this.updateStreamFromPointer(cur, event, true);
        this.controlGroup.onControllerEvent(cur);
    }

    onPointerMove( event:PointerEvent ) {
        var id = event.pointerId
        var cur = this.ensureStreamById(id);
        this.updateStreamFromPointer(cur, event);
        this.controlGroup.onControllerEvent(cur);
    }

    onPointerUp(event:PointerEvent) {
        var id = event.pointerId
        var cur = this.ensureStreamById(id);
        cur.isDown = false;
        this.updateStreamFromPointer(cur, event, false, true);
        this.controlGroup.onControllerEvent(cur);
        this.controlGroup.endStream(cur);
    }

    onPointerDone(event:PointerEvent) {
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

    updateKeyState(key:string, isDown=false, isForce=true) {
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

    onKeyDown(event:KeyboardEvent) {
        var id = event.key
        this.updateKeyState(id, true);
    }

    onKeyUp(event:KeyboardEvent) {
        var id = event.key
        this.updateKeyState(id, false);
    }

    onKeyFocusOut(event:KeyboardEvent) {
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
    }
}

export { ControlFromWeb };

