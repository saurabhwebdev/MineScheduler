const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'public', 'authimage.png');
const outputWebP = path.join(__dirname, 'public', 'authimage.webp');
const outputOptimizedPng = path.join(__dirname, 'public', 'authimage-optimized.png');

async function optimizeImages() {
  try {
    console.log('Starting image optimization...');
    
    // Check if input file exists
    if (!fs.existsSync(inputPath)) {
      console.error('Input file not found:', inputPath);
      return;
    }

    // Convert to WebP (much smaller file size)
    await sharp(inputPath)
      .webp({ quality: 85 })
      .toFile(outputWebP);
    
    const webpStats = fs.statSync(outputWebP);
    console.log(`✓ Created WebP: ${(webpStats.size / 1024 / 1024).toFixed(2)} MB`);

    // Create optimized PNG as fallback
    await sharp(inputPath)
      .png({ quality: 80, compressionLevel: 9 })
      .toFile(outputOptimizedPng);
    
    const pngStats = fs.statSync(outputOptimizedPng);
    console.log(`✓ Created optimized PNG: ${(pngStats.size / 1024 / 1024).toFixed(2)} MB`);

    const originalStats = fs.statSync(inputPath);
    console.log(`\nOriginal size: ${(originalStats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`WebP reduction: ${(((originalStats.size - webpStats.size) / originalStats.size) * 100).toFixed(1)}%`);
    console.log(`PNG reduction: ${(((originalStats.size - pngStats.size) / originalStats.size) * 100).toFixed(1)}%`);
    
    console.log('\n✓ Image optimization complete!');
  } catch (error) {
    console.error('Error optimizing images:', error);
  }
}

optimizeImages();
