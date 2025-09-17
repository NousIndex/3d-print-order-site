import { useState, Suspense, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stats } from "@react-three/drei";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { ThreeMFLoader } from "three/examples/jsm/loaders/3MFLoader";
import {
  Vector3,
  Box3,
  Color,
  BufferGeometry,
  Matrix4,
  Group,
  Float32BufferAttribute,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// Material info: density (g/cm³) and default color
const MATERIALS = {
  "PLA+ 2.0": { density: 1.24 },
  "PLA+ Silk": { density: 1.24 },
  "PLA Meta": { density: 1.24 },
  "PLA Firefly": { density: 1.24 },
  "PLA Glow in the dark": { density: 1.24 },
  // "PLA+": { density: 1.24 },
  PLA: { density: 1.24 },
  TPU: { density: 1.3 },
  PETG: { density: 1.27 },
  // ABS: { density: 1.04 },
  ASA: { density: 1.07 },
};
const COLORSLIST = {
  "PLA+ 2.0": {
    Black: {
      color: "#2e2e2e",
      color2: "#2e2e2e",
      color3: "#2e2e2e",
      opacity: 1,
      finish: "glossy",
      stock: false,
      information:
        "Improved PLA with higher strength and toughness, still not very heat-resistant.",
    },
    "Off-White": {
      color: "#e4e6ea",
      color2: "#e4e6ea",
      color3: "#e4e6ea",
      opacity: 1,
      finish: "glossy",
      stock: true,
      information:
        "Improved PLA with higher strength and toughness, still not very heat-resistant.",
    },
    Oak: {
      color: "#bea98b",
      color2: "#bea98b",
      color3: "#bea98b",
      opacity: 1,
      finish: "glossy",
      stock: true,
      information:
        "Improved PLA with higher strength and toughness, still not very heat-resistant.",
    },
    "Sunny Orange": {
      color: "#ff8635",
      color2: "#ff8635",
      color3: "#ff8635",
      opacity: 1,
      finish: "glossy",
      stock: true,
      information:
        "Improved PLA with higher strength and toughness, still not very heat-resistant.",
    },
    Cyan: {
      color: "#2aa0dc",
      color2: "#2aa0dc",
      color3: "#2aa0dc",
      opacity: 1,
      finish: "glossy",
      stock: true,
      information:
        "Improved PLA with higher strength and toughness, still not very heat-resistant.",
    },
  },
  "PLA+ Silk": {
    Bronze: {
      color: "#e37e63",
      color2: "#e37e63",
      color3: "#e37e63",
      opacity: 1,
      finish: "glossy",
      stock: true,
      information:
        "Silky smooth, slightly metallic finish. Good for decorative prints, not as strong as standard PLA+.",
    },
    Gold: {
      color: "#f8cc36",
      color2: "#f8cc36",
      color3: "#f8cc36",
      opacity: 1,
      finish: "glossy",
      stock: true,
      information:
        "Silky smooth, slightly metallic finish. Best for display pieces and artistic projects.",
    },
    "Red-Yellow-Blue": {
      color: "#2a1e5b",
      color2: "#b6447f",
      color3: "#616214",
      opacity: 1,
      finish: "glossy",
      stock: true,
      information:
        "Color-shifting silk filament. Metallic look, colors will vary when printed. More for visuals than strength.",
    },
  },
  // "PLA+": {
  //   Blue: {
  //     color: "#00ccff",
  //     color2: "#00ccff",
  //     color3: "#00ccff",
  //     opacity: 1,
  //     finish: "glossy",
  //     stock: false,
  //     information: "Stronger and less brittle than normal PLA. Easy to print, but still weak to heat and UV.",
  //   },
  // },
  TPU: {
    Black: {
      color: "#454545",
      color2: "#454545",
      color3: "#454545",
      opacity: 1,
      finish: "satin",
      stock: true,
      information:
        "Flexible and impact-resistant. Great for phone cases, seals, or parts needing bendability.",
    },
    Gray: {
      color: "#77767d",
      color2: "#77767d",
      color3: "#77767d",
      opacity: 1,
      finish: "satin",
      stock: true,
      information:
        "Flexible and durable. Useful for parts that need to bend without breaking.",
    },
  },
  "PLA Firefly": {
    Blue: {
      color: "#00ccff",
      color2: "#00ccff",
      color3: "#00ccff",
      opacity: 0.8,
      finish: "glossy",
      stock: true,
      information:
        "PLA that glows under UV light. Similar strength to normal PLA, mainly for decorative prints.",
    },
  },
  "PLA Glow in the dark": {
    Blue: {
      color: "#39c5e6",
      color2: "#eaebdc",
      color3: "#eaebdc",
      opacity: 1,
      finish: "glossy",
      stock: true,
      information:
        "Glows in the dark after light exposure. Slightly more brittle than regular PLA.",
    },
    Green: {
      color: "#37dc6e",
      color2: "#eaebdc",
      color3: "#eaebdc",
      opacity: 1,
      finish: "glossy",
      stock: false,
      information:
        "Glows in the dark. Fun for display prints, not ideal for functional parts.",
    },
  },
  "PLA Meta": {
    Gray: {
      color: "#707070",
      color2: "#707070",
      color3: "#707070",
      opacity: 1,
      finish: "satin",
      stock: true,
      information:
        "Special PLA blend with matte finish. Hides layer lines well, but slightly weaker than PLA+.",
    },
  },
  PLA: {
    Green: {
      color: "#4fb84e",
      color2: "#4fb84e",
      color3: "#4fb84e",
      opacity: 1,
      finish: "glossy",
      stock: false,
      information:
        "Easy to print, good detail. Decently strong but brittle, weak to UV and heat.",
    },
  },
  PETG: {
    "Off-White": {
      color: "#e5e7eb",
      color2: "#e5e7eb",
      color3: "#e5e7eb",
      opacity: 1,
      finish: "glossy",
      stock: true,
      information:
        "Strong and slightly flexible. Good chemical and weather resistance, harder to print than PLA.",
    },
  },
  // ABS: {
  //   Blue: {
  //     color: "#00ccff",
  //     color2: "#00ccff",
  //     color3: "#00ccff",
  //     opacity: 1,
  //     finish: "glossy",
  //     stock: false,
  //     information: "Heat-resistant and durable. Warps easily, needs enclosure. Used for functional parts.",
  //   },
  // },
  ASA: {
    Gray: {
      color: "#787576",
      color2: "#787576",
      color3: "#787576",
      opacity: 1,
      finish: "glossy",
      stock: true,
      information:
        "Similar to ABS but with strong UV resistance. Great for outdoor parts.",
    },
  },
};

const centerGeometry = (geometry) => {
  const box = new Box3().setFromBufferAttribute(geometry.attributes.position);
  const center = new Vector3();
  box.getCenter(center);

  const matrix = new Matrix4().makeTranslation(-center.x, -center.y, -center.z);
  geometry.applyMatrix4(matrix);
};
const centerGroup = (group) => {
  const box = new Box3().setFromObject(group);
  const center = new Vector3();
  box.getCenter(center);

  group.position.sub(center); // shift so center is at origin
};

function App() {
  const [modelData, setModelData] = useState(null); // Changed from geometry to modelData
  const [estimate, setEstimate] = useState(null);
  const [material, setMaterial] = useState("PLA");
  const [selectedcolor, setSelectedcolor] = useState("Green");
  const [selectedcolor2, setSelectedcolor2] = useState("Green");
  const [informationstuff, setInformationstuff] = useState(
    "Easy to print, good detail. Decently strong but brittle, weak to UV and heat."
  );
  const [instock, setInstock] = useState(true);
  const [infill, setInfill] = useState(15);
  const [layerHeight, setLayerHeight] = useState(0.2);
  const [scale, setScale] = useState(1);
  const [dimensions, setDimensions] = useState({ x: 0, y: 0, z: 0 });
  const [loading, setLoading] = useState(false);
  const [fileType, setFileType] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const controlsRef = useRef();

  // Auto-center camera when model loads
  useEffect(() => {
    if (modelData && controlsRef.current) {
      // Small delay to ensure the model is rendered
      const timer = setTimeout(() => {
        let bounds;
        if (fileType === "stl") {
          bounds = new Box3().setFromBufferAttribute(
            modelData.attributes.position
          );
        } else {
          bounds = calculateBounds(modelData.group);
        }
        autoCenterCamera(bounds);
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [modelData, fileType]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Deep traversal to find ALL meshes in the scene graph
  const getAllMeshes = (object, meshes = []) => {
    if (object.isMesh) {
      meshes.push(object);
    }

    if (object.children && object.children.length > 0) {
      object.children.forEach((child) => {
        getAllMeshes(child, meshes);
      });
    }

    return meshes;
  };

  // Create a merged geometry from all meshes for calculations
  const createMergedGeometry = (object) => {
    const meshes = getAllMeshes(object);
    console.log("Found meshes for merging:", meshes.length);

    if (meshes.length === 0) return null;

    const geometries = [];

    meshes.forEach((mesh, index) => {
      if (mesh.geometry && mesh.geometry.attributes.position) {
        console.log(`Processing mesh ${index}:`, mesh);

        const geom = mesh.geometry.clone();

        // Make sure the mesh world matrix is up to date
        mesh.updateWorldMatrix(true, false);

        // Apply all transformations
        geom.applyMatrix4(mesh.matrixWorld);

        // Ensure normals
        if (!geom.attributes.normal) {
          geom.computeVertexNormals();
        }

        geometries.push(geom);
      }
    });

    if (geometries.length === 0) return null;

    try {
      return mergeGeometries(geometries, false);
    } catch (error) {
      console.error("Error merging geometries:", error);
      return geometries[0]; // Return first geometry if merge fails
    }
  };

  const calculateBounds = (object) => {
    const box = new Box3();

    if (object.isBufferGeometry) {
      box.setFromBufferAttribute(object.attributes.position);
    } else {
      // For groups/objects, traverse all meshes
      const meshes = getAllMeshes(object);
      meshes.forEach((mesh) => {
        mesh.updateWorldMatrix(true, false);
        const meshBox = new Box3().setFromBufferAttribute(
          mesh.geometry.attributes.position
        );
        meshBox.applyMatrix4(mesh.matrixWorld);
        box.union(meshBox);
      });
    }

    return box;
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    const ext = file.name.split(".").pop().toLowerCase();
    setFileType(ext);

    reader.onload = (event) => {
      try {
        let loadedData = null;

        if (ext === "stl") {
          const loader = new STLLoader();
          const geometry = loader.parse(event.target.result);
          geometry.computeVertexNormals();
          geometry.computeBoundingBox();
          // Center STL geometry
          centerGeometry(geometry);

          loadedData = geometry;
        } else if (ext === "3mf") {
          const loader = new ThreeMFLoader();
          const group = loader.parse(event.target.result);

          console.log("3MF Group structure:", group);
          console.log("Group children:", group.children);

          // Log the entire structure
          const logStructure = (obj, depth = 0) => {
            const indent = "  ".repeat(depth);
            console.log(
              `${indent}${obj.type} (${obj.children?.length || 0} children)`
            );
            if (obj.isMesh) {
              console.log(`${indent}  - Mesh with geometry:`, obj.geometry);
            }
            obj.children?.forEach((child) => logStructure(child, depth + 1));
          };
          logStructure(group);

          // Center 3MF group
          centerGroup(group);

          const meshes = getAllMeshes(group);
          console.log("Total meshes found:", meshes.length);

          if (meshes.length === 0) {
            alert("No meshes found in 3MF file");
            setLoading(false);
            return;
          }

          // For 3MF, we'll store the entire group for rendering
          // but create a merged geometry for calculations
          loadedData = {
            group: group,
            mergedGeometry: createMergedGeometry(group),
          };
        } else {
          alert("Unsupported file format");
          setLoading(false);
          return;
        }

        setModelData(loadedData);

        // Calculate dimensions
        let bounds;
        if (ext === "stl") {
          bounds = new Box3().setFromBufferAttribute(
            loadedData.attributes.position
          );
        } else {
          bounds = calculateBounds(loadedData.group);
        }

        const size = new Vector3();
        bounds.getSize(size);
        setDimensions({ x: size.x, y: size.y, z: size.z });

        // Calculate estimates using merged geometry for 3MF
        const geometryForCalc =
          ext === "stl" ? loadedData : loadedData.mergedGeometry;
        if (geometryForCalc) {
          calculateEstimate(geometryForCalc, scale);
        }
      } catch (error) {
        console.error("Error loading file:", error);
        alert("Error loading file: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const calculateEstimate = (geometry, scaleFactor) => {
    if (!geometry || !geometry.attributes.position) return;

    // Compute volume (mm^3) and scale
    const volume = computeGeometryVolume(geometry) * Math.pow(scaleFactor, 3);
    const adjustedVolume = volume * (infill / 100); // apply infill

    // Filament cost
    const density = MATERIALS[material].density; // g/cm^3
    const filamentGrams = (adjustedVolume / 1000) * density; // convert mm^3 to cm^3

    const filamentPricePerKg = MATERIALS[material].pricePerKg || 25; // SGD/kg
    const filamentCost = (filamentGrams / 1000) * filamentPricePerKg;

    // Print time estimation (minutes)
    const printSpeed = 50; // arbitrary speed factor
    const timeMinutes = Math.cbrt(adjustedVolume) * 10; // adjust as needed
    const timeHours = timeMinutes / 60;

    // Electricity cost
    const powerW = 150; // printer power in W
    const elecCostPerKWh = 0.3; // SGD
    const electricityCost = ((powerW * timeHours) / 1000) * elecCostPerKWh;

    // Optional extra cost (e.g., "Add Poop")
    const extraCost = 0.0; // set per item if needed

    // Total cost
    const totalCost = filamentCost + electricityCost + extraCost;

    setEstimate({
      filament: filamentGrams.toFixed(2),
      time: timeHours.toFixed(2),
      price: totalCost.toFixed(2),
    });
  };

  const computeGeometryVolume = (geometry) => {
    let volume = 0;
    const position = geometry.attributes.position.array;

    for (let i = 0; i < position.length; i += 9) {
      const v0 = new Vector3(position[i], position[i + 1], position[i + 2]);
      const v1 = new Vector3(position[i + 3], position[i + 4], position[i + 5]);
      const v2 = new Vector3(position[i + 6], position[i + 7], position[i + 8]);
      volume += v0.dot(v1.cross(v2)) / 6;
    }
    return Math.abs(volume);
  };

  const handleMaterialChange = (e) => {
    setMaterial(e.target.value);
    const firstValue = Object.values(COLORSLIST[e.target.value])[0];
    setSelectedcolor(firstValue);
    setInformationstuff(firstValue.information);
    setInstock(firstValue.stock);
    if (modelData) {
      const geom = fileType === "stl" ? modelData : modelData.mergedGeometry;
      if (geom) calculateEstimate(geom, scale);
    }
  };

  const handleColorChange = (e) => {
    setSelectedcolor2(e.target.value);
    setSelectedcolor(COLORSLIST[material][e.target.value]);
    setInformationstuff(COLORSLIST[material][e.target.value].information);
    setInstock(COLORSLIST[material][e.target.value].stock);
  };

  const handleInfillChange = (e) => {
    setInfill(Number(e.target.value));
    if (modelData) {
      const geom = fileType === "stl" ? modelData : modelData.mergedGeometry;
      if (geom) calculateEstimate(geom, scale);
    }
  };

  const handleLayerHeightChange = (e) => {
    setLayerHeight(Number(e.target.value));
    if (modelData) {
      const geom = fileType === "stl" ? modelData : modelData.mergedGeometry;
      if (geom) calculateEstimate(geom, scale);
    }
  };

  const handleScaleChange = (e) => {
    const s = Number(e.target.value);
    setScale(s);
    if (modelData) {
      const geom = fileType === "stl" ? modelData : modelData.mergedGeometry;
      if (geom) calculateEstimate(geom, s);
    }
  };

  const centerModel = () => {
    if (!modelData || !controlsRef.current) return;

    let bounds;
    if (fileType === "stl") {
      bounds = new Box3().setFromBufferAttribute(modelData.attributes.position);
    } else {
      bounds = calculateBounds(modelData.group);
    }

    autoCenterCamera(bounds);
  };

  const autoCenterCamera = (bounds) => {
    if (!controlsRef.current) return;

    const size = new Vector3();
    bounds.getSize(size);
    const center = new Vector3();
    bounds.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const camera = controlsRef.current.object;

    // Position camera at a good distance to see the entire model
    const distance = maxDim * 2;
    camera.position.set(
      center.x + distance * 0.7,
      center.y + distance * 0.7,
      center.z + distance * 0.7
    );

    // Point camera at the center of the model
    controlsRef.current.target.copy(center);
    controlsRef.current.update();
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        position: "relative",
        flexDirection: isMobile ? "column" : "row",
      }}
    >
      <div style={{ padding: "1rem", background: "#242424ff", zIndex: 1 }}>
        <h2>Upload Model</h2>
        <input
          type="file"
          accept=".stl,.3mf"
          onChange={handleUpload}
          disabled={loading}
        />

        <div style={{ marginTop: "1rem" }}>
          <label>You can find models here:</label>

          <div>
            <a
              href="https://makerworld.com/en"
              target="_blank"
              rel="noopener noreferrer"
            >
              Makerworld
            </a>
          </div>
          <div>
            <a
              href="https://www.printables.com/model"
              target="_blank"
              rel="noopener noreferrer"
            >
              Printables
            </a>
          </div>
          <div>
            <label>Download the .STL or .3MF file and upload here</label>
          </div>
        </div>

        {loading && <p>Loading model...</p>}

        <div style={{ marginTop: "1rem" }}>
          <label>Material: </label>
          <select value={material} onChange={handleMaterialChange}>
            {Object.keys(MATERIALS).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: "1rem" }}>
          <label>Color: </label>
          <select value={selectedcolor2} onChange={handleColorChange}>
            {Object.keys(COLORSLIST[material]).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: "1rem" }}>
          <label>Material Information:</label>
          <div>
            {informationstuff.split("\n").map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: "1rem" }}>
          <label>Available: {instock ? "Yes" : "No"}</label>
        </div>

        {/* <div style={{ marginTop: "1rem" }}>
          <label>Infill: {infill}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={infill}
            onChange={handleInfillChange}
          />
        </div>

        <div style={{ marginTop: "1rem" }}>
          <label>Layer Height: {layerHeight} mm</label>
          <input
            type="range"
            min="0.1"
            max="0.4"
            step="0.05"
            value={layerHeight}
            onChange={handleLayerHeightChange}
          />
        </div> */}

        <div
          style={{
            marginTop: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <label style={{ width: "60px", display: "inline-block" }}>
            Scale: {scale}x
          </label>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.05"
            value={scale}
            onChange={handleScaleChange}
          />
        </div>

        {dimensions && (
          <div style={{ marginTop: "1rem" }}>
            <p>
              <strong>Dimensions (mm):</strong>
            </p>
            <p>Width (X): {(dimensions.x * scale).toFixed(1)} mm</p>
            <p>Depth (Y): {(dimensions.y * scale).toFixed(1)} mm</p>
            <p>Height (Z): {(dimensions.z * scale).toFixed(1)} mm</p>
          </div>
        )}

        {/* {estimate && (
          <div style={{ marginTop: "1rem" }}>
            <p>
              <strong>Filament:</strong> {estimate.filament} g
            </p>
            <p>
              <strong>Time:</strong> {estimate.time} h
            </p>
            <p>
              <strong>Price:</strong> ${estimate.price}
            </p>
          </div>
        )} */}
      </div>

      <button
        onClick={centerModel}
        style={{
          position: "absolute",
          top: window.innerWidth <= 768 ? "auto" : 10,
          bottom: window.innerWidth <= 768 ? 10 : "auto",
          right: 10,
          padding: "0.5rem 1rem",
          zIndex: 2,
          background: "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Center Model
      </button>

      <div
        style={{
          flex: 1,
          background: "#474747ff",
          height: window.innerWidth <= 768 ? "50vh" : "100vh",
          minHeight: window.innerWidth <= 768 ? "400px" : "auto",
        }}
      >
        <Canvas camera={{ position: [0, 0, 100], fov: 60 }}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[10, 10, 10]} intensity={0.8} />
          <directionalLight position={[-10, -10, -10]} intensity={0.7} />
          <Suspense fallback={null}>
            {modelData && (
              <ModelRenderer
                modelData={modelData}
                fileType={fileType}
                scale={scale}
                color={selectedcolor.color}
                color2={selectedcolor.color2}
                color3={selectedcolor.color3}
                opacity={selectedcolor.opacity}
                finish={selectedcolor.finish}
              />
            )}
          </Suspense>
          <OrbitControls ref={controlsRef} enableDamping dampingFactor={0.05} />
        </Canvas>
      </div>
    </div>
  );
}

// Component to render different model types
function ModelRenderer({
  modelData,
  fileType,
  scale,
  color,
  color2,
  color3,
  opacity,
  finish,
}) {
  if (fileType === "stl") {
    // Finish settings
    let roughness = 0.2;
    let metalness = 1;
    if (finish === "glossy") {
      roughness = 0.2;
      metalness = 1;
    } else if (finish === "satin") {
      roughness = 0.5;
      metalness = 0.05;
    } else if (finish === "matte") {
      roughness = 0.8;
      metalness = 0;
    }
    return (
      <mesh geometry={modelData} scale={[scale, scale, scale]}>
        <meshStandardMaterial
          color={new Color(color)}
          metalness={metalness}
          roughness={roughness}
        />
      </mesh>
    );
  } else if (fileType === "3mf") {
    return (
      <ThreeMFModel
        group={modelData.group}
        scale={scale}
        baseColor={color}
        color2={color2}
        color3={color3}
        opacity={opacity}
        finish={finish}
      />
    );
  }
  return null;
}

// Component specifically for rendering 3MF models
function ThreeMFModel({
  group,
  scale,
  baseColor = "#4fb84e",
  finish = "glossy",
  opacity = 1,
  color2 = "#4fb84e",
  color3 = "#4fb84e",
}) {
  const groupRef = useRef();

  // Clone the group to avoid modifying the original
  const clonedGroup = group.clone();

  // Collect all meshes
  const meshes = [];
  const collectMeshes = (obj) => {
    if (obj.isMesh) meshes.push(obj);
    obj.children?.forEach(collectMeshes);
  };
  collectMeshes(clonedGroup);

  // Find Y bounds for the gradient
  let minY = Infinity;
  let maxY = -Infinity;
  meshes.forEach((mesh) => {
    const position = mesh.geometry.attributes.position;
    for (let i = 1; i < position.count * 3; i += 3) {
      const y = position.array[i];
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  });

  // Apply vertex colors for bottom-to-top gradient
  meshes.forEach((mesh) => {
    const geom = mesh.geometry.clone();

    // Create color attribute
    const colors = [];
    const positions = geom.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      const t = (y - minY) / (maxY - minY); // normalized 0 → 1
      const intensity = 1; // 0 = no blend, 1 = full blend
      const tAdjusted = Math.pow(t, intensity); // adjust the curve

      // Define your three colors
      const c1 = new Color(baseColor);
      const c2 = new Color(color2);
      const c3 = new Color(color3);

      let color = new Color();
      if (tAdjusted < 0.5) {
        // First half: c1 → c2
        color.copy(c1).lerp(c2, tAdjusted / 0.5);
      } else {
        // Second half: c2 → c3
        color.copy(c2).lerp(c3, (tAdjusted - 0.5) / 0.5);
      }

      colors.push(color.r, color.g, color.b);
    }

    geom.setAttribute("color", new Float32BufferAttribute(colors, 3));

    // Update material
    const mat = mesh.material.clone();
    mat.vertexColors = true;
    mat.transparent = true;
    mat.opacity = opacity;

    // Finish settings
    if (finish === "glossy") {
      mat.roughness = 0.2;
      mat.metalness = 1;
    } else if (finish === "satin") {
      mat.roughness = 0.5;
      mat.metalness = 0.05;
    } else if (finish === "matte") {
      mat.roughness = 0.8;
      mat.metalness = 0;
    }

    mesh.geometry = geom;
    mesh.material = mat;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  });

  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      <primitive object={clonedGroup} />
    </group>
  );
}

export default App;
