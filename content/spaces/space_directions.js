
import * as THREE from 'three';

class TempleSpaceDirectionsBuilder {

    constructor(parentScene) {
        const material = new THREE.LineBasicMaterial( { color: 0xccFFcc } );

        const points = [];
        points.push( new THREE.Vector3( 0, 0, 0 ) );
        points.push( new THREE.Vector3( 1, 0, 0 ) );
        points.push( new THREE.Vector3( 0, 0, 1 ) );
        points.push( new THREE.Vector3(-1, 0, 0 ) );
        points.push( new THREE.Vector3( 0, 0, -1 ) );

        const geometry = new THREE.BufferGeometry().setFromPoints( points );

        const line = new THREE.Line( geometry, material );

        parentScene.add( line );
    }


}

export { TempleSpaceDirectionsBuilder };
