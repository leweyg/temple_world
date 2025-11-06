
import * as THREE from 'three';

class TempleSpaceMapBuilder {
    scene : THREE.Object3D;
    parentScene : THREE.Object3D;
    surfaceShape = [ 128, 128 ];
    texture : THREE.Texture;
    mesh : THREE.Mesh;
    mainMaterial : THREE.Material;
    flatScale = 150.0;
    heightScale = 8.01;

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

    posFromXY(gx:number, gy:number, into:THREE.Vector3|undefined=undefined) {
        const count = this.surfaceShape[0];
        const posScale = this.flatScale / count;
        const posHalf = -posScale * (count / 2);
        if (!into) {
            into = new THREE.Vector3();
        }
        into.set( posHalf + ( gx * posScale ), 0, ( ( posHalf) + ( gy * posScale ) ) * 1.0 );
        return into;
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

        const vertexConsts = ""
        + "const float heightScale = " + this.heightScale + ";\n"
        + "const float heightOffset = " + 1.01 + ";\n";

        const vertexShader = vertexConsts + `
    uniform sampler2D displacementTexture;
    uniform float uTime;
    varying vec2 vUv;
    varying vec3 vWorldPos;

    void main() {
        vUv = uv;
        vec4 displacement = texture2D(displacementTexture, uv);
        
        // Use the red channel of the texture for displacement
        float displacementFactor = ( displacement.r * heightScale ) - heightOffset;

        // Apply displacement along the normal, optionally animated with time
        vec3 displaceDir = vec3(0,1,0); // normal; 
        vec3 displacedPosition = position + displaceDir * displacementFactor;
        
        vec4 worldPos = modelMatrix * vec4(displacedPosition, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
`;
        const fragmentShader = `
    uniform sampler2D displacementTexture;
    varying vec2 vUv;
    varying vec3 vWorldPos;

    float gridShadeFromWorldPos() {
        vec3 worldPos = vWorldPos.xyz;
        vec3 unitPos = fract( worldPos * vec3( 1.0, 2.0, 1.0 ) );
        vec3 unitDist = clamp( 1.0 - abs( ( unitPos - 0.5 ) / 0.05 ), 0.0, 1.0 );
        float xzShade = 0.25;
        float gridShade = clamp( unitDist.y + (xzShade * unitDist.x ) + (xzShade * unitDist.z), 0.0, 1.0);
        return gridShade; // vec4( gridShade, gridShade, gridShade, 1.0 );
    }

    void main() {
        vec4 displacement = texture2D(displacementTexture, vUv);
        const vec4 lowerColor = vec4(0.5, 0.5, 0.5, 1.0);
        const vec4 upperColor = vec4(1.0, 1.0, 1.0, 1.0);
        float shade = gridShadeFromWorldPos();
        vec4 baseColor = mix( lowerColor, upperColor, shade );
        //vec4 baseColor = colorFromWorldPos();
        gl_FragColor = baseColor; // + vec4( 0, 1, 0, 0 );
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
        function inv1(v:number) {
            return 1.0 - v;
        }
        for (var gy=0; gy<gridShape[0]; gy++) {
            for (var gx=0; gx<gridShape[1]; gx++) {
                points.push( this.posFromXY(gx,gy) );
                uvs.push( ( gx / gridShape[0] ) );
                uvs.push( inv1( gy / gridShape[1] ) ); // TODO: x/(shape-1)

                if ((gx>0) && (gy > 0)) {
                    indices.push( this.indexFromXY(gy-1,gx-1));
                    indices.push( this.indexFromXY(gy-0,gx-0));
                    indices.push( this.indexFromXY(gy-1,gx-0));

                    indices.push( this.indexFromXY(gy-0,gx-0));
                    indices.push( this.indexFromXY(gy-1,gx-1));
                    indices.push( this.indexFromXY(gy-0,gx-1));
                }
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
