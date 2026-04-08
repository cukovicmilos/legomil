import fs from "fs";
import path from "path";
import sharp from "sharp";

const DATA_DIR = "./data";

async function migrate() {
  const folders = fs.readdirSync(DATA_DIR).filter(item => {
    const itemPath = path.join(DATA_DIR, item);
    return fs.statSync(itemPath).isDirectory();
  });

  let converted = 0;
  let skipped = 0;
  let errors = 0;

  for (const folder of folders) {
    const setFolder = path.join(DATA_DIR, folder);
    const files = fs.readdirSync(setFolder);
    const mdFile = files.find(f => f.endsWith('.md'));
    
    if (!mdFile) {
      console.log(`No .md file for ${folder}, skipping`);
      skipped++;
      continue;
    }

    const existingWebp = path.join(setFolder, 'image.webp');
    if (fs.existsSync(existingWebp)) {
      console.log(`WebP already exists for ${folder}, skipping`);
      skipped++;
      continue;
    }

    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    let existingImage = null;
    for (const ext of imageExtensions) {
      const img = path.join(setFolder, `image${ext}`);
      if (fs.existsSync(img)) {
        existingImage = img;
        break;
      }
    }

    if (!existingImage) {
      console.log(`No image found for ${folder}, skipping`);
      skipped++;
      continue;
    }

    try {
      const inputBuffer = fs.readFileSync(existingImage);
      await sharp(inputBuffer)
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(existingWebp);

      const mdPath = path.join(setFolder, mdFile);
      let mdContent = fs.readFileSync(mdPath, 'utf-8');
      mdContent = mdContent.replace(/image_url:\s*.*\.(?:jpg|jpeg|png|gif)/g, 'image_url: /data/' + folder + '/image.webp');
      fs.writeFileSync(mdPath, mdContent);

      console.log(`Converted ${folder}: ${path.basename(existingImage)} -> image.webp`);
      converted++;
    } catch (err) {
      console.error(`Error converting ${folder}:`, err.message);
      errors++;
    }
  }

  console.log(`\nDone! Converted: ${converted}, Skipped: ${skipped}, Errors: ${errors}`);
}

migrate();