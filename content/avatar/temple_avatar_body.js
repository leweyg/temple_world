
import * as THREE from 'three';

class TempleAvatarBody {

    constructor(parentScene) {
        var radius = 0.5;
        var segments = 15;
        const geometry = new THREE.SphereGeometry( radius, segments, segments ); 
        const material = new THREE.MeshToonMaterial( { color: 0x00FF00 } ); 
        const sphere = new THREE.Mesh( geometry, material );
        sphere.position.setY(radius);
        parentScene.add( sphere );
    }


}

export { TempleAvatarBody };
