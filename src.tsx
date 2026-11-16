import {useEffect,useState} from 'react'
import {createRoot} from 'react-dom/client'
import {motion,MotionConfig} from 'framer-motion'
import {Activity,ArrowLeft,ArrowRight,BookOpen,Check,ChevronRight,Code2,Database,GitCompareArrows,GraduationCap,KeyRound,Layers3,Monitor,Pause,Play,Search,Server,Shield,ShieldAlert,Terminal,X} from 'lucide-react'
import {groups,topics} from './data'
import './style.css'

type Topic = typeof topics[number]
type Progress = {done:string[]; score?:number}
const icons = [KeyRound,Shield,Layers3]
const actorIcons = [Monitor,Server,Database,Server,Database]
const filters = ['All','AuthN','AuthZ','Stacks']
const initialTopic = () => topics.find(t=>t.id===new URLSearchParams(location.search).get('topic')) ?? topics[0]
function loadProgress():Progress {
  try {const data=JSON.parse(localStorage.getItem('auth-stack-progress') ?? '{}'); return {done:Array.isArray(data.done)?topics.filter(t=>data.done.includes(t.id)).map(t=>t.id):[],score:typeof data.score==='number'?data.score:undefined}} catch {return {done:[]}}
}
function Diagram({topic,index}:{topic:Topic;index:number}) {
  const step=topic.steps[index]
  const point=(actor:number)=>((actor+.5)/topic.actors.length)*100+'%'
  return <div className="diagram" role="img" aria-label={topic.actors[step.from]+' sends '+step.title+' to '+topic.actors[step.to]}>
    <div className="actors">{topic.actors.map((name,i)=>{const Icon=actorIcons[i];return <div key={name} className={i===step.from||i===step.to?'actor active':'actor'}><span className="actor-icon"><Icon size={20}/></span><strong>{name}</strong><i/></div>})}</div>
    <div className="wire" style={{left:point(Math.min(step.from,step.to)),right:(100-parseFloat(point(Math.max(step.from,step.to))))+'%'}}>
      <span className={'arrow '+(step.from>step.to?'reverse':'')}/>
    </div>
    <motion.span key={topic.id+index} className="packet" initial={{left:point(step.from)}} animate={{left:point(step.to)}} transition={{duration:.85,ease:'easeInOut'}}><Code2 size={14}/></motion.span>
    <span className="wire-label">{step.title}</span>
  </div>
}
function Inspector({topic,index}:{topic:Topic;index:number}) {
 const step=topic.steps[index]
 return <div className="inspector">
  <section className="panel"><div className="panelhead"><BookOpen size={16}/> STEP EXPLANATION</div><div className="explain"><h3>{step.title}</h3><p>{step.body}</p><aside><ShieldAlert size={16}/><div><strong>Security note</strong><p>{step.note}</p></div></aside></div></section>
  <section className="panel"><div className="panelhead"><Terminal size={16}/> LIVE PAYLOAD <span className="live"><i/> SAMPLE</span></div><pre>{step.wire.split('\n').map((line,i)=><div key={i}><span className="lineno">{i+1}</span>{line.split(/("[^"]*"|\b(?:GET|POST|DELETE|SELECT|SET|HTTP\/1\.1)\b)/g).map((part,j)=><span key={j} className={j%2?'syntax':''}>{part}</span>)}</div>)}</pre></section>
 </div>
}
const questions = [
 ['What does the browser store in a typical server-side session?', 'An opaque session ID','The complete session record','The password hash',0,'The cookie identifies a record held in the session store.'],
 ['What does PKCE bind to the authorization code exchange?', 'The API response','The verifier used to derive the original challenge','The TLS certificate',1,'The provider checks whether the verifier matches the original challenge.'],
 ['Which model follows a graph of user-to-resource relationships?', 'RBAC','ABAC','ReBAC',2,'ReBAC resolves relationships such as group membership and inherited access.'],
 ['Which interface lets a caller select specific fields from a typed schema?', 'GraphQL','gRPC','REST',0,'A GraphQL selection set specifies which fields to return.'],
 ['Where should a microservice enforce object-level access?', 'Only in the browser','At the service protecting the object','Only at login',1,'The service should check whether the verified principal can access the object.']
] as const
function Exam({score,onScore}:{score?:number;onScore:(score:number)=>void}) {
 const [answers,setAnswers]=useState<Record<number,number>>({})
 const [graded,setGraded]=useState(false)
 return <><div className="eyebrow"><GraduationCap size={15}/> KNOWLEDGE CHECK</div><h1>Take an Exam</h1><p className="summary">Test your understanding across authentication, authorization, and architecture.</p>
 {score!==undefined&&<p className="summary">Last score · {score} / {questions.length}</p>}
 <div className="exam">{questions.map(([prompt,...rest],i)=>{const [a,b,c,correct,explanation]=rest;return <fieldset className="panel" key={prompt}><legend>{i+1}. {prompt}</legend>{[a,b,c].map((label,j)=><label key={label}><input type="radio" name={'q'+i} checked={answers[i]===j} disabled={graded} onChange={()=>setAnswers({...answers,[i]:j})}/>{label}</label>)}{graded&&<p className={answers[i]===correct?'correct':'feedback'}>{answers[i]===correct?'Correct. ':'Incorrect. '}{explanation}</p>}</fieldset>})}</div>
 <button className="primary" disabled={!graded&&Object.keys(answers).length<questions.length} onClick={()=>{if(graded){setAnswers({});setGraded(false)}else{onScore(questions.filter((q,i)=>answers[i]===q[4]).length);setGraded(true)}}}>{graded?'Retake exam':'Submit answers'}</button></>
}
function App(){
 const [topic,setTopic]=useState(initialTopic)
 const [mode,setMode]=useState(0)
 const [filter,setFilter]=useState(0)
 const [step,setStep]=useState(0)
 const [playing,setPlaying]=useState(false)
 const [progress,setProgress]=useState(loadProgress)
 const [compare,setCompare]=useState<[Topic,Topic]>([topics[0],topics[1]])
 const [search,setSearch]=useState(false)
 const [query,setQuery]=useState('')
 const end=(mode===1?Math.max(...compare.map(t=>t.steps.length)):topic.steps.length)-1
 const select=(t:Topic)=>{setTopic(t);setMode(0);setStep(0);setPlaying(false);setSearch(false);setQuery('');if(filter&&filter!==t.group+1)setFilter(0);const url=new URL(location.href);url.searchParams.set('topic',t.id);if(url.href!==location.href)history.pushState(null,'',url)}
 const changeMode=(next:number)=>{setMode(next);setStep(0);setPlaying(false);if(next===1)setCompare([topic,topic===topics[0]?topics[1]:topics[0]])}
 const matches=topics.filter(t=>[t.title,t.id,groups[t.group],t.summary,...t.trade,...t.actors,...t.steps.flatMap(s=>[s.title,s.wire,s.body,s.note])].join(' ').toLowerCase().includes(query.trim().toLowerCase()))
 const move=(next:number)=>{setPlaying(false);setStep(Math.max(0,Math.min(next,end)))}
 useEffect(()=>{try{localStorage.setItem('auth-stack-progress',JSON.stringify(progress))}catch{/* Storage may be disabled. */}},[progress])
 useEffect(()=>{const pop=()=>{setTopic(initialTopic());setMode(0);setFilter(0);setStep(0);setPlaying(false)};addEventListener('popstate',pop);return()=>removeEventListener('popstate',pop)},[])
 useEffect(()=>{if(!playing)return;if(step>=end){setPlaying(false);return}const timer=setTimeout(()=>setStep(step+1),2200);return()=>clearTimeout(timer)},[step,end,playing])
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setSearch(true)}if(e.key==='Escape')setSearch(false);if(search||mode===2||(e.target instanceof HTMLElement&&e.target.closest('input,select,textarea,button')))return;if(e.key==='ArrowLeft')move(step-1);if(e.key==='ArrowRight')move(step+1)};addEventListener('keydown',key);return()=>removeEventListener('keydown',key)},[step,end,search,mode])
 const controls=<div className="controls"><button aria-label="Previous step" disabled={step===0} onClick={()=>move(step-1)}><ArrowLeft size={16}/></button><button className="play" onClick={()=>{if(!playing&&step===end)setStep(0);setPlaying(!playing)}}>{playing?<Pause size={15}/>:<Play size={15}/>} {playing?'Pause':'Auto-play'}</button><button aria-label="Next step" disabled={step===end} onClick={()=>move(step+1)}><ArrowRight size={16}/></button></div>
 const percent=Math.round(progress.done.length/topics.length*100)
 return <MotionConfig reducedMotion="user"><header className="top"><div className="topline"><a className="brand" href="./"><span><Activity size={21}/></span> AUTH <b>&</b> STACK EXPLORER</a><button className="search" onClick={()=>setSearch(true)}><Search size={16}/> <span>Search flows and concepts…</span><kbd>Ctrl K</kbd></button><div className="progress"><div><span>Learning progress</span><strong>{percent}%</strong></div><progress max={topics.length} value={progress.done.length}/><small>{progress.done.length} / {topics.length} modules</small></div></div>
 <nav className="modes" aria-label="Learning mode">{[[BookOpen,'Explore Flows'],[GitCompareArrows,'Compare Stacks'],[GraduationCap,'Take an Exam']].map(([Icon,label],i)=>{const ModeIcon=Icon as typeof BookOpen;return <button key={i} aria-pressed={mode===i} onClick={()=>changeMode(i)}><ModeIcon size={16}/>{String(label)}</button>})}</nav></header>
 <div className="layout"><aside className="sidebar"><div className="side-title">MODULE LIBRARY <span>{topics.length}</span></div><div className="filters">{filters.map((f,i)=><button key={f} aria-pressed={filter===i} onClick={()=>setFilter(i)}>{f}</button>)}</div>
 {groups.map((g,i)=>{const Icon=icons[i];return (filter===0||filter===i+1)&&<div className="group" key={g}><div className="group-title"><Icon size={14}/>{g}</div>{topics.filter(t=>t.group===i).map(t=><button key={t.id} aria-current={t===topic&&mode===0?'page':undefined} onClick={()=>select(t)}><span>{t.title}</span>{progress.done.includes(t.id)?<Check size={14}/>:t===topic&&mode===0?<ChevronRight size={14}/>:null}</button>)}</div>})}
 </aside><main>
 {mode===0&&<><div className="breadcrumb">Explore Flows <ChevronRight size={13}/> {groups[topic.group]}</div><div className="eyebrow"><Shield size={13}/> {groups[topic.group]}</div><h1>{topic.title}</h1><p className="summary">{topic.summary}</p>
 <section className="panel flow"><div className="panelhead"><Activity size={17}/> FLOW DIAGRAM <span className="step-counter">STEP {String(step+1).padStart(2,'0')} / {String(end+1).padStart(2,'0')}</span></div><Diagram topic={topic} index={step}/><div className="toolbar">{controls}<span className="keyhint"><kbd>←</kbd> <kbd>→</kbd> to navigate</span></div></section>
 <Inspector topic={topic} index={step}/>
 <section className="timeline"><div className="side-title">STEP TIMELINE <span>{end+1} STEPS</span></div><div className="pills">{topic.steps.map((s,i)=><button key={s.title} aria-pressed={i===step} onClick={()=>move(i)}><b>{String(i+1).padStart(2,'0')}</b>{s.title}</button>)}</div></section>
 <div className="finish"><button className="primary" disabled={step!==end||progress.done.includes(topic.id)} onClick={()=>setProgress({...progress,done:[...progress.done,topic.id]})}><Check size={16}/>{progress.done.includes(topic.id)?'Module complete':'Mark module complete'}</button></div></>}
 {mode===1&&<><div className="eyebrow"><GitCompareArrows size={15}/> SIDE-BY-SIDE</div><h1>Compare Stacks</h1><p className="summary">Choose two modules and advance both flows together.</p><div className="compare-controls">{controls}<span className="step-counter">STEP {step+1} / {end+1}</span></div><div className="compare">{compare.map((t,i)=>{const index=Math.min(step,t.steps.length-1);return <section key={i}><label className="select-label">Module {i+1}<select value={t.id} onChange={e=>{const selection=topics.find(item=>item.id===e.target.value)!;setCompare(i===0?[selection,compare[1]]:[compare[0],selection]);move(0)}}>{topics.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}</select></label><div className="panel flow"><div className="panelhead"><Activity size={16}/>{step>index?'FLOW COMPLETE':t.steps[index].title}</div><Diagram topic={t} index={index}/></div><Inspector topic={t} index={index}/></section>})}</div><div className="panel matrix"><div className="panelhead">COMPARISON MATRIX</div><table><thead><tr><th>Trade-off</th>{compare.map((t,i)=><th key={i}>{t.title}</th>)}</tr></thead><tbody>{['Scalability','Revocation difficulty','Operational complexity'].map((label,i)=><tr key={label}><th scope="row">{label}</th>{compare.map((t,j)=><td key={j}>{t.trade[i]}</td>)}</tr>)}</tbody></table></div></>}
 {mode===2&&<Exam score={progress.score} onScore={score=>setProgress({...progress,score})}/>}
 </main></div>
 {search&&<div className="overlay" onClick={()=>setSearch(false)}><dialog open aria-modal="true" aria-label="Search modules" onClick={e=>e.stopPropagation()}><div className="searchline"><Search size={19}/><input autoFocus placeholder="Search flows and concepts…" aria-label="Search flows and concepts" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&matches[0])select(matches[0])}}/><button aria-label="Close search" onClick={()=>setSearch(false)}><X size={18}/></button></div><div className="results">{matches.length?matches.map(t=><button key={t.id} onClick={()=>select(t)}>{t.title}<span>{groups[t.group]}</span></button>):<p>No matching modules.</p>}</div></dialog></div>}
 </MotionConfig>
}
createRoot(document.getElementById('root')!).render(<App/>)
