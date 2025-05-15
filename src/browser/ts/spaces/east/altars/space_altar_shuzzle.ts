
import * as THREE from 'three';
import { ResourceTree, ResourceTypeJson, ResourceData, ResourceInstance } from '../../../code/resource_tree.js';

class SpaceAltarShuzzleInstance {
    scene : THREE.Object3D;
    lines : THREE.Line|null = null;

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
            var s = this.sceneFromMesh(rb.Mesh);
            if (rb.Center) {
                s.position.copy(rb.Center);
            }
            this.scene.add( s );
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
        var inst = new ResourceInstance(state.scene, resData, resData.res);
        inst.isObject3D = true;
        return this.simplePromise(inst);
    }
}

export { SpaceAltarShuzzle };
