import { useState, useRef, useEffect } from "react";

const CATS = [
  { key:"food",       label:"Food & Beverages",         icon:"🍛", color:"#FF4757", bg:"#FFF0F1", border:"#FFBCC0", grad:"linear-gradient(135deg,#FF4757,#FF6B81)" },
  { key:"housing",    label:"Housing & Rent",            icon:"🏠", color:"#00B4D8", bg:"#F0FBFF", border:"#90E0EF", grad:"linear-gradient(135deg,#00B4D8,#48CAE4)" },
  { key:"fuel",       label:"Utility Expenditures",      icon:"⚡", color:"#F7B731", bg:"#FFFBF0", border:"#FFE082", grad:"linear-gradient(135deg,#F7B731,#FFC93C)" },
  { key:"clothing",   label:"Clothing & Footwear",       icon:"👗", color:"#A55EEA", bg:"#F8F0FF", border:"#DDB8FF", grad:"linear-gradient(135deg,#A55EEA,#C77DFF)" },
  { key:"transport",  label:"Transport & Communication", icon:"🚌", color:"#20BF6B", bg:"#F0FFF7", border:"#A8EEC8", grad:"linear-gradient(135deg,#20BF6B,#26de81)" },
  { key:"healthcare", label:"Healthcare",                icon:"🏥", color:"#FC5C65", bg:"#FFF0F1", border:"#FFBCC0", grad:"linear-gradient(135deg,#FC5C65,#FF6B81)" },
  { key:"education",  label:"Education",                 icon:"📚", color:"#2D98DA", bg:"#F0F8FF", border:"#A8D4F5", grad:"linear-gradient(135deg,#2D98DA,#45AAF2)" },
  { key:"misc",       label:"Miscellaneous",             icon:"🛒", color:"#8854D0", bg:"#F5F0FF", border:"#C9ABFF", grad:"linear-gradient(135deg,#8854D0,#A55EEA)" },
];

const DEFAULT = { food:8000,housing:15000,fuel:3000,clothing:2000,transport:4000,healthcare:2000,education:3000,misc:5000 };

const STATE_OFFSETS = {
  "Andhra Pradesh":0.4,"Arunachal Pradesh":0.8,"Assam":0.6,"Bihar":0.9,
  "Chhattisgarh":0.3,"Goa":-0.3,"Gujarat":0.2,"Haryana":0.5,
  "Himachal Pradesh":-0.1,"Jharkhand":0.7,"Karnataka":0.1,"Kerala":-0.2,
  "Madhya Pradesh":0.6,"Maharashtra":0.0,"Manipur":1.2,"Meghalaya":0.9,
  "Mizoram":1.1,"Nagaland":1.0,"Odisha":0.5,"Punjab":0.3,
  "Rajasthan":0.4,"Sikkim":0.7,"Tamil Nadu":-0.1,"Telangana":0.3,
  "Tripura":0.8,"Uttar Pradesh":0.7,"Uttarakhand":0.2,"West Bengal":0.6,
  "Delhi":-0.4,"Chandigarh":-0.5,"Jammu & Kashmir":0.5,"Ladakh":1.3,
};

const PRESETS = [
  { label:"Student",     icon:"🎓", desc:"Urban student",      color:"#2D98DA", grad:"linear-gradient(135deg,#2D98DA,#45AAF2)", spending:{food:4000,housing:6000,fuel:800,clothing:1500,transport:2000,healthcare:500,education:8000,misc:2000} },
  { label:"Young Pro",   icon:"💼", desc:"Metro professional", color:"#20BF6B", grad:"linear-gradient(135deg,#20BF6B,#26de81)", spending:{food:7000,housing:20000,fuel:2000,clothing:3000,transport:5000,healthcare:1500,education:1000,misc:6000} },
  { label:"Family of 4", icon:"👨‍👩‍👧‍👦", desc:"Mid-size city",      color:"#FC5C65", grad:"linear-gradient(135deg,#FC5C65,#FF6B81)", spending:{food:12000,housing:15000,fuel:3500,clothing:3000,transport:5000,healthcare:3000,education:8000,misc:4000} },
  { label:"Senior",      icon:"🏡", desc:"Retired couple",     color:"#F7B731", grad:"linear-gradient(135deg,#F7B731,#FFC93C)", spending:{food:8000,housing:5000,fuel:2000,clothing:1000,transport:2000,healthcare:8000,education:0,misc:3000} },
  { label:"Rural",       icon:"🌾", desc:"Village household",  color:"#8854D0", grad:"linear-gradient(135deg,#8854D0,#A55EEA)", spending:{food:5000,housing:1500,fuel:1200,clothing:800,transport:1500,healthcare:1500,education:2000,misc:1500} },
];

const SUBSTITUTIONS = {
  food:["Switch to local kirana over supermarkets (save 10-15%)","Buy seasonal vegetables — off-season items cost 2-3x more","Use ONDC apps (Magicpin, Ola Dash) for cheaper grocery delivery","Cook at home 5+ days a week — eating out inflates food spend by 40%"],
  housing:["Negotiate rent annually citing vacancy rates in your area","Consider co-living spaces if single — saves 30-40% on rent","Move slightly further from city centre — rent drops 20-25% per km","Check PM Awas Yojana eligibility for subsidised housing"],
  fuel:["Switch to LED bulbs and 5-star rated appliances","Use solar water heaters — saves 60-70% on water heating costs","Switch to PNG (piped natural gas) from LPG cylinders where available","Track peak-hour usage with a smart meter"],
  clothing:["Buy end-of-season sales (Jan & Jul) — discounts up to 70%","Explore Meesho and Myntra outlet for affordable branded clothing","Capsule wardrobe approach — fewer, better quality items","Swap or rent occasion wear instead of buying"],
  transport:["Switch to monthly metro/bus pass — saves 20-30% vs daily tickets","Carpool with colleagues — split fuel costs 4 ways","Consider CNG/electric vehicle for daily commute","Work from home 2-3 days a week to cut commute costs"],
  healthcare:["Get a family floater health insurance — cheaper than individual plans","Use Jan Aushadhi Kendras for generic medicines (50-90% cheaper)","Use telemedicine (Practo, 1mg) for consultations — saves OPD fees","Opt for preventive check-ups — cheaper than treatment"],
  education:["Use NPTEL, Swayam, and government e-learning portals (free)","Buy second-hand textbooks from seniors or OLX","Group tuitions are 40-50% cheaper than individual ones","Look for PM Scholarship schemes and state education grants"],
  misc:["Audit all subscriptions — cancel unused ones (avg Indian wastes ₹800/month)","Use UPI cashback offers and credit card reward points","Buy electronics during Big Billion Days / Great Indian Festival","Batch errands to reduce ad-hoc spending"],
};

const PEER_BENCHMARK = { p25:2.8,p50:3.4,p75:4.2,p90:5.1 };
const FORECAST_DELTA = { food:-0.3,housing:0.1,fuel:0.2,clothing:0.0,transport:0.1,healthcare:0.1,education:0.0,misc:0.1 };
const TABS = ["Calculator","Tracker","Insights","Tools"];
const FALLBACK_CPI = { month:"Mar 2026",headline:3.40,food:3.71,housing:2.11,fuel:1.97,clothing:3.50,transport:3.43,healthcare:3.43,education:3.32,misc:4.23,base:"2024=100",est:false };
const TOAST_COLORS = { info:"linear-gradient(135deg,#5C6BC0,#3F51B5)",success:"linear-gradient(135deg,#20BF6B,#26de81)",error:"linear-gradient(135deg,#FC5C65,#FF4757)" };

async function fetchLatestCPI() {
  const now = new Date();
  const cacheKey = `cpi_${now.getFullYear()}_${now.getMonth()}_${now.getDate()>=12?"new":"old"}`;
  try {
    const [cd,ck] = await Promise.all([window.storage.get("cpi_live_json"),window.storage.get("cpi_cache_key")]);
    if (cd&&ck&&ck.value===cacheKey) return JSON.parse(cd.value);
  } catch {}
  try {
    const r = await fetch("https://api.worldbank.org/v2/country/IN/indicator/FP.CPI.TOTL.ZG?format=json&mrv=2&per_page=2");
    if (!r.ok) throw new Error();
    const json = await r.json();
    const latest = json?.[1]?.filter(e=>e.value!==null)?.[0];
    if (!latest?.value) throw new Error();
    const h = +latest.value.toFixed(2);
    const mults = {food:1.09,housing:0.62,fuel:0.58,clothing:1.03,transport:1.01,healthcare:1.01,education:0.98,misc:1.24};
    const parsed = {month:latest.date,headline:h,base:"2024=100",est:true};
    Object.keys(mults).forEach(k=>{parsed[k]=+(h*mults[k]).toFixed(2);});
    await window.storage.set("cpi_live_json",JSON.stringify(parsed));
    await window.storage.set("cpi_cache_key",cacheKey);
    return parsed;
  } catch {}
  return null;
}

function Dots(){return <div className="dots"><span/><span/><span/></div>;}

function DonutChart({ weights, cats, total }) {
  const cx=90,cy=90,r=70,ir=44;
  const slices=[];
  let angle=-Math.PI/2;
  cats.forEach(c=>{
    const pct=(weights[c.key]||0)/100;
    const sweep=pct*2*Math.PI;
    if(pct>=0.005){
      const x1=cx+r*Math.cos(angle), y1=cy+r*Math.sin(angle);
      const x2=cx+r*Math.cos(angle+sweep), y2=cy+r*Math.sin(angle+sweep);
      const ix1=cx+ir*Math.cos(angle), iy1=cy+ir*Math.sin(angle);
      const ix2=cx+ir*Math.cos(angle+sweep), iy2=cy+ir*Math.sin(angle+sweep);
      const large=sweep>Math.PI?1:0;
      const path=`M${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large} 1 ${x2.toFixed(2)},${y2.toFixed(2)} L${ix2.toFixed(2)},${iy2.toFixed(2)} A${ir},${ir} 0 ${large} 0 ${ix1.toFixed(2)},${iy1.toFixed(2)} Z`;
      slices.push({...c,path,pct});
    }
    angle+=sweep;
  });
  return(
    <div style={{display:"flex",alignItems:"center",gap:"1.5rem",flexWrap:"wrap",justifyContent:"center"}}>
      <div style={{flexShrink:0}}>
        <svg width="180" height="180" viewBox="0 0 180 180">
          {slices.map(s=>(
            <path key={s.key} d={s.path} fill={s.color} style={{filter:`drop-shadow(0 2px 6px ${s.color}55)`,transition:"all .4s"}}/>
          ))}
          <text x="90" y="85" textAnchor="middle" fontSize="12" fontWeight="800" fill="#333" fontFamily="DM Sans,sans-serif">{"₹"+(total/1000).toFixed(0)+"k"}</text>
          <text x="90" y="101" textAnchor="middle" fontSize="9" fontWeight="600" fill="#AAA" fontFamily="DM Sans,sans-serif">monthly</text>
        </svg>
      </div>
      <div style={{flex:1,minWidth:160}}>
        {[...cats].filter(c=>(weights[c.key]||0)>0.5).sort((a,b)=>(weights[b.key]||0)-(weights[a.key]||0)).map(c=>(
          <div key={c.key} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
            <div style={{width:10,height:10,borderRadius:3,background:c.color,flexShrink:0,boxShadow:`0 2px 4px ${c.color}55`}}/>
            <div style={{fontSize:11,color:"#555",fontWeight:600,flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.icon} {c.label}</div>
            <div style={{fontSize:11,fontWeight:800,color:c.color,flexShrink:0}}>{(weights[c.key]||0).toFixed(1)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const S=`
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
body{font-family:'DM Sans',sans-serif;background:#F4F6FF;}
.wrap{background:#F4F6FF;min-height:100vh;}
.hero{background:linear-gradient(135deg,#5B2D8E 0%,#764ba2 40%,#2D98DA 100%);padding:2.5rem 1.5rem 2rem;text-align:center;position:relative;overflow:hidden;}
.hero::before{content:'';position:absolute;inset:0;background:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Ccircle cx='30' cy='30' r='20'/%3E%3C/g%3E%3C/svg%3E");pointer-events:none;}
.pill{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.18);color:#fff;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:6px 16px;border-radius:100px;margin-bottom:1rem;border:1px solid rgba(255,255,255,.25);}
.hero h1{font-size:clamp(1.8rem,5vw,3rem);font-weight:800;color:#fff;line-height:1.1;margin-bottom:.6rem;letter-spacing:-1.5px;text-shadow:0 2px 16px rgba(0,0,0,.2);}
.hero h1 span{color:#FFD93D;text-shadow:0 0 20px rgba(255,217,61,.4);}
.hero p{font-size:.95rem;color:rgba(255,255,255,.82);max-width:440px;margin:0 auto;line-height:1.6;}
.tabs{display:flex;background:#fff;overflow-x:auto;box-shadow:0 4px 16px rgba(91,45,142,.1);position:sticky;top:0;z-index:10;}
.tab{padding:15px 20px;font-size:13px;font-weight:700;color:#AAA;cursor:pointer;border-bottom:3px solid transparent;transition:all .18s;white-space:nowrap;background:none;border-left:none;border-right:none;border-top:none;font-family:'DM Sans',sans-serif;touch-action:manipulation;user-select:none;}
.tab.active{color:#764ba2;border-bottom-color:#764ba2;background:linear-gradient(to bottom,#fff,#FAF6FF);}
.tab:hover:not(.active){color:#764ba2;background:#FAF6FF;}
.tab:active{transform:scale(.96);}
.main{max-width:920px;margin:0 auto;padding:1.2rem;}
.card{background:#fff;border-radius:20px;padding:1.3rem 1.4rem;margin-bottom:1.2rem;box-shadow:0 4px 20px rgba(91,45,142,.08);transition:box-shadow .25s,transform .2s;}
.card:hover{box-shadow:0 8px 32px rgba(91,45,142,.14);}
.card-title{font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;margin-bottom:1rem;display:flex;align-items:center;gap:8px;}
.seg{display:flex;gap:4px;background:#F0EBF8;border-radius:14px;padding:4px;}
.seg-btn{flex:1;padding:9px 10px;font-size:12px;font-weight:700;border:none;border-radius:11px;cursor:pointer;font-family:'DM Sans',sans-serif;color:#888;background:none;transition:all .2s;white-space:nowrap;touch-action:manipulation;user-select:none;}
.seg-btn.active{background:linear-gradient(135deg,#764ba2,#5B2D8E);color:#fff;box-shadow:0 4px 12px rgba(91,45,142,.35);}
.seg-btn:hover:not(.active){color:#764ba2;background:rgba(118,75,162,.1);}
.seg-btn:active{transform:scale(.93);}
.select{width:100%;background:#F8F4FF;border:2px solid #E0D4F0;border-radius:12px;padding:10px 13px;font-size:13px;font-weight:700;color:#333;font-family:'DM Sans',sans-serif;outline:none;cursor:pointer;transition:all .2s;}
.select:focus{border-color:#764ba2;box-shadow:0 0 0 3px rgba(118,75,162,.12);}
.preset-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px;}
.preset-btn{border-radius:18px;padding:1rem .8rem;cursor:pointer;text-align:center;font-family:'DM Sans',sans-serif;border:none;touch-action:manipulation;user-select:none;transition:transform .15s,box-shadow .15s;box-shadow:0 4px 14px rgba(0,0,0,.12);position:relative;overflow:hidden;}
.preset-btn:hover{transform:translateY(-4px) scale(1.03);box-shadow:0 10px 28px rgba(0,0,0,.18);}
.preset-btn:active{transform:scale(.93)!important;box-shadow:0 2px 8px rgba(0,0,0,.15);}
.preset-icon{font-size:30px;display:block;margin-bottom:7px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.2));}
.preset-label{font-size:12px;font-weight:800;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,.3);}
.preset-desc{font-size:10px;color:rgba(255,255,255,.8);margin-top:2px;}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:1.2rem;}
@media(max-width:540px){.grid2{grid-template-columns:1fr;}}
.cat{border-radius:16px;padding:1rem;transition:transform .15s,box-shadow .15s;border:2.5px solid transparent;touch-action:manipulation;}
.cat:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,.1);}
.cat:active{transform:scale(.97);}
.cat:focus-within{box-shadow:0 0 0 4px rgba(118,75,162,.18);}
.cat.filled{animation:flashFill .7s ease;}
@keyframes flashFill{0%{transform:scale(1.04)}40%{transform:scale(1.02)}100%{transform:scale(1)}}
.cat-icon{font-size:26px;margin-bottom:6px;display:block;filter:drop-shadow(0 2px 4px rgba(0,0,0,.15));}
.cat-name{font-size:12px;font-weight:800;color:#333;margin-bottom:4px;}
.cat-pct{font-size:11px;font-weight:700;padding:2px 9px;border-radius:100px;display:inline-block;margin-bottom:8px;}
.inp-row{display:flex;gap:5px;align-items:center;}
.inp-wrap{display:flex;align-items:center;gap:5px;background:rgba(255,255,255,.7);border:2px solid rgba(255,255,255,.9);border-radius:10px;padding:7px 9px;flex:1;transition:all .2s;}
.inp-wrap:focus-within{background:#fff;border-color:#764ba2;box-shadow:0 0 0 3px rgba(118,75,162,.15);}
.inp-wrap span{font-size:13px;font-weight:800;transition:color .2s;}
.inp-wrap input{background:transparent;border:none;outline:none;font-size:14px;font-weight:800;color:#333;width:100%;font-family:'DM Sans',sans-serif;}
.inp-wrap input::-webkit-inner-spin-button{-webkit-appearance:none;}
.stepper{display:flex;flex-direction:column;gap:3px;}
.step-btn{background:rgba(255,255,255,.7);border:2px solid rgba(255,255,255,.9);border-radius:6px;width:24px;height:18px;cursor:pointer;font-size:10px;color:#666;display:flex;align-items:center;justify-content:center;transition:all .15s;touch-action:manipulation;font-weight:800;}
.step-btn:hover{background:#fff;border-color:#764ba2;color:#764ba2;transform:scale(1.1);}
.step-btn:active{transform:scale(.87);}
.track{height:4px;border-radius:2px;background:rgba(255,255,255,.4);margin-top:8px;overflow:hidden;}
.fill{height:100%;border-radius:2px;transition:width .45s cubic-bezier(.4,0,.2,1);background:rgba(255,255,255,.8);}
.btn-primary{display:flex;align-items:center;gap:7px;background:linear-gradient(135deg,#764ba2,#5B2D8E);color:#fff;font-size:12px;font-weight:800;padding:11px 18px;border-radius:12px;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;box-shadow:0 4px 16px rgba(91,45,142,.35);touch-action:manipulation;user-select:none;}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(91,45,142,.45);}
.btn-primary:active{transform:scale(.93);}
.btn-primary:disabled{opacity:.45;cursor:not-allowed;transform:none;box-shadow:none;}
.btn-ghost{font-size:11px;font-weight:700;color:#888;background:#F4F6FF;border:2px solid #E0D4F0;border-radius:10px;padding:8px 14px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;touch-action:manipulation;}
.btn-ghost:hover{border-color:#FC5C65;color:#FC5C65;background:#FFF0F1;}
.btn-ghost:active{transform:scale(.93);}
.scan-ring{width:13px;height:13px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0;}
@keyframes spin{to{transform:rotate(360deg)}}
.results{background:linear-gradient(135deg,#F8F4FF 0%,#EDF4FF 100%);border:2.5px solid #DDD5F5;border-radius:22px;padding:1.6rem;margin-bottom:1.2rem;}
.rate-num{font-size:clamp(3.5rem,9vw,5.5rem);font-weight:800;line-height:1;letter-spacing:-3px;transition:color .5s;}
.rate-num.bumped{animation:rateBump .4s cubic-bezier(.34,1.56,.64,1);}
@keyframes rateBump{0%{transform:scale(1)}50%{transform:scale(1.08)}100%{transform:scale(1)}}
.rate-lbl{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#AAA;margin-bottom:6px;}
.delta-badge{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:800;padding:5px 14px;border-radius:100px;}
.cmp{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:1.5rem;}
.cmp-box{border-radius:16px;padding:1.1rem;text-align:center;transition:transform .2s,box-shadow .2s;cursor:default;touch-action:manipulation;}
.cmp-box:hover{transform:translateY(-4px);box-shadow:0 10px 28px rgba(0,0,0,.12);}
.cmp-box:active{transform:scale(.95);}
.cmp-num{font-size:1.8rem;font-weight:800;letter-spacing:-1px;}
.cmp-lbl{font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-top:4px;opacity:.65;}
.bar-row{display:flex;align-items:center;gap:10px;margin-bottom:9px;border-radius:10px;padding:6px 9px;transition:background .15s,transform .15s;cursor:default;touch-action:manipulation;}
.bar-row:hover{background:#F4F6FF;transform:translateX(4px);}
.bar-row:active{background:#EDE8F8;}
.bar-lbl{font-size:11px;color:#888;width:130px;flex-shrink:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600;display:flex;align-items:center;gap:6px;}
.bar-row:hover .bar-lbl{color:#333;}
.bar-track{flex:1;height:7px;background:#EEE;border-radius:4px;overflow:hidden;}
.bar-fill{height:100%;border-radius:4px;transition:width .6s cubic-bezier(.4,0,.2,1);}
.bar-val{font-size:11px;font-weight:800;width:36px;text-align:right;flex-shrink:0;}
.cta{background:linear-gradient(135deg,#5B2D8E,#764ba2,#2D98DA);background-size:200% 200%;color:#fff;font-size:14px;font-weight:800;padding:16px 24px;border-radius:15px;border:none;cursor:pointer;width:100%;font-family:'DM Sans',sans-serif;transition:all .2s;box-shadow:0 6px 20px rgba(91,45,142,.35);touch-action:manipulation;animation:gradShift 4s ease infinite;}
@keyframes gradShift{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
.cta:hover{transform:translateY(-2px);box-shadow:0 10px 32px rgba(91,45,142,.45);}
.cta:active{transform:scale(.96);}
.cta:disabled{opacity:.45;cursor:not-allowed;transform:none;animation:none;background:linear-gradient(135deg,#5B2D8E,#764ba2);}
.save-btn{display:flex;align-items:center;gap:6px;background:linear-gradient(135deg,#20BF6B,#26de81);color:#fff;border:none;border-radius:12px;padding:10px 18px;font-size:12px;font-weight:800;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;box-shadow:0 4px 14px rgba(32,191,107,.35);touch-action:manipulation;}
.save-btn:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(32,191,107,.45);}
.save-btn:active{transform:scale(.93);}
.ai-box{background:linear-gradient(135deg,#F8F4FF,#EDF4FF);border:2.5px solid #DDD5F5;border-radius:20px;padding:1.4rem;margin-bottom:1.2rem;animation:fadeUp .4s ease;}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
.ai-txt{font-size:13px;line-height:1.85;color:#555;}
.ai-txt p{margin-bottom:.85rem;}
.ai-txt p:last-child{margin-bottom:0;}
.ai-txt strong{color:#333;font-weight:800;}
.dots{display:inline-flex;gap:5px;}
.dots span{width:7px;height:7px;border-radius:50%;background:#A855F7;animation:bounce 1.2s infinite;}
.dots span:nth-child(2){animation-delay:.2s;}
.dots span:nth-child(3){animation-delay:.4s;}
@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-8px)}}
.metric-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:12px;margin-bottom:1.2rem;}
.metric{border-radius:16px;padding:1.1rem;text-align:center;transition:transform .2s,box-shadow .2s;touch-action:manipulation;}
.metric:hover{transform:translateY(-4px);box-shadow:0 10px 24px rgba(0,0,0,.1);}
.metric:active{transform:scale(.95);}
.metric-val{font-size:1.8rem;font-weight:800;letter-spacing:-1px;}
.metric-lbl{font-size:11px;margin-top:5px;line-height:1.4;font-weight:600;opacity:.8;}
.bench-bar{position:relative;height:14px;background:#EEE;border-radius:7px;margin:1rem 0;overflow:visible;box-shadow:inset 0 2px 4px rgba(0,0,0,.08);}
.bench-fill{height:100%;border-radius:7px;background:linear-gradient(90deg,#20BF6B,#F7B731,#FC5C65);}
.bench-marker{position:absolute;top:-6px;width:26px;height:26px;border-radius:50%;background:#333;border:4px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.25);transform:translateX(-50%);transition:left .6s cubic-bezier(.34,1.2,.64,1);}
.bench-labels{display:flex;justify-content:space-between;font-size:10px;color:#AAA;margin-top:6px;font-weight:600;}
.sal-inp{background:#F8F4FF;border:2.5px solid #E0D4F0;border-radius:12px;padding:10px 13px;font-size:14px;font-weight:800;color:#333;font-family:'DM Sans',sans-serif;outline:none;width:130px;transition:all .2s;}
.sal-inp:focus{border-color:#764ba2;box-shadow:0 0 0 3px rgba(118,75,162,.12);}
.sal-inp::-webkit-inner-spin-button{-webkit-appearance:none;}
.verdict{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:800;padding:10px 18px;border-radius:100px;margin-top:10px;animation:fadeUp .3s ease;}
.tracker-entry{display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:14px;margin-bottom:9px;transition:all .2s;cursor:default;touch-action:manipulation;}
.tracker-entry:hover{transform:translateX(6px);box-shadow:0 4px 14px rgba(0,0,0,.08);}
.tracker-entry:active{transform:scale(.97);}
.tracker-month{font-size:12px;font-weight:800;color:#333;width:80px;flex-shrink:0;}
.tracker-bar{flex:1;height:7px;border-radius:4px;overflow:hidden;background:#EEE;}
.tracker-fill{height:100%;border-radius:4px;}
.forecast-row{display:flex;align-items:center;gap:10px;margin-bottom:8px;padding:6px 9px;border-radius:10px;transition:background .15s;}
.forecast-row:hover{background:#F4F6FF;}
.forecast-lbl{font-size:11px;color:#888;width:130px;flex-shrink:0;font-weight:600;display:flex;align-items:center;gap:6px;}
.forecast-now{font-size:11px;font-weight:800;width:40px;text-align:right;color:#888;}
.forecast-arrow{font-size:12px;color:#CCC;}
.forecast-next{font-size:11px;font-weight:800;width:40px;}
.diary-entry{background:#F8F4FF;border:2.5px solid #E0D4F0;border-radius:14px;padding:1rem;margin-bottom:10px;transition:all .2s;}
.diary-entry:hover{border-color:#C9ABFF;transform:translateX(4px);}
.diary-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;}
.diary-month{font-size:12px;font-weight:800;color:#333;}
.diary-del{background:none;border:none;color:#CCC;cursor:pointer;font-size:16px;transition:all .15s;padding:3px 7px;border-radius:7px;touch-action:manipulation;}
.diary-del:hover{color:#FC5C65;background:#FFF0F1;}
.diary-del:active{transform:scale(.88);}
.diary-note{font-size:12px;color:#666;line-height:1.55;}
.sub-card{border-radius:16px;padding:1.1rem;margin-bottom:12px;transition:all .2s;}
.sub-card:hover{transform:translateY(-3px);box-shadow:0 8px 22px rgba(0,0,0,.1);}
.sub-cat{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
.sub-tip{font-size:12px;color:#555;padding:7px 0;border-bottom:1px dashed rgba(0,0,0,.08);line-height:1.55;font-weight:500;}
.sub-tip:last-child{border-bottom:none;padding-bottom:0;}
.tool-result{border-radius:16px;padding:1.2rem;margin-top:1rem;animation:fadeUp .3s ease;}
.tool-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px dashed rgba(0,0,0,.08);font-size:13px;}
.tool-row:last-child{border-bottom:none;}
.tool-key{color:#888;font-weight:500;}
.tool-val{font-weight:800;color:#333;}
.num-inp{background:#F8F4FF;border:2.5px solid #E0D4F0;border-radius:12px;padding:10px 13px;font-size:14px;font-weight:800;color:#333;font-family:'DM Sans',sans-serif;outline:none;transition:all .2s;width:100%;}
.num-inp:focus{border-color:#764ba2;box-shadow:0 0 0 3px rgba(118,75,162,.12);}
.num-inp::-webkit-inner-spin-button{-webkit-appearance:none;}
.overlay{position:fixed;inset:0;background:rgba(30,10,60,.65);z-index:50;display:flex;align-items:center;justify-content:center;animation:fadeIn .22s ease;backdrop-filter:blur(6px);}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.modal{background:#fff;border-radius:24px;padding:2.2rem 1.8rem;width:90%;max-width:360px;text-align:center;animation:popIn .3s cubic-bezier(.34,1.56,.64,1);box-shadow:0 24px 64px rgba(0,0,0,.22);}
@keyframes popIn{from{opacity:0;transform:scale(.82)}to{opacity:1;transform:scale(1)}}
.mbtn{display:flex;align-items:center;justify-content:center;gap:9px;padding:15px 20px;border-radius:14px;font-size:13px;font-weight:800;cursor:pointer;font-family:'DM Sans',sans-serif;border:none;transition:all .2s;width:100%;margin-bottom:10px;touch-action:manipulation;}
.mbtn:hover{transform:translateY(-2px);}
.mbtn:active{transform:scale(.93);}
.mbtn.primary{background:linear-gradient(135deg,#764ba2,#5B2D8E);color:#fff;box-shadow:0 6px 18px rgba(91,45,142,.4);}
.mbtn.secondary{background:#F8F4FF;color:#764ba2;border:2.5px solid #DDD5F5;}
.mbtn.secondary:hover{background:#F0EBFF;}
.mbtn-cancel{background:none;border:none;color:#BBB;font-size:12px;cursor:pointer;margin-top:6px;font-family:'DM Sans',sans-serif;font-weight:600;padding:6px 12px;touch-action:manipulation;}
.mbtn-cancel:active{transform:scale(.93);}
.cam-modal{background:#fff;border-radius:24px;overflow:hidden;width:90%;max-width:460px;animation:popIn .28s cubic-bezier(.34,1.56,.64,1);box-shadow:0 24px 64px rgba(0,0,0,.22);}
.cam-header{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:2px solid #F0EBF8;}
.cam-close{background:none;border:none;font-size:20px;cursor:pointer;color:#AAA;transition:all .15s;border-radius:9px;padding:5px 9px;touch-action:manipulation;}
.cam-close:hover{color:#333;background:#F4F6FF;}
.cam-close:active{transform:scale(.88);}
.snap-btn{width:64px;height:64px;border-radius:50%;border:4px solid #333;background:#fff;cursor:pointer;position:relative;transition:all .15s;touch-action:manipulation;}
.snap-btn::after{content:'';width:48px;height:48px;border-radius:50%;background:#333;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);transition:all .15s;}
.snap-btn:hover{border-color:#764ba2;}
.snap-btn:hover::after{background:#764ba2;width:52px;height:52px;}
.snap-btn:active::after{width:38px;height:38px;}
.preview-modal{background:#fff;border-radius:22px;padding:1.5rem;width:90%;max-width:340px;text-align:center;box-shadow:0 24px 64px rgba(0,0,0,.22);}
.preview-modal img{width:100%;max-height:210px;object-fit:contain;border-radius:12px;border:2px solid #F0EBF8;margin-bottom:1rem;}
.toast{position:fixed;bottom:24px;right:24px;left:24px;max-width:360px;margin:0 auto;font-size:13px;font-weight:800;padding:13px 20px;border-radius:14px;z-index:999;animation:toastIn .35s cubic-bezier(.34,1.56,.64,1);pointer-events:none;box-shadow:0 8px 28px rgba(0,0,0,.22);text-align:center;color:#fff;}
@keyframes toastIn{from{opacity:0;transform:translateY(20px) scale(.9)}to{opacity:1;transform:translateY(0) scale(1)}}
.footer{text-align:center;padding:1.5rem;color:#BBB;font-size:11px;border-top:2px solid #EEE;margin-top:1rem;font-weight:600;}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
`;

export default function App(){
  const [tab,setTab]=useState(0);
  const [spending,setSpending]=useState(DEFAULT);
  const [sector,setSector]=useState("combined");
  const [state,setState]=useState("Karnataka");
  const [cpiData,setCpiData]=useState(FALLBACK_CPI);
  const [liveStatus,setLiveStatus]=useState("checking");
  const [salary,setSalary]=useState("");
  const [ai,setAi]=useState("");
  const [aiLoading,setAiLoading]=useState(false);
  const [toast,setToast]=useState("");
  const [toastType,setToastType]=useState("info");
  const [scanning,setScanning]=useState(false);
  const [previewUrl,setPreviewUrl]=useState(null);
  const [filledKeys,setFilledKeys]=useState([]);
  const [modal,setModal]=useState(null);
  const [tracker,setTracker]=useState([]);
  const [diary,setDiary]=useState([]);
  const [diaryNote,setDiaryNote]=useState("");
  const [rateBumped,setRateBumped]=useState(false);
  const [goalAmount,setGoalAmount]=useState("");
  const [goalYears,setGoalYears]=useState("");
  const [emiAmount,setEmiAmount]=useState("");
  const [emiYears,setEmiYears]=useState("");
  const [sipAmount,setSipAmount]=useState("");
  const [sipReturn,setSipReturn]=useState("");
  const [sipYears,setSipYears]=useState("");
  const [activeTool,setActiveTool]=useState("goal");
  const prevRateRef=useRef(null);
  const toastRef=useRef(null);
  const fileRef=useRef(null);
  const videoRef=useRef(null);
  const canvasRef=useRef(null);
  const streamRef=useRef(null);
  const isMobile=/Mobi|Android|iPhone|iPad|iPod|Tablet/i.test(navigator.userAgent);

  const showToast=(msg,type="info")=>{
    setToast(msg);setToastType(type);
    clearTimeout(toastRef.current);
    toastRef.current=setTimeout(()=>setToast(""),2800);
  };

  useEffect(()=>{
    (async()=>{
      try{const fresh=await fetchLatestCPI();if(fresh?.month){setCpiData(fresh);setLiveStatus("live");}else setLiveStatus("failed");}
      catch{setLiveStatus("failed");}
    })();
  },[]);

  useEffect(()=>{
    if(modal!=="camera"&&streamRef.current){streamRef.current.getTracks().forEach(t=>t.stop());streamRef.current=null;}
  },[modal]);

  useEffect(()=>{
    (async()=>{
      try{
        const [tr,di]=await Promise.all([window.storage.get("tracker_data"),window.storage.get("diary_data")]);
        if(tr)setTracker(JSON.parse(tr.value));
        if(di)setDiary(JSON.parse(di.value));
      }catch{}
    })();
  },[]);

  // Derived values
  const total=Object.values(spending).reduce((a,b)=>a+Number(b),0);
  const weights={};
  CATS.forEach(c=>{weights[c.key]=total>0?(Number(spending[c.key])/total)*100:0;});
  const stateOffset=STATE_OFFSETS[state]||0;
  const sectorMult={combined:1,rural:0.97,urban:1.04}[sector];
  const adjustedCpi={};
  CATS.forEach(c=>{adjustedCpi[c.key]=+(((cpiData[c.key]||0)*sectorMult)+stateOffset*0.4).toFixed(2);});
  adjustedCpi.headline=+(cpiData.headline*sectorMult+stateOffset).toFixed(2);
  const personalRate=CATS.reduce((s,c)=>s+(weights[c.key]/100)*(adjustedCpi[c.key]||0),0);
  const diff=personalRate-adjustedCpi.headline;
  const rateColor=diff>1.5?"#FC5C65":diff>0?"#F7B731":"#20BF6B";
  const forecastCpi={};
  CATS.forEach(c=>{forecastCpi[c.key]=+(adjustedCpi[c.key]+(FORECAST_DELTA[c.key]||0)).toFixed(2);});
  const forecastRate=CATS.reduce((s,c)=>s+(weights[c.key]/100)*(forecastCpi[c.key]||0),0);
  const annualLoss=total*12*(personalRate/100);
  const getPercentile=r=>{
    if(r<=PEER_BENCHMARK.p25)return Math.round((r/PEER_BENCHMARK.p25)*25);
    if(r<=PEER_BENCHMARK.p50)return Math.round(25+(r-PEER_BENCHMARK.p25)/(PEER_BENCHMARK.p50-PEER_BENCHMARK.p25)*25);
    if(r<=PEER_BENCHMARK.p75)return Math.round(50+(r-PEER_BENCHMARK.p50)/(PEER_BENCHMARK.p75-PEER_BENCHMARK.p50)*25);
    return Math.round(75+(r-PEER_BENCHMARK.p75)/(PEER_BENCHMARK.p90-PEER_BENCHMARK.p75)*25);
  };
  const percentile=Math.min(99,getPercentile(personalRate));
  const markerLeft=Math.min(98,Math.max(2,(personalRate/(PEER_BENCHMARK.p90*1.1))*100));
  const salaryNum=parseFloat(salary)||0;
  const realRaise=salaryNum-personalRate;
  const salaryOk=realRaise>0;
  const maxR=Math.max(...CATS.map(c=>adjustedCpi[c.key]||0),adjustedCpi.headline||0)*1.1;
  const goalAmt=parseFloat(goalAmount)||0;
  const goalYr=parseFloat(goalYears)||0;
  const inflationAdjustedGoal=goalAmt*Math.pow(1+personalRate/100,goalYr);
  const monthlySavingsNeeded=goalYr>0&&personalRate>0?inflationAdjustedGoal/((Math.pow(1+personalRate/100/12,goalYr*12)-1)/(personalRate/100/12)):goalAmt/(goalYr*12||1);
  const emiAmt=parseFloat(emiAmount)||0;
  const emiYr=parseFloat(emiYears)||0;
  const totalEmiPaid=emiAmt*emiYr*12;
  const emiInflationBenefit=totalEmiPaid-emiAmt*12*emiYr/(1+personalRate/100*emiYr/2);
  const sipAmt=parseFloat(sipAmount)||0;
  const sipRet=parseFloat(sipReturn)||0;
  const sipYr=parseFloat(sipYears)||0;
  const sipFV=sipRet>0?sipAmt*((Math.pow(1+sipRet/100/12,sipYr*12)-1)/(sipRet/100/12))*(1+sipRet/100/12):0;
  const sipRealFV=sipFV/Math.pow(1+personalRate/100,sipYr);
  const sipBeatsInflation=sipRet>personalRate;
  const fmt=n=>Math.round(n).toLocaleString("en-IN");

  useEffect(()=>{
    if(prevRateRef.current!==null&&Math.abs(personalRate-prevRateRef.current)>0.05){
      setRateBumped(true);setTimeout(()=>setRateBumped(false),450);
    }
    prevRateRef.current=personalRate;
  },[personalRate]);

  function applyPreset(p){
    setSpending(p.spending);setFilledKeys(Object.keys(p.spending));
    setTimeout(()=>setFilledKeys([]),1200);
    showToast(`✓ Applied: ${p.label} profile`,"success");
  }

  function saveToTracker(){
    const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const now=new Date();
    const label=`${months[now.getMonth()]} ${now.getFullYear()}`;
    const entry={label,rate:+personalRate.toFixed(2),state,sector,date:Date.now()};
    const updated=[...tracker.filter(e=>e.label!==label),entry].sort((a,b)=>a.date-b.date).slice(-12);
    setTracker(updated);
    window.storage.set("tracker_data",JSON.stringify(updated)).catch(()=>{});
    showToast("✓ Saved to monthly tracker","success");
  }

  function saveDiaryEntry(){
    if(!diaryNote.trim())return;
    const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const now=new Date();
    const label=`${months[now.getMonth()]} ${now.getFullYear()}`;
    const entry={label,rate:+personalRate.toFixed(2),note:diaryNote.trim(),date:Date.now()};
    const updated=[entry,...diary].slice(-24);
    setDiary(updated);
    window.storage.set("diary_data",JSON.stringify(updated)).catch(()=>{});
    setDiaryNote("");
    showToast("✓ Diary entry saved","success");
  }

  function deleteDiaryEntry(idx){
    const updated=diary.filter((_,i)=>i!==idx);
    setDiary(updated);
    window.storage.set("diary_data",JSON.stringify(updated)).catch(()=>{});
  }

  async function openCamera(){
    setModal("camera");
    try{
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"},audio:false});
      streamRef.current=stream;
      if(videoRef.current){videoRef.current.srcObject=stream;videoRef.current.play();}
    }catch{setModal(null);showToast("⚠ Camera access denied","error");}
  }

  function snapPhoto(){
    const v=videoRef.current,cv=canvasRef.current;
    if(!v||!cv)return;
    cv.width=v.videoWidth;cv.height=v.videoHeight;
    cv.getContext("2d").drawImage(v,0,0);
    cv.toBlob(blob=>{if(!blob)return;setModal(null);processImage(new File([blob],"snap.jpg",{type:"image/jpeg"}));},"image/jpeg",0.92);
  }

  function handleFileUpload(e){
    const f=e.target.files?.[0];if(!f)return;
    e.target.value="";setModal(null);processImage(f);
  }

  async function processImage(file){
    const url=URL.createObjectURL(file);
    setPreviewUrl(url);setScanning(true);setModal("scanning");
    showToast("📷 Reading your spending sheet…","info");
    try{
      const b64=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.onerror=rej;r.readAsDataURL(file);});
      const resp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:600,messages:[{role:"user",content:[{type:"image",source:{type:"base64",media_type:file.type||"image/jpeg",data:b64}},{type:"text",text:`You are an expert OCR assistant. Carefully examine this image — it may be a handwritten note, printed receipt, screenshot, or budget sheet showing monthly expenses in Indian Rupees (₹ or Rs).

Your job: extract monthly spending amounts and map them to exactly these 8 categories:
- food: anything related to groceries, meals, dining, restaurant, Swiggy, Zomato, vegetables, milk
- housing: rent, EMI, home loan, society charges, maintenance, PG
- fuel: electricity bill, water bill, gas, LPG, piped gas, utility bills
- clothing: clothes, shoes, fashion, apparel, footwear
- transport: petrol, diesel, cab, Ola, Uber, auto, metro, bus pass, travel
- healthcare: doctor, hospital, medicine, pharmacy, health insurance, medical
- education: school fees, college fees, tuition, books, coaching, courses
- misc: everything else — entertainment, subscriptions, personal care, shopping, others

Rules:
1. If a value appears annual, divide by 12 to get monthly
2. If a category is not mentioned, return null for it
3. Numbers may be written as "8k" (=8000), "1.5L" (=150000), "15,000" or "15000"
4. Return ONLY a valid JSON object with exactly these 8 keys. No explanation, no markdown, no extra text.

Example output: {"food":8000,"housing":15000,"fuel":2000,"clothing":1500,"transport":3000,"healthcare":1000,"education":2000,"misc":3000}`}]}]})});
      const data=await resp.json();
      const raw=(data?.content?.[0]?.text||"{}").replace(/```json|```/g,"").trim();
      const parsed=JSON.parse(raw);
      const updated={...spending};const newFilled=[];
      Object.keys(parsed).forEach(k=>{if(parsed[k]!=null&&DEFAULT.hasOwnProperty(k)){updated[k]=Math.round(Number(parsed[k]));newFilled.push(k);}});
      if(!newFilled.length)throw new Error();
      setSpending(updated);setFilledKeys(newFilled);setTimeout(()=>setFilledKeys([]),1500);
      setScanning(false);setModal(null);setTimeout(()=>setPreviewUrl(null),1500);
      showToast(`✓ Auto-filled ${newFilled.length} categories!`,"success");
    }catch{setScanning(false);setModal(null);setPreviewUrl(null);showToast("⚠ Couldn't read data.","error");}
  }

  async function genAI(){
    setAiLoading(true);setAi("");
    const top=[...CATS].sort((a,b)=>weights[b.key]-weights[a.key]).slice(0,3).map(c=>`${c.label} (${weights[c.key].toFixed(1)}% spend, ${adjustedCpi[c.key].toFixed(1)}% inflation)`).join(", ");
    try{
      const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:`Personal finance analyst India. Personal inflation: ${personalRate.toFixed(2)}%, National: ${adjustedCpi.headline.toFixed(2)}%, State: ${state}, Sector: ${sector}, Month: ${cpiData.month}, Top spend: ${top}, Monthly: ₹${total.toLocaleString("en-IN")}, Annual loss: ₹${fmt(annualLoss)}. Write 3 short paragraphs: 1) Rate vs national 2) Categories hurting most 3) Two India-specific tips. Under 200 words.`}]})});
      const d=await r.json();
      setAi(d?.content?.[0]?.text||"Unable to generate.");
    }catch{setAi("Could not generate analysis.");}
    setAiLoading(false);
  }

  return(
    <>
      <style>{S}</style>
      {toast&&<div className="toast" style={{background:TOAST_COLORS[toastType]}}>{toast}</div>}

      {modal==="picker"&&(
        <div className="overlay" onClick={()=>setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:44,marginBottom:10}}>📷</div>
            <div style={{fontSize:17,fontWeight:800,color:"#333",marginBottom:5}}>Add Spending Sheet</div>
            <div style={{fontSize:12,color:"#AAA",marginBottom:"1.4rem",lineHeight:1.5,fontWeight:500}}>Snap or upload your budget — Claude reads and fills the form.</div>
            {isMobile&&<button className="mbtn primary" onClick={openCamera}>📸 Take Photo Now</button>}
            <button className="mbtn secondary" onClick={()=>fileRef.current?.click()}>🗂️ Upload from Files</button>
            <button className="mbtn-cancel" onClick={()=>setModal(null)}>Cancel</button>
          </div>
        </div>
      )}
      {modal==="camera"&&(
        <div className="overlay">
          <div className="cam-modal">
            <div className="cam-header">
              <div style={{fontSize:13,fontWeight:800,color:"#333"}}>📸 Point at your spending sheet</div>
              <button className="cam-close" onClick={()=>setModal(null)}>✕</button>
            </div>
            <div style={{background:"#FFFBF0",borderBottom:"2px solid #FFE082",padding:"8px 14px",fontSize:11,color:"#F7B731",fontWeight:700}}>
              💡 For on-screen text (Notepad, apps), use <strong>Upload from Files</strong> — screenshot &amp; upload for better accuracy.
            </div>
            <video ref={videoRef} autoPlay playsInline muted style={{width:"100%",maxHeight:300,objectFit:"cover",display:"block",background:"#000"}}/>
            <canvas ref={canvasRef} style={{display:"none"}}/>
            <div style={{padding:"18px",display:"flex",justifyContent:"center"}}>
              <button className="snap-btn" onClick={snapPhoto}/>
            </div>
          </div>
        </div>
      )}
      {modal==="scanning"&&previewUrl&&(
        <div className="overlay">
          <div className="preview-modal">
            <img src={previewUrl} alt="Spending sheet"/>
            <div style={{fontSize:13,fontWeight:800,color:"#764ba2",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              {scanning?<><div className="scan-ring" style={{borderTopColor:"#764ba2",borderColor:"#DDD5F5"}}/>Scanning with AI…</>:"✓ Filling categories…"}
            </div>
          </div>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFileUpload}/>

      <div className="wrap">
        <div className="hero">
          <div className="pill">✦ India CPI Tool · {cpiData.month}</div>
          <h1>Your <span>Personal</span> Inflation Rate</h1>
          <p>The national average hides your reality. Calculate what inflation actually costs you.</p>
        </div>

        <div className="tabs">
          {TABS.map((t,i)=>(
            <button key={t} className={`tab${tab===i?" active":""}`} onClick={()=>setTab(i)}>{t}</button>
          ))}
        </div>

        <div className="main">

          {/* ── CALCULATOR ── */}
          {tab===0&&(<>
            {/* Settings */}
            <div className="card">
              <div className="card-title" style={{color:"#764ba2"}}>⚙️ Settings</div>
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",background:"linear-gradient(135deg,#F8F4FF,#EDF4FF)",borderRadius:14,marginBottom:16,border:"2px solid #DDD5F5"}}>
                {liveStatus==="checking"&&<><div className="scan-ring" style={{borderTopColor:"#764ba2",borderColor:"#DDD5F5"}}/><span style={{fontSize:12,color:"#764ba2",fontWeight:700}}>Fetching latest MoSPI data…</span></>}
                {liveStatus==="live"&&<><div style={{width:9,height:9,borderRadius:"50%",background:"#20BF6B",animation:"blink 2s infinite",flexShrink:0,boxShadow:"0 0 6px #20BF6B"}}/><span style={{fontSize:12,color:"#20BF6B",fontWeight:800}}>Live · {cpiData.month} · Base {cpiData.base}</span>{cpiData.est&&<span style={{fontSize:10,color:"#CCC",marginLeft:4}}>* some categories estimated</span>}</>}
                {liveStatus==="failed"&&<><div style={{width:9,height:9,borderRadius:"50%",background:"#F7B731",flexShrink:0}}/><span style={{fontSize:12,color:"#F7B731",fontWeight:800}}>Using saved data · {cpiData.month}</span></>}
                <span style={{marginLeft:"auto",fontSize:10,color:"#CCC",fontWeight:600}}>Updates 12th monthly</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
                <div>
                  <div style={{fontSize:11,color:"#764ba2",fontWeight:800,marginBottom:7,letterSpacing:1}}>SECTOR</div>
                  <div className="seg">
                    {["combined","rural","urban"].map(s=>(
                      <button key={s} className={`seg-btn${sector===s?" active":""}`} onClick={()=>setSector(s)}>{s.charAt(0).toUpperCase()+s.slice(1)}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{fontSize:11,color:"#764ba2",fontWeight:800,marginBottom:7,letterSpacing:1}}>STATE</div>
                  <select className="select" value={state} onChange={e=>setState(e.target.value)}>
                    {Object.keys(STATE_OFFSETS).sort().map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div style={{fontSize:12,color:"#888",fontWeight:600}}>State offset: <strong style={{color:stateOffset>0?"#FC5C65":stateOffset<0?"#20BF6B":"#AAA"}}>{stateOffset>0?"+":""}{stateOffset.toFixed(1)}% vs national avg</strong> · {sector}</div>
            </div>

            {/* Presets */}
            <div className="card">
              <div className="card-title" style={{color:"#F7B731"}}>🎯 Quick Profiles</div>
              <div className="preset-grid">
                {PRESETS.map(p=>(
                  <button key={p.label} className="preset-btn" onClick={()=>applyPreset(p)} style={{background:p.grad}}>
                    <span className="preset-icon">{p.icon}</span>
                    <div className="preset-label">{p.label}</div>
                    <div className="preset-desc">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Spending */}
            <div className="card">
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1rem",flexWrap:"wrap",gap:8}}>
                <div className="card-title" style={{margin:0,color:"#20BF6B"}}>💰 Monthly Spending</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <button className="btn-primary" onClick={()=>setModal("picker")} disabled={scanning}>
                    {scanning?<><div className="scan-ring"/><span>Scanning…</span></>:<>📷 Scan Sheet</>}
                  </button>
                  <button className="btn-ghost" onClick={()=>{setSpending(DEFAULT);setFilledKeys([]);showToast("↺ Reset","info");}}>↺ Reset</button>
                </div>
              </div>
              <div className="grid2">
                {CATS.map(c=>{
                  const w=weights[c.key]||0;
                  const isFilled=filledKeys.includes(c.key);
                  return(
                    <div className={`cat${isFilled?" filled":""}`} key={c.key}
                      style={{background:isFilled?c.bg:`${c.bg}CC`,border:`2.5px solid ${isFilled?c.color:w>20?c.color+"88":"transparent"}`,boxShadow:isFilled?`0 4px 16px ${c.color}33`:"none"}}>
                      <span className="cat-icon">{c.icon}</span>
                      <div className="cat-name">{c.label}</div>
                      <div className="cat-pct" style={{color:c.color,background:`${c.color}18`,border:`1.5px solid ${c.border}`}}>{w.toFixed(1)}%</div>
                      <div className="inp-row" style={{marginTop:6}}>
                        <div className="inp-wrap" style={{borderColor:w>15?`${c.color}66`:"rgba(255,255,255,.9)"}}>
                          <span style={{color:c.color}}>₹</span>
                          <input type="number" min="0" value={spending[c.key]} onChange={e=>setSpending(s=>({...s,[c.key]:e.target.value}))}/>
                        </div>
                        <div className="stepper">
                          <button className="step-btn" style={{borderColor:`${c.color}44`,color:c.color}} onClick={()=>setSpending(s=>({...s,[c.key]:Math.max(0,Number(s[c.key])+500)}))}>▲</button>
                          <button className="step-btn" style={{borderColor:`${c.color}44`,color:c.color}} onClick={()=>setSpending(s=>({...s,[c.key]:Math.max(0,Number(s[c.key])-500)}))}>▼</button>
                        </div>
                      </div>
                      <div className="track" style={{background:`${c.color}22`}}><div className="fill" style={{width:`${Math.min(w*2.5,100)}%`,background:c.color}}/></div>
                    </div>
                  );
                })}
              </div>
              <div style={{fontSize:13,color:"#888",fontWeight:600}}>Total monthly: <strong style={{color:"#333",fontWeight:800}}>₹{total.toLocaleString("en-IN")}</strong></div>
            </div>

            {/* Donut Chart */}
            <div className="card">
              <div className="card-title" style={{color:"#8854D0"}}>🍩 Spending Breakdown</div>
              <DonutChart weights={weights} cats={CATS} total={total}/>
              <div style={{marginTop:14,display:"flex",gap:8,flexWrap:"wrap"}}>
                {[...CATS].sort((a,b)=>((adjustedCpi[b.key]||0)*(weights[b.key]||0)/100)-((adjustedCpi[a.key]||0)*(weights[a.key]||0)/100)).slice(0,3).map(c=>(
                  <div key={c.key} style={{flex:1,minWidth:90,background:c.bg,border:`2px solid ${c.border}`,borderRadius:12,padding:"8px 10px",textAlign:"center"}}>
                    <div style={{fontSize:18,marginBottom:2}}>{c.icon}</div>
                    <div style={{fontSize:11,fontWeight:800,color:c.color}}>{((adjustedCpi[c.key]||0)*(weights[c.key]||0)/100).toFixed(2)}%</div>
                    <div style={{fontSize:9,color:"#AAA",fontWeight:600,marginTop:1}}>impact on rate</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Results */}
            <div className="results">
              <div style={{display:"flex",alignItems:"flex-end",gap:16,flexWrap:"wrap",marginBottom:"1.5rem"}}>
                <div className={`rate-num${rateBumped?" bumped":""}`} style={{color:rateColor,textShadow:`0 0 30px ${rateColor}44`}}>{personalRate.toFixed(2)}%</div>
                <div>
                  <div className="rate-lbl">Your personal inflation · {state} · {cpiData.month}</div>
                  <div className="delta-badge" style={{background:diff>0?"#FFF0F1":"#F0FFF7",color:diff>0?"#FC5C65":"#20BF6B",border:`2px solid ${diff>0?"#FFBCC0":"#A8EEC8"}`}}>
                    {diff>0?"▲":"▼"} {Math.abs(diff).toFixed(2)}% vs state average
                  </div>
                </div>
              </div>
              <div className="cmp">
                {[
                  {val:personalRate.toFixed(2)+"%",lbl:"Your Rate",c:rateColor,bg:`${rateColor}18`,border:`${rateColor}44`},
                  {val:adjustedCpi.headline.toFixed(2)+"%",lbl:state+" CPI",c:"#2D98DA",bg:"#EDF4FF",border:"#A8D4F5"},
                  {val:forecastRate.toFixed(2)+"%",lbl:"6-Mo Forecast",c:"#20BF6B",bg:"#F0FFF7",border:"#A8EEC8"},
                ].map(b=>(
                  <div key={b.lbl} className="cmp-box" style={{background:b.bg,border:`2.5px solid ${b.border}`,boxShadow:`0 4px 16px ${b.c}22`}}>
                    <div className="cmp-num" style={{color:b.c}}>{b.val}</div>
                    <div className="cmp-lbl" style={{color:b.c}}>{b.lbl}</div>
                  </div>
                ))}
              </div>
              <div style={{fontSize:11,fontWeight:800,letterSpacing:"2px",textTransform:"uppercase",color:"#AAA",marginBottom:12}}>Category Breakdown</div>
              {CATS.map(c=>(
                <div className="bar-row" key={c.key}>
                  <div className="bar-lbl"><span style={{fontSize:15}}>{c.icon}</span>{c.label}</div>
                  <div className="bar-track"><div className="bar-fill" style={{width:`${Math.min(((adjustedCpi[c.key]||0)/maxR)*100,100)}%`,background:c.grad}}/></div>
                  <div className="bar-val" style={{color:c.color}}>{(adjustedCpi[c.key]||0).toFixed(1)}%</div>
                </div>
              ))}
              <div className="bar-row" style={{marginTop:8,paddingTop:10,borderTop:"2px dashed #EEE"}}>
                <div className="bar-lbl" style={{color:"#2D98DA",fontWeight:800}}>🇮🇳 {state} CPI</div>
                <div className="bar-track"><div className="bar-fill" style={{width:`${Math.min((adjustedCpi.headline/maxR)*100,100)}%`,background:"linear-gradient(135deg,#2D98DA,#45AAF2)"}}/></div>
                <div className="bar-val" style={{color:"#2D98DA",fontWeight:800}}>{adjustedCpi.headline.toFixed(1)}%</div>
              </div>
            </div>

            <div style={{display:"flex",gap:10,marginBottom:"1.2rem",flexWrap:"wrap"}}>
              <button className="cta" style={{flex:1}} onClick={genAI} disabled={aiLoading||total===0}>
                {aiLoading?"Generating…":"✦ Generate AI Analysis"}
              </button>
              <button className="save-btn" onClick={saveToTracker}>📌 Save to Tracker</button>
            </div>

            {(aiLoading||ai)&&(
              <div className="ai-box">
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                  <div style={{background:"linear-gradient(135deg,#764ba2,#5B2D8E)",color:"#fff",fontSize:10,fontWeight:800,letterSpacing:1.5,textTransform:"uppercase",padding:"6px 14px",borderRadius:100,boxShadow:"0 4px 12px rgba(91,45,142,.35)"}}>✦ AI Analysis</div>
                  <div style={{fontSize:11,color:"#CCC",fontWeight:600}}>Claude · {state} · {sector} · {cpiData.month}</div>
                </div>
                <div className="ai-txt">
                  {aiLoading?<div style={{display:"flex",alignItems:"center",gap:10,color:"#BBB"}}><Dots/><span style={{fontWeight:600}}>Analysing your profile…</span></div>
                   :ai.split("\n\n").map((p,i)=><p key={i} dangerouslySetInnerHTML={{__html:p.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>")}}/>)}
                </div>
              </div>
            )}
          </>)}

          {/* ── TRACKER ── */}
          {tab===1&&(<>
            <div className="card">
              <div className="card-title" style={{color:"#2D98DA"}}>📈 Monthly Inflation Tracker</div>
              {tracker.length===0?(
                <div style={{textAlign:"center",padding:"2.5rem",color:"#BBB"}}>
                  <div style={{fontSize:44,marginBottom:12}}>📌</div>
                  <div style={{fontSize:14,fontWeight:800,color:"#AAA"}}>No data yet</div>
                  <div style={{fontSize:12,color:"#CCC",marginTop:5,fontWeight:500}}>Go to Calculator → hit "Save to Tracker" each month.</div>
                </div>
              ):(<>
                {tracker.map((e,i)=>{
                  const maxT=Math.max(...tracker.map(x=>x.rate))*1.1;
                  const c=e.rate>4.5?"#FC5C65":e.rate>3.5?"#F7B731":"#20BF6B";
                  const bg=e.rate>4.5?"linear-gradient(135deg,#FFF0F1,#FFE8EA)":e.rate>3.5?"linear-gradient(135deg,#FFFBF0,#FFF3D0)":"linear-gradient(135deg,#F0FFF7,#E0FFF0)";
                  return(
                    <div className="tracker-entry" key={i} style={{background:bg,border:`2px solid ${c}33`}}>
                      <div className="tracker-month">{e.label}</div>
                      <div className="tracker-bar"><div className="tracker-fill" style={{width:`${(e.rate/maxT)*100}%`,background:`linear-gradient(135deg,${c},${c}CC)`}}/></div>
                      <div style={{fontSize:16,fontWeight:800,color:c,width:46,textAlign:"right"}}>{e.rate}%</div>
                      <div style={{fontSize:10,color:"#CCC",width:60,textAlign:"right",fontWeight:600}}>{e.state}</div>
                    </div>
                  );
                })}
                <button className="btn-ghost" style={{marginTop:10}} onClick={async()=>{setTracker([]);try{await window.storage.delete("tracker_data");}catch{}showToast("↺ Tracker cleared","info");}}>Clear history</button>
              </>)}
            </div>

            <div className="card">
              <div className="card-title" style={{color:"#A55EEA"}}>📔 Inflation Diary</div>
              <div style={{fontSize:12,color:"#888",marginBottom:12,fontWeight:500}}>Note what drove your inflation this month — rent hike, school fees, fuel prices, etc.</div>
              <textarea value={diaryNote} onChange={e=>setDiaryNote(e.target.value)}
                placeholder={`What changed this month? e.g. "Landlord raised rent by ₹2,000."`}
                style={{width:"100%",background:"#F8F4FF",border:"2.5px solid #E0D4F0",borderRadius:14,padding:"12px 14px",fontSize:13,color:"#333",fontFamily:"'DM Sans',sans-serif",resize:"vertical",minHeight:80,outline:"none",lineHeight:1.6,transition:"all .2s",fontWeight:500}}
                onFocus={e=>{e.target.style.borderColor="#764ba2";e.target.style.boxShadow="0 0 0 3px rgba(118,75,162,.12)";}}
                onBlur={e=>{e.target.style.borderColor="#E0D4F0";e.target.style.boxShadow="none";}}
              />
              <button className="save-btn" style={{marginTop:10}} onClick={saveDiaryEntry}>💾 Save Entry · {cpiData.month} · {personalRate.toFixed(2)}%</button>
              {diary.length>0&&(
                <div style={{marginTop:16}}>
                  <div style={{fontSize:11,color:"#AAA",fontWeight:800,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>Past Entries</div>
                  {diary.map((e,i)=>(
                    <div className="diary-entry" key={i}>
                      <div className="diary-header">
                        <div className="diary-month">{e.label}</div>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <div style={{fontSize:15,fontWeight:800,color:e.rate>4?"#FC5C65":e.rate>3?"#F7B731":"#20BF6B"}}>{e.rate}%</div>
                          <button className="diary-del" onClick={()=>deleteDiaryEntry(i)}>✕</button>
                        </div>
                      </div>
                      <div className="diary-note">{e.note}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-title" style={{color:"#2D98DA"}}>🔮 6-Month Inflation Forecast</div>
              <div style={{fontSize:12,color:"#888",marginBottom:12,fontWeight:500}}>Based on RBI projections and MoSPI trend data.</div>
              {CATS.map(c=>(
                <div className="forecast-row" key={c.key}>
                  <div className="forecast-lbl"><span style={{fontSize:14}}>{c.icon}</span>{c.label}</div>
                  <div className="forecast-now">{adjustedCpi[c.key].toFixed(1)}%</div>
                  <div className="forecast-arrow">→</div>
                  <div className="forecast-next" style={{color:forecastCpi[c.key]>adjustedCpi[c.key]?"#FC5C65":"#20BF6B"}}>{forecastCpi[c.key].toFixed(1)}%</div>
                </div>
              ))}
              <div style={{marginTop:14,padding:"14px 16px",background:"linear-gradient(135deg,#F8F4FF,#EDF4FF)",borderRadius:14,fontSize:13,border:"2px solid #DDD5F5"}}>
                <span style={{color:"#888",fontWeight:500}}>Projected rate in 6 months: </span>
                <strong style={{color:forecastRate>personalRate?"#FC5C65":"#20BF6B"}}>{forecastRate.toFixed(2)}%</strong>
                <span style={{color:"#888",fontWeight:500}}> ({forecastRate>personalRate?"▲":"▼"} {Math.abs(forecastRate-personalRate).toFixed(2)}% from today)</span>
              </div>
            </div>
          </>)}

          {/* ── INSIGHTS ── */}
          {tab===2&&(<>
            <div className="card">
              <div className="card-title" style={{color:"#FC5C65"}}>💸 Annual Purchasing Power Loss</div>
              <div className="metric-grid">
                <div className="metric" style={{background:"linear-gradient(135deg,#FFF0F1,#FFE8EA)",boxShadow:"0 4px 16px rgba(252,92,101,.15)"}}><div className="metric-val" style={{color:"#FC5C65"}}>₹{fmt(annualLoss)}</div><div className="metric-lbl" style={{color:"#FC5C65"}}>Lost per year to inflation</div></div>
                <div className="metric" style={{background:"linear-gradient(135deg,#FFFBF0,#FFF3D0)",boxShadow:"0 4px 16px rgba(247,183,49,.15)"}}><div className="metric-val" style={{color:"#F7B731"}}>₹{fmt(annualLoss/12)}</div><div className="metric-lbl" style={{color:"#F7B731"}}>Lost per month</div></div>
                <div className="metric" style={{background:"linear-gradient(135deg,#EDF4FF,#D4EAFF)",boxShadow:"0 4px 16px rgba(45,152,218,.15)"}}><div className="metric-val" style={{color:"#2D98DA"}}>{(100-personalRate).toFixed(1)}%</div><div className="metric-lbl" style={{color:"#2D98DA"}}>of ₹100 retained next year</div></div>
                <div className="metric" style={{background:"linear-gradient(135deg,#F0FFF7,#D4F5E5)",boxShadow:"0 4px 16px rgba(32,191,107,.15)"}}><div className="metric-val" style={{color:"#20BF6B"}}>{(personalRate+1.5).toFixed(1)}%+</div><div className="metric-lbl" style={{color:"#20BF6B"}}>FD rate to beat inflation</div></div>
              </div>
            </div>

            <div className="card">
              <div className="card-title" style={{color:"#A55EEA"}}>💡 Smart Substitution Suggestions</div>
              <div style={{fontSize:12,color:"#888",marginBottom:14,fontWeight:500}}>Targeted tips for your top 3 highest-inflation categories.</div>
              {[...CATS].sort((a,b)=>((adjustedCpi[b.key]||0)*weights[b.key]/100)-((adjustedCpi[a.key]||0)*weights[a.key]/100)).slice(0,3).map(c=>(
                <div className="sub-card" key={c.key} style={{background:c.bg,boxShadow:`0 4px 16px ${c.color}22`}}>
                  <div className="sub-cat">
                    <span style={{fontSize:28,filter:`drop-shadow(0 2px 4px ${c.color}44)`}}>{c.icon}</span>
                    <span style={{fontSize:13,fontWeight:800,color:c.color}}>{c.label}</span>
                    <span style={{fontSize:11,color:"#fff",fontWeight:800,marginLeft:"auto",background:c.grad,padding:"3px 10px",borderRadius:100,boxShadow:`0 2px 8px ${c.color}44`}}>{(adjustedCpi[c.key]||0).toFixed(1)}% inflation</span>
                  </div>
                  {(SUBSTITUTIONS[c.key]||[]).slice(0,3).map((tip,i)=>(
                    <div className="sub-tip" key={i}>💰 {tip}</div>
                  ))}
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-title" style={{color:"#20BF6B"}}>👥 Peer Benchmarking</div>
              <div style={{fontSize:12,color:"#888",marginBottom:6,fontWeight:500}}>How your inflation compares to other users in {state}.</div>
              <div className="bench-bar"><div className="bench-fill" style={{width:"100%"}}/><div className="bench-marker" style={{left:`${markerLeft}%`}}/></div>
              <div className="bench-labels"><span>Low</span><span>P25: {PEER_BENCHMARK.p25}%</span><span>Avg: {PEER_BENCHMARK.p50}%</span><span>P75: {PEER_BENCHMARK.p75}%</span><span>High</span></div>
              <div style={{marginTop:14,padding:"14px 16px",background:percentile>75?"linear-gradient(135deg,#FFF0F1,#FFE8EA)":percentile>50?"linear-gradient(135deg,#FFFBF0,#FFF3D0)":"linear-gradient(135deg,#F0FFF7,#D4F5E5)",borderRadius:14,fontSize:13,border:`2px solid ${percentile>75?"#FFBCC0":percentile>50?"#FFE082":"#A8EEC8"}`,fontWeight:500}}>
                Your rate of <strong style={{color:rateColor}}>{personalRate.toFixed(2)}%</strong> is higher than <strong>{percentile}%</strong> of users in your area.
                {percentile>75?" You're in the high-inflation group — review your top spending categories.":percentile>50?" You're slightly above average — small adjustments could help.":" Great — you're managing inflation well!"}
              </div>
            </div>

            <div className="card">
              <div className="card-title" style={{color:"#F7B731"}}>💼 Salary Inflation Check</div>
              <div style={{fontSize:12,color:"#888",marginBottom:14,fontWeight:500}}>Did your last raise actually beat your personal inflation?</div>
              <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                <div style={{fontSize:13,color:"#666",fontWeight:600}}>My last salary hike was</div>
                <input className="sal-inp" type="number" min="0" max="100" step="0.1" placeholder="e.g. 8" value={salary} onChange={e=>setSalary(e.target.value)}/>
                <div style={{fontSize:13,color:"#666",fontWeight:600}}>%</div>
              </div>
              {salaryNum>0&&(
                <div>
                  <div className="verdict" style={{background:salaryOk?"linear-gradient(135deg,#F0FFF7,#D4F5E5)":"linear-gradient(135deg,#FFF0F1,#FFE8EA)",color:salaryOk?"#20BF6B":"#FC5C65",border:`2px solid ${salaryOk?"#A8EEC8":"#FFBCC0"}`}}>
                    {salaryOk?"✓ Your raise beat inflation":"✗ Your raise didn't beat inflation"}
                  </div>
                  <div style={{fontSize:12,color:"#888",marginTop:10,lineHeight:1.7,fontWeight:500}}>
                    Salary hike: <strong style={{color:"#333"}}>{salaryNum}%</strong> · Personal inflation: <strong style={{color:rateColor}}>{personalRate.toFixed(2)}%</strong> · Real raise: <strong style={{color:salaryOk?"#20BF6B":"#FC5C65"}}>{realRaise>0?"+":""}{realRaise.toFixed(2)}%</strong>
                    <br/>{salaryOk?`You're ${realRaise.toFixed(2)}% ahead in real terms.`:`You effectively took a ${Math.abs(realRaise).toFixed(2)}% pay cut in real terms.`}
                  </div>
                </div>
              )}
            </div>
          </>)}

          {/* ── TOOLS ── */}
          {tab===3&&(<>
            <div className="card">
              <div className="seg" style={{marginBottom:18}}>
                {[["goal","🎯 Goal Planner"],["emi","🏠 EMI Check"],["sip","📈 Investment Check"]].map(([k,l])=>(
                  <button key={k} className={`seg-btn${activeTool===k?" active":""}`} onClick={()=>setActiveTool(k)}>{l}</button>
                ))}
              </div>

              {activeTool==="goal"&&(<>
                <div className="card-title" style={{color:"#764ba2"}}>🎯 Inflation-Adjusted Goal Planner</div>
                <div style={{fontSize:12,color:"#888",marginBottom:18,fontWeight:500}}>How much do you actually need to save, accounting for your personal inflation?</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
                  <div><div style={{fontSize:11,color:"#764ba2",fontWeight:800,marginBottom:7,letterSpacing:1}}>TARGET TODAY (₹)</div><input className="num-inp" type="number" placeholder="e.g. 5000000" value={goalAmount} onChange={e=>setGoalAmount(e.target.value)}/></div>
                  <div><div style={{fontSize:11,color:"#764ba2",fontWeight:800,marginBottom:7,letterSpacing:1}}>YEARS TO GOAL</div><input className="num-inp" type="number" placeholder="e.g. 10" value={goalYears} onChange={e=>setGoalYears(e.target.value)}/></div>
                </div>
                {goalAmt>0&&goalYr>0&&(
                  <div className="tool-result" style={{background:"linear-gradient(135deg,#F8F4FF,#EDF4FF)",boxShadow:"0 4px 20px rgba(118,75,162,.15)"}}>
                    <div style={{fontSize:13,fontWeight:800,color:"#764ba2",marginBottom:12}}>Your Inflation-Adjusted Plan</div>
                    <div className="tool-row"><span className="tool-key">Goal in today's ₹</span><span className="tool-val">₹{fmt(goalAmt)}</span></div>
                    <div className="tool-row"><span className="tool-key">Inflation-adjusted goal in {goalYr}yr</span><span className="tool-val" style={{color:"#FC5C65"}}>₹{fmt(inflationAdjustedGoal)}</span></div>
                    <div className="tool-row"><span className="tool-key">Extra needed due to inflation</span><span className="tool-val" style={{color:"#F7B731"}}>₹{fmt(inflationAdjustedGoal-goalAmt)}</span></div>
                    <div className="tool-row"><span className="tool-key">Monthly savings needed</span><span className="tool-val" style={{color:"#764ba2"}}>₹{fmt(monthlySavingsNeeded)}</span></div>
                    <div className="tool-row"><span className="tool-key">Your personal inflation rate</span><span className="tool-val">{personalRate.toFixed(2)}%</span></div>
                  </div>
                )}
              </>)}

              {activeTool==="emi"&&(<>
                <div className="card-title" style={{color:"#20BF6B"}}>🏠 EMI Reality Check</div>
                <div style={{fontSize:12,color:"#888",marginBottom:18,fontWeight:500}}>Inflation makes fixed EMIs cheaper over time in real terms. See by how much.</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
                  <div><div style={{fontSize:11,color:"#20BF6B",fontWeight:800,marginBottom:7,letterSpacing:1}}>MONTHLY EMI (₹)</div><input className="num-inp" type="number" placeholder="e.g. 25000" value={emiAmount} onChange={e=>setEmiAmount(e.target.value)}/></div>
                  <div><div style={{fontSize:11,color:"#20BF6B",fontWeight:800,marginBottom:7,letterSpacing:1}}>LOAN TENURE (YEARS)</div><input className="num-inp" type="number" placeholder="e.g. 20" value={emiYears} onChange={e=>setEmiYears(e.target.value)}/></div>
                </div>
                {emiAmt>0&&emiYr>0&&(
                  <div className="tool-result" style={{background:"linear-gradient(135deg,#F0FFF7,#D4F5E5)",boxShadow:"0 4px 20px rgba(32,191,107,.15)"}}>
                    <div style={{fontSize:13,fontWeight:800,color:"#20BF6B",marginBottom:12}}>EMI Inflation Analysis</div>
                    <div className="tool-row"><span className="tool-key">Total EMI paid (nominal)</span><span className="tool-val">₹{fmt(totalEmiPaid)}</span></div>
                    <div className="tool-row"><span className="tool-key">Inflation benefit over tenure</span><span className="tool-val" style={{color:"#20BF6B"}}>₹{fmt(Math.abs(emiInflationBenefit))}</span></div>
                    <div className="tool-row"><span className="tool-key">EMI in real terms by year {Math.round(emiYr)}</span><span className="tool-val" style={{color:"#2D98DA"}}>₹{fmt(emiAmt/Math.pow(1+personalRate/100,emiYr))}</span></div>
                    <div style={{fontSize:11,color:"#20BF6B",marginTop:10,lineHeight:1.6,padding:"8px 0",fontWeight:600}}>
                      💡 Your ₹{fmt(emiAmt)} EMI today will feel like only ₹{fmt(emiAmt/Math.pow(1+personalRate/100,emiYr))} in {Math.round(emiYr)} years.
                    </div>
                  </div>
                )}
              </>)}

              {activeTool==="sip"&&(<>
                <div className="card-title" style={{color:"#2D98DA"}}>📈 Investment Sufficiency Checker</div>
                <div style={{fontSize:12,color:"#888",marginBottom:18,fontWeight:500}}>Is your SIP actually beating your personal inflation in real terms?</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:14}}>
                  <div><div style={{fontSize:11,color:"#2D98DA",fontWeight:800,marginBottom:7,letterSpacing:1}}>MONTHLY SIP (₹)</div><input className="num-inp" type="number" placeholder="e.g. 10000" value={sipAmount} onChange={e=>setSipAmount(e.target.value)}/></div>
                  <div><div style={{fontSize:11,color:"#2D98DA",fontWeight:800,marginBottom:7,letterSpacing:1}}>RETURN (%)</div><input className="num-inp" type="number" placeholder="e.g. 12" value={sipReturn} onChange={e=>setSipReturn(e.target.value)}/></div>
                  <div><div style={{fontSize:11,color:"#2D98DA",fontWeight:800,marginBottom:7,letterSpacing:1}}>YEARS</div><input className="num-inp" type="number" placeholder="e.g. 15" value={sipYears} onChange={e=>setSipYears(e.target.value)}/></div>
                </div>
                {sipAmt>0&&sipRet>0&&sipYr>0&&(
                  <div className="tool-result" style={{background:sipBeatsInflation?"linear-gradient(135deg,#F0FFF7,#D4F5E5)":"linear-gradient(135deg,#FFF0F1,#FFE8EA)",boxShadow:`0 4px 20px ${sipBeatsInflation?"rgba(32,191,107,.15)":"rgba(252,92,101,.15)"}`}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                      <div style={{fontSize:13,fontWeight:800,color:sipBeatsInflation?"#20BF6B":"#FC5C65"}}>Investment Analysis</div>
                      <div style={{fontSize:11,fontWeight:800,padding:"5px 14px",borderRadius:100,background:sipBeatsInflation?"linear-gradient(135deg,#20BF6B,#26de81)":"linear-gradient(135deg,#FC5C65,#FF4757)",color:"#fff",boxShadow:`0 3px 10px ${sipBeatsInflation?"rgba(32,191,107,.35)":"rgba(252,92,101,.35)"}`}}>
                        {sipBeatsInflation?"✓ Beats inflation":"✗ Doesn't beat inflation"}
                      </div>
                    </div>
                    <div className="tool-row"><span className="tool-key">Total invested</span><span className="tool-val">₹{fmt(sipAmt*sipYr*12)}</span></div>
                    <div className="tool-row"><span className="tool-key">Nominal future value</span><span className="tool-val">₹{fmt(sipFV)}</span></div>
                    <div className="tool-row"><span className="tool-key">Real future value (inflation-adjusted)</span><span className="tool-val" style={{color:sipBeatsInflation?"#20BF6B":"#FC5C65"}}>₹{fmt(sipRealFV)}</span></div>
                    <div className="tool-row"><span className="tool-key">Real return after inflation</span><span className="tool-val" style={{color:sipBeatsInflation?"#20BF6B":"#FC5C65"}}>{(sipRet-personalRate).toFixed(2)}%</span></div>
                    <div className="tool-row"><span className="tool-key">Min return needed to beat inflation</span><span className="tool-val">{(personalRate+0.5).toFixed(2)}%</span></div>
                  </div>
                )}
              </>)}
            </div>
          </>)}

        </div>
        <div className="footer">Data: World Bank / MoSPI · {cpiData.month} · Base: {cpiData.base} · Auto-updates on the 12th of each month</div>
      </div>
    </>
  );
}
