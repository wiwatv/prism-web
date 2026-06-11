import { Plus, Trash2 } from 'lucide-react';
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
