import { ResourceInstance } from "../code/resource_tree.js";
import { TempleFieldBase } from "../fields/temple_field.js";
var RefInst = /** @class */ (function () {
    function RefInst() {
        this.name = "";
        this.type = "";
        this.children = [];
        this.obj = null; // the THREE.Object3D or ResourceTree
    }
    return RefInst;
}());
var TempleReflectionText = /** @class */ (function () {
    function TempleReflectionText(reflector) {
        this.isTempleReflectionText = true;
        this.treeItemCounter = 0;
        this.reflector = reflector;
        this.isTempleReflectionText = true;
    }
    TempleReflectionText.prototype.drawHTMLReflection = function () {
        this.treeItemCounter = 0;
        var world = this.reflector.world;
        var reses = this.objPrintResourceRecursive(world.resourceRoot);
        var scenes = this.objPrintScene(world.parentScene);
        var whole = new RefInst();
        whole.name = "scenes/resources";
        whole.children = [scenes, reses];
        var html = '';
        html += '<div style="display: flex; gap: 4px; margin-bottom: 12px;">';
        html += '<button id="devmenu-tab-btn-scene" onclick="window.selectDevMenuTab(\'scene\')" style="padding: 6px 10px; background: #555; color: #fff; border: 1px solid #666; cursor: pointer; font-family: monospace; font-size: 12px;">Scene</button>';
        html += '<button id="devmenu-tab-btn-focus" onclick="window.selectDevMenuTab(\'focus\')" style="padding: 6px 10px; background: transparent; color: #aaa; border: 1px solid #666; cursor: pointer; font-family: monospace; font-size: 12px;">Focus</button>';
        html += '<button id="devmenu-tab-btn-resources" onclick="window.selectDevMenuTab(\'resources\')" style="padding: 6px 10px; background: transparent; color: #aaa; border: 1px solid #666; cursor: pointer; font-family: monospace; font-size: 12px;">Resources</button>';
        html += '</div>';
        html += '<div id="devmenu-tab-scene" class="devmenu-tab-content">';
        html += this.generateJumpToDropdown();
        html += this.htmlFromNameTree(whole);
        html += '</div>';
        html += '<div id="devmenu-tab-focus" class="devmenu-tab-content" style="display:none;">';
        html += this.generateFocusHTML();
        html += '</div>';
        html += '<div id="devmenu-tab-resources" class="devmenu-tab-content" style="display:none;">';
        html += '<div style="margin-bottom: 10px; color: #ccc; font-size: 12px;">Resource tree only</div>';
        html += this.htmlFromNameTree(reses);
        html += '</div>';
        return html;
    };
    TempleReflectionText.prototype.generateJumpToDropdown = function () {
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
    };
    TempleReflectionText.prototype.htmlFromNameTree = function (obj, depth) {
        if (depth === void 0) { depth = 0; }
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
                for (var _i = 0, _a = obj.children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    html += this.htmlFromNameTree(child, depth + 1);
                }
            }
            html += '<hr style="border: none; border-top: 1px solid #666; margin: 5px 0;">';
            html += '</div>';
        }
        html += '</div>';
        return html;
    };
    TempleReflectionText.prototype.getPropertiesHTML = function (obj) {
        var html = '';
        if (obj.name !== undefined)
            html += 'name: ' + obj.name + '<br>';
        if (obj.position)
            html += 'position: ' + obj.position.x.toFixed(2) + ', ' + obj.position.y.toFixed(2) + ', ' + obj.position.z.toFixed(2) + '<br>';
        if (obj.rotation)
            html += 'rotation: ' + obj.rotation.x.toFixed(2) + ', ' + obj.rotation.y.toFixed(2) + ', ' + obj.rotation.z.toFixed(2) + '<br>';
        if (obj.scale)
            html += 'scale: ' + obj.scale.x.toFixed(2) + ', ' + obj.scale.y.toFixed(2) + ', ' + obj.scale.z.toFixed(2) + '<br>';
        if (obj.visible !== undefined)
            html += 'visible: ' + obj.visible + '<br>';
        if (obj.userData && Object.keys(obj.userData).length > 0) {
            html += 'userData: ' + Object.keys(obj.userData).join(', ') + '<br>';
        }
        return html;
    };
    TempleReflectionText.prototype.objPrintResourceRecursive = function (resTree) {
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
    };
    TempleReflectionText.prototype.objPrintScene = function (node) {
        var ans = new RefInst();
        ans.name = node.name || 'Scene';
        ans.type = node.type;
        ans.obj = node;
        ans.children = [];
        for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
            var child = _a[_i];
            ans.children.push(this.objPrintScene(child));
        }
        return ans;
    };
    TempleReflectionText.prototype.generateFocusHTML = function () {
        var world = this.reflector.world;
        var focusedField = world.avatar.view.latestCenterField();
        var heldField = world.avatar.focus.held;
        var targetContact = world.avatar.view.targetContact;
        var html = '';
        html += '<div style="margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid #666;">';
        html += '<div style="font-size: 13px; color: #fff; margin-bottom: 8px;">Avatar Focus</div>';
        html += '<div style="font-size: 12px; color: #ccc; margin-bottom: 4px;">Centered field: ' + this.describeFocusField(focusedField) + '</div>';
        html += '<div style="font-size: 12px; color: #ccc;">Held field: ' + this.describeFocusField(heldField) + '</div>';
        html += '</div>';
        html += '<div style="font-size: 13px; color: #fff; margin-bottom: 8px;">Collision hits</div>';
        html += '<div style="font-size: 12px; color: #ccc; margin-bottom: 8px;">Hit now: ' + (targetContact.hit_now ? 'yes' : 'no') + '</div>';
        if (targetContact.hit_now) {
            html += '<div style="font-size: 12px; color: #ccc; margin-bottom: 8px;">Hit position: ' + targetContact.hit_pos.x.toFixed(2) + ', ' + targetContact.hit_pos.y.toFixed(2) + ', ' + targetContact.hit_pos.z.toFixed(2) + '</div>';
        }
        if (targetContact.intersects.length === 0) {
            html += '<div style="color: #999; font-size: 12px;">No currently intersected objects.</div>';
        }
        else {
            for (var i = 0; i < targetContact.intersects.length; i++) {
                var hit = targetContact.intersects[i];
                var field = TempleFieldBase.tryFieldFromObject3D(hit.object);
                var inst = ResourceInstance.tryFromObject3D(hit.object);
                html += '<div style="margin-bottom: 8px; padding: 6px; border: 1px solid #444;">';
                html += '<div style="font-size: 12px; color: #fff;">' + (hit.object.name || hit.object.type || 'Object') + '</div>';
                html += '<div style="font-size: 11px; color: #999;">type: ' + (hit.object.type || 'Unknown') + '</div>';
                if (field) {
                    html += '<div style="font-size: 11px; color: #999;">field: ' + this.describeFocusField(field) + '</div>';
                }
                if (inst) {
                    html += '<div style="font-size: 11px; color: #999;">resource: ' + inst.res_data.res.fullPathStr() + '</div>';
                }
                html += '<div style="font-size: 11px; color: #999;">distance: ' + hit.distance.toFixed(3) + '</div>';
                html += '</div>';
            }
        }
        return html;
    };
    TempleReflectionText.prototype.describeFocusField = function (field) {
        if (!field) {
            return '<span style="color:#777;">none</span>';
        }
        if (typeof field.fullPathStr === 'function') {
            return field.fullPathStr();
        }
        return field.constructor ? field.constructor.name : 'field';
    };
    return TempleReflectionText;
}());
export { TempleReflectionText };
