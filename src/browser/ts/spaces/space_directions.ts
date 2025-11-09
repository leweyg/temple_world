
import * as THREE from 'three';

class TempleSpaceDirectionsBuilder {
    scene : THREE.Object3D;
    parentScene : THREE.Object3D;
    lines : THREE.Line;

    constructor(parentScene:THREE.Object3D) {
        this.parentScene = parentScene;
        this.scene = new THREE.Group();
        this.scene.name = "TempleSpaceDirections"
        parentScene.add(this.scene);

        const material = new THREE.LineBasicMaterial( { color: 0xccFFcc } );

        const points:Array<THREE.Vector3> = [];
        this.addDirectionLines(points, 1.0);
        this.addDirectionLines(points, 3.0);

        const geometry = new THREE.BufferGeometry().setFromPoints( points );

        this.lines = new THREE.Line( geometry, material );
        this.scene.add( this.lines );
        this.lines.visible = false;
    }

    addDirectionLines(points:Array<THREE.Vector3>, radius = 1.0) {
        points.push( new THREE.Vector3( 0, 0, 0 ) );
        points.push( new THREE.Vector3( radius, 0, 0 ) );
        points.push( new THREE.Vector3( 0, 0, radius ) );
        points.push( new THREE.Vector3(-radius, 0, 0 ) );
        points.push( new THREE.Vector3( 0, 0, -radius ) );
    }


}

export { TempleSpaceDirectionsBuilder };
