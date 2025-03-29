const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateFavicons() {
  const inputSvg = path.join(__dirname, '../public/favicon.svg');
  const publicDir = path.join(__dirname, '../public');

  // Gera icon.png (32x32)
  await sharp(inputSvg)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'icon.png'));

  // Gera apple-icon.png (180x180)
  await sharp(inputSvg)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-icon.png'));

  // Copia icon.png como favicon.ico (os navegadores modernos aceitam PNG)
  fs.copyFileSync(
    path.join(publicDir, 'icon.png'),
    path.join(publicDir, 'favicon.ico')
  );

  console.log('Favicons gerados com sucesso!');
}

generateFavicons().catch(console.error); 