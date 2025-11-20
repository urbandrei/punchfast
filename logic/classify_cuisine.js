const { spawn } = require('child_process');
const path = require('path');

function classifyCuisine(url) {
  return new Promise((resolve, reject) => {
    const script = path.join(process.cwd(), 'ai', 'bow_cuisine.py');
    const models = path.join(process.cwd(), 'ai', 'models');

    const py = spawn('python', [
      script, 'predict',
      '--url', url,
      '--models', models,
      '--timeout', '30'
    ], { env: process.env });

    let out = '', err = '';
    py.stdout.on('data', d => out += d.toString());
    py.stderr.on('data', d => err += d.toString());
    py.on('close', code => {
      if (code !== 0) return reject(new Error(err || `predict exited ${code}`));
      try { resolve(JSON.parse(out)); } catch (e) { reject(e); }
    });
  });
}

module.exports = { classifyCuisine };