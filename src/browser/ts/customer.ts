
export class Customer {
    name: string;
   
    constructor(message: string) {
      this.name = message;
    }
   
    getName() {
      return "I am " + this.name;
    }
  }
