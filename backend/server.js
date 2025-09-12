import express from "express";
import multer from "multer";
import cors from "cors";   // <-- import cors
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const app = express();
app.use(cors({
  origin: "http://localhost:5173"
}));
const upload = multer({ dest: "uploads/" });

app.post("/api/slice", upload.single("file"), (req, res) => {
  const file = req.file;
  const { material, quality } = req.body;

  if (!file) return res.status(400).json({ error: "No file uploaded" });

  const modelPath = file.path;
  const gcodePath = modelPath + ".gcode";

  // Paths to config files
  const printerConfig = path.join(__dirname, "configs/printer.json");
  const qualityConfig = path.join(__dirname, "configs/quality", quality.toLowerCase() + ".json");
  const materialConfig = path.join(__dirname, "configs/material", material.toLowerCase() + ".json");

  // Build CuraEngine command
  const command = `CuraEngine slice -j "${printerConfig}" -j "${qualityConfig}" -j "${materialConfig}" -l "${modelPath}" -o "${gcodePath}"`;

  console.log("Running command:", command);
  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error("CuraEngine error:", err);
      console.error("stderr:", stderr);
      return res.status(500).json({ error: "Slicing failed" });
    }

    console.log("stdout:", stdout);

    const filamentMatch = stdout.match(/Filament used: ([0-9.]+)m/);
    const timeMatch = stdout.match(/Print time: ([0-9.]+)min/);

    console.log("Filament match:", filamentMatch);
    console.log("Time match:", timeMatch);


    const filamentMeters = filamentMatch ? parseFloat(filamentMatch[1]) : 0;
    const timeMinutes = timeMatch ? parseFloat(timeMatch[1]) : 0;

    // Convert to grams
    const density = material.toLowerCase() === "petg" ? 1.27 :
                    material.toLowerCase() === "abs" ? 1.04 :
                    material.toLowerCase() === "asa" ? 1.07 :
                    1.24; // PLA default

    const filamentDiameter = 1.75; // mm
    const filamentArea = Math.PI * Math.pow(filamentDiameter / 2, 2); // mm²
    const filamentVolume = filamentMeters * 1000 * filamentArea; // mm³
    const filamentGrams = (filamentVolume / 1000) * (density / 1000);

    const timeHours = timeMinutes / 60;

    // Price calculation
    const costPerGram = 0.05;  // adjust per material if needed
    const costPerHour = 0.20;
    const price = filamentGrams * costPerGram + timeHours * costPerHour;

    // Respond with estimate
    res.json({
      filament: filamentGrams.toFixed(2),
      time: timeHours.toFixed(2),
      price: price.toFixed(2)
    });

    // Cleanup uploaded file
    fs.unlinkSync(modelPath);
  });
});

app.listen(3001, () => console.log("Backend running on port 3001"));
