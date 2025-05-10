
class TempleReflectionText {
    constructor(reflector) {
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

    textFromNameTree(obj, tabs=0, skipPrefix=false) {
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

    objPrintResourceRecursive(resTree) {
        var ans = {
            name:resTree.resource_path + " <" + resTree.resource_type.name + ">",
            children:[],
        }
        for (var ci in resTree.tree_children) {
            var child = resTree.tree_children[ci];
            ans.children.push(this.objPrintResourceRecursive(child));
        }
        return ans;
    }

    objPrintScene(node) {
        return node;
    }
}

export { TempleReflectionText }
