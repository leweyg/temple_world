
import * as THREE from 'three';
import { ResourceTree, ResourceTypeJson, ResourceData, ResourceInstance } from '../../../code/resource_tree.js';
import { SpaceAltarShuzzleBlock } from './space_altar_shuzzle_block.js';

class SpaceAltarShuzzleInstance {
    scene : THREE.Object3D;
    lines : THREE.Line|null = null;
    blocks : SpaceAltarShuzzleBlock[] = [];
    isSpaceAltarShuzzleInstance : boolean = true;

    constructor(res:any, parent:THREE.Object3D, parentRes:ResourceTree) {
        const name = Object.keys(res)[0];
        const resData = res[name];

        this.scene = new THREE.Object3D();
        this.scene.name = "ShuzzleInstance";
        this.scene.userData = this;
        parent.add(this.scene);

        var goal = this.sceneFromMesh(resData.Board.Goal.Mesh);
        this.scene.add(goal);

        const resBlocks = resData.Board.Blocks;
        for (var ri in resBlocks) {
            var rb = resBlocks[ri];
            const block = new SpaceAltarShuzzleBlock(
                rb.Mesh,
                "block_" + ri,
                this.scene,
                parentRes
            );
            if (rb.Center) {
                block.setPosition(new THREE.Vector3(rb.Center.x, rb.Center.y, rb.Center.z));
            }
            this.blocks.push(block);
        }
    }

    sceneFromMesh(data:any) {
        
        if (data.VerticesPerPolygon == 2) {
            const verts = data.Vertices;
            const points = [];
            for (var vi=0; vi<verts.length; vi++) {
                const v = verts[vi];
                points.push(new THREE.Vector3(v.pos.x, v.pos.y, v.pos.z));
            }
            const material = new THREE.LineBasicMaterial( { 
                color: 0xccFFcc, transparent:true,
                opacity:0.5 } );
            const geometry = new THREE.BufferGeometry().setFromPoints( points );
            this.lines = new THREE.Line( geometry, material );
            return this.lines;
        }

        if (data.VerticesPerPolygon == 4) {
            const verts = data.Vertices;
            const corners = [];
            const points = [];
            for (var vi=0; vi<verts.length; vi++) {
                const v = verts[vi];
                corners.push(new THREE.Vector3(v.pos.x, v.pos.y, v.pos.z));
                if (((vi+1)%4) == 0) {
                    points.push(corners[0])
                    points.push(corners[1])
                    points.push(corners[2])
                    
                    points.push(corners[2])
                    points.push(corners[3])
                    points.push(corners[0])
                    corners.length = 0;
                }
            }
            const geo = new THREE.BufferGeometry();
            geo.setFromPoints(points);
            const mat = new THREE.MeshToonMaterial(
                {color:0x00FF00, side:THREE.DoubleSide});
            const mesh = new THREE.Mesh(geo, mat);
            return mesh;
        }

        throw "Unknown verts/poly:" + data.VerticesPerPolygon;
    }
}

class SpaceAltarShuzzle extends ResourceTypeJson {
    static ResourceTypeShuzzle = new SpaceAltarShuzzle();

    makeResourceInstanceFromLoaded(
        resData:ResourceData,
        parent:THREE.Object3D)
        :Promise<ResourceInstance>
    {
        var res = resData.data;
        var nameStr = Object.keys(res)[0];
        var data = res[nameStr];
        var state = new SpaceAltarShuzzleInstance(res, parent, resData.res);
        var inst = new ResourceInstance(state, resData, resData.res);
        return this.simplePromise(inst);
    }
}

export { SpaceAltarShuzzle, SpaceAltarShuzzleInstance };
