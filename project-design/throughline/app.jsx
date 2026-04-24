// Throughline app
const { useState, useEffect, useMemo, useCallback } = React;

const ACCENTS = {
  indigo: { a:'oklch(0.45 0.14 270)', soft:'oklch(0.93 0.04 270)', ink:'oklch(0.32 0.12 270)',
            dA:'oklch(0.72 0.11 270)', dSoft:'oklch(0.28 0.06 270)', dInk:'oklch(0.85 0.12 270)' },
  clay:   { a:'oklch(0.55 0.12 40)', soft:'oklch(0.94 0.03 40)', ink:'oklch(0.4 0.1 40)',
            dA:'oklch(0.75 0.1 40)', dSoft:'oklch(0.3 0.06 40)', dInk:'oklch(0.85 0.1 40)' },
  moss:   { a:'oklch(0.48 0.1 150)', soft:'oklch(0.93 0.03 150)', ink:'oklch(0.35 0.08 150)',
            dA:'oklch(0.72 0.09 150)', dSoft:'oklch(0.28 0.05 150)', dInk:'oklch(0.85 0.08 150)' },
  ink:    { a:'oklch(0.25 0.02 260)', soft:'oklch(0.9 0.01 260)', ink:'oklch(0.2 0.02 260)',
            dA:'oklch(0.85 0.02 260)', dSoft:'oklch(0.3 0.02 260)', dInk:'oklch(0.92 0.02 260)' },
  rose:   { a:'oklch(0.55 0.14 10)', soft:'oklch(0.94 0.04 10)', ink:'oklch(0.4 0.11 10)',
            dA:'oklch(0.75 0.11 10)', dSoft:'oklch(0.3 0.06 10)', dInk:'oklch(0.85 0.11 10)' },
};

const FONTS = {
  editorial: { display: '"Fraunces", "Source Serif 4", Georgia, serif', body: '"Inter", system-ui, sans-serif' },
  sans:      { display: '"Inter", system-ui, sans-serif',                body: '"Inter", system-ui, sans-serif' },
  serif:     { display: '"Fraunces", Georgia, serif',                    body: '"Source Serif 4", Georgia, serif' },
};

function applyTweaks(t) {
  const root = document.documentElement;
  root.dataset.theme = t.theme;
  root.dataset.layout = t.layout;
  root.dataset.density = t.density;
  root.dataset.entry = t.entry;

  const acc = ACCENTS[t.accent] || ACCENTS.indigo;
  const isDark = t.theme === 'dark';
  root.style.setProperty('--accent', isDark ? acc.dA : acc.a);
  root.style.setProperty('--accent-soft', isDark ? acc.dSoft : acc.soft);
  root.style.setProperty('--accent-ink', isDark ? acc.dInk : acc.ink);

  const f = FONTS[t.font] || FONTS.editorial;
  root.style.setProperty('--f-display', f.display);
  root.style.setProperty('--f-body', f.body);
}

function App() {
  const { GOALS, PROJECTS, ENTRIES, MINIMAP } = window.THROUGHLINE_DATA;

  const [tweaks, setTweaks] = useState(() => {
    try {
      const saved = localStorage.getItem('throughline-tweaks');
      if (saved) return { ...window.TWEAKS, ...JSON.parse(saved) };
    } catch (e) {}
    return { ...window.TWEAKS };
  });
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [goals, setGoals] = useState(GOALS);
  const [projects, setProjects] = useState(PROJECTS);
  const [entries, setEntries] = useState(ENTRIES);
  const [filter, setFilter] = useState('all');
  const [contextFilter, setContextFilter] = useState(null); // {type, id, label}
  const [reviewOpen, setReviewOpen] = useState(false);
  const [view, setView] = useState('feed');
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerKind, setComposerKind] = useState('goal');

  // apply tweaks to DOM + persist
  useEffect(() => {
    applyTweaks(tweaks);
    localStorage.setItem('throughline-tweaks', JSON.stringify(tweaks));
    if (editMode) {
      window.parent?.postMessage({type: '__edit_mode_set_keys', edits: tweaks}, '*');
    }
  }, [tweaks, editMode]);

  // edit mode contract
  useEffect(() => {
    function onMsg(e) {
      if (e.data?.type === '__activate_edit_mode') { setEditMode(true); setTweaksOpen(true); }
      if (e.data?.type === '__deactivate_edit_mode') { setEditMode(false); setTweaksOpen(false); }
    }
    window.addEventListener('message', onMsg);
    window.parent?.postMessage({type: '__edit_mode_available'}, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const setTweak = (k, v) => setTweaks(t => ({ ...t, [k]: v }));

  function openComposer(kind) {
    setComposerKind(kind);
    setComposerOpen(true);
  }

  function handleComposerSave({ kind, name }) {
    if (kind === 'goal') {
      setGoals(prev => [...prev, { id: 'g-' + Date.now(), name, color: 'var(--accent)' }]);
    } else {
      setProjects(prev => [...prev, { id: 'p-' + Date.now(), name, tag: name.toLowerCase().replace(/\s+/g, '-') }]);
    }
  }

  function addEntry(e) {
    const id = 'e-' + Date.now();
    setEntries(prev => [{ id, created_at: new Date().toISOString(), starred: false, ...e }, ...prev]);
  }
  function toggleStar(id) {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, starred: !e.starred } : e));
  }

  function onSlotClick(type, id) {
    const src = type === 'goal' ? goals.find(g => g.id === id) : projects.find(p => p.id === id);
    if (!src) return;
    if (contextFilter && contextFilter.type === type && contextFilter.id === id) {
      setContextFilter(null);
    } else {
      setContextFilter({ type, id, label: src.name });
    }
  }

  const filtered = useMemo(() => {
    let list = entries;
    if (contextFilter) {
      list = list.filter(e => {
        if (e.isPivot) return false;
        if (contextFilter.type === 'goal') return (e.goals||[]).includes(contextFilter.id);
        if (contextFilter.type === 'project') return (e.projects||[]).includes(contextFilter.id);
        if (contextFilter.type === 'tag') return (e.tags||[]).includes(contextFilter.id);
        return true;
      });
    }
    if (filter === 'starred') list = list.filter(e => e.starred && !e.isPivot);
    if (filter === 'links') list = list.filter(e => e.link || (e.content && /https?:\/\//.test(e.content)));
    if (filter === 'code') list = list.filter(e => e.isCode);
    return list;
  }, [entries, filter, contextFilter]);

  // Group by day
  const grouped = useMemo(() => {
    const groups = [];
    let cur = null;
    for (const e of filtered) {
      const day = formatDay(e.created_at);
      if (!cur || cur.day !== day) {
        cur = { day, items: [] };
        groups.push(cur);
      }
      cur.items.push(e);
    }
    return groups;
  }, [filtered]);

  function applyReview(decisions) {
    setEntries(prev => prev.map(e => {
      const d = decisions[e.id];
      if (!d) return e;
      if (d === 'star') return { ...e, starred: true };
      if (d === 'archive') return { ...e, archived: true };
      return e;
    }));
  }

  const activeGreeting = (() => {
    const h = new Date().getHours();
    if (h < 5) return 'Late night';
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Afternoon';
    return 'Evening';
  })();

  return (
    <>
      <Sidebar goals={goals} projects={projects} activeFilter={contextFilter}
               onSlotClick={onSlotClick} onStartReview={() => setReviewOpen(true)}
               onOpenComposer={openComposer} />
      <Masthead onOpenTweaks={() => setTweaksOpen(true)} onView={setView} view={view} />

      {view === 'feed' && (
        <>
          <BigLineBar goals={goals} projects={projects} activeFilter={contextFilter}
                      onSlotClick={onSlotClick} onStartReview={() => setReviewOpen(true)} />
          <Minimap data={MINIMAP} />
          <main className="main" data-screen-label="Feed">
            <div className="dateline">
              <span>{new Date().toLocaleDateString([], {weekday:'long', month:'long', day:'numeric', year:'numeric'}).toUpperCase()}</span>
              <span className="rule" />
              <span>Week {Math.ceil((new Date().getDate()) / 7)} · {entries.filter(e=>!e.isPivot).length} captures</span>
            </div>
            <h1 className="greeting">
              {activeGreeting}, Alex. <em>What's worth keeping?</em>
            </h1>

            <Capture goals={goals} projects={projects} onAdd={addEntry} />

            <FilterBar filter={filter} setFilter={setFilter} count={filtered.filter(e=>!e.isPivot).length} />

            {contextFilter && (
              <div className="filter-context">
                <span>Filtering to</span>
                <strong style={{fontWeight:600}}>
                  {contextFilter.type === 'goal' && '◎ '}
                  {contextFilter.label}
                </strong>
                <span style={{opacity:.7, marginLeft:4, fontFamily:'var(--f-mono)', fontSize:11}}>
                  {filtered.filter(e=>!e.isPivot).length} entries
                </span>
                <button className="close" onClick={() => setContextFilter(null)}>×</button>
              </div>
            )}

            <div className="feed">
              {grouped.length === 0 && (
                <div className="empty">Nothing here yet. The feed is listening.</div>
              )}
              {grouped.map(g => (
                <div key={g.day}>
                  <div className="day-divider">
                    <span>{g.day}</span>
                    <span className="rule" />
                    <span>{g.items.filter(e=>!e.isPivot).length}</span>
                  </div>
                  {g.items.map(e => (
                    e.isPivot ? <PivotMarker key={e.id} pivot={e} /> :
                    <Entry key={e.id} entry={e} goals={goals} projects={projects}
                           onStar={toggleStar} onFilter={setContextFilter} />
                  ))}
                </div>
              ))}
            </div>
          </main>
        </>
      )}

      {view === 'threads' && (
        <main className="main" style={{maxWidth:'none', padding:0}} data-screen-label="Threads">
          <ThreadsView />
        </main>
      )}

      {view === 'map' && (
        <main className="main" style={{maxWidth:'none', padding:0}} data-screen-label="Timeline">
          <TimelineView />
        </main>
      )}

      {reviewOpen && (
        <WeeklyReview entries={entries} goals={goals} projects={projects}
                      onClose={() => setReviewOpen(false)} onApply={applyReview} />
      )}

      <ComposerModal
        open={composerOpen}
        kind={composerKind}
        goals={goals}
        onClose={() => setComposerOpen(false)}
        onSave={handleComposerSave}
      />

      <TweaksPanel open={tweaksOpen} onClose={() => setTweaksOpen(false)}
                   tweaks={tweaks} setTweak={setTweak} />

      {!tweaksOpen && (
        <button onClick={() => setTweaksOpen(true)}
          style={{position:'fixed', bottom:20, right:20, zIndex:40,
            padding:'10px 14px', borderRadius:999, border:'1px solid var(--rule-strong)',
            background:'var(--card)', color:'var(--ink-2)', fontSize:12, cursor:'pointer',
            boxShadow:'0 8px 20px -8px rgba(0,0,0,0.15)', display:'inline-flex', gap:6, alignItems:'center'}}>
          <Icon.Settings /> Tweaks
        </button>
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
