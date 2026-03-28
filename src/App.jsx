import { useState, useEffect } from 'react';
import Header from './components/Header';
import IngestPage from './components/IngestPage';
import QueryPage from './components/QueryPage';
import DocumentsPage from './components/DocumentsPage';
import MetadataPage from './components/MetadataPage';
import { listDocuments } from './api/nexvec';

console.log('App.jsx loaded');

const TAB_SIDEBAR = {
  Ingest:    0,
  Documents: 1,
  Query:     2,
  Metadata:  3,
};

function StatusBar({ stats, loading }) {
  const fmt = (n) => (typeof n === 'number' ? n.toLocaleString() : (n ?? '—'));
  return (
    <div className="status-bar">
      <div className="stat">
        <div className="stat-num">{fmt(stats?.documents)}</div>
        <div className="stat-lbl">Active Resumes</div>
      </div>
      <div className="stat-div" />
      <div className="stat">
        <div className="stat-num">{loading ? '…' : 'Online'}</div>
        <div className="stat-lbl">Engine Status</div>
      </div>
    </div>
  );
}

const WORKSPACE = ['Ingest Resumes', 'Manage Documents', 'Semantic Search', 'Metadata Explorer'];
const WORKSPACE_TABS = ['Ingest', 'Documents', 'Query', 'Metadata'];

export default function App() {
  const [activeTab, setActiveTab]   = useState('Ingest');
  const [stats, setStats]           = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const refreshStats = () => {
    setStatsLoading(true);
    listDocuments()
      .then(data => {
        setStats({
          documents: Array.isArray(data.documents) ? data.documents.length : 0,
        });
      })
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  };

  useEffect(() => { refreshStats(); }, []);

  const activeWorkspaceIdx = TAB_SIDEBAR[activeTab];

  const Page = activeTab === 'Query'      ? QueryPage
             : activeTab === 'Documents' ? DocumentsPage
             : activeTab === 'Metadata'  ? MetadataPage
             :                             IngestPage;

  return (
    <>
      <Header />

      <div className="app-body">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-label">WORKSPACE</div>
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
        </aside>

        {/* Main content */}
        <main className="content">
          <div className="page-container">
            <Page onRefresh={refreshStats} />
            <StatusBar stats={stats} loading={statsLoading} />
          </div>
        </main>
      </div>
    </>
  );
}
