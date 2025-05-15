
import { TempleAvatar } from "../avatar/temple_avatar.js";
import { TempleWorld } from "../temple_world.js";
import { TempleReflectionText } from "./temple_reflection_text.js";

class TempleReflection {
    world:TempleWorld;
    isTempleReflection = true;
    texter : TempleReflectionText;

    constructor(world:TempleWorld) {
        this.world = world;
        this.isTempleReflection = true;
        this.texter = new TempleReflectionText(this);
    }   
}

export { TempleReflection }
