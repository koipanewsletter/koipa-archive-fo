import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

export default function App() {
  const [nodes, setNodes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [doc, setDoc] = useState(null);
  const [loadingNodes, setLoadingNodes] = useState(true);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [err, setErr] = useState('');

  const loadNodes = async () => {
    setLoadingNodes(true);
    setErr('');

    const { data, error } = await supabase
      .from('nav_nodes')
      .select('id,title,sort_order,doc_id,node_type,is_visible')
      .eq('node_type', 'folder')
      .eq('is_visible', true)
      .order('sort_order', { ascending: true });

    if (error) {
      setErr(error.message);
      setNodes([]);
      setSelected(null);
    } else {
      setNodes(data ?? []);
      setSelected((prev) => prev ?? (data?.[0] ?? null));
    }

    setLoadingNodes(false);
  };

  const loadDoc = async (node) => {
    setDoc(null);
    if (!node?.doc_id) return;

    setLoadingDoc(true);
    setErr('');

    const { data, error } = await supabase
      .from('docs')
      .select('id,title,slug,status,content_html,updated_at')
      .eq('id', node.doc_id)
      .eq('status', 'published')
      .maybeSingle();

    if (error) setErr(error.message);
    else setDoc(data ?? null);

    setLoadingDoc(false);
  };

  useEffect(() => {
    loadNodes();
  }, []);

  useEffect(() => {
    if (selected) loadDoc(selected);
  }, [selected?.id]);

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Pretendard, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif' }}>
      <header style={styles.header}>
        <div style={styles.brand}>KOIPA Mexico IP Archive</div>
      </header>

      <div style={styles.body}>
        <aside style={styles.aside}>
          <div style={styles.asideTop}>
            <div style={styles.asideTitle}>메뉴</div>
            <button style={styles.btnSmall} onClick={loadNodes}>새로고침</button>
          </div>

          {loadingNodes ? (
            <div style={styles.muted}>불러오는 중...</div>
          ) : err ? (
            <div style={styles.error}>{err}</div>
          ) : nodes.length === 0 ? (
            <div style={styles.muted}>표시 가능한 메뉴가 없습니다.</div>
          ) : (
            <ul style={styles.list}>
              {nodes.map((n) => {
                const active = selected?.id === n.id;
                return (
                  <li key={n.id}>
                    <button onClick={() => setSelected(n)} style={{ ...styles.item, ...(active ? styles.itemActive : null) }}>
                      {n.title}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <main style={styles.main}>
          {!selected ? (
            <div style={styles.muted}>메뉴를 선택하세요.</div>
          ) : loadingDoc ? (
            <div style={styles.muted}>문서 불러오는 중...</div>
          ) : err ? (
            <div style={styles.error}>{err}</div>
          ) : !doc ? (
            <div style={styles.muted}>이 메뉴에 연결된 published 문서가 없어요.</div>
          ) : (
            <article>
              <h1 style={styles.h1}>{doc.title}</h1>
              <div style={styles.updated}>Updated: {new Date(doc.updated_at).toLocaleString()}</div>
              <div style={styles.content}>{renderContent(doc.content_html)}</div>
            </article>
          )}
        </main>
      </div>
    </div>
  );
}

function renderContent(content) {
  if (!content) return null;
  return <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{content}</div>;
}

const styles = {
  header: { height: 56, display: 'flex', alignItems: 'center', padding: '0 16px', borderBottom: '1px solid #E6E8F0' },
  brand: { fontWeight: 800 },
  body: { display: 'grid', gridTemplateColumns: '320px 1fr', minHeight: 'calc(100vh - 56px)' },
  aside: { borderRight: '1px solid #E6E8F0', padding: 16, background: '#FAFBFF' },
  asideTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  asideTitle: { fontWeight: 800 },
  btnSmall: { height: 28, padding: '0 10px', borderRadius: 8, border: '1px solid #D7DBE8', background: '#fff', fontSize: 12 },
  list: { listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 },
  item: { width: '100%', textAlign: 'left', border: '1px solid #E6E8F0', background: '#fff', borderRadius: 10, padding: 10, cursor: 'pointer' },
  itemActive: { border: '1px solid #003CB4' },
  main: { padding: 24 },
  h1: { margin: '0 0 8px', fontSize: 22 },
  updated: { fontSize: 12, color: '#6B7280', marginBottom: 16 },
  content: { fontSize: 15 },
  muted: { fontSize: 13, color: '#6B7280' },
  error: { fontSize: 13, color: '#B42318', background: '#FEF3F2', border: '1px solid #FEE4E2', padding: 10, borderRadius: 10 },
};
