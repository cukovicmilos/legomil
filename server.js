import express from "express";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3005;
const DATA_DIR = "./data";
const API_KEY = process.env.REBRICKABLE_API_KEY;

app.use(express.static("public"));

// GET svi setovi
app.get("/sets", (req, res) => {
  const files = fs.readdirSync(DATA_DIR).filter(file => file.endsWith('.md'));
  const sets = files.map(file => {
    const content = fs.readFileSync(path.join(DATA_DIR, file), "utf-8");
    
    // Izvuci YAML front matter između --- linija
    const yamlMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!yamlMatch) return null;
    
    const yamlContent = yamlMatch[1];
    const lines = yamlContent.split('\n').filter(line => line.trim());
    
    const meta = {};
    lines.forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        meta[key.trim()] = valueParts.join(':').trim();
      }
    });
    
    return meta;
  }).filter(set => set !== null);
  
  // Sortiranje po godini, najnoviji prvi
  sets.sort((a, b) => parseInt(b.year) - parseInt(a.year));
  
  res.json(sets);
});

// POST dodavanje novog seta
app.post("/addSet/:number", async (req, res) => {
  const number = req.params.number;
  const url = `https://rebrickable.com/api/v3/lego/sets/${number}-1/`;
  
  try {
    const resp = await fetch(url, {
      headers: { "Authorization": `key ${API_KEY}` }
    });
    if (!resp.ok) throw new Error("Set nije pronađen");
    const data = await resp.json();

    const mdContent = `---
set_number: ${data.set_num}
name: ${data.name}
year: ${data.year}
theme: ${data.theme_id}
image_url: ${data.set_img_url}
---`;

    fs.writeFileSync(path.join(DATA_DIR, `${data.set_num}.md`), mdContent);
    res.json({ success: true, set: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE brisanje seta
app.delete("/deleteSet/:number", (req, res) => {
  const number = req.params.number;
  const filePath = path.join(DATA_DIR, `${number}.md`);
  
  try {
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: "Set nije pronađen" });
    }
    
    fs.unlinkSync(filePath);
    res.json({ success: true, message: "Set je uspešno obrisan" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));