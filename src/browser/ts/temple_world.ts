
import * as THREE from 'three';
import { TempleTime } from './temple_time.js';
import { TempleAvatar } from './avatar/temple_avatar.js'
import { TempleSpace } from './spaces/temple_space.js'
import { ControllerGroup } from './controls/temple_controls.js'
import { ResourceTree } from './code/resource_tree.js';
import { TempleReflection } from './reflect/temple_reflection.js';


class TempleWorld {
    time : TempleTime;
    space : TempleSpace;
    avatar : TempleAvatar;
    controlGroup : ControllerGroup;

    stats : TempleWorldStats;

    parentScene : THREE.Object3D;
    requestRedrawCallback : ()=>void;
    devElement : HTMLElement;
    devMenuOverlay : HTMLElement;
    devMenuTextarea : HTMLTextAreaElement;
    reflector : TempleReflection;
    resourceRoot : ResourceTree;
    worldScene : THREE.Object3D;

    constructor(
        parentScene:THREE.Object3D, 
        cameraThree:THREE.Camera, 
        requestRedrawCallback:()=>void,
        devElement:HTMLElement,
        devMenuOverlay:HTMLElement,
        devMenuTextarea:HTMLTextAreaElement
    ) {
        this.parentScene = parentScene;
        this.requestRedrawCallback = requestRedrawCallback;
        this.devElement = devElement;
        this.devMenuOverlay = devMenuOverlay;
        this.devMenuTextarea = devMenuTextarea;
        this.time = new TempleTime(requestRedrawCallback);
        this.reflector = new TempleReflection(this);
        
        ResourceTree.RequestUpdate = (() => this.time.requestUpdate());
        this.resourceRoot = new ResourceTree("TempleWorld", ResourceTree.TypeThreeGroup);
        this.worldScene = this.resourceRoot.ensureInstance().asObject3D();
        this.worldScene.name = "TempleWorld";
        parentScene.add(this.worldScene);

        this.space = new TempleSpace(this);
        
        this.controlGroup = new ControllerGroup();
        this.avatar = new TempleAvatar(this, cameraThree, this.controlGroup);

        this.stats = new TempleWorldStats();
    }

    onPreRender() {
        this.stats.count_renders++;
        this.time.stepTime();

        if (this.avatar.controls.isDevModeChanged) {
            this.avatar.controls.isDevModeChanged = false;
            if (this.avatar.controls.isDevMode) {
                this.devMenuTextarea.value = this.reflector.texter.drawTextReflection();
                this.devMenuOverlay.style.display = 'block';
            } else {
                this.devMenuOverlay.style.display = 'none';
            }
        }
    }

    
}

class TempleWorldStats {
    count_renders : number = 0;
}

export { TempleWorld };
