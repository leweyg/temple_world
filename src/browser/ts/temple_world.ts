
import * as THREE from 'three';
import { TempleTime } from './temple_time.js';
import { TempleAvatar } from './avatar/temple_avatar.js'
import { TempleSpace } from './spaces/temple_space.js'
import { ControllerGroup } from './controls/temple_controls.js'
import { ResourceTree } from './code/resource_tree.js';
import { TempleReflection } from './reflect/temple_reflection.js';


export class TempleWorld {
    parentScene : THREE.Group;
    requestRedrawCallback : ()=>void;
    devElement : HTMLElement;
    time : TempleTime;
    reflector : TempleReflection;

    constructor(
        parentScene:THREE.Group, 
        cameraThree:THREE.Camera, 
        requestRedrawCallback:()=>void,
        devElement:HTMLElement
    ) {
        this.parentScene = parentScene;
        this.requestRedrawCallback = requestRedrawCallback;
        this.devElement = devElement;
        this.time = new TempleTime(requestRedrawCallback);
        this.reflector = new TempleReflection(this);
        
        ResourceTree.RequestUpdate = (() => this.time.requestUpdate());
        this.resourceRoot = new ResourceTree();

        this.worldScene = new THREE.Group();
        this.worldScene.name = "TempleWorld";
        parentScene.add(this.worldScene);

        this.space = new TempleSpace(this);
        
        this.controlGroup = new ControllerGroup();
        this.avatar = new TempleAvatar(this, cameraThree, this.controlGroup);

        this.stats = {
            count_renders : 0,
        };
    }

    onPreRender() {
        this.stats.count_renders++;
        this.time.stepTime();

        if (this.avatar.controls.isDevModeChanged) {
            this.avatar.controls.isDevModeChanged = false;
            if (this.avatar.controls.isDevMode) {
                this.devElement.textContent = this.reflector.texter.drawTextReflection();
            } else {
                this.devElement.textContent = "~";
            }
        }
    }

    
}

export { TempleWorld };
