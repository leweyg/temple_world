
import * as THREE from 'three';

class ControlFromWeb {

    constructor(domElement, controlGroup) {
        this.domElement = domElement;
        this.controlGroup = controlGroup;

        this.unitRadiusPixels = 150.0;

        // mouseup, mousedown.
		this.listenWith( 'pointerdown', this.onPointerDown );
        this.listenWith( 'pointermove', this.onPointerMove );
		this.listenWith( 'pointerup', this.onPointerUp );
    }

    listenWith(name, method) {
        var callback = method.bind(this);
        this.domElement.addEventListener( name, callback );
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
        stream.rawCurrent.set( event.clientX, event.clientY, 0 );
        stream.isStart = isStart;
        stream.isEnd = isEnd;
        if (isStart) {
            stream.rawInitial.copy(stream.rawCurrent);
            stream.rawPrevious.copy(stream.rawCurrent);
            stream.rawDelta.set(0,0,0);
        } else {
            stream.rawDelta.copy(stream.rawCurrent);
            stream.rawDelta.sub(stream.rawPrevious);
        }
        stream.unitCurrent.copy(stream.rawCurrent);
        stream.unitCurrent.sub(stream.rawInitial);
        stream.unitCurrent.multiplyScalar(1.0 / this.unitRadiusPixels);
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
}

export { ControlFromWeb };

