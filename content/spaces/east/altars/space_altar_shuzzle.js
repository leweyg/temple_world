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
import * as THREE from 'three';
import { ResourceTypeJson, ResourceInstance } from '../../../code/resource_tree.js';
var SpaceAltarShuzzleInstance = /** @class */ (function () {
    function SpaceAltarShuzzleInstance(res, parent, parentRes) {
        this.lines = null;
        this.isSpaceAltarShuzzleInstance = true;
        var name = Object.keys(res)[0];
        var resData = res[name];
        this.scene = new THREE.Object3D();
        this.scene.name = "ShuzzleInstance";
        this.scene.userData = this;
        parent.add(this.scene);
        var goal = this.sceneFromMesh(resData.Board.Goal.Mesh);
        this.scene.add(goal);
        var resBlocks = resData.Board.Blocks;
        for (var ri in resBlocks) {
            var rb = resBlocks[ri];
            var s = this.sceneFromMesh(rb.Mesh);
            if (rb.Center) {
                s.position.copy(rb.Center);
            }
            this.scene.add(s);
        }
    }
    SpaceAltarShuzzleInstance.prototype.sceneFromMesh = function (data) {
        if (data.VerticesPerPolygon == 2) {
            var verts = data.Vertices;
            var points = [];
            for (var vi = 0; vi < verts.length; vi++) {
                var v = verts[vi];
                points.push(new THREE.Vector3(v.pos.x, v.pos.y, v.pos.z));
            }
            var material = new THREE.LineBasicMaterial({
                color: 0xccFFcc, transparent: true,
                opacity: 0.5
            });
            var geometry = new THREE.BufferGeometry().setFromPoints(points);
            this.lines = new THREE.Line(geometry, material);
            return this.lines;
        }
        if (data.VerticesPerPolygon == 4) {
            var verts = data.Vertices;
            var corners = [];
            var points = [];
            for (var vi = 0; vi < verts.length; vi++) {
                var v = verts[vi];
                corners.push(new THREE.Vector3(v.pos.x, v.pos.y, v.pos.z));
                if (((vi + 1) % 4) == 0) {
                    points.push(corners[0]);
                    points.push(corners[1]);
                    points.push(corners[2]);
                    points.push(corners[2]);
                    points.push(corners[3]);
                    points.push(corners[0]);
                    corners.length = 0;
                }
            }
            var geo = new THREE.BufferGeometry();
            geo.setFromPoints(points);
            var mat = new THREE.MeshToonMaterial({ color: 0x00FF00, side: THREE.DoubleSide });
            var mesh = new THREE.Mesh(geo, mat);
            return mesh;
        }
        throw "Unknown verts/poly:" + data.VerticesPerPolygon;
    };
    return SpaceAltarShuzzleInstance;
}());
var SpaceAltarShuzzle = /** @class */ (function (_super) {
    __extends(SpaceAltarShuzzle, _super);
    function SpaceAltarShuzzle() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SpaceAltarShuzzle.prototype.makeResourceInstanceFromLoaded = function (resData, parent) {
        var res = resData.data;
        var nameStr = Object.keys(res)[0];
        var data = res[nameStr];
        var state = new SpaceAltarShuzzleInstance(res, parent, resData.res);
        var inst = new ResourceInstance(state, resData, resData.res);
        return this.simplePromise(inst);
    };
    SpaceAltarShuzzle.ResourceTypeShuzzle = new SpaceAltarShuzzle();
    return SpaceAltarShuzzle;
}(ResourceTypeJson));
export { SpaceAltarShuzzle, SpaceAltarShuzzleInstance };
