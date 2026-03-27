import { useState, useEffect } from 'react';
import Header from './components/Header';
import IngestPage from './components/IngestPage';
import QueryPage from './components/QueryPage';
import CollectionsPage from './components/CollectionsPage';
import { listKnowledgebases } from './api/nexvec';
import { parseKBList } from './api/utils';

const TAB_SIDEBAR = {
  Ingest:      0,
  Query:       2,
  Collections: 1,
};

function StatusBar({ stats, loading }) {
  const fmt = (n) => (typeof n === 'number' ? n.toLocaleString() : (n ?? '—'));
  return (
    <div className="status-bar">
      <div className="stat">
        <div className="stat-num">{fmt(stats?.collections)}</div>
        <div className="stat-lbl">Collections</div>
      </div>
      <div className="stat-div" />
      <div className="stat">
        <div className="stat-num">{fmt(stats?.total_vectors ?? stats?.vectors)}</div>
        <div className="stat-lbl">Vectors stored</div>
      </div>
      <div className="stat-div" />
      <div className="stat">
        <div className="stat-num">{fmt(stats?.total_documents ?? stats?.documents)}</div>
        <div className="stat-lbl">Documents</div>
      </div>
      <div className="stat-div" />
      <div className="stat">
        <div className="stat-num">{loading ? '…' : (stats?.uptime ?? 'Online')}</div>
        <div className="stat-lbl">Uptime</div>
      </div>
    </div>
  );
}

const WORKSPACE = ['Ingest Content', 'Knowledge Bases', 'Search & Query'];
const WORKSPACE_TABS = ['Ingest', 'Collections', 'Query'];

export default function App() {
  const [activeTab, setActiveTab]     = useState('Ingest');
  const [collections, setCollections] = useState([]);
  const [stats, setStats]             = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const refreshCollections = () => {
    setStatsLoading(true);
    listKnowledgebases()
      .then(data => {
        const list = parseKBList(data);
        setCollections(list);
        setStats({
          collections:     list.length,
          total_vectors:   list.reduce((s, c) => s + (c?.vector_count ?? c?.vectors ?? 0), 0),
          total_documents: list.reduce((s, c) => s + (c?.document_count ?? c?.documents ?? 0), 0),
          uptime:          'Online',
        });
      })
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  };

  useEffect(() => { refreshCollections(); }, []);

  const activeWorkspaceIdx = TAB_SIDEBAR[activeTab];

  const Page = activeTab === 'Query'       ? QueryPage
             : activeTab === 'Collections' ? CollectionsPage
             :                              IngestPage;

  return (
    <>
      <Header />

      <div className="app-body">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-label">Workspace</div>
          {WORKSPACE.map((item, i) => (
            <div
              key={item}
              className={`sidebar-item${activeWorkspaceIdx === i ? ' active' : ''}`}
              onClick={() => setActiveTab(WORKSPACE_TABS[i])}
            >
              <span className="sidebar-dot" />
              {item}
            </div>
          ))}

          <div className="sidebar-label">Collections</div>
          {collections.length === 0 ? (
            <div style={{ fontSize: 12, color: '#C0B9B2', padding: '6px 12px', fontStyle: 'italic' }}>
              No collections yet
            </div>
          ) : (
            collections.map(c => {
              const name = c?.name ?? c;
              return (
                <div
                  key={name}
                  className="sidebar-item"
                  onClick={() => setActiveTab('Collections')}
                  title={name}
                >
                  <span className="sidebar-dot" />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{name}</span>
                </div>
              );
            })
          )}

        </aside>

        {/* Main content — centered container with left/right gaps */}
        <main className="content">
          <div className="page-container">
            <Page onIngestSuccess={refreshCollections} />
            <StatusBar stats={stats} loading={statsLoading} />
          </div>
        </main>
      </div>
    </>
  );
}
