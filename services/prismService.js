const { execFile, exec } = require('child_process');
const fs = require('fs');

let activePrismProcess = null;

const getCommand = (prismPath) => {
  const useShell = process.platform === 'win32';
  let finalPrismPath = prismPath;
  if (!useShell && prismPath.includes(':\\')) {
    finalPrismPath = '/opt/prism/bin/prism';
  }
  return {
    command: useShell ? `"${finalPrismPath}"` : finalPrismPath,
    useShell
  };
};

const executePrism = (prismDir, prismExe, args, prismPath) => {
  return new Promise((resolve, reject) => {
    if (prismDir !== '.' && !fs.existsSync(prismDir)) {
      return reject({ message: `The PRISM directory does not exist: ${prismDir}. Please check the PRISM Path in your settings.`, stdout: '', stderr: '' });
    }

    const { command, useShell } = getCommand(prismPath);
    console.log(`Executing in ${prismDir}: ${prismExe} ${args.join(' ')}`);
    
    activePrismProcess = execFile(command, args, { cwd: prismDir, shell: useShell }, (error, stdout, stderr) => {
      activePrismProcess = null;
      if (error) {
        let errorMsg = error.message;
        const errorMatch = stdout ? stdout.match(/Error:\s*([^\n]*)/) : null;
        if (errorMatch) {
          errorMsg = errorMatch[0] + '\n\nOriginal Command Error: ' + error.message;
        }
        return reject({ message: errorMsg, stdout, stderr });
      }
      resolve({ stdout, stderr, cmd: `${prismExe} ${args.join(' ')}` });
    });
  });
};

const cancelActiveProcess = () => {
  return new Promise((resolve, reject) => {
    if (activePrismProcess) {
      const pid = activePrismProcess.pid;
      exec(`taskkill /pid ${pid} /t /f`, (err) => {
        if (err) return reject(err);
        activePrismProcess = null;
        resolve();
      });
    } else {
      resolve(); // Nothing to cancel
    }
  });
};

const parseVerifyOutput = (stdout) => {
  let results = [];
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
    const lines = stdout.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('Result') && line.includes(':')) {
        const resStr = line.split(':')[1].trim();
        let resVal;
        if (resStr.toLowerCase().startsWith('true')) {
          resVal = 'True';
        } else if (resStr.toLowerCase().startsWith('false')) {
          resVal = 'False';
        } else {
          resVal = parseFloat(resStr);
        }
        if (resVal !== undefined && (typeof resVal === 'string' || !isNaN(resVal))) {
          results.push({ result: resVal });
        }
      }
    }
  }
  return results;
};

const parseSimulateOutput = (stdout) => {
  let trace = [];
  const lines = stdout.split('\n');
  let isTrace = false;
  let headers = [];
  
  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('action step')) {
      isTrace = true;
      headers = line.split(/\s+/);
      continue;
    }
    if (isTrace && line.length > 0) {
      if (line.startsWith('Generated path:')) break;
      const parts = line.split(/\s+/);
      if (parts.length === headers.length) {
        let row = {};
        for (let i = 0; i < headers.length; i++) {
          row[headers[i]] = isNaN(parseFloat(parts[i])) ? parts[i] : parseFloat(parts[i]);
        }
        trace.push(row);
      }
    }
  }
  return trace;
};

module.exports = {
  executePrism,
  cancelActiveProcess,
  parseVerifyOutput,
  parseSimulateOutput
};
