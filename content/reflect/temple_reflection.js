import { TempleReflectionText } from "./temple_reflection_text.js";
var TempleReflection = /** @class */ (function () {
    function TempleReflection(world) {
        this.isTempleReflection = true;
        this.world = world;
        this.isTempleReflection = true;
        this.texter = new TempleReflectionText(this);
    }
    return TempleReflection;
}());
export { TempleReflection };
