import * as THREE from 'three';
var TempleSpaceMapBuilder = /** @class */ (function () {
    function TempleSpaceMapBuilder(parentScene) {
        this.surfaceShape = [64, 64];
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
        this.scene.add(this.mesh);
    }
    TempleSpaceMapBuilder.prototype.indexFromXY = function (x, y) {
        return (y * this.surfaceShape[0]) + x;
    };
    TempleSpaceMapBuilder.prototype.mapGridTexture = function () {
        var loader = new THREE.TextureLoader();
        var image = loader.load('content/images/sfbay_height.png');
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
        var vertexShader = "\n    uniform sampler2D displacementTexture;\n    uniform float uTime;\n    varying vec2 vUv;\n\n    void main() {\n        vUv = uv;\n        vec4 displacement = texture2D(displacementTexture, uv);\n        \n        // Use the red channel of the texture for displacement\n        float displacementFactor = displacement.r * 1.0; \n\n        // Apply displacement along the normal, optionally animated with time\n        vec3 displaceDir = vec3(0,1,0); // normal; \n        vec3 displacedPosition = position + displaceDir * displacementFactor;\n        \n        gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);\n    }\n";
        var fragmentShader = "\n    uniform sampler2D displacementTexture;\n    varying vec2 vUv;\n\n    void main() {\n        vec4 displacement = texture2D(displacementTexture, vUv);\n        gl_FragColor = displacement; // vec4( displacement.r, 1, 0, 1 );\n        //gl_FragColor = vec4(vUv, 0.5 + 0.5 * sin(vUv.x * 10.0), 1.0);\n    }\n";
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
        var posScale = 20.0 / this.surfaceShape[0];
        for (var gy = 0; gy < gridShape[0]; gy++) {
            for (var gx = 0; gx < gridShape[1]; gx++) {
                points.push(new THREE.Vector3(gx * posScale, 0, -gy * posScale));
                uvs.push(gy / gridShape[0]);
                uvs.push(gx / gridShape[1]); // TODO: x/(shape-1)
                if ((gx > 0) && (gy > 0)) {
                    indices.push(this.indexFromXY(gy - 1, gx - 1));
                    indices.push(this.indexFromXY(gy - 0, gx - 0));
                    indices.push(this.indexFromXY(gy - 1, gx - 0));
                    indices.push(this.indexFromXY(gy - 0, gx - 0));
                    indices.push(this.indexFromXY(gy - 1, gx - 1));
                    indices.push(this.indexFromXY(gy - 0, gx - 1));
                }
                //points.push( new THREE.Vector3( gx - 1, 0, -gy ) );
                //points.push( new THREE.Vector3( gx, 0, -gy - 1 ) );
                //points.push( new THREE.Vector3( gx - 1, 0, -gy - 1 ) );
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
