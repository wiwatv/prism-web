import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import EditorPanel from './components/EditorPanel';
import ConfigPanel from './components/ConfigPanel';
import ResultsPanel from './components/ResultsPanel';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

function AppContent() {
  return (
    <div className="app-container">
      <Sidebar />
      <EditorPanel />
      <div className="glass-panel right-panel animate-fade-in" style={{ animationDelay: '0.3s', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <ConfigPanel />
        <ErrorBoundary>
          <ResultsPanel />
        </ErrorBoundary>
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
