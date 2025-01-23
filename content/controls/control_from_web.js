
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
    }

    listenWith(name, method) {
        var callback = method.bind(this);
        var _this = this;
        function pointerCallback(ev) {
            ev.preventDefault();
            callback(ev);
        };
        this.domElement.addEventListener( name, pointerCallback );
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
}

export { ControlFromWeb };

