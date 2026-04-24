// Throughline components
const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ─── icons ───
const Icon = {
  Hash: (p) => <svg viewBox="0 0 16 16" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h10M3 10h10M6 3l-1 10M11 3l-1 10"/></svg>,
  Code: (p) => <svg viewBox="0 0 16 16" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 5L3 8l3 3M10 5l3 3-3 3"/></svg>,
  Link: (p) => <svg viewBox="0 0 16 16" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 9a3 3 0 004 0l2-2a3 3 0 10-4-4l-1 1M9 7a3 3 0 00-4 0l-2 2a3 3 0 004 4l1-1"/></svg>,
  Paperclip: (p) => <svg viewBox="0 0 16 16" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 7L8 12a3 3 0 01-4-4l5-5a2 2 0 013 3l-5 5a1 1 0 01-2-1l4-4"/></svg>,
  Star: (p) => <svg viewBox="0 0 16 16" width={p.size||12} height={p.size||12} fill={p.filled?'currentColor':'none'} stroke="currentColor" strokeWidth="1.4"><path d="M8 2l1.8 3.7 4 .6-3 2.8.8 4-3.6-2-3.6 2 .8-4-3-2.8 4-.6z"/></svg>,
  X: (p) => <svg viewBox="0 0 16 16" width={p.size||12} height={p.size||12} fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4l8 8M12 4l-8 8"/></svg>,
  Search: (p) => <svg viewBox="0 0 16 16" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="4.5"/><path d="M11 11l3 3"/></svg>,
  Settings: (p) => <svg viewBox="0 0 16 16" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="2"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.5 3.5l1.5 1.5M11 11l1.5 1.5M3.5 12.5L5 11M11 5l1.5-1.5"/></svg>,
};

// ─── Masthead ───
function Masthead({ onOpenTweaks, onView, view }) {
  return (
    <header className="masthead" data-screen-label="Masthead">
      <div className="masthead-inner">
        <div className="wordmark">
          <div className="glyph">T</div>
          <div className="name">Through<em>line</em></div>
        </div>
        <nav className="nav">
          <a href="#" className={view==='feed' ? 'active' : ''} onClick={(e)=>{e.preventDefault(); onView('feed');}}>Feed</a>
          <a href="#" className={view==='threads' ? 'active' : ''} onClick={(e)=>{e.preventDefault(); onView('threads');}}>Threads</a>
          <a href="#" className={view==='map' ? 'active' : ''} onClick={(e)=>{e.preventDefault(); onView('map');}}>Timeline</a>
          <span className="sep" />
          <a href="#" onClick={(e)=>{e.preventDefault(); onOpenTweaks();}}>
            <Icon.Settings /> <span style={{marginLeft:4}}>Tweaks</span>
          </a>
        </nav>
        <button className="me">
          <span>alex@throughline.co</span>
          <div className="avatar">AV</div>
        </button>
      </div>
    </header>
  );
}

// ─── Big Lines bar ───
function BigLineBar({ goals, projects, onSlotClick, onStartReview, activeFilter }) {
  return (
    <div className="bigline-bar" data-screen-label="Command Center">
      <div className="bigline-inner">
        <div>
          <div className="bigline-label">
            <span>The Big Lines</span>
            <span className="rule" />
            <span style={{opacity:.7}}>5 slots · click to edit · pivots are tracked</span>
          </div>
          <div className="bigline-grid">
            {goals.map((g,i) => (
              <div key={g.id} className={'slot goal ' + (activeFilter?.type==='goal' && activeFilter.id===g.id ? 'active' : '')}
                   onClick={() => onSlotClick('goal', g.id)}>
                <div className="slot-kind"><span className="dot" /> Life Goal 0{i+1}</div>
                <div className="slot-text">{g.name}</div>
              </div>
            ))}
            <div className="slot-divider" />
            {projects.map((p,i) => (
              <div key={p.id} className={'slot project ' + (activeFilter?.type==='project' && activeFilter.id===p.id ? 'active' : '')}
                   onClick={() => onSlotClick('project', p.id)}>
                <div className="slot-kind"><span className="dot" /> Project 0{i+1}</div>
                <div className="slot-text">{p.name}</div>
              </div>
            ))}
          </div>
        </div>
        <button className="review-btn" onClick={onStartReview}>
          Weekly review
          <span className="mono">12 · due Sun</span>
        </button>
      </div>
    </div>
  );
}

// ─── Capture hero ───
function Capture({ goals, projects, onAdd }) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [picker, setPicker] = useState(false);
  const [selGoals, setSelGoals] = useState([]);
  const [selProjects, setSelProjects] = useState([]);
  const [isCode, setIsCode] = useState(false);
  const ref = useRef(null);
  const pickerRef = useRef(null);

  useEffect(() => {
    function key(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); ref.current?.focus(); }
    }
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);

  useEffect(() => {
    if (!picker) return;
    function out(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setPicker(false);
    }
    document.addEventListener('mousedown', out);
    return () => document.removeEventListener('mousedown', out);
  }, [picker]);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 360) + 'px';
  }, [value]);

  const tags = useMemo(() => {
    const m = value.match(/(^|\s)#([a-z0-9_-]+)/gi) || [];
    return [...new Set(m.map(s => s.trim().slice(1)))];
  }, [value]);

  function submit() {
    if (!value.trim()) return;
    onAdd({
      content: value.trim(),
      goals: [...selGoals],
      projects: [...selProjects],
      tags,
      isCode,
    });
    setValue(''); setSelGoals([]); setSelProjects([]); setIsCode(false);
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey && (e.metaKey || e.ctrlKey || !e.shiftKey)) {
      // Enter saves (shift-enter = newline)
      e.preventDefault(); submit();
    }
    if (e.key === 'Escape') setPicker(false);
  }

  const selCount = selGoals.length + selProjects.length;

  return (
    <div className={'capture ' + (focused ? 'focused' : '')}
         onFocus={() => setFocused(true)} onBlur={(e) => {
           if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
         }}>
      <textarea
        ref={ref}
        className="capture-textarea"
        rows={2}
        placeholder="What's the throughline today?"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKey}
      />
      {(selCount > 0 || tags.length > 0) && (
        <div className="capture-chips">
          {goals.filter(g => selGoals.includes(g.id)).map(g => (
            <span key={g.id} className="chip selected">
              <span className="k">Goal</span> {g.name}
              <span className="x" onClick={() => setSelGoals(s => s.filter(i => i !== g.id))}><Icon.X size={8} /></span>
            </span>
          ))}
          {projects.filter(p => selProjects.includes(p.id)).map(p => (
            <span key={p.id} className="chip selected">
              <span className="k">Project</span> {p.name}
              <span className="x" onClick={() => setSelProjects(s => s.filter(i => i !== p.id))}><Icon.X size={8} /></span>
            </span>
          ))}
          {tags.map(t => <span key={t} className="chip">#{t}</span>)}
        </div>
      )}

      <div className="capture-toolbar">
        <div className="tool-left" ref={pickerRef} style={{position:'relative'}}>
          <button className="tool-btn" title="Link to goal / project" onClick={() => setPicker(v => !v)}>
            <Icon.Paperclip />
          </button>
          <button className={'tool-btn ' + (isCode ? 'active' : '')} title="Code block" onClick={() => setIsCode(v => !v)}>
            <Icon.Code />
          </button>
          <button className="tool-btn" title="Insert link">
            <Icon.Link />
          </button>
          <button className="tool-btn" title="Insert tag" onClick={() => {
            setValue(v => v + (v.endsWith(' ') || !v ? '#' : ' #'));
            ref.current?.focus();
          }}>
            <Icon.Hash />
          </button>

          {picker && (
            <div className="link-picker">
              <div className="group">Life Goals</div>
              {goals.map(g => (
                <button key={g.id} className={'link-option goal ' + (selGoals.includes(g.id) ? 'selected' : '')}
                        onClick={() => setSelGoals(s => s.includes(g.id) ? s.filter(i => i !== g.id) : [...s, g.id])}>
                  <span className="dot" />
                  <span style={{flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{g.name}</span>
                  <span className="check">✓</span>
                </button>
              ))}
              <div className="group" style={{borderTop:'1px solid var(--rule)', marginTop:4, paddingTop:8}}>Projects</div>
              {projects.map(p => (
                <button key={p.id} className={'link-option project ' + (selProjects.includes(p.id) ? 'selected' : '')}
                        onClick={() => setSelProjects(s => s.includes(p.id) ? s.filter(i => i !== p.id) : [...s, p.id])}>
                  <span className="dot" />
                  <span style={{flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{p.name}</span>
                  <span className="check">✓</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="tool-right">
          <span className="hint">
            <span className="kbd">⌘K</span> to focus · <span className="kbd">⏎</span> to save
          </span>
          <button className="save-btn" disabled={!value.trim()} onClick={submit}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Filter bar ───
function FilterBar({ filter, setFilter, count }) {
  return (
    <div className="filter-bar">
      <span className="h">Captures · {count}</span>
      <div className="pill-group">
        <button className={'pill ' + (filter==='all' ? 'active' : '')} onClick={() => setFilter('all')}>All</button>
        <button className={'pill ' + (filter==='starred' ? 'active' : '')} onClick={() => setFilter('starred')}>Starred</button>
        <button className={'pill ' + (filter==='links' ? 'active' : '')} onClick={() => setFilter('links')}>Links</button>
        <button className={'pill ' + (filter==='code' ? 'active' : '')} onClick={() => setFilter('code')}>Code</button>
      </div>
    </div>
  );
}

// ─── Entry ───
function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}
function formatDay(iso) {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now); today.setHours(0,0,0,0);
  const yest = new Date(today); yest.setDate(yest.getDate() - 1);
  const dd = new Date(d); dd.setHours(0,0,0,0);
  if (dd.getTime() === today.getTime()) return 'Today · ' + d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  if (dd.getTime() === yest.getTime()) return 'Yesterday · ' + d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

function renderContent(text) {
  // URLs and #tags rendered
  const parts = [];
  const re = /(https?:\/\/[^\s]+)|(#[a-z0-9_-]+)/gi;
  let last = 0, m, i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1]) parts.push(<a key={i++} href={m[1]} onClick={(e)=>e.preventDefault()}>{m[1]}</a>);
    else parts.push(<span key={i++} style={{color:'var(--ink-3)', fontFamily:'var(--f-mono)', fontSize:'0.88em'}}>{m[2]}</span>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function CodeBlock({ content }) {
  // strip fence
  const body = content.replace(/^```[a-z]*\n?/, '').replace(/```$/, '');
  return (
    <pre className="code-block"><code>{body}</code></pre>
  );
}

function Entry({ entry, goals, projects, onStar, onFilter }) {
  const goalObjs = (entry.goals || []).map(id => goals.find(g => g.id === id)).filter(Boolean);
  const projObjs = (entry.projects || []).map(id => projects.find(p => p.id === id)).filter(Boolean);
  const tags = entry.tags || [];

  return (
    <article className={'entry ' + (entry.starred ? 'starred' : '') + (entry.archived ? ' archived' : '')}>
      <span className="timestamp">{formatTime(entry.created_at)}</span>
      <span className="dot" />

      {(goalObjs.length > 0 || projObjs.length > 0 || tags.length > 0) && (
        <div className="meta">
          {goalObjs.map(g => (
            <span key={g.id} className="goal" onClick={() => onFilter({type:'goal', id:g.id, label:g.name})}>◎ {g.name}</span>
          ))}
          {projObjs.map(p => (
            <span key={p.id} className="project" onClick={() => onFilter({type:'project', id:p.id, label:p.name})}>{p.name}</span>
          ))}
          {tags.map(t => (
            <span key={t} className="tag" onClick={() => onFilter({type:'tag', id:t, label:'#'+t})}>#{t}</span>
          ))}
        </div>
      )}

      <div className="content">
        {entry.isCode ? <CodeBlock content={entry.content} /> : renderContent(entry.content)}
        {entry.link && (
          <div className="link-preview">
            <div className="thumb">link.preview</div>
            <div className="txt">
              <div className="h">{entry.link.title}</div>
              <div className="d">{entry.link.desc}</div>
              <div className="u">{entry.link.url}</div>
            </div>
          </div>
        )}
      </div>

      <div className="actions">
        <button className={'action star ' + (entry.starred ? 'on' : '')} onClick={() => onStar(entry.id)}>
          <Icon.Star filled={entry.starred} /> {entry.starred ? 'Starred' : 'Star'}
        </button>
        <button className="action">Promote ↑</button>
        <button className="action">Reply</button>
        <button className="action">Copy</button>
      </div>
    </article>
  );
}

function PivotMarker({ pivot }) {
  return (
    <div className="pivot">
      <div className="head">Pivot · {new Date(pivot.created_at).toLocaleDateString([], {month:'short', day:'numeric'})} · {pivot.slotKind}</div>
      <div className="body">
        <span className="from">{pivot.from}</span> → <span className="to">{pivot.to}</span>
      </div>
    </div>
  );
}

// ─── Minimap ───
function Minimap({ data, onJump }) {
  return (
    <div className="minimap">
      <div className="title">8 wks · scroll back</div>
      {data.map((w,i) => (
        <div key={i} className="wk" onClick={() => onJump && onJump(i)}>
          <span className="blocks">
            {[0,1,2,3,4,5,6].map(d => {
              const lvl = w.level >= 3 ? (d % 2 === 0 ? 'l3' : 'l2') : w.level === 2 ? (d < 4 ? 'l2' : 'l1') : w.level === 1 ? (d < 2 ? 'l1' : '') : '';
              return <span key={d} className={lvl} />;
            })}
          </span>
          <span>{w.week}</span>
          {w.pivot && <span className="pivot" title="Pivot this week" />}
        </div>
      ))}
    </div>
  );
}

// ─── Weekly Review ───
function WeeklyReview({ entries, goals, projects, onClose, onApply }) {
  const candidates = useMemo(() => entries.filter(e => !e.isPivot && !e.starred && !e.archived).slice(0, 8), [entries]);
  const [idx, setIdx] = useState(0);
  const [decisions, setDecisions] = useState({});
  const done = idx >= candidates.length;

  function decide(action) {
    const e = candidates[idx];
    setDecisions(d => ({ ...d, [e.id]: action }));
    setIdx(i => i + 1);
  }
  function finish() {
    onApply(decisions);
    onClose();
  }

  useEffect(() => {
    function key(e) {
      if (done) return;
      if (e.key === 's' || e.key === 'S') decide('star');
      if (e.key === 'a' || e.key === 'A') decide('archive');
      if (e.key === 'p' || e.key === 'P') decide('promote');
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); decide('skip'); }
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [idx, done]);

  const current = candidates[idx];
  const starCount = Object.values(decisions).filter(v => v === 'star').length;
  const archiveCount = Object.values(decisions).filter(v => v === 'archive').length;
  const promoteCount = Object.values(decisions).filter(v => v === 'promote').length;

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" data-screen-label="Weekly Review">
        <div className="modal-head">
          <div>
            <h2>What was the <em>signal</em> this week?</h2>
            <div className="sub">Quick passes. Star what matters, archive the noise, promote the breakthroughs.</div>
          </div>
          <button className="close" onClick={onClose}>×</button>
        </div>
        <div className="progress-rail">
          <div className="bar" style={{width: ((done ? candidates.length : idx) / candidates.length * 100) + '%'}} />
        </div>
        <div className="modal-body">
          {!done ? (
            <>
              <div className="review-meta">
                <span>Entry {idx + 1} of {candidates.length}</span>
                <span>★ {starCount} · Archive {archiveCount} · Promote {promoteCount}</span>
              </div>
              <div className="review-entry">
                <div className="date">{formatDay(current.created_at)} · {formatTime(current.created_at)}</div>
                <div className="content">{current.isCode ? <CodeBlock content={current.content}/> : renderContent(current.content)}</div>
                <div className="choices">
                  <button className="choice star" onClick={() => decide('star')}>
                    <span className="label">★ Signal</span><span className="k">S</span>
                  </button>
                  <button className="choice archive" onClick={() => decide('archive')}>
                    <span className="label">Archive</span><span className="k">A</span>
                  </button>
                  <button className="choice promote" onClick={() => decide('promote')}>
                    <span className="label">Promote ↑</span><span className="k">P</span>
                  </button>
                  <button className="choice skip" onClick={() => decide('skip')}>
                    <span className="label">Skip</span><span className="k">␣</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="review-done">
              <h3>That's your week, distilled.</h3>
              <div style={{color:'var(--ink-3)', fontSize:14, maxWidth:360}}>The starred entries become your backbone. Archives fold away quietly.</div>
              <div className="stats">
                <div><strong>{starCount}</strong>Starred</div>
                <div><strong>{archiveCount}</strong>Archived</div>
                <div><strong>{promoteCount}</strong>Promoted</div>
              </div>
              <button className="save-btn" style={{marginTop:16}} onClick={finish}>Apply & close</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar variant ───
function Sidebar({ goals, projects, onSlotClick, activeFilter, onStartReview, onOpenComposer }) {
  return (
    <aside className="sidebar">
      <div className="wordmark" style={{marginBottom:8}}>
        <div className="glyph">T</div>
        <div className="name">Through<em>line</em></div>
      </div>
      <div>
        <h3>Life goals</h3>
        {goals.map((g,i) => (
          <div key={g.id} className={'item ' + (activeFilter?.type==='goal' && activeFilter.id===g.id ? 'active' : '')}
               onClick={() => onSlotClick('goal', g.id)}>
            <span className="kind">Goal 0{i+1}</span>
            <span className="t">{g.name}</span>
          </div>
        ))}
        <button className="side-create" onClick={() => onOpenComposer('goal')}>New life goal</button>
      </div>
      <div>
        <h3>Projects</h3>
        {projects.map((p,i) => (
          <div key={p.id} className={'item ' + (activeFilter?.type==='project' && activeFilter.id===p.id ? 'active' : '')}
               onClick={() => onSlotClick('project', p.id)}>
            <span className="kind">Project 0{i+1}</span>
            <span className="t">{p.name}</span>
          </div>
        ))}
        <button className="side-create" onClick={() => onOpenComposer('project')}>New project</button>
      </div>
      <div style={{marginTop:'auto'}}>
        <button className="review-btn" style={{width:'100%'}} onClick={onStartReview}>Weekly review</button>
      </div>
    </aside>
  );
}

// ─── Composer modal (A) ───
const HUES = [
  'oklch(0.55 0.12 40)',
  'oklch(0.48 0.1 150)',
  'oklch(0.45 0.14 270)',
  'oklch(0.58 0.14 10)',
  'oklch(0.25 0.02 260)',
];

function ComposerModal({ open, kind, goals, onClose, onSave }) {
  const [activeKind, setActiveKind] = useState(kind);
  const [name, setName] = useState('');
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [selectedHue, setSelectedHue] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    setActiveKind(kind);
    setName('');
    setSelectedGoal(null);
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open, kind]);

  useEffect(() => {
    function key(e) {
      if (!open) return;
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSave();
    }
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [open, name]);

  function handleSave() {
    if (!name.trim()) { inputRef.current?.focus(); return; }
    onSave({ kind: activeKind, name: name.trim(), goalId: selectedGoal, hue: selectedHue });
    onClose();
  }

  if (!open) return null;

  const isGoal = activeKind === 'goal';
  const q = isGoal ? 'The life goal is called' : 'The project is called';
  const placeholder = 'Name it the way you'd say it aloud…';
  const why = isGoal
    ? 'What would it look like to have lived this well? A sentence. Optional.'
    : 'What does a good week on this project feel like? A line or two. Optional.';

  return (
    <div className="composer-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="composer-shell" role="dialog" aria-modal="true">
        <button className="composer-close" aria-label="Close" onClick={onClose}>×</button>
        <div className="composer">
          <div className="composer-type">
            <button data-kind="goal" className={isGoal ? 'on' : ''} onClick={() => setActiveKind('goal')}>Life goal</button>
            <button data-kind="project" className={!isGoal ? 'on' : ''} onClick={() => setActiveKind('project')}>Project</button>
          </div>
          <div className="q">{q}</div>
          <input
            ref={inputRef}
            className="big-input"
            type="text"
            placeholder={placeholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="underline" />
          <div className="why">{why}</div>

          {!isGoal && (
            <div className="field-row">
              <div className="field-label">Feeds into</div>
              <div className="field-body">
                <div className="goal-pick">
                  <span className={'goal-chip none ' + (selectedGoal === null ? 'sel' : '')}
                        onClick={() => setSelectedGoal(null)}>Standalone</span>
                  {goals.map(g => (
                    <span key={g.id} className={'goal-chip ' + (selectedGoal === g.id ? 'sel' : '')}
                          onClick={() => setSelectedGoal(g.id)}>
                      <span className="d" />
                      {g.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="field-row">
            <div className="field-label">Target</div>
            <div className="field-body">
              <div className="target">
                <span className="cal" />
                End of year · Dec 31, 2026
              </div>
            </div>
          </div>

          <div className="field-row" style={{borderBottom:'1px solid var(--rule)', marginBottom:28}}>
            <div className="field-label">Color</div>
            <div className="field-body">
              <div className="hue-pick">
                {HUES.map((h, i) => (
                  <span key={i} className={'hue ' + (selectedHue === i ? 'on' : '')}
                        style={{background: h}} onClick={() => setSelectedHue(i)} />
                ))}
                {!isGoal && <span style={{fontFamily:'var(--f-mono)', fontSize:10, color:'var(--ink-4)', marginLeft:8}}>inherits from goal →</span>}
              </div>
            </div>
          </div>

          <div className="composer-foot">
            <div className="hint"><span className="kbd">⌘</span><span className="kbd">↵</span> to save</div>
            <div className="actions">
              <button className="cancel" onClick={onClose}>Cancel</button>
              <button className="save" onClick={handleSave}>{isGoal ? 'Add goal' : 'Add project'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Threads view (B) ───
const THREADS_DATA = [
  { id: 'g1', kind: 'goal', label: 'Life goal 01', name: 'Build a business that compounds', captures: 58, signals: 9,
    preview: "The 'organizing tax' on notes is why I stop journaling. Capture must be free.",
    previewWhen: 'Tue · Apr 15',
    beads: [
      {l:'3%'},{l:'6%'},{l:'11%',sig:true},{l:'14%'},{l:'17%'},{l:'22%',pivot:true},
      {l:'26%'},{l:'30%',sig:true},{l:'33%'},{l:'38%'},{l:'42%'},{l:'47%',sig:true},
      {l:'51%'},{l:'54%'},{l:'58%'},{l:'62%',sig:true},{l:'66%'},{l:'70%'},{l:'74%',pivot:true},
      {l:'78%'},{l:'82%',sig:true},{l:'86%'},{l:'89%'},{l:'93%',sig:true},
    ],
    detail: { crumb: null, sub: 'A throughline for compound work — revenue, relationships, leverage.', stats: [{n:'58',l:'Captures'},{n:'9',l:'Signals'},{n:'2',l:'Pivots'},{n:'16',l:'Weeks'}],
      signals: [{when:'Apr 15',txt:"The 'organizing tax' is why journaling dies. Capture free, sort deferred.",ctx:'#insight'},{when:'Apr 11',txt:'Pricing conversation with Mateo — $29 reads consumer not pro.',ctx:'#pricing'},{when:'Mar 28',txt:'Pivot: stopped consulting to build full-time.',ctx:'pivot'}] }
  },
  { id: 'p1', kind: 'project', label: 'Project 01', name: 'Throughline launch', captures: 28, signals: 5,
    beads: [{l:'40%'},{l:'44%'},{l:'49%',sig:true},{l:'52%'},{l:'56%'},{l:'60%'},{l:'64%',sig:true},{l:'68%'},{l:'72%'},{l:'76%',sig:true},{l:'80%'},{l:'84%'},{l:'88%',sig:true},{l:'92%'},{l:'95%',sig:true}],
    detail: { crumb: 'Build a business that compounds', sub: 'Ship the product that proves the idea.', stats: [{n:'28',l:'Captures'},{n:'5',l:'Signals'},{n:'0',l:'Pivots'},{n:'8',l:'Weeks'}],
      signals: [{when:'Apr 16',txt:'Shipped landing v1. Not proud yet — shipped > proud, for now.',ctx:'#ship'},{when:'Apr 8',txt:'Fixed sticky-header jitter on mobile.',ctx:'#bug'}] }
  },
  { id: 'g2', kind: 'goal', label: 'Life goal 02', name: 'Write every day, ship every month', captures: 36, signals: 6,
    beads: [{l:'2%'},{l:'5%'},{l:'9%'},{l:'13%',sig:true},{l:'17%'},{l:'21%'},{l:'25%'},{l:'29%',sig:true},{l:'34%'},{l:'41%'},{l:'52%'},{l:'58%',sig:true},{l:'64%'},{l:'71%'},{l:'77%',sig:true},{l:'83%'},{l:'89%'}],
    detail: { crumb: null, sub: 'The discipline underneath everything else.', stats: [{n:'36',l:'Captures'},{n:'6',l:'Signals'},{n:'0',l:'Pivots'},{n:'16',l:'Weeks'}],
      signals: [{when:'Apr 15',txt:'Morning thought: the organizing tax on notes.',ctx:'#writing'},{when:'Apr 9',txt:'Re-read Morning Pages — friction to write < friction to file.',ctx:'#reading'}] }
  },
  { id: 'g3', kind: 'goal', label: 'Life goal 03', name: 'Be present with Maya & Leo', captures: 18, signals: 3,
    beads: [{l:'6%'},{l:'13%'},{l:'19%',sig:true},{l:'27%'},{l:'36%'},{l:'44%'},{l:'51%',sig:true},{l:'59%'},{l:'66%'},{l:'74%'},{l:'81%',sig:true},{l:'89%'},{l:'94%'}],
    detail: { crumb: null, sub: 'The reason all product insights matter.', stats: [{n:'18',l:'Captures'},{n:'3',l:'Signals'},{n:'0',l:'Pivots'},{n:'16',l:'Weeks'}],
      signals: [{when:'Apr 15',txt:"Leo asked why grown-ups look at phones at dinner.",ctx:'#family'}] }
  },
  { id: 'p2', kind: 'project', label: 'Project · standalone', name: 'Q2 client work — Ember Co.', captures: 12, signals: 2,
    beads: [{l:'48%'},{l:'52%'},{l:'57%'},{l:'62%',sig:true},{l:'66%'},{l:'71%'},{l:'75%'},{l:'80%'},{l:'84%'},{l:'88%'},{l:'90%',sig:true},{l:'94%'}],
    detail: { crumb: null, sub: 'Consulting engagement, Q2 2026.', stats: [{n:'12',l:'Captures'},{n:'2',l:'Signals'},{n:'0',l:'Pivots'},{n:'4',l:'Weeks'}],
      signals: [{when:'Apr 8',txt:'Kickoff went well — 3-week timeline, thin margin.',ctx:'#consulting'}] }
  },
];

function ThreadsView() {
  const [activeThread, setActiveThread] = useState(null);

  function openThread(t) { setActiveThread(t); }
  function closeThread() { setActiveThread(null); }

  return (
    <div className="threads-view">
      <div className="threads-head">
        <div>
          <h2 className="threads-title">The <em>Spine</em></h2>
          <div className="threads-sub">Every thread, laid out in time · captures as beads · signals in gold</div>
        </div>
        <div className="threads-legend">
          <div className="leg-item"><span className="d reg" /> Capture</div>
          <div className="leg-item"><span className="d sig" /> Signal</div>
          <div className="leg-item"><span className="piv" /> Pivot</div>
        </div>
      </div>

      <div className="threads-spines">
        {THREADS_DATA.map((t, i) => (
          <div key={t.id} className={'spine ' + (t.kind === 'project' ? 'project' : '')}>
            <div className="meta">
              <div className="kind"><span className="dot" />{t.label}</div>
              <div className="name" onClick={() => openThread(t)}>{t.name}</div>
              <div className="stats">{t.captures} captures · <strong>{t.signals} signals</strong></div>
            </div>
            <div className="spine-line">
              {t.beads.map((b, bi) => (
                <span key={bi}
                  className={'bead' + (b.sig ? ' sig' : '') + (b.pivot ? ' pivot' : '')}
                  style={{left: b.l}}
                  onClick={() => openThread(t)}
                />
              ))}
              <span className="today-mark" />
            </div>
            {i === 0 && t.preview && (
              <div className="preview">
                <span className="when">{t.previewWhen}</span>{t.preview}
              </div>
            )}
          </div>
        ))}
      </div>

      {activeThread && (
        <div className="thread-detail">
          <button className="back" onClick={closeThread}>← back to all threads</button>
          <div className="crumbs">
            {activeThread.detail.crumb && <><span className="g">◎ {activeThread.detail.crumb}</span><span className="sep">/</span></>}
            <span>{activeThread.name}</span>
          </div>
          <h3>{activeThread.name}</h3>
          <div style={{fontFamily:'var(--f-italic)', fontStyle:'italic', fontSize:17, color:'var(--ink-3)', maxWidth:560, lineHeight:1.55}}>
            {activeThread.detail.sub}
          </div>
          <div className="stats-row">
            {activeThread.detail.stats.map(s => (
              <div key={s.l} className="stat">
                <div className="n">{s.n}</div>
                <div className="l">{s.l}</div>
              </div>
            ))}
          </div>
          <div className="wk-signals">
            {activeThread.detail.signals.map((s, i) => (
              <div key={i} className="wk-signal">
                <span className="when">{s.when}</span>
                <span className="txt">{s.txt}</span>
                <span className="ctx">{s.ctx}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Timeline view (C) ───
const WEEKS_2026 = [
  {total:8,sig:2},{total:12,sig:0},{total:18,sig:4},{total:6,sig:0},{total:15,sig:3},
  {total:20,sig:5},{total:9,sig:1},{total:14,sig:2},{total:22,sig:6},{total:11,sig:2},
  {total:16,sig:3},{total:25,sig:7},{total:8,sig:1},{total:13,sig:2},{total:19,sig:4},{total:10,sig:2},
  {total:0,sig:0},{total:0,sig:0},{total:0,sig:0},{total:0,sig:0},{total:0,sig:0},
  {total:0,sig:0},{total:0,sig:0},{total:0,sig:0},{total:0,sig:0},{total:0,sig:0},
  {total:0,sig:0},{total:0,sig:0},{total:0,sig:0},{total:0,sig:0},{total:0,sig:0},
  {total:0,sig:0},{total:0,sig:0},{total:0,sig:0},{total:0,sig:0},{total:0,sig:0},
  {total:0,sig:0},{total:0,sig:0},{total:0,sig:0},{total:0,sig:0},{total:0,sig:0},
  {total:0,sig:0},{total:0,sig:0},{total:0,sig:0},{total:0,sig:0},{total:0,sig:0},
  {total:0,sig:0},{total:0,sig:0},{total:0,sig:0},{total:0,sig:0},{total:0,sig:0},
  {total:0,sig:0},{total:0,sig:0},
];
const CURRENT_WEEK = 16;
const MONTHS = [
  {label:'Jan', pct:'0%'},{label:'Feb', pct:'8.5%'},{label:'Mar', pct:'16.5%'},
  {label:'Apr', pct:'25%'},{label:'May', pct:'33%'},{label:'Jun', pct:'41.5%'},
  {label:'Jul', pct:'50%'},{label:'Aug', pct:'58.5%'},{label:'Sep', pct:'66.5%'},
  {label:'Oct', pct:'75%'},{label:'Nov', pct:'83%'},{label:'Dec', pct:'91.5%'},
];
const PIVOTS_2026 = [
  {label:'Went full-time', pct:'18%'},
  {label:'Pricing pivot', pct:'44%'},
];
const RIBBONS = [
  {type:'goal', label:'Build a business'},
  {type:'project', label:'Throughline launch', right:'60%'},
  {type:'goal', label:'Write every day'},
  {type:'goal', label:'Present with family'},
  {type:'project', label:'Ember Co. · Q2', left:'48%', right:'18%'},
];
const WEEK_SIGNALS = {
  11: [{when:'Apr 15',txt:"The 'organizing tax' on notes is why I stop journaling.",ctx:'#insight'},{when:'Apr 14',txt:'Talked to Mateo about pricing.',ctx:'#pricing'}],
  15: [{when:'Apr 13',txt:'Shipped landing v1.',ctx:'#ship'}],
};

function TimelineView() {
  const [activeYear, setActiveYear] = useState(2026);
  const [selectedWk, setSelectedWk] = useState(CURRENT_WEEK - 1);
  const years = [2023, 2024, 2025, 2026];

  const weeks = activeYear === 2026 ? WEEKS_2026 : Array(52).fill({total:0,sig:0});

  function selectWk(i) { setSelectedWk(i); }
  function cycleYear(dir) {
    const idx = years.indexOf(activeYear);
    const next = years[(idx + dir + years.length) % years.length];
    setActiveYear(next);
  }

  const signals = WEEK_SIGNALS[selectedWk] || [];

  return (
    <div className="tl">
      <div className="tl-head">
        <div>
          <h3>The year in <em>one line</em>.</h3>
          <div style={{fontFamily:'var(--f-mono)', fontSize:10, letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--ink-4)', marginTop:6}}>
            Density above · Pivots on the line · Ribbons for what was live
          </div>
        </div>
        <div className="range">
          <button className="nav-btn" onClick={() => cycleYear(-1)}>‹</button>
          <span>{activeYear}</span>
          <button className="nav-btn" onClick={() => cycleYear(1)}>›</button>
        </div>
      </div>

      <div className="tl-years">
        {years.map(y => (
          <button key={y} className={'yr ' + (activeYear === y ? 'on' : '')} onClick={() => setActiveYear(y)}>{y}</button>
        ))}
      </div>

      <div className="tl-ribbons">
        {RIBBONS.map((r, i) => (
          <div key={i} className={'tl-ribbon ' + r.type}>
            <span className="rib-label"><span className="d" />{r.label}</span>
            <span className="band" style={r.left ? {left:r.left, right: r.right||0} : {right: r.right||0}} />
          </div>
        ))}
      </div>

      <div className="year-line" style={{position:'relative'}}>
        <div className="year-left-label">Week activity</div>
        <div className="year-bars">
          {weeks.map((w, i) => {
            const isFuture = i >= CURRENT_WEEK;
            const isOn = i === selectedWk;
            return (
              <div key={i} className={'wk ' + (isFuture ? 'future ' : '') + (isOn ? 'on' : '')} onClick={() => selectWk(i)}>
                {w.sig > 0 && <div className="blk sig" style={{height: Math.max(w.sig * 2, 2) + 'px'}} />}
                <div className="blk" style={{height: Math.max((w.total - w.sig) * 2, w.total > 0 ? 2 : 0) + 'px'}} />
              </div>
            );
          })}
        </div>
        <div className="year-pivots">
          {activeYear === 2026 && PIVOTS_2026.map((p, i) => (
            <div key={i} className="year-pivot" style={{left: p.pct}}>
              <span className="lbl">{p.label}</span>
            </div>
          ))}
        </div>
        <div className="year-axis">
          {MONTHS.map(m => (
            <span key={m.label} className="month" style={{left: m.pct}}>{m.label}</span>
          ))}
        </div>
      </div>

      <div className="tl-week-detail">
        <div className="wk-head">
          <h4 className="wk-title">Week {selectedWk + 1} · {activeYear}</h4>
          <div className="wk-stats">
            {weeks[selectedWk]?.total || 0} captures · {weeks[selectedWk]?.sig || 0} signals
          </div>
        </div>
        {signals.length > 0 ? (
          <div className="wk-signals">
            {signals.map((s, i) => (
              <div key={i} className="wk-signal">
                <span className="when">{s.when}</span>
                <span className="txt">{s.txt}</span>
                <span className="ctx">{s.ctx}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{fontFamily:'var(--f-display)', fontStyle:'italic', color:'var(--ink-4)', fontSize:15}}>
            {weeks[selectedWk]?.total > 0 ? 'No signals this week — the captures are there, but nothing rose to signal level.' : 'Nothing captured yet — this week is still ahead.'}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tweaks panel ───
function TweaksPanel({ open, onClose, tweaks, setTweak }) {
  const accents = [
    { id: 'indigo', color: 'oklch(0.45 0.14 270)' },
    { id: 'clay',   color: 'oklch(0.55 0.12 40)' },
    { id: 'moss',   color: 'oklch(0.48 0.1 150)' },
    { id: 'ink',    color: 'oklch(0.25 0.02 260)' },
    { id: 'rose',   color: 'oklch(0.58 0.14 10)' },
  ];
  return (
    <div className={'tweaks-panel ' + (open ? 'open' : '')}>
      <h4>Tweaks <button onClick={onClose}>×</button></h4>

      <div className="tweak-row">
        <label>Theme</label>
        <div className="seg">
          {['light','dark'].map(v => (
            <button key={v} className={tweaks.theme===v ? 'on' : ''} onClick={() => setTweak('theme', v)}>{v}</button>
          ))}
        </div>
      </div>

      <div className="tweak-row">
        <label>Accent</label>
        <div className="hues">
          {accents.map(a => (
            <span key={a.id} className={'hue ' + (tweaks.accent===a.id ? 'on' : '')}
                  style={{background:a.color}} onClick={() => setTweak('accent', a.id)} />
          ))}
        </div>
      </div>

      <div className="tweak-row">
        <label>Layout</label>
        <div className="seg">
          <button className={tweaks.layout==='top' ? 'on' : ''} onClick={() => setTweak('layout', 'top')}>Top bar</button>
          <button className={tweaks.layout==='sidebar' ? 'on' : ''} onClick={() => setTweak('layout', 'sidebar')}>Sidebar</button>
        </div>
      </div>

      <div className="tweak-row">
        <label>Density</label>
        <div className="seg">
          {['airy','balanced','dense'].map(v => (
            <button key={v} className={tweaks.density===v ? 'on' : ''} onClick={() => setTweak('density', v)}>{v}</button>
          ))}
        </div>
      </div>

      <div className="tweak-row">
        <label>Entry style</label>
        <div className="seg">
          <button className={tweaks.entry==='journal' ? 'on' : ''} onClick={() => setTweak('entry', 'journal')}>Journal</button>
          <button className={tweaks.entry==='card' ? 'on' : ''} onClick={() => setTweak('entry', 'card')}>Card</button>
          <button className={tweaks.entry==='line' ? 'on' : ''} onClick={() => setTweak('entry', 'line')}>Line</button>
        </div>
      </div>

      <div className="tweak-row">
        <label>Type pairing</label>
        <div className="seg">
          <button className={tweaks.font==='editorial' ? 'on' : ''} onClick={() => setTweak('font', 'editorial')}>Editorial</button>
          <button className={tweaks.font==='sans' ? 'on' : ''} onClick={() => setTweak('font', 'sans')}>Sans</button>
          <button className={tweaks.font==='serif' ? 'on' : ''} onClick={() => setTweak('font', 'serif')}>Serif</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  Masthead, BigLineBar, Capture, FilterBar, Entry, PivotMarker, Minimap,
  WeeklyReview, Sidebar, TweaksPanel, ComposerModal, ThreadsView, TimelineView,
  Icon, formatDay, formatTime,
});
