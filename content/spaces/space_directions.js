
import * as THREE from 'three';

class TempleSpaceDirectionsBuilder {

    constructor(parentScene) {
        const material = new THREE.LineBasicMaterial( { color: 0xccFFcc } );

        const points = [];
        this.addDirectionLines(points, 1.0);
        this.addDirectionLines(points, 3.0);

        const geometry = new THREE.BufferGeometry().setFromPoints( points );

        const line = new THREE.Line( geometry, material );

        parentScene.add( line );
    }

    addDirectionLines(points, radius = 1.0) {
        points.push( new THREE.Vector3( 0, 0, 0 ) );
        points.push( new THREE.Vector3( radius, 0, 0 ) );
        points.push( new THREE.Vector3( 0, 0, radius ) );
        points.push( new THREE.Vector3(-radius, 0, 0 ) );
        points.push( new THREE.Vector3( 0, 0, -radius ) );
    }


}

export { TempleSpaceDirectionsBuilder };
