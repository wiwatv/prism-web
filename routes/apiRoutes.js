const express = require('express');
const fs = require('fs');
const path = require('path');
const { executePrism, cancelActiveProcess, parseVerifyOutput, parseSimulateOutput } = require('../services/prismService');

const router = express.Router();
const dataDir = path.join(__dirname, '..', 'data');
const modelsDir = path.join(dataDir, 'models');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if (!fs.existsSync(modelsDir)) fs.mkdirSync(modelsDir);

const getModelPath = (id) => path.join(modelsDir, `${id}.sm`);
const getPropsPath = (id) => path.join(modelsDir, `${id}.props`);
const getConfigPath = (id) => path.join(modelsDir, `${id}.config.json`);

// --- Models CRUD ---
router.get('/models', (req, res) => {
  try {
    const files = fs.readdirSync(modelsDir);
    const models = files
      .filter(f => f.endsWith('.sm'))
      .map(f => {
        const id = f.replace('.sm', '');
        const content = fs.readFileSync(path.join(modelsDir, f), 'utf-8');
        let props = fs.existsSync(getPropsPath(id)) ? fs.readFileSync(getPropsPath(id), 'utf-8') : '';
        let config = {};
        if (fs.existsSync(getConfigPath(id))) {
          try { config = JSON.parse(fs.readFileSync(getConfigPath(id), 'utf-8')); } catch(e) {}
        }
        return { id, name: id, content, props, config };
      });
    res.json(models);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/models', (req, res) => {
  const { id, content, props, config } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing model id' });
  try {
    fs.writeFileSync(getModelPath(id), content || '');
    if (props !== undefined) fs.writeFileSync(getPropsPath(id), props);
    if (config !== undefined) fs.writeFileSync(getConfigPath(id), JSON.stringify(config, null, 2));
    res.json({ id, name: id, content, props, config });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/models/:id', (req, res) => {
  const { id } = req.params;
  const { content, props, config } = req.body;
  try {
    if (!fs.existsSync(getModelPath(id))) return res.status(404).json({ error: 'Model not found' });
    fs.writeFileSync(getModelPath(id), content || '');
    if (props !== undefined) fs.writeFileSync(getPropsPath(id), props);
    if (config !== undefined) fs.writeFileSync(getConfigPath(id), JSON.stringify(config, null, 2));
    res.json({ id, name: id, content, props, config });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/models/:id', (req, res) => {
  const { id } = req.params;
  try {
    if (fs.existsSync(getModelPath(id))) fs.unlinkSync(getModelPath(id));
    if (fs.existsSync(getPropsPath(id))) fs.unlinkSync(getPropsPath(id));
    if (fs.existsSync(getConfigPath(id))) fs.unlinkSync(getConfigPath(id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Execution endpoints ---
router.post('/cancel', async (req, res) => {
  try {
    await cancelActiveProcess();
    res.json({ success: true, message: 'Process cancelled successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to kill process' });
  }
});

router.post('/check-syntax', async (req, res) => {
  const { modelId, prismPath, constants, sweepParams } = req.body;
  if (!modelId || !prismPath) return res.status(400).json({ error: 'Missing required fields' });
  
  const modelPath = getModelPath(modelId);
  if (!fs.existsSync(modelPath)) return res.status(404).json({ error: 'Model file not found' });

  const prismDir = path.dirname(prismPath);
  const prismExe = path.basename(prismPath);
  let args = [modelPath];

  let constParts = [];
  if (constants && constants.trim()) constParts.push(constants.trim());
  if (sweepParams && sweepParams.length > 0) {
    let sweepStrs = sweepParams.filter(sc => sc && sc.param && sc.start !== undefined).map(sc => `${sc.param}=${sc.start}`);
    if (sweepStrs.length > 0) constParts.push(sweepStrs.join(','));
  }
  if (constParts.length > 0) args.push('-const', constParts.join(','));

  try {
    const { stdout } = await executePrism(prismDir, prismExe, args, prismPath);
    if (stdout && stdout.includes('Error:')) {
      const errorMatch = stdout.match(/Error:\s*([^\n]*)/);
      return res.json({ success: false, error: errorMatch ? errorMatch[0] : 'Unknown syntax error', stdout });
    }
    res.json({ success: true, message: 'Syntax check passed', stdout });
  } catch (error) {
    res.json({ success: false, error: error.message, stdout: error.stdout, stderr: error.stderr });
  }
});

router.post('/verify', async (req, res) => {
  const { modelId, property, prismPath, sweepParams, constants, engine } = req.body;
  if (!modelId || !property || !prismPath) return res.status(400).json({ error: 'Missing required fields' });

  const modelPath = getModelPath(modelId);
  if (!fs.existsSync(modelPath)) return res.status(404).json({ error: 'Model file not found' });

  const prismDir = path.dirname(prismPath);
  const prismExe = path.basename(prismPath);
  const propsPath = path.join(modelsDir, `${modelId}_temp.props`);
  fs.writeFileSync(propsPath, property);

  let args = [modelPath, propsPath];
  let constParts = [];
  if (constants && constants.trim()) constParts.push(constants.trim());
  
  if (sweepParams && sweepParams.length > 0) {
    let sweepStrs = sweepParams.filter(sc => sc && sc.param && sc.start !== undefined && sc.end !== undefined)
                               .map(sc => `${sc.param}=${sc.start}:${sc.step || 1}:${sc.end}`);
    if (sweepStrs.length > 0) {
      constParts.push(sweepStrs.join(','));
      args.push('-exportresults', 'stdout');
    }
  }
  if (constParts.length > 0) args.push('-const', constParts.join(','));
  if (engine && engine !== 'auto') args.push(`-${engine}`);

  try {
    const { stdout, cmd } = await executePrism(prismDir, prismExe, args, prismPath);
    if (fs.existsSync(propsPath)) fs.unlinkSync(propsPath);
    const results = parseVerifyOutput(stdout);
    res.json({ success: true, cmd, results, stdout });
  } catch (error) {
    if (fs.existsSync(propsPath)) fs.unlinkSync(propsPath);
    res.status(500).json({ error: 'PRISM execution failed', details: error.message, stdout: error.stdout, stderr: error.stderr });
  }
});

router.post('/simulate', async (req, res) => {
  const { modelId, prismPath, constants, steps } = req.body;
  if (!modelId || !prismPath || !steps) return res.status(400).json({ error: 'Missing required fields' });

  const modelPath = getModelPath(modelId);
  if (!fs.existsSync(modelPath)) return res.status(404).json({ error: 'Model file not found' });

  const prismDir = path.dirname(prismPath);
  const prismExe = path.basename(prismPath);
  let args = [modelPath, '-simpath', String(steps), 'stdout'];

  let constParts = [];
  if (constants && constants.trim()) constParts.push(constants.trim());
  if (constParts.length > 0) args.push('-const', constParts.join(','));

  try {
    const { stdout, cmd } = await executePrism(prismDir, prismExe, args, prismPath);
    const trace = parseSimulateOutput(stdout);
    res.json({ success: true, cmd, trace, stdout });
  } catch (error) {
    res.status(500).json({ error: 'PRISM simulation failed', details: error.message, stdout: error.stdout, stderr: error.stderr });
  }
});

module.exports = router;
