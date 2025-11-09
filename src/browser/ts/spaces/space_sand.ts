
import * as THREE from 'three';
import { TempleWorld } from '../temple_world.js';
import { TempleTime } from '../temple_time.js';


class TempleSpaceSandBuilder {
    scene : THREE.Object3D;
    parentScene : THREE.Object3D;
    // "shape": [48, 32, 64]
    surfaceShape = [ 32, 64 ];
    texture : THREE.Texture;
    mesh : THREE.Mesh;
    mainMaterial : THREE.Material;
    displacementTexture : THREE.DataTexture|null = null;
    displaceData : Uint8Array|null = null;
    flatScale = 5.0;
    heightScale = 4.01;
    forwardBias = -5.0;
    sideBias = -2.0;
    timeLastUpdated = 0.0;

    constructor(parentScene:THREE.Object3D, world:TempleWorld) {
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

        const _this = this;
        world.time.listenToTime((time:TempleTime) => {
            _this.mapGridTick(time);
        });
    }

    indexFromXY(y:number,x:number) {
        return (y * this.surfaceShape[1]) + x;
    }

    posFromXY(gx:number, gy:number, into:THREE.Vector3|undefined=undefined) {
        const count = this.surfaceShape[0];
        const posScale = this.flatScale / count;
        const posHalf = -posScale * (count / 2);
        if (!into) {
            into = new THREE.Vector3();
        }
        into.set( this.sideBias + posHalf + ( gx * posScale ), 0, this.forwardBias + ( ( posHalf) + ( gy * posScale ) ) * 1.0 );
        return into;
    }

    mapGridTick(time:TempleTime) {
        if (!this.displacementTexture) return;
        if (!this.displaceData) return;
        if (!time) return;

        // Check if virtual frame has passed:
        const replayFrameRate = 7.0;
        const curTime = time.timeVirtualCurrent;
        const curFrame = Math.floor( curTime * replayFrameRate );
        if (curFrame == this.timeLastUpdated) {
            return;
        }
        this.timeLastUpdated = curFrame;

        // Update array data:
        const ar = this.displacementTexture.image.data;
        const height = this.surfaceShape[0];
        const width = this.surfaceShape[1];
        const size = width * height;
        const stride = 4;
        const ch_sand = 1;
        for (var y=0; y<height; y++) {
            for (var x=0; x<width; x++) {
                const i = ((x + (y * width)) * stride) + ch_sand;
                this.displaceData[i] = Math.floor(128 + (Math.random() * 20));
            }
        }
        this.displacementTexture.needsUpdate = true;
    }

    mapGridTexture() {
        const loader = new THREE.TextureLoader();
        //const image = loader.load('content/images/sfbay_height.png'); 
        // content/images/sand_sim_out.gif
        // content/images/sand_sim_out.json
        //const image = loader.load('content/images/sand_sim_out.gif'); 
        //return image;

        // 1. Create a DataTexture
        const height = this.surfaceShape[0];
        const width = this.surfaceShape[1];
        const size = width * height;
        const data = new Uint8Array(4 * size); // RGBA data
        this.displaceData = data;

        for (let i = 0; i < size; i++) {
            const stride = i * 4;
            // Generate some random displacement values (e.g., grayscale noise)
            const value = Math.floor(128 + (Math.random() * 20));
            data[stride] = value;     // R
            data[stride + 1] = value; // G
            data[stride + 2] = value; // B
            data[stride + 3] = 255;   // A
        }

        this.displacementTexture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
        this.displacementTexture.needsUpdate = true;
        return this.displacementTexture;
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
        + "const float heightOffset = " + 2.01 + ";\n";

        const vertexShader = vertexConsts + `
    uniform sampler2D displacementTexture;
    uniform float uTime;
    varying vec2 vUv;
    varying vec3 vWorldPos;

    void main() {
        vUv = uv;
        vec4 displacement = texture2D(displacementTexture, uv);
        
        // Use the red channel of the texture for displacement
        float displacementFactor = ( displacement.g * heightScale ) - heightOffset;

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

    const float gridPixelDeltaScale = 1.5;
    const vec3  gridTileRepeat = vec3( 1.0, 12.0, 1.0 );
    const float gridShadeXZ = 0.25;
    const vec3  gridLightDir = normalize( vec3( 3, 1, 2 ) );
    const float gridLightPower = 3.0;
    const vec4  gridColorGeneral = vec4(0.25, 0.25, 0.25, 1.0);
    const vec4  gridColorLine = vec4(1.0, 1.0, 1.0, 1.0);

    struct gridSample {
        vec3 worldPos;
        vec3 worldNormal;
        vec3 worldMin;
        vec3 worldMax;
    };

    gridSample gridSampleForPixel() {
        vec3 worldPos = vWorldPos.xyz;
        vec3 dx = dFdx( worldPos );
        vec3 dy = dFdy( worldPos );
        gridSample ans;
        ans.worldPos = worldPos;
        ans.worldNormal = normalize( cross( dx, dy ) );
        float sd = gridPixelDeltaScale;
        ans.worldMin = min(
            min( worldPos - dx*sd, worldPos - dy*sd ),
            min( worldPos + dx*sd, worldPos + dy*sd )
            );
        ans.worldMax = max( 
            max( worldPos - dx*sd, worldPos - dy*sd ),
            max( worldPos + dx*sd, worldPos + dy*sd )
            );
        return ans;
    }

    float gridShadeFromWorldPos(gridSample gsample) {
        vec3 worldPos = gsample.worldPos;
        vec3 gridScale = gridTileRepeat;
        vec3 unitMin = fract( gsample.worldMin * gridScale );
        vec3 unitMax = fract( gsample.worldMax * gridScale );
        //vec3 unitDist = clamp( 1.0 - abs( ( unitPos - 0.5 ) / 0.05 ), 0.0, 1.0 );
        const vec3 gridBias = vec3(0,0.01,0);
        vec3 unitDist = step( ( unitMax - unitMin ) + gridBias, vec3(0,0,0) );
        float gridMax = max( max( unitDist.y, gridShadeXZ * unitDist.x ), gridShadeXZ * unitDist.z );
        float gridShade = clamp( gridMax, 0.0, 1.0 );
        return gridShade; // vec4( gridShade, gridShade, gridShade, 1.0 );
    }

    float lightingForGridSample(gridSample gsample) {
        float nDotL = 1.0 - abs( dot( gridLightDir, gsample.worldNormal ) );
        float lighting = pow( nDotL, gridLightPower );
        return lighting;
    }

    void main() {
        vec4 displacement = texture2D(displacementTexture, vUv);
        const vec4 lowerColor = gridColorGeneral;
        const vec4 upperColor = gridColorLine;
        gridSample gsample = gridSampleForPixel();
        float gridShade = gridShadeFromWorldPos(gsample);
        //if (gridShade < 0.25) discard; // optional wireframe view
        float lightShade = lightingForGridSample(gsample);
        vec4 baseColor = mix( lowerColor, upperColor, gridShade ) * lightShade;
        //vec4 baseColor = vec4( abs(gsample.worldNormal), 1.0 );
        gl_FragColor = baseColor; // + vec4( 0, 1, 0, 0 );
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
                uvs.push( ( gx / gridShape[1] ) );
                uvs.push( inv1( gy / gridShape[0] ) ); // TODO: x/(shape-1)

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

export { TempleSpaceSandBuilder };
