import * as THREE from 'three';

class TempleAvatarReticle {
    constructor(avatar, cameraThree) {
        this.avatar = avatar;
        this.scene = new THREE.Group();
        this.scene.name = "TempleAvatarReticle";
        const parentScene = cameraThree;
        parentScene.add(this.scene);
        this.cameraZBack = -1.5;
        this.radius = 0.01;

        const material = new THREE.LineBasicMaterial( { 
            color: 0xccFFcc, transparent:true,
            opacity:0.5 } );

        const points = [];
        this.addDirectionLines(points, this.radius);

        const geometry = new THREE.BufferGeometry().setFromPoints( points );

        this.lines = new THREE.Line( geometry, material );
        this.scene.add( this.lines );
        this.scene.position.set(0,0,this.cameraZBack);
    }

    addDirectionLines(points, radius = 1.0) {
        points.push( new THREE.Vector3( 0, 0, 0 ) );
        points.push( new THREE.Vector3( radius, 0, 0 ) );
        points.push( new THREE.Vector3( 0, 0, 0 ) );
        points.push( new THREE.Vector3( 0, -radius, 0 ) );
    }

};

export { TempleAvatarReticle }