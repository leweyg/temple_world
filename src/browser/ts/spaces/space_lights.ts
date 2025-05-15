
import * as THREE from 'three';

class TempleLights {
    parentScene : THREE.Object3D;
    directionalLight : THREE.DirectionalLight;
    targetObject : THREE.Object3D;

    constructor(parentScene:THREE.Object3D) {
        this.parentScene = parentScene;
        this.directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
        parentScene.add(this.directionalLight);
        this.targetObject = new THREE.Object3D(); 
        parentScene.add(this.targetObject);
        this.directionalLight.target = this.targetObject;
        this.directionalLight.position.set(0,0,0);
        this.targetObject.position.set(-1,-1,-1);

        this.setMainIntensity(0.61);
    }

    setMainIntensity(intensity:number) {
        this.directionalLight.intensity = intensity;
    }

}

export { TempleLights };
