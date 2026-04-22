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
import { TempleFieldBase } from '../../../fields/temple_field.js';
import { ResourceData, ResourceInstance, ResourceType } from '../../../code/resource_tree.js';
var SpaceAltarShuzzleBlockType = /** @class */ (function (_super) {
    __extends(SpaceAltarShuzzleBlockType, _super);
    function SpaceAltarShuzzleBlockType() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SpaceAltarShuzzleBlockType.prototype.isSyncAlloc = function () {
        return true;
    };
    return SpaceAltarShuzzleBlockType;
}(ResourceType));
var shuzzleBlockType = new SpaceAltarShuzzleBlockType();
var SpaceAltarShuzzleBlock = /** @class */ (function (_super) {
    __extends(SpaceAltarShuzzleBlock, _super);
    function SpaceAltarShuzzleBlock(meshData, blockName, sceneParent, resourceParent) {
        var _this = _super.call(this, "shuzzleblock_" + blockName, resourceParent, shuzzleBlockType) || this;
        _this.meshInstance = null;
        _this.isGridSnappable = true;
        _this.gridSnapSize = 1.0;
        _this.gridSnapThreshold = 0.35;
        _this.rotationSnapAngle = Math.PI / 2;
        _this.rotationSnapThreshold = Math.PI / 16;
        _this.visualSnapDuration = 0.15;
        _this.isVisualSnapAnimating = false;
        _this.visualSnapStartTime = 0;
        _this.visualSnapStartPos = new THREE.Vector3();
        _this.visualSnapWorldPos = new THREE.Vector3();
        _this.visualSnapStartQuat = new THREE.Quaternion();
        _this.visualSnapWorldQuat = new THREE.Quaternion();
        _this.visualSnapRootQuat = new THREE.Quaternion();
        _this.visualSnapIdentityQuat = new THREE.Quaternion();
        _this.visualSnapZeroPos = new THREE.Vector3();
        _this.is_focusable = true;
        _this.resourceParent.resourceAddChild(_this);
        // Create materials for different focus states
        _this.matDefault = new THREE.MeshToonMaterial({ color: 0x00FF00 });
        _this.matCentered = new THREE.MeshToonMaterial({ color: 0xccCCcc });
        _this.matHeld = new THREE.MeshToonMaterial({ color: 0x0000FF });
        _this.sceneRoot = new THREE.Group();
        _this.sceneRoot.name = blockName;
        sceneParent.add(_this.sceneRoot);
        // Create mesh from the block data
        _this.mesh = _this.createMeshFromData(meshData);
        _this.mesh.material = _this.matDefault;
        _this.mesh.name = blockName;
        _this.sceneRoot.add(_this.mesh);
        // Register the mesh as a ResourceInstance so the raycaster can find it
        var resData = new ResourceData(shuzzleBlockType, { mesh: _this.sceneRoot }, _this);
        _this.meshInstance = ResourceInstance.fromObject3D(_this.sceneRoot, resData);
        _this.sceneRoot.userData.field = _this;
        _this.mesh.userData.field = _this;
        _this.mesh.userData.resInstPtr = _this.meshInstance;
        _this.state_instance_latest = _this.meshInstance;
        _this.state_instancer = Promise.resolve(_this.meshInstance);
        _this.state_loaded_latest = resData;
        return _this;
    }
    SpaceAltarShuzzleBlock.prototype.applyPositionDelta = function (delta, isPush, startTime) {
        if (isPush === void 0) { isPush = false; }
        this.captureVisualWorldTransform();
        this.sceneRoot.position.add(delta);
        this.beginVisualSnapAnimation(startTime);
    };
    SpaceAltarShuzzleBlock.prototype.applyRotationDelta = function (deltaQuat, startTime) {
        this.captureVisualWorldTransform();
        var nextQuat = this.sceneRoot.quaternion.clone();
        nextQuat.multiply(deltaQuat);
        this.sceneRoot.quaternion.copy(nextQuat);
        this.beginVisualSnapAnimation(startTime);
    };
    SpaceAltarShuzzleBlock.prototype.updateVisualSnapAnimation = function (time) {
        if (!this.isVisualSnapAnimating) {
            return false;
        }
        var elapsedTime = time.timeVirtualCurrent - this.visualSnapStartTime;
        if (elapsedTime >= this.visualSnapDuration) {
            this.mesh.position.copy(this.visualSnapZeroPos);
            this.mesh.quaternion.identity();
            this.isVisualSnapAnimating = false;
            return false;
        }
        var t = elapsedTime / this.visualSnapDuration;
        var smoothT = t * t * (3.0 - 2.0 * t);
        this.mesh.position.lerpVectors(this.visualSnapStartPos, this.visualSnapZeroPos, smoothT);
        this.mesh.quaternion.copy(this.visualSnapStartQuat);
        this.mesh.quaternion.slerp(this.visualSnapIdentityQuat, smoothT);
        return true;
    };
    SpaceAltarShuzzleBlock.prototype.snapToGrid = function () {
        var snappedPos = this.snapPositionToGrid(this.sceneRoot.position);
        this.sceneRoot.position.copy(snappedPos);
        var nearestY = Math.round(this.getYRotation() / this.rotationSnapAngle) * this.rotationSnapAngle;
        this.setYRotation(nearestY);
        this.resetVisualSnapAnimation();
    };
    SpaceAltarShuzzleBlock.prototype.snapPositionToGrid = function (position) {
        return new THREE.Vector3(Math.round(position.x / this.gridSnapSize) * this.gridSnapSize, Math.round(position.y / this.gridSnapSize) * this.gridSnapSize, Math.round(position.z / this.gridSnapSize) * this.gridSnapSize);
    };
    SpaceAltarShuzzleBlock.prototype.getYRotation = function () {
        var euler = new THREE.Euler();
        euler.setFromQuaternion(this.sceneRoot.quaternion, 'YXZ');
        return euler.y;
    };
    SpaceAltarShuzzleBlock.prototype.setYRotation = function (angle) {
        var euler = new THREE.Euler(0, angle, 0, 'YXZ');
        this.sceneRoot.quaternion.setFromEuler(euler);
    };
    SpaceAltarShuzzleBlock.prototype.captureVisualWorldTransform = function () {
        this.mesh.updateWorldMatrix(true, false);
        this.mesh.getWorldPosition(this.visualSnapWorldPos);
        this.mesh.getWorldQuaternion(this.visualSnapWorldQuat);
    };
    SpaceAltarShuzzleBlock.prototype.beginVisualSnapAnimation = function (startTime) {
        this.sceneRoot.updateWorldMatrix(true, false);
        this.visualSnapStartPos.copy(this.visualSnapWorldPos);
        this.sceneRoot.worldToLocal(this.visualSnapStartPos);
        this.sceneRoot.getWorldQuaternion(this.visualSnapRootQuat);
        this.visualSnapStartQuat.copy(this.visualSnapRootQuat).invert();
        this.visualSnapStartQuat.multiply(this.visualSnapWorldQuat);
        this.mesh.position.copy(this.visualSnapStartPos);
        this.mesh.quaternion.copy(this.visualSnapStartQuat);
        this.visualSnapStartTime = startTime;
        this.isVisualSnapAnimating = true;
    };
    SpaceAltarShuzzleBlock.prototype.resetVisualSnapAnimation = function () {
        this.mesh.position.copy(this.visualSnapZeroPos);
        this.mesh.quaternion.identity();
        this.isVisualSnapAnimating = false;
    };
    SpaceAltarShuzzleBlock.prototype.createMeshFromData = function (data) {
        if (data.VerticesPerPolygon !== 4) {
            throw "SpaceAltarShuzzleBlock expects VerticesPerPolygon=4, got ".concat(data.VerticesPerPolygon);
        }
        var verts = data.Vertices;
        var corners = [];
        var points = [];
        for (var vi = 0; vi < verts.length; vi++) {
            var v = verts[vi];
            corners.push(new THREE.Vector3(v.pos.x, v.pos.y, v.pos.z));
            if (((vi + 1) % 4) === 0) {
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
        geo.computeVertexNormals();
        geo.computeBoundingSphere();
        var mesh = new THREE.Mesh(geo, this.matDefault);
        mesh.geometry = geo;
        mesh.userData = mesh.userData || {};
        return mesh;
    };
    SpaceAltarShuzzleBlock.prototype.doFocusedChanged = function (isHeld, isCentered) {
        this.mesh.material = isHeld ? this.matHeld : (isCentered ? this.matCentered : this.matDefault);
    };
    SpaceAltarShuzzleBlock.prototype.getPosition = function () {
        return this.sceneRoot.position;
    };
    SpaceAltarShuzzleBlock.prototype.setPosition = function (pos) {
        this.sceneRoot.position.copy(pos);
        this.resetVisualSnapAnimation();
    };
    return SpaceAltarShuzzleBlock;
}(TempleFieldBase));
export { SpaceAltarShuzzleBlock };
