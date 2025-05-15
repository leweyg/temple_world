var RefInst = /** @class */ (function () {
    function RefInst() {
        this.name = "";
        this.children = [];
    }
    return RefInst;
}());
var TempleReflectionText = /** @class */ (function () {
    function TempleReflectionText(reflector) {
        this.isTempleReflectionText = true;
        this.reflector = reflector;
        this.isTempleReflectionText = true;
    }
    TempleReflectionText.prototype.drawTextReflection = function () {
        var world = this.reflector.world;
        var reses = this.objPrintResourceRecursive(world.resourceRoot);
        var scenes = this.objPrintScene(world.parentScene);
        var whole = {
            name: "resources/scenes",
            children: [
                reses,
                scenes,
            ]
        };
        return this.textFromNameTree(whole);
    };
    TempleReflectionText.prototype.textFromNameTree = function (obj, tabs, skipPrefix) {
        if (tabs === void 0) { tabs = 0; }
        if (skipPrefix === void 0) { skipPrefix = false; }
        var line = "";
        for (var ti = 0; ti < tabs && !skipPrefix; ti++) {
            line += "  ";
        }
        if (obj.name) {
            line += obj.name;
        }
        else {
            line += "(unnamed)";
        }
        if (obj.type) {
            line += " <" + obj.type + ">";
        }
        if (obj.children && obj.children.length) {
            if (obj.children.length == 1) {
                line += " / ";
                line += this.textFromNameTree(obj.children[0], tabs + 1, true);
            }
            else {
                for (var i = 0; i < obj.children.length; i++) {
                    var child = obj.children[i];
                    line += "\n" + this.textFromNameTree(child, tabs + 1);
                }
            }
        }
        return line;
    };
    TempleReflectionText.prototype.objPrintResourceRecursive = function (resTree) {
        var ans = new RefInst();
        ans.name = resTree.resource_path + " <" + resTree.resource_type.name + ">",
            ans.children = [];
        for (var ci in resTree.tree_children) {
            var child = resTree.tree_children[ci];
            var ca = this.objPrintResourceRecursive(child);
            ans.children.push(ca);
        }
        return ans;
    };
    TempleReflectionText.prototype.objPrintScene = function (node) {
        return node;
    };
    return TempleReflectionText;
}());
export { TempleReflectionText };
