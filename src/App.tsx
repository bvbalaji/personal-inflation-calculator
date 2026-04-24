import { useState, useRef, useEffect } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

type CatKey = "food"|"housing"|"fuel"|"clothing"|"transport"|"healthcare"|"education"|"misc";

interface Cat {
  key: CatKey;
  label: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
  grad: string;
}

type Spending = Record<CatKey, number>;
type Weights  = Record<CatKey, number>;
type CpiMap   = Record<CatKey, number>;

interface CpiData {
  month: string;
  headline: number;
  base: string;
  est: boolean;
  food: number;
  housing: number;
  fuel: number;
  clothing: number;
  transport: number;
  healthcare: number;
  education: number;
  misc: number;
}

interface Preset {
  label: string;
  icon: string;
  desc: string;
  color: string;
  grad: string;
  spending: Spending;
}

interface TrackerEntry {
  label: string;
  rate: number;
  state: string;
  sector: string;
  date: number;
}

interface DiaryEntry {
  label: string;
  rate: number;
  note: string;
  date: number;
}

type ToastType = "info"|"success"|"error";
type LiveStatus = "checking"|"live"|"failed";
type ToolKey = "goal"|"emi"|"sip"|"timemachine";

// ── Constants ────────────────────────────────────────────────────────────────

const CATS: Cat[] = [
  { key:"food",       label:"Food & Beverages",         icon:"🍛", color:"#FF4757", bg:"#FFF0F1", border:"#FFBCC0", grad:"linear-gradient(135deg,#FF4757,#FF6B81)" },
  { key:"housing",    label:"Housing & Rent",            icon:"🏠", color:"#00B4D8", bg:"#F0FBFF", border:"#90E0EF", grad:"linear-gradient(135deg,#00B4D8,#48CAE4)" },
  { key:"fuel",       label:"Utility Expenditures",      icon:"⚡", color:"#F7B731", bg:"#FFFBF0", border:"#FFE082", grad:"linear-gradient(135deg,#F7B731,#FFC93C)" },
  { key:"clothing",   label:"Clothing & Footwear",       icon:"👗", color:"#A55EEA", bg:"#F8F0FF", border:"#DDB8FF", grad:"linear-gradient(135deg,#A55EEA,#C77DFF)" },
  { key:"transport",  label:"Transport & Communication", icon:"🚌", color:"#20BF6B", bg:"#F0FFF7", border:"#A8EEC8", grad:"linear-gradient(135deg,#20BF6B,#26de81)" },
  { key:"healthcare", label:"Healthcare",                icon:"🏥", color:"#FC5C65", bg:"#FFF0F1", border:"#FFBCC0", grad:"linear-gradient(135deg,#FC5C65,#FF6B81)" },
  { key:"education",  label:"Education",                 icon:"📚", color:"#2D98DA", bg:"#F0F8FF", border:"#A8D4F5", grad:"linear-gradient(135deg,#2D98DA,#45AAF2)" },
  { key:"misc",       label:"Miscellaneous",             icon:"🛒", color:"#8854D0", bg:"#F5F0FF", border:"#C9ABFF", grad:"linear-gradient(135deg,#8854D0,#A55EEA)" },
];

const DEFAULT: Spending = { food:8000,housing:15000,fuel:3000,clothing:2000,transport:4000,healthcare:2000,education:3000,misc:5000 };

const STATE_OFFSETS: Record<string, number> = {
  "Andhra Pradesh":0.4,"Arunachal Pradesh":0.8,"Assam":0.6,"Bihar":0.9,
  "Chhattisgarh":0.3,"Goa":-0.3,"Gujarat":0.2,"Haryana":0.5,
  "Himachal Pradesh":-0.1,"Jharkhand":0.7,"Karnataka":0.1,"Kerala":-0.2,
  "Madhya Pradesh":0.6,"Maharashtra":0.0,"Manipur":1.2,"Meghalaya":0.9,
  "Mizoram":1.1,"Nagaland":1.0,"Odisha":0.5,"Punjab":0.3,
  "Rajasthan":0.4,"Sikkim":0.7,"Tamil Nadu":-0.1,"Telangana":0.3,
  "Tripura":0.8,"Uttar Pradesh":0.7,"Uttarakhand":0.2,"West Bengal":0.6,
  "Delhi":-0.4,"Chandigarh":-0.5,"Jammu & Kashmir":0.5,"Ladakh":1.3,
};

const PRESETS: Preset[] = [
  { label:"Student",     icon:"🎓", desc:"Urban student",      color:"#2D98DA", grad:"linear-gradient(135deg,#2D98DA,#45AAF2)", spending:{food:4000,housing:6000,fuel:800,clothing:1500,transport:2000,healthcare:500,education:8000,misc:2000} },
  { label:"Young Pro",   icon:"💼", desc:"Metro professional", color:"#20BF6B", grad:"linear-gradient(135deg,#20BF6B,#26de81)", spending:{food:7000,housing:20000,fuel:2000,clothing:3000,transport:5000,healthcare:1500,education:1000,misc:6000} },
  { label:"Family of 4", icon:"👨‍👩‍👧‍👦", desc:"Mid-size city",      color:"#FC5C65", grad:"linear-gradient(135deg,#FC5C65,#FF6B81)", spending:{food:12000,housing:15000,fuel:3500,clothing:3000,transport:5000,healthcare:3000,education:8000,misc:4000} },
  { label:"Senior",      icon:"🏡", desc:"Retired couple",     color:"#F7B731", grad:"linear-gradient(135deg,#F7B731,#FFC93C)", spending:{food:8000,housing:5000,fuel:2000,clothing:1000,transport:2000,healthcare:8000,education:0,misc:3000} },
  { label:"Rural",       icon:"🌾", desc:"Village household",  color:"#8854D0", grad:"linear-gradient(135deg,#8854D0,#A55EEA)", spending:{food:5000,housing:1500,fuel:1200,clothing:800,transport:1500,healthcare:1500,education:2000,misc:1500} },
];

const SUBSTITUTIONS: Record<CatKey, string[]> = {
  food:["Switch to local kirana over supermarkets (save 10-15%)","Buy seasonal vegetables — off-season items cost 2-3x more","Use ONDC apps (Magicpin, Ola Dash) for cheaper grocery delivery","Cook at home 5+ days a week — eating out inflates food spend by 40%"],
  housing:["Negotiate rent annually citing vacancy rates in your area","Consider co-living spaces if single — saves 30-40% on rent","Move slightly further from city centre — rent drops 20-25% per km","Check PM Awas Yojana eligibility for subsidised housing"],
  fuel:["Switch to LED bulbs and 5-star rated appliances","Use solar water heaters — saves 60-70% on water heating costs","Switch to PNG (piped natural gas) from LPG cylinders where available","Track peak-hour usage with a smart meter"],
  clothing:["Buy end-of-season sales (Jan & Jul) — discounts up to 70%","Explore Meesho and Myntra outlet for affordable branded clothing","Capsule wardrobe approach — fewer, better quality items","Swap or rent occasion wear instead of buying"],
  transport:["Switch to monthly metro/bus pass — saves 20-30% vs daily tickets","Carpool with colleagues — split fuel costs 4 ways","Consider CNG/electric vehicle for daily commute","Work from home 2-3 days a week to cut commute costs"],
  healthcare:["Get a family floater health insurance — cheaper than individual plans","Use Jan Aushadhi Kendras for generic medicines (50-90% cheaper)","Use telemedicine (Practo, 1mg) for consultations — saves OPD fees","Opt for preventive check-ups — cheaper than treatment"],
  education:["Use NPTEL, Swayam, and government e-learning portals (free)","Buy second-hand textbooks from seniors or OLX","Group tuitions are 40-50% cheaper than individual ones","Look for PM Scholarship schemes and state education grants"],
  misc:["Audit all subscriptions — cancel unused ones (avg Indian wastes ₹800/month)","Use UPI cashback offers and credit card reward points","Buy electronics during Big Billion Days / Great Indian Festival","Batch errands to reduce ad-hoc spending"],
};

const PEER_BENCHMARK = { p25:2.8, p50:3.4, p75:4.2, p90:5.1 };
const FORECAST_DELTA: Record<CatKey, number> = { food:-0.3,housing:0.1,fuel:0.2,clothing:0.0,transport:0.1,healthcare:0.1,education:0.0,misc:0.1 };
const TABS = ["Calculator","Tracker","Insights","Tools"];
const FALLBACK_CPI: CpiData = { month:"Mar 2026",headline:3.40,food:3.71,housing:2.11,fuel:1.97,clothing:3.50,transport:3.43,healthcare:3.43,education:3.32,misc:4.23,base:"2024=100",est:false };
const TOAST_COLORS: Record<ToastType, string> = { info:"linear-gradient(135deg,#5C6BC0,#3F51B5)",success:"linear-gradient(135deg,#20BF6B,#26de81)",error:"linear-gradient(135deg,#FC5C65,#FF4757)" };

// ── Storage shim type ────────────────────────────────────────────────────────

interface StorageResult { value: string; }
declare global {
  interface Window {
    storage: {
      get: (key: string) => Promise<StorageResult | null>;
      set: (key: string, value: string) => Promise<unknown>;
      delete: (key: string) => Promise<unknown>;
    };
  }
}

// ── Data fetching ────────────────────────────────────────────────────────────

async function fetchLatestCPI(): Promise<CpiData | null> {
  const now = new Date();
  const cacheKey = `cpi_${now.getFullYear()}_${now.getMonth()}_${now.getDate() >= 12 ? "new" : "old"}`;
  try {
    const [cd, ck] = await Promise.all([window.storage.get("cpi_live_json"), window.storage.get("cpi_cache_key")]);
    if (cd && ck && ck.value === cacheKey) return JSON.parse(cd.value) as CpiData;
  } catch {}
  try {
    const r = await fetch("https://api.worldbank.org/v2/country/IN/indicator/FP.CPI.TOTL.ZG?format=json&mrv=2&per_page=2");
    if (!r.ok) throw new Error();
    const json = await r.json();
    const latest = json?.[1]?.filter((e: { value: number | null }) => e.value !== null)?.[0];
    if (!latest?.value) throw new Error();
    const h = +latest.value.toFixed(2);
    const mults: Record<CatKey, number> = { food:1.09, housing:0.62, fuel:0.58, clothing:1.03, transport:1.01, healthcare:1.01, education:0.98, misc:1.24 };
    const parsed: CpiData = { month: latest.date, headline: h, base: "2024=100", est: true, food:0, housing:0, fuel:0, clothing:0, transport:0, healthcare:0, education:0, misc:0 };
    (Object.keys(mults) as CatKey[]).forEach(k => { parsed[k] = +(h * mults[k]).toFixed(2); });
    await window.storage.set("cpi_live_json", JSON.stringify(parsed));
    await window.storage.set("cpi_cache_key", cacheKey);
    return parsed;
  } catch {}
  return null;
}

// ── Sub-components ───────────────────────────────────────────────────────────

function Dots(): JSX.Element {
  return <div className="dots"><span /><span /><span /></div>;
}

interface DonutChartProps {
  weights: Weights;
  cats: Cat[];
  total: number;
}

function DonutChart({ weights, cats, total }: DonutChartProps): JSX.Element {
  const cx = 90, cy = 90, r = 70, ir = 44;
  const slices: Array<Cat & { path: string; pct: number }> = [];
  let angle = -Math.PI / 2;
  cats.forEach(c => {
    const pct = (weights[c.key] || 0) / 100;
    const sweep = pct * 2 * Math.PI;
    if (pct >= 0.005) {
      const x1 = cx + r * Math.cos(angle),   y1 = cy + r * Math.sin(angle);
      const x2 = cx + r * Math.cos(angle + sweep), y2 = cy + r * Math.sin(angle + sweep);
      const ix1 = cx + ir * Math.cos(angle),  iy1 = cy + ir * Math.sin(angle);
      const ix2 = cx + ir * Math.cos(angle + sweep), iy2 = cy + ir * Math.sin(angle + sweep);
      const large = sweep > Math.PI ? 1 : 0;
      const path = `M${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large} 1 ${x2.toFixed(2)},${y2.toFixed(2)} L${ix2.toFixed(2)},${iy2.toFixed(2)} A${ir},${ir} 0 ${large} 0 ${ix1.toFixed(2)},${iy1.toFixed(2)} Z`;
      slices.push({ ...c, path, pct });
    }
    angle += sweep;
  });
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"1.5rem", flexWrap:"wrap", justifyContent:"center" }}>
      <div style={{ flexShrink:0 }}>
        <svg width="180" height="180" viewBox="0 0 180 180">
          {slices.map(s => <path key={s.key} d={s.path} fill={s.color} style={{ filter:`drop-shadow(0 2px 6px ${s.color}55)`, transition:"all .4s" }}/>)}
          <text x="90" y="85" textAnchor="middle" fontSize="12" fontWeight="800" fill="#333" fontFamily="DM Sans,sans-serif">{"₹" + (total / 1000).toFixed(0) + "k"}</text>
          <text x="90" y="101" textAnchor="middle" fontSize="9" fontWeight="600" fill="#AAA" fontFamily="DM Sans,sans-serif">monthly</text>
        </svg>
      </div>
      <div style={{ flex:1, minWidth:160 }}>
        {[...cats].filter(c => (weights[c.key] || 0) > 0.5).sort((a, b) => (weights[b.key] || 0) - (weights[a.key] || 0)).map(c => (
          <div key={c.key} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
            <div style={{ width:10, height:10, borderRadius:3, background:c.color, flexShrink:0, boxShadow:`0 2px 4px ${c.color}55` }}/>
            <div style={{ fontSize:11, color:"#555", fontWeight:600, flex:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.icon} {c.label}</div>
            <div style={{ fontSize:11, fontWeight:800, color:c.color, flexShrink:0 }}>{(weights[c.key] || 0).toFixed(1)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── CSS ──────────────────────────────────────────────────────────────────────

const S = `
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
.main{max-width:920px;margin:0 auto;padding:1.2rem;overflow-x:hidden;}
.card{background:#fff;border-radius:20px;padding:1.3rem 1.4rem;margin-bottom:1.2rem;box-shadow:0 4px 20px rgba(91,45,142,.08);transition:box-shadow .25s,transform .2s;}
.card:hover{box-shadow:0 8px 32px rgba(91,45,142,.14);}
.card-title{font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;margin-bottom:1rem;}
.seg{display:flex;flex-wrap:wrap;gap:4px;background:#F0EBF8;border-radius:14px;padding:4px;}
.seg-btn{flex:1;min-width:130px;padding:9px 10px;font-size:12px;font-weight:700;border:none;border-radius:11px;cursor:pointer;font-family:'DM Sans',sans-serif;color:#888;background:none;transition:all .2s;white-space:nowrap;touch-action:manipulation;user-select:none;}
.seg-btn.active{background:linear-gradient(135deg,#764ba2,#5B2D8E);color:#fff;box-shadow:0 4px 12px rgba(91,45,142,.35);}
.seg-btn:hover:not(.active){color:#764ba2;background:rgba(118,75,162,.1);}
.seg-btn:active{transform:scale(.93);}
.select{width:100%;background:#F8F4FF;border:2px solid #E0D4F0;border-radius:12px;padding:10px 13px;font-size:13px;font-weight:700;color:#333;font-family:'DM Sans',sans-serif;outline:none;cursor:pointer;transition:all .2s;}
.select:focus{border-color:#764ba2;box-shadow:0 0 0 3px rgba(118,75,162,.12);}
.preset-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px;}
.preset-btn{border-radius:18px;padding:1rem .8rem;cursor:pointer;text-align:center;font-family:'DM Sans',sans-serif;border:none;touch-action:manipulation;user-select:none;transition:transform .15s,box-shadow .15s;box-shadow:0 4px 14px rgba(0,0,0,.12);position:relative;overflow:hidden;}
.preset-btn:hover{transform:translateY(-4px) scale(1.03);box-shadow:0 10px 28px rgba(0,0,0,.18);}
.preset-btn:active{transform:scale(.93)!important;}
.preset-icon{font-size:30px;display:block;margin-bottom:7px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.2));}
.preset-label{font-size:12px;font-weight:800;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,.3);}
.preset-desc{font-size:10px;color:rgba(255,255,255,.8);margin-top:2px;}
.grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px;margin-bottom:1.2rem;min-width:0;}
.cat{border-radius:16px;padding:1rem;transition:transform .15s,box-shadow .15s;border:2.5px solid transparent;touch-action:manipulation;overflow:hidden;min-width:0;}
.cat:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,.1);}
.cat:active{transform:scale(.97);}
.cat:focus-within{box-shadow:0 0 0 4px rgba(118,75,162,.18);}
.cat.filled{animation:flashFill .7s ease;}
@keyframes flashFill{0%{transform:scale(1.04)}40%{transform:scale(1.02)}100%{transform:scale(1)}}
.cat-icon{font-size:26px;margin-bottom:6px;display:block;filter:drop-shadow(0 2px 4px rgba(0,0,0,.15));}
.cat-name{font-size:12px;font-weight:800;color:#333;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.cat-pct{font-size:11px;font-weight:700;padding:2px 9px;border-radius:100px;display:inline-block;margin-bottom:8px;}
.inp-row{display:flex;gap:5px;align-items:center;}
.inp-wrap{display:flex;align-items:center;gap:5px;background:rgba(255,255,255,.7);border:2px solid rgba(255,255,255,.9);border-radius:10px;padding:7px 9px;flex:1;transition:all .2s;min-width:0;}
.inp-wrap:focus-within{background:#fff;border-color:#764ba2;box-shadow:0 0 0 3px rgba(118,75,162,.15);}
.inp-wrap span{font-size:13px;font-weight:800;transition:color .2s;flex-shrink:0;}
.inp-wrap input{background:transparent;border:none;outline:none;font-size:14px;font-weight:800;color:#333;width:100%;min-width:0;font-family:'DM Sans',sans-serif;overflow:hidden;text-overflow:ellipsis;}
.inp-wrap input::-webkit-inner-spin-button{-webkit-appearance:none;}
.stepper{display:flex;flex-direction:column;gap:3px;flex-shrink:0;}
.step-btn{background:rgba(255,255,255,.7);border:2px solid rgba(255,255,255,.9);border-radius:6px;width:24px;height:18px;cursor:pointer;font-size:10px;color:#666;display:flex;align-items:center;justify-content:center;transition:all .15s;touch-action:manipulation;font-weight:800;}
.step-btn:hover{background:#fff;border-color:#764ba2;color:#764ba2;transform:scale(1.1);}
.step-btn:active{transform:scale(.87);}
.track{height:4px;border-radius:2px;background:rgba(255,255,255,.4);margin-top:8px;overflow:hidden;}
.fill{height:100%;border-radius:2px;transition:width .45s cubic-bezier(.4,0,.2,1);background:rgba(255,255,255,.8);}
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
.cmp{display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:12px;margin-bottom:1.5rem;}
.cmp-box{border-radius:16px;padding:1.1rem;text-align:center;transition:transform .2s,box-shadow .2s;cursor:default;touch-action:manipulation;}
.cmp-box:hover{transform:translateY(-4px);box-shadow:0 10px 28px rgba(0,0,0,.12);}
.cmp-box:active{transform:scale(.95);}
.cmp-num{font-size:1.8rem;font-weight:800;letter-spacing:-1px;}
.cmp-lbl{font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-top:4px;opacity:.65;}
.bar-row{display:flex;align-items:center;gap:10px;margin-bottom:9px;border-radius:10px;padding:6px 9px;transition:background .15s,transform .15s;cursor:default;}
.bar-row:hover{background:#F4F6FF;transform:translateX(4px);}
.bar-lbl{font-size:11px;color:#888;width:clamp(80px,30%,130px);flex-shrink:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600;display:flex;align-items:center;gap:6px;}
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
.metric{border-radius:16px;padding:1.1rem;text-align:center;transition:transform .2s;touch-action:manipulation;}
.metric:hover{transform:translateY(-4px);box-shadow:0 10px 24px rgba(0,0,0,.1);}
.metric:active{transform:scale(.95);}
.metric-val{font-size:1.8rem;font-weight:800;letter-spacing:-1px;}
.metric-lbl{font-size:11px;margin-top:5px;line-height:1.4;font-weight:600;opacity:.8;}
.bench-bar{position:relative;height:14px;background:#EEE;border-radius:7px;margin:1rem 0;overflow:visible;}
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
.sub-cat{display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap;}
.sub-tip{font-size:12px;color:#555;padding:7px 0;border-bottom:1px dashed rgba(0,0,0,.08);line-height:1.55;font-weight:500;}
.sub-tip:last-child{border-bottom:none;padding-bottom:0;}
.tool-result{border-radius:16px;padding:1.2rem;margin-top:1rem;animation:fadeUp .3s ease;}
.tool-row{display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:4px 12px;padding:8px 0;border-bottom:1px dashed rgba(0,0,0,.08);font-size:13px;}
.tool-row:last-child{border-bottom:none;}
.tool-key{color:#888;font-weight:500;}
.tool-val{font-weight:800;color:#333;}
.num-inp{background:#F8F4FF;border:2.5px solid #E0D4F0;border-radius:12px;padding:10px 13px;font-size:14px;font-weight:800;color:#333;font-family:'DM Sans',sans-serif;outline:none;transition:all .2s;width:100%;}
.num-inp:focus{border-color:#764ba2;box-shadow:0 0 0 3px rgba(118,75,162,.12);}
.num-inp::-webkit-inner-spin-button{-webkit-appearance:none;}
.toast{position:fixed;bottom:24px;right:24px;left:24px;max-width:360px;margin:0 auto;font-size:13px;font-weight:800;padding:13px 20px;border-radius:14px;z-index:999;animation:toastIn .35s cubic-bezier(.34,1.56,.64,1);pointer-events:none;box-shadow:0 8px 28px rgba(0,0,0,.22);text-align:center;color:#fff;}
@keyframes toastIn{from{opacity:0;transform:translateY(20px) scale(.9)}to{opacity:1;transform:translateY(0) scale(1)}}
.footer{text-align:center;padding:1.5rem;color:#BBB;font-size:11px;border-top:2px solid #EEE;margin-top:1rem;font-weight:600;}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
.tm-timeline{display:flex;align-items:center;gap:0;margin:16px 0;overflow:hidden;border-radius:12px;}
.tm-segment{flex:1;height:8px;transition:all .3s;}
.tm-era-label{font-size:10px;color:#AAA;font-weight:700;text-align:center;margin-top:4px;}
`;

// ── SmartRebalancer ──────────────────────────────────────────────────────────

interface SmartRebalancerProps {
  spending: Spending;
  adjustedCpi: CpiMap & { headline: number };
  personalRate: number;
  total: number;
  cats: Cat[];
  fmt: (n: number) => string;
}

function SmartRebalancer({ spending, adjustedCpi, personalRate, total, cats, fmt }: SmartRebalancerProps): JSX.Element {
  const [shifts, setShifts] = useState<Partial<Record<CatKey, number>>>({});

  const newSpending = {} as Spending;
  cats.forEach(c => { newSpending[c.key] = Math.max(0, (spending[c.key] || 0) + (shifts[c.key] || 0)); });
  const newTotal = Object.values(newSpending).reduce((a, b) => a + b, 0);
  const newWeights = {} as Weights;
  cats.forEach(c => { newWeights[c.key] = newTotal > 0 ? (newSpending[c.key] / newTotal) * 100 : 0; });
  const newRate = cats.reduce((s, c) => s + (newWeights[c.key] / 100) * (adjustedCpi[c.key] || 0), 0);
  const rateDiff = newRate - personalRate;
  const annualSaving = (personalRate - newRate) / 100 * newTotal * 12;

  const sorted = [...cats].sort((a, b) =>
    ((adjustedCpi[b.key] || 0) * (newWeights[b.key] / 100)) - ((adjustedCpi[a.key] || 0) * (newWeights[a.key] / 100))
  );

  function nudge(key: CatKey, dir: 1 | -1): void {
    const step = 500;
    const cur = shifts[key] || 0;
    const val = cur + dir * step;
    if ((spending[key] || 0) + val < 0) return;
    setShifts(s => ({ ...s, [key]: val }));
  }

  function reset(): void { setShifts({}); }

  const hasShifts = Object.values(shifts).some(v => v !== 0);

  return (
    <div className="card">
      <div className="card-title" style={{ color: "#20BF6B" }}>⚖️ Smart Rebalancing Engine</div>
      <div style={{ fontSize: 12, color: "#888", marginBottom: 14, fontWeight: 500 }}>
        Shift spending between categories in ₹500 steps and instantly see how your personal inflation rate changes.
      </div>
      <div style={{ background: hasShifts ? (rateDiff < 0 ? "linear-gradient(135deg,#F0FFF7,#D4F5E5)" : "linear-gradient(135deg,#FFF0F1,#FFE8EA)") : "linear-gradient(135deg,#F8F4FF,#EDF4FF)", border: `2px solid ${hasShifts ? (rateDiff < 0 ? "#A8EEC8" : "#FFBCC0") : "#DDD5F5"}`, borderRadius: 14, padding: "12px 16px", marginBottom: 14, transition: "all .3s" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "#AAA", marginBottom: 4 }}>New Personal Rate</div>
            <div style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: -1, color: hasShifts ? (rateDiff < 0 ? "#20BF6B" : "#FC5C65") : "#764ba2", transition: "color .3s" }}>
              {newRate.toFixed(2)}%
            </div>
          </div>
          {hasShifts && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: rateDiff < 0 ? "#20BF6B" : "#FC5C65" }}>
                {rateDiff < 0 ? "▼" : "▲"} {Math.abs(rateDiff).toFixed(2)}% vs current
              </div>
              {annualSaving > 0 && <div style={{ fontSize: 12, color: "#20BF6B", fontWeight: 700, marginTop: 3 }}>Save ₹{fmt(annualSaving)} annually</div>}
              {annualSaving < 0 && <div style={{ fontSize: 12, color: "#FC5C65", fontWeight: 700, marginTop: 3 }}>+₹{fmt(Math.abs(annualSaving))} extra cost annually</div>}
            </div>
          )}
        </div>
      </div>
      {sorted.map(c => {
        const shift = shifts[c.key] || 0;
        const newAmt = Math.max(0, (spending[c.key] || 0) + shift);
        const impact = ((adjustedCpi[c.key] || 0) * (newWeights[c.key] / 100)).toFixed(3);
        return (
          <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, marginBottom: 8, background: shift < 0 ? c.bg : shift > 0 ? "#FFF8F0" : "#FAFAFA", border: `1.5px solid ${shift < 0 ? c.border : shift > 0 ? "#FFE0B2" : "#EEE"}`, transition: "all .2s" }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{c.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#333", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.label}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#333" }}>₹{fmt(newAmt)}</span>
                {shift !== 0 && <span style={{ fontSize: 10, fontWeight: 700, color: shift < 0 ? "#20BF6B" : "#FC5C65" }}>{shift > 0 ? "+" : ""}₹{fmt(shift)}</span>}
                <span style={{ fontSize: 10, color: "#AAA", marginLeft: "auto" }}>{impact}% impact</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
              <button onClick={() => nudge(c.key, -1)} style={{ width: 30, height: 30, borderRadius: 8, border: `2px solid ${c.border}`, background: c.bg, color: c.color, fontSize: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s", touchAction: "manipulation" }}>−</button>
              <button onClick={() => nudge(c.key, 1)}  style={{ width: 30, height: 30, borderRadius: 8, border: "2px solid #FFE0B2", background: "#FFF8F0", color: "#FF9F43", fontSize: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s", touchAction: "manipulation" }}>+</button>
            </div>
          </div>
        );
      })}
      {hasShifts && (
        <button onClick={reset} style={{ marginTop: 8, width: "100%", padding: "10px", borderRadius: 10, border: "2px solid #E0D4F0", background: "#F8F4FF", color: "#764ba2", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all .2s" }}>
          ↺ Reset all shifts
        </button>
      )}
    </div>
  );
}

// ── InflationTimeMachine ─────────────────────────────────────────────────────

interface InflationTimeMachineProps {
  personalRate: number;
  total: number;
  fmt: (n: number) => string;
}

interface Era {
  label: string;
  color: string;
  rate: number;
}

function InflationTimeMachine({ personalRate, total, fmt }: InflationTimeMachineProps): JSX.Element {
  const CURRENT_YEAR = 2026;
  const [tmYear, setTmYear] = useState<string>("");
  const [tmAmount, setTmAmount] = useState<string>("");

  const tmYr = parseInt(tmYear) || 0;
  const tmAmt = parseFloat(tmAmount) || 0;

  function getAvgRate(y: number): number {
    if (y < 2005) return 4.5;
    if (y < 2010) return 6.5;
    if (y < 2014) return 9.5;
    if (y < 2019) return 4.8;
    if (y < 2024) return 5.8;
    return 4.2;
  }

  let pastValue: number | null = null;
  let futureValue: number | null = null;
  let multiplier: number | null = null;
  let yearDiff = 0;
  const isPast    = tmYr >= 2000 && tmYr < CURRENT_YEAR;
  const isFuture  = tmYr > CURRENT_YEAR && tmYr <= 2075;
  const isCurrent = tmYr === CURRENT_YEAR;

  if (tmYr >= 2000 && tmAmt > 0) {
    if (isPast) {
      yearDiff = CURRENT_YEAR - tmYr;
      let pv = tmAmt;
      for (let y = CURRENT_YEAR - 1; y >= tmYr; y--) pv /= (1 + getAvgRate(y) / 100);
      pastValue = pv;
      multiplier = tmAmt / pv;
    }
    if (isFuture) {
      yearDiff = tmYr - CURRENT_YEAR;
      futureValue = tmAmt * Math.pow(1 + personalRate / 100, yearDiff);
    }
  }

  const eras: Era[] = [
    { label: "2000–04", color: "#20BF6B", rate: 4.5 },
    { label: "2005–09", color: "#F7B731", rate: 6.5 },
    { label: "2010–13", color: "#FC5C65", rate: 9.5 },
    { label: "2014–18", color: "#F7B731", rate: 4.8 },
    { label: "2019–23", color: "#FF9F43", rate: 5.8 },
    { label: "2024–26", color: "#20BF6B", rate: 4.2 },
  ];

  return (
    <>
      <div className="card-title" style={{ color: "#FF4757" }}>⏳ Inflation Time Machine</div>
      <div style={{ fontSize: 12, color: "#888", marginBottom: 18, fontWeight: 500 }}>
        Enter any year from 2000–2075 and a monthly spend. See what that amount was worth back then, or will cost in the future.
      </div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "#AAA", marginBottom: 8 }}>India CPI Eras</div>
        <div className="tm-timeline">
          {eras.map((e, i) => (
            <div key={i} style={{ flex: 1, background: e.color + "33", borderRight: i < eras.length - 1 ? "2px solid #fff" : "none" }}>
              <div style={{ height: 8, background: e.color, opacity: 0.7 }} />
              <div style={{ fontSize: 9, color: e.color, fontWeight: 800, textAlign: "center", padding: "3px 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.rate}%</div>
              <div style={{ fontSize: 8, color: "#AAA", fontWeight: 600, textAlign: "center", paddingBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, color: "#FF4757", fontWeight: 800, marginBottom: 7, letterSpacing: 1 }}>YEAR (2000–2075)</div>
          <input className="num-inp" type="number" min="2000" max="2075" placeholder="e.g. 2010" value={tmYear}
            onChange={e => setTmYear(e.target.value)}
            style={{ borderColor: tmYr && (tmYr < 2000 || tmYr > 2075) ? "#FC5C65" : undefined }}
          />
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#FF4757", fontWeight: 800, marginBottom: 7, letterSpacing: 1 }}>MONTHLY SPEND (₹)</div>
          <input className="num-inp" type="number" placeholder={`e.g. ${total > 0 ? Math.round(total) : 42000}`}
            value={tmAmount} onChange={e => setTmAmount(e.target.value)}
          />
        </div>
      </div>
      {tmYr > 0 && (tmYr < 2000 || tmYr > 2075) && (
        <div style={{ padding: "10px 14px", background: "#FFF0F1", border: "2px solid #FFBCC0", borderRadius: 12, fontSize: 12, color: "#FC5C65", fontWeight: 700, marginBottom: 12 }}>
          ⚠️ Please enter a year between 2000 and 2075.
        </div>
      )}
      {isCurrent && tmAmt > 0 && (
        <div style={{ padding: "10px 14px", background: "#F8F4FF", border: "2px solid #DDD5F5", borderRadius: 12, fontSize: 12, color: "#764ba2", fontWeight: 700, marginBottom: 12 }}>
          That's the current year — try a past year (2000–2025) or a future year (2027–2075).
        </div>
      )}
      {isPast && pastValue !== null && multiplier !== null && tmAmt > 0 && (
        <div className="tool-result" style={{ background: "linear-gradient(135deg,#FFF5F5,#FFE8EA)", border: "2px solid #FFBCC0" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#FF4757", marginBottom: 14 }}>
            ₹{fmt(tmAmt)}/month in {CURRENT_YEAR} = ₹{fmt(Math.round(pastValue))}/month in {tmYr}
          </div>
          <div className="tool-row"><span className="tool-key">Your spending today</span><span className="tool-val">₹{fmt(tmAmt)}/month</span></div>
          <div className="tool-row"><span className="tool-key">Equivalent cost in {tmYr}</span><span className="tool-val" style={{ color: "#20BF6B" }}>₹{fmt(Math.round(pastValue))}/month</span></div>
          <div className="tool-row"><span className="tool-key">Inflation multiplier since {tmYr}</span><span className="tool-val" style={{ color: "#FF4757" }}>{multiplier.toFixed(2)}×</span></div>
          <div className="tool-row"><span className="tool-key">Total cost increase over {yearDiff} yrs</span><span className="tool-val" style={{ color: "#FC5C65" }}>+₹{fmt(Math.round(tmAmt - pastValue))}/month</span></div>
          <div className="tool-row"><span className="tool-key">Avg annual inflation (implied)</span><span className="tool-val">{((Math.pow(multiplier, 1 / yearDiff) - 1) * 100).toFixed(1)}% p.a.</span></div>
          <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(255,71,87,.08)", borderRadius: 10, fontSize: 12, color: "#FF4757", fontWeight: 600, lineHeight: 1.6 }}>
            💡 What costs ₹{fmt(tmAmt)} today would have cost only ₹{fmt(Math.round(pastValue))} in {tmYr}. Inflation has made your lifestyle {multiplier.toFixed(1)}× more expensive over {yearDiff} years.
          </div>
        </div>
      )}
      {isFuture && futureValue !== null && tmAmt > 0 && (
        <div className="tool-result" style={{ background: "linear-gradient(135deg,#FFF5F5,#FFE8EA)", border: "2px solid #FFBCC0" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#FC5C65", marginBottom: 14 }}>
            ₹{fmt(tmAmt)}/month today → ₹{fmt(Math.round(futureValue))}/month in {tmYr}
          </div>
          <div className="tool-row"><span className="tool-key">Your spending today</span><span className="tool-val">₹{fmt(tmAmt)}/month</span></div>
          <div className="tool-row"><span className="tool-key">Projected cost in {tmYr}</span><span className="tool-val" style={{ color: "#FC5C65" }}>₹{fmt(Math.round(futureValue))}/month</span></div>
          <div className="tool-row"><span className="tool-key">Extra monthly cost by {tmYr}</span><span className="tool-val" style={{ color: "#FC5C65" }}>+₹{fmt(Math.round(futureValue - tmAmt))}</span></div>
          <div className="tool-row"><span className="tool-key">Total extra over {yearDiff} yrs (annual)</span><span className="tool-val">₹{fmt(Math.round((futureValue - tmAmt) * 12))}/yr more</span></div>
          <div className="tool-row"><span className="tool-key">Rate used (your personal inflation)</span><span className="tool-val">{personalRate.toFixed(2)}% p.a.</span></div>
          <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(255,71,87,.08)", borderRadius: 10, fontSize: 12, color: "#FF4757", fontWeight: 600, lineHeight: 1.6 }}>
            💡 At your personal inflation rate of {personalRate.toFixed(2)}%, your ₹{fmt(tmAmt)}/month lifestyle will cost ₹{fmt(Math.round(futureValue))} by {tmYr} — {yearDiff} years from now.
          </div>
        </div>
      )}
    </>
  );
}

// ── App ──────────────────────────────────────────────────────────────────────

export default function App(): JSX.Element {
  const [tab, setTab]             = useState<number>(0);
  const [spending, setSpending]   = useState<Spending>(DEFAULT);
  const [sector, setSector]       = useState<string>("combined");
  const [state, setState]         = useState<string>("Karnataka");
  const [cpiData, setCpiData]     = useState<CpiData>(FALLBACK_CPI);
  const [liveStatus, setLiveStatus] = useState<LiveStatus>("checking");
  const [salary, setSalary]       = useState<string>("");
  const [ai, setAi]               = useState<string>("");
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [toast, setToast]         = useState<string>("");
  const [toastType, setToastType] = useState<ToastType>("info");
  const [filledKeys, setFilledKeys] = useState<string[]>([]);
  const [tracker, setTracker]     = useState<TrackerEntry[]>([]);
  const [diary, setDiary]         = useState<DiaryEntry[]>([]);
  const [diaryNote, setDiaryNote] = useState<string>("");
  const [rateBumped, setRateBumped] = useState<boolean>(false);
  const [goalAmount, setGoalAmount] = useState<string>("");
  const [goalYears, setGoalYears]   = useState<string>("");
  const [emiAmount, setEmiAmount]   = useState<string>("");
  const [emiYears, setEmiYears]     = useState<string>("");
  const [sipAmount, setSipAmount]   = useState<string>("");
  const [sipReturn, setSipReturn]   = useState<string>("");
  const [sipYears, setSipYears]     = useState<string>("");
  const [activeTool, setActiveTool] = useState<ToolKey>("goal");
  const prevRateRef = useRef<number | null>(null);
  const toastRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string, type: ToastType = "info"): void => {
    setToast(msg); setToastType(type);
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(""), 2800);
  };

  useEffect(() => {
    (async () => {
      try {
        const fresh = await fetchLatestCPI();
        if (fresh?.month) { setCpiData(fresh); setLiveStatus("live"); } else setLiveStatus("failed");
      } catch { setLiveStatus("failed"); }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [tr, di] = await Promise.all([window.storage.get("tracker_data"), window.storage.get("diary_data")]);
        if (tr) setTracker(JSON.parse(tr.value) as TrackerEntry[]);
        if (di) setDiary(JSON.parse(di.value) as DiaryEntry[]);
      } catch {}
    })();
  }, []);

  const total = Object.values(spending).reduce((a, b) => a + Number(b), 0);
  const weights = {} as Weights;
  CATS.forEach(c => { weights[c.key] = total > 0 ? (spending[c.key] / total) * 100 : 0; });
  const stateOffset = STATE_OFFSETS[state] || 0;
  const sectorMult: Record<string, number> = { combined:1, rural:0.97, urban:1.04 };
  const mult = sectorMult[sector] ?? 1;
  const adjustedCpi = {} as CpiMap & { headline: number };
  CATS.forEach(c => { adjustedCpi[c.key] = +(((cpiData[c.key] || 0) * mult) + stateOffset * 0.4).toFixed(2); });
  adjustedCpi.headline = +(cpiData.headline * mult + stateOffset).toFixed(2);
  const personalRate = CATS.reduce((s, c) => s + (weights[c.key] / 100) * (adjustedCpi[c.key] || 0), 0);
  const diff = personalRate - adjustedCpi.headline;
  const rateColor = diff > 1.5 ? "#FC5C65" : diff > 0 ? "#F7B731" : "#20BF6B";
  const forecastCpi = {} as CpiMap;
  CATS.forEach(c => { forecastCpi[c.key] = +(adjustedCpi[c.key] + (FORECAST_DELTA[c.key] || 0)).toFixed(2); });
  const forecastRate = CATS.reduce((s, c) => s + (weights[c.key] / 100) * (forecastCpi[c.key] || 0), 0);
  const annualLoss = total * 12 * (personalRate / 100);

  const getPercentile = (r: number): number => {
    if (r <= PEER_BENCHMARK.p25) return Math.round((r / PEER_BENCHMARK.p25) * 25);
    if (r <= PEER_BENCHMARK.p50) return Math.round(25 + (r - PEER_BENCHMARK.p25) / (PEER_BENCHMARK.p50 - PEER_BENCHMARK.p25) * 25);
    if (r <= PEER_BENCHMARK.p75) return Math.round(50 + (r - PEER_BENCHMARK.p50) / (PEER_BENCHMARK.p75 - PEER_BENCHMARK.p50) * 25);
    return Math.round(75 + (r - PEER_BENCHMARK.p75) / (PEER_BENCHMARK.p90 - PEER_BENCHMARK.p75) * 25);
  };
  const percentile  = Math.min(99, getPercentile(personalRate));
  const markerLeft  = Math.min(98, Math.max(2, (personalRate / (PEER_BENCHMARK.p90 * 1.1)) * 100));
  const salaryNum   = parseFloat(salary) || 0;
  const realRaise   = salaryNum - personalRate;
  const salaryOk    = realRaise > 0;
  const maxR        = Math.max(...CATS.map(c => adjustedCpi[c.key] || 0), adjustedCpi.headline || 0) * 1.1;
  const goalAmt     = parseFloat(goalAmount) || 0;
  const goalYr      = parseFloat(goalYears) || 0;
  const inflationAdjustedGoal = goalAmt * Math.pow(1 + personalRate / 100, goalYr);
  const monthlySavingsNeeded  = goalYr > 0 && personalRate > 0
    ? inflationAdjustedGoal / ((Math.pow(1 + personalRate / 100 / 12, goalYr * 12) - 1) / (personalRate / 100 / 12))
    : goalAmt / (goalYr * 12 || 1);
  const emiAmt = parseFloat(emiAmount) || 0;
  const emiYr  = parseFloat(emiYears)  || 0;
  const totalEmiPaid       = emiAmt * emiYr * 12;
  const emiInflationBenefit = totalEmiPaid - emiAmt * 12 * emiYr / (1 + personalRate / 100 * emiYr / 2);
  const sipAmt = parseFloat(sipAmount) || 0;
  const sipRet = parseFloat(sipReturn) || 0;
  const sipYr  = parseFloat(sipYears)  || 0;
  const sipFV  = sipRet > 0 ? sipAmt * ((Math.pow(1 + sipRet / 100 / 12, sipYr * 12) - 1) / (sipRet / 100 / 12)) * (1 + sipRet / 100 / 12) : 0;
  const sipRealFV          = sipFV / Math.pow(1 + personalRate / 100, sipYr);
  const sipBeatsInflation  = sipRet > personalRate;
  const fmt = (n: number): string => Math.round(n).toLocaleString("en-IN");

  useEffect(() => {
    if (prevRateRef.current !== null && Math.abs(personalRate - prevRateRef.current) > 0.05) {
      setRateBumped(true); setTimeout(() => setRateBumped(false), 450);
    }
    prevRateRef.current = personalRate;
  }, [personalRate]);

  function applyPreset(p: Preset): void {
    setSpending(p.spending); setFilledKeys(Object.keys(p.spending));
    setTimeout(() => setFilledKeys([]), 1200);
    showToast(`✓ Applied: ${p.label} profile`, "success");
  }

  function saveToTracker(): void {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const now = new Date();
    const label = `${months[now.getMonth()]} ${now.getFullYear()}`;
    const entry: TrackerEntry = { label, rate: +personalRate.toFixed(2), state, sector, date: Date.now() };
    const updated = [...tracker.filter(e => e.label !== label), entry].sort((a, b) => a.date - b.date).slice(-12);
    setTracker(updated);
    window.storage.set("tracker_data", JSON.stringify(updated)).catch(() => {});
    showToast("✓ Saved to monthly tracker", "success");
  }

  function saveDiaryEntry(): void {
    if (!diaryNote.trim()) return;
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const now = new Date();
    const label = `${months[now.getMonth()]} ${now.getFullYear()}`;
    const entry: DiaryEntry = { label, rate: +personalRate.toFixed(2), note: diaryNote.trim(), date: Date.now() };
    const updated = [entry, ...diary].slice(-24);
    setDiary(updated);
    window.storage.set("diary_data", JSON.stringify(updated)).catch(() => {});
    setDiaryNote("");
    showToast("✓ Diary entry saved", "success");
  }

  function deleteDiaryEntry(idx: number): void {
    const updated = diary.filter((_, i) => i !== idx);
    setDiary(updated);
    window.storage.set("diary_data", JSON.stringify(updated)).catch(() => {});
  }

  async function genAI(): Promise<void> {
    setAiLoading(true); setAi("");
    const top = [...CATS].sort((a, b) => weights[b.key] - weights[a.key]).slice(0, 3)
      .map(c => `${c.label} (${weights[c.key].toFixed(1)}% spend, ${adjustedCpi[c.key].toFixed(1)}% inflation)`).join(", ");
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: `Personal finance analyst India. Personal inflation: ${personalRate.toFixed(2)}%, National: ${adjustedCpi.headline.toFixed(2)}%, State: ${state}, Sector: ${sector}, Month: ${cpiData.month}, Top spend: ${top}, Monthly: ₹${total.toLocaleString("en-IN")}, Annual loss: ₹${fmt(annualLoss)}. Write 3 short paragraphs: 1) Rate vs national 2) Categories hurting most 3) Two India-specific tips. Under 200 words.` }] }),
      });
      const d = await r.json();
      setAi(d?.content?.[0]?.text || "Unable to generate.");
    } catch { setAi("Could not generate analysis."); }
    setAiLoading(false);
  }

  return (
    <>
      <style>{S}</style>
      {toast && <div className="toast" style={{ background: TOAST_COLORS[toastType] }}>{toast}</div>}

      <div className="wrap">
        <div className="hero">
          <div className="pill">✦ India CPI Tool · {cpiData.month}</div>
          <h1>Your <span>Personal</span> Inflation Rate</h1>
          <p>The national average hides your reality. Calculate what inflation actually costs you.</p>
        </div>

        <div className="tabs">
          {TABS.map((t, i) => (
            <button key={t} className={`tab${tab === i ? " active" : ""}`} onClick={() => setTab(i)}>{t}</button>
          ))}
        </div>

        <div className="main">

          {tab === 0 && (<>
            <div className="card">
              <div className="card-title" style={{ color: "#764ba2" }}>⚙️ Settings</div>
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background:"linear-gradient(135deg,#F8F4FF,#EDF4FF)", borderRadius:14, marginBottom:16, border:"2px solid #DDD5F5" }}>
                {liveStatus === "checking" && <><div className="scan-ring" style={{ borderTopColor:"#764ba2", borderColor:"#DDD5F5" }}/><span style={{ fontSize:12, color:"#764ba2", fontWeight:700 }}>Fetching latest MoSPI data…</span></>}
                {liveStatus === "live"     && <><div style={{ width:9, height:9, borderRadius:"50%", background:"#20BF6B", animation:"blink 2s infinite", flexShrink:0, boxShadow:"0 0 6px #20BF6B" }}/><span style={{ fontSize:12, color:"#20BF6B", fontWeight:800 }}>Live · {cpiData.month} · Base {cpiData.base}</span>{cpiData.est && <span style={{ fontSize:10, color:"#CCC", marginLeft:4 }}>* some categories estimated</span>}</>}
                {liveStatus === "failed"   && <><div style={{ width:9, height:9, borderRadius:"50%", background:"#F7B731", flexShrink:0 }}/><span style={{ fontSize:12, color:"#F7B731", fontWeight:800 }}>Using saved data · {cpiData.month}</span></>}
                <span style={{ marginLeft:"auto", fontSize:10, color:"#CCC", fontWeight:600 }}>Updates 12th monthly</span>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:14, marginBottom:14 }}>
                <div>
                  <div style={{ fontSize:11, color:"#764ba2", fontWeight:800, marginBottom:7, letterSpacing:1 }}>SECTOR</div>
                  <div className="seg">
                    {(["combined","rural","urban"] as const).map(s => (
                      <button key={s} className={`seg-btn${sector === s ? " active" : ""}`} onClick={() => setSector(s)}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:11, color:"#764ba2", fontWeight:800, marginBottom:7, letterSpacing:1 }}>STATE</div>
                  <select className="select" value={state} onChange={e => setState(e.target.value)}>
                    {Object.keys(STATE_OFFSETS).sort().map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ fontSize:12, color:"#888", fontWeight:600 }}>State offset: <strong style={{ color: stateOffset > 0 ? "#FC5C65" : stateOffset < 0 ? "#20BF6B" : "#AAA" }}>{stateOffset > 0 ? "+" : ""}{stateOffset.toFixed(1)}% vs national avg</strong> · {sector}</div>
            </div>

            <div className="card">
              <div className="card-title" style={{ color:"#F7B731" }}>🎯 Quick Profiles</div>
              <div className="preset-grid">
                {PRESETS.map(p => (
                  <button key={p.label} className="preset-btn" onClick={() => applyPreset(p)} style={{ background:p.grad }}>
                    <span className="preset-icon">{p.icon}</span>
                    <div className="preset-label">{p.label}</div>
                    <div className="preset-desc">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="card">
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1rem", flexWrap:"wrap", gap:8 }}>
                <div className="card-title" style={{ margin:0, color:"#20BF6B" }}>💰 Monthly Spending</div>
                <button className="btn-ghost" onClick={() => { setSpending(DEFAULT); setFilledKeys([]); showToast("↺ Reset","info"); }}>↺ Reset</button>
              </div>
              <div className="grid2">
                {CATS.map(c => {
                  const w = weights[c.key] || 0;
                  const isFilled = filledKeys.includes(c.key);
                  return (
                    <div className={`cat${isFilled ? " filled" : ""}`} key={c.key}
                      style={{ background: isFilled ? c.bg : `${c.bg}CC`, border:`2.5px solid ${isFilled ? c.color : w > 20 ? c.color + "88" : "transparent"}`, boxShadow: isFilled ? `0 4px 16px ${c.color}33` : "none" }}>
                      <span className="cat-icon">{c.icon}</span>
                      <div className="cat-name">{c.label}</div>
                      <div className="cat-pct" style={{ color:c.color, background:`${c.color}18`, border:`1.5px solid ${c.border}` }}>{w.toFixed(1)}%</div>
                      <div className="inp-row" style={{ marginTop:6 }}>
                        <div className="inp-wrap" style={{ borderColor: w > 15 ? `${c.color}66` : "rgba(255,255,255,.9)" }}>
                          <span style={{ color:c.color }}>₹</span>
                          <input type="number" min="0" value={spending[c.key]} onChange={e => setSpending(s => ({ ...s, [c.key]: +e.target.value }))}/>
                        </div>
                        <div className="stepper">
                          <button className="step-btn" style={{ borderColor:`${c.color}44`, color:c.color }} onClick={() => setSpending(s => ({ ...s, [c.key]: Math.max(0, s[c.key] + 500) }))}>▲</button>
                          <button className="step-btn" style={{ borderColor:`${c.color}44`, color:c.color }} onClick={() => setSpending(s => ({ ...s, [c.key]: Math.max(0, s[c.key] - 500) }))}>▼</button>
                        </div>
                      </div>
                      <div className="track" style={{ background:`${c.color}22` }}><div className="fill" style={{ width:`${Math.min(w * 2.5, 100)}%`, background:c.color }}/></div>
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize:13, color:"#888", fontWeight:600 }}>Total monthly: <strong style={{ color:"#333", fontWeight:800 }}>₹{total.toLocaleString("en-IN")}</strong></div>
            </div>

            <div className="card">
              <div className="card-title" style={{ color:"#8854D0" }}>🍩 Spending Breakdown</div>
              <DonutChart weights={weights} cats={CATS} total={total}/>
              <div style={{ marginTop:14, display:"flex", gap:8, flexWrap:"wrap" }}>
                {[...CATS].sort((a,b) => ((adjustedCpi[b.key]||0)*(weights[b.key]||0)/100) - ((adjustedCpi[a.key]||0)*(weights[a.key]||0)/100)).slice(0,3).map(c => (
                  <div key={c.key} style={{ flex:1, minWidth:90, background:c.bg, border:`2px solid ${c.border}`, borderRadius:12, padding:"8px 10px", textAlign:"center" }}>
                    <div style={{ fontSize:18, marginBottom:2 }}>{c.icon}</div>
                    <div style={{ fontSize:11, fontWeight:800, color:c.color }}>{((adjustedCpi[c.key]||0)*(weights[c.key]||0)/100).toFixed(2)}%</div>
                    <div style={{ fontSize:9, color:"#AAA", fontWeight:600, marginTop:1 }}>impact on rate</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="results">
              <div style={{ display:"flex", alignItems:"flex-end", gap:16, flexWrap:"wrap", marginBottom:"1.5rem" }}>
                <div className={`rate-num${rateBumped ? " bumped" : ""}`} style={{ color:rateColor, textShadow:`0 0 30px ${rateColor}44` }}>{personalRate.toFixed(2)}%</div>
                <div>
                  <div className="rate-lbl">Your personal inflation · {state} · {cpiData.month}</div>
                  <div className="delta-badge" style={{ background: diff>0 ? "#FFF0F1" : "#F0FFF7", color: diff>0 ? "#FC5C65" : "#20BF6B", border:`2px solid ${diff>0 ? "#FFBCC0" : "#A8EEC8"}` }}>
                    {diff > 0 ? "▲" : "▼"} {Math.abs(diff).toFixed(2)}% vs state average
                  </div>
                </div>
              </div>
              <div className="cmp">
                {[
                  { val: personalRate.toFixed(2) + "%", lbl:"Your Rate",       c:rateColor,  bg:`${rateColor}18`,  border:`${rateColor}44` },
                  { val: adjustedCpi.headline.toFixed(2) + "%", lbl:`${state} CPI`, c:"#2D98DA", bg:"#EDF4FF", border:"#A8D4F5" },
                  { val: forecastRate.toFixed(2) + "%", lbl:"6-Mo Forecast",   c:"#20BF6B",  bg:"#F0FFF7",         border:"#A8EEC8" },
                ].map(b => (
                  <div key={b.lbl} className="cmp-box" style={{ background:b.bg, border:`2.5px solid ${b.border}`, boxShadow:`0 4px 16px ${b.c}22` }}>
                    <div className="cmp-num" style={{ color:b.c }}>{b.val}</div>
                    <div className="cmp-lbl" style={{ color:b.c }}>{b.lbl}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize:11, fontWeight:800, letterSpacing:"2px", textTransform:"uppercase", color:"#AAA", marginBottom:12 }}>Category Breakdown</div>
              {CATS.map(c => (
                <div className="bar-row" key={c.key}>
                  <div className="bar-lbl"><span style={{ fontSize:15 }}>{c.icon}</span>{c.label}</div>
                  <div className="bar-track"><div className="bar-fill" style={{ width:`${Math.min(((adjustedCpi[c.key]||0)/maxR)*100,100)}%`, background:c.grad }}/></div>
                  <div className="bar-val" style={{ color:c.color }}>{(adjustedCpi[c.key]||0).toFixed(1)}%</div>
                </div>
              ))}
              <div className="bar-row" style={{ marginTop:8, paddingTop:10, borderTop:"2px dashed #EEE" }}>
                <div className="bar-lbl" style={{ color:"#2D98DA", fontWeight:800 }}>🇮🇳 {state} CPI</div>
                <div className="bar-track"><div className="bar-fill" style={{ width:`${Math.min((adjustedCpi.headline/maxR)*100,100)}%`, background:"linear-gradient(135deg,#2D98DA,#45AAF2)" }}/></div>
                <div className="bar-val" style={{ color:"#2D98DA", fontWeight:800 }}>{adjustedCpi.headline.toFixed(1)}%</div>
              </div>
            </div>

            <div style={{ display:"flex", gap:10, marginBottom:"1.2rem", flexWrap:"wrap" }}>
              <button className="cta" style={{ flex:1 }} onClick={genAI} disabled={aiLoading || total === 0}>
                {aiLoading ? "Generating…" : "✦ Generate AI Analysis"}
              </button>
              <button className="save-btn" onClick={saveToTracker}>📌 Save to Tracker</button>
            </div>

            {(aiLoading || ai) && (
              <div className="ai-box">
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                  <div style={{ background:"linear-gradient(135deg,#764ba2,#5B2D8E)", color:"#fff", fontSize:10, fontWeight:800, letterSpacing:1.5, textTransform:"uppercase", padding:"6px 14px", borderRadius:100, boxShadow:"0 4px 12px rgba(91,45,142,.35)" }}>✦ AI Analysis</div>
                  <div style={{ fontSize:11, color:"#CCC", fontWeight:600 }}>Claude · {state} · {sector} · {cpiData.month}</div>
                </div>
                <div className="ai-txt">
                  {aiLoading
                    ? <div style={{ display:"flex", alignItems:"center", gap:10, color:"#BBB" }}><Dots/><span style={{ fontWeight:600 }}>Analysing your profile…</span></div>
                    : ai.split("\n\n").map((p, i) => <p key={i} dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }}/>)
                  }
                </div>
              </div>
            )}
          </>)}

          {tab === 1 && (<>
            <div className="card">
              <div className="card-title" style={{ color:"#2D98DA" }}>📈 Monthly Inflation Tracker</div>
              {tracker.length === 0 ? (
                <div style={{ textAlign:"center", padding:"2.5rem", color:"#BBB" }}>
                  <div style={{ fontSize:44, marginBottom:12 }}>📌</div>
                  <div style={{ fontSize:14, fontWeight:800, color:"#AAA" }}>No data yet</div>
                  <div style={{ fontSize:12, color:"#CCC", marginTop:5, fontWeight:500 }}>Go to Calculator → hit "Save to Tracker" each month.</div>
                </div>
              ) : (<>
                {tracker.map((e, i) => {
                  const maxT = Math.max(...tracker.map(x => x.rate)) * 1.1;
                  const c = e.rate > 4.5 ? "#FC5C65" : e.rate > 3.5 ? "#F7B731" : "#20BF6B";
                  const bg = e.rate > 4.5 ? "linear-gradient(135deg,#FFF0F1,#FFE8EA)" : e.rate > 3.5 ? "linear-gradient(135deg,#FFFBF0,#FFF3D0)" : "linear-gradient(135deg,#F0FFF7,#E0FFF0)";
                  return (
                    <div className="tracker-entry" key={i} style={{ background:bg, border:`2px solid ${c}33` }}>
                      <div className="tracker-month">{e.label}</div>
                      <div className="tracker-bar"><div className="tracker-fill" style={{ width:`${(e.rate/maxT)*100}%`, background:`linear-gradient(135deg,${c},${c}CC)` }}/></div>
                      <div style={{ fontSize:16, fontWeight:800, color:c, width:46, textAlign:"right" }}>{e.rate}%</div>
                      <div style={{ fontSize:10, color:"#CCC", width:60, textAlign:"right", fontWeight:600 }}>{e.state}</div>
                    </div>
                  );
                })}
                <button className="btn-ghost" style={{ marginTop:10 }} onClick={async () => { setTracker([]); try { await window.storage.delete("tracker_data"); } catch {} showToast("↺ Tracker cleared","info"); }}>Clear history</button>
              </>)}
            </div>

            <div className="card">
              <div className="card-title" style={{ color:"#A55EEA" }}>📔 Inflation Diary</div>
              <div style={{ fontSize:12, color:"#888", marginBottom:12, fontWeight:500 }}>Note what drove your inflation this month.</div>
              <textarea value={diaryNote} onChange={e => setDiaryNote(e.target.value)}
                placeholder={`What changed this month? e.g. "Landlord raised rent by ₹2,000."`}
                style={{ width:"100%", background:"#F8F4FF", border:"2.5px solid #E0D4F0", borderRadius:14, padding:"12px 14px", fontSize:13, color:"#333", fontFamily:"'DM Sans',sans-serif", resize:"vertical", minHeight:80, outline:"none", lineHeight:1.6, transition:"all .2s", fontWeight:500 }}
                onFocus={e => { e.target.style.borderColor="#764ba2"; e.target.style.boxShadow="0 0 0 3px rgba(118,75,162,.12)"; }}
                onBlur={e  => { e.target.style.borderColor="#E0D4F0"; e.target.style.boxShadow="none"; }}
              />
              <button className="save-btn" style={{ marginTop:10 }} onClick={saveDiaryEntry}>💾 Save Entry · {cpiData.month} · {personalRate.toFixed(2)}%</button>
              {diary.length > 0 && (
                <div style={{ marginTop:16 }}>
                  <div style={{ fontSize:11, color:"#AAA", fontWeight:800, letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 }}>Past Entries</div>
                  {diary.map((e, i) => (
                    <div className="diary-entry" key={i}>
                      <div className="diary-header">
                        <div className="diary-month">{e.label}</div>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ fontSize:15, fontWeight:800, color: e.rate>4 ? "#FC5C65" : e.rate>3 ? "#F7B731" : "#20BF6B" }}>{e.rate}%</div>
                          <button className="diary-del" onClick={() => deleteDiaryEntry(i)}>✕</button>
                        </div>
                      </div>
                      <div className="diary-note">{e.note}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-title" style={{ color:"#2D98DA" }}>🔮 6-Month Inflation Forecast</div>
              <div style={{ fontSize:12, color:"#888", marginBottom:12, fontWeight:500 }}>Based on RBI projections and MoSPI trend data.</div>
              {CATS.map(c => (
                <div className="forecast-row" key={c.key}>
                  <div className="forecast-lbl"><span style={{ fontSize:14 }}>{c.icon}</span>{c.label}</div>
                  <div className="forecast-now">{adjustedCpi[c.key].toFixed(1)}%</div>
                  <div className="forecast-arrow">→</div>
                  <div className="forecast-next" style={{ color: forecastCpi[c.key] > adjustedCpi[c.key] ? "#FC5C65" : "#20BF6B" }}>{forecastCpi[c.key].toFixed(1)}%</div>
                </div>
              ))}
              <div style={{ marginTop:14, padding:"14px 16px", background:"linear-gradient(135deg,#F8F4FF,#EDF4FF)", borderRadius:14, fontSize:13, border:"2px solid #DDD5F5" }}>
                <span style={{ color:"#888", fontWeight:500 }}>Projected rate in 6 months: </span>
                <strong style={{ color: forecastRate > personalRate ? "#FC5C65" : "#20BF6B" }}>{forecastRate.toFixed(2)}%</strong>
                <span style={{ color:"#888", fontWeight:500 }}> ({forecastRate > personalRate ? "▲" : "▼"} {Math.abs(forecastRate - personalRate).toFixed(2)}% from today)</span>
              </div>
            </div>
          </>)}

          {tab === 2 && (<>
            <div className="card">
              <div className="card-title" style={{ color:"#FC5C65" }}>💸 Annual Purchasing Power Loss</div>
              <div className="metric-grid">
                <div className="metric" style={{ background:"linear-gradient(135deg,#FFF0F1,#FFE8EA)", boxShadow:"0 4px 16px rgba(252,92,101,.15)" }}><div className="metric-val" style={{ color:"#FC5C65" }}>₹{fmt(annualLoss)}</div><div className="metric-lbl" style={{ color:"#FC5C65" }}>Lost per year to inflation</div></div>
                <div className="metric" style={{ background:"linear-gradient(135deg,#FFFBF0,#FFF3D0)", boxShadow:"0 4px 16px rgba(247,183,49,.15)" }}><div className="metric-val" style={{ color:"#F7B731" }}>₹{fmt(annualLoss/12)}</div><div className="metric-lbl" style={{ color:"#F7B731" }}>Lost per month</div></div>
                <div className="metric" style={{ background:"linear-gradient(135deg,#EDF4FF,#D4EAFF)", boxShadow:"0 4px 16px rgba(45,152,218,.15)" }}><div className="metric-val" style={{ color:"#2D98DA" }}>{(100-personalRate).toFixed(1)}%</div><div className="metric-lbl" style={{ color:"#2D98DA" }}>of ₹100 retained next year</div></div>
                <div className="metric" style={{ background:"linear-gradient(135deg,#F0FFF7,#D4F5E5)", boxShadow:"0 4px 16px rgba(32,191,107,.15)" }}><div className="metric-val" style={{ color:"#20BF6B" }}>{(personalRate+1.5).toFixed(1)}%+</div><div className="metric-lbl" style={{ color:"#20BF6B" }}>FD rate to beat inflation</div></div>
              </div>
            </div>

            <SmartRebalancer spending={spending} adjustedCpi={adjustedCpi} personalRate={personalRate} total={total} cats={CATS} fmt={fmt}/>

            <div className="card">
              <div className="card-title" style={{ color:"#A55EEA" }}>💡 Smart Substitution Suggestions</div>
              <div style={{ fontSize:12, color:"#888", marginBottom:14, fontWeight:500 }}>Targeted tips for your top 3 highest-inflation categories.</div>
              {[...CATS].sort((a,b) => ((adjustedCpi[b.key]||0)*weights[b.key]/100) - ((adjustedCpi[a.key]||0)*weights[a.key]/100)).slice(0,3).map(c => (
                <div className="sub-card" key={c.key} style={{ background:c.bg, boxShadow:`0 4px 16px ${c.color}22` }}>
                  <div className="sub-cat">
                    <span style={{ fontSize:28, filter:`drop-shadow(0 2px 4px ${c.color}44)` }}>{c.icon}</span>
                    <span style={{ fontSize:13, fontWeight:800, color:c.color }}>{c.label}</span>
                    <span style={{ fontSize:11, color:"#fff", fontWeight:800, marginLeft:"auto", background:c.grad, padding:"3px 10px", borderRadius:100, boxShadow:`0 2px 8px ${c.color}44` }}>{(adjustedCpi[c.key]||0).toFixed(1)}% inflation</span>
                  </div>
                  {(SUBSTITUTIONS[c.key] || []).slice(0,3).map((tip, i) => (
                    <div className="sub-tip" key={i}>💰 {tip}</div>
                  ))}
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-title" style={{ color:"#20BF6B" }}>👥 Peer Benchmarking</div>
              <div style={{ fontSize:12, color:"#888", marginBottom:6, fontWeight:500 }}>How your inflation compares to other users in {state}.</div>
              <div className="bench-bar"><div className="bench-fill" style={{ width:"100%" }}/><div className="bench-marker" style={{ left:`${markerLeft}%` }}/></div>
              <div className="bench-labels"><span>Low</span><span>P25: {PEER_BENCHMARK.p25}%</span><span>Avg: {PEER_BENCHMARK.p50}%</span><span>P75: {PEER_BENCHMARK.p75}%</span><span>High</span></div>
              <div style={{ marginTop:14, padding:"14px 16px", background: percentile>75 ? "linear-gradient(135deg,#FFF0F1,#FFE8EA)" : percentile>50 ? "linear-gradient(135deg,#FFFBF0,#FFF3D0)" : "linear-gradient(135deg,#F0FFF7,#D4F5E5)", borderRadius:14, fontSize:13, border:`2px solid ${percentile>75 ? "#FFBCC0" : percentile>50 ? "#FFE082" : "#A8EEC8"}`, fontWeight:500 }}>
                Your rate of <strong style={{ color:rateColor }}>{personalRate.toFixed(2)}%</strong> is higher than <strong>{percentile}%</strong> of users in your area.
                {percentile > 75 ? " You're in the high-inflation group — review your top spending categories." : percentile > 50 ? " You're slightly above average — small adjustments could help." : " Great — you're managing inflation well!"}
              </div>
            </div>

            <div className="card">
              <div className="card-title" style={{ color:"#F7B731" }}>💼 Salary Inflation Check</div>
              <div style={{ fontSize:12, color:"#888", marginBottom:14, fontWeight:500 }}>Did your last raise actually beat your personal inflation?</div>
              <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                <div style={{ fontSize:13, color:"#666", fontWeight:600 }}>My last salary hike was</div>
                <input className="sal-inp" type="number" min="0" max="100" step="0.1" placeholder="e.g. 8" value={salary} onChange={e => setSalary(e.target.value)}/>
                <div style={{ fontSize:13, color:"#666", fontWeight:600 }}>%</div>
              </div>
              {salaryNum > 0 && (
                <div>
                  <div className="verdict" style={{ background: salaryOk ? "linear-gradient(135deg,#F0FFF7,#D4F5E5)" : "linear-gradient(135deg,#FFF0F1,#FFE8EA)", color: salaryOk ? "#20BF6B" : "#FC5C65", border:`2px solid ${salaryOk ? "#A8EEC8" : "#FFBCC0"}` }}>
                    {salaryOk ? "✓ Your raise beat inflation" : "✗ Your raise didn't beat inflation"}
                  </div>
                  <div style={{ fontSize:12, color:"#888", marginTop:10, lineHeight:1.7, fontWeight:500 }}>
                    Salary hike: <strong style={{ color:"#333" }}>{salaryNum}%</strong> · Personal inflation: <strong style={{ color:rateColor }}>{personalRate.toFixed(2)}%</strong> · Real raise: <strong style={{ color: salaryOk ? "#20BF6B" : "#FC5C65" }}>{realRaise > 0 ? "+" : ""}{realRaise.toFixed(2)}%</strong>
                    <br/>{salaryOk ? `You're ${realRaise.toFixed(2)}% ahead in real terms.` : `You effectively took a ${Math.abs(realRaise).toFixed(2)}% pay cut in real terms.`}
                  </div>
                </div>
              )}
            </div>
          </>)}

          {tab === 3 && (<>
            <div className="card">
              <div className="seg" style={{ marginBottom:18 }}>
                {([
                  ["goal",        "🎯 Goal Planner"],
                  ["emi",         "🏠 EMI Check"],
                  ["sip",         "📈 Investment Check"],
                  ["timemachine", "⏳ Time Machine"],
                ] as [ToolKey, string][]).map(([k, l]) => (
                  <button key={k} className={`seg-btn${activeTool === k ? " active" : ""}`} onClick={() => setActiveTool(k)}>{l}</button>
                ))}
              </div>

              {activeTool === "goal" && (<>
                <div className="card-title" style={{ color:"#764ba2" }}>🎯 Inflation-Adjusted Goal Planner</div>
                <div style={{ fontSize:12, color:"#888", marginBottom:18, fontWeight:500 }}>How much do you actually need to save, accounting for your personal inflation?</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:14, marginBottom:14 }}>
                  <div><div style={{ fontSize:11, color:"#764ba2", fontWeight:800, marginBottom:7, letterSpacing:1 }}>TARGET TODAY (₹)</div><input className="num-inp" type="number" placeholder="e.g. 5000000" value={goalAmount} onChange={e => setGoalAmount(e.target.value)}/></div>
                  <div><div style={{ fontSize:11, color:"#764ba2", fontWeight:800, marginBottom:7, letterSpacing:1 }}>YEARS TO GOAL</div><input className="num-inp" type="number" placeholder="e.g. 10" value={goalYears} onChange={e => setGoalYears(e.target.value)}/></div>
                </div>
                {goalAmt > 0 && goalYr > 0 && (
                  <div className="tool-result" style={{ background:"linear-gradient(135deg,#F8F4FF,#EDF4FF)", boxShadow:"0 4px 20px rgba(118,75,162,.15)" }}>
                    <div style={{ fontSize:13, fontWeight:800, color:"#764ba2", marginBottom:12 }}>Your Inflation-Adjusted Plan</div>
                    <div className="tool-row"><span className="tool-key">Goal in today's ₹</span><span className="tool-val">₹{fmt(goalAmt)}</span></div>
                    <div className="tool-row"><span className="tool-key">Inflation-adjusted goal in {goalYr}yr</span><span className="tool-val" style={{ color:"#FC5C65" }}>₹{fmt(inflationAdjustedGoal)}</span></div>
                    <div className="tool-row"><span className="tool-key">Extra needed due to inflation</span><span className="tool-val" style={{ color:"#F7B731" }}>₹{fmt(inflationAdjustedGoal - goalAmt)}</span></div>
                    <div className="tool-row"><span className="tool-key">Monthly savings needed</span><span className="tool-val" style={{ color:"#764ba2" }}>₹{fmt(monthlySavingsNeeded)}</span></div>
                    <div className="tool-row"><span className="tool-key">Your personal inflation rate</span><span className="tool-val">{personalRate.toFixed(2)}%</span></div>
                  </div>
                )}
              </>)}

              {activeTool === "emi" && (<>
                <div className="card-title" style={{ color:"#20BF6B" }}>🏠 EMI Reality Check</div>
                <div style={{ fontSize:12, color:"#888", marginBottom:18, fontWeight:500 }}>Inflation makes fixed EMIs cheaper over time in real terms. See by how much.</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:14, marginBottom:14 }}>
                  <div><div style={{ fontSize:11, color:"#20BF6B", fontWeight:800, marginBottom:7, letterSpacing:1 }}>MONTHLY EMI (₹)</div><input className="num-inp" type="number" placeholder="e.g. 25000" value={emiAmount} onChange={e => setEmiAmount(e.target.value)}/></div>
                  <div><div style={{ fontSize:11, color:"#20BF6B", fontWeight:800, marginBottom:7, letterSpacing:1 }}>LOAN TENURE (YEARS)</div><input className="num-inp" type="number" placeholder="e.g. 20" value={emiYears} onChange={e => setEmiYears(e.target.value)}/></div>
                </div>
                {emiAmt > 0 && emiYr > 0 && (
                  <div className="tool-result" style={{ background:"linear-gradient(135deg,#F0FFF7,#D4F5E5)", boxShadow:"0 4px 20px rgba(32,191,107,.15)" }}>
                    <div style={{ fontSize:13, fontWeight:800, color:"#20BF6B", marginBottom:12 }}>EMI Inflation Analysis</div>
                    <div className="tool-row"><span className="tool-key">Total EMI paid (nominal)</span><span className="tool-val">₹{fmt(totalEmiPaid)}</span></div>
                    <div className="tool-row"><span className="tool-key">Inflation benefit over tenure</span><span className="tool-val" style={{ color:"#20BF6B" }}>₹{fmt(Math.abs(emiInflationBenefit))}</span></div>
                    <div className="tool-row"><span className="tool-key">EMI in real terms by year {Math.round(emiYr)}</span><span className="tool-val" style={{ color:"#2D98DA" }}>₹{fmt(emiAmt / Math.pow(1 + personalRate/100, emiYr))}</span></div>
                    <div style={{ fontSize:11, color:"#20BF6B", marginTop:10, lineHeight:1.6, padding:"8px 0", fontWeight:600 }}>
                      💡 Your ₹{fmt(emiAmt)} EMI today will feel like only ₹{fmt(emiAmt / Math.pow(1 + personalRate/100, emiYr))} in {Math.round(emiYr)} years.
                    </div>
                  </div>
                )}
              </>)}

              {activeTool === "sip" && (<>
                <div className="card-title" style={{ color:"#2D98DA" }}>📈 Investment Sufficiency Checker</div>
                <div style={{ fontSize:12, color:"#888", marginBottom:18, fontWeight:500 }}>Is your SIP actually beating your personal inflation in real terms?</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:12, marginBottom:14 }}>
                  <div><div style={{ fontSize:11, color:"#2D98DA", fontWeight:800, marginBottom:7, letterSpacing:1 }}>MONTHLY SIP (₹)</div><input className="num-inp" type="number" placeholder="e.g. 10000" value={sipAmount} onChange={e => setSipAmount(e.target.value)}/></div>
                  <div><div style={{ fontSize:11, color:"#2D98DA", fontWeight:800, marginBottom:7, letterSpacing:1 }}>RETURN (%)</div><input className="num-inp" type="number" placeholder="e.g. 12" value={sipReturn} onChange={e => setSipReturn(e.target.value)}/></div>
                  <div><div style={{ fontSize:11, color:"#2D98DA", fontWeight:800, marginBottom:7, letterSpacing:1 }}>YEARS</div><input className="num-inp" type="number" placeholder="e.g. 15" value={sipYears} onChange={e => setSipYears(e.target.value)}/></div>
                </div>
                {sipAmt > 0 && sipRet > 0 && sipYr > 0 && (
                  <div className="tool-result" style={{ background: sipBeatsInflation ? "linear-gradient(135deg,#F0FFF7,#D4F5E5)" : "linear-gradient(135deg,#FFF0F1,#FFE8EA)", boxShadow:`0 4px 20px ${sipBeatsInflation ? "rgba(32,191,107,.15)" : "rgba(252,92,101,.15)"}` }}>
                    <div style={{ display:"flex", alignItems:"center", flexWrap:"wrap", gap:10, marginBottom:12 }}>
                      <div style={{ fontSize:13, fontWeight:800, color: sipBeatsInflation ? "#20BF6B" : "#FC5C65" }}>Investment Analysis</div>
                      <div style={{ fontSize:11, fontWeight:800, padding:"5px 14px", borderRadius:100, background: sipBeatsInflation ? "linear-gradient(135deg,#20BF6B,#26de81)" : "linear-gradient(135deg,#FC5C65,#FF4757)", color:"#fff", boxShadow:`0 3px 10px ${sipBeatsInflation ? "rgba(32,191,107,.35)" : "rgba(252,92,101,.35)"}` }}>
                        {sipBeatsInflation ? "✓ Beats inflation" : "✗ Doesn't beat inflation"}
                      </div>
                    </div>
                    <div className="tool-row"><span className="tool-key">Total invested</span><span className="tool-val">₹{fmt(sipAmt * sipYr * 12)}</span></div>
                    <div className="tool-row"><span className="tool-key">Nominal future value</span><span className="tool-val">₹{fmt(sipFV)}</span></div>
                    <div className="tool-row"><span className="tool-key">Real future value (inflation-adjusted)</span><span className="tool-val" style={{ color: sipBeatsInflation ? "#20BF6B" : "#FC5C65" }}>₹{fmt(sipRealFV)}</span></div>
                    <div className="tool-row"><span className="tool-key">Real return after inflation</span><span className="tool-val" style={{ color: sipBeatsInflation ? "#20BF6B" : "#FC5C65" }}>{(sipRet - personalRate).toFixed(2)}%</span></div>
                    <div className="tool-row"><span className="tool-key">Min return needed to beat inflation</span><span className="tool-val">{(personalRate + 0.5).toFixed(2)}%</span></div>
                  </div>
                )}
              </>)}

              {activeTool === "timemachine" && (
                <InflationTimeMachine personalRate={personalRate} total={total} fmt={fmt}/>
              )}

            </div>
          </>)}

        </div>
        <div className="footer">Data: World Bank / MoSPI · {cpiData.month} · Base: {cpiData.base} · Auto-updates on the 12th of each month</div>
      </div>
    </>
  );
}
