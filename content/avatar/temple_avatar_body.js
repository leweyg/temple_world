
import * as THREE from 'three';

class TempleAvatarBodyPart {
    constructor(scene) {
        this.isBodyPart = true;
        this.scene = scene;
        this.initialPos = this.scene.position.clone();
    }
}

class TempleAvatarBody {

    constructor(parentScene) {
        this.isAvatarBody = true;
        var radius = 1.0/6.0;
        var seg_around = 32;
        var seg_height = 15;
        const geometry = new THREE.SphereGeometry( radius, seg_around, seg_height ); 
        const material = new THREE.MeshToonMaterial( { color: 0x00FF00 } ); 

        this.primary = [];
        for (var i=0; i<3; i++) {
            const sphere = new THREE.Mesh( geometry, material );
            sphere.position.setY(radius * (1.0 + (i*2.0)));
            parentScene.add( sphere );
            var part = new TempleAvatarBodyPart(sphere);
            this.primary.push(part);
        }

        this.hands = [];
        for (var i=0; i<2; i++) {
            const iSign = (i - 0.5) * 2.0;
            const sphere = new THREE.Mesh( geometry, material );
            sphere.position.setY(radius * 4.0);
            sphere.position.setX(radius * 2.0 * iSign);
            parentScene.add( sphere );
            var part = new TempleAvatarBodyPart(sphere);
            this.hands.push(part);
        }
    }


}

export { TempleAvatarBody };
