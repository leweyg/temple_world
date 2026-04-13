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
        var dropdown = this.generateJumpToDropdown();
        return dropdown + this.htmlFromNameTree(whole);
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
    return TempleReflectionText;
}());
export { TempleReflectionText };
