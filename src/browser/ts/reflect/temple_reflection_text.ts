import { ResourceTree } from "../code/resource_tree";
import { TempleReflection } from "./temple_reflection";
import * as THREE from 'three';

class RefInst {
    name:string;
    children:Array<RefInst> = [];
}

class TempleReflectionText {
    reflector : TempleReflection;
    isTempleReflectionText = true;

    constructor(reflector : TempleReflection) {
        this.reflector = reflector;
        this.isTempleReflectionText = true;
    }

    drawTextReflection() {
        var world = this.reflector.world;
        var reses = this.objPrintResourceRecursive(world.resourceRoot);
        var scenes = this.objPrintScene(world.parentScene);
        var whole = {
            name:"resources/scenes",
            children:[
                reses,
                scenes,
            ]
        }
        return this.textFromNameTree(whole);
    }

    textFromNameTree(obj:any, tabs=0, skipPrefix=false) {
        var line = "";
        for (var ti=0; ti<tabs && !skipPrefix; ti++) {
            line += "  ";
        }
        if (obj.name) {
            line += obj.name;
        } else {
            line += "(unnamed)";
        }
        if (obj.type) {
            line += " <" + obj.type + ">";
        }
        if (obj.children && obj.children.length) {
            if (obj.children.length == 1) {
                line += " / ";
                line += this.textFromNameTree(obj.children[0], tabs+1, true)
            } else {
                for (var i=0; i<obj.children.length; i++) {
                    var child = obj.children[i];
                    line += "\n" + this.textFromNameTree(child, tabs+1);
                }
            }
        }
        return line;
    }

    objPrintResourceRecursive(resTree:ResourceTree):RefInst {
        var ans = new RefInst();
        ans.name = resTree.resource_path + " <" + resTree.resource_type.name + ">",
        ans.children = [];
        for (var ci in resTree.tree_children) {
            var child = resTree.tree_children[ci];
            var ca = this.objPrintResourceRecursive(child);
            ans.children.push(ca);
        }
        return ans;
    }

    objPrintScene(node:THREE.Object3D):THREE.Object3D {
        return node;
    }
}

export { TempleReflectionText }
