import { useState, useEffect, useCallback } from "react";

// ─── THEME ────────────────────────────────────────────────────────────────────
const C = {
  bg:"#08051a", surface:"#110d2a", card:"#1a1438",
  border:"#2d1f5e", p700:"#7e22ce", p500:"#a855f7", p400:"#c084fc",
  pink:"#ec4899", teal:"#14b8a6", amber:"#f59e0b",
  green:"#22c55e", red:"#ef4444", text:"#f0ebff", muted:"#7c6aaa",
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
html,body{height:100%;background:${C.bg};}
body{font-family:'Outfit',sans-serif;color:${C.text};}
input,select,textarea,button{font-family:'Outfit',sans-serif;}
::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px;}
.fade{animation:fu .22s ease;}@keyframes fu{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
.tap:active{transform:scale(.96);opacity:.85;}
.pulse{animation:pl 2s infinite;}@keyframes pl{0%,100%{opacity:1}50%{opacity:.55}}
textarea{resize:vertical;}select option{background:${C.surface};}
.inp{background:${C.surface};border:1px solid ${C.border};border-radius:10px;padding:10px 12px;color:${C.text};font-size:14px;outline:none;width:100%;font-family:'Outfit',sans-serif;}
.inp:focus{border-color:${C.p500};}
.screen{height:calc(100vh - 116px);overflow-y:auto;padding:18px 16px 32px;-webkit-overflow-scrolling:touch;}
`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const mkDate    = d => { const x=new Date(); x.setDate(x.getDate()-d); return x.toISOString().split("T")[0]; };
const addPeriod = (date,val,unit) => { const d=new Date(date); if(unit==="months") d.setMonth(d.getMonth()+parseInt(val)); else d.setDate(d.getDate()+parseInt(val)*30); return d.toISOString().split("T")[0]; };
const daysLeft  = exp => Math.ceil((new Date(exp)-new Date())/86400000);
const daysSince = date => Math.max(0,Math.floor((new Date()-new Date(date))/86400000));
const rupees    = n => "₹"+Number(n).toLocaleString("en-IN");
const uid       = () => Date.now()+"_"+Math.random().toString(36).slice(2);

// ─── STORAGE HELPERS ──────────────────────────────────────────────────────────
const STORE_KEY = "zenora_gym_v3";

const loadStore = (userId) => {
  try {
    const raw = localStorage.getItem(STORE_KEY+"_"+userId);
    return raw ? JSON.parse(raw) : null;
  } catch(e) { return null; }
};

const saveStore = (userId, data) => {
  try { localStorage.setItem(STORE_KEY+"_"+userId, JSON.stringify(data)); } catch(e) {}
};

// Users list
const USERS_KEY = "zenora_users";
const loadUsers = () => { try { return JSON.parse(localStorage.getItem(USERS_KEY)||"[]"); } catch(e){ return []; } };
const saveUsers = (u) => { try { localStorage.setItem(USERS_KEY, JSON.stringify(u)); } catch(e) {} };

// ─── DEFAULT DATA ─────────────────────────────────────────────────────────────
const INIT_GOALS = ["Fat Loss","Muscle Gain","General Fitness","Endurance","Flexibility"];
const INIT_TRAINERS = ["Ravi Kumar","Sneha Joshi","Arjun Nair","No Trainer"];
const INIT_PLANS = [
  {id:"p1", label:"1 Month",  value:1,  unit:"months", price:1200},
  {id:"p3", label:"3 Months", value:3,  unit:"months", price:3000},
  {id:"p6", label:"6 Months", value:6,  unit:"months", price:5500},
  {id:"p12",label:"12 Months",value:12, unit:"months", price:9999},
];
const FESTIVALS = ["Diwali","Holi","Eid","Christmas","New Year","Independence Day","Navratri","Raksha Bandhan"];

const INIT_MSGS = {
  welcome_d1:"🎉 Welcome to {gym_name}, {name}! We're thrilled to have you join our fitness family. Today is Day 1 of your transformation. Let's crush it! 💪",
  welcome_d2:"👋 Hi {name}! Day 2 at {gym_name}. Have you met your trainer {trainer} yet? They've planned the perfect program for you. Book your first session today!",
  welcome_d3:"🏋️ Hey {name}! Quick tip from {gym_name}: Focus on form over weight. Consistency beats intensity every time. See you on the floor! 💪",
  welcome_d5:"🥗 Hi {name}! Nutrition tip: Aim for 1g protein per kg of bodyweight daily. Fuel your gains! Your goal ({goal}) is totally achievable at {gym_name}.",
  welcome_d7:"⭐ Hi {name}, one full week at {gym_name}! Amazing start. How's your experience? Reply 1-5 to rate us. Your feedback helps us improve! 🙏",
  absent_d3:"💪 Hey {name}! We noticed you haven't visited {gym_name} in 3 days. Everything okay? Just come back and we'll pick up where you left off!",
  absent_d5:"🌟 Hi {name}! 5 days since your last visit at {gym_name}. Your {goal} goal is waiting! Every day you show up is a win. Cheering for you! 🏃",
  absent_d7:"❤️ {name}, it's been a week since we saw you at {gym_name}. Your trainer {trainer} misses you! Is everything alright? We're always here to help.",
  absent_d10:"🤝 Hey {name}, 10 days is a long time. At {gym_name} we want you to succeed. Can we help you overcome any challenges? Reply and let's figure it out.",
  winback_d30:"😊 Hey {name}! It's been a month since your last visit to {gym_name}. We genuinely miss you! Your spot is always here whenever you're ready. 💜",
  winback_d45:"🎁 {name}, special offer from {gym_name} just for you! Come back and get 1 FREE personal training session — on us! Valid this week. Reply YES to book!",
  winback_d60:"🔥 {name}, exclusive comeback offer from {gym_name}! We're offering you a special return discount. Reply RETURN to unlock your deal. Restart your journey!",
  expiry_d5:"⏰ Hi {name}! Your {gym_name} membership expires in 5 days ({expiry}). Renew now to keep your streak going! Pay here: {payment_link} 💜",
  expiry_d2:"🚨 {name}! Only 2 days left on your {gym_name} membership. Don't lose your progress — renew today: {payment_link}",
  expiry_d0:"📅 Today is the last day of your {gym_name} membership, {name}! Renew now to continue: {payment_link} Thank you! 🙏",
  payment_thanks:"✅ Payment received! Thank you {name}! Your {gym_name} membership has been renewed until {expiry}. See you soon! 💜🏋️",
  festival:"🎊 {gym_name} wishes you and your family a very Happy {festival}! May this occasion bring joy, health & prosperity. Warm regards! 💐",
  birthday:"🎂 Happy Birthday {name}! The entire {gym_name} family wishes you an incredible birthday! May this year bring health, happiness & all your fitness goals! 🎉🎁",
  motivation:"🔥 {name}, you've got this! Every rep at {gym_name} brings you closer to your goal. Your consistency is your superpower. Keep going! 💪",
};

const defaultAppState = (userId) => ({
  userId,
  gymName:"My Gym",
  gymEmoji:"🏋️",
  gymImage:"",
  payLink:"https://pay.link",
  sendTime:"09:00",
  trainers:[...INIT_TRAINERS],
  plans:[...INIT_PLANS],
  msgs:{...INIT_MSGS},
  autos:{welcome:true,absence:true,expiry:true,festival:true,birthday:true,winback:true,payment:true},
  autosRunning:false,
  members:[],
  msgLogs:[],
});

// ─── SCORE HELPERS ────────────────────────────────────────────────────────────
const riskOf = m => {
  const d = daysSince(m.lastVisit);
  if(d>=7)  return {label:"❌ Lost",   color:C.red,   score:3};
  if(d>=3)  return {label:"⚠️ At Risk",color:C.amber, score:2};
  return          {label:"🔥 Active", color:C.green, score:1};
};
const churnScore = m => Math.min(100,Math.round((1-m.attendance.filter(Boolean).length/Math.max(m.attendance.length,1))*50+daysSince(m.lastVisit)*3));
const consistencyScore = m => { const l=m.attendance.slice(-7); return Math.round(l.filter(Boolean).length/Math.max(l.length,1)*100); };
const payScore = m => { const r=Math.round(m.attendance.filter(Boolean).length/Math.max(m.attendance.length,1)*100); return m.paid?Math.min(95,r+10):Math.max(20,r-20); };

const fmtMsg = (t,m={},G={}) => (t||"")
  .replace(/{name}/g,m.name||"Member")
  .replace(/{gym_name}/g,G.gym||"Your Gym")
  .replace(/{trainer}/g,m.trainer||"your trainer")
  .replace(/{goal}/g,m.goal||"fitness goal")
  .replace(/{expiry}/g,m.expiry||"")
  .replace(/{payment_link}/g,G.link||"https://pay.link")
  .replace(/{festival}/g,G.festival||"");

// ─── ATOMS ────────────────────────────────────────────────────────────────────
const Tag = ({text,color=C.p500,size=11}) => (
  <span style={{background:color+"22",color,border:`1px solid ${color}44`,borderRadius:20,padding:`2px ${size<12?"8":"10"}px`,fontSize:size,fontWeight:700,whiteSpace:"nowrap"}}>{text}</span>
);
const Btn = ({children,onClick,color=C.p500,ghost,small,full,danger,disabled,style:s={}}) => (
  <button className="tap" onClick={onClick} disabled={disabled} style={{background:danger?C.red:ghost?color+"20":color,color:danger?"#fff":ghost?color:"#fff",border:ghost?`1px solid ${color}44`:"none",borderRadius:12,padding:small?"7px 14px":"11px 18px",fontWeight:700,fontSize:small?12:14,cursor:disabled?"not-allowed":"pointer",opacity:disabled?.5:1,width:full?"100%":"auto",...s}}>
    {children}
  </button>
);
const Card = ({children,style:s={},accent,onClick}) => (
  <div onClick={onClick} style={{background:C.card,border:`1px solid ${accent?accent+"55":C.border}`,borderRadius:18,padding:16,boxShadow:accent?`0 0 20px ${accent}12`:"none",cursor:onClick?"pointer":"default",...s}}>
    {children}
  </div>
);
const Section = ({title,children,action}) => (
  <div style={{marginBottom:22}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <div style={{fontWeight:800,fontSize:16}}>{title}</div>
      {action}
    </div>
    {children}
  </div>
);
const Toggle = ({on,onChange}) => (
  <div onClick={onChange} style={{width:44,height:24,borderRadius:12,background:on?C.p500:C.border,position:"relative",cursor:"pointer",transition:"background .25s",flexShrink:0}}>
    <div style={{position:"absolute",top:3,left:on?23:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left .25s"}} />
  </div>
);
const PBar = ({value,color}) => (
  <div style={{height:5,background:C.border,borderRadius:3,overflow:"hidden"}}>
    <div style={{height:"100%",width:`${value}%`,background:color,borderRadius:3,transition:"width .5s"}} />
  </div>
);
const Modal = ({title,children,onClose}) => (
  <div style={{position:"fixed",inset:0,background:"#000c",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
    <div onClick={e=>e.stopPropagation()} className="fade" style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:"22px 22px 0 0",padding:22,width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <div style={{fontWeight:800,fontSize:17}}>{title}</div>
        <button onClick={onClose} style={{background:C.border,border:"none",color:C.text,fontSize:18,cursor:"pointer",borderRadius:"50%",width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
      </div>
      {children}
    </div>
  </div>
);

// ─── QUEUE MODAL ──────────────────────────────────────────────────────────────
const QueueModal = ({queue,label,onClose,onLog,gymImage}) => {
  const [idx,setIdx] = useState(0);
  const [sent,setSent] = useState(new Set());
  const done = idx>=queue.length;
  const item = queue[idx];
  const openWa = () => {
    let url = `https://wa.me/91${item.phone}?text=${encodeURIComponent(item.text)}`;
    window.open(url,"_blank");
    setSent(s=>new Set([...s,idx]));
    if(onLog) onLog(item.name,label);
  };
  return (
    <div style={{position:"fixed",inset:0,background:"#000d",zIndex:700,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div className="fade" style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:22,padding:24,width:"100%",maxWidth:420}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div><div style={{fontWeight:800,fontSize:16}}>💬 {label}</div><div style={{color:C.muted,fontSize:12,marginTop:2}}>{done?"All done!":idx+1+" of "+queue.length}</div></div>
          <button onClick={onClose} style={{background:C.border,border:"none",color:C.text,fontSize:18,cursor:"pointer",borderRadius:"50%",width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <div style={{height:4,background:C.border,borderRadius:2,marginBottom:18,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${(idx/Math.max(queue.length,1))*100}%`,background:C.p500,borderRadius:2,transition:"width .3s"}} />
        </div>
        {done?(
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{fontSize:48,marginBottom:12}}>✅</div>
            <div style={{fontWeight:800,fontSize:18,marginBottom:6}}>All {sent.size} messages sent!</div>
            <div style={{color:C.muted,fontSize:14,marginBottom:20}}>{queue.length-sent.size} skipped</div>
            <Btn full onClick={onClose}>Done</Btn>
          </div>
        ):(
          <div>
            <div style={{background:C.card,borderRadius:14,padding:14,marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                <div style={{width:38,height:38,borderRadius:10,background:`linear-gradient(135deg,${C.p700},${C.pink})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:"#fff",flexShrink:0}}>{item.name.charAt(0)}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:15}}>{item.name}</div>
                  <div style={{color:C.muted,fontSize:12}}>+91 {item.phone}</div>
                </div>
                {sent.has(idx)&&<Tag text="✓ Opened" color={C.green} />}
              </div>
              {gymImage&&<div style={{marginBottom:10,borderRadius:10,overflow:"hidden",maxHeight:120}}><img src={gymImage} alt="gym" style={{width:"100%",height:120,objectFit:"cover"}} /></div>}
              <div style={{background:C.surface,borderRadius:10,padding:12,fontSize:13,lineHeight:1.65,color:C.text,border:`1px solid ${C.border}`}}>{item.text}</div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <Btn full color="#25D366" onClick={openWa} style={{flex:2}}>{sent.has(idx)?"✓ Opened":"📱 Open WhatsApp"}</Btn>
              <Btn ghost color={C.muted} onClick={()=>setIdx(i=>i+1)} style={{flex:1}}>Skip</Btn>
            </div>
            <div style={{marginTop:10}}>
              <Btn full color={C.p500} onClick={()=>setIdx(i=>i+1)} disabled={!sent.has(idx)}>Next → ({queue.length-idx-1} left)</Btn>
            </div>
          </div>
        )}
        <div style={{display:"flex",gap:3,marginTop:14,flexWrap:"wrap",justifyContent:"center"}}>
          {queue.map((_,i)=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:i<idx?(sent.has(i)?C.green:C.muted):i===idx?C.p500:C.border,transition:"background .3s"}} />)}
        </div>
      </div>
    </div>
  );
};

// ─── ZENORA LOGO ──────────────────────────────────────────────────────────────
const ZenoraLogo = () => (
  <span style={{fontWeight:900,fontSize:15,color:"#ffffff",letterSpacing:1.5,flexShrink:0}}>ZENORA</span>
);

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
const LoginScreen = ({onLogin}) => {
  const [mode,setMode] = useState("login"); // login | register
  const [identifier,setIdentifier] = useState(""); // email or phone
  const [password,setPassword] = useState("");
  const [gymName,setGymName] = useState("");
  const [error,setError] = useState("");
  const [loading,setLoading] = useState(false);

  const handleLogin = () => {
    setError("");
    if(!identifier.trim()||!password.trim()){setError("Enter email/phone and password");return;}
    const users = loadUsers();
    const user = users.find(u=>u.identifier===identifier.trim().toLowerCase());
    if(!user){setError("Account not found. Please register.");return;}
    if(user.password!==password){setError("Wrong password.");return;}
    setLoading(true);
    setTimeout(()=>{ setLoading(false); onLogin(user.id,user.identifier); },600);
  };

  const handleRegister = () => {
    setError("");
    if(!identifier.trim()||!password.trim()||!gymName.trim()){setError("All fields required");return;}
    if(password.length<4){setError("Password must be at least 4 characters");return;}
    const users = loadUsers();
    if(users.find(u=>u.identifier===identifier.trim().toLowerCase())){setError("Account already exists. Please login.");return;}
    const id = uid();
    const newUser = {id,identifier:identifier.trim().toLowerCase(),password,gymName:gymName.trim()};
    saveUsers([...users,newUser]);
    // Save default state with gym name
    const state = defaultAppState(id);
    state.gymName = gymName.trim();
    saveStore(id,state);
    setLoading(true);
    setTimeout(()=>{ setLoading(false); onLogin(id,identifier.trim().toLowerCase()); },600);
  };

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,maxWidth:480,margin:"0 auto"}}>
      {/* Logo */}
      <div style={{textAlign:"center",marginBottom:36}}>
        <div style={{fontWeight:900,fontSize:36,color:"#ffffff",letterSpacing:2,marginBottom:8}}>ZENORA</div>
        <div style={{color:C.muted,fontSize:13}}>AI Gym Management Suite</div>
      </div>

      {/* Card */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:22,padding:28,width:"100%",maxWidth:380}}>
        {/* Tab switcher */}
        <div style={{display:"flex",background:C.surface,borderRadius:12,padding:4,marginBottom:24,gap:4}}>
          {["login","register"].map(m=>(
            <button key={m} onClick={()=>{setMode(m);setError("");}} style={{flex:1,background:mode===m?C.p500:"none",border:"none",borderRadius:9,padding:"9px 0",color:mode===m?"#fff":C.muted,fontWeight:700,fontSize:13,cursor:"pointer",transition:"all .2s",textTransform:"capitalize"}}>
              {m==="login"?"Sign In":"Register"}
            </button>
          ))}
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {mode==="register"&&(
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              <label style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:.8}}>GYM NAME</label>
              <input className="inp" placeholder="e.g. FitZone Pro" value={gymName} onChange={e=>setGymName(e.target.value)} />
            </div>
          )}
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            <label style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:.8}}>EMAIL OR PHONE</label>
            <input className="inp" placeholder="email@example.com or 9876543210" value={identifier} onChange={e=>setIdentifier(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(mode==="login"?handleLogin():handleRegister())} />
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            <label style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:.8}}>PASSWORD</label>
            <input className="inp" type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(mode==="login"?handleLogin():handleRegister())} />
          </div>
          {error&&<div style={{background:C.red+"20",border:`1px solid ${C.red}44`,borderRadius:10,padding:"10px 14px",color:C.red,fontSize:13,fontWeight:600}}>{error}</div>}
          <Btn full color={C.p500} onClick={mode==="login"?handleLogin:handleRegister} disabled={loading}>
            {loading?"Loading...":(mode==="login"?"Sign In →":"Create Account →")}
          </Btn>
        </div>

        <div style={{textAlign:"center",marginTop:18,color:C.muted,fontSize:12}}>
          {mode==="login"?"Don't have an account? ":"Already have an account? "}
          <span style={{color:C.p400,fontWeight:700,cursor:"pointer"}} onClick={()=>{setMode(mode==="login"?"register":"login");setError("");}}>
            {mode==="login"?"Register":"Sign In"}
          </span>
        </div>
      </div>

      <div style={{color:C.muted,fontSize:11,marginTop:20,textAlign:"center"}}>
        Your data saves automatically
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [userId,   setUserId]   = useState(null);
  const [userEmail,setUserEmail]= useState(null);
  const [appReady, setAppReady] = useState(false);

  // All persisted state lives here
  const [gymName,    setGymName_]    = useState("My Gym");
  const [gymEmoji,   setGymEmoji_]   = useState("🏋️");
  const [gymImage,   setGymImage_]   = useState("");
  const [payLink,    setPayLink_]    = useState("https://pay.link");
  const [sendTime,   setSendTime_]   = useState("09:00");
  const [trainers,   setTrainers_]   = useState(INIT_TRAINERS);
  const [plans,      setPlans_]      = useState(INIT_PLANS);
  const [msgs,       setMsgs_]       = useState(INIT_MSGS);
  const [autos,      setAutos_]      = useState({welcome:true,absence:true,expiry:true,festival:true,birthday:true,winback:true,payment:true});
  const [autosRunning,setAutosRunning_]=useState(false);
  const [members,    setMembers_]    = useState([]);
  const [msgLogs,    setMsgLogs_]    = useState([]);

  // UI state (not persisted)
  const [tab,         setTab]         = useState("home");
  const [toast,       setToast]       = useState(null);
  const [modal,       setModal]       = useState(null);
  const [selectedM,   setSelectedM]   = useState(null);
  const [festModal,   setFestModal]   = useState(false);
  const [editMsgKey,  setEditMsgKey]  = useState(null);
  const [aiLoading,   setAiLoading]   = useState(false);
  const [aiOutput,    setAiOutput]    = useState("");
  const [confirmDel,  setConfirmDel]  = useState(null);
  const [queueModal,  setQueueModal]  = useState(null);
  const [filterTrainer,setFilterTrainer]=useState("All");

  // ── AI page state — lives here at App level so it NEVER resets on re-render ─
  const [aiSection,       setAiSection]       = useState("dashboard");
  const [chatInput,       setChatInput]       = useState("");
  const [chatHistory,     setChatHistory]     = useState([]);
  const [churnOutput,     setChurnOutput]     = useState("");
  const [churnLoading,    setChurnLoading]    = useState(false);
  const [marketingOutput, setMarketingOutput] = useState("");
  const [marketingLoading,setMarketingLoading]= useState(false);
  const [marketingLabel,  setMarketingLabel]  = useState("");
  const [filterPlan,   setFilterPlan]  =useState("All");
  const [filterRisk,   setFilterRisk]  =useState("All");
  const [newName,   setNewName]   = useState("");
  const [newPhone,  setNewPhone]  = useState("");
  const [newPlanId, setNewPlanId] = useState("p1");
  const [newTrainer,setNewTrainer]= useState(INIT_TRAINERS[0]);
  const [newGoal,   setNewGoal]   = useState(INIT_GOALS[0]);
  const [newBday,   setNewBday]   = useState("");
  const [newNotes,  setNewNotes]  = useState("");
  const [newJoined, setNewJoined] = useState(mkDate(0)); // editable join date
  const [editData, setEditData] = useState(null);

  // ── Persist helpers ────────────────────────────────────────────────────────
  const buildSnapshot = useCallback((overrides={}) => ({
    userId,
    gymName: overrides.gymName ?? gymName,
    gymEmoji: overrides.gymEmoji ?? gymEmoji,
    gymImage: overrides.gymImage ?? gymImage,
    payLink: overrides.payLink ?? payLink,
    sendTime: overrides.sendTime ?? sendTime,
    trainers: overrides.trainers ?? trainers,
    plans: overrides.plans ?? plans,
    msgs: overrides.msgs ?? msgs,
    autos: overrides.autos ?? autos,
    autosRunning: overrides.autosRunning ?? autosRunning,
    members: overrides.members ?? members,
    msgLogs: overrides.msgLogs ?? msgLogs,
  }), [userId,gymName,gymEmoji,gymImage,payLink,sendTime,trainers,plans,msgs,autos,autosRunning,members,msgLogs]);

  const persist = useCallback((overrides={}) => {
    if(!userId) return;
    const snap = buildSnapshot(overrides);
    saveStore(userId, snap);
  }, [userId, buildSnapshot]);

  // Setters that also persist
  const setGymName     = v => { setGymName_(v);     persist({gymName:v}); };
  const setGymEmoji    = v => { setGymEmoji_(v);    persist({gymEmoji:v}); };
  const setGymImage    = v => { setGymImage_(v);    persist({gymImage:v}); };
  const setPayLink     = v => { setPayLink_(v);     persist({payLink:v}); };
  const setSendTime    = v => { setSendTime_(v);    persist({sendTime:v}); };
  const setTrainers    = v => { setTrainers_(v);    persist({trainers:v}); };
  const setPlans       = v => { setPlans_(v);       persist({plans:v}); };
  const setMsgs        = v => { setMsgs_(v);        persist({msgs:v}); };
  const setAutos       = v => { setAutos_(v);       persist({autos:v}); };
  const setAutosRunning= v => { setAutosRunning_(v);persist({autosRunning:v}); };
  const setMembers     = v => { setMembers_(v);     persist({members:v}); };
  const setMsgLogs     = v => { setMsgLogs_(v);     persist({msgLogs:v}); };

  // ── Load on login ──────────────────────────────────────────────────────────
  const onLogin = (id, email) => {
    setUserId(id);
    setUserEmail(email);
    const saved = loadStore(id);
    if(saved) {
      if(saved.gymName)     setGymName_(saved.gymName);
      if(saved.gymEmoji)    setGymEmoji_(saved.gymEmoji);
      if(saved.gymImage)    setGymImage_(saved.gymImage);
      if(saved.payLink)     setPayLink_(saved.payLink);
      if(saved.sendTime)    setSendTime_(saved.sendTime);
      if(saved.trainers)    setTrainers_(saved.trainers);
      if(saved.plans)       setPlans_(saved.plans);
      if(saved.msgs)        setMsgs_(saved.msgs);
      if(saved.autos)       setAutos_(saved.autos);
      if(saved.autosRunning!==undefined) setAutosRunning_(saved.autosRunning);
      if(saved.members)     setMembers_(saved.members);
      if(saved.msgLogs)     setMsgLogs_(saved.msgLogs);
    }
    setAppReady(true);
  };

  // Auto-persist members whenever they change (after login)
  useEffect(() => { if(appReady && userId) persist(); }, [members, msgLogs]);

  const G = { gym: gymName, link: payLink };
  const notify = (msg,type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null),3200); };
  const logMsg  = (name,label) => setMsgLogs(l=>[{t:new Date().toLocaleTimeString(),name,label},...l.slice(0,99)]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const expiringMembers = members.filter(m=>{ const d=daysLeft(m.expiry); return d>=0&&d<=7; });
  const absentMembers   = members.filter(m=>daysSince(m.lastVisit)>=3);
  const lostMembers     = members.filter(m=>daysSince(m.lastVisit)>=7);
  const unpaidMembers   = members.filter(m=>!m.paid);
  const todayBdays      = members.filter(m=>{ if(!m.birthday)return false; const b=new Date(m.birthday),t=new Date(); return b.getDate()===t.getDate()&&b.getMonth()===t.getMonth(); });
  const revenue         = members.filter(m=>m.paid).reduce((s,m)=>{ const p=plans.find(p=>p.id===m.planId); return s+(p?.price||0); },0);
  const todayAtt        = members.filter(m=>m.lastVisit===mkDate(0)).length;
  const topAtRisk       = [...members].sort((a,b)=>churnScore(b)-churnScore(a)).slice(0,5);

  const filteredMembers = members.filter(m=>{
    if(filterTrainer!=="All"&&m.trainer!==filterTrainer) return false;
    if(filterPlan!=="All"&&m.planId!==filterPlan) return false;
    if(filterRisk!=="All"){ const s=riskOf(m).score; if(filterRisk==="Active"&&s!==1)return false; if(filterRisk==="At Risk"&&s!==2)return false; if(filterRisk==="Lost"&&s!==3)return false; }
    return true;
  });

  // ── Bulk send ──────────────────────────────────────────────────────────────
  const startQueue = (list,msgFn,label) => {
    if(!list.length){notify("No members to message","warn");return;}
    setQueueModal({queue:list.map(m=>({phone:m.phone,text:msgFn(m),name:m.name})),label});
  };

  // ── Member ops ─────────────────────────────────────────────────────────────
  const markAtt  = (id,val) => setMembers(members.map(m=>m.id===id?{...m,attendance:[...m.attendance.slice(-13),val],lastVisit:val?mkDate(0):m.lastVisit}:m));
  const markPaid = (id) => {
    const mem=members.find(m=>m.id===id); if(!mem)return;
    const plan=plans.find(p=>p.id===mem.planId)||plans[0];
    const newExp=addPeriod(new Date()>new Date(mem.expiry)?mkDate(0):mem.expiry,plan.value,plan.unit);
    setMembers(members.map(m=>m.id===id?{...m,paid:true,expiry:newExp}:m));
    window.open(`https://wa.me/91${mem.phone}?text=${encodeURIComponent(fmtMsg(msgs.payment_thanks,{...mem,expiry:newExp},G))}`,"_blank");
    notify("Marked paid & thank-you sent! ✅");
  };
  const awardPoints = (id,pts) => setMembers(members.map(m=>m.id===id?{...m,points:(m.points||0)+pts}:m));
  const deleteMember=(id)=>{ setMembers(members.filter(m=>m.id!==id)); setModal(null); setSelectedM(null); setConfirmDel(null); notify("Member removed"); };
  const pauseMember=(id,days)=>{ setMembers(members.map(m=>{ if(m.id!==id)return m; const d=new Date(m.expiry); d.setDate(d.getDate()+parseInt(days)); return {...m,expiry:d.toISOString().split("T")[0]}; })); notify(`Extended by ${days} days ✅`); };

  const addMember = () => {
    if(!newName.trim()||!newPhone.trim()){notify("Name & phone required","err");return;}
    const plan = plans.find(p=>p.id===newPlanId)||plans[0];
    // Use the editable join date; fall back to today if empty
    const joined  = newJoined || mkDate(0);
    const expiry  = addPeriod(joined, plan.value, plan.unit);
    // lastVisit = join date (so absence counter starts correctly from actual first day)
    const m = {id:uid(),name:newName.trim(),phone:newPhone.trim(),planId:newPlanId,trainer:newTrainer,goal:newGoal,birthday:newBday,notes:newNotes,joined,expiry,attendance:[1],lastVisit:joined,paid:false,points:0,referrals:0};
    setMembers([...members,m]);
    setNewName(""); setNewPhone(""); setNewPlanId(plans[0]?.id||""); setNewTrainer(trainers[0]||""); setNewGoal(INIT_GOALS[0]); setNewBday(""); setNewNotes(""); setNewJoined(mkDate(0));
    setModal(null);
    window.open(`https://wa.me/91${m.phone}?text=${encodeURIComponent(fmtMsg(msgs.welcome_d1,m,G))}`,"_blank");
    notify("Member added & welcome sent! 🎉");
  };
  const saveEdit=()=>{ if(!editData)return; setMembers(members.map(m=>m.id===editData.id?editData:m)); setModal(null); setEditData(null); notify("Updated ✅"); };

  // ── Plan/Trainer helpers ───────────────────────────────────────────────────
  const addPlan=()=>setPlans([...plans,{id:"plan_"+uid(),label:"New Plan",value:1,unit:"months",price:1000}]);
  const updatePlan=(id,f,v)=>setPlans(plans.map(p=>p.id===id?{...p,[f]:f==="value"||f==="price"?Number(v)||0:v}:p));
  const deletePlan=(id)=>{ if(plans.length<=1){notify("Need at least 1 plan","err");return;} setPlans(plans.filter(p=>p.id!==id)); };
  const [newTrainerName,setNewTrainerName]=useState("");
  const addTrainer=()=>{ if(!newTrainerName.trim())return; setTrainers([...trainers,newTrainerName.trim()]); setNewTrainerName(""); notify("Trainer added!"); };
  const updateTrainer=(idx,v)=>setTrainers(trainers.map((t,i)=>i===idx?v:t));
  const deleteTrainer=(idx)=>{ if(trainers.length<=1){notify("Need at least 1 trainer","err");return;} setTrainers(trainers.filter((_,i)=>i!==idx)); };

  // ── GROQ CLOUD API KEY — use env var to avoid committing secrets ────────────
  const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;
  const GROQ_URL = `https://api.groq.com/openai/v1/chat/completions`;

  const GYM_PERSONA = `You are a friendly, experienced gym business coach named Alex. You work closely with gym owners and speak like a real person — warm, direct, and practical. You use simple language, short sentences, and occasional emojis. You never sound robotic or give generic textbook answers. You always give specific, actionable advice based on the gym's actual data. You understand the Indian gym market well.`;

  // ── Core Groq caller — used everywhere in the app ───────────────────────
  const geminiCall = async (prompt, systemOverride) => {
    const systemText = systemOverride || GYM_PERSONA;
    const fullPrompt = `${systemText}\n\n${prompt}`;
    // If the GROQ key is not set, provide a safe local fallback
    if(!GROQ_KEY) {
      console.warn("GROQ key missing — using local AI fallback");
      const preview = (prompt||"").toString().slice(0,400);
      return `Local AI (fallback): Groq API key not configured. Prompt preview: ${preview}`;
    }

    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: fullPrompt }],
        max_tokens: 1000,
        temperature: 0.85,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || "Groq error " + res.status);
    }
    const d = await res.json();
    return d.choices?.[0]?.message?.content || "No response";
  };

  // ── callAI — sets shared aiOutput (used by dashboard quick actions) ────────
  const callAI = async (prompt, sys) => {
    setAiLoading(true); setAiOutput("");
    try {
      const result = await geminiCall(prompt, sys);
      setAiOutput(result);
    } catch(e) {
      setAiOutput("❌ AI error: " + e.message);
    }
    setAiLoading(false);
  };

  // ── Start automations — opens queue modal one-by-one ──────────────────────
  const startAllAutomations = () => {
    const queue = [];
    if(autos.expiry)   expiringMembers.forEach(m=>{ const d=daysLeft(m.expiry); const k=d<=0?"expiry_d0":d<=2?"expiry_d2":"expiry_d5"; queue.push({phone:m.phone,text:fmtMsg(msgs[k],m,G),name:m.name}); });
    if(autos.absence)  absentMembers.forEach(m=>{ const d=daysSince(m.lastVisit); const k=d>=10?"absent_d10":d>=7?"absent_d7":d>=5?"absent_d5":"absent_d3"; queue.push({phone:m.phone,text:fmtMsg(msgs[k],m,G),name:m.name}); });
    if(autos.birthday) todayBdays.forEach(m=>queue.push({phone:m.phone,text:fmtMsg(msgs.birthday,m,G),name:m.name}));
    if(autos.winback)  lostMembers.filter(m=>daysSince(m.lastVisit)>=30).forEach(m=>queue.push({phone:m.phone,text:fmtMsg(msgs.winback_d30,m,G),name:m.name}));

    setAutosRunning(true); // mark as running immediately

    if(queue.length > 0) {
      // Open queue modal — same one-by-one flow as Message All in Home
      setQueueModal({queue, label:"Daily Automation"});
    } else {
      notify(`✅ Automations started! No pending messages for today.`);
    }
  };

  // ── Image upload ───────────────────────────────────────────────────────────
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if(!file) return;
    if(file.size > 2*1024*1024){notify("Image must be under 2MB","err");return;}
    const reader = new FileReader();
    reader.onload = (ev) => setGymImage(ev.target.result);
    reader.readAsDataURL(file);
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = () => {
    persist(); // save before logout
    setUserId(null); setUserEmail(null); setAppReady(false);
    setTab("home"); setModal(null); setSelectedM(null); setQueueModal(null);
  };

  // ── Show login if not logged in ────────────────────────────────────────────
  if(!appReady) return (
    <div>
      <style>{css}</style>
      <LoginScreen onLogin={onLogin} />
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // SCREENS  (all wrapped in .screen class for consistent height)
  // ─────────────────────────────────────────────────────────────────────────

  const HomeScreen = () => (
    <div className="screen fade">
      <div style={{marginBottom:18}}>
        <div style={{fontWeight:900,fontSize:24,marginBottom:2}}>Good morning! 👋</div>
        <div style={{color:C.muted,fontSize:14}}>Here's your gym at a glance.</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
        {[
          {icon:"👥",l:"Total",   v:members.length,         c:C.p500},
          {icon:"✅",l:"Today",   v:todayAtt,               c:C.green},
          {icon:"💰",l:"Revenue", v:rupees(revenue),        c:C.amber},
          {icon:"⚠️",l:"Expiring",v:expiringMembers.length, c:C.amber,click:()=>setTab("members")},
          {icon:"😴",l:"Absent",  v:absentMembers.length,   c:C.red,  click:()=>setTab("members")},
          {icon:"❌",l:"Unpaid",  v:unpaidMembers.length,   c:C.red,  click:()=>setTab("members")},
        ].map(s=>(
          <Card key={s.l} style={{textAlign:"center",padding:"13px 8px",cursor:s.click?"pointer":"default"}} accent={s.c} onClick={s.click}>
            <div style={{fontSize:20,marginBottom:3}}>{s.icon}</div>
            <div style={{color:s.c,fontSize:20,fontWeight:900,lineHeight:1}}>{s.v}</div>
            <div style={{color:C.muted,fontSize:10,marginTop:2,fontWeight:600}}>{s.l}</div>
          </Card>
        ))}
      </div>
      {autosRunning&&<Card accent={C.green} style={{marginBottom:12,padding:12}}><div style={{display:"flex",alignItems:"center",gap:8}}><span className="pulse">🟢</span><div><div style={{fontWeight:700,fontSize:13}}>Automations Active</div><div style={{color:C.muted,fontSize:11}}>Running daily at {sendTime}</div></div></div></Card>}
      {todayBdays.length>0&&<Card accent={C.pink} style={{marginBottom:12,padding:12}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontWeight:700,fontSize:14}}>🎂 Birthday Today!</div><div style={{color:C.muted,fontSize:12}}>{todayBdays.map(m=>m.name).join(", ")}</div></div><Btn small color={C.pink} onClick={()=>startQueue(todayBdays,m=>fmtMsg(msgs.birthday,m,G),"Birthday Wishes")}>Wish All</Btn></div></Card>}
      <Section title="🚨 Top 5 At-Risk" action={<Btn small ghost color={C.red} onClick={()=>startQueue(topAtRisk,m=>fmtMsg(msgs.absent_d3,m,G),"At-Risk Message")}>Message All</Btn>}>
        {topAtRisk.length===0&&<div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"20px 0"}}>🎉 No at-risk members right now!</div>}
        {topAtRisk.map(m=>{ const ch=churnScore(m); return (
          <Card key={m.id} style={{marginBottom:8,padding:12}} accent={ch>70?C.red:ch>40?C.amber:null} onClick={()=>{setSelectedM(m);setModal("memberDetail");}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontWeight:700,fontSize:14}}>{m.name}</div><div style={{color:C.muted,fontSize:12}}>{daysSince(m.lastVisit)}d absent · {m.goal}</div></div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <Tag text={`${ch}%`} color={ch>70?C.red:ch>40?C.amber:C.green} />
                <button className="tap" onClick={e=>{e.stopPropagation();startQueue([m],()=>fmtMsg(msgs.absent_d3,m,G),"Follow-Up");}} style={{background:"#25D366",color:"#fff",border:"none",borderRadius:8,padding:"5px 10px",fontSize:12,cursor:"pointer",fontWeight:700}}>💬</button>
              </div>
            </div>
          </Card>
        );})}
      </Section>
      <Section title="⚡ Quick Actions">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[
            {icon:"⚠️",l:"Remind Expiring",s:`${expiringMembers.length} members`,c:C.amber,fn:()=>startQueue(expiringMembers,m=>{const d=daysLeft(m.expiry);return fmtMsg(msgs[d<=0?"expiry_d0":d<=2?"expiry_d2":"expiry_d5"],m,G);},"Expiry Reminder")},
            {icon:"😴",l:"Message Absent",s:`${absentMembers.length} members`,c:C.red,fn:()=>startQueue(absentMembers,m=>{const d=daysSince(m.lastVisit);return fmtMsg(msgs[d>=10?"absent_d10":d>=7?"absent_d7":d>=5?"absent_d5":"absent_d3"],m,G);},"Absence")},
            {icon:"🎊",l:"Festival Wishes",s:"All members",c:C.p500,fn:()=>setFestModal(true)},
            {icon:"💔",l:"Win-Back",s:`${lostMembers.length} lost`,c:C.pink,fn:()=>startQueue(lostMembers,m=>fmtMsg(msgs.winback_d30,m,G),"Win-Back")},
          ].map(a=>(
            <Card key={a.l} accent={a.c} style={{cursor:"pointer"}} onClick={a.fn}>
              <div className="tap"><div style={{fontSize:22,marginBottom:4}}>{a.icon}</div><div style={{fontWeight:700,fontSize:13}}>{a.l}</div><div style={{color:C.muted,fontSize:11,marginTop:1}}>{a.s}</div></div>
            </Card>
          ))}
        </div>
      </Section>
      {unpaidMembers.length>0&&<Section title="❌ Pending Payments">{unpaidMembers.map(m=>(
        <Card key={m.id} style={{marginBottom:8,padding:12}} accent={C.red}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontWeight:700,fontSize:14}}>{m.name}</div><div style={{color:C.muted,fontSize:12}}>{plans.find(p=>p.id===m.planId)?.label} · {rupees(plans.find(p=>p.id===m.planId)?.price||0)}</div></div>
            <div style={{display:"flex",gap:6}}><button className="tap" onClick={()=>startQueue([m],()=>fmtMsg(msgs.expiry_d2,m,G),"Payment Reminder")} style={{background:"#25D366",color:"#fff",border:"none",borderRadius:8,padding:"6px 10px",fontSize:11,cursor:"pointer",fontWeight:700}}>💬</button><Btn small color={C.green} onClick={()=>markPaid(m.id)}>Paid ✅</Btn></div>
          </div>
        </Card>
      ))}</Section>}
    </div>
  );

  const MembersScreen = () => (
    <div className="screen fade">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontWeight:800,fontSize:20}}>Members <span style={{color:C.p400}}>({filteredMembers.length}/{members.length})</span></div>
        <Btn small onClick={()=>setModal("addMember")}>+ Add</Btn>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:14,overflowX:"auto",paddingBottom:4}}>
        <select value={filterTrainer} onChange={e=>setFilterTrainer(e.target.value)} style={{background:C.surface,border:`1px solid ${filterTrainer!=="All"?C.p500:C.border}`,borderRadius:10,padding:"7px 10px",color:filterTrainer!=="All"?C.p400:C.muted,fontSize:12,outline:"none",flexShrink:0}}>
          <option value="All">All Trainers</option>{trainers.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterPlan} onChange={e=>setFilterPlan(e.target.value)} style={{background:C.surface,border:`1px solid ${filterPlan!=="All"?C.p500:C.border}`,borderRadius:10,padding:"7px 10px",color:filterPlan!=="All"?C.p400:C.muted,fontSize:12,outline:"none",flexShrink:0}}>
          <option value="All">All Plans</option>{plans.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        <select value={filterRisk} onChange={e=>setFilterRisk(e.target.value)} style={{background:C.surface,border:`1px solid ${filterRisk!=="All"?C.p500:C.border}`,borderRadius:10,padding:"7px 10px",color:filterRisk!=="All"?C.p400:C.muted,fontSize:12,outline:"none",flexShrink:0}}>
          <option value="All">All Status</option><option value="Active">🔥 Active</option><option value="At Risk">⚠️ At Risk</option><option value="Lost">❌ Lost</option>
        </select>
        {(filterTrainer!=="All"||filterPlan!=="All"||filterRisk!=="All")&&<button onClick={()=>{setFilterTrainer("All");setFilterPlan("All");setFilterRisk("All");}} style={{background:C.red+"20",border:`1px solid ${C.red}44`,borderRadius:10,padding:"7px 10px",color:C.red,fontSize:12,cursor:"pointer",fontWeight:700,flexShrink:0}}>✕</button>}
      </div>
      {filteredMembers.length===0&&<Card style={{textAlign:"center",padding:"40px 20px"}}><div style={{fontSize:40,marginBottom:10}}>🔍</div><div style={{fontWeight:700,marginBottom:4}}>{members.length===0?"No members yet":"No members match"}</div><div style={{color:C.muted,fontSize:13}}>{members.length===0?"Add your first member →":"Try different filters"}</div></Card>}
      {filteredMembers.map(m=>{ const risk=riskOf(m); const expD=daysLeft(m.expiry); return (
        <Card key={m.id} style={{marginBottom:10}} accent={risk.score===3?C.red:risk.score===2?C.amber:null} onClick={()=>{setSelectedM(m);setModal("memberDetail");}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
            <div style={{display:"flex",gap:10,flex:1,minWidth:0}}>
              <div style={{width:40,height:40,borderRadius:12,background:`linear-gradient(135deg,${C.p700},${C.pink})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:800,color:"#fff",flexShrink:0}}>{m.name.charAt(0)}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap",marginBottom:2}}>
                  <span style={{fontWeight:700,fontSize:14}}>{m.name}</span>
                  <Tag text={risk.label} color={risk.color} size={10} />
                  {!m.paid&&<Tag text="Unpaid" color={C.red} size={10} />}
                </div>
                <div style={{color:C.muted,fontSize:11,marginBottom:5}}>📱{m.phone} · {plans.find(p=>p.id===m.planId)?.label}</div>
                <div style={{display:"flex",gap:3}}>{m.attendance.slice(-7).map((a,i)=><div key={i} style={{width:9,height:9,borderRadius:2,background:a?C.green:C.red,opacity:.85}} />)}<span style={{color:C.muted,fontSize:10,marginLeft:3}}>7d</span></div>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:5,flexShrink:0,alignItems:"flex-end"}}>
              <div style={{display:"flex",gap:5}}>
                <button className="tap" onClick={e=>{e.stopPropagation();markAtt(m.id,1);notify("✅ Present");}} style={{background:C.green+"22",border:`1px solid ${C.green}44`,borderRadius:8,padding:"5px 9px",color:C.green,fontSize:13,cursor:"pointer",fontWeight:700}}>✓</button>
                <button className="tap" onClick={e=>{e.stopPropagation();markAtt(m.id,0);notify("❌ Absent");}} style={{background:C.red+"22",border:`1px solid ${C.red}44`,borderRadius:8,padding:"5px 9px",color:C.red,fontSize:13,cursor:"pointer",fontWeight:700}}>✗</button>
              </div>
              {expD<=7&&expD>=0&&<Tag text={`${expD}d left`} color={expD<=2?C.red:C.amber} size={10} />}
              <button className="tap" onClick={e=>{e.stopPropagation();setConfirmDel(m.id);}} style={{background:C.red+"15",border:`1px solid ${C.red}33`,borderRadius:8,padding:"4px 8px",color:C.red,fontSize:11,cursor:"pointer",fontWeight:700}}>🗑️</button>
            </div>
          </div>
        </Card>
      );})}
    </div>
  );

  const AutomateScreen = () => (
    <div className="screen fade">
      <div style={{fontWeight:800,fontSize:20,marginBottom:4}}>Automations</div>
      <div style={{color:C.muted,fontSize:13,marginBottom:16}}>Toggle automations. Start from Settings.</div>
      {autosRunning&&<Card accent={C.green} style={{marginBottom:14,padding:12}}><div style={{display:"flex",alignItems:"center",gap:8}}><span className="pulse">🟢</span><div style={{fontWeight:700}}>All Automations Running · {sendTime} daily</div></div></Card>}
      {[
        {icon:"🌟",title:"Welcome Sequence",    desc:"Day 1,2,3,5,7 to new members",  k:"welcome",  c:C.p500},
        {icon:"😴",title:"Absence Recovery",    desc:"At 3,5,7,10 days absent",       k:"absence",  c:C.red},
        {icon:"⏰",title:"Membership Reminders",desc:"5 days, 2 days & expiry day",    k:"expiry",   c:C.amber},
        {icon:"✅",title:"Payment Thank You",   desc:"Auto thank-you on payment",      k:"payment",  c:C.green},
        {icon:"🎊",title:"Festival Wishes",     desc:"All members on festivals",       k:"festival", c:C.p500},
        {icon:"🎂",title:"Birthday Wishes",     desc:"On each member's birthday",      k:"birthday", c:C.pink},
        {icon:"💔",title:"Win-Back Campaign",   desc:"30, 45, 60 days inactive",       k:"winback",  c:C.pink},
      ].map(a=>(
        <Card key={a.k} style={{marginBottom:10}} accent={autos[a.k]?a.c:null}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:24,flexShrink:0}}>{a.icon}</span>
            <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,fontSize:14}}>{a.title}</div><div style={{color:C.muted,fontSize:12,marginTop:2}}>{a.desc}</div></div>
            <Toggle on={autos[a.k]} onChange={()=>setAutos({...autos,[a.k]:!autos[a.k]})} />
          </div>
        </Card>
      ))}
      <div style={{height:1,background:C.border,margin:"18px 0"}} />
      <Section title="📤 Bulk Send Now">
        {[
          {icon:"⚠️",l:"Expiry Reminders", s:`${expiringMembers.length}`,c:C.amber,fn:()=>startQueue(expiringMembers,m=>{const d=daysLeft(m.expiry);return fmtMsg(msgs[d<=0?"expiry_d0":d<=2?"expiry_d2":"expiry_d5"],m,G);},"Expiry Reminder")},
          {icon:"😴",l:"Absence Follow-ups",s:`${absentMembers.length}`,c:C.red,fn:()=>startQueue(absentMembers,m=>{const d=daysSince(m.lastVisit);return fmtMsg(msgs[d>=10?"absent_d10":d>=7?"absent_d7":d>=5?"absent_d5":"absent_d3"],m,G);},"Absence")},
          {icon:"💔",l:"Win-Back",          s:`${lostMembers.length}`,c:C.pink,fn:()=>startQueue(lostMembers,m=>fmtMsg(msgs.winback_d30,m,G),"Win-Back")},
          {icon:"💪",l:"Motivation Blast",  s:"Active members",c:C.teal,fn:()=>startQueue(members.filter(m=>riskOf(m).score===1),m=>fmtMsg(msgs.motivation,m,G),"Motivation")},
          {icon:"🎊",l:"Festival Blast",    s:"All members",c:C.p500,fn:()=>setFestModal(true)},
        ].map(b=>(
          <Card key={b.l} style={{marginBottom:8,padding:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontWeight:600,fontSize:14}}>{b.icon} {b.l}</div><div style={{color:C.muted,fontSize:12,marginTop:2}}>{b.s} members</div></div>
              <Btn small ghost color={b.c} onClick={b.fn}>Send All</Btn>
            </div>
          </Card>
        ))}
      </Section>
      {msgLogs.length>0&&<Section title="📋 Log"><Card style={{padding:0,overflow:"hidden"}}>{msgLogs.slice(0,12).map((l,i)=><div key={i} style={{padding:"8px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:10,fontSize:12}}><span style={{color:C.muted,flexShrink:0}}>{l.t}</span><span style={{color:C.p400,fontWeight:600}}>{l.name}</span><span style={{color:C.muted}}>{l.label}</span></div>)}</Card></Section>}
    </div>
  );

  const active_ai   = members.filter(m=>riskOf(m).score===1).length;
  const atRiskN_ai  = members.filter(m=>riskOf(m).score===2).length;
  const lostN_ai    = members.filter(m=>riskOf(m).score===3).length;
  const churnRisk_ai= members.filter(m=>churnScore(m)>60);
  const retention_ai= Math.round(active_ai/Math.max(members.length,1)*100);

  const runAI = async (prompt, system, setOut, setLoad) => {
    setLoad(true); setOut("");
    try {
      const result = await geminiCall(prompt, system);
      setOut(result);
    } catch(e) {
      setOut("❌ Error: " + e.message);
    }
    setLoad(false);
  };

  const sendChat = async () => {
    if(!chatInput.trim()) return;
    const q = chatInput.trim();
    setChatInput("");
    setChatHistory(h=>[...h,{role:"user",text:q}]);
    setAiLoading(true);
    try {
      const context = `The gym is called "${gymName}". It has ${members.length} members. Active: ${active_ai}. At-risk: ${atRiskN_ai}. Lost: ${lostN_ai}. Monthly revenue: ${rupees(revenue)}. Retention rate: ${retention_ai}%. Use this context to give specific advice.`;
      const result = await geminiCall(q, `${GYM_PERSONA}\n\nGym context: ${context}`);
      setChatHistory(h=>[...h,{role:"ai",text:result}]);
    } catch(e) {
      setChatHistory(h=>[...h,{role:"ai",text:"❌ Error: "+e.message}]);
    }
    setAiLoading(false);
  };

  const aiTabs = [
    {id:"dashboard",icon:"📊",label:"Dashboard"},
    {id:"coach",    icon:"🧠",label:"AI Coach"},
    {id:"churn",    icon:"🚨",label:"Churn"},
    {id:"marketing",icon:"🎯",label:"Marketing"},
  ];

  const AIJsx = (
    <div className="screen fade" key="ai-screen">
      <div style={{marginBottom:14}}>
        <div style={{fontWeight:900,fontSize:22,marginBottom:2}}>{gymName}'s Personal AI 🧠</div>
        <div style={{color:C.muted,fontSize:13}}>Your AI business consultant, growth strategist & marketing expert.</div>
      </div>

      {/* Sub-tabs — 2x2 grid, no scroll */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:16}}>
        {aiTabs.map(t=>(
          <button key={t.id} onClick={()=>setAiSection(t.id)} style={{background:aiSection===t.id?C.p500:C.card,border:`1px solid ${aiSection===t.id?C.p500:C.border}`,borderRadius:12,padding:"10px 8px",color:aiSection===t.id?"#fff":C.muted,fontSize:13,cursor:"pointer",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            <span>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── DASHBOARD ── */}
      {aiSection==="dashboard"&&(
        <div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
            {[
              {icon:"💰",l:"Revenue",   v:rupees(revenue),   c:C.amber},
              {icon:"✅",l:"Active",    v:active_ai,         c:C.green},
              {icon:"⚠️",l:"At Risk",  v:atRiskN_ai,        c:C.amber},
              {icon:"📉",l:"Churn Risk",v:churnRisk_ai.length,c:C.red},
            ].map(s=>(
              <Card key={s.l} style={{padding:"12px 14px",textAlign:"center"}} accent={s.c}>
                <div style={{fontSize:20,marginBottom:4}}>{s.icon}</div>
                <div style={{color:s.c,fontSize:22,fontWeight:900}}>{s.v}</div>
                <div style={{color:C.muted,fontSize:11,marginTop:2,fontWeight:600}}>{s.l}</div>
              </Card>
            ))}
          </div>

          <Section title="💡 Today's AI Insights">
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {churnRisk_ai.length>0&&<Card accent={C.red} style={{padding:12}}><div style={{fontWeight:700,fontSize:13,marginBottom:4}}>🚨 Churn Alert</div><div style={{color:C.muted,fontSize:13}}>{churnRisk_ai.length} member{churnRisk_ai.length>1?"s":""} may cancel soon — {churnRisk_ai.slice(0,2).map(m=>m.name).join(", ")}</div></Card>}
              {expiringMembers.length>0&&<Card accent={C.amber} style={{padding:12}}><div style={{fontWeight:700,fontSize:13,marginBottom:4}}>⏰ Renewals Due</div><div style={{color:C.muted,fontSize:13}}>{expiringMembers.length} membership{expiringMembers.length>1?"s":""} expiring in 7 days.</div></Card>}
              {unpaidMembers.length>0&&<Card accent={C.red} style={{padding:12}}><div style={{fontWeight:700,fontSize:13,marginBottom:4}}>❌ Pending Payments</div><div style={{color:C.muted,fontSize:13}}>{unpaidMembers.length} unpaid — potential: {rupees(unpaidMembers.reduce((s,m)=>{const p=plans.find(p=>p.id===m.planId);return s+(p?.price||0);},0))}</div></Card>}
              {retention_ai>=80&&<Card accent={C.green} style={{padding:12}}><div style={{fontWeight:700,fontSize:13,marginBottom:4}}>🎉 Great Retention!</div><div style={{color:C.muted,fontSize:13}}>Your retention is {retention_ai}% — above the industry average of 70%!</div></Card>}
              {members.length===0&&<Card style={{padding:16,textAlign:"center"}}><div style={{fontSize:32,marginBottom:8}}>🏋️</div><div style={{fontWeight:700,marginBottom:4}}>Add members to see AI insights</div><div style={{color:C.muted,fontSize:13}}>The AI analyzes your data in real time.</div></Card>}
            </div>
          </Section>

          <Section title="⚡ Quick AI Actions">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[
                {icon:"📈",l:"Growth Plan",     c:C.p500, t:`Give me a specific 30-day growth plan for "${gymName}". We have ${members.length} members and ${rupees(revenue)} monthly revenue.`},
                {icon:"💰",l:"Revenue Boost",   c:C.amber,t:`How can "${gymName}" increase monthly revenue right now? Give me 5 specific actions I can take this week.`},
                {icon:"🔄",l:"Retention Tips",  c:C.green,t:`Give me 5 specific strategies to improve member retention at "${gymName}". We currently have ${retention_ai}% retention.`},
                {icon:"🎯",l:"Pricing Strategy",c:C.teal, t:`What's the best pricing strategy for "${gymName}"? Include upsell ideas. We currently charge for 1, 3, 6, 12 month plans.`},
              ].map(a=>(
                <Card key={a.l} style={{padding:14,cursor:"pointer"}} accent={a.c} onClick={async()=>{
                  setAiSection("coach");
                  setChatHistory(h=>[...h,{role:"user",text:a.l}]);
                  setAiLoading(true);
                  try {
                    const result = await geminiCall(a.t);
                    setChatHistory(h=>[...h,{role:"ai",text:result}]);
                  } catch(e) {
                    setChatHistory(h=>[...h,{role:"ai",text:"❌ Error: "+e.message}]);
                  }
                  setAiLoading(false);
                }}>
                  <div className="tap">
                    <div style={{fontSize:22,marginBottom:6}}>{a.icon}</div>
                    <div style={{fontWeight:700,fontSize:13}}>{a.l}</div>
                  </div>
                </Card>
              ))}
            </div>
          </Section>

          {churnRisk_ai.length>0&&(
            <Section title="🚨 Members Likely to Quit">
              {churnRisk_ai.slice(0,4).map(m=>{ const s=churnScore(m); return(
                <Card key={m.id} style={{marginBottom:8,padding:12}} accent={s>75?C.red:C.amber}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:14}}>{m.name}</div>
                      <div style={{color:C.muted,fontSize:12,marginBottom:5}}>{daysSince(m.lastVisit)}d absent · {m.goal}</div>
                      <PBar value={s} color={s>75?C.red:C.amber} />
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:5,alignItems:"flex-end",marginLeft:10,flexShrink:0}}>
                      <Tag text={s+"%"} color={s>75?C.red:C.amber} />
                      <button className="tap" onClick={()=>startQueue([m],()=>fmtMsg(msgs.absent_d5,m,G),"Churn Prevention")} style={{background:"#25D366",color:"#fff",border:"none",borderRadius:8,padding:"5px 10px",fontSize:11,cursor:"pointer",fontWeight:700}}>💬</button>
                    </div>
                  </div>
                </Card>
              );})}
            </Section>
          )}
        </div>
      )}

      {/* ── AI COACH ── */}
      {aiSection==="coach"&&(
        <div style={{display:"flex",flexDirection:"column"}}>
          <div style={{marginBottom:14}}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>🧠 AI Business Coach</div>
            <div style={{color:C.muted,fontSize:13}}>Ask anything — growth, sales, retention, pricing, marketing.</div>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
            {["How do I increase renewals?","Why are members leaving?","Give me a summer offer idea","How to get more PT clients?","Best retention strategy?","How to upsell memberships?"].map(q=>(
              <button key={q} onClick={()=>setChatInput(q)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:"6px 12px",color:C.p400,fontSize:12,cursor:"pointer",fontWeight:600}}>{q}</button>
            ))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14,minHeight:100,maxHeight:320,overflowY:"auto"}}>
            {chatHistory.length===0&&(
              <div style={{textAlign:"center",padding:"24px 0",color:C.muted,fontSize:13}}>
                <div style={{fontSize:32,marginBottom:8}}>🧠</div>
                <div>Tap a question above or type anything below.</div>
                <div style={{fontSize:12,marginTop:4}}>All replies appear here.</div>
              </div>
            )}
            {chatHistory.map((c,i)=>(
              <div key={i} style={{display:"flex",justifyContent:c.role==="user"?"flex-end":"flex-start"}}>
                <div style={{background:c.role==="user"?C.p500:C.card,color:"#fff",borderRadius:c.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",padding:"10px 14px",maxWidth:"88%",fontSize:13,lineHeight:1.65,border:c.role==="ai"?`1px solid ${C.border}`:"none"}}>
                  {c.role==="ai"&&<div style={{color:C.p400,fontSize:10,fontWeight:700,marginBottom:5,letterSpacing:.5}}>🤖 AI COACH</div>}
                  <div style={{whiteSpace:"pre-wrap"}}>{c.text}</div>
                </div>
              </div>
            ))}
            {aiLoading&&<div style={{display:"flex",justifyContent:"flex-start"}}><div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"16px 16px 16px 4px",padding:"10px 16px",fontSize:13,color:C.p400}} className="pulse">⏳ Thinking...</div></div>}
          </div>
          {chatHistory.length>0&&<div style={{textAlign:"right",marginBottom:8}}><button onClick={()=>setChatHistory([])} style={{background:"none",border:"none",color:C.muted,fontSize:12,cursor:"pointer",fontWeight:600}}>Clear chat ✕</button></div>}
          <div style={{display:"flex",gap:8,paddingTop:4}}>
            <input className="inp" placeholder="Ask your AI coach anything…" value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()} style={{flex:1}} />
            <button className="tap" onClick={sendChat} disabled={aiLoading||!chatInput.trim()} style={{background:C.p500,border:"none",borderRadius:12,padding:"0 18px",color:"#fff",fontWeight:900,fontSize:18,cursor:"pointer",flexShrink:0,opacity:aiLoading||!chatInput.trim()?0.5:1}}>↑</button>
          </div>
        </div>
      )}

      {/* ── CHURN ── */}
      {aiSection==="churn"&&(
        <div>
          <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>🚨 Churn Prediction Engine</div>
          <div style={{color:C.muted,fontSize:13,marginBottom:14}}>AI detects members likely to quit and tells you what to do.</div>
          {members.length===0&&<Card style={{textAlign:"center",padding:"30px 20px"}}><div style={{fontSize:32,marginBottom:8}}>🏋️</div><div style={{fontWeight:700}}>Add members to see churn predictions</div></Card>}
          {members.length>0&&(
            <>
              <Btn full color={churnLoading?C.border:C.red} style={{marginBottom:14}} onClick={()=>runAI(
                `These gym members are at risk of churning at "${gymName}":\n${churnRisk_ai.map(m=>`${m.name}: absent ${daysSince(m.lastVisit)} days, goal: ${m.goal}, paid: ${m.paid}`).join("\n")}\n\nFor each member suggest: 1 specific action, what WhatsApp message to send, and any offer to give. Be short and practical.`,
                `${GYM_PERSONA} Focus on saving members who are about to leave. Be warm and specific.`,
                setChurnOutput, setChurnLoading
              )}>
                {churnLoading?"⏳ Analyzing...":"🧠 Get AI Retention Plan"}
              </Btn>
              {churnLoading&&<div style={{textAlign:"center",color:C.p400,padding:"16px 0"}} className="pulse">⏳ Analyzing your members...</div>}
              {churnOutput&&!churnLoading&&(
                <Card accent={C.teal} style={{marginBottom:14}}>
                  <div style={{fontWeight:700,fontSize:13,marginBottom:8,color:C.teal}}>🤖 AI Retention Plan</div>
                  <div style={{fontSize:13,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{churnOutput}</div>
                  <div style={{display:"flex",gap:8,marginTop:10}}>
                    <Btn small color={C.green} onClick={()=>{navigator.clipboard.writeText(churnOutput);notify("Copied!");}}>📋 Copy</Btn>
                    <Btn small ghost color={C.muted} onClick={()=>setChurnOutput("")}>Clear</Btn>
                  </div>
                </Card>
              )}
              {[...members].sort((a,b)=>churnScore(b)-churnScore(a)).map(m=>{ const s=churnScore(m); return(
                <Card key={m.id} style={{marginBottom:8,padding:12}} accent={s>70?C.red:s>40?C.amber:null}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:3}}>
                        <span style={{fontWeight:700,fontSize:14}}>{m.name}</span>
                        <Tag text={s>70?"High":s>40?"Medium":"Safe"} color={s>70?C.red:s>40?C.amber:C.green} size={10} />
                      </div>
                      <div style={{color:C.muted,fontSize:12,marginBottom:5}}>{daysSince(m.lastVisit)}d absent · {m.paid?"Paid":"Unpaid"}</div>
                      <PBar value={s} color={s>70?C.red:s>40?C.amber:C.green} />
                    </div>
                    <button className="tap" onClick={()=>startQueue([m],()=>fmtMsg(msgs[daysSince(m.lastVisit)>=7?"absent_d7":"absent_d5"],m,G),"Retention")} style={{background:"#25D366",color:"#fff",border:"none",borderRadius:8,padding:"7px 12px",fontSize:12,cursor:"pointer",fontWeight:700,flexShrink:0}}>💬</button>
                  </div>
                </Card>
              );})}
            </>
          )}
        </div>
      )}

      {/* ── MARKETING ── */}
      {aiSection==="marketing"&&(
        <div>
          <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>🎯 AI Marketing Assistant</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[
              {icon:"📸",l:"Instagram Caption", t:`Write 3 Instagram captions for "${gymName}". Engaging, motivational, with hashtags. Include a call to action.`},
              {icon:"🎬",l:"Reel Hook Ideas",   t:`Give me 5 viral reel hook ideas for "${gymName}". Short, punchy, scroll-stopping.`},
              {icon:"📢",l:"Ad Copy",           t:`Write a Facebook/Instagram ad for "${gymName}" to get new members. Include headline, body, and CTA.`},
              {icon:"🎁",l:"Offer Ideas",       t:`Create 3 irresistible gym membership offers for "${gymName}". Include limited-time deals and referral offers.`},
              {icon:"💬",l:"Objection Handler", t:`A prospect says "your price is too high." Write 3 WhatsApp responses to handle this and close the sale at "${gymName}".`},
              {icon:"📅",l:"Content Plan",      t:`Create a 30-day Instagram content plan for "${gymName}". Include post ideas, reel concepts, and story ideas.`},
              {icon:"🏆",l:"Challenge Idea",    t:`Design a 30-day fitness challenge for "${gymName}" members. Include name, rules, prizes, and WhatsApp promotion plan.`},
              {icon:"🌟",l:"Referral Program",  t:`Design a referral program for "${gymName}". Make it rewarding and viral. Include WhatsApp message templates.`},
            ].map(x=>(
              <Card key={x.l} style={{padding:14,cursor:"pointer"}} accent={marketingLabel===x.l?C.p400:C.p500} onClick={()=>{ setMarketingLabel(x.l); runAI(x.t,`${GYM_PERSONA} You are a gym marketing expert.`,setMarketingOutput,setMarketingLoading); }}>
                <div className="tap">
                  <div style={{fontSize:24,marginBottom:6}}>{x.icon}</div>
                  <div style={{fontWeight:700,fontSize:13}}>{x.l}</div>
                </div>
              </Card>
            ))}
          </div>
          {marketingLoading&&<div style={{textAlign:"center",color:C.p400,padding:"24px 0",marginTop:12}} className="pulse">⏳ Creating your {marketingLabel}...</div>}
          {marketingOutput&&!marketingLoading&&(
            <Card accent={C.p500} style={{marginTop:14}}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:10,color:C.p400}}>✅ {marketingLabel}</div>
              <div style={{fontSize:13,lineHeight:1.75,whiteSpace:"pre-wrap",color:C.text}}>{marketingOutput}</div>
              <div style={{display:"flex",gap:8,marginTop:12}}>
                <Btn small color={C.green} onClick={()=>{navigator.clipboard.writeText(marketingOutput);notify("Copied!");}}>📋 Copy</Btn>
                <Btn small ghost color={C.muted} onClick={()=>setMarketingOutput("")}>Clear</Btn>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );

    const active   = members.filter(m=>riskOf(m).score===1).length;
    const atRiskN  = members.filter(m=>riskOf(m).score===2).length;
    const lostN    = members.filter(m=>riskOf(m).score===3).length;
    const churnRisk= members.filter(m=>churnScore(m)>60);
    const retention= Math.round(active/Math.max(members.length,1)*100);

    const sendChat = async () => {
      if(!chatInput.trim()) return;
      const q = chatInput.trim();
      setChatInput("");
      setChatHistory(h=>[...h,{role:"user",text:q}]);
      setAiLoading(true);
      try {
        const context = `The gym is called "${gymName}". It has ${members.length} members. Active: ${active}. At-risk: ${atRiskN}. Lost: ${lostN}. Monthly revenue: ${rupees(revenue)}. Retention rate: ${retention}%. Use this context to give specific advice.`;
        const result = await geminiCall(q, `${GYM_PERSONA}\n\nGym context: ${context}`);
        setChatHistory(h=>[...h,{role:"ai",text:result}]);
      } catch(e) {
        setChatHistory(h=>[...h,{role:"ai",text:"❌ Error: "+e.message}]);
      }
      setAiLoading(false);
    };

  const ReportsScreen = () => {
    const active=members.filter(m=>riskOf(m).score===1).length;
    const atRiskN=members.filter(m=>riskOf(m).score===2).length;
    const lostN=members.filter(m=>riskOf(m).score===3).length;
    const retention=Math.round(active/Math.max(members.length,1)*100);
    const avgCons=Math.round(members.reduce((s,m)=>s+consistencyScore(m),0)/Math.max(members.length,1));
    const leaderboard=[...members].sort((a,b)=>b.points-a.points);
    const [lbModal,setLbModal]=useState(null);
    const [ptAmt,setPtAmt]=useState(10);
    return (
      <div className="screen fade">
        <div style={{fontWeight:800,fontSize:20,marginBottom:18}}>📊 Reports</div>
        <Section title="📈 This Month">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[{l:"Revenue",v:rupees(revenue),c:C.amber},{l:"Retention",v:retention+"%",c:C.green},{l:"Consistency",v:avgCons+"%",c:C.p500},{l:"Active",v:active,c:C.green},{l:"At Risk",v:atRiskN,c:C.amber},{l:"Lost",v:lostN,c:C.red}].map(x=>(
              <Card key={x.l} style={{padding:"12px 14px"}}><div style={{color:C.muted,fontSize:10,fontWeight:700,marginBottom:4,letterSpacing:.5}}>{x.l.toUpperCase()}</div><div style={{color:x.c,fontSize:20,fontWeight:800}}>{x.v}</div></Card>
            ))}
          </div>
        </Section>
        <Section title="🏋️ Plans">
          {plans.map(p=>{ const count=members.filter(m=>m.planId===p.id).length; const pct=Math.round(count/Math.max(members.length,1)*100); return (
            <div key={p.id} style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:13}}>{p.label}</span><span style={{fontSize:13,fontWeight:700,color:C.p400}}>{count} ({pct}%)</span></div><PBar value={pct} color={C.p500} /></div>
          );})}
        </Section>
        <Section title="👤 By Trainer">
          {trainers.map(t=>{ const count=members.filter(m=>m.trainer===t).length; return count>0?(
            <div key={t} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${C.border}`}}><span style={{fontSize:13}}>{t}</span><Tag text={`${count}`} color={C.p500} /></div>
          ):null; })}
        </Section>
        <Section title="🎯 Leaderboard" action={<div style={{color:C.muted,fontSize:11}}>Tap to award ⭐</div>}>
          {leaderboard.length===0&&<div style={{color:C.muted,textAlign:"center",padding:"20px 0",fontSize:13}}>Add members to see leaderboard</div>}
          {leaderboard.map((m,i)=>(
            <Card key={m.id} style={{marginBottom:8,padding:12}} accent={i===0?C.amber:null} onClick={()=>setLbModal(m.id)}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <span style={{fontSize:20}}>{["🥇","🥈","🥉"][i]||(i+1+".")}</span>
                  <div><div style={{fontWeight:700,fontSize:14}}>{m.name}</div><div style={{color:C.muted,fontSize:11}}>{m.referrals} referrals · {consistencyScore(m)}%</div></div>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                  <Tag text={`⭐ ${m.points}`} color={C.amber} />
                  <div style={{fontSize:10,color:C.muted}}>tap to award</div>
                </div>
              </div>
            </Card>
          ))}
        </Section>
        {lbModal&&(()=>{ const m=members.find(x=>x.id===lbModal); if(!m)return null; return (
          <div style={{position:"fixed",inset:0,background:"#000d",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
            <div className="fade" style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,padding:24,width:"100%",maxWidth:320}}>
              <div style={{fontWeight:800,fontSize:17,marginBottom:4}}>⭐ Award Points</div>
              <div style={{color:C.muted,fontSize:13,marginBottom:16}}>{m.name} · {m.points} pts</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
                {[5,10,25,50,100].map(v=>(
                  <button key={v} className="tap" onClick={()=>{awardPoints(m.id,v);setLbModal(null);notify(`+${v} pts to ${m.name}! ⭐`);}} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 0",color:C.amber,fontWeight:700,fontSize:14,cursor:"pointer"}}>+{v}</button>
                ))}
              </div>
              <div style={{display:"flex",gap:8,marginBottom:12}}>
                <input className="inp" type="number" defaultValue={ptAmt} onBlur={e=>setPtAmt(Number(e.target.value)||10)} placeholder="Custom" style={{flex:1}} />
                <Btn color={C.amber} onClick={()=>{awardPoints(m.id,ptAmt);setLbModal(null);notify(`+${ptAmt} pts to ${m.name}! ⭐`);}}>Award</Btn>
              </div>
              <Btn full ghost color={C.muted} onClick={()=>setLbModal(null)}>Cancel</Btn>
            </div>
          </div>
        );})()}
      </div>
    );
  };

  const SettingsScreen = () => {
    const [msgTab,setMsgTab]=useState("expiry");
    const msgGroups={
      expiry: {label:"⏰ Expiry",  keys:["expiry_d5","expiry_d2","expiry_d0","payment_thanks"],labels:["5 Days","2 Days","Today","Thank You"]},
      welcome:{label:"🌟 Welcome", keys:["welcome_d1","welcome_d2","welcome_d3","welcome_d5","welcome_d7"],labels:["Day 1","Day 2","Day 3","Day 5","Day 7"]},
      absence:{label:"😴 Absence", keys:["absent_d3","absent_d5","absent_d7","absent_d10"],labels:["3 Days","5 Days","7 Days","10 Days"]},
      winback:{label:"💔 Win-Back",keys:["winback_d30","winback_d45","winback_d60"],labels:["30 Days","45 Days","60 Days"]},
      special:{label:"🎉 Special", keys:["festival","birthday","motivation"],labels:["Festival","Birthday","Motivation"]},
    };
    return (
      <div className="screen fade">
        <div style={{fontWeight:800,fontSize:20,marginBottom:18}}>⚙️ Settings</div>

        {/* START AUTOMATIONS */}
        <Card accent={autosRunning?C.green:C.p500} style={{marginBottom:18,padding:18}}>
          <div style={{fontWeight:800,fontSize:16,marginBottom:6}}>{autosRunning?"🟢 Automations Active":"🚀 Start All Automations"}</div>
          <div style={{color:C.muted,fontSize:13,marginBottom:14}}>{autosRunning?"Opens WhatsApp one by one for each pending message.":"Opens WhatsApp for each member one at a time — expiry, absence, birthday & win-back."}</div>
          <Btn full color={autosRunning?C.red:C.green} onClick={autosRunning?()=>{setAutosRunning(false);notify("Automations stopped");}:startAllAutomations}>
            {autosRunning?"⏹️ Stop Automations":"▶️ Start All Automations"}
          </Btn>
        </Card>

        {/* GYM PROFILE */}
        <Section title="🏋️ Gym Profile">
          <Card>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                <label style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:.8}}>GYM NAME</label>
                <input className="inp" defaultValue={gymName} onBlur={e=>setGymName(e.target.value)} />
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                <label style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:.8}}>EMOJI / ICON</label>
                <input className="inp" defaultValue={gymEmoji} onBlur={e=>setGymEmoji(e.target.value)} placeholder="🏋️" />
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                <label style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:.8}}>PAYMENT LINK (PHONEPAY / UPI)</label>
                <input className="inp" defaultValue={payLink} onBlur={e=>setPayLink(e.target.value)} placeholder="https://pay.link" />
              </div>

              {/* GYM IMAGE — optional */}
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <label style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:.8}}>GYM IMAGE (OPTIONAL — SENT WITH MESSAGES)</label>
                {gymImage&&(
                  <div style={{position:"relative",borderRadius:12,overflow:"hidden",height:120}}>
                    <img src={gymImage} alt="Gym" style={{width:"100%",height:"100%",objectFit:"cover"}} />
                    <button onClick={()=>setGymImage("")} style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,.7)",border:"none",borderRadius:8,color:"#fff",padding:"4px 10px",fontSize:12,cursor:"pointer",fontWeight:700}}>✕ Remove</button>
                  </div>
                )}
                <label style={{background:C.surface,border:`2px dashed ${C.border}`,borderRadius:12,padding:"16px",textAlign:"center",cursor:"pointer",display:"block"}}>
                  <input type="file" accept="image/*" style={{display:"none"}} onChange={handleImageUpload} />
                  <div style={{fontSize:24,marginBottom:6}}>📷</div>
                  <div style={{color:C.p400,fontWeight:700,fontSize:13}}>{gymImage?"Change Image":"Upload Gym Image"}</div>
                  <div style={{color:C.muted,fontSize:11,marginTop:3}}>JPG, PNG · Max 2MB</div>
                </label>
              </div>
            </div>
          </Card>
        </Section>

        {/* TRAINERS */}
        <Section title="👤 Trainers" action={<Btn small onClick={addTrainer}>+ Add</Btn>}>
          <Card style={{marginBottom:10}}>
            <input className="inp" placeholder="New trainer name…" value={newTrainerName} onChange={e=>setNewTrainerName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTrainer()} />
          </Card>
          {trainers.map((t,idx)=>(
            <Card key={idx} style={{marginBottom:8,padding:"10px 14px"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:32,height:32,borderRadius:10,background:C.p700,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#fff",fontWeight:800,flexShrink:0}}>{t.charAt(0)}</div>
                <input className="inp" defaultValue={t} onBlur={e=>updateTrainer(idx,e.target.value)} style={{flex:1,padding:"7px 10px",fontSize:13}} />
                <button className="tap" onClick={()=>deleteTrainer(idx)} style={{background:C.red+"20",border:`1px solid ${C.red}33`,borderRadius:8,padding:"6px 10px",color:C.red,fontSize:12,cursor:"pointer",fontWeight:700,flexShrink:0}}>🗑️</button>
              </div>
            </Card>
          ))}
        </Section>

        {/* PLANS */}
        <Section title="📋 Membership Plans" action={<Btn small onClick={addPlan}>+ Add</Btn>}>
          {plans.map(p=>(
            <Card key={p.id} style={{marginBottom:10}}>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",gap:8}}>
                  <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
                    <label style={{color:C.muted,fontSize:10,fontWeight:700,letterSpacing:.8}}>PLAN NAME</label>
                    <input className="inp" defaultValue={p.label} onBlur={e=>updatePlan(p.id,"label",e.target.value)} style={{padding:"7px 10px",fontSize:13}} />
                  </div>
                  <button className="tap" onClick={()=>deletePlan(p.id)} style={{background:C.red+"20",border:`1px solid ${C.red}33`,borderRadius:8,padding:"9px 10px",color:C.red,fontSize:12,cursor:"pointer",fontWeight:700,flexShrink:0,marginBottom:0}}>🗑️</button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                  <div style={{display:"flex",flexDirection:"column",gap:5}}><label style={{color:C.muted,fontSize:10,fontWeight:700,letterSpacing:.8}}>DURATION</label><input className="inp" type="number" defaultValue={p.value} onBlur={e=>updatePlan(p.id,"value",e.target.value)} style={{padding:"7px 10px",fontSize:13}} /></div>
                  <div style={{display:"flex",flexDirection:"column",gap:5}}><label style={{color:C.muted,fontSize:10,fontWeight:700,letterSpacing:.8}}>UNIT</label><select className="inp" value={p.unit} onChange={e=>updatePlan(p.id,"unit",e.target.value)} style={{padding:"7px 10px",fontSize:13,appearance:"none"}}><option value="months">Months</option><option value="days">Days×30</option></select></div>
                  <div style={{display:"flex",flexDirection:"column",gap:5}}><label style={{color:C.muted,fontSize:10,fontWeight:700,letterSpacing:.8}}>PRICE ₹</label><input className="inp" type="number" defaultValue={p.price} onBlur={e=>updatePlan(p.id,"price",e.target.value)} style={{padding:"7px 10px",fontSize:13}} /></div>
                </div>
              </div>
            </Card>
          ))}
        </Section>

        {/* MESSAGES */}
        <Section title="✉️ Message Templates">
          <div style={{display:"flex",gap:6,marginBottom:12,overflowX:"auto",paddingBottom:4}}>
            {Object.entries(msgGroups).map(([k,g])=>(
              <button key={k} onClick={()=>setMsgTab(k)} style={{background:msgTab===k?C.p500:C.surface,border:`1px solid ${msgTab===k?C.p500:C.border}`,borderRadius:8,padding:"6px 12px",color:msgTab===k?"#fff":C.muted,fontSize:12,cursor:"pointer",fontWeight:600,whiteSpace:"nowrap"}}>
                {g.label}
              </button>
            ))}
          </div>
          {msgGroups[msgTab]?.keys.map((key,i)=>(
            <Card key={key} style={{marginBottom:10}} accent={editMsgKey===key?C.p500:null}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <Tag text={msgGroups[msgTab].labels[i]} />
                <button onClick={()=>setEditMsgKey(editMsgKey===key?null:key)} style={{background:"none",border:"none",color:C.muted,fontSize:12,cursor:"pointer",fontWeight:600}}>{editMsgKey===key?"✅ Done":"✏️ Edit"}</button>
              </div>
              {editMsgKey===key
                ?<textarea defaultValue={msgs[key]} onBlur={e=>setMsgs({...msgs,[key]:e.target.value})} rows={4} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 12px",color:C.text,fontSize:13,width:"100%",outline:"none",fontFamily:"inherit"}} />
                :<div style={{color:C.muted,fontSize:12,lineHeight:1.6}}>{msgs[key]?.slice(0,110)}…</div>
              }
            </Card>
          ))}
        </Section>

        {/* ACCOUNT */}
        <Section title="👤 Account">
          <Card>
            <div style={{marginBottom:12}}>
              <div style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:.8,marginBottom:4}}>SIGNED IN AS</div>
              <div style={{fontWeight:700,fontSize:14}}>{userEmail}</div>
            </div>
            <Btn full ghost color={C.red} onClick={logout}>🚪 Sign Out</Btn>
          </Card>
        </Section>
      </div>
    );
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────
  const nav = [{id:"home",icon:"🏠",l:"Home"},{id:"members",icon:"👥",l:"Members"},{id:"automate",icon:"⚡",l:"Automate"},{id:"ai",icon:"🧠",l:"AI"},{id:"reports",icon:"📊",l:"Reports"},{id:"settings",icon:"⚙️",l:"Settings"}];

  return (
    <div style={{fontFamily:"'Outfit',sans-serif",background:C.bg,minHeight:"100vh",color:C.text,maxWidth:480,margin:"0 auto",position:"relative",paddingBottom:80}}>
      <style>{css}</style>

      {toast&&<div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",background:toast.type==="err"?C.red:C.p500,color:"#fff",borderRadius:12,padding:"10px 22px",fontWeight:700,fontSize:13,zIndex:9999,maxWidth:"90vw",textAlign:"center",boxShadow:"0 8px 24px #0008",lineHeight:1.4}}>{toast.msg}</div>}

      {/* Header */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {gymImage
            ? <img src={gymImage} alt="gym" style={{width:36,height:36,borderRadius:10,objectFit:"cover",border:`2px solid ${C.p500}44`}} />
            : <span style={{fontSize:26}}>{gymEmoji}</span>
          }
          <div>
            <div style={{fontWeight:900,fontSize:15,letterSpacing:-.3}}>{gymName}</div>
            <div style={{color:autosRunning?C.green:C.p400,fontSize:10,fontWeight:700,letterSpacing:1.2}}>{autosRunning?"● LIVE":"GYM SUITE"}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {todayBdays.length>0&&<Tag text="🎂" color={C.pink} />}
          <ZenoraLogo />
          <button className="tap" onClick={()=>setModal("addMember")} style={{background:C.p500,color:"#fff",border:"none",borderRadius:10,padding:"7px 12px",fontWeight:700,fontSize:13,cursor:"pointer"}}>+ Add</button>
        </div>
      </div>

      {/* Screen content */}
      {tab==="home"     &&<HomeScreen />}
      {tab==="members"  &&<MembersScreen />}
      {tab==="automate" &&<AutomateScreen />}
      {tab==="ai"       && AIJsx}
      {tab==="reports"  &&<ReportsScreen key="reports" />}
      {tab==="settings" &&<SettingsScreen key="settings" />}

      {/* Bottom Nav */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:C.surface,borderTop:`1px solid ${C.border}`,display:"flex",zIndex:100}}>
        {nav.map(n=>(
          <button key={n.id} className="tap" onClick={()=>setTab(n.id)} style={{flex:1,background:"none",border:"none",padding:"9px 4px 7px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:1,color:tab===n.id?C.p400:C.muted}}>
            <span style={{fontSize:18}}>{n.icon}</span>
            <span style={{fontSize:9,fontWeight:700}}>{n.l}</span>
            {tab===n.id&&<div style={{width:4,height:4,borderRadius:"50%",background:C.p500,marginTop:1}} />}
          </button>
        ))}
      </div>

      {/* Queue Modal */}
      {queueModal&&<QueueModal queue={queueModal.queue} label={queueModal.label} gymImage={gymImage} onClose={()=>setQueueModal(null)} onLog={logMsg} />}

      {/* Add Member */}
      {modal==="addMember"&&(
        <Modal title="➕ New Member" onClose={()=>setModal(null)}>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div style={{display:"flex",flexDirection:"column",gap:5}}><label style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:.8}}>FULL NAME *</label><input className="inp" placeholder="Rahul Gupta" value={newName} onChange={e=>setNewName(e.target.value)} /></div>
              <div style={{display:"flex",flexDirection:"column",gap:5}}><label style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:.8}}>PHONE *</label><input className="inp" type="tel" placeholder="10 digits" value={newPhone} onChange={e=>setNewPhone(e.target.value)} /></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div style={{display:"flex",flexDirection:"column",gap:5}}><label style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:.8}}>PLAN</label><select className="inp" value={newPlanId} onChange={e=>setNewPlanId(e.target.value)} style={{appearance:"none"}}>{plans.map(p=><option key={p.id} value={p.id}>{p.label} — {rupees(p.price)}</option>)}</select></div>
              <div style={{display:"flex",flexDirection:"column",gap:5}}><label style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:.8}}>TRAINER</label><select className="inp" value={newTrainer} onChange={e=>setNewTrainer(e.target.value)} style={{appearance:"none"}}>{trainers.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}><label style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:.8}}>FITNESS GOAL</label><select className="inp" value={newGoal} onChange={e=>setNewGoal(e.target.value)} style={{appearance:"none"}}>{INIT_GOALS.map(g=><option key={g} value={g}>{g}</option>)}</select></div>
            {/* JOIN DATE — key fix: gym owner can backdate if adding a member who already joined */}
            <div style={{background:C.surface,borderRadius:12,padding:12,border:`1px solid ${C.border}`}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <span style={{fontSize:16}}>📅</span>
                <div>
                  <div style={{fontWeight:700,fontSize:13}}>Join Date</div>
                  <div style={{color:C.muted,fontSize:11}}>Change if member already joined before today</div>
                </div>
              </div>
              <input className="inp" type="date" value={newJoined} onChange={e=>setNewJoined(e.target.value)} max={mkDate(0)} />
              {newJoined !== mkDate(0) && (
                <div style={{marginTop:8,background:C.amber+"18",border:`1px solid ${C.amber}44`,borderRadius:8,padding:"6px 10px",fontSize:12,color:C.amber,fontWeight:600}}>
                  ⚠️ Joined {daysSince(newJoined)} days ago — expiry will be calculated from {newJoined}
                </div>
              )}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div style={{display:"flex",flexDirection:"column",gap:5}}><label style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:.8}}>BIRTHDAY (OPTIONAL)</label><input className="inp" type="date" value={newBday} onChange={e=>setNewBday(e.target.value)} /></div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}><label style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:.8}}>NOTES / INJURIES</label><textarea className="inp" rows={2} placeholder="e.g. Knee injury, morning slots" value={newNotes} onChange={e=>setNewNotes(e.target.value)} /></div>
            <Btn full onClick={addMember} color={C.p500}>➕ Add Member + Send Welcome</Btn>
          </div>
        </Modal>
      )}

      {/* Edit Member */}
      {modal==="editMember"&&editData&&(
        <Modal title="✏️ Edit Member" onClose={()=>{setModal(null);setEditData(null);}}>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div style={{display:"flex",flexDirection:"column",gap:5}}><label style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:.8}}>NAME</label><input className="inp" defaultValue={editData.name} onBlur={e=>setEditData(d=>({...d,name:e.target.value}))} /></div>
              <div style={{display:"flex",flexDirection:"column",gap:5}}><label style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:.8}}>PHONE</label><input className="inp" type="tel" defaultValue={editData.phone} onBlur={e=>setEditData(d=>({...d,phone:e.target.value}))} /></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div style={{display:"flex",flexDirection:"column",gap:5}}><label style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:.8}}>PLAN</label><select className="inp" value={editData.planId} onChange={e=>{const p=plans.find(x=>x.id===e.target.value)||plans[0];setEditData(d=>({...d,planId:e.target.value,expiry:addPeriod(d.joined,p.value,p.unit)}));}} style={{appearance:"none"}}>{plans.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select></div>
              <div style={{display:"flex",flexDirection:"column",gap:5}}><label style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:.8}}>TRAINER</label><select className="inp" value={editData.trainer} onChange={e=>setEditData(d=>({...d,trainer:e.target.value}))} style={{appearance:"none"}}>{trainers.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}><label style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:.8}}>GOAL</label><select className="inp" value={editData.goal} onChange={e=>setEditData(d=>({...d,goal:e.target.value}))} style={{appearance:"none"}}>{INIT_GOALS.map(g=><option key={g} value={g}>{g}</option>)}</select></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div style={{display:"flex",flexDirection:"column",gap:5}}><label style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:.8}}>EXPIRY</label><input className="inp" type="date" value={editData.expiry} onChange={e=>setEditData(d=>({...d,expiry:e.target.value}))} /></div>
              <div style={{display:"flex",flexDirection:"column",gap:5}}><label style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:.8}}>BIRTHDAY</label><input className="inp" type="date" value={editData.birthday||""} onChange={e=>setEditData(d=>({...d,birthday:e.target.value}))} /></div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}><label style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:.8}}>NOTES</label><textarea className="inp" rows={2} defaultValue={editData.notes||""} onBlur={e=>setEditData(d=>({...d,notes:e.target.value}))} /></div>
            <Btn full onClick={saveEdit}>✅ Save Changes</Btn>
            <Btn full danger onClick={()=>deleteMember(editData.id)}>🗑️ Delete Member</Btn>
          </div>
        </Modal>
      )}

      {/* Member Detail */}
      {modal==="memberDetail"&&selectedM&&(()=>{
        const m=members.find(x=>x.id===selectedM.id)||selectedM;
        const risk=riskOf(m); const ch=churnScore(m); const cons=consistencyScore(m); const pay=payScore(m);
        const absent=daysSince(m.lastVisit); const expD=daysLeft(m.expiry);
        const msgK=absent>=10?"absent_d10":absent>=7?"absent_d7":absent>=5?"absent_d5":"absent_d3";
        const expK=expD<=0?"expiry_d0":expD<=2?"expiry_d2":"expiry_d5";
        const [pDays,setPDays]=useState("7");
        return (
          <Modal title="👤 Member Profile" onClose={()=>{setModal(null);setSelectedM(null);}}>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:50,height:50,borderRadius:14,background:`linear-gradient(135deg,${C.p700},${C.pink})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:800,color:"#fff",flexShrink:0}}>{m.name.charAt(0)}</div>
                <div style={{flex:1}}><div style={{fontWeight:800,fontSize:17}}>{m.name}</div><div style={{color:C.muted,fontSize:12}}>📱 +91{m.phone}</div></div>
                <Tag text={risk.label} color={risk.color} />
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {[{l:"Plan",v:plans.find(p=>p.id===m.planId)?.label||m.planId},{l:"Trainer",v:m.trainer},{l:"Goal",v:m.goal},{l:"Joined",v:m.joined},{l:"Expiry",v:m.expiry,c:expD<=3?C.red:expD<=7?C.amber:C.green},{l:"Last Visit",v:`${absent}d ago`,c:absent>=7?C.red:absent>=3?C.amber:C.green},{l:"Payment",v:m.paid?"✅ Paid":"❌ Unpaid",c:m.paid?C.green:C.red},{l:"Points",v:"⭐ "+m.points}].map(x=>(
                  <div key={x.l} style={{background:C.bg,borderRadius:10,padding:"8px 12px"}}><div style={{color:C.muted,fontSize:10,fontWeight:600}}>{x.l.toUpperCase()}</div><div style={{fontWeight:700,fontSize:13,color:x.c||C.text,marginTop:2}}>{x.v}</div></div>
                ))}
              </div>
              <div style={{background:C.bg,borderRadius:12,padding:12}}>
                <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>Scores</div>
                {[{l:"Consistency",v:cons,c:cons>70?C.green:cons>40?C.amber:C.red},{l:"Churn Risk",v:ch,c:ch<30?C.green:ch<60?C.amber:C.red},{l:"Pay Probability",v:pay,c:pay>70?C.green:pay>40?C.amber:C.red}].map(s=>(
                  <div key={s.l} style={{marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:12,color:C.muted}}>{s.l}</span><span style={{fontSize:12,fontWeight:700,color:s.c}}>{s.v}%</span></div><PBar value={s.v} color={s.c} /></div>
                ))}
              </div>
              <div style={{background:C.bg,borderRadius:12,padding:12}}>
                <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>Attendance (14d)</div>
                <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{m.attendance.slice(-14).map((a,i)=><div key={i} style={{width:18,height:18,borderRadius:4,background:a?C.green:C.red,opacity:.85}} />)}</div>
              </div>
              {m.notes&&<div style={{background:C.bg,borderRadius:12,padding:12}}><div style={{color:C.muted,fontSize:10,fontWeight:700,marginBottom:4}}>NOTES</div><div style={{fontSize:13}}>{m.notes}</div></div>}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <button className="tap" onClick={()=>startQueue([m],()=>fmtMsg(msgs[msgK],m,G),"Follow-Up")} style={{background:"#25D366",color:"#fff",border:"none",borderRadius:10,padding:"9px 14px",fontWeight:700,fontSize:13,cursor:"pointer"}}>💬 Follow Up</button>
                {expD<=7&&<button className="tap" onClick={()=>startQueue([m],()=>fmtMsg(msgs[expK],m,G),"Expiry")} style={{background:"#25D366",color:"#fff",border:"none",borderRadius:10,padding:"9px 14px",fontWeight:700,fontSize:13,cursor:"pointer"}}>💬 Expiry</button>}
                {!m.paid&&<Btn small color={C.green} onClick={()=>markPaid(m.id)}>✅ Paid</Btn>}
                <Btn small color={C.p500} onClick={()=>{markAtt(m.id,1);notify("✅ Checked in");}}>📍 Check In</Btn>
                <Btn small ghost color={C.amber} onClick={()=>{setEditData({...m});setModal("editMember");}}>✏️ Edit</Btn>
                <Btn small ghost color={C.teal} onClick={()=>pauseMember(m.id,pDays)}>⏸️ Extend +{pDays}d</Btn>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <input className="inp" type="number" defaultValue={pDays} onBlur={e=>setPDays(e.target.value)} style={{flex:1}} />
                <span style={{color:C.muted,fontSize:12}}>days</span>
              </div>
              <Btn full danger onClick={()=>setConfirmDel(m.id)}>🗑️ Remove Member</Btn>
            </div>
          </Modal>
        );
      })()}

      {/* Confirm Delete */}
      {confirmDel&&(
        <div style={{position:"fixed",inset:0,background:"#000d",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div className="fade" style={{background:C.surface,border:`1px solid ${C.red}55`,borderRadius:20,padding:24,width:"100%",maxWidth:320,textAlign:"center"}}>
            <div style={{fontSize:40,marginBottom:12}}>🗑️</div>
            <div style={{fontWeight:800,fontSize:18,marginBottom:8}}>Remove Member?</div>
            <div style={{color:C.muted,fontSize:14,marginBottom:20}}>This cannot be undone.</div>
            <div style={{display:"flex",gap:10}}>
              <Btn full ghost color={C.muted} onClick={()=>setConfirmDel(null)}>Cancel</Btn>
              <Btn full danger onClick={()=>deleteMember(confirmDel)}>Yes, Remove</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Festival Modal */}
      {festModal&&(()=>{
        const [customFest, setCustomFest] = useState("");
        return (
          <div style={{position:"fixed",inset:0,background:"#000c",zIndex:400,display:"flex",alignItems:"flex-end"}} onClick={()=>setFestModal(false)}>
            <div onClick={e=>e.stopPropagation()} className="fade" style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:"22px 22px 0 0",padding:22,width:"100%",maxWidth:480,margin:"0 auto"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <div style={{fontWeight:800,fontSize:18}}>🎊 Festival Blast</div>
                <button onClick={()=>setFestModal(false)} style={{background:C.border,border:"none",color:C.text,fontSize:16,cursor:"pointer",borderRadius:"50%",width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
              </div>
              <div style={{color:C.muted,fontSize:13,marginBottom:16}}>One WhatsApp at a time for {members.length} members</div>

              {/* Custom festival name */}
              <div style={{background:C.card,borderRadius:14,padding:14,marginBottom:14,border:`1px solid ${C.border}`}}>
                <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>✏️ Custom Festival Name</div>
                <div style={{display:"flex",gap:8}}>
                  <input
                    className="inp"
                    placeholder="e.g. Pongal, Onam, Ugadi…"
                    value={customFest}
                    onChange={e=>setCustomFest(e.target.value)}
                    style={{flex:1}}
                  />
                  <button
                    className="tap"
                    onClick={()=>{
                      if(!customFest.trim()){return;}
                      startQueue(members, m=>fmtMsg(msgs.festival,m,{...G,festival:customFest.trim()}), customFest.trim()+" Wishes");
                      setFestModal(false);
                    }}
                    style={{background:C.p500,color:"#fff",border:"none",borderRadius:10,padding:"10px 16px",fontWeight:700,fontSize:13,cursor:"pointer",whiteSpace:"nowrap"}}
                  >
                    Send 🎉
                  </button>
                </div>
              </div>

              {/* Preset festivals */}
              <div style={{fontWeight:600,fontSize:12,color:C.muted,marginBottom:8,letterSpacing:.5}}>OR PICK A PRESET</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {FESTIVALS.map(f=>(
                  <button className="tap" key={f} onClick={()=>{startQueue(members,m=>fmtMsg(msgs.festival,m,{...G,festival:f}),f+" Wishes");setFestModal(false);}} style={{background:C.p500+"22",border:`1px solid ${C.p500}44`,borderRadius:12,padding:"12px 14px",color:C.text,fontSize:13,cursor:"pointer",fontWeight:600,textAlign:"left"}}>
                    🎉 {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
