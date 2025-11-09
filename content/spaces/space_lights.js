import * as THREE from 'three';
var TempleLights = /** @class */ (function () {
    function TempleLights(parentScene) {
        this.parentScene = parentScene;
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        parentScene.add(this.directionalLight);
        this.targetObject = new THREE.Object3D();
        parentScene.add(this.targetObject);
        this.directionalLight.target = this.targetObject;
        this.directionalLight.position.set(0, 0, 0);
        this.targetObject.position.set(-1, -2, 1);
        this.setMainIntensity(0.61);
    }
    TempleLights.prototype.setMainIntensity = function (intensity) {
        this.directionalLight.intensity = intensity;
    };
    return TempleLights;
}());
export { TempleLights };
