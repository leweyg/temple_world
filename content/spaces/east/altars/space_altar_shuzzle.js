
import * as THREE from 'three';
import { ResourceTree, ResourceTypeJson } from '../../../code/resource_tree.js';

class SpaceAltarShuzzle extends ResourceTypeJson {
    static ResourceTypeShuzzle = new SpaceAltarShuzzle();

    makeResourceInstanceFromLoaded(res, parent, parentRes) {
        throw "TODO:SpaceAltarShuzzle.makeResourceInstanceFromLoaded";
    }
}

export { SpaceAltarShuzzle };
