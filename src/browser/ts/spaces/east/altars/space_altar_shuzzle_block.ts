import * as THREE from 'three';
import { TempleFieldBase } from '../../../fields/temple_field.js';
import { ResourceTree, ResourceData, ResourceInstance, ResourceType } from '../../../code/resource_tree.js';

class SpaceAltarShuzzleBlockType extends ResourceType {
    override isSyncAlloc(): boolean {
        return true;
    }
}

const shuzzleBlockType = new SpaceAltarShuzzleBlockType();

class SpaceAltarShuzzleBlock extends TempleFieldBase {
    mesh: THREE.Mesh;
    matDefault: THREE.Material;
    matCentered: THREE.Material;
    matHeld: THREE.Material;
    meshInstance: ResourceInstance | null = null;
    isGridSnappable: boolean = true;
    gridSnapSize: number = 1.0;
    gridSnapThreshold: number = 0.35;
    rotationSnapAngle: number = Math.PI / 2;
    rotationSnapThreshold: number = Math.PI / 16;

    constructor(
        meshData: any,
        blockName: string,
        sceneParent: THREE.Object3D,
        resourceParent: ResourceTree
    ) {
        super("shuzzleblock_" + blockName, resourceParent, shuzzleBlockType);
        
        this.is_focusable = true;
        this.resourceParent.resourceAddChild(this);

        // Create materials for different focus states
        this.matDefault = new THREE.MeshToonMaterial({ color: 0x00FF00 });
        this.matCentered = new THREE.MeshToonMaterial({ color: 0xccCCcc });
        this.matHeld = new THREE.MeshToonMaterial({ color: 0x0000FF });

        // Create mesh from the block data
        this.mesh = this.createMeshFromData(meshData);
        this.mesh.material = this.matDefault;
        this.mesh.name = blockName;
        
        sceneParent.add(this.mesh);

        // Register the mesh as a ResourceInstance so the raycaster can find it
        const resData = new ResourceData(shuzzleBlockType, { mesh: this.mesh }, this);
        this.meshInstance = ResourceInstance.fromObject3D(this.mesh, resData);
        this.mesh.userData.field = this;
        this.state_instance_latest = this.meshInstance;
        this.state_instancer = Promise.resolve(this.meshInstance);
        this.state_loaded_latest = resData;
    }

    applyPositionDelta(delta: THREE.Vector3, isPush: boolean = false) {
        this.mesh.position.add(delta);
    }

    applyRotationDelta(deltaQuat: THREE.Quaternion) {
        const nextQuat = this.mesh.quaternion.clone();
        nextQuat.multiply(deltaQuat);
        this.mesh.quaternion.copy(nextQuat);
    }

    snapToGrid() {
        const snappedPos = this.snapPositionToGrid(this.mesh.position);
        this.mesh.position.copy(snappedPos);
        const nearestY = Math.round(this.getYRotation() / this.rotationSnapAngle) * this.rotationSnapAngle;
        this.setYRotation(nearestY);
    }

    private snapPositionToGrid(position: THREE.Vector3) {
        return new THREE.Vector3(
            Math.round(position.x / this.gridSnapSize) * this.gridSnapSize,
            Math.round(position.y / this.gridSnapSize) * this.gridSnapSize,
            Math.round(position.z / this.gridSnapSize) * this.gridSnapSize
        );
    }

    private getYRotation(): number {
        const euler = new THREE.Euler();
        euler.setFromQuaternion(this.mesh.quaternion, 'YXZ');
        return euler.y;
    }

    private setYRotation(angle: number) {
        const euler = new THREE.Euler(0, angle, 0, 'YXZ');
        this.mesh.quaternion.setFromEuler(euler);
    }

    private createMeshFromData(data: any): THREE.Mesh {
        if (data.VerticesPerPolygon !== 4) {
            throw `SpaceAltarShuzzleBlock expects VerticesPerPolygon=4, got ${data.VerticesPerPolygon}`;
        }

        const verts = data.Vertices;
        const corners: THREE.Vector3[] = [];
        const points: THREE.Vector3[] = [];

        for (let vi = 0; vi < verts.length; vi++) {
            const v = verts[vi];
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

        const geo = new THREE.BufferGeometry();
        geo.setFromPoints(points);
        geo.computeVertexNormals();
        geo.computeBoundingSphere();
        const mesh = new THREE.Mesh(geo, this.matDefault);
        mesh.geometry = geo;
        mesh.userData = mesh.userData || {};
        
        return mesh;
    }

    override doFocusedChanged(isHeld: boolean, isCentered: boolean) {
        this.mesh.material = isHeld ? this.matHeld : (isCentered ? this.matCentered : this.matDefault);
    }

    getPosition(): THREE.Vector3 {
        return this.mesh.position;
    }

    setPosition(pos: THREE.Vector3): void {
        this.mesh.position.copy(pos);
    }
}

export { SpaceAltarShuzzleBlock };
