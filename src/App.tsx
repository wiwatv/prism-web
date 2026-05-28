import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Save, Plus, Trash2, FileCode2, BarChart2, Maximize2, X } from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Label
} from 'recharts';

const API_URL = 'http://localhost:3001/api';

export default function App() {
  const [models, setModels] = useState<any[]>([]);
  const [activeModel, setActiveModel] = useState<any>(null);
  const [code, setCode] = useState('');
  
  const [verificationMode, setVerificationMode] = useState('fixed'); // 'fixed' | 'sweep'
  const [property, setProperty] = useState('Pmax=? [ F state=2 ]');
  const [constants, setConstants] = useState('');
  const [param, setParam] = useState('r');
  const [startVal, setStartVal] = useState('0.1');
  const [endVal, setEndVal] = useState('0.9');
  const [stepVal, setStepVal] = useState('0.1');
  
  const [useParam2, setUseParam2] = useState(false);
  const [param2, setParam2] = useState('fail_prob');
  const [startVal2, setStartVal2] = useState('0.1');
  const [endVal2, setEndVal2] = useState('0.3');
  const [stepVal2, setStepVal2] = useState('0.1');
  
  const [isGraphExpanded, setIsGraphExpanded] = useState(false);
  
  const [prismPath, setPrismPath] = useState('/opt/prism/bin/prism');
  
  const [results, setResults] = useState<any[]>([]);
  const [cmdOutput, setCmdOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const res = await fetch(`${API_URL}/models`);
      const data = await res.json();
      setModels(data);
      if (data.length > 0 && !activeModel) {
        selectModel(data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch models', err);
    }
  };

  const selectModel = (model: any) => {
    setActiveModel(model);
    setCode(model.content);
    if (model.props) {
      setProperty(model.props.trim());
    } else {
      setProperty('Pmax=? [ F state=2 ]');
    }
    
    if (model.config) {
      if (model.config.verificationMode) setVerificationMode(model.config.verificationMode);
      if (model.config.constants !== undefined) setConstants(model.config.constants);
      if (model.config.param !== undefined) setParam(model.config.param);
      if (model.config.startVal !== undefined) setStartVal(model.config.startVal);
      if (model.config.endVal !== undefined) setEndVal(model.config.endVal);
      if (model.config.stepVal !== undefined) setStepVal(model.config.stepVal);
      if (model.config.useParam2 !== undefined) setUseParam2(model.config.useParam2);
      if (model.config.param2 !== undefined) setParam2(model.config.param2);
      if (model.config.startVal2 !== undefined) setStartVal2(model.config.startVal2);
      if (model.config.endVal2 !== undefined) setEndVal2(model.config.endVal2);
      if (model.config.stepVal2 !== undefined) setStepVal2(model.config.stepVal2);
      if (model.config.prismPath !== undefined) setPrismPath(model.config.prismPath);
    }
  };

  const handleCreate = async () => {
    const name = prompt('Enter model name:');
    if (!name) return;
    
    const config = {
      verificationMode, constants, param, startVal, endVal, stepVal,
      useParam2, param2, startVal2, endVal2, stepVal2, prismPath
    };
    
    const newModel = { id: name, content: '// New PRISM model\n\npta\n\nmodule M1\n\nendmodule', props: property, config };
    
    try {
      await fetch(`${API_URL}/models`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newModel)
      });
      fetchModels();
      selectModel(newModel);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (!activeModel) return;
    try {
      const config = {
        verificationMode, constants, param, startVal, endVal, stepVal,
        useParam2, param2, startVal2, endVal2, stepVal2, prismPath
      };
      await fetch(`${API_URL}/models/${activeModel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: code, props: property, config })
      });
      fetchModels();
      // Optionally show a success toast here
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (e: any, id: any) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this model?')) return;
    try {
      await fetch(`${API_URL}/models/${id}`, {
        method: 'DELETE'
      });
      if (activeModel?.id === id) {
        setActiveModel(null);
        setCode('');
      }
      fetchModels();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSyntaxCheck = async () => {
    if (!activeModel) return;
    await handleSave();
    
    setIsLoading(true);
    setResults([]);
    setCmdOutput('');
    try {
      const res = await fetch(`${API_URL}/check-syntax`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: activeModel.id,
          prismPath: prismPath,
          constants: constants,
          sweepParams: verificationMode === 'sweep' ? [
            { param, start: parseFloat(startVal), end: parseFloat(endVal), step: parseFloat(stepVal) },
            useParam2 ? { param: param2, start: parseFloat(startVal2), end: parseFloat(endVal2), step: parseFloat(stepVal2) } : null
          ].filter(Boolean) : []
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Syntax check passed successfully!');
        setCmdOutput(data.stdout || '');
      } else {
        setResults([{ error: 'Syntax Error', details: data.error, stderr: data.stdout }]);
        setCmdOutput(data.cmd || '');
      }
    } catch (err: any) {
      console.error(err);
      setResults([{ error: 'Network Error', details: err.message, stderr: '' }]);
    }
    setIsLoading(false);
  };

  const handleVerify = async () => {
    if (!activeModel) return;
    // ensure saved before verifying
    await handleSave();
    
    setIsLoading(true);
    setResults([]);
    setCmdOutput('');
    try {
      const res = await fetch(`${API_URL}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: activeModel.id,
          property: property,
          constants: constants,
          prismPath: prismPath,
          sweepParams: verificationMode === 'sweep' ? [
            { param, start: parseFloat(startVal), end: parseFloat(endVal), step: parseFloat(stepVal) },
            useParam2 ? { param: param2, start: parseFloat(startVal2), end: parseFloat(endVal2), step: parseFloat(stepVal2) } : null
          ].filter(Boolean) : []
        })
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.results || []);
        setCmdOutput(data.cmd || '');
      } else {
        setResults([{ error: data.error, details: data.details, stderr: data.stderr }]);
        setCmdOutput(data.cmd || '');
      }
    } catch (err: any) {
      console.error(err);
      setResults([{ error: 'Network Error', details: err.message, stderr: '' }]);
    }
    setIsLoading(false);
  };

  const handleCancel = async () => {
    try {
      await fetch(`${API_URL}/cancel`, { method: 'POST' });
      setIsLoading(false);
      setResults([{ result: 'Cancelled' }]);
      setCmdOutput('');
    } catch (err) {
      console.error('Failed to cancel', err);
    }
  };

  const getChartData = () => {
    if (!results || results.length === 0 || results[0].result !== undefined) return { data: [], lines: [] };
    
    // 1D Array
    if (!useParam2 || !results[0].hasOwnProperty(param2)) {
      return { data: results, lines: [] };
    }

    // 2D Array Pivot
    const grouped: any = {};
    const lineSet = new Set<string>();
    
    results.forEach((row: any) => {
      const xVal = row[param];
      const yVal = row[param2];
      const val = row.value;
      const lineKey = `${param2}=${yVal}`;
      
      if (!grouped[xVal]) grouped[xVal] = { [param]: xVal };
      grouped[xVal][lineKey] = val;
      lineSet.add(lineKey);
    });

    return { data: Object.values(grouped), lines: Array.from(lineSet).sort() };
  };

  const chartInfo = getChartData();
  const isMultiLine = useParam2 && chartInfo.lines.length > 0;

  const renderChart = () => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        {isMultiLine ? (
          <LineChart data={chartInfo.data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey={param} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }}>
              <Label value={`Primary Variable: ${param}`} position="insideBottom" offset={-15} fill="#94a3b8" fontSize={12} />
            </XAxis>
            <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }}>
              <Label value="Probability" angle={-90} position="insideLeft" fill="#94a3b8" fontSize={12} />
            </YAxis>
            <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} itemStyle={{ color: '#f8fafc' }} />
            <Legend verticalAlign="top" height={36}/>
            {chartInfo.lines.map((lineKey, idx) => {
              const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
              return (
                <Line 
                  key={lineKey} 
                  type="monotone" 
                  dataKey={lineKey} 
                  name={lineKey} 
                  stroke={colors[idx % colors.length]} 
                  strokeWidth={3} 
                  dot={false} 
                />
              );
            })}
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
            <XAxis dataKey={param} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }}>
              <Label value={`Sweep Variable: ${param}`} position="insideBottom" offset={-15} fill="#94a3b8" fontSize={12} />
            </XAxis>
            <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }}>
              <Label value="Probability" angle={-90} position="insideLeft" fill="#94a3b8" fontSize={12} />
            </YAxis>
            <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} itemStyle={{ color: '#f8fafc' }} />
            <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} name="Probability" />
          </AreaChart>
        )}
      </ResponsiveContainer>
    );
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="glass-panel sidebar animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="sidebar-header">
          <FileCode2 size={24} />
          <span>PRISM PTA</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3>Models</h3>
          <button className="btn-icon" onClick={handleCreate} title="New Model">
            <Plus size={18} />
          </button>
        </div>

        <ul className="model-list">
          {models.map(model => (
            <li 
              key={model.id} 
              className={`model-item ${activeModel?.id === model.id ? 'active' : ''}`}
              onClick={() => selectModel(model)}
            >
              <span>{model.name}</span>
              <button 
                className="btn-icon danger" 
                onClick={(e) => handleDelete(e, model.id)}
                style={{ padding: '4px' }}
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
          {models.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '20px' }}>
              No models found. Create one!
            </div>
          )}
        </ul>
      </div>

      {/* Main Editor */}
      <div className="glass-panel editor-container animate-fade-in" style={{ animationDelay: '0.2s' }}>
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
               defaultLanguage="plaintext"
               theme="vs-dark"
               value={code}
               onChange={(val) => setCode(val || '')}
               options={{
                 minimap: { enabled: false },
                 fontSize: 14,
                 fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                 padding: { top: 16 }
               }}
             />
          ) : (
             <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
               Select or create a model to start editing
             </div>
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div className="glass-panel config-panel animate-fade-in" style={{ animationDelay: '0.3s' }}>
        
        {/* Verification Config */}
        <div className="panel-section">
          <h3>Verification</h3>
          
          <div className="form-group">
            <label>PRISM Executable Path</label>
            <input 
              type="text" 
              className="input-field" 
              value={prismPath} 
              onChange={e => setPrismPath(e.target.value)} 
              placeholder='e.g., C:\prism\bin\prism.bat or simply prism.bat'
            />
          </div>

          <div className="form-group">
            <label>PCTL Property</label>
            <input 
              type="text" 
              className="input-field" 
              value={property} 
              onChange={e => setProperty(e.target.value)} 
              placeholder='e.g., Pmax=? [ F "success" ]'
            />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label>Verification Mode</label>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'normal' }}>
                <input 
                  type="radio" 
                  name="vmode" 
                  checked={verificationMode === 'fixed'} 
                  onChange={() => setVerificationMode('fixed')} 
                />
                Fixed Parameter
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'normal' }}>
                <input 
                  type="radio" 
                  name="vmode" 
                  checked={verificationMode === 'sweep'} 
                  onChange={() => setVerificationMode('sweep')} 
                />
                Parameter Sweep
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Fixed Constants (Optional)</label>
            <input 
              type="text" 
              className="input-field" 
              value={constants} 
              onChange={e => setConstants(e.target.value)} 
              placeholder='e.g., r=0.5, fail_prob=0.1'
            />
          </div>

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
                <input type="checkbox" checked={useParam2} onChange={e => setUseParam2(e.target.checked)} />
                Add Secondary Variable
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
            <button 
              className="btn" 
              style={{ width: '100%', marginTop: '8px', backgroundColor: 'var(--danger)', color: 'white' }}
              onClick={handleCancel}
            >
              Stop Verification
            </button>
          ) : (
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '8px' }}
              onClick={handleVerify}
              disabled={!activeModel}
            >
              <Play size={16} /> Run Verification
            </button>
          )}
        </div>

        {/* Results Chart */}
        <div className="panel-section" style={{ flex: 1 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={18} /> Results
          </h3>
          
          <div className="chart-container">
            {results.length > 0 ? (
              results[0].result === 'Cancelled' ? (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.2rem', color: 'var(--danger)', marginBottom: '8px' }}>Process Cancelled</span>
                </div>
              ) : results[0].error ? (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'flex-start', justifyContent: 'flex-start', padding: '10px', overflowY: 'auto', width: '100%' }}>
                  <span style={{ fontSize: '1.1rem', color: 'var(--danger)', marginBottom: '12px', fontWeight: 'bold' }}>{results[0].error}</span>
                  <div style={{ width: '100%', padding: '12px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '6px', fontSize: '0.85rem', color: '#ef4444', whiteSpace: 'pre-wrap', fontFamily: 'monospace', textAlign: 'left', flex: 1, overflowY: 'auto' }}>
                    {results[0].details && <div style={{marginBottom: '8px'}}>{results[0].details}</div>}
                    {results[0].stderr && <div style={{color: '#f8fafc'}}>Output/Stderr:\n{results[0].stderr}</div>}
                  </div>
                </div>
              ) : results.length === 1 || verificationMode === 'fixed' ? (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '8px' }}>PCTL Result</span>
                  <span style={{ fontSize: '3rem', fontWeight: 'bold', color: '#3b82f6', textShadow: '0 0 20px rgba(59, 130, 246, 0.4)' }}>
                    {Number(results[0].result).toFixed(2)}
                  </span>
                  {cmdOutput && (
                    <div style={{ marginTop: '24px', width: '100%', padding: '12px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '6px', fontSize: '0.85rem', color: '#94a3b8', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                      <div style={{ color: '#f8fafc', marginBottom: '4px', fontWeight: 'bold' }}>Executed Command:</div>
                      {cmdOutput}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
                  <button 
                    onClick={() => setIsGraphExpanded(true)}
                    className="btn-icon" 
                    style={{ position: 'absolute', top: 0, right: 0, zIndex: 10 }}
                    title="Expand Graph"
                  >
                    <Maximize2 size={18} />
                  </button>
                  <div style={{ flex: 1, minHeight: 0, marginTop: '24px' }}>
                    {renderChart()}
                  </div>
                  {cmdOutput && (
                    <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '6px', fontSize: '0.85rem', color: '#94a3b8', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                      <div style={{ color: '#f8fafc', marginBottom: '4px', fontWeight: 'bold' }}>Executed Command:</div>
                      {cmdOutput}
                    </div>
                  )}
                </div>
              )
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                {isLoading ? 'Running model...' : 'No results to display'}
              </div>
            )}
          </div>
        </div>

      </div>
      {/* Expanded Graph Modal */}
      {isGraphExpanded && (
        <div className="modal-overlay" onClick={() => setIsGraphExpanded(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsGraphExpanded(false)}>
              <X size={24} />
            </button>
            <h3 style={{ marginBottom: '16px', color: 'var(--text-main)' }}>Parameter Sweep Analysis</h3>
            <div style={{ flex: 1, minHeight: 0, width: '100%', paddingRight: '20px' }}>
              {renderChart()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
