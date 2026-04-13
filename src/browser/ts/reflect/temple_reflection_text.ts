import { ResourceTree } from "../code/resource_tree";
import { TempleReflection } from "./temple_reflection";
import * as THREE from 'three';

class RefInst {
    name:string="";
    type:string="";
    children:Array<RefInst> = [];
    obj:any = null; // the THREE.Object3D or ResourceTree
}

class TempleReflectionText {
    reflector : TempleReflection;
    isTempleReflectionText = true;

    constructor(reflector : TempleReflection) {
        this.reflector = reflector;
        this.isTempleReflectionText = true;
    }

    drawHTMLReflection() {
        var world = this.reflector.world;
        var reses = this.objPrintResourceRecursive(world.resourceRoot);
        var scenes = this.objPrintScene(world.parentScene);
        var whole = new RefInst();
        whole.name = "resources/scenes";
        whole.children = [reses, scenes];
        return this.htmlFromNameTree(whole);
    }

    htmlFromNameTree(obj:RefInst, depth=0):string {
        var html = '<div class="tree-item" style="margin-left: ' + (depth * 20) + 'px;">';
        var hasChildren = obj.children && obj.children.length > 0;
        var toggleSymbol = hasChildren ? '▶' : '';
        html += '<span class="tree-toggle" onclick="toggleTreeItem(this)">' + toggleSymbol + ' ' + (obj.name || '(unnamed)') + (obj.type ? ' &lt;' + obj.type + '&gt;' : '') + '</span>';
        if (obj.obj) {
            html += '<div class="properties" style="margin-left: 20px; font-size: 10px; color: #ccc;">';
            html += this.getPropertiesHTML(obj.obj);
            html += '</div>';
        }
        if (hasChildren) {
            html += '<div class="tree-children" style="display: none;">';
            for (var child of obj.children) {
                html += this.htmlFromNameTree(child, depth + 1);
            }
            html += '</div>';
        }
        html += '</div>';
        return html;
    }

    getPropertiesHTML(obj:any):string {
        var html = '';
        if (obj.name !== undefined) html += 'name: ' + obj.name + '<br>';
        if (obj.position) html += 'position: ' + obj.position.x.toFixed(2) + ', ' + obj.position.y.toFixed(2) + ', ' + obj.position.z.toFixed(2) + '<br>';
        if (obj.rotation) html += 'rotation: ' + obj.rotation.x.toFixed(2) + ', ' + obj.rotation.y.toFixed(2) + ', ' + obj.rotation.z.toFixed(2) + '<br>';
        if (obj.scale) html += 'scale: ' + obj.scale.x.toFixed(2) + ', ' + obj.scale.y.toFixed(2) + ', ' + obj.scale.z.toFixed(2) + '<br>';
        if (obj.visible !== undefined) html += 'visible: ' + obj.visible + '<br>';
        return html;
    }

    objPrintResourceRecursive(resTree:ResourceTree):RefInst {
        var ans = new RefInst();
        ans.name = resTree.resource_path;
        ans.type = resTree.resource_type.name;
        ans.obj = resTree;
        ans.children = [];
        for (var ci in resTree.tree_children) {
            var child = resTree.tree_children[ci];
            var ca = this.objPrintResourceRecursive(child);
            ans.children.push(ca);
        }
        return ans;
    }

    objPrintScene(node:THREE.Object3D):RefInst {
        var ans = new RefInst();
        ans.name = node.name || 'Scene';
        ans.type = node.type;
        ans.obj = node;
        ans.children = [];
        for (var child of node.children) {
            ans.children.push(this.objPrintScene(child));
        }
        return ans;
    }
}

export { TempleReflectionText }
