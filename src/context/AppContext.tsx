import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const API_URL = '/api';

interface AppContextType {
  models: any[];
  activeModel: any | null;
  code: string;
  results: any[];
  cmdOutput: string;
  isLoading: boolean;
  
  verificationMode: string;
  property: string;
  constants: string;
  param: string;
  startVal: string;
  endVal: string;
  stepVal: string;
  useParam2: boolean;
  param2: string;
  startVal2: string;
  endVal2: string;
  stepVal2: string;
  engine: string;
  simSteps: string;
  prismPath: string;

  setVerificationMode: (v: string) => void;
  setProperty: (v: string) => void;
  setConstants: (v: string) => void;
  setParam: (v: string) => void;
  setStartVal: (v: string) => void;
  setEndVal: (v: string) => void;
  setStepVal: (v: string) => void;
  setUseParam2: (v: boolean) => void;
  setParam2: (v: string) => void;
  setStartVal2: (v: string) => void;
  setEndVal2: (v: string) => void;
  setStepVal2: (v: string) => void;
  setEngine: (v: string) => void;
  setSimSteps: (v: string) => void;
  setPrismPath: (v: string) => void;
  setCode: (v: string) => void;

  fetchModels: () => Promise<void>;
  selectModel: (model: any) => void;
  handleCreate: () => Promise<void>;
  handleSave: () => Promise<void>;
  handleDelete: (id: string, e: any) => Promise<void>;
  handleVerify: () => Promise<void>;
  handleSimulate: () => Promise<void>;
  handleSyntaxCheck: () => Promise<void>;
  handleCancel: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [models, setModels] = useState<any[]>([]);
  const [activeModel, setActiveModel] = useState<any | null>(null);
  const [code, setCode] = useState('');
  
  const [verificationMode, setVerificationMode] = useState('fixed');
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
  const [engine, setEngine] = useState('auto');
  const [simSteps, setSimSteps] = useState('20');
  const [prismPath, setPrismPath] = useState('/opt/prism/bin/prism');
  
  const [results, setResults] = useState<any[]>([]);
  const [cmdOutput, setCmdOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchModels = async () => {
    try {
      const res = await fetch(`${API_URL}/models`);
      const data = await res.json();
      setModels(data);
    } catch (err) {
      console.error('Failed to fetch models', err);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const selectModel = (model: any) => {
    setActiveModel(model);
    setCode(model.content);
    setResults([]);
    setCmdOutput('');
    
    if (model.props) setProperty(model.props);
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
      if (model.config.engine !== undefined) setEngine(model.config.engine);
      if (model.config.simSteps !== undefined) setSimSteps(model.config.simSteps);
    }
  };

  const handleCreate = async () => {
    const name = prompt('Enter model name:');
    if (!name) return;
    const config = { verificationMode, constants, param, startVal, endVal, stepVal, useParam2, param2, startVal2, endVal2, stepVal2, prismPath, engine, simSteps };
    const newModel = { id: name, content: '// New PRISM model\\n\\npta\\n\\nmodule M1\\n\\nendmodule', props: property, config };
    try {
      await fetch(`${API_URL}/models`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newModel) });
      await fetchModels();
      selectModel(newModel);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (!activeModel) return;
    try {
      const config = { verificationMode, constants, param, startVal, endVal, stepVal, useParam2, param2, startVal2, endVal2, stepVal2, prismPath, engine, simSteps };
      await fetch(`${API_URL}/models/${activeModel.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: code, props: property, config }) });
      await fetchModels();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, e: any) => {
    e.stopPropagation();
    if (!confirm('Delete this model?')) return;
    try {
      await fetch(`${API_URL}/models/${id}`, { method: 'DELETE' });
      if (activeModel?.id === id) { setActiveModel(null); setCode(''); setResults([]); setCmdOutput(''); }
      await fetchModels();
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
      const sweepParams = verificationMode === 'sweep' ? [
        { param, start: parseFloat(startVal), end: parseFloat(endVal), step: parseFloat(stepVal) },
        useParam2 ? { param: param2, start: parseFloat(startVal2), end: parseFloat(endVal2), step: parseFloat(stepVal2) } : null
      ].filter(Boolean) : [];
      const res = await fetch(`${API_URL}/check-syntax`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ modelId: activeModel.id, prismPath, constants, sweepParams }) });
      const data = await res.json();
      if (data.success) {
        setResults([{ result: 0 }]);
        setCmdOutput(data.stdout + '\\nSyntax check passed!');
      } else {
        setResults([{ error: 'Syntax Error', details: data.error, stdout: data.stdout, stderr: data.stderr }]);
        setCmdOutput(data.stdout || data.error);
      }
    } catch (err: any) {
      setResults([{ error: 'Network Error', details: err.message, stderr: '' }]);
    }
    setIsLoading(false);
  };

  const handleSimulate = async () => {
    if (!activeModel) return;
    await handleSave();
    setIsLoading(true);
    setResults([]);
    setCmdOutput('');
    try {
      const res = await fetch(`${API_URL}/simulate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ modelId: activeModel.id, constants, prismPath, steps: parseInt(simSteps, 10) }) });
      const data = await res.json();
      if (data.success) {
        setResults(data.trace || []);
        setCmdOutput(data.cmd || '');
      } else {
        setResults([{ error: data.error, details: data.details, stdout: data.stdout, stderr: data.stderr }]);
        setCmdOutput(data.cmd || '');
      }
    } catch (err: any) {
      setResults([{ error: 'Network Error', details: err.message, stderr: '' }]);
    }
    setIsLoading(false);
  };

  const handleVerify = async () => {
    if (!activeModel) return;
    await handleSave();
    setIsLoading(true);
    setResults([]);
    setCmdOutput('');
    try {
      const sweepParams = verificationMode === 'sweep' ? [
        { param, start: parseFloat(startVal), end: parseFloat(endVal), step: parseFloat(stepVal) },
        useParam2 ? { param: param2, start: parseFloat(startVal2), end: parseFloat(endVal2), step: parseFloat(stepVal2) } : null
      ].filter(Boolean) : [];
      const res = await fetch(`${API_URL}/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ modelId: activeModel.id, property, constants, prismPath, engine, sweepParams }) });
      const data = await res.json();
      if (data.success) {
        setResults(data.results || []);
        setCmdOutput(data.cmd || '');
      } else {
        setResults([{ error: data.error, details: data.details, stdout: data.stdout, stderr: data.stderr }]);
        setCmdOutput(data.cmd || '');
      }
    } catch (err: any) {
      setResults([{ error: 'Network Error', details: err.message, stderr: '' }]);
    }
    setIsLoading(false);
  };

  const handleCancel = async () => {
    try {
      await fetch(`${API_URL}/cancel`, { method: 'POST' });
      setIsLoading(false);
      setResults([{ result: 'Cancelled' }]);
    } catch (err) {
      console.error('Failed to cancel', err);
    }
  };

  return (
    <AppContext.Provider value={{
      models, activeModel, code, results, cmdOutput, isLoading,
      verificationMode, property, constants, param, startVal, endVal, stepVal, useParam2, param2, startVal2, endVal2, stepVal2, engine, simSteps, prismPath,
      setVerificationMode, setProperty, setConstants, setParam, setStartVal, setEndVal, setStepVal, setUseParam2, setParam2, setStartVal2, setEndVal2, setStepVal2, setEngine, setSimSteps, setPrismPath, setCode,
      fetchModels, selectModel, handleCreate, handleSave, handleDelete, handleVerify, handleSimulate, handleSyntaxCheck, handleCancel
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};
