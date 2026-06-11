import { Play } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function ConfigPanel() {
  const {
    activeModel, isLoading,
    verificationMode, property, constants, param, startVal, endVal, stepVal, useParam2, param2, startVal2, endVal2, stepVal2, engine, simSteps, prismPath,
    setVerificationMode, setProperty, setConstants, setParam, setStartVal, setEndVal, setStepVal, setUseParam2, setParam2, setStartVal2, setEndVal2, setStepVal2, setEngine, setSimSteps, setPrismPath,
    handleVerify, handleSimulate, handleCancel
  } = useAppContext();

  return (
    <div className="panel-section config-panel animate-fade-in" style={{ animationDelay: '0.4s', padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
        <h3 style={{ marginTop: 0 }}>Configuration</h3>
      
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
      </div>
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', flexShrink: 0 }}>
        {isLoading ? (
          <button className="btn" style={{ width: '100%', backgroundColor: 'var(--danger)', color: 'white' }} onClick={handleCancel}>Stop Verification</button>
        ) : (
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={verificationMode === 'simulate' ? handleSimulate : handleVerify} disabled={!activeModel}>
            <Play size={16} /> {verificationMode === 'simulate' ? 'Run Simulation' : 'Run Verification'}
          </button>
        )}
      </div>
    </div>
  );
}
