
import * as THREE from 'three';

class ControlFromWeb {

    constructor(domElement, controlGroup) {
        this.domElement = domElement;
        this.controlGroup = controlGroup;

        // mouseup, mousedown.
		this.listenWith( 'mousedown', this.onMouseDown );
        this.listenWith( 'mousemove', this.onMouseMove );
		this.listenWith( 'mouseup', this.onMouseUp );
    }

    listenWith(name, method) {
        var callback = method.bind(this);
        this.domElement.addEventListener( name, callback );
    }

    onMouseDown( event ) {
        // todo
    }

    onMouseMove( event ) {
        // todo
    }

    onMouseUp( event ) {
        // todo
    }
}

export { ControlFromWeb };

