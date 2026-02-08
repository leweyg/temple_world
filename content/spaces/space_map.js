import * as THREE from 'three';
var TempleSpaceMapBuilder = /** @class */ (function () {
    function TempleSpaceMapBuilder(parentScene) {
        this.surfaceShape = [343, 343];
        /*
    
        flatScale = 160.0;
        heightScale = 1.51;
        heightOffset = 1.01;
        startOffsetZ = -this.flatScale / 4.0;
        */
        this.flatScale = 32.0;
        this.heightScale = 6.51;
        this.heightOffset = -4.01;
        this.startOffsetZ = -this.flatScale / 4.0;
        this.parentScene = parentScene;
        this.scene = new THREE.Group();
        this.scene.name = "TempleSpaceMap";
        parentScene.add(this.scene);
        this.texture = this.mapGridTexture();
        this.mainMaterial = this.mapGridShader();
        var data = this.mapGridVertices();
        var geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(data.vertices, 3));
        geometry.setAttribute('uv', new THREE.BufferAttribute(data.uv, 2));
        geometry.setIndex(data.indices);
        this.mesh = new THREE.Mesh(geometry, this.mainMaterial);
        this.mesh.position.set(0, 0, this.startOffsetZ);
        this.scene.add(this.mesh);
    }
    TempleSpaceMapBuilder.prototype.indexFromXY = function (x, y) {
        return (y * this.surfaceShape[0]) + x;
    };
    TempleSpaceMapBuilder.prototype.posFromXY = function (gx, gy, into) {
        if (into === void 0) { into = undefined; }
        var count = this.surfaceShape[0];
        var posScale = this.flatScale / count;
        var posHalf = -posScale * (count / 2);
        if (!into) {
            into = new THREE.Vector3();
        }
        into.set(posHalf + (gx * posScale), 0, ((posHalf) + (gy * posScale)) * 1.0);
        return into;
    };
    TempleSpaceMapBuilder.prototype.mapGridTexture = function () {
        var loader = new THREE.TextureLoader();
        var image = loader.load('content/images/grounds_height.png');
        return image;
        // 1. Create a DataTexture
        var height = this.surfaceShape[0];
        var width = this.surfaceShape[1];
        var size = width * height;
        var data = new Uint8Array(4 * size); // RGBA data
        for (var i = 0; i < size; i++) {
            var stride = i * 4;
            // Generate some random displacement values (e.g., grayscale noise)
            var value = Math.floor(Math.random() * 255);
            data[stride] = value; // R
            data[stride + 1] = value; // G
            data[stride + 2] = value; // B
            data[stride + 3] = 255; // A
        }
        var displacementTexture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
        displacementTexture.needsUpdate = true;
        return displacementTexture;
    };
    TempleSpaceMapBuilder.prototype.mapGridShader = function () {
        var flatMaterial = new THREE.MeshBasicMaterial({
            //color: 0x557755, 
            map: this.texture,
            //side:THREE.DoubleSide
        });
        //return flatMaterial;
        var vertexConsts = ""
            + "const float heightScale = " + this.heightScale + ";\n"
            + "const float heightOffset = " + this.heightOffset + ";\n";
        var vertexShader = vertexConsts + "\n    uniform sampler2D displacementTexture;\n    uniform float uTime;\n    varying vec2 vUv;\n    varying vec3 vWorldPos;\n\n    void main() {\n        vUv = uv;\n        vec4 displacement = texture2D(displacementTexture, uv);\n        \n        // Use the red channel of the texture for displacement\n        float displacementFactor = ( displacement.r * heightScale ) + heightOffset;\n\n        // Apply displacement along the normal, optionally animated with time\n        vec3 displaceDir = vec3(0,1,0); // normal; \n        vec3 displacedPosition = position + displaceDir * displacementFactor;\n        \n        vec4 worldPos = modelMatrix * vec4(displacedPosition, 1.0);\n        vWorldPos = worldPos.xyz;\n        gl_Position = projectionMatrix * viewMatrix * worldPos;\n    }\n";
        var fragmentShader = "\n    uniform sampler2D displacementTexture;\n    varying vec2 vUv;\n    varying vec3 vWorldPos;\n\n    const float gridPixelDeltaScale = 1.5;\n    const vec3  gridTileRepeat = vec3( 1.0, 2.0, 1.0 );\n    const float gridShadeXZ = 0.25;\n    const vec3  gridLightDir = normalize( vec3( 3, 1, 2 ) );\n    const float gridLightPower = 3.0;\n    const vec4  gridColorGeneral = vec4(0.25, 0.25, 0.25, 1.0);\n    const vec4  gridColorLine = vec4(1.0, 1.0, 1.0, 1.0);\n\n    struct gridSample {\n        vec3 worldPos;\n        vec3 worldNormal;\n        vec3 worldMin;\n        vec3 worldMax;\n    };\n\n    gridSample gridSampleForPixel() {\n        vec3 worldPos = vWorldPos.xyz;\n        vec3 dx = dFdx( worldPos );\n        vec3 dy = dFdy( worldPos );\n        gridSample ans;\n        ans.worldPos = worldPos;\n        ans.worldNormal = normalize( cross( dx, dy ) );\n        float sd = gridPixelDeltaScale;\n        ans.worldMin = min(\n            min( worldPos - dx*sd, worldPos - dy*sd ),\n            min( worldPos + dx*sd, worldPos + dy*sd )\n            );\n        ans.worldMax = max( \n            max( worldPos - dx*sd, worldPos - dy*sd ),\n            max( worldPos + dx*sd, worldPos + dy*sd )\n            );\n        return ans;\n    }\n\n    float gridShadeFromWorldPos(gridSample gsample) {\n        vec3 worldPos = gsample.worldPos;\n        vec3 gridScale = gridTileRepeat;\n        vec3 unitMin = fract( gsample.worldMin * gridScale );\n        vec3 unitMax = fract( gsample.worldMax * gridScale );\n        //vec3 unitDist = clamp( 1.0 - abs( ( unitPos - 0.5 ) / 0.05 ), 0.0, 1.0 );\n        const vec3 gridBias = vec3(0,0.01,0);\n        vec3 unitDist = step( ( unitMax - unitMin ) + gridBias, vec3(0,0,0) );\n        float gridMax = max( max( unitDist.y, gridShadeXZ * unitDist.x ), gridShadeXZ * unitDist.z );\n        float gridShade = clamp( gridMax, 0.0, 1.0 );\n        return gridShade; // vec4( gridShade, gridShade, gridShade, 1.0 );\n    }\n\n    float lightingForGridSample(gridSample gsample) {\n        float nDotL = 1.0 - abs( dot( gridLightDir, gsample.worldNormal ) );\n        float lighting = pow( nDotL, gridLightPower );\n        return lighting;\n    }\n\n    void main() {\n        vec4 displacement = texture2D(displacementTexture, vUv);\n        const vec4 lowerColor = gridColorGeneral;\n        const vec4 upperColor = gridColorLine;\n        gridSample gsample = gridSampleForPixel();\n        float gridShade = gridShadeFromWorldPos(gsample);\n        //if (gridShade < 0.25) discard; // optional wireframe view\n        float lightShade = lightingForGridSample(gsample);\n        vec4 baseColor = mix( lowerColor, upperColor, gridShade ) * lightShade;\n        //vec4 baseColor = vec4( abs(gsample.worldNormal), 1.0 );\n        gl_FragColor = baseColor; // + vec4( 0, 1, 0, 0 );\n    }\n";
        var material = new THREE.ShaderMaterial({
            uniforms: {
                displacementTexture: { value: this.texture },
                uTime: { value: 0.0 }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            side: THREE.DoubleSide // Important for seeing both sides of displaced geometry
        });
        return material;
    };
    TempleSpaceMapBuilder.prototype.mapGridVertices = function () {
        var points = [];
        var indices = [];
        var uvs = [];
        var gridShape = this.surfaceShape;
        function inv1(v) {
            return 1.0 - v;
        }
        for (var gy = 0; gy < gridShape[0]; gy++) {
            for (var gx = 0; gx < gridShape[1]; gx++) {
                points.push(this.posFromXY(gx, gy));
                uvs.push((gx / gridShape[0]));
                uvs.push(inv1(gy / gridShape[1])); // TODO: x/(shape-1)
                if ((gx > 0) && (gy > 0)) {
                    indices.push(this.indexFromXY(gy - 1, gx - 1));
                    indices.push(this.indexFromXY(gy - 0, gx - 0));
                    indices.push(this.indexFromXY(gy - 1, gx - 0));
                    indices.push(this.indexFromXY(gy - 0, gx - 0));
                    indices.push(this.indexFromXY(gy - 1, gx - 1));
                    indices.push(this.indexFromXY(gy - 0, gx - 1));
                }
            }
        }
        var linearPoints = [];
        for (var vi in points) {
            var v = points[vi];
            linearPoints.push(v.x);
            linearPoints.push(v.y);
            linearPoints.push(v.z);
        }
        var vertices = new Float32Array(linearPoints);
        var uv = new Float32Array(uvs);
        return { vertices: vertices, uv: uv, indices: indices };
    };
    return TempleSpaceMapBuilder;
}());
export { TempleSpaceMapBuilder };
