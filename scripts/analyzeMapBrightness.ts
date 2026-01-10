/**
 * Analyze brightness distribution in Valorant minimap images
 * This helps determine the correct threshold for walkable vs wall detection
 */

import sharp from 'sharp';

const HAVEN_URL = 'https://media.valorant-api.com/maps/2bee0dc9-4ffe-519b-1cbd-7fbe763a6047/displayicon.png';

async function analyzeImage() {
  console.log('Downloading Haven minimap...');
  const response = await fetch(HAVEN_URL);
  const imageBuffer = Buffer.from(await response.arrayBuffer());

  // Get raw pixel data at full resolution
  const { data, info } = await sharp(imageBuffer)
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  console.log(`Image size: ${info.width}x${info.height}`);
  console.log(`Total pixels: ${data.length}`);

  // Build histogram of brightness values
  const histogram: number[] = new Array(256).fill(0);
  for (let i = 0; i < data.length; i++) {
    histogram[data[i]]++;
  }

  // Find peaks in histogram
  console.log('\nBrightness distribution:');
  console.log('========================');

  // Show key ranges
  const ranges = [
    { name: 'Very Dark (0-20)', min: 0, max: 20 },
    { name: 'Dark (21-40)', min: 21, max: 40 },
    { name: 'Dark Gray (41-60)', min: 41, max: 60 },
    { name: 'Medium Gray (61-80)', min: 61, max: 80 },
    { name: 'Light Gray (81-100)', min: 81, max: 100 },
    { name: 'Bright (101-150)', min: 101, max: 150 },
    { name: 'Very Bright (151-255)', min: 151, max: 255 },
  ];

  for (const range of ranges) {
    let count = 0;
    for (let i = range.min; i <= range.max; i++) {
      count += histogram[i];
    }
    const percent = ((count / data.length) * 100).toFixed(1);
    console.log(`${range.name}: ${count} pixels (${percent}%)`);
  }

  // Find the best threshold by looking for gap between dark and light
  console.log('\nAnalyzing for optimal threshold...');

  // Sample specific areas of the map
  // The image is 1024x1024 originally, let's sample specific regions
  const sampleSize = 128;
  const { data: smallData } = await sharp(imageBuffer)
    .resize(sampleSize, sampleSize, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Sample from center of map (should be mix of walkable and walls)
  const centerRegion: number[] = [];
  for (let y = 40; y < 90; y++) {
    for (let x = 40; x < 90; x++) {
      centerRegion.push(smallData[y * sampleSize + x]);
    }
  }
  centerRegion.sort((a, b) => a - b);

  console.log('\nCenter region brightness values (sorted):');
  console.log('Min:', centerRegion[0]);
  console.log('10th percentile:', centerRegion[Math.floor(centerRegion.length * 0.1)]);
  console.log('25th percentile:', centerRegion[Math.floor(centerRegion.length * 0.25)]);
  console.log('Median:', centerRegion[Math.floor(centerRegion.length * 0.5)]);
  console.log('75th percentile:', centerRegion[Math.floor(centerRegion.length * 0.75)]);
  console.log('90th percentile:', centerRegion[Math.floor(centerRegion.length * 0.9)]);
  console.log('Max:', centerRegion[centerRegion.length - 1]);

  // Find natural break point (largest gap in sorted values)
  let maxGap = 0;
  let gapThreshold = 0;
  for (let i = 1; i < centerRegion.length; i++) {
    const gap = centerRegion[i] - centerRegion[i - 1];
    if (gap > maxGap) {
      maxGap = gap;
      gapThreshold = (centerRegion[i] + centerRegion[i - 1]) / 2;
    }
  }
  console.log(`\nLargest brightness gap found at: ${gapThreshold.toFixed(0)} (gap size: ${maxGap})`);

  // Test different thresholds
  console.log('\nTesting different thresholds:');
  for (const threshold of [25, 35, 45, 55, 65, 75]) {
    let walkable = 0;
    for (const brightness of smallData) {
      if (brightness > threshold) walkable++;
    }
    const percent = ((walkable / smallData.length) * 100).toFixed(1);
    console.log(`Threshold ${threshold}: ${percent}% walkable`);
  }
}

analyzeImage().catch(console.error);
