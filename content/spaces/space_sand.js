var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import * as THREE from 'three';
var TempleSpaceSandBuilder = /** @class */ (function () {
    function TempleSpaceSandBuilder(parentScene, world) {
        var _this_1 = this;
        // "shape": [48, 32, 64]
        this.surfaceShape = [32, 64];
        this.displacementTexture = null;
        this.displaceData = null;
        this.jsonFrames = null;
        this.flatScale = 5.0;
        this.heightScale = 4.01;
        this.forwardBias = -5.0;
        this.sideBias = -2.0;
        this.timeLastUpdated = 0.0;
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
        var _this = this;
        world.time.listenToTime(function (time) {
            _this.mapGridTick(time);
        });
        function fetchJson(path) {
            return __awaiter(this, void 0, void 0, function () {
                var resp, jsonData, err_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 3, , 4]);
                            return [4 /*yield*/, fetch(path)];
                        case 1:
                            resp = _a.sent();
                            if (!resp.ok) {
                                throw new Error("Json load error:" + resp.statusText);
                            }
                            return [4 /*yield*/, resp.json()];
                        case 2:
                            jsonData = _a.sent();
                            return [2 /*return*/, jsonData];
                        case 3:
                            err_1 = _a.sent();
                            console.error("Json fetch error: ", err_1);
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        }
        fetchJson("content/images/sand_sim_out.json")
            .then(function (data) {
            _this_1.jsonFrames = data;
            console.log("Json loaded:", data.shape);
        })
            .catch(function (err) {
            console.log("Json download error:", err);
        });
    }
    TempleSpaceSandBuilder.prototype.indexFromXY = function (y, x) {
        return (y * this.surfaceShape[1]) + x;
    };
    TempleSpaceSandBuilder.prototype.posFromXY = function (gx, gy, into) {
        if (into === void 0) { into = undefined; }
        var count = this.surfaceShape[0];
        var posScale = this.flatScale / count;
        var posHalf = -posScale * (count / 2);
        if (!into) {
            into = new THREE.Vector3();
        }
        into.set(this.sideBias + posHalf + (gx * posScale), 0, this.forwardBias + ((posHalf) + (gy * posScale)) * 1.0);
        return into;
    };
    TempleSpaceSandBuilder.prototype.mapGridTick = function (time) {
        if (!this.displacementTexture)
            return;
        if (!this.displaceData)
            return;
        if (!time)
            return;
        if (!this.jsonFrames)
            return;
        var frameCount = this.jsonFrames.shape[0];
        // Check if virtual frame has passed:
        var replayFrameRate = 7.0;
        var curTime = time.timeVirtualCurrent;
        var curFrame = Math.floor(curTime * replayFrameRate) % frameCount;
        if (curFrame == this.timeLastUpdated) {
            return;
        }
        this.timeLastUpdated = curFrame;
        // Update array data:
        var data_to = this.displaceData;
        var data_from = this.jsonFrames.data;
        var height = this.surfaceShape[0];
        var width = this.surfaceShape[1];
        var size = width * height;
        var stride = 4;
        var ch_sand = 1;
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                var inner_i = (x + (y * width));
                var to_i = (inner_i * stride) + ch_sand;
                var from_i = inner_i + (curFrame * width * height);
                //data_to[to_i] = Math.floor(128 + (Math.random() * 20));
                data_to[to_i] = data_from[from_i];
            }
        }
        this.displacementTexture.needsUpdate = true;
    };
    TempleSpaceSandBuilder.prototype.mapGridTexture = function () {
        var loader = new THREE.TextureLoader();
        //const image = loader.load('content/images/sfbay_height.png'); 
        // content/images/sand_sim_out.gif
        // content/images/sand_sim_out.json
        //const image = loader.load('content/images/sand_sim_out.gif'); 
        //return image;
        // 1. Create a DataTexture
        var height = this.surfaceShape[0];
        var width = this.surfaceShape[1];
        var size = width * height;
        var data = new Uint8Array(4 * size); // RGBA data
        this.displaceData = data;
        for (var i = 0; i < size; i++) {
            var stride = i * 4;
            // Generate some random displacement values (e.g., grayscale noise)
            var value = Math.floor(128 + (Math.random() * 20));
            data[stride] = value; // R
            data[stride + 1] = value; // G
            data[stride + 2] = value; // B
            data[stride + 3] = 255; // A
        }
        this.displacementTexture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
        this.displacementTexture.needsUpdate = true;
        return this.displacementTexture;
    };
    TempleSpaceSandBuilder.prototype.mapGridShader = function () {
        var flatMaterial = new THREE.MeshBasicMaterial({
            //color: 0x557755, 
            map: this.texture,
            //side:THREE.DoubleSide
        });
        //return flatMaterial;
        var vertexConsts = ""
            + "const float heightScale = " + this.heightScale + ";\n"
            + "const float heightOffset = " + 2.01 + ";\n";
        var vertexShader = vertexConsts + "\n    uniform sampler2D displacementTexture;\n    uniform float uTime;\n    varying vec2 vUv;\n    varying vec3 vWorldPos;\n\n    void main() {\n        vUv = uv;\n        vec4 displacement = texture2D(displacementTexture, uv);\n        \n        // Use the red channel of the texture for displacement\n        float displacementFactor = ( displacement.g * heightScale ) - heightOffset;\n\n        // Apply displacement along the normal, optionally animated with time\n        vec3 displaceDir = vec3(0,1,0); // normal; \n        vec3 displacedPosition = position + displaceDir * displacementFactor;\n        \n        vec4 worldPos = modelMatrix * vec4(displacedPosition, 1.0);\n        vWorldPos = worldPos.xyz;\n        gl_Position = projectionMatrix * viewMatrix * worldPos;\n    }\n";
        var fragmentShader = "\n    uniform sampler2D displacementTexture;\n    varying vec2 vUv;\n    varying vec3 vWorldPos;\n\n    const float gridPixelDeltaScale = 1.5;\n    const vec3  gridTileRepeat = vec3( 1.0, 12.0, 1.0 );\n    const float gridShadeXZ = 0.25;\n    const vec3  gridLightDir = normalize( vec3( 3, 1, 2 ) );\n    const float gridLightPower = 3.0;\n    const vec4  gridColorGeneral = vec4(0.25, 0.25, 0.25, 1.0);\n    const vec4  gridColorLine = vec4(1.0, 1.0, 1.0, 1.0);\n\n    struct gridSample {\n        vec3 worldPos;\n        vec3 worldNormal;\n        vec3 worldMin;\n        vec3 worldMax;\n    };\n\n    gridSample gridSampleForPixel() {\n        vec3 worldPos = vWorldPos.xyz;\n        vec3 dx = dFdx( worldPos );\n        vec3 dy = dFdy( worldPos );\n        gridSample ans;\n        ans.worldPos = worldPos;\n        ans.worldNormal = normalize( cross( dx, dy ) );\n        float sd = gridPixelDeltaScale;\n        ans.worldMin = min(\n            min( worldPos - dx*sd, worldPos - dy*sd ),\n            min( worldPos + dx*sd, worldPos + dy*sd )\n            );\n        ans.worldMax = max( \n            max( worldPos - dx*sd, worldPos - dy*sd ),\n            max( worldPos + dx*sd, worldPos + dy*sd )\n            );\n        return ans;\n    }\n\n    float gridShadeFromWorldPos(gridSample gsample) {\n        vec3 worldPos = gsample.worldPos;\n        vec3 gridScale = gridTileRepeat;\n        vec3 unitMin = fract( gsample.worldMin * gridScale );\n        vec3 unitMax = fract( gsample.worldMax * gridScale );\n        //vec3 unitDist = clamp( 1.0 - abs( ( unitPos - 0.5 ) / 0.05 ), 0.0, 1.0 );\n        const vec3 gridBias = vec3(0,0.01,0);\n        vec3 unitDist = step( ( unitMax - unitMin ) + gridBias, vec3(0,0,0) );\n        float gridMax = max( max( unitDist.y, gridShadeXZ * unitDist.x ), gridShadeXZ * unitDist.z );\n        float gridShade = clamp( gridMax, 0.0, 1.0 );\n        return gridShade; // vec4( gridShade, gridShade, gridShade, 1.0 );\n    }\n\n    float lightingForGridSample(gridSample gsample) {\n        float nDotL = 1.0 - abs( dot( gridLightDir, gsample.worldNormal ) );\n        float lighting = pow( nDotL, gridLightPower );\n        return lighting;\n    }\n\n    void main() {\n        vec4 displacement = texture2D(displacementTexture, vUv);\n        const vec4 lowerColor = gridColorGeneral;\n        const vec4 upperColor = gridColorLine;\n        gridSample gsample = gridSampleForPixel();\n        float gridShade = gridShadeFromWorldPos(gsample);\n        //if (gridShade < 0.25) discard; // optional wireframe view\n        float lightShade = lightingForGridSample(gsample);\n        vec4 baseColor = mix( lowerColor, upperColor, gridShade ) * lightShade;\n        //vec4 baseColor = vec4( abs(gsample.worldNormal), 1.0 );\n        gl_FragColor = baseColor; // + vec4( 0, 1, 0, 0 );\n    }\n";
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
    TempleSpaceSandBuilder.prototype.mapGridVertices = function () {
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
                uvs.push((gx / gridShape[1]));
                uvs.push(inv1(gy / gridShape[0])); // TODO: x/(shape-1)
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
    return TempleSpaceSandBuilder;
}());
export { TempleSpaceSandBuilder };
