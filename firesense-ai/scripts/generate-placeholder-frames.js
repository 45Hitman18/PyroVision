const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const framesDir = path.join(__dirname, '../public/frames');
const numFrames = 100;
const width = 1280;
const height = 720;

if (!fs.existsSync(framesDir)) {
  fs.mkdirSync(framesDir, { recursive: true });
}

async function generateFrames() {
  console.log(`Generating ${numFrames} placeholder frames in ${framesDir}...`);
  
  for (let i = 1; i <= numFrames; i++) {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    // Subtle gradient shift
    gradient.addColorStop(0, '#ff4500'); // fire orange
    gradient.addColorStop(1, '#ff8c00'); // fire amber
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw "Terrain/Vegetation" (greenish blobs)
    for (let j = 0; j < 5; j++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const r = 200 + Math.random() * 400;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(20, 40, 20, 0.4)');
      grad.addColorStop(1, 'rgba(20, 40, 20, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw "Heat/Smoke" (orange/red blobs that move slightly)
    const offsetX = (i % 10) * 10;
    const offsetY = (i / 10) * 10;
    
    for (let j = 0; j < 3; j++) {
      const x = (width * 0.3) + offsetX + (j * 100);
      const y = (height * 0.4) + offsetY + (Math.sin(i / 10 + j) * 50);
      const r = 150 + Math.random() * 100;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, `rgba(255, ${69 + (i/2)}, 0, ${0.4 + (i/200)})`);
      grad.addColorStop(1, 'rgba(255, 69, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Add subtle frame number at bottom right
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`MODIS SEQUENCE | FRAME ${i.toString().padStart(3, '0')}`, width - 40, height - 40);
    
    const buffer = canvas.toBuffer('image/png');
    const filename = `frame-${i.toString().padStart(3, '0')}.png`;
    fs.writeFileSync(path.join(framesDir, filename), buffer);
    
    if (i % 10 === 0) console.log(`Generated ${i}/${numFrames} frames`);
  }
  
  console.log('Frame generation complete!');
}

generateFrames().catch(err => {
  console.error('Error generating frames:', err);
  process.exit(1);
});
