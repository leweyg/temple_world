
import * as THREE from 'three';

class TempleSpaceMapBuilder {
    scene : THREE.Object3D;
    parentScene : THREE.Object3D;
    surfaceShape = [ 7, 7 ];
    mesh : THREE.Mesh;

    constructor(parentScene:THREE.Object3D) {
        this.parentScene = parentScene;
        this.scene = new THREE.Group();
        this.scene.name = "TempleSpaceMap"
        parentScene.add(this.scene);

        const material = new THREE.MeshBasicMaterial( { 
            color: 0x557755, 
            //side:THREE.DoubleSide
        } );

        const data = this.mapGridVertices();

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute( 'position', new THREE.BufferAttribute( data.vertices, 3 ) );
        geometry.setIndex( data.indices );

        this.mesh = new THREE.Mesh( geometry, material );
        this.scene.add( this.mesh );
    }

    indexFromXY(x:number,y:number) {
        return (y * this.surfaceShape[0]) + x;
    }

    mapGridVertices() {
        const points = [];
        const indices = [];
        const gridShape = this.surfaceShape;
        for (var gy=0; gy<gridShape[0]; gy++) {
            for (var gx=0; gx<gridShape[1]; gx++) {
                points.push( new THREE.Vector3( gx, 0, -gy ) );

                if ((gx>0) && (gy > 0)) {
                    indices.push( this.indexFromXY(gy-1,gx-1));
                    indices.push( this.indexFromXY(gy-0,gx-0));
                    indices.push( this.indexFromXY(gy-1,gx-0));

                    indices.push( this.indexFromXY(gy-0,gx-0));
                    indices.push( this.indexFromXY(gy-1,gx-1));
                    indices.push( this.indexFromXY(gy-0,gx-1));
                }
                //points.push( new THREE.Vector3( gx - 1, 0, -gy ) );
                
                //points.push( new THREE.Vector3( gx, 0, -gy - 1 ) );
                //points.push( new THREE.Vector3( gx - 1, 0, -gy - 1 ) );
            }
        }
        const linearPoints = [];
        for (var vi in points) {
            var v = points[vi];
            linearPoints.push(v.x);
            linearPoints.push(v.y);
            linearPoints.push(v.z);
        }
        const vertices = new Float32Array(linearPoints);
        return { vertices, indices };
    }


}

export { TempleSpaceMapBuilder };
