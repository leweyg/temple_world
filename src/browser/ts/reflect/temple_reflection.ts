
import { TempleReflectionText } from "./temple_reflection_text.js";

class TempleReflection {
    constructor(world) {
        this.world = world;
        this.isTempleReflection = true;
        this.texter = new TempleReflectionText(this);
    }   
}

export { TempleReflection }
