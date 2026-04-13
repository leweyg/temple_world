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
    treeItemCounter : number = 0;

    constructor(reflector : TempleReflection) {
        this.reflector = reflector;
        this.isTempleReflectionText = true;
    }

    drawHTMLReflection() {
        this.treeItemCounter = 0;
        var world = this.reflector.world;
        var reses = this.objPrintResourceRecursive(world.resourceRoot);
        var scenes = this.objPrintScene(world.parentScene);
        var whole = new RefInst();
        whole.name = "scenes/resources";
        whole.children = [scenes, reses];
        var dropdown = this.generateJumpToDropdown();
        return dropdown + this.htmlFromNameTree(whole);
    }

    generateJumpToDropdown():string {
        var html = '<div style="margin-bottom: 15px; border-bottom: 1px solid #666; padding-bottom: 10px;">';
        html += '<label for="jumpto-select" style="display: block; margin-bottom: 5px; color: #aaa; font-size: 11px;">Jump to:</label>';
        html += '<select id="jumpto-select" style="width: 100%; padding: 5px; background: #333; color: #fff; border: 1px solid #666; font-family: monospace; font-size: 12px;">';
        html += '<option value="">-- Select --</option>';
        html += '<option value="TempleAvatar">TempleAvatar</option>';
        html += '<option value="Camera">Camera</option>';
        html += '<option value="TempleSpaceKalaChakra">TempleSpaceKalaChakra</option>';
        html += '<option value="SpaceTrainingBoxes">SpaceTrainingBoxes</option>';
        html += '<option value="ShuzzleInstance">ShuzzleInstance</option>';
        html += '</select>';
        html += '</div>';
        return html;
    }

    htmlFromNameTree(obj:RefInst, depth=0):string {
        var itemId = 'tree-item-' + this.treeItemCounter;
        this.treeItemCounter++;
        var html = '<div class="tree-item" id="' + itemId + '" data-name="' + (obj.name || '') + '" data-type="' + (obj.type || '') + '">';
        var hasChildren = obj.children && obj.children.length > 0;
        var hasProperties = obj.obj !== null;
        var hasExpandable = hasChildren || hasProperties;
        var toggleSymbol = hasExpandable ? '▶' : '';
        var indent = '';
        for (var i = 0; i < depth; i++) {
            indent += '- ';
        }
        html += '<span class="tree-toggle" onclick="toggleTreeItem(this)">' + indent + toggleSymbol + ' ' + (obj.name || '(unnamed)') + (obj.type ? ' &lt;' + obj.type + '&gt;' : '') + '</span>';
        
        if (hasExpandable) {
            html += '<div class="tree-children" style="display: none;">';
            if (hasProperties) {
                html += '<div class="properties" style="padding-left: 20px; font-size: 10px; color: #ccc;">';
                html += this.getPropertiesHTML(obj.obj);
                html += '</div>';
            }
            if (hasChildren) {
                for (var child of obj.children) {
                    html += this.htmlFromNameTree(child, depth + 1);
                }
            }
            html += '<hr style="border: none; border-top: 1px solid #666; margin: 5px 0;">';
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
