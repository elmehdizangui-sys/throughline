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
function Sidebar({ goals, projects, onSlotClick, activeFilter, onStartReview }) {
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
      </div>
      <div style={{marginTop:'auto'}}>
        <button className="review-btn" style={{width:'100%'}} onClick={onStartReview}>Weekly review</button>
      </div>
    </aside>
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
  WeeklyReview, Sidebar, TweaksPanel, Icon, formatDay, formatTime,
});
