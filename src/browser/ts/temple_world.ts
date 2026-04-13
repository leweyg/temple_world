
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
    devMenuContent : HTMLElement;
    reflector : TempleReflection;
    resourceRoot : ResourceTree;
    worldScene : THREE.Object3D;

    constructor(
        parentScene:THREE.Object3D, 
        cameraThree:THREE.Camera, 
        requestRedrawCallback:()=>void,
        devElement:HTMLElement,
        devMenuOverlay:HTMLElement,
        devMenuContent:HTMLElement
    ) {
        this.parentScene = parentScene;
        this.requestRedrawCallback = requestRedrawCallback;
        this.devElement = devElement;
        this.devMenuOverlay = devMenuOverlay;
        this.devMenuContent = devMenuContent;
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
                this.devMenuContent.innerHTML = this.reflector.texter.drawHTMLReflection();
                this.devMenuOverlay.style.display = 'block';
                // Setup jump-to dropdown handler
                var selectElem = this.devMenuContent.querySelector('#jumpto-select') as HTMLSelectElement;
                if (selectElem) {
                    selectElem.onchange = (e:any) => {
                        var value = e.target.value;
                        if (value) {
                            (window as any).jumpToItem(value);
                            e.target.value = '';
                        }
                    };
                }
            } else {
                this.devMenuOverlay.style.display = 'none';
            }
        }

        // Update focus tab content if devmenu is open and focus tab is selected
        if (this.avatar.controls.isDevMode && (window as any).currentDevMenuTab === 'focus') {
            const focusDiv = document.getElementById('devmenu-tab-focus');
            if (focusDiv) {
                focusDiv.innerHTML = this.reflector.texter.generateFocusHTML();
            }
        }
    }

    
}

class TempleWorldStats {
    count_renders : number = 0;
}

export { TempleWorld };
