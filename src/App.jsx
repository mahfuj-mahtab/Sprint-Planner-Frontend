import { useState, useEffect, useRef } from 'react'
import './App.css'
import { Link } from 'react-router-dom';

function useInView(threshold = 0.12) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return [ref, inView]
}

function FadeIn({ children, delay = 0 }) {
  const [ref, inView] = useInView()
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0)' : 'translateY(24px)',
      transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
    }}>
      {children}
    </div>
  )
}

const FLOW = [
  { step: '01', label: 'Organisation', icon: '⬡', desc: 'Create your org — the top-level workspace that houses all your projects and teams.', color: '#00ff94' },
  { step: '02', label: 'Projects',      icon: '◈', desc: 'Break work into projects. Each project owns its own teams, backlogs, and sprint cycles.', color: '#00d4ff' },
  { step: '03', label: 'Sprints',       icon: '◎', desc: 'Plan weekly or bi-weekly sprints. Time-box your goals and hold the team accountable.', color: '#ff6b35' },
  { step: '04', label: 'Tasks',         icon: '▣', desc: 'Assign tasks to team members with priority, status, and deadlines baked in.', color: '#a78bfa' },
]

const FEATURES = [
  { icon: '⚡', title: 'Sprint Planning',    desc: 'Build focused sprint plans in minutes. Move fast, ship fast, win the week.' },
  { icon: '🧑‍💻', title: 'Team Assignment',  desc: 'Assign tasks to specific members inside every project. Full ownership, no confusion.' },
  { icon: '📊', title: 'Priority & Status',  desc: 'Mark tasks Low / Medium / High. Track status from Pending to Completed in real time.' },
  { icon: '🗂️', title: 'Multi-Project Org', desc: 'Run multiple projects under one org. Keep cross-functional teams perfectly aligned.' },
  { icon: '🔔', title: 'Real-time Updates',  desc: 'Every edit, reassignment, and sprint change shows up instantly across your team.' },
  { icon: '🚀', title: 'Built for Velocity', desc: 'Lightweight and opinionated. Designed for dev teams that actually ship.' },
]

const BOARD_COLS = [
  { label: 'To Do',       color: '#64748b', tasks: [['Auth flow','High'],['DB schema','Medium']] },
  { label: 'In Progress', color: '#00d4ff', tasks: [['API routes','High']] },
  { label: 'Done',        color: '#00ff94', tasks: [['UI setup','Low'],['CI pipeline','Medium']] },
]
const PRI = { High: '#f87171', Medium: '#fb923c', Low: '#94a3b8' }
const AVS = ['JK','AS','MR','PR','TN','YL']
let avi = 0

export default function App() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: '#080c10', color: '#e8edf2', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700&family=Syne:wght@700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{overflow-x:hidden}
        ::selection{background:#00ff9433}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:#080c10}
        ::-webkit-scrollbar-thumb{background:#00ff94;border-radius:2px}

        .dot-bg{background-image:radial-gradient(circle,#1e2a3a 1px,transparent 1px);background-size:28px 28px}

        .card{background:#0d1117;border:1px solid #1e2a3a;border-radius:16px;padding:1.6rem;height:100%;transition:transform .25s,box-shadow .25s}
        .card:hover{transform:translateY(-4px);box-shadow:0 12px 40px rgba(0,255,148,.1)}

        .tag{font-family:'DM Mono',monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;padding:4px 10px;border-radius:4px;display:inline-block}

        .btn-p{background:#00ff94;color:#080c10;font-weight:700;padding:13px 26px;border-radius:8px;border:none;cursor:pointer;font-size:15px;transition:all .2s;white-space:nowrap;font-family:'DM Sans',sans-serif}
        .btn-p:hover{background:#00e882;transform:translateY(-1px);box-shadow:0 8px 24px rgba(0,255,148,.35)}
        .btn-o{background:transparent;color:#e8edf2;font-weight:600;padding:13px 26px;border-radius:8px;border:1.5px solid #1e2a3a;cursor:pointer;font-size:15px;transition:all .2s;white-space:nowrap;font-family:'DM Sans',sans-serif}
        .btn-o:hover{border-color:#00ff9466;color:#00ff94}

        .glass{backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}

        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        .float{animation:float 4s ease-in-out infinite}

        @keyframes up{from{opacity:0;transform:translateY(36px)}to{opacity:1;transform:translateY(0)}}
        .up{animation:up .7s ease both}

        /* NAV */
        .nav-links{display:flex;align-items:center;gap:2rem}
        @media(max-width:767px){.nav-links{display:none}}
        .burger{display:none;background:none;border:1px solid #1e2a3a;border-radius:8px;padding:7px 9px;cursor:pointer;flex-direction:column;gap:5px;flex-shrink:0}
        @media(max-width:767px){.burger{display:flex}}
        .nav-btns{display:flex;gap:10px;align-items:center}
        @media(max-width:400px){.nav-btns{display:none}}

        /* MOBILE DRAWER */
        .drawer{position:fixed;top:64px;left:0;right:0;bottom:0;background:#080c10;z-index:49;display:flex;flex-direction:column;padding:1rem 1.5rem;gap:.5rem;transition:opacity .3s,transform .3s;overflow-y:auto}
        .drawer.hide{opacity:0;transform:translateY(-10px);pointer-events:none}
        .drawer a{color:#94a3b8;font-size:16px;text-decoration:none;padding:14px 0;border-bottom:1px solid #1e2a3a;font-weight:500}
        .drawer-btns{display:flex;gap:10px;padding-top:1rem}

        /* HERO */
        .hero-grid{display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center}
        @media(max-width:880px){.hero-grid{grid-template-columns:1fr;gap:2.5rem}}

        /* FLOW */
        .flow-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1.25rem}
        @media(max-width:880px){.flow-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:480px){.flow-grid{grid-template-columns:1fr}}

        /* FEATURES */
        .feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.25rem}
        @media(max-width:880px){.feat-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:520px){.feat-grid{grid-template-columns:1fr}}

        /* BOARD */
        .board-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:16px}
        @media(max-width:380px){
          .board-grid{grid-template-columns:1fr}
          .board-col-2,.board-col-3{display:none}
        }

        /* HERO BUTTONS */
        .hero-btns{display:flex;gap:1rem;flex-wrap:wrap}

        /* STATS */
        .stats{display:flex;gap:2.5rem;margin-top:2.5rem;flex-wrap:wrap}

        /* CTA INNER */
        .cta-inner{padding:clamp(2rem,5vw,3.5rem);text-align:center}

        /* FOOTER */
        .footer-r{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem}
        @media(max-width:600px){.footer-r{flex-direction:column;text-align:center}}

        /* SECTION PADDING */
        .sp{padding:80px 1.5rem}
        @media(max-width:640px){.sp{padding:60px 1.25rem}}

        /* HEADINGS */
        .sh{font-family:'Syne',sans-serif;font-size:clamp(1.7rem,4vw,2.8rem);font-weight:800;color:#e8edf2}
        .hh{font-family:'Syne',sans-serif;font-size:clamp(2rem,6vw,3.8rem);font-weight:800;line-height:1.1}
      `}</style>

      {/* ── NAV ── */}
      <header className="glass" style={{
        position:'fixed',top:0,left:0,right:0,zIndex:50,
        background: scrolled ? 'rgba(8,12,16,.93)' : 'transparent',
        borderBottom: scrolled ? '1px solid #1e2a3a' : '1px solid transparent',
        transition:'all .3s',
      }}>
        <div style={{maxWidth:1200,margin:'0 auto',padding:'0 1.5rem',display:'flex',alignItems:'center',justifyContent:'space-between',height:64}}>
          <a href="/" style={{textDecoration:'none',display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
            <div style={{width:32,height:32,background:'#00ff94',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <span style={{color:'#080c10',fontWeight:800,fontSize:16,fontFamily:'Syne,sans-serif'}}>W</span>
            </div>
            <span style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'1.2rem',color:'#e8edf2'}}>WeekWins</span>
          </a>

          <nav className="nav-links">
            {['Features','How it Works','Team','Contact'].map(l=>(
              <a key={l} href={`#${l.toLowerCase().replace(/ /g,'-')}`}
                style={{color:'#94a3b8',fontSize:14,textDecoration:'none',fontWeight:500,transition:'color .2s'}}
                onMouseEnter={e=>e.target.style.color='#00ff94'}
                onMouseLeave={e=>e.target.style.color='#94a3b8'}
              >{l}</a>
            ))}
          </nav>

          <div style={{display:'flex',gap:10,alignItems:'center'}}>
            <div className="nav-btns">
              <Link to = "/user/login" className="btn-o" style={{padding:'7px 16px',fontSize:13}}>Log in</Link>
              <button className="btn-p" style={{padding:'7px 16px',fontSize:13}}>Get started →</button>
            </div>
            <button className="burger" onClick={()=>setOpen(o=>!o)} aria-label="menu">
              {[0,1,2].map(i=>(
                <span key={i} style={{
                  display:'block',width:20,height:2,background:'#94a3b8',borderRadius:2,transition:'all .3s',
                  transform: open&&i===0?'rotate(45deg) translate(5px,5px)':open&&i===2?'rotate(-45deg) translate(5px,-5px)':'none',
                  opacity: open&&i===1?0:1,
                }}/>
              ))}
            </button>
          </div>
        </div>

      </header>

      {/* Mobile drawer — must live OUTSIDE <header> because backdrop-filter creates a
          new containing block that traps position:fixed children inside it */}
      <div className={`drawer ${open?'':'hide'}`}>
        {['Features','How it Works','Team','Contact'].map(l=>(
          <a key={l} href={`#${l.toLowerCase().replace(/ /g,'-')}`} onClick={()=>setOpen(false)}>{l}</a>
        ))}
        <div className="drawer-btns">
          <button className="btn-o" style={{flex:1,padding:'11px'}}>Log in</button>
          <button className="btn-p" style={{flex:1,padding:'11px'}}>Get started →</button>
        </div>
      </div>

      {/* ── HERO ── */}
      <section className="dot-bg" style={{paddingTop:130,paddingBottom:80,paddingLeft:'1.5rem',paddingRight:'1.5rem',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:'10%',left:'5%',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(0,255,148,.06) 0%,transparent 70%)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',top:'30%',right:0,width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle,rgba(0,212,255,.05) 0%,transparent 70%)',pointerEvents:'none'}}/>
        <div style={{maxWidth:1200,margin:'0 auto'}}>
          <div className="hero-grid">
            {/* Copy */}
            <div>
              <div className="tag up" style={{background:'#00ff9415',color:'#00ff94',border:'1px solid #00ff9430',marginBottom:'1.25rem',animationDelay:'0ms'}}>
                Built for dev teams
              </div>
              <h1 className="hh">
                <span className="up" style={{display:'block',animationDelay:'80ms'}}>Win every week.</span>
                <span className="up" style={{display:'block',color:'#94a3b8',animationDelay:'180ms'}}>Ship every sprint.</span>
              </h1>
              <p className="up" style={{color:'#64748b',fontSize:'1.05rem',lineHeight:1.8,margin:'1.5rem 0 2rem',maxWidth:480,animationDelay:'260ms'}}>
                WeekWins is a sprint-driven project manager for small dev teams.
                Organise work into{' '}
                <strong style={{color:'#94a3b8'}}>orgs → projects → sprints → tasks</strong>.
                Stop context-switching. Start shipping.
              </p>
              <div className="hero-btns up" style={{animationDelay:'340ms'}}>
                <button className="btn-p">Start for free →</button>
                <button className="btn-o">See how it works</button>
              </div>
              <div className="stats up" style={{animationDelay:'420ms'}}>
                {[['10x','faster sprint planning'],['100%','team visibility'],['0','wasted stand-ups']].map(([n,l])=>(
                  <div key={n}>
                    <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'1.5rem',color:'#00ff94'}}>{n}</div>
                    <div style={{color:'#64748b',fontSize:11,fontFamily:'DM Mono,monospace',marginTop:2}}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mockup */}
            <div className="float">
              <div style={{background:'#0d1117',border:'1px solid #1e2a3a',borderRadius:16,overflow:'hidden',boxShadow:'0 24px 64px rgba(0,0,0,.6)'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,padding:'11px 16px',borderBottom:'1px solid #1e2a3a',background:'#0a0f14'}}>
                  {['#ff5f57','#febc2e','#28c840'].map(c=><div key={c} style={{width:11,height:11,borderRadius:'50%',background:c}}/>)}
                  <span style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'#475569',marginLeft:8}}>weekwins — sprint #12</span>
                </div>
                <div className="board-grid">
                  {BOARD_COLS.map((col,ci)=>(
                    <div key={col.label} className={ci===1?'board-col-2':ci===2?'board-col-3':''}>
                      <div style={{fontFamily:'DM Mono,monospace',fontSize:10,color:col.color,marginBottom:10,textTransform:'uppercase',letterSpacing:'.1em'}}>{col.label}</div>
                      {col.tasks.map(([task,pri])=>{
                        const av=AVS[avi++%AVS.length]
                        return(
                          <div key={task} style={{background:'#111827',border:'1px solid #1e2a3a',borderRadius:8,padding:'10px 11px',marginBottom:8}}>
                            <div style={{fontSize:12,fontWeight:500,color:'#cbd5e1',marginBottom:6}}>{task}</div>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                              <span style={{fontSize:10,fontFamily:'DM Mono,monospace',color:PRI[pri],background:PRI[pri]+'18',padding:'2px 6px',borderRadius:4}}>{pri}</span>
                              <div style={{width:20,height:20,borderRadius:'50%',background:'#1e2a3a',display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,color:'#64748b',fontFamily:'DM Mono,monospace'}}>{av}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
                <div style={{padding:'11px 16px',borderTop:'1px solid #1e2a3a',display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:'#00ff94',boxShadow:'0 0 8px #00ff94',flexShrink:0}}/>
                  <span style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'#475569'}}>Sprint ends in 3d 14h · 6/9 tasks done</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="sp" style={{background:'#0a0f14'}}>
        <div style={{maxWidth:1200,margin:'0 auto'}}>
          <FadeIn>
            <div style={{textAlign:'center',marginBottom:'3.5rem'}}>
              <div className="tag" style={{background:'#00d4ff15',color:'#00d4ff',border:'1px solid #00d4ff30',marginBottom:'1rem'}}>The WeekWins Model</div>
              <h2 className="sh">One structure. Zero chaos.</h2>
              <p style={{color:'#64748b',fontSize:'1rem',marginTop:'.75rem'}}>Every piece of work has a home — and a deadline.</p>
            </div>
          </FadeIn>
          <div className="flow-grid">
            {FLOW.map((f,i)=>(
              <FadeIn key={f.label} delay={i*100}>
                <div className="card">
                  <div style={{width:46,height:46,borderRadius:12,background:`${f.color}15`,border:`1px solid ${f.color}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.3rem',marginBottom:'1.1rem'}}>{f.icon}</div>
                  <div style={{fontFamily:'DM Mono,monospace',fontSize:10,color:f.color,marginBottom:6,letterSpacing:'.12em'}}>Step {f.step}</div>
                  <h3 style={{fontFamily:'Syne,sans-serif',fontSize:'1rem',fontWeight:700,color:'#e8edf2',marginBottom:8}}>{f.label}</h3>
                  <p style={{color:'#64748b',fontSize:13.5,lineHeight:1.7}}>{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="sp dot-bg" style={{background:'#080c10'}}>
        <div style={{maxWidth:1200,margin:'0 auto'}}>
          <FadeIn>
            <div style={{textAlign:'center',marginBottom:'3.5rem'}}>
              <div className="tag" style={{background:'#a78bfa15',color:'#a78bfa',border:'1px solid #a78bfa30',marginBottom:'1rem'}}>Features</div>
              <h2 className="sh">Everything your team actually needs.</h2>
              <p style={{color:'#64748b',fontSize:'1rem',marginTop:'.75rem'}}>No bloat. No 200-tab dashboards. Just the features that move work forward.</p>
            </div>
          </FadeIn>
          <div className="feat-grid">
            {FEATURES.map((f,i)=>(
              <FadeIn key={f.title} delay={i*70}>
                <div className="card">
                  <div style={{fontSize:'1.8rem',marginBottom:'.9rem'}}>{f.icon}</div>
                  <h3 style={{fontFamily:'Syne,sans-serif',fontSize:'1rem',fontWeight:700,color:'#e8edf2',marginBottom:8}}>{f.title}</h3>
                  <p style={{color:'#64748b',fontSize:13.5,lineHeight:1.7}}>{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="sp" style={{background:'#0a0f14'}}>
        <div style={{maxWidth:860,margin:'0 auto'}}>
          <FadeIn>
            <div className="cta-inner" style={{background:'linear-gradient(135deg,#0d1117,#111827)',border:'1px solid #1e2a3a',borderRadius:20,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:'-60px',left:'50%',transform:'translateX(-50%)',width:280,height:280,borderRadius:'50%',background:'radial-gradient(circle,rgba(0,255,148,.08) 0%,transparent 70%)',pointerEvents:'none'}}/>
              <div className="tag" style={{background:'#00ff9415',color:'#00ff94',border:'1px solid #00ff9430',marginBottom:'1.25rem'}}>Free to start</div>
              <h2 className="sh" style={{marginBottom:'1rem'}}>Ready to win your first week?</h2>
              <p style={{color:'#64748b',fontSize:'1rem',maxWidth:440,margin:'0 auto 2rem'}}>
                Set up your org, create a sprint, assign tasks — and actually ship what you planned.
              </p>
              <div style={{display:'flex',gap:'1rem',flexWrap:'wrap',justifyContent:'center'}}>
                <button className="btn-p">Create your org →</button>
                <button className="btn-o">View demo</button>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{borderTop:'1px solid #1e2a3a',padding:'2rem 1.5rem',background:'#080c10'}}>
        <div style={{maxWidth:1200,margin:'0 auto'}}>
          <div className="footer-r">
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:28,height:28,background:'#00ff94',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <span style={{color:'#080c10',fontWeight:800,fontSize:13,fontFamily:'Syne,sans-serif'}}>W</span>
              </div>
              <span style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:'1rem',color:'#e8edf2'}}>WeekWins</span>
            </div>
            <div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'#475569'}}>© 2026 WeekWins · Built for dev teams that ship</div>
            <div style={{display:'flex',gap:'1.5rem'}}>
              {['Privacy','Terms','Contact'].map(l=>(
                <a key={l} href="#" style={{color:'#475569',fontSize:13,textDecoration:'none',transition:'color .2s'}}
                  onMouseEnter={e=>e.target.style.color='#00ff94'}
                  onMouseLeave={e=>e.target.style.color='#475569'}
                >{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}