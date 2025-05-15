var Customer = /** @class */ (function () {
    function Customer(message) {
        this.name = message;
    }
    Customer.prototype.getName = function () {
        return "I am " + this.name;
    };
    return Customer;
}());
export { Customer };
