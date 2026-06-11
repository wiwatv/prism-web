import os

components_dir = 'src/components'
if not os.path.exists(components_dir):
    os.makedirs(components_dir)

sidebar_code = """import { Plus, Trash2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function Sidebar() {
  const { models, activeModel, selectModel, handleCreate, handleDelete } = useAppContext();
  
  return (
    <div className="glass-panel sidebar animate-fade-in">
      <div className="sidebar-header">
        PRISM Web IDE
      </div>
      <button className="btn btn-primary" onClick={handleCreate} style={{ width: '100%', marginBottom: '20px' }}>
        <Plus size={18} /> New Model
      </button>
      <ul className="model-list">
        {models.map(model => (
          <li 
            key={model.id} 
            className={`model-item ${activeModel?.id === model.id ? 'active' : ''}`}
            onClick={() => selectModel(model)}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{model.name}.sm</span>
            <button 
              className={`btn-icon ${activeModel?.id === model.id ? '' : 'danger'}`}
              onClick={(e) => handleDelete(model.id, e)}
              style={{ color: activeModel?.id === model.id ? 'white' : undefined }}
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
"""
with open(f'{components_dir}/Sidebar.tsx', 'w') as f: f.write(sidebar_code)

editor_code = """import Editor from '@monaco-editor/react';
import { Save, FileCode2, Terminal } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { registerPrismLanguage } from '../PrismLanguage';

export default function EditorPanel() {
  const { activeModel, code, setCode, cmdOutput, isLoading, handleSyntaxCheck, handleSave } = useAppContext();

  const handleEditorBeforeMount = (monaco: any) => {
    registerPrismLanguage(monaco);
  };

  return (
    <div className="editor-and-console-wrapper animate-fade-in" style={{ animationDelay: '0.2s', display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
      <div className="glass-panel editor-container" style={{ flex: 1, minHeight: 0 }}>
        <div className="editor-header">
          <div className="editor-title">
            {activeModel ? `${activeModel.name}.sm` : 'No Model Selected'}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-outline" onClick={handleSyntaxCheck} disabled={!activeModel || isLoading}>
              <FileCode2 size={16} /> Syntax Check
            </button>
            <button className="btn btn-outline" onClick={handleSave} disabled={!activeModel}>
              <Save size={16} /> Save
            </button>
          </div>
        </div>
        <div className="editor-body">
          {activeModel ? (
             <Editor
               height="100%"
               defaultLanguage="prism"
               language="prism"
               theme="vs-dark"
               value={code}
               onChange={(val) => setCode(val || '')}
               beforeMount={handleEditorBeforeMount}
               options={{ minimap: { enabled: false }, fontSize: 14, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", padding: { top: 16 } }}
             />
          ) : (
             <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
               Select or create a model to start editing
             </div>
          )}
        </div>
      </div>
      <div className="glass-panel console-container" style={{ height: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <div className="editor-header" style={{ padding: '10px 16px', backgroundColor: 'rgba(0,0,0,0.2)' }}>
          <div className="editor-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#94a3b8' }}>
            <Terminal size={16} /> Console Output
          </div>
        </div>
        <div className="console-body" style={{ flex: 1, padding: '12px', overflowY: 'auto', backgroundColor: '#020617', fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: '0.85rem', color: '#e2e8f0', whiteSpace: 'pre-wrap' }}>
          {cmdOutput ? cmdOutput : <span style={{ color: 'var(--text-muted)' }}>Waiting for execution output...</span>}
        </div>
      </div>
    </div>
  );
}
"""
with open(f'{components_dir}/EditorPanel.tsx', 'w') as f: f.write(editor_code)

config_code = """import { Play } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function ConfigPanel() {
  const {
    activeModel, isLoading,
    verificationMode, property, constants, param, startVal, endVal, stepVal, useParam2, param2, startVal2, endVal2, stepVal2, engine, simSteps, prismPath,
    setVerificationMode, setProperty, setConstants, setParam, setStartVal, setEndVal, setStepVal, setUseParam2, setParam2, setStartVal2, setEndVal2, setStepVal2, setEngine, setSimSteps, setPrismPath,
    handleVerify, handleSimulate, handleCancel
  } = useAppContext();

  return (
    <div className="panel-section config-panel animate-fade-in" style={{ animationDelay: '0.4s', paddingBottom: '0' }}>
      <h3>Configuration</h3>
      
      <div className="form-group">
        <label>PRISM Executable Path</label>
        <input type="text" className="input-field" value={prismPath} onChange={e => setPrismPath(e.target.value)} />
      </div>

      <div className="form-group" style={{ marginBottom: '16px' }}>
        <label>Verification Mode</label>
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'normal' }}>
            <input type="radio" name="vmode" checked={verificationMode === 'fixed'} onChange={() => setVerificationMode('fixed')} /> Fixed Property
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'normal' }}>
            <input type="radio" name="vmode" checked={verificationMode === 'sweep'} onChange={() => setVerificationMode('sweep')} /> Parameter Sweep
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'normal' }}>
            <input type="radio" name="vmode" checked={verificationMode === 'simulate'} onChange={() => setVerificationMode('simulate')} /> Simulation
          </label>
        </div>
      </div>
      
      <div className="form-group">
        <label>Engine</label>
        <select className="input-field" value={engine} onChange={e => setEngine(e.target.value)}>
          <option value="auto">Auto</option>
          <option value="explicit">Explicit</option>
          <option value="sparse">Sparse</option>
          <option value="mtbdd">MTBDD</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </div>

      <div className="form-group">
        <label>Fixed Constants (Optional)</label>
        <input type="text" className="input-field" value={constants} onChange={e => setConstants(e.target.value)} placeholder='e.g., r=0.5, fail_prob=0.1' />
      </div>

      {verificationMode !== 'simulate' ? (
        <div className="form-group">
          <label>PCTL Property</label>
          <input type="text" className="input-field" value={property} onChange={e => setProperty(e.target.value)} placeholder='e.g., Pmax=? [ F "success" ]' />
        </div>
      ) : (
        <div className="form-group">
          <label>Number of Steps</label>
          <input type="number" className="input-field" value={simSteps} onChange={e => setSimSteps(e.target.value)} />
        </div>
      )}

      {verificationMode === 'sweep' && (
        <div style={{ padding: '16px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '16px' }}>
          <h4 style={{ marginBottom: '12px', color: 'var(--primary)', fontSize: '0.9rem' }}>Primary Variable</h4>
          <div className="form-group">
            <label>Sweep Variable</label>
            <input type="text" className="input-field" value={param} onChange={e => setParam(e.target.value)} placeholder='e.g., r' />
          </div>
          <div className="param-grid" style={{ marginBottom: '16px' }}>
            <div className="form-group"><label>Start</label><input type="number" className="input-field" value={startVal} onChange={e => setStartVal(e.target.value)} /></div>
            <div className="form-group"><label>End</label><input type="number" className="input-field" value={endVal} onChange={e => setEndVal(e.target.value)} /></div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Step Size</label><input type="number" className="input-field" value={stepVal} onChange={e => setStepVal(e.target.value)} /></div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '12px', fontSize: '0.9rem' }}>
            <input type="checkbox" checked={useParam2} onChange={e => setUseParam2(e.target.checked)} /> Add Secondary Variable
          </label>
          {useParam2 && (
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }} className="animate-fade-in">
              <h4 style={{ marginBottom: '12px', color: '#10b981', fontSize: '0.9rem' }}>Secondary Variable</h4>
              <div className="form-group">
                <label>Sweep Variable</label>
                <input type="text" className="input-field" value={param2} onChange={e => setParam2(e.target.value)} placeholder='e.g., fail_prob' />
              </div>
              <div className="param-grid">
                <div className="form-group"><label>Start</label><input type="number" className="input-field" value={startVal2} onChange={e => setStartVal2(e.target.value)} /></div>
                <div className="form-group"><label>End</label><input type="number" className="input-field" value={endVal2} onChange={e => setEndVal2(e.target.value)} /></div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Step Size</label><input type="number" className="input-field" value={stepVal2} onChange={e => setStepVal2(e.target.value)} /></div>
              </div>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <button className="btn" style={{ width: '100%', marginTop: '8px', backgroundColor: 'var(--danger)', color: 'white' }} onClick={handleCancel}>Stop Verification</button>
      ) : (
        <button className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} onClick={verificationMode === 'simulate' ? handleSimulate : handleVerify} disabled={!activeModel}>
          <Play size={16} /> {verificationMode === 'simulate' ? 'Run Simulation' : 'Run Verification'}
        </button>
      )}
    </div>
  );
}
"""
with open(f'{components_dir}/ConfigPanel.tsx', 'w') as f: f.write(config_code)

results_code = """import { BarChart2, Download } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, Label } from 'recharts';
import { useAppContext } from '../context/AppContext';

export default function ResultsPanel() {
  const { results, param, useParam2, param2, activeModel, verificationMode } = useAppContext();

  const getChartData = () => {
    if (!results || results.length === 0 || results[0].result !== undefined) return { data: [], lines: [], isSim: false };
    
    if (results[0].step !== undefined) {
      const lineSet = new Set<string>();
      Object.keys(results[0]).forEach(k => {
        if (k !== 'step' && k !== 'action') lineSet.add(k);
      });
      return { data: results, lines: Array.from(lineSet), isSim: true };
    }

    const grouped: any = {};
    const lineSet = new Set<string>();
    
    results.forEach((row: any) => {
      const xVal = row[param];
      let lineKey = 'Current Result';
      if (useParam2 && row.hasOwnProperty(param2)) {
        lineKey = `${param2}=${row[param2]}`;
      } else {
        lineKey = 'Probability';
      }
      if (!grouped[xVal]) grouped[xVal] = { [param]: xVal };
      grouped[xVal][lineKey] = row.value;
      lineSet.add(lineKey);
    });

    const finalData = Object.values(grouped).sort((a: any, b: any) => {
      const valA = parseFloat(a[param]);
      const valB = parseFloat(b[param]);
      return valA - valB;
    });

    return { data: finalData, lines: Array.from(lineSet).sort(), isSim: false };
  };

  const exportCSV = () => {
    if (!results || results.length === 0) return;
    const chartInfo = getChartData();
    if (chartInfo.data.length === 0) return;
    const allKeys = new Set<string>();
    chartInfo.data.forEach((row: any) => Object.keys(row).forEach(k => allKeys.add(k)));
    const headers = Array.from(allKeys);
    let csvContent = headers.join(',') + '\\n';
    chartInfo.data.forEach((row: any) => {
      csvContent += headers.map(h => row[h] !== undefined ? row[h] : '').join(',') + '\\n';
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeModel?.name || 'export'}_sweep_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartInfo = getChartData();
  const isMultiLine = chartInfo.isSim || chartInfo.lines.length > 1;

  const renderChart = () => {
    const xKey = chartInfo.isSim ? 'step' : param;
    const xLabel = chartInfo.isSim ? 'Simulation Step' : `Sweep Variable: ${param}`;
    const yLabel = chartInfo.isSim ? 'Value' : 'Probability / Reward';
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    return (
      <ResponsiveContainer width="100%" height="100%">
        {isMultiLine ? (
          <LineChart data={chartInfo.data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey={xKey} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }}>
              <Label value={xLabel} position="insideBottom" offset={-15} fill="#94a3b8" fontSize={12} />
            </XAxis>
            <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }}>
              <Label value={yLabel} angle={-90} position="insideLeft" fill="#94a3b8" fontSize={12} />
            </YAxis>
            <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} itemStyle={{ color: '#f8fafc' }} />
            <Legend verticalAlign="top" height={36}/>
            {chartInfo.lines.map((lineKey, idx) => (
              <Line key={lineKey} type="monotone" dataKey={lineKey} name={lineKey} stroke={colors[idx % colors.length]} strokeWidth={3} dot={chartInfo.isSim} />
            ))}
          </LineChart>
        ) : (
          <AreaChart data={chartInfo.data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey={xKey} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }}>
              <Label value={xLabel} position="insideBottom" offset={-15} fill="#94a3b8" fontSize={12} />
            </XAxis>
            <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }}>
              <Label value={yLabel} angle={-90} position="insideLeft" fill="#94a3b8" fontSize={12} />
            </YAxis>
            <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} itemStyle={{ color: '#f8fafc' }} />
            <Area type="monotone" dataKey={chartInfo.lines[0] || 'value'} stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} name={chartInfo.lines[0] || 'Result'} />
          </AreaChart>
        )}
      </ResponsiveContainer>
    );
  };

  return (
    <div className="panel-section" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 0 }}><BarChart2 size={18} /> Results</h3>
        {results.length > 0 && !results[0].error && (
          <button className="btn btn-outline" onClick={exportCSV} style={{ padding: '6px 10px', fontSize: '0.8rem' }}><Download size={14} /> Export CSV</button>
        )}
      </div>
      
      <div className="chart-container" style={{ margin: 0, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {results.length > 0 ? (
          results[0].result === 'Cancelled' ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ padding: '16px 24px', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--warning)', borderRadius: '8px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontWeight: 'bold' }}>Operation Cancelled</span>
              </div>
            </div>
          ) : results[0].error ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ padding: '16px 24px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: '8px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontWeight: 'bold' }}>{results[0].error}</span>
              </div>
              {results[0].details && <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '6px', fontSize: '0.85rem', color: '#94a3b8', wordBreak: 'break-all', maxWidth: '100%' }}>{results[0].details}</div>}
            </div>
          ) : results[0].result !== undefined ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ padding: '32px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', minWidth: '200px' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Result</div>
                <span style={{ fontSize: '3rem', fontWeight: 'bold', color: '#3b82f6', textShadow: '0 0 20px rgba(59, 130, 246, 0.4)' }}>{Number(results[0].result).toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
              <div style={{ flex: 1, minHeight: 0, marginTop: '24px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: chartInfo.isSim ? '50%' : '100%', minHeight: chartInfo.isSim ? '150px' : '100%' }}>
                  {renderChart()}
                </div>
                {chartInfo.isSim && (
                  <div style={{ flex: 1, overflowY: 'auto', marginTop: '16px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                          {Object.keys(results[0]).map(k => <th key={k} style={{ padding: '8px', textAlign: 'left', color: 'var(--text-muted)' }}>{k}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((row, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            {Object.keys(results[0]).map(k => <td key={k} style={{ padding: '8px' }}>{row[k]}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )
        ) : (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center' }}>
            Run a verification or simulation to view results
          </div>
        )}
      </div>
    </div>
  );
}
"""
with open(f'{components_dir}/ResultsPanel.tsx', 'w') as f: f.write(results_code)

app_code = """import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import EditorPanel from './components/EditorPanel';
import ConfigPanel from './components/ConfigPanel';
import ResultsPanel from './components/ResultsPanel';
import './App.css';

function AppContent() {
  return (
    <div className="app-container">
      <Sidebar />
      <EditorPanel />
      <div className="glass-panel right-panel animate-fade-in" style={{ animationDelay: '0.3s', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <ConfigPanel />
        <ResultsPanel />
      </div>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
"""
with open('src/App.tsx', 'w') as f: f.write(app_code)
