import { useState } from "react";
import {
  Video, CheckCircle, Users, User, Shield, CreditCard, LogOut,
  Plus, Calendar, AlertCircle, X, Play, Layers, Zap, RefreshCw,
  Send, Film, Scissors, Eye, Tag, Check, ChevronRight, Link,
  Search, BarChart2, Inbox, Star, Globe, Clock, Bell, Settings
} from "lucide-react";

const F = `@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Figtree:wght@300;400;500;600&display=swap');`;

const C = {
  bg: "#07080f",
  sidebar: "#0b0d18",
  card: "#0f1221",
  cardHover: "#131627",
  faint: "#181c2d",
  border: "#1c2135",
  accent: "#7c3aed",
  accentBg: "rgba(124,58,237,0.12)",
  accentBorder: "rgba(124,58,237,0.3)",
  green: "#22c55e",
  greenBg: "rgba(34,197,94,0.1)",
  amber: "#f59e0b",
  amberBg: "rgba(245,158,11,0.1)",
  red: "#ef4444",
  redBg: "rgba(239,68,68,0.1)",
  blue: "#3b82f6",
  blueBg: "rgba(59,130,246,0.1)",
  purple: "#a855f7",
  purpleBg: "rgba(168,85,247,0.1)",
  text: "#dde4f0",
  muted: "#4e5a72",
  faintText: "#2a3145",
};

const STATUS = {
  awaiting_clip_approval:      { label: "Clip Approval",    color: C.amber,  bg: C.amberBg },
  awaiting_ideas:              { label: "Ideas Review",     color: C.blue,   bg: C.blueBg },
  awaiting_thumbnail_approval: { label: "Thumbnail Review", color: C.purple, bg: C.purpleBg },
  awaiting_final_approval:     { label: "Final Review",     color: C.amber,  bg: C.amberBg },
  scheduled:                   { label: "Scheduled",        color: C.green,  bg: C.greenBg },
  in_progress:                 { label: "In Progress",      color: C.blue,   bg: C.blueBg },
  pending:                     { label: "Pending",          color: C.muted,  bg: C.faint },
  needs_revision:              { label: "Needs Revision",   color: C.red,    bg: C.redBg },
  ready_to_schedule:           { label: "Ready",            color: C.green,  bg: C.greenBg },
};

const CLIENTS = [
  { id: "c1", name: "TechWithTim",     credits: 12, email: "tim@techwith.com" },
  { id: "c2", name: "GrowthHackers",  credits: 8,  email: "hello@growthhackers.com" },
  { id: "c3", name: "MindfulMoments", credits: 3,  email: "info@mindfulmoments.co" },
];

const BATCHES = [
  { id: "b1", client: "TechWithTim", status: "awaiting_clip_approval", date: "Apr 12", clips: [
    { id: "cl1", title: "Why 99% of Developers Fail at System Design", approved: null },
    { id: "cl2", title: "The Hidden Cost of Technical Debt",           approved: null },
    { id: "cl3", title: "5 Redis Patterns You Need to Know",           approved: null },
  ]},
  { id: "b2", client: "GrowthHackers", status: "awaiting_ideas", date: "Apr 10", ideas: [
    { id: "i1", title: "Cold Email Breakdown: 40% Reply Rate Strategy",        sel: false },
    { id: "i2", title: "Why Your LinkedIn Profile Kills Your Outreach",        sel: false },
    { id: "i3", title: "The 3-Touch Follow-Up That Books Meetings",            sel: false },
    { id: "i4", title: "From 0 to 10k Followers in 90 Days: Playbook",        sel: false },
  ]},
  { id: "b3", client: "TechWithTim", status: "awaiting_thumbnail_approval", date: "Apr 8",
    thumbnail: { text: "Why Redis is Faster Than You Think", title: "Redis Deep Dive: Speed Secrets Most Devs Miss" }},
  { id: "b4", client: "MindfulMoments", status: "awaiting_final_approval", date: "Apr 6",
    video: { title: "Morning Routine for Peak Focus", platform: "YouTube Shorts", duration: "0:58" }},
  { id: "b5", client: "GrowthHackers", status: "scheduled", date: "Apr 3",
    video: { title: "Cold Email Framework", platform: "Instagram Reels", scheduledFor: "Apr 20, 2:00 PM" }},
];

const EDITOR_TASKS = [
  { id: "e1", title: "Why Redis is Faster Than You Think", client: "TechWithTim",    type: "create", status: "in_progress",    due: "Apr 18", flags: 0 },
  { id: "e2", title: "Morning Routine for Peak Focus",     client: "MindfulMoments", type: "revise", status: "needs_revision", due: "Apr 17", flags: 2 },
  { id: "e3", title: "Cold Email Framework",               client: "GrowthHackers",  type: "create", status: "pending",        due: "Apr 20", flags: 0 },
];

const SMM_TASKS = [
  { id: "s1", type: "find_clips",    client: "TechWithTim",   title: "Raw footage: System Design talk (48 min)",       status: "pending" },
  { id: "s2", type: "research",      client: "GrowthHackers", title: "New batch — B2B SaaS Growth re-request",         status: "in_progress" },
  { id: "s3", type: "text_creation", client: "TechWithTim",   title: "Redis Deep Dive clip — needs thumbnail text",    status: "pending" },
  { id: "s4", type: "qa",            client: "MindfulMoments",title: "Morning Routine — editor submitted for QA",      status: "pending" },
  { id: "s5", type: "scheduling",    client: "GrowthHackers", title: "Cold Email Framework — client approved, schedule", status: "ready_to_schedule" },
];

// ─── UI ATOMS ─────────────────────────────────────────────────────────────────

function Pill({ status, sm }) {
  const s = STATUS[status] || { label: status, color: C.muted, bg: C.faint };
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}30`,
      padding: sm ? "2px 8px" : "3px 10px", borderRadius: 20,
      fontSize: sm ? 10 : 11, fontWeight: 600, letterSpacing: ".04em",
      textTransform: "uppercase", whiteSpace: "nowrap" }}>
      {s.label}
    </span>
  );
}

function Btn({ label, color, Icon, onClick, ghost }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "7px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600,
      cursor: "pointer", border: ghost ? `1px solid ${color}60` : "none",
      background: ghost ? "transparent" : color, color: ghost ? color : "#fff",
    }}>
      {Icon && <Icon size={13} />}{label}
    </button>
  );
}

function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
      padding: 18, cursor: onClick ? "pointer" : "default", ...style,
    }}>{children}</div>
  );
}

function Divider() { return <div style={{ height: 1, background: C.border, margin: "12px 0" }} />; }

function PageHeader({ title, sub, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
      <div>
        <h1 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, color: C.text, fontSize: 21, margin: 0, marginBottom: 4 }}>{title}</h1>
        {sub && <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── REJECTION MODAL ─────────────────────────────────────────────────────────

function RejectModal({ title, onClose, onSubmit, withTimestamp }) {
  const [reason, setReason] = useState("");
  const [ts, setTs] = useState("");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 999, backdropFilter: "blur(3px)" }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
        padding: 24, width: 400, boxShadow: "0 32px 64px rgba(0,0,0,.6)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, color: C.text, fontSize: 15 }}>Reject: {title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted }}><X size={18} /></button>
        </div>
        {withTimestamp && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".05em" }}>Timestamp (optional)</label>
            <input value={ts} onChange={e => setTs(e.target.value)} placeholder="e.g. 0:23, 1:45"
              style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7, padding: "8px 11px", color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>
        )}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".05em" }}>Reason</label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
            placeholder="What needs to change..."
            style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7, padding: "8px 11px", color: C.text, fontSize: 13, outline: "none", resize: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Btn label="Cancel" color={C.muted} ghost onClick={onClose} />
          <Btn label="Submit Rejection" color={C.red} onClick={() => onSubmit(reason, ts)} />
        </div>
      </div>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────

function LoginPage({ onLogin }) {
  const [sel, setSel] = useState(null);
  const [empType, setEmpType] = useState(null);

  const roles = [
    { key: "client",   label: "Client",   Icon: Star,   desc: "Manage your content pipeline and approve deliverables", color: C.purple },
    { key: "admin",    label: "Admin",    Icon: Shield,  desc: "Oversee operations, manage client credentials and deadlines", color: C.blue },
    { key: "employee", label: "Employee", Icon: Users,   desc: "Access your task queue as an Editor or Social Media Manager", color: C.green },
  ];

  const go = () => {
    if (sel === "employee") onLogin(empType, { name: empType === "editor" ? "Arnav" : "Priya", role: empType });
    else if (sel === "client") onLogin("client", { name: "TechWithTim", role: "client" });
    else onLogin("admin", { name: "Scale Brands Lab", role: "admin" });
  };

  const canProceed = sel && (sel !== "employee" || empType);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 8 }}>
          <div style={{ width: 34, height: 34, background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`,
            borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Film size={16} color="#fff" />
          </div>
          <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 20, color: C.text }}>Scale Brands Lab</span>
        </div>
        <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>studio.scalebrandslab.com</p>
      </div>

      <div style={{ width: "100%", maxWidth: 520 }}>
        <p style={{ color: C.muted, fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase",
          marginBottom: 14, textAlign: "center" }}>Select your role to continue</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {roles.map(r => (
            <div key={r.key} onClick={() => { setSel(r.key); if (r.key !== "employee") setEmpType(null); }}
              style={{ background: sel === r.key ? `${r.color}0d` : C.card,
                border: `1.5px solid ${sel === r.key ? r.color : C.border}`,
                borderRadius: 10, padding: "14px 18px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 14, transition: "border-color .15s" }}>
              <div style={{ width: 40, height: 40, background: sel === r.key ? `${r.color}22` : C.faint,
                borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <r.Icon size={18} color={sel === r.key ? r.color : C.muted} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: C.text, fontSize: 14, marginBottom: 2 }}>{r.label}</div>
                <div style={{ color: C.muted, fontSize: 12 }}>{r.desc}</div>
              </div>
              <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${sel === r.key ? r.color : C.border}`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {sel === r.key && <div style={{ width: 8, height: 8, borderRadius: "50%", background: r.color }} />}
              </div>
            </div>
          ))}
        </div>

        {sel === "employee" && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
            <p style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", margin: "0 0 10px" }}>Employee type</p>
            <div style={{ display: "flex", gap: 8 }}>
              {[["editor", "✂ Editor"], ["smm", "📱 Social Media Manager"]].map(([k, l]) => (
                <button key={k} onClick={() => setEmpType(k)} style={{
                  flex: 1, padding: "9px 12px", borderRadius: 7, fontSize: 13, fontWeight: 600,
                  cursor: "pointer", border: `1.5px solid ${empType === k ? C.green : C.border}`,
                  background: empType === k ? C.greenBg : "transparent", color: empType === k ? C.green : C.muted,
                }}>{l}</button>
              ))}
            </div>
          </div>
        )}

        <button onClick={go} disabled={!canProceed} style={{
          width: "100%", padding: 13, borderRadius: 10, border: "none",
          background: canProceed ? `linear-gradient(135deg, ${C.accent}, ${C.purple})` : C.faint,
          color: canProceed ? "#fff" : C.muted, fontSize: 14, fontWeight: 700,
          fontFamily: "Syne, sans-serif", cursor: canProceed ? "pointer" : "not-allowed", letterSpacing: ".02em",
        }}>Enter Studio →</button>
      </div>
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────

function Sidebar({ role, view, setView, user, onLogout }) {
  const NAV = {
    client:  [
      { k: "overview",      l: "Overview",           I: Layers },
      { k: "batches",       l: "My Batches",         I: Film },
      { k: "ideas",         l: "Batch Ideas",        I: Zap },
      { k: "thumbnails",    l: "Thumbnails & Titles", I: Tag },
      { k: "final_review",  l: "Final Review",       I: CheckCircle },
      { k: "our_work",      l: "Our Work",           I: Globe },
    ],
    admin:   [
      { k: "overview",     l: "Overview",        I: BarChart2 },
      { k: "processes",    l: "All Processes",   I: Layers },
      { k: "credentials",  l: "Credentials",     I: Shield },
    ],
    editor:  [
      { k: "tasks",       l: "My Tasks",      I: Inbox },
      { k: "qa_resolve",  l: "QA Revisions",  I: AlertCircle },
    ],
    smm:     [
      { k: "find_clips",    l: "Find Clips",      I: Scissors },
      { k: "research",      l: "Research Ideas",  I: Search },
      { k: "text_creation", l: "Text Creation",   I: Tag },
      { k: "qa",            l: "Video QA",        I: Eye },
      { k: "scheduling",    l: "Scheduling",      I: Calendar },
    ],
  };
  const items = NAV[role] || [];

  return (
    <div style={{ width: 216, background: C.sidebar, borderRight: `1px solid ${C.border}`,
      display: "flex", flexDirection: "column", minHeight: "100vh", flexShrink: 0 }}>
      <div style={{ padding: "18px 16px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`,
            borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Film size={12} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, color: C.text, fontSize: 12, lineHeight: 1 }}>Scale Brands</div>
            <div style={{ color: C.muted, fontSize: 10 }}>Studio</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ background: C.faint, borderRadius: 8, padding: "8px 10px", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 24, height: 24, background: C.accentBg, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <User size={12} color={C.accent} />
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div style={{ color: C.text, fontSize: 11, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</div>
            <div style={{ color: C.muted, fontSize: 10, textTransform: "capitalize" }}>{role}</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "8px 8px" }}>
        {items.map(item => {
          const active = view === item.k;
          return (
            <button key={item.k} onClick={() => setView(item.k)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 9,
              padding: "8px 9px", borderRadius: 7, marginBottom: 1,
              background: active ? C.accentBg : "transparent",
              border: active ? `1px solid ${C.accentBorder}` : "1px solid transparent",
              color: active ? C.accent : C.muted, cursor: "pointer",
              fontSize: 12, fontWeight: active ? 600 : 400, textAlign: "left",
            }}>
              <item.I size={14} />{item.l}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: "12px 8px", borderTop: `1px solid ${C.border}` }}>
        <button onClick={onLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 9,
          padding: "8px 9px", borderRadius: 7, background: "none", border: "none",
          color: C.muted, cursor: "pointer", fontSize: 12, textAlign: "left" }}>
          <LogOut size={14} />Sign out
        </button>
      </div>
    </div>
  );
}

// ─── CLIENT: OVERVIEW ────────────────────────────────────────────────────────

function ClientOverview({ setView }) {
  const pending = BATCHES.filter(b => b.client === "TechWithTim" && b.status !== "scheduled");
  return (
    <div>
      <PageHeader title="Good morning, Tim 👋" sub="Here is what needs your attention today." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Credits left", val: 12, color: C.accent, bg: C.accentBg, sub: "videos remaining" },
          { label: "Needs your action", val: pending.length, color: C.amber, bg: C.amberBg, sub: "items awaiting approval" },
          { label: "Published this month", val: 3, color: C.green, bg: C.greenBg, sub: "videos live" },
        ].map(s => (
          <Card key={s.label} style={{ border: `1px solid ${s.color}30` }}>
            <div style={{ color: C.muted, fontSize: 10, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 34, color: s.color, marginBottom: 2 }}>{s.val}</div>
            <div style={{ color: C.muted, fontSize: 11 }}>{s.sub}</div>
          </Card>
        ))}
      </div>

      <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: C.text, fontSize: 13, marginBottom: 12 }}>Action required</div>
      {pending.map(b => {
        const dest = { awaiting_clip_approval: "batches", awaiting_thumbnail_approval: "thumbnails", awaiting_final_approval: "final_review" }[b.status] || "ideas";
        return (
          <Card key={b.id} style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 14 }} onClick={() => setView(dest)}>
            <div style={{ width: 34, height: 34, background: C.faint, borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Film size={15} color={C.muted} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: C.text, fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Batch #{b.id} — {b.date}</div>
              <Pill status={b.status} sm />
            </div>
            <ChevronRight size={14} color={C.muted} />
          </Card>
        );
      })}
    </div>
  );
}

// ─── CLIENT: BATCHES ─────────────────────────────────────────────────────────

function ClientBatches() {
  const [clips, setClips] = useState(BATCHES[0].clips);
  const [modal, setModal] = useState(null);
  const [done, setDone] = useState(false);
  const allDecided = clips.every(c => c.approved !== null);

  return (
    <div>
      {modal && <RejectModal title="clip idea" onClose={() => setModal(null)}
        onSubmit={r => { setClips(p => p.map(c => c.id === modal ? { ...c, approved: false, reason: r } : c)); setModal(null); }} />}
      <PageHeader title="My Batches" sub="Review raw footage and approve clip ideas for production" />
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: C.text, fontSize: 14 }}>Batch #b1 — TechWithTim</div>
            <div style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>Raw footage uploaded · Apr 12</div>
          </div>
          <a href="#" style={{ display: "flex", alignItems: "center", gap: 5, color: C.accent, fontSize: 11, textDecoration: "none" }}>
            <Link size={11} />View footage
          </a>
        </div>
        <Divider />
        <div style={{ marginTop: 12 }}>
          <div style={{ color: C.muted, fontSize: 10, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 12 }}>Clip ideas — approve or reject each</div>
          {clips.map((clip, i) => (
            <div key={clip.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0",
              borderBottom: i < clips.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ width: 22, height: 22, background: clip.approved === true ? C.greenBg : clip.approved === false ? C.redBg : C.faint,
                borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {clip.approved === true ? <Check size={11} color={C.green} /> : clip.approved === false ? <X size={11} color={C.red} /> :
                  <span style={{ color: C.muted, fontSize: 9 }}>{i+1}</span>}
              </div>
              <span style={{ flex: 1, color: C.text, fontSize: 13 }}>{clip.title}</span>
              {clip.approved === null
                ? <div style={{ display: "flex", gap: 6 }}>
                    <Btn label="Approve" color={C.green} onClick={() => setClips(p => p.map(c => c.id === clip.id ? { ...c, approved: true } : c))} />
                    <Btn label="Reject" color={C.red} ghost onClick={() => setModal(clip.id)} />
                  </div>
                : <Pill status={clip.approved ? "scheduled" : "needs_revision"} sm />}
            </div>
          ))}
        </div>
        {allDecided && !done &&
          <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
            <Btn label="Submit decisions →" color={C.accent} onClick={() => setDone(true)} />
          </div>}
        {done && <div style={{ marginTop: 14, padding: "9px 13px", background: C.greenBg, borderRadius: 7, color: C.green, fontSize: 12 }}>
          Clip decisions submitted. SMM will proceed with approved clips.
        </div>}
      </Card>
    </div>
  );
}

// ─── CLIENT: IDEAS ───────────────────────────────────────────────────────────

function ClientIdeas() {
  const [ideas, setIdeas] = useState(BATCHES[1].ideas);
  const [modal, setModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const sel = ideas.filter(i => i.sel);

  return (
    <div>
      {modal && <RejectModal title="batch ideas" onClose={() => setModal(false)} onSubmit={() => setModal(false)} />}
      <PageHeader title="Batch Ideas" sub="Select the video ideas you want to move forward with" />
      <Card>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: C.text, fontSize: 14 }}>GrowthHackers — B2B SaaS batch</div>
          <div style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>8 ideas researched · Apr 10</div>
        </div>
        <Divider />
        <div style={{ marginTop: 12, marginBottom: 16 }}>
          {ideas.map((idea, i) => (
            <div key={idea.id} onClick={() => setIdeas(p => p.map(x => x.id === idea.id ? { ...x, sel: !x.sel } : x))}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 11px", borderRadius: 7,
                marginBottom: 5, cursor: "pointer", background: idea.sel ? `${C.accent}0d` : C.faint,
                border: `1px solid ${idea.sel ? C.accent + "50" : "transparent"}` }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${idea.sel ? C.accent : C.border}`,
                background: idea.sel ? C.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {idea.sel && <Check size={9} color="#fff" />}
              </div>
              <span style={{ flex: 1, color: C.text, fontSize: 12 }}>{idea.title}</span>
            </div>
          ))}
        </div>
        {!submitted
          ? <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Btn label="Request new ideas" color={C.amber} ghost Icon={RefreshCw} onClick={() => setModal(true)} />
              <Btn label={`Approve ${sel.length > 0 ? sel.length + " selected" : "all"} →`} color={C.green} onClick={() => setSubmitted(true)} />
            </div>
          : <div style={{ padding: "9px 13px", background: C.greenBg, borderRadius: 7, color: C.green, fontSize: 12 }}>
              Ideas approved! Proceed to filming raw footage for these topics.
            </div>}
      </Card>
    </div>
  );
}

// ─── CLIENT: THUMBNAILS ──────────────────────────────────────────────────────

function ClientThumbnails() {
  const [modal, setModal] = useState(false);
  const [approved, setApproved] = useState(false);
  const b = BATCHES[2];
  return (
    <div>
      {modal && <RejectModal title="thumbnail and title" onClose={() => setModal(false)} onSubmit={() => setModal(false)} />}
      <PageHeader title="Thumbnails & Titles" sub="Approve the copy before the editor starts creating assets" />
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: C.text, fontSize: 14 }}>Redis Deep Dive — TechWithTim</div>
            <div style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>Submitted by SMM · Apr 8</div>
          </div>
          <Pill status="awaiting_thumbnail_approval" />
        </div>
        <Divider />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "16px 0" }}>
          {[{ l: "Thumbnail text", v: b.thumbnail.text }, { l: "Video title", v: b.thumbnail.title }].map(f => (
            <div key={f.l} style={{ background: C.faint, borderRadius: 8, padding: 14 }}>
              <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>{f.l}</div>
              <div style={{ fontFamily: f.l === "Thumbnail text" ? "Syne, sans-serif" : "inherit",
                fontWeight: f.l === "Thumbnail text" ? 700 : 400, color: C.text, fontSize: f.l === "Thumbnail text" ? 15 : 13, lineHeight: 1.4 }}>{f.v}</div>
            </div>
          ))}
        </div>
        {!approved
          ? <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Btn label="Reject" color={C.red} ghost onClick={() => setModal(true)} />
              <Btn label="Approve for editing →" color={C.green} onClick={() => setApproved(true)} />
            </div>
          : <div style={{ padding: "9px 13px", background: C.greenBg, borderRadius: 7, color: C.green, fontSize: 12 }}>
              Approved! Editor will now create the thumbnail and edit the video.
            </div>}
      </Card>
    </div>
  );
}

// ─── CLIENT: FINAL REVIEW ────────────────────────────────────────────────────

function ClientFinalReview() {
  const [modal, setModal] = useState(false);
  const [approved, setApproved] = useState(false);
  return (
    <div>
      {modal && <RejectModal title="final video" withTimestamp onClose={() => setModal(false)} onSubmit={() => setModal(false)} />}
      <PageHeader title="Final Review" sub="Approve finished videos before they go live on your channels" />
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: C.text, fontSize: 14 }}>Morning Routine for Peak Focus</div>
            <div style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>MindfulMoments · YouTube Shorts · 0:58</div>
          </div>
          <Pill status="awaiting_final_approval" />
        </div>
        <Divider />
        <div style={{ background: C.faint, borderRadius: 9, height: 180, display: "flex", alignItems: "center",
          justifyContent: "center", margin: "14px 0 18px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 44, height: 44, background: C.accentBg, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
              <Play size={20} color={C.accent} />
            </div>
            <div style={{ color: C.muted, fontSize: 12 }}>Preview video</div>
          </div>
        </div>
        {!approved
          ? <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Btn label="Reject with QA flags" color={C.red} ghost onClick={() => setModal(true)} />
              <Btn label="Approve for upload →" color={C.green} onClick={() => setApproved(true)} />
            </div>
          : <div style={{ padding: "9px 13px", background: C.greenBg, borderRadius: 7, color: C.green, fontSize: 12 }}>
              Approved! SMM will schedule this video. 1 credit will be deducted.
            </div>}
      </Card>
    </div>
  );
}

// ─── CLIENT: OUR WORK ────────────────────────────────────────────────────────

function ClientOurWork() {
  const vids = [
    { title: "Cold Email Framework", platform: "Instagram Reels", date: "Apr 20, 2:00 PM", status: "scheduled" },
    { title: "Redis Deep Dive (upcoming)", platform: "YouTube Shorts", date: "Apr 25, 10:00 AM", status: "in_progress" },
  ];
  return (
    <div>
      <PageHeader title="Our Work" sub="Videos scheduled and going live on your channels" />
      {vids.map((v, i) => (
        <Card key={i} style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 34, height: 34, background: C.faint, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Video size={15} color={C.muted} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: C.text, fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{v.title}</div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ color: C.muted, fontSize: 11 }}>{v.platform}</span>
              <span style={{ color: C.faintText }}>·</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: C.muted, fontSize: 11 }}><Calendar size={10} />{v.date}</span>
            </div>
          </div>
          <Pill status={v.status} sm />
        </Card>
      ))}
    </div>
  );
}

// ─── ADMIN: OVERVIEW ─────────────────────────────────────────────────────────

function AdminOverview() {
  const stats = [
    { l: "With Clients",       v: 4, color: C.amber,  sub: "awaiting approvals" },
    { l: "With SMM",           v: 5, color: C.blue,   sub: "tasks in progress" },
    { l: "With Editor",        v: 3, color: C.purple, sub: "editing jobs active" },
    { l: "Active Clients",     v: 3, color: C.green,  sub: "billing this month" },
  ];
  return (
    <div>
      <PageHeader title="Admin Overview" sub="Real-time pipeline status across all clients" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        {stats.map(s => (
          <Card key={s.l}>
            <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>{s.l}</div>
            <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 32, color: s.color, marginBottom: 3 }}>{s.v}</div>
            <div style={{ color: C.muted, fontSize: 11 }}>{s.sub}</div>
          </Card>
        ))}
      </div>
      <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: C.text, fontSize: 13, marginBottom: 12 }}>All active batches</div>
      {BATCHES.map(b => (
        <Card key={b.id} style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: C.text, fontSize: 12, fontWeight: 500, marginBottom: 3 }}>{b.client} — Batch #{b.id}</div>
            <div style={{ color: C.muted, fontSize: 11 }}>{b.date}</div>
          </div>
          <Pill status={b.status} sm />
          <button style={{ background: C.faint, border: "none", borderRadius: 6, padding: "4px 10px", color: C.muted, fontSize: 10, cursor: "pointer" }}>
            Set deadline
          </button>
        </Card>
      ))}
    </div>
  );
}

// ─── ADMIN: CREDENTIALS ──────────────────────────────────────────────────────

function AdminCredentials() {
  const [showNew, setShowNew] = useState(false);
  const [toast, setToast] = useState(false);
  return (
    <div>
      <PageHeader title="Client Credentials"
        action={<Btn label="Add client" color={C.accent} Icon={Plus} onClick={() => setShowNew(!showNew)} />}
      />
      {showNew && (
        <Card style={{ marginBottom: 20, border: `1px solid ${C.accentBorder}` }}>
          <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: C.text, fontSize: 14, marginBottom: 14 }}>New client</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            {["Client name", "Email", "Login ID", "Password"].map(f => (
              <div key={f}>
                <label style={{ fontSize: 10, color: C.muted, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".05em" }}>{f}</label>
                <input placeholder={f} style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "7px 10px", color: C.text, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 10, color: C.muted, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".05em" }}>Initial credits</label>
            <input type="number" defaultValue={10} style={{ width: 110, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "7px 10px", color: C.text, fontSize: 12, outline: "none" }} />
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn label="Cancel" color={C.muted} ghost onClick={() => setShowNew(false)} />
            <Btn label="Create client" color={C.accent} onClick={() => { setShowNew(false); setToast(true); setTimeout(() => setToast(false), 3000); }} />
          </div>
        </Card>
      )}
      {toast && (
        <div style={{ marginBottom: 14, padding: "9px 13px", background: C.greenBg, borderRadius: 7, color: C.green, fontSize: 12 }}>
          Client created successfully. Login credentials have been set.
        </div>
      )}
      {CLIENTS.map(c => (
        <Card key={c.id} style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 36, height: 36, background: C.accentBg, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <User size={15} color={C.accent} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: C.text, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{c.name}</div>
            <div style={{ color: C.muted, fontSize: 11 }}>{c.email}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: C.text, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{c.credits} credits</div>
            <button style={{ background: C.accentBg, border: `1px solid ${C.accentBorder}`, borderRadius: 5,
              padding: "3px 8px", color: C.accent, fontSize: 10, cursor: "pointer", fontWeight: 600 }}>+ Add</button>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── EDITOR: TASKS ───────────────────────────────────────────────────────────

function EditorTasks() {
  return (
    <div>
      <PageHeader title="My Tasks" sub="Footage and clips assigned to you for editing" />
      {EDITOR_TASKS.map(t => (
        <Card key={t.id} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: C.text, fontSize: 14, marginBottom: 4 }}>{t.title}</div>
              <div style={{ color: C.muted, fontSize: 11 }}>{t.client} · Due {t.due}</div>
            </div>
            <Pill status={t.status} />
          </div>
          {t.flags > 0 && (
            <div style={{ background: C.redBg, border: `1px solid ${C.red}25`, borderRadius: 7,
              padding: "8px 11px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <AlertCircle size={13} color={C.red} />
              <span style={{ color: C.red, fontSize: 12 }}>{t.flags} QA flags need to be resolved before resubmission</span>
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            {t.type === "create"
              ? <Btn label="Mark complete — send to SMM QA" color={C.accent} Icon={Send} onClick={() => {}} />
              : <Btn label="View QA flags and resubmit" color={C.amber} Icon={Eye} onClick={() => {}} />}
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── SMM VIEWS ───────────────────────────────────────────────────────────────

function SMMFindClips() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <div>
      <PageHeader title="Find Clips" sub="Extract clip timestamps from raw long-form footage" />
      <Card>
        <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: C.text, fontSize: 14, marginBottom: 4 }}>System Design talk (48 min) — TechWithTim</div>
        <div style={{ color: C.muted, fontSize: 11, marginBottom: 14 }}>Received raw footage · Apr 14</div>
        <Divider />
        <div style={{ margin: "14px 0" }}>
          <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Identified clip windows</div>
          {[
            "0:00–2:30 — Why most devs skip system design entirely",
            "12:45–15:10 — The 3 scalability patterns that matter most",
            "28:00–31:20 — Case study: How Twitter handled viral traffic",
          ].map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
              borderBottom: i < 2 ? `1px solid ${C.border}` : "none" }}>
              <Scissors size={12} color={C.accent} />
              <span style={{ color: C.text, fontSize: 12 }}>{c}</span>
            </div>
          ))}
        </div>
        {!submitted
          ? <Btn label="Raise clips for client approval →" color={C.accent} Icon={Send} onClick={() => setSubmitted(true)} />
          : <div style={{ padding: "9px 13px", background: C.greenBg, borderRadius: 7, color: C.green, fontSize: 12 }}>
              Clip ideas sent to client for approval.
            </div>}
      </Card>
    </div>
  );
}

function SMMResearch() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <div>
      <PageHeader title="Research Ideas" sub="Generate video ideas for client content batches" />
      <Card>
        <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: C.text, fontSize: 14, marginBottom: 4 }}>GrowthHackers — B2B SaaS Growth</div>
        <div style={{ display: "inline-block", background: C.amberBg, border: `1px solid ${C.amber}30`, borderRadius: 5, padding: "2px 8px", marginBottom: 14 }}>
          <span style={{ color: C.amber, fontSize: 10, fontWeight: 600 }}>RE-REQUEST</span>
        </div>
        <div style={{ color: C.muted, fontSize: 12, marginBottom: 14 }}>Client wants more aggressive growth hacking angles.</div>
        <Divider />
        <div style={{ background: C.faint, borderRadius: 8, padding: 14, margin: "14px 0" }}>
          <div style={{ color: C.muted, fontSize: 10, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>Research prompt used</div>
          <div style={{ color: C.text, fontSize: 12, lineHeight: 1.6, fontStyle: "italic" }}>
            "Generate 8 short-form video ideas for a B2B SaaS growth channel. Focus on counterintuitive strategies, high-engagement hooks, and founder-led content formats."
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          {[
            "Why I Fired My Best Sales Rep (and Revenue Went Up)",
            "The Cold Email I Sent That Got 45% Reply Rate",
            "Stop Doing Product Demos — Do This Instead",
            "We Almost Burned $80k on Ads. Here Is What Saved Us",
          ].map((idea, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px",
              background: C.faint, borderRadius: 6, marginBottom: 5 }}>
              <Zap size={11} color={C.accent} />
              <span style={{ color: C.text, fontSize: 12 }}>{idea}</span>
            </div>
          ))}
        </div>
        {!submitted
          ? <Btn label="Submit ideas to client →" color={C.green} Icon={Send} onClick={() => setSubmitted(true)} />
          : <div style={{ padding: "9px 13px", background: C.greenBg, borderRadius: 7, color: C.green, fontSize: 12 }}>
              Ideas submitted to client for selection.
            </div>}
      </Card>
    </div>
  );
}

function SMMTextCreation() {
  const [thumbText, setThumbText] = useState("Why Redis is Faster Than You Think");
  const [vidTitle, setVidTitle] = useState("Redis Deep Dive: Speed Secrets Most Devs Miss");
  const [submitted, setSubmitted] = useState(false);
  return (
    <div>
      <PageHeader title="Text Creation" sub="Write thumbnail and video title copy for client approval" />
      <Card>
        <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: C.text, fontSize: 14, marginBottom: 14 }}>Redis Deep Dive — TechWithTim</div>
        {[{ l: "Thumbnail text", v: thumbText, s: setThumbText, rows: 2 }, { l: "Video title", v: vidTitle, s: setVidTitle, rows: 2 }].map(f => (
          <div key={f.l} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: ".05em", display: "block", marginBottom: 5 }}>{f.l}</label>
            <textarea rows={f.rows} value={f.v} onChange={e => f.s(e.target.value)}
              style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7,
                padding: "8px 11px", color: C.text, fontSize: 13, outline: "none", resize: "none", boxSizing: "border-box" }} />
          </div>
        ))}
        {!submitted
          ? <Btn label="Send for client approval →" color={C.accent} Icon={Send} onClick={() => setSubmitted(true)} />
          : <div style={{ padding: "9px 13px", background: C.accentBg, border: `1px solid ${C.accentBorder}`, borderRadius: 7, color: C.accent, fontSize: 12 }}>
              Sent to client for approval.
            </div>}
      </Card>
    </div>
  );
}

function SMMQa() {
  const [flags, setFlags] = useState([
    { id: "f1", ts: "0:14", note: "Logo watermark is too large, obscures content", resolved: false },
    { id: "f2", ts: "0:41", note: "Jump cut is too abrupt, needs a transition frame", resolved: false },
  ]);
  const [passed, setPassed] = useState(false);
  const allResolved = flags.every(f => f.resolved);

  return (
    <div>
      <PageHeader title="Video QA" sub="Review editor submissions before sending to client for approval" />
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: C.text, fontSize: 14 }}>Morning Routine for Peak Focus</div>
            <div style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>MindfulMoments · 0:58 · YouTube Shorts</div>
          </div>
        </div>
        <div style={{ background: C.faint, borderRadius: 8, height: 150, display: "flex", alignItems: "center",
          justifyContent: "center", marginBottom: 16 }}>
          <div style={{ textAlign: "center" }}>
            <Play size={22} color={C.accent} />
            <div style={{ color: C.muted, fontSize: 11, marginTop: 6 }}>Preview</div>
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>QA flags</div>
          {flags.map(f => (
            <div key={f.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 11px",
              background: f.resolved ? C.greenBg : C.redBg, borderRadius: 7, marginBottom: 6,
              border: `1px solid ${f.resolved ? C.green : C.red}25` }}>
              <AlertCircle size={13} color={f.resolved ? C.green : C.red} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1 }}>
                <span style={{ color: f.resolved ? C.green : C.red, fontSize: 12 }}>
                  <strong style={{ fontWeight: 600 }}>{f.ts}</strong> — {f.note}
                </span>
              </div>
              {!f.resolved && (
                <button onClick={() => setFlags(p => p.map(x => x.id === f.id ? { ...x, resolved: true } : x))}
                  style={{ background: "none", border: `1px solid ${C.red}40`, borderRadius: 5, padding: "2px 8px",
                    color: C.red, fontSize: 10, cursor: "pointer", flexShrink: 0 }}>Dismiss</button>
              )}
            </div>
          ))}
          <button onClick={() => setFlags(p => [...p, { id: `f${Date.now()}`, ts: "", note: "New flag", resolved: false }])}
            style={{ background: "none", border: `1px dashed ${C.border}`, borderRadius: 7, padding: "7px 12px",
              color: C.muted, fontSize: 12, cursor: "pointer", width: "100%", marginTop: 4 }}>
            + Add flag
          </button>
        </div>
        {!passed ? (
          <div style={{ display: "flex", gap: 8 }}>
            <Btn label="Send flags to editor" color={C.red} ghost Icon={Send} onClick={() => {}} />
            <Btn label={`${allResolved ? "Pass QA" : "Override and pass"} — send to client`} color={C.green} onClick={() => setPassed(true)} />
          </div>
        ) : (
          <div style={{ padding: "9px 13px", background: C.greenBg, borderRadius: 7, color: C.green, fontSize: 12 }}>
            Video passed QA. Sent to client for final approval.
          </div>
        )}
      </Card>
    </div>
  );
}

function SMMScheduling() {
  const [scheduled, setScheduled] = useState(false);
  return (
    <div>
      <PageHeader title="Scheduling" sub="Schedule approved videos and deduct client credits" />
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: C.text, fontSize: 14 }}>Cold Email Framework</div>
            <div style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>GrowthHackers · Instagram Reels · Client approved</div>
          </div>
          <Pill status="ready_to_schedule" />
        </div>
        <Divider />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "14px 0" }}>
          <div>
            <label style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: ".05em", display: "block", marginBottom: 5 }}>Platform</label>
            <select defaultValue="Instagram Reels" style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7, padding: "8px 10px", color: C.text, fontSize: 12, outline: "none" }}>
              {["Instagram Reels", "YouTube Shorts", "TikTok", "Facebook"].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: ".05em", display: "block", marginBottom: 5 }}>Date and time</label>
            <input type="datetime-local" style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7, padding: "7px 10px", color: C.text, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <label style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: ".05em", display: "block", marginBottom: 5 }}>Post link (optional)</label>
            <input placeholder="https://..." style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7, padding: "8px 10px", color: C.text, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>
        <div style={{ background: C.amberBg, border: `1px solid ${C.amber}30`, borderRadius: 7,
          padding: "8px 11px", marginBottom: 16, display: "flex", gap: 8, alignItems: "center" }}>
          <AlertCircle size={13} color={C.amber} style={{ flexShrink: 0 }} />
          <span style={{ color: C.amber, fontSize: 12 }}>This will deduct 1 credit from GrowthHackers (8 → 7 remaining)</span>
        </div>
        {!scheduled
          ? <Btn label="Confirm schedule and deduct credit" color={C.accent} Icon={Calendar} onClick={() => setScheduled(true)} />
          : <div style={{ padding: "9px 13px", background: C.greenBg, borderRadius: 7, color: C.green, fontSize: 12 }}>
              Scheduled successfully. Credit deducted. Client has been notified.
            </div>}
      </Card>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

function MainApp({ role, view, setView, user, onLogout }) {
  const render = () => {
    if (role === "client") {
      const map = { overview: ClientOverview, batches: ClientBatches, ideas: ClientIdeas,
        thumbnails: ClientThumbnails, final_review: ClientFinalReview, our_work: ClientOurWork };
      const Comp = map[view] || ClientOverview;
      return <Comp setView={setView} />;
    }
    if (role === "admin") {
      if (view === "credentials") return <AdminCredentials />;
      return <AdminOverview />;
    }
    if (role === "editor") return <EditorTasks />;
    if (role === "smm") {
      const map = { find_clips: SMMFindClips, research: SMMResearch, text_creation: SMMTextCreation, qa: SMMQa, scheduling: SMMScheduling };
      const Comp = map[view] || SMMFindClips;
      return <Comp />;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg }}>
      <Sidebar role={role} view={view} setView={setView} user={user} onLogout={onLogout} />
      <main style={{ flex: 1, padding: "28px 30px", overflowY: "auto", maxHeight: "100vh" }}>
        {render()}
      </main>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [auth, setAuth] = useState(null);
  const [view, setView] = useState("overview");

  return (
    <>
      <style>{F}</style>
      {!auth
        ? <LoginPage onLogin={(role, user) => { setAuth({ role, user }); setView("overview"); }} />
        : <MainApp role={auth.role} view={view}
            setView={v => setView(v)} user={auth.user}
            onLogout={() => { setAuth(null); setView("overview"); }} />}
    </>
  );
}
