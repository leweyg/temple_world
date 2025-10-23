
import * as THREE from 'three';

class TempleSpaceMapBuilder {
    scene : THREE.Object3D;
    parentScene : THREE.Object3D;
    lines : THREE.Line;

    constructor(parentScene:THREE.Object3D) {
        this.parentScene = parentScene;
        this.scene = new THREE.Group();
        this.scene.name = "TempleSpaceMap"
        parentScene.add(this.scene);

        const material = new THREE.LineBasicMaterial( { color: 0xccFFcc } );

        const points:Array<THREE.Vector3> = [];
        this.addMapGrid(points, 1.0);

        const geometry = new THREE.BufferGeometry().setFromPoints( points );

        this.lines = new THREE.Line( geometry, material );
        this.scene.add( this.lines );
    }

    addMapGrid(points:Array<THREE.Vector3>, radius = 1.0) {
        const gridShape = [8,8];
        for (var gy=1; gy<gridShape[0]; gy++) {
            for (var gx=1; gx<gridShape[1]; gx++) {
                points.push( new THREE.Vector3( gx - 1, 0, -gy ) );
                points.push( new THREE.Vector3( gx, 0, -gy ) );
                points.push( new THREE.Vector3( gx, 0, -gy - 1 ) );
                points.push( new THREE.Vector3( gx - 1, 0, -gy - 1 ) );
            }
        }
    }


}

export { TempleSpaceMapBuilder };
