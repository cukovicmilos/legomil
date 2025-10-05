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
app.use("/data", express.static("data")); // Serviranje slika iz data foldera

// GET svi setovi
app.get("/sets", (req, res) => {
  // Pronađi sve foldere u data direktorijumu
  const folders = fs.readdirSync(DATA_DIR).filter(item => {
    const itemPath = path.join(DATA_DIR, item);
    return fs.statSync(itemPath).isDirectory();
  });

  const sets = folders.map(folder => {
    const mdFile = path.join(DATA_DIR, folder, `${folder}.md`);
    if (!fs.existsSync(mdFile)) return null;

    const content = fs.readFileSync(mdFile, "utf-8");

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
    // Preuzmi podatke o setu sa API-ja
    const resp = await fetch(url, {
      headers: { "Authorization": `key ${API_KEY}` }
    });
    if (!resp.ok) throw new Error("Set nije pronađen");
    const data = await resp.json();

    // Napravi folder za set
    const setFolder = path.join(DATA_DIR, data.set_num);
    if (!fs.existsSync(setFolder)) {
      fs.mkdirSync(setFolder, { recursive: true });
    }

    // Preuzmi sliku i sačuvaj lokalno
    let localImageUrl = "";
    if (data.set_img_url) {
      const imageResp = await fetch(data.set_img_url);
      if (imageResp.ok) {
        const imageBuffer = await imageResp.arrayBuffer();
        const ext = path.extname(new URL(data.set_img_url).pathname) || '.jpg';
        const imagePath = path.join(setFolder, `image${ext}`);
        fs.writeFileSync(imagePath, Buffer.from(imageBuffer));
        localImageUrl = `/data/${data.set_num}/image${ext}`;
      }
    }

    // Kreiraj .md fajl sa lokalnom putanjom do slike
    const mdContent = `---
set_number: ${data.set_num}
name: ${data.name}
year: ${data.year}
theme: ${data.theme_id}
image_url: ${localImageUrl || data.set_img_url}
---`;

    const mdPath = path.join(setFolder, `${data.set_num}.md`);
    fs.writeFileSync(mdPath, mdContent);

    res.json({
      success: true,
      set: {
        set_num: data.set_num,
        name: data.name,
        year: data.year,
        theme_id: data.theme_id,
        set_img_url: localImageUrl || data.set_img_url
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE brisanje seta
app.delete("/deleteSet/:number", (req, res) => {
  const number = req.params.number;
  const setFolder = path.join(DATA_DIR, number);

  try {
    if (!fs.existsSync(setFolder)) {
      return res.status(404).json({ success: false, error: "Set nije pronađen" });
    }

    // Obriši ceo folder sa svim fajlovima
    fs.rmSync(setFolder, { recursive: true, force: true });
    res.json({ success: true, message: "Set je uspešno obrisan" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));