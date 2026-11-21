import React, { useEffect, useMemo, useState } from 'react';
import { Trophy, Dices, Users, Clock3, RotateCcw, Volume2, VolumeX, Crown, BookOpen, Flag, X, Check, ArrowRight, Sparkles } from 'lucide-react';

const COLORS = ['#e9ad36', '#e65e49', '#3986a0', '#8a6ab4', '#4b956b'];
const PAWNS = ['🦁', '🐘', '🦒', '🦓', '🐆'];
const QUESTIONS = {
  red: [
    {q:'In which year did Kenya gain independence?',a:'1963',topic:'History'},
    {q:'Who was Kenya’s first President?',a:'Jomo Kenyatta',topic:'History'},
    {q:'What is the capital city of Kenya?',a:'Nairobi',topic:'Places'},
    {q:'Which date is celebrated as Jamhuri Day?',a:'12 December',topic:'National celebrations'},
    {q:'What is the name of Kenya’s national anthem?',a:'Ee Mungu Nguvu Yetu',topic:'Culture'},
    {q:'Which ocean borders Kenya to the southeast?',a:'The Indian Ocean',topic:'Geography'},
    {q:'What is the highest mountain in Kenya?',a:'Mount Kenya',topic:'Geography'},
    {q:'Which Kenyan athlete is famous for the 800-metre world record set in 2012?',a:'David Rudisha',topic:'Sport'},
    {q:'What is the name of Kenya’s largest lake by surface area?',a:'Lake Victoria (Kenya shares it with other countries)',topic:'Geography'},
    {q:'Which Kenyan town is associated with the annual Lamu Cultural Festival?',a:'Lamu',topic:'Culture'},
    {q:'What is the currency of Kenya?',a:'Kenyan shilling',topic:'Civics'},
    {q:'Which national park is famous for the annual wildebeest migration?',a:'Maasai Mara National Reserve',topic:'Wildlife'},
    {q:'What is the official language widely used in national government alongside English?',a:'Kiswahili',topic:'Language'},
    {q:'Which Kenyan freedom fighter was known as the “Mau Mau Field Marshal”?',a:'Dedan Kimathi',topic:'History'},
    {q:'What is the name of Kenya’s parliament building city?',a:'Nairobi',topic:'Civics'},
    {q:'Which coastal city is home to Fort Jesus?',a:'Mombasa',topic:'Heritage'},
    {q:'What is the name of the annual national day celebrated on 1 June?',a:'Madaraka Day',topic:'National celebrations'},
    {q:'Which lake in the Rift Valley is famous for flamingos?',a:'Lake Nakuru (also Lake Bogoria)',topic:'Wildlife'},
    {q:'What is Kenya’s national flower?',a:'The orchid',topic:'Nature'},
    {q:'Which Kenyan long-distance runner won the men’s marathon at the 2016 Rio Olympics?',a:'Eliud Kipchoge',topic:'Sport'}
  ],
  black: [
    {q:'Name one of Kenya’s neighbouring countries.',a:'Tanzania, Uganda, South Sudan, Ethiopia or Somalia',topic:'Geography'},
    {q:'What does “Harambee” mean?',a:'Pulling together / working together',topic:'Culture'},
    {q:'Name one of Kenya’s official languages.',a:'Kiswahili or English',topic:'Language'},
    {q:'Which county is home to the city of Kisumu?',a:'Kisumu County',topic:'Counties'},
    {q:'What is the name of the famous railway museum in Nairobi?',a:'Nairobi Railway Museum',topic:'Heritage'},
    {q:'Which Kenyan community is traditionally associated with the Isukuti dance?',a:'The Luhya',topic:'Culture'},
    {q:'Name the Kenyan athlete nicknamed “The Pocket Rocket”.',a:'Faith Kipyegon',topic:'Sport'},
    {q:'Which is Kenya’s largest county by area?',a:'Turkana County',topic:'Counties'},
    {q:'What is the name of Kenya’s legislature?',a:'Parliament',topic:'Civics'},
    {q:'Which national reserve is located in Samburu County?',a:'Samburu National Reserve',topic:'Wildlife'},
    {q:'What is the name of the traditional Swahili carved wooden door style?',a:'Zanzibar / Swahili carved door',topic:'Heritage'},
    {q:'Name one UNESCO World Heritage Site in Kenya.',a:'Examples: Lamu Old Town, Fort Jesus, Lake Turkana National Parks',topic:'Heritage'},
    {q:'Which Kenyan city is known as the “Green City in the Sun”?',a:'Nairobi',topic:'Places'},
    {q:'What is the name of Kenya’s famous long-distance train service between Nairobi and Mombasa?',a:'Madaraka Express',topic:'Transport'},
    {q:'Which Kenyan lake is the world’s largest permanent desert lake?',a:'Lake Turkana',topic:'Geography'},
    {q:'Which day commemorates the heroes and heroines of Kenya?',a:'Mashujaa Day — 20 October',topic:'National celebrations'},
    {q:'What is the name of the traditional Maasai jumping dance?',a:'Adumu',topic:'Culture'},
    {q:'Which Kenyan town is famous for its connection to the equator and tea?',a:'Kericho',topic:'Places'},
    {q:'Name one of Kenya’s “Big Five” wild animals.',a:'Lion, elephant, buffalo, leopard or rhinoceros',topic:'Wildlife'},
    {q:'Which Kenyan port city is the country’s main seaport?',a:'Mombasa',topic:'Transport'}
  ]
};

const makeSpaces = () => Array.from({length:40}, (_,i) => {
  if (i===0) return {type:'start',label:'START',short:'GO'};
  if (i===10 || i===30) return {type:'court',label:'SUPREME COURT',short:'COURT'};
  if ([4,14,24,34].includes(i)) return {type:'bonus',label:'HERITAGE BONUS',short:'BONUS'};
  if ([7,17,27,37].includes(i)) return {type:'rest',label:'TAKE A BREATHER',short:'REST'};
  return {type: i%2===0 ? 'red':'black',label:i%2===0?'RED CARD':'BLACK CARD',short:i%2===0?'RED':'BLACK'};
});

const shufflePick = (arr, used) => {
  const available = arr.map((v,i)=>({...v,_i:i})).filter(v=>!used.includes(v._i));
  const pool = available.length ? available : arr.map((v,i)=>({...v,_i:i}));
  return pool[Math.floor(Math.random()*pool.length)];
};

function Setup({onStart}) {
  const [count,setCount] = useState(2);
  const [names,setNames] = useState(['Team 1','Team 2','Team 3','Team 4','Team 5']);
  return <main className="setup-wrap">
    <div className="setup-hero">
      <div className="eyebrow"><span className="dot"/> THE KENYAN HERITAGE GAME</div>
      <h1>KENYA <em>AT 50</em></h1>
      <p className="tagline">Explore our story. Celebrate our heritage. Play together.</p>
      <div className="hero-art"><span className="sun"/> <span className="mountain m1"/> <span className="mountain m2"/> <span className="acacia">♣</span><span className="elephant">🐘</span><span className="lion">🦁</span></div>
    </div>
    <section className="setup-card">
      <div className="section-kicker">01 / GAME SETUP</div>
      <h2>Who's playing today?</h2>
      <p className="muted">Choose your teams and give each one a name.</p>
      <div className="team-count">
        <span>Number of teams</span>
        <div className="stepper"><button onClick={()=>setCount(Math.max(2,count-1))} aria-label="Fewer teams">−</button><strong>{count}</strong><button onClick={()=>setCount(Math.min(5,count+1))} aria-label="More teams">+</button></div>
      </div>
      <div className="team-inputs">
        {names.slice(0,count).map((n,i)=><label className="team-input" key={i}><span style={{background:COLORS[i]}}>{PAWNS[i]}</span><input value={n} maxLength={18} onChange={e=>setNames(old=>old.map((x,j)=>j===i?e.target.value:x))} aria-label={`Team ${i+1} name`}/></label>)}
      </div>
      <div className="rules-note"><BookOpen size={18}/><span><b>Quick rules</b> Roll, move, answer a card when you land on a red or black space. Each correct answer earns 5 points. First team to 500 points wins.</span></div>
      <button className="primary-btn full" onClick={()=>onStart(names.slice(0,count).map((name,i)=>({name:name.trim()||`Team ${i+1}`,color:COLORS[i],pawn:PAWNS[i],position:0,score:0})))}>START THE GAME <ArrowRight size={18}/></button>
    </section>
    <p className="disclaimer">An independent digital tribute inspired by Kenyan heritage and the known play style of Kenya at 50. Not an official edition.</p>
  </main>
}

function App() {
  const [teams,setTeams] = useState(null);
  const [turn,setTurn] = useState(0);
  const [die,setDie] = useState(null);
  const [rolling,setRolling] = useState(false);
  const [card,setCard] = useState(null);
  const [answerShown,setAnswerShown] = useState(false);
  const [seconds,setSeconds] = useState(50);
  const [timerOn,setTimerOn] = useState(false);
  const [used,setUsed] = useState({red:[],black:[]});
  const [winner,setWinner] = useState(null);
  const [message,setMessage] = useState('Roll the dice to begin.');
  const [sound,setSound] = useState(false);
  const spaces = useMemo(makeSpaces,[]);
  const current = teams?.[turn];
  const positions = useMemo(()=>spaces.map((_,i)=>i),[spaces]);

  useEffect(()=>{
    if (!timerOn || seconds<=0) return;
    const id=setTimeout(()=>setSeconds(s=>s-1),1000);
    return ()=>clearTimeout(id);
  },[timerOn,seconds]);
  useEffect(()=>{if(seconds===0)setTimerOn(false)},[seconds]);

  const updateTeam = (idx,patch) => setTeams(old=>old.map((t,i)=>i===idx?{...t,...patch}:t));
  const roll = () => {
    if(rolling || card || winner) return;
    setRolling(true); setMessage('The dice are rolling…');
    let count=0;
    const anim=setInterval(()=>{
      setDie(1+Math.floor(Math.random()*6)); count++;
      if(count>=10){clearInterval(anim); const value=1+Math.floor(Math.random()*6); setDie(value); setRolling(false); move(value);}
    },85);
  };
  const move = (value) => {
    const next=(current.position+value)%40;
    const passed=current.position+value>=40;
    updateTeam(turn,{position:next,score:current.score+(passed?10:0)});
    const space=spaces[next];
    if(space.type==='red'||space.type==='black'){
      const chosen=shufflePick(QUESTIONS[space.type],used[space.type]);
      setUsed(old=>({...old,[space.type]:[...old[space.type],chosen._i]}));
      setCard({...chosen,kind:space.type,team:turn,space:next});
      setAnswerShown(false); setSeconds(50); setTimerOn(false);
      setMessage(`${current.name} landed on a ${space.type} card.`);
    } else if(space.type==='court'){
      setCard({kind:'court',q:'SUPREME COURT CHALLENGE',a:'Choose a player from another team to answer a Kenya knowledge question. If they answer correctly, they earn 5 points; if not, your team earns 5 points.',topic:'Special card',team:turn,space:next});
      setAnswerShown(false); setSeconds(50); setTimerOn(false);
    } else if(space.type==='bonus'){
      updateTeam(turn,{position:next,score:current.score+(passed?10:0)+10});
      setMessage(`${current.name} landed on Heritage Bonus: +10 points!`);
      advanceTurn();
    } else {
      setMessage(space.type==='rest'?`${current.name} takes a breather.`:`${current.name} is on ${space.label}.`);
      advanceTurn();
    }
  };
  const advanceTurn=()=>{setTurn(t=>(t+1)%teams.length);setDie(null)};
  const resolveCard=(correct)=>{
    const idx=card.team;
    if(correct){
      setTeams(old=>old.map((t,i)=>i===idx?{...t,score:t.score+5}:t));
      setMessage(`${teams[idx].name} earns 5 points. Well played!`);
    } else setMessage(`No points this time. Keep learning!`);
    setTimerOn(false);setCard(null);setAnswerShown(false);
    const score=(teams[idx]?.score||0)+(correct?5:0);
    if(score>=500){setWinner({...teams[idx],score});}
    else {setTurn(t=>(t+1)%teams.length);setDie(null)}
  };
  const reset=()=>{setTeams(null);setTurn(0);setDie(null);setCard(null);setWinner(null);setUsed({red:[],black:[]});setMessage('Roll the dice to begin.')};
  const getSpaceStyle=(i)=>{
    const angle=(i/40)*Math.PI*2-Math.PI/2, radius=40;
    return {left:`${50+radius*Math.cos(angle)}%`,top:`${50+radius*Math.sin(angle)}%`};
  };
  if(!teams) return <Setup onStart={setTeams}/>;

  return <div className="game-shell">
    <header className="topbar"><div className="brand-mark">K<span>50</span></div><div className="top-brand"><b>KENYA AT 50</b><small>THE HERITAGE BOARD GAME</small></div><div className="top-actions"><button className="icon-btn" onClick={()=>setSound(!sound)} title="Toggle sound">{sound?<Volume2/>:<VolumeX/>}</button><button className="icon-btn" onClick={reset} title="New game"><RotateCcw/></button></div></header>
    <div className="game-heading"><div><div className="section-kicker">LOCAL MULTIPLAYER · {teams.length} TEAMS</div><h1>Game <em>board</em></h1></div><div className="turn-pill"><span style={{background:current.color}}/>{current.name}'s turn</div></div>
    <div className="game-layout">
      <section className="board-panel">
        <div className="board" aria-label="Circular game board">
          <div className="board-inner">
            <div className="board-center"><div className="center-sun">☀</div><div className="center-title">KENYA<br/><em>AT 50</em></div><div className="center-sub">OUR HERITAGE · OUR STORY</div><div className="center-stripe"><i/><i/><i/></div><div className="center-wildlife">🦒　🦁　🐘</div></div>
            {spaces.map((s,i)=><div key={i} className={`space space-${s.type}`} style={getSpaceStyle(i)}><span className="space-num">{i+1}</span><b>{s.short}</b>{teams.filter(t=>t.position===i).map(t=><span key={t.name} className="pawn" style={{background:t.color}} title={t.name}>{t.pawn}</span>)}</div>)}
          </div>
        </div>
        <div className="board-legend"><span><i className="legend-dot red"/> Red question</span><span><i className="legend-dot black"/> Black question</span><span><i className="legend-dot gold"/> Special space</span></div>
      </section>
      <aside className="side-panel">
        <div className="turn-card">
          <div className="section-kicker">CURRENT PLAYER</div>
          <div className="current-team"><span className="big-pawn" style={{background:current.color}}>{current.pawn}</span><div><h3>{current.name}</h3><small>Ready for your turn?</small></div></div>
          <div className="dice-area"><div className={`die ${rolling?'shake':''}`}>{die||'?'}</div><button className="primary-btn roll-btn" onClick={roll} disabled={rolling||!!card||!!winner}><Dices size={19}/> {rolling?'ROLLING…':'ROLL THE DICE'}</button></div>
          <p className="status-message">{message}</p>
        </div>
        <div className="score-card"><div className="card-heading"><h3><Trophy size={17}/> SCOREBOARD</h3><span>FIRST TO 500</span></div>
          {teams.map((t,i)=><div className={`score-row ${i===turn?'active':''}`} key={t.name}><span className="score-pawn" style={{background:t.color}}>{t.pawn}</span><div className="score-name"><b>{t.name}</b><div className="progress"><i style={{width:`${Math.min(100,t.score/5)}%`,background:t.color}}/></div></div><strong>{t.score}<small> pts</small></strong></div>)}
        </div>
        <div className="how-card"><div className="how-icon"><Flag size={18}/></div><div><b>How to play</b><p>Roll the dice, move your token, and answer a card when you land on a coloured space. Correct answer = 5 points.</p></div></div>
      </aside>
    </div>
    <footer className="game-footer"><span>🇰🇪 MADE FOR THE LOVE OF KENYA</span><span>PASS THE DEVICE TO THE NEXT TEAM AFTER EACH TURN</span></footer>

    {card&&<div className="modal-backdrop"><div className="question-modal"><button className="close-modal" onClick={()=>resolveCard(false)} aria-label="Close"><X/></button><div className={`card-ribbon ${card.kind}`}>{card.kind==='red'?'RED QUESTION CARD':card.kind==='black'?'BLACK QUESTION CARD':'SUPREME COURT CARD'}</div><div className="question-topic">{card.topic}</div><h2>{card.q}</h2>{answerShown?<div className="answer-box"><span>ANSWER</span><p>{card.a}</p></div>:<p className="answer-hint">Discuss your answer with your team before revealing.</p>}
          <div className="timer-row"><div className={`timer ${seconds<=10?'urgent':''}`}><Clock3 size={17}/><b>00:{String(seconds).padStart(2,'0')}</b></div><button className="timer-button" onClick={()=>setTimerOn(!timerOn)}>{timerOn?'Pause timer':'Start 50-second timer'}</button></div>
          {!answerShown?<button className="primary-btn full" onClick={()=>setAnswerShown(true)}>REVEAL ANSWER</button>:<div className="answer-actions"><button className="wrong-btn" onClick={()=>resolveCard(false)}>Not correct</button><button className="correct-btn" onClick={()=>resolveCard(true)}><Check size={17}/> Correct · +5 points</button></div>}
          <small className="modal-foot">Agree as a group whether the answer is correct. The host records the result.</small>
        </div></div>}
    {winner&&<div className="modal-backdrop"><div className="winner-modal"><div className="winner-crown"><Crown size={42}/></div><div className="section-kicker">GAME COMPLETE</div><h2>{winner.name}</h2><h3>ARE THE CHAMPIONS!</h3><p>{winner.score} points · What a performance.</p><button className="primary-btn full" onClick={reset}><RotateCcw size={18}/> PLAY AGAIN</button></div></div>}
  </div>
}

export default App;
