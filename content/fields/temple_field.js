//import * as THREE from 'three';
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { ResourceTree } from "../code/resource_tree.js";
var TempleFieldBase = /** @class */ (function (_super) {
    __extends(TempleFieldBase, _super);
    function TempleFieldBase(pathName, resourceParent, resourceType) {
        if (pathName === void 0) { pathName = "TempleFieldBase"; }
        var _this = _super.call(this, pathName, resourceType) || this;
        _this.is_focusable = false;
        _this.resourceParent = resourceParent;
        _this.is_focusable = false;
        return _this;
    }
    TempleFieldBase.prototype.doFocusedChanged = function (isHeld, isCentered) {
    };
    return TempleFieldBase;
}(ResourceTree));
;
export { TempleFieldBase };
