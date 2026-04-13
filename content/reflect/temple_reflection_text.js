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
        this.reflector = reflector;
        this.isTempleReflectionText = true;
    }
    TempleReflectionText.prototype.drawHTMLReflection = function () {
        var world = this.reflector.world;
        var reses = this.objPrintResourceRecursive(world.resourceRoot);
        var scenes = this.objPrintScene(world.parentScene);
        var whole = new RefInst();
        whole.name = "resources/scenes";
        whole.children = [reses, scenes];
        return this.htmlFromNameTree(whole);
    };
    TempleReflectionText.prototype.htmlFromNameTree = function (obj, depth) {
        if (depth === void 0) { depth = 0; }
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
            for (var _i = 0, _a = obj.children; _i < _a.length; _i++) {
                var child = _a[_i];
                html += this.htmlFromNameTree(child, depth + 1);
            }
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
