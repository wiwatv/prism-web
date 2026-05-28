const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const dataDir = path.join(__dirname, 'data');
const modelsDir = path.join(dataDir, 'models');

// Ensure directories exist
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if (!fs.existsSync(modelsDir)) fs.mkdirSync(modelsDir);

// Helpers
const getModelPath = (id) => path.join(modelsDir, `${id}.sm`);
const getPropsPath = (id) => path.join(modelsDir, `${id}.props`);
const getConfigPath = (id) => path.join(modelsDir, `${id}.config.json`);

// --- Models CRUD ---

app.get('/api/models', (req, res) => {
  try {
    const files = fs.readdirSync(modelsDir);
    const models = files
      .filter(f => f.endsWith('.sm'))
      .map(f => {
        const id = f.replace('.sm', '');
        const content = fs.readFileSync(path.join(modelsDir, f), 'utf-8');
        let props = '';
        if (fs.existsSync(getPropsPath(id))) {
          props = fs.readFileSync(getPropsPath(id), 'utf-8');
        }
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

app.post('/api/models', (req, res) => {
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

app.put('/api/models/:id', (req, res) => {
  const { id } = req.params;
  const { content, props, config } = req.body;
  try {
    if (!fs.existsSync(getModelPath(id))) {
      return res.status(404).json({ error: 'Model not found' });
    }
    fs.writeFileSync(getModelPath(id), content || '');
    if (props !== undefined) fs.writeFileSync(getPropsPath(id), props);
    if (config !== undefined) fs.writeFileSync(getConfigPath(id), JSON.stringify(config, null, 2));
    res.json({ id, name: id, content, props, config });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/models/:id', (req, res) => {
  const { id } = req.params;
  try {
    if (fs.existsSync(getModelPath(id))) {
      fs.unlinkSync(getModelPath(id));
    }
    if (fs.existsSync(getPropsPath(id))) {
      fs.unlinkSync(getPropsPath(id));
    }
    if (fs.existsSync(getConfigPath(id))) {
      fs.unlinkSync(getConfigPath(id));
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Cancel Verification ---

app.post('/api/cancel', (req, res) => {
  if (activePrismProcess) {
    const pid = activePrismProcess.pid;
    console.log(`Cancelling active PRISM process (PID: ${pid})`);
    
    // Kill process tree forcefully on Windows
    require('child_process').exec(`taskkill /pid ${pid} /t /f`, (err) => {
      if (err) {
        console.error(`Error killing process ${pid}:`, err.message);
        return res.status(500).json({ success: false, error: 'Failed to kill process' });
      }
      activePrismProcess = null;
      res.json({ success: true, message: 'Process cancelled successfully' });
    });
  } else {
    res.json({ success: false, message: 'No active process to cancel' });
  }
});

// --- Syntax Check ---

app.post('/api/check-syntax', (req, res) => {
  const { modelId, prismPath, constants, sweepParams } = req.body;

  if (!modelId || !prismPath) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const modelPath = getModelPath(modelId);
  if (!fs.existsSync(modelPath)) {
    return res.status(404).json({ error: 'Model file not found' });
  }

  const prismDir = require('path').dirname(prismPath);
  const prismExe = require('path').basename(prismPath);

  let args = [modelPath];

  let constParts = [];
  if (constants && constants.trim()) {
    constParts.push(constants.trim());
  }

  if (sweepParams && sweepParams.length > 0) {
    let sweepStrs = [];
    for (let sc of sweepParams) {
      if (sc && sc.param && sc.start !== undefined) {
        // Just provide the start value for syntax check to satisfy PRISM that the constant is defined
        sweepStrs.push(`${sc.param}=${sc.start}`);
      }
    }
    if (sweepStrs.length > 0) {
      constParts.push(sweepStrs.join(','));
    }
  }

  if (constParts.length > 0) {
    args.push('-const', constParts.join(','));
  }

  console.log(`Executing Syntax Check in ${prismDir}: ${prismExe} ${args.join(' ')}`);

  const { execFile } = require('child_process');
  const useShell = process.platform === 'win32';
  const command = useShell ? `"${prismPath}"` : prismPath;
  activePrismProcess = execFile(command, args, { cwd: prismDir, shell: useShell }, (error, stdout, stderr) => {
    activePrismProcess = null; // Clear process tracking
    
    if (error) {
      console.error(`Error executing PRISM for syntax check: ${error.message}`);
      // Try to extract the error message from stdout
      let errorMsg = error.message;
      const errorMatch = stdout.match(/Error:\s*([^\n]*)/);
      if (errorMatch) {
        errorMsg = errorMatch[0];
      }
      return res.json({ success: false, error: errorMsg, stdout, stderr });
    }
    
    // PRISM also sometimes prints "Error:" without failing the exit code (though rare).
    if (stdout.includes('Error:')) {
      const errorMatch = stdout.match(/Error:\s*([^\n]*)/);
      const errorMsg = errorMatch ? errorMatch[0] : 'Unknown syntax error';
      return res.json({ success: false, error: errorMsg, stdout, stderr });
    }

    res.json({
      success: true,
      message: 'Syntax check passed',
      stdout
    });
  });
});

// --- Verification & Parameter Sweep ---

let activePrismProcess = null;

app.post('/api/verify', (req, res) => {
  const { modelId, property, prismPath, sweepParams, constants } = req.body;

  if (!modelId || !property || !prismPath) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const modelPath = getModelPath(modelId);
  if (!fs.existsSync(modelPath)) {
    return res.status(404).json({ error: 'Model file not found' });
  }

  const prismDir = require('path').dirname(prismPath);
  const prismExe = require('path').basename(prismPath);

  // For PTA sweeps, PRISM requires properties to be in a file rather than inline.
  const propsPath = path.join(modelsDir, `${modelId}_temp.props`);
  fs.writeFileSync(propsPath, property);

  // Construct command arguments
  let args = [modelPath, propsPath];

  // Build the -const string
  let constParts = [];
  if (constants && constants.trim()) {
    constParts.push(constants.trim());
  }

  // Add parameter sweeps if provided
  if (sweepParams && sweepParams.length > 0) {
    let sweepStrs = [];
    for (let sc of sweepParams) {
      if (sc && sc.param && sc.start !== undefined && sc.end !== undefined) {
        sweepStrs.push(`${sc.param}=${sc.start}:${sc.step || 1}:${sc.end}`);
      }
    }
    if (sweepStrs.length > 0) {
      constParts.push(sweepStrs.join(','));
      args.push('-exportresults', 'stdout');
    }
  }

  if (constParts.length > 0) {
    args.push('-const', constParts.join(','));
  }

  console.log(`Executing in ${prismDir}: ${prismExe} ${args.join(' ')}`);

  const { execFile } = require('child_process');
  const useShell = process.platform === 'win32';
  const command = useShell ? `"${prismPath}"` : prismPath;
  activePrismProcess = execFile(command, args, { cwd: prismDir, shell: useShell }, (error, stdout, stderr) => {
    activePrismProcess = null; // Clear process tracking
    
    // Clean up temp props file
    if (fs.existsSync(propsPath)) fs.unlinkSync(propsPath);
    if (error) {
      console.error(`Error executing PRISM: ${error.message}`);
      return res.status(500).json({ error: 'PRISM execution failed', details: error.message, stdout, stderr });
    }
    
    // Parse the output. 
    let results = [];
    
    // First, check if it's a multi-parameter TSV table export
    const listStart = stdout.indexOf('Exporting results as list (plain text) below:');
    if (listStart !== -1) {
      const tableLines = stdout.substring(listStart).split('\n').filter(l => l.trim() !== '');
      if (tableLines.length > 2) {
        const headers = tableLines[1].trim().split(/\s+/);
        for (let i = 2; i < tableLines.length; i++) {
          const parts = tableLines[i].trim().split(/\s+/);
          if (parts.length === headers.length) {
            let resObj = {};
            for (let j = 0; j < headers.length - 1; j++) {
              resObj[headers[j]] = parseFloat(parts[j]);
            }
            resObj.value = parseFloat(parts[parts.length - 1]);
            results.push(resObj);
          }
        }
      }
    } else {
      // It's a single result (no sweeping)
      const lines = stdout.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('Result') && line.includes(':')) {
          const resVal = parseFloat(line.split(':')[1].trim());
          if (!isNaN(resVal)) {
            results.push({ result: resVal });
          }
        }
      }
    }

    res.json({
      success: true,
      cmd: `${prismExe} ${args.join(' ')}`,
      results,
      stdout
    });
  });
});

// --- Serve React Frontend ---
// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// The 'catchall' handler: for any request that doesn't
// match the API routes above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
