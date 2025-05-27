
import * as THREE from 'three';

class TempleSpaceKalaChakra {
    parentScene:THREE.Object3D;
    scene : THREE.Object3D;
    lines : THREE.Line;

    constructor(parentScene:THREE.Object3D) {
        this.parentScene = parentScene;
        this.scene = new THREE.Group();
        this.scene.name = "TempleSpaceKalaChakra"
        this.scene.position.set(0,0,-14.0);
        parentScene.add(this.scene);

        const material = new THREE.LineBasicMaterial( { color: 0xccFFcc } );

        const points : Array<THREE.Vector3> = [];
        this.addLayerLines(points, 5.0, 0.0);
        this.addLayerLines(points, 4.0, 2.0);
        this.addLayerLines(points, 3.0, 4.0);
        this.addLayerLines(points, 2.0, 6.0);
        this.addLayerLines(points, 1.0, 8.0);

        const geometry = new THREE.BufferGeometry().setFromPoints( points );

        this.lines = new THREE.Line( geometry, material );
        this.scene.add( this.lines );
    }

    addLayerLines(points:Array<THREE.Vector3>, radius = 1.0, heightBase = 0.0) {
        const height = (heightBase + 2.0);
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

export { TempleSpaceKalaChakra };
