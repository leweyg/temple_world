
import * as THREE from 'three';

class TempleSpaceMapBuilder {
    scene : THREE.Object3D;
    parentScene : THREE.Object3D;
    surfaceShape = [ 64, 64 ];
    texture : THREE.Texture;
    mesh : THREE.Mesh;
    mainMaterial : THREE.Material;

    constructor(parentScene:THREE.Object3D) {
        this.parentScene = parentScene;
        this.scene = new THREE.Group();
        this.scene.name = "TempleSpaceMap"
        parentScene.add(this.scene);

        this.texture = this.mapGridTexture();

        this.mainMaterial = this.mapGridShader();

        const data = this.mapGridVertices();

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute( 'position', new THREE.BufferAttribute( data.vertices, 3 ) );
        geometry.setAttribute( 'uv', new THREE.BufferAttribute( data.uv, 2 ) );
        geometry.setIndex( data.indices );

        this.mesh = new THREE.Mesh( geometry, this.mainMaterial );
        this.scene.add( this.mesh );
    }

    indexFromXY(x:number,y:number) {
        return (y * this.surfaceShape[0]) + x;
    }

    mapGridTexture() {
        const loader = new THREE.TextureLoader();
        const image = loader.load('content/images/sfbay_height.png'); 
        return image;

        // 1. Create a DataTexture
        const height = this.surfaceShape[0];
        const width = this.surfaceShape[1];
        const size = width * height;
        const data = new Uint8Array(4 * size); // RGBA data

        for (let i = 0; i < size; i++) {
            const stride = i * 4;
            // Generate some random displacement values (e.g., grayscale noise)
            const value = Math.floor(Math.random() * 255);
            data[stride] = value;     // R
            data[stride + 1] = value; // G
            data[stride + 2] = value; // B
            data[stride + 3] = 255;   // A
        }

        const displacementTexture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
        displacementTexture.needsUpdate = true;
        return displacementTexture;
    }

    mapGridShader() {
        const flatMaterial = new THREE.MeshBasicMaterial( { 
            //color: 0x557755, 
            map : this.texture,
            //side:THREE.DoubleSide
        } );
        //return flatMaterial;

        const vertexShader = `
    uniform sampler2D displacementTexture;
    uniform float uTime;
    varying vec2 vUv;

    void main() {
        vUv = uv;
        vec4 displacement = texture2D(displacementTexture, uv);
        
        // Use the red channel of the texture for displacement
        float displacementFactor = displacement.r * 1.0; 

        // Apply displacement along the normal, optionally animated with time
        vec3 displaceDir = vec3(0,1,0); // normal; 
        vec3 displacedPosition = position + displaceDir * displacementFactor;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
    }
`;
        const fragmentShader = `
    uniform sampler2D displacementTexture;
    varying vec2 vUv;

    void main() {
        vec4 displacement = texture2D(displacementTexture, vUv);
        gl_FragColor = displacement; // vec4( displacement.r, 1, 0, 1 );
        //gl_FragColor = vec4(vUv, 0.5 + 0.5 * sin(vUv.x * 10.0), 1.0);
    }
`;
        const material = new THREE.ShaderMaterial({
            uniforms: {
                displacementTexture: { value: this.texture },
                uTime: { value: 0.0 }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            side: THREE.DoubleSide // Important for seeing both sides of displaced geometry
        });
        return material;
    }

    mapGridVertices() {
        const points = [];
        const indices = [];
        const uvs = [];
        const gridShape = this.surfaceShape;
        const posScale = 20.0 / this.surfaceShape[0];
        for (var gy=0; gy<gridShape[0]; gy++) {
            for (var gx=0; gx<gridShape[1]; gx++) {
                points.push( new THREE.Vector3( gx * posScale, 0, -gy * posScale ) );
                uvs.push( gy / gridShape[0] );
                uvs.push( gx / gridShape[1] ); // TODO: x/(shape-1)

                if ((gx>0) && (gy > 0)) {
                    indices.push( this.indexFromXY(gy-1,gx-1));
                    indices.push( this.indexFromXY(gy-0,gx-0));
                    indices.push( this.indexFromXY(gy-1,gx-0));

                    indices.push( this.indexFromXY(gy-0,gx-0));
                    indices.push( this.indexFromXY(gy-1,gx-1));
                    indices.push( this.indexFromXY(gy-0,gx-1));
                }
                //points.push( new THREE.Vector3( gx - 1, 0, -gy ) );
                
                //points.push( new THREE.Vector3( gx, 0, -gy - 1 ) );
                //points.push( new THREE.Vector3( gx - 1, 0, -gy - 1 ) );
            }
        }
        const linearPoints = [];
        for (var vi in points) {
            var v = points[vi];
            linearPoints.push(v.x);
            linearPoints.push(v.y);
            linearPoints.push(v.z);
        }
        const vertices = new Float32Array(linearPoints);
        const uv = new Float32Array(uvs);
        return { vertices, uv, indices };
    }


}

export { TempleSpaceMapBuilder };
