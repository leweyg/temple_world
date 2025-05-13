import { Customer } from "./customer.js";
import * as THREE from 'three';

export class Greeter {
    greeting: string;
    pos : THREE.Vector3 = new THREE.Vector3();
    customer : Customer;
    //NOT VALID SYNTAX
   
    constructor(message: string) {
      this.greeting = message;
      this.customer = new Customer("PersonA");
    }
   
    greet(customer : Customer) {
      var c = (customer ?? this.customer);
      return "Hello there " + c.getName();
    }
  }
