import { Customer } from "./customer.js";
import * as THREE from 'three';
var Greeter = /** @class */ (function () {
    //NOT VALID SYNTAX
    function Greeter(message) {
        this.pos = new THREE.Vector3();
        this.greeting = message;
        this.customer = new Customer("PersonA");
    }
    Greeter.prototype.greet = function (customer) {
        var c = (customer !== null && customer !== void 0 ? customer : this.customer);
        return "Hello there " + c.getName();
    };
    return Greeter;
}());
export { Greeter };
