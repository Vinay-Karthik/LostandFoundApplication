import fs from 'fs';
import path from 'path';

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || '';
const PROJECT_ID = process.env.VERCEL_PROJECT_ID || 'prj_fWm4SGV3Job92lndHVrcz3Z7eoQK';

async function getAllFiles(dir, base = '') {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const relPath = path.join(base, file).replace(/\\/g, '/');
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(await getAllFiles(filePath, relPath));
    } else {
      const data = fs.readFileSync(filePath, { encoding: 'base64' });
      results.push({
        file: relPath,
        data,
        encoding: 'base64',
      });
    }
  }
  return results;
}

async function deploy() {
  console.log('Configuring Vercel project for prebuilt static serving...');
  await fetch(`https://api.vercel.com/v9/projects/${PROJECT_ID}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      framework: null,
      buildCommand: null,
      outputDirectory: null,
    }),
  });

  const distDir = path.resolve('dist');
  console.log('Reading dist directory:', distDir);
  const files = await getAllFiles(distDir);
  console.log(`Found ${files.length} files to upload.`);

  // Include vercel.json for SPA routing
  files.push({
    file: 'vercel.json',
    data: Buffer.from(JSON.stringify({
      cleanUrls: true,
      rewrites: [{ source: '/(.*)', destination: '/index.html' }]
    })).toString('base64'),
    encoding: 'base64',
  });

  const payload = {
    name: 'campustrack-lostandfound',
    project: PROJECT_ID,
    files,
    target: 'production',
  };

  console.log('Sending deployment to Vercel API...');
  const res = await fetch(`https://api.vercel.com/v13/deployments?forceNew=1`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (data.error) {
    console.error('Vercel Deploy Error:', data.error);
    process.exit(1);
  }

  console.log('Deploy ID:', data.id);
  console.log('Production URL: https://' + data.url);
  console.log('Project Alias: https://campustrack-lostandfound.vercel.app');
}

deploy().catch(err => {
  console.error(err);
  process.exit(1);
});
