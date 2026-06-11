import Editor from '@monaco-editor/react';
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
