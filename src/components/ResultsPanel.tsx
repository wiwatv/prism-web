import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { BarChart2, Download, Maximize2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, Label, Brush } from 'recharts';
import { useAppContext } from '../context/AppContext';

const NewWindow = ({ children, onClose, title }: { children: React.ReactNode, onClose: () => void, title: string }) => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const newWindow = useRef<Window | null>(null);

  useEffect(() => {
    newWindow.current = window.open('', '', 'width=800,height=600,left=200,top=200');
    if (!newWindow.current) return;
    
    const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
    styles.forEach(styleSheet => {
      if (newWindow.current) newWindow.current.document.head.appendChild(styleSheet.cloneNode(true));
    });

    newWindow.current.document.body.style.margin = '0';
    newWindow.current.document.body.style.backgroundColor = '#0f172a';
    newWindow.current.document.body.style.color = 'white';
    newWindow.current.document.body.style.fontFamily = "'Inter', system-ui, sans-serif";
    newWindow.current.document.title = title;

    const div = newWindow.current.document.createElement('div');
    div.style.height = '100vh';
    div.style.display = 'flex';
    div.style.flexDirection = 'column';
    div.style.padding = '20px';
    div.style.boxSizing = 'border-box';
    
    newWindow.current.document.body.appendChild(div);
    setContainer(div);

    const handleClose = () => onClose();
    newWindow.current.addEventListener('beforeunload', handleClose);

    return () => {
      if (newWindow.current) {
        newWindow.current.removeEventListener('beforeunload', handleClose);
        newWindow.current.close();
      }
    };
  }, []);

  return container ? createPortal(children, container) : null;
};

export default function ResultsPanel() {
  const { results, cmdOutput, param, useParam2, param2, activeModel, verificationMode } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    let csvContent = headers.join(',') + '\n';
    chartInfo.data.forEach((row: any) => {
      csvContent += headers.map(h => row[h] !== undefined ? row[h] : '').join(',') + '\n';
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
            <Brush dataKey={xKey} height={30} stroke="#3b82f6" fill="rgba(30, 41, 59, 0.9)" travellerWidth={10} />
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
            <Brush dataKey={xKey} height={30} stroke="#3b82f6" fill="rgba(30, 41, 59, 0.9)" travellerWidth={10} />
          </AreaChart>
        )}
      </ResponsiveContainer>
    );
  };

  return (
    <div className="panel-section" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 0 }}><BarChart2 size={18} /> Results</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          {results.length > 0 && chartInfo.data.length > 0 && (
            <button className="btn btn-outline" onClick={() => setIsModalOpen(true)} style={{ padding: '6px 10px', fontSize: '0.8rem' }}><Maximize2 size={14} /> Fullscreen</button>
          )}
          {results.length > 0 && !results[0].error && (
            <button className="btn btn-outline" onClick={exportCSV} style={{ padding: '6px 10px', fontSize: '0.8rem' }}><Download size={14} /> Export CSV</button>
          )}
        </div>
      </div>
      
      <div style={{ backgroundColor: '#1e293b', padding: '8px', fontSize: '10px', overflow: 'auto', maxHeight: '100px' }}>
        DEBUG: param={param}, results.length={results.length}, firstResult={JSON.stringify(results[0])}
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
                <span style={{ fontSize: '3rem', fontWeight: 'bold', color: '#3b82f6', textShadow: '0 0 20px rgba(59, 130, 246, 0.4)' }}>
                  {typeof results[0].result === 'number' ? Number(results[0].result).toFixed(5) : String(results[0].result)}
                </span>
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
        ) : cmdOutput ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
            <div style={{ color: 'var(--warning)', marginBottom: '8px', fontWeight: 'bold', padding: '16px 16px 0 16px' }}>
              No visual results could be generated. See PRISM terminal output below:
            </div>
            <pre style={{ margin: '16px', flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', overflow: 'auto', fontSize: '0.85rem', color: '#e2e8f0', whiteSpace: 'pre-wrap', border: '1px solid rgba(255,255,255,0.1)' }}>
              {cmdOutput}
            </pre>
          </div>
        ) : (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center' }}>
            Run a verification or simulation to view results
          </div>
        )}
      </div>

      {isModalOpen && (
        <NewWindow onClose={() => setIsModalOpen(false)} title="Expanded Result Graph">
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={18} /> Expanded Result Graph
          </h3>
          <div style={{ flex: 1, minHeight: 0, position: 'relative', height: 'calc(100vh - 80px)' }}>
            {renderChart()}
          </div>
        </NewWindow>
      )}
    </div>
  );
}
