
import * as THREE from 'three';

class TempleSpaceCodaChakra {
    scene : THREE.Object3D;

    constructor(parentScene : THREE.Object3D) {
        this.scene = new THREE.Group();
        this.scene.name = "TempleSpaceCodaChakra"
        this.scene.position.set(0,0,-14.0);
        parentScene.add(this.scene);

        const material = new THREE.LineBasicMaterial( { color: 0xccFFcc } );

        const points : Array<THREE.Vector3> = [];
        this.addLayerLines(points, 5.0, -1.0); // simulation
        this.addLayerLines(points, 4.0, -3.0); // scene
        this.addLayerLines(points, 3.0, -5.0); // memory
        this.addLayerLines(points, 2.0, -7.0); // code
        this.addLayerLines(points, 1.0, -9.0); // search

        const geometry = new THREE.BufferGeometry().setFromPoints( points );

        const lines = new THREE.Line( geometry, material );
        this.scene.add( lines );
    }

    addLayerLines(points:Array<THREE.Vector3>, radius = 1.0, height = 0.0) {
        points.push( new THREE.Vector3( 0, height, 0 ) );
        points.push( new THREE.Vector3( radius, height, 0 ) );
        points.push( new THREE.Vector3( radius, height, radius ) );
        points.push( new THREE.Vector3( radius, height,-radius ) );
        points.push( new THREE.Vector3(-radius, height,-radius ) );
        points.push( new THREE.Vector3(-radius, height, radius ) );
        points.push( new THREE.Vector3( radius, height, radius ) );
        points.push( new THREE.Vector3( radius, height, 0 ) );
        points.push( new THREE.Vector3( 0, height, 0 ) );
    }


}

export { TempleSpaceCodaChakra };
