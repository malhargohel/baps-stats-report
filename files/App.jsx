import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchSubmissions, fmt, sumField, groupBy, downloadCSV } from "./data.js";
import { CATEGORIES, ALL_METRICS, getCategory, rowsForCategory } from "./categories.js";
import { Glyph } from "./Glyph.jsx";

/* ======================================================================
   Small presentational pieces
   ====================================================================== */

function StatTile({ label, value, unit, accent, big, delay = 0 }) {
  return (
    <div style={{
      background: "var(--paper-2)",
      border: "1px solid var(--stone-line)",
      borderRadius: "var(--radius-sm)",
      padding: big ? "26px 28px" : "18px 20px",
      animation: `riseIn .5s cubic-bezier(.2,.7,.3,1) both`,
      animationDelay: `${delay}ms`,
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: accent, opacity: .85 }} />
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".09em", color: "var(--ink-faint)", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: big ? 54 : 32, lineHeight: 1, color: "var(--ink)", letterSpacing: "-.02em" }}>
        {typeof value === "number" ? value.toLocaleString() : value}
        {unit && <span style={{ fontFamily: "Spline Sans Mono, monospace", fontSize: big ? 16 : 12, fontWeight: 500, color: "var(--ink-faint)", marginLeft: 6 }}>{unit}</span>}
      </div>
    </div>
  );
}

function Bars({ data, accent, valueLabel }) {
  if (!data.length) return <Empty small note="Nothing recorded in this range yet." />;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {data.map(({ label, value }, i) => (
        <div key={label} style={{ display: "grid", gridTemplateColumns: "minmax(96px,1.2fr) 3fr auto", gap: 14, alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--stone-line)" }}>
          <span style={{ fontSize: 13.5, color: "var(--ink-soft)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
          <div style={{ background: "var(--stone)", borderRadius: 6, height: 12, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 6, width: `${Math.max((value / max) * 100, 2)}%`,
              background: accent, transformOrigin: "left",
              animation: `growBar .7s cubic-bezier(.2,.7,.3,1) both`, animationDelay: `${i * 45}ms`,
            }} />
          </div>
          <span style={{ fontFamily: "Spline Sans Mono, monospace", fontSize: 13, fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap" }}>
            {value.toLocaleString()}<span style={{ color: "var(--ink-faint)", marginLeft: 4, fontWeight: 400 }}>{valueLabel}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function Panel({ title, action, children }) {
  return (
    <section style={{ background: "var(--paper-2)", border: "1px solid var(--stone-line)", borderRadius: "var(--radius)", padding: "22px 26px", boxShadow: "var(--shadow)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 19, color: "var(--ink)", letterSpacing: "-.01em" }}>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function ExportBtn({ onClick, accent }) {
  return (
    <button onClick={onClick} style={{
      padding: "7px 14px", borderRadius: 9, border: `1px solid var(--stone-line)`,
      background: "var(--paper)", color: "var(--ink-soft)", fontWeight: 600, fontSize: 12.5,
      cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
    }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--stone-line)"; e.currentTarget.style.color = "var(--ink-soft)"; }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0 0 4-4m-4 4-4-4" /><path d="M5 21h14" /></svg>
      Export CSV
    </button>
  );
}

function Empty({ note, small }) {
  return (
    <div style={{ textAlign: "center", padding: small ? "28px 16px" : "64px 24px", color: "var(--ink-faint)" }}>
      {!small && <div style={{ marginBottom: 14, display: "flex", justifyContent: "center", opacity: .5 }}><Glyph name="lotus" size={46} /></div>}
      <div style={{ fontSize: small ? 13.5 : 16, fontWeight: small ? 400 : 600, color: small ? "var(--ink-faint)" : "var(--ink-soft)" }}>{note}</div>
    </div>
  );
}

function Spinner({ accent }) {
  return <span style={{ display: "inline-block", width: 15, height: 15, borderRadius: "50%", border: `2px solid color-mix(in srgb, ${accent} 30%, transparent)`, borderTopColor: accent, animation: "spin .7s linear infinite", verticalAlign: "-2px" }} />;
}

/* ======================================================================
   Landing — choose a seva category
   ====================================================================== */

function Landing({ rows, loading, error, onPick, onRefresh, lastRefresh }) {
  const counts = useMemo(() => {
    const m = {};
    for (const c of CATEGORIES) m[c.id] = rowsForCategory(rows, c).length;
    return m;
  }, [rows]);

  const totalEvents = rows.length;
  const totalHours = sumField(rows, "volunteerHours");

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 24px 64px" }}>
      {/* hero */}
      <header style={{ paddingTop: 64, paddingBottom: 40, animation: "riseIn .6s ease both" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
          <span style={{ color: "var(--saffron-deep)", display: "inline-flex" }}><Glyph name="lotus" size={26} /></span>
          <span style={{ fontSize: 12.5, letterSpacing: ".22em", textTransform: "uppercase", fontWeight: 600, color: "var(--saffron-deep)" }}>BAPS Swaminarayan&nbsp;·&nbsp;Seva</span>
        </div>
        <h1 style={{ margin: 0, fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: "clamp(38px, 6vw, 62px)", lineHeight: 1.02, letterSpacing: "-.025em", color: "var(--ink)", maxWidth: 760 }}>
          What seva would you<br />like to look at?
        </h1>
        <p style={{ margin: "20px 0 0", fontSize: 17, lineHeight: 1.55, color: "var(--ink-soft)", maxWidth: 560 }}>
          Pick an activity below. You'll see only the numbers that matter for that kind of event — drawn live from the volunteer submission form.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 18, marginTop: 28 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 26, color: "var(--ink)" }}>{loading ? "—" : totalEvents.toLocaleString()}</span>
            <span style={{ fontSize: 13, color: "var(--ink-faint)" }}>events logged</span>
          </div>
          <span style={{ width: 1, height: 18, background: "var(--stone-line)" }} />
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 26, color: "var(--ink)" }}>{loading ? "—" : totalHours.toLocaleString()}</span>
            <span style={{ fontSize: 13, color: "var(--ink-faint)" }}>volunteer hours</span>
          </div>
          <span style={{ width: 1, height: 18, background: "var(--stone-line)" }} />
          <button onClick={onRefresh} disabled={loading} style={{
            border: "none", background: "none", cursor: loading ? "default" : "pointer",
            color: "var(--saffron-deep)", fontWeight: 600, fontSize: 13.5, display: "inline-flex", alignItems: "center", gap: 7, padding: 0,
          }}>
            {loading ? <Spinner accent="var(--saffron-deep)" /> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></svg>}
            {loading ? "Loading" : "Refresh data"}
          </button>
          {lastRefresh && !loading && <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>updated {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
        </div>
      </header>

      {error && (
        <div style={{ background: "#FBEAE7", border: "1px solid #E8B4AC", borderRadius: 12, padding: "13px 17px", color: "#9A2B1B", marginBottom: 26, fontSize: 13.5, display: "flex", gap: 10, alignItems: "center" }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>
          {error}
        </div>
      )}

      {/* category grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(248px, 1fr))", gap: 16 }}>
        {CATEGORIES.map((cat, i) => {
          const n = counts[cat.id] ?? 0;
          const disabled = !loading && n === 0 && cat.id !== "all";
          return (
            <button key={cat.id} onClick={() => !disabled && onPick(cat.id)} disabled={disabled}
              style={{
                textAlign: "left", cursor: disabled ? "default" : "pointer",
                background: cat.id === "all" ? "var(--ink)" : "var(--paper-2)",
                border: cat.id === "all" ? "1px solid var(--ink)" : "1px solid var(--stone-line)",
                borderRadius: "var(--radius)", padding: "24px 24px 20px", position: "relative",
                boxShadow: "var(--shadow)", opacity: disabled ? .5 : 1,
                transition: "transform .18s cubic-bezier(.2,.7,.3,1), box-shadow .18s ease, border-color .18s ease",
                animation: "riseIn .5s ease both", animationDelay: `${i * 55}ms`, overflow: "hidden",
              }}
              onMouseEnter={(e) => { if (disabled) return; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "var(--shadow-lg)"; e.currentTarget.style.borderColor = cat.accent; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "var(--shadow)"; e.currentTarget.style.borderColor = cat.id === "all" ? "var(--ink)" : "var(--stone-line)"; }}
            >
              <span aria-hidden style={{ position: "absolute", right: -18, top: -18, width: 110, height: 110, borderRadius: "50%", background: cat.accent, opacity: cat.id === "all" ? .22 : .08 }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, position: "relative" }}>
                <span style={{ color: cat.id === "all" ? "#fff" : cat.accent, display: "inline-flex", background: cat.id === "all" ? "rgba(255,255,255,.10)" : `color-mix(in srgb, ${cat.accent} 12%, transparent)`, padding: 11, borderRadius: 13 }}>
                  <Glyph name={cat.glyph} size={28} />
                </span>
                <span style={{
                  fontFamily: "Spline Sans Mono, monospace", fontSize: 12, fontWeight: 600,
                  color: cat.id === "all" ? "rgba(255,255,255,.65)" : "var(--ink-faint)",
                  background: cat.id === "all" ? "rgba(255,255,255,.10)" : "var(--stone)", padding: "3px 9px", borderRadius: 20,
                }}>
                  {loading ? "··" : disabled ? "none" : `${n} log${n === 1 ? "" : "s"}`}
                </span>
              </div>
              <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 22, letterSpacing: "-.01em", color: cat.id === "all" ? "#fff" : "var(--ink)", marginBottom: 6, position: "relative" }}>{cat.name}</div>
              <div style={{ fontSize: 13.5, lineHeight: 1.45, color: cat.id === "all" ? "rgba(255,255,255,.72)" : "var(--ink-soft)", marginBottom: 16, position: "relative", minHeight: 38 }}>{cat.tagline}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: cat.id === "all" ? "#fff" : cat.accent, position: "relative" }}>
                {disabled ? "No events yet" : "View report"}
                {!disabled && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>}
              </div>
            </button>
          );
        })}
      </div>

      <footer style={{ marginTop: 48, textAlign: "center", fontSize: 12.5, color: "var(--ink-faint)" }}>
        Live from the BAPS volunteer reporting form · {loading ? "syncing…" : `${totalEvents} submissions`}
      </footer>
    </div>
  );
}

/* ======================================================================
   Report — one seva category in focus
   ====================================================================== */

const SUB_VIEWS = [
  ["summary", "Summary"],
  ["centre", "By centre"],
  ["timeline", "Over time"],
  ["log", "Event log"],
];

function Report({ catId, allRows, loading, onBack, onRefresh, lastRefresh }) {
  const cat = getCategory(catId);
  const [view, setView] = useState("summary");
  const [centre, setCentre] = useState("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const scoped = useMemo(() => rowsForCategory(allRows, cat), [allRows, cat]);

  const filtered = useMemo(() => scoped.filter((r) => {
    if (centre !== "All" && r.centre !== centre) return false;
    if (from && (r.eventDate || "") < from) return false;
    if (to && (r.eventDate || "") > to) return false;
    return true;
  }), [scoped, centre, from, to]);

  const centres = useMemo(() => ["All", ...Array.from(new Set(scoped.map((r) => r.centre).filter(Boolean))).sort()], [scoped]);

  const byCentre = useMemo(() =>
    Object.entries(groupBy(filtered, "centre"))
      .map(([label, rs]) => ({ label, value: sumField(rs, cat.headlineMetric) }))
      .sort((a, b) => b.value - a.value), [filtered, cat]);

  const byMonth = useMemo(() =>
    Object.entries(filtered.reduce((acc, r) => {
      const m = (r.eventDate || "").slice(0, 7) || "Undated";
      acc[m] = (acc[m] || 0) + fmt(r[cat.headlineMetric]);
      return acc;
    }, {})).map(([label, value]) => ({ label, value })).sort((a, b) => a.label.localeCompare(b.label)), [filtered, cat]);

  const hasFilter = centre !== "All" || from || to;
  const headLabel = ALL_METRICS[cat.headlineMetric]?.label || "value";
  const headUnit = ALL_METRICS[cat.headlineMetric]?.unit || "";

  const sel = {
    padding: "8px 12px", borderRadius: 9, border: "1px solid var(--stone-line)",
    fontSize: 13, background: "var(--paper-2)", color: "var(--ink)", cursor: "pointer", fontFamily: "inherit",
  };

  const exportRows = (kind) => {
    if (kind === "centre") return downloadCSV(Object.entries(groupBy(filtered, "centre")).map(([c, rs]) => {
      const row = { centre: c, events: rs.length };
      cat.metrics.forEach((k) => { row[ALL_METRICS[k].label] = sumField(rs, k); });
      return row;
    }), `baps-${cat.id}-by-centre.csv`);
    if (kind === "timeline") return downloadCSV(byMonth.map((m) => ({ month: m.label, [headLabel]: m.value })), `baps-${cat.id}-timeline.csv`);
    return downloadCSV(filtered, `baps-${cat.id}-events.csv`);
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* report header band */}
      <div style={{ background: "var(--ink)", color: "#fff", position: "relative", overflow: "hidden" }}>
        <span aria-hidden style={{ position: "absolute", right: -60, top: -90, width: 320, height: 320, borderRadius: "50%", background: cat.accent, opacity: .26, filter: "blur(4px)" }} />
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "22px 28px 30px", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
            <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.10)", border: "1px solid rgba(255,255,255,.14)", color: "#fff", padding: "8px 15px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,.18)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,.10)"}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
              All seva
            </button>
            <button onClick={onRefresh} disabled={loading} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: cat.accent, border: "none", color: "#fff", padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: loading ? "default" : "pointer", opacity: loading ? .8 : 1 }}>
              {loading ? <Spinner accent="#fff" /> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></svg>}
              {loading ? "Loading" : "Refresh"}
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 22 }}>
            <span style={{ display: "inline-flex", color: "#fff", background: "rgba(255,255,255,.12)", padding: 14, borderRadius: 16, border: `1px solid color-mix(in srgb, ${cat.accent} 50%, transparent)` }}>
              <Glyph name={cat.glyph} size={32} />
            </span>
            <div>
              <h1 style={{ margin: 0, fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 34, letterSpacing: "-.02em" }}>{cat.name}</h1>
              <p style={{ margin: "4px 0 0", fontSize: 14, color: "rgba(255,255,255,.66)" }}>{cat.tagline}</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "26px 28px 64px" }}>
        {/* controls */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 24 }}>
          {/* sub-view tabs */}
          <div style={{ display: "inline-flex", gap: 3, background: "var(--stone)", padding: 4, borderRadius: 11 }}>
            {SUB_VIEWS.map(([id, lbl]) => (
              <button key={id} onClick={() => setView(id)} style={{
                padding: "7px 15px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
                background: view === id ? "var(--paper-2)" : "transparent",
                color: view === id ? "var(--ink)" : "var(--ink-soft)",
                boxShadow: view === id ? "0 1px 3px rgba(36,30,23,.12)" : "none", transition: "all .15s",
              }}>{lbl}</button>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          <select style={sel} value={centre} onChange={(e) => setCentre(e.target.value)}>
            {centres.map((c) => <option key={c} value={c}>{c === "All" ? "All centres" : c}</option>)}
          </select>
          <input type="date" style={sel} value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
          <span style={{ color: "var(--ink-faint)", fontSize: 13 }}>to</span>
          <input type="date" style={sel} value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
          {hasFilter && (
            <button onClick={() => { setCentre("All"); setFrom(""); setTo(""); }} style={{ ...sel, color: cat.accent, fontWeight: 600, borderColor: "transparent", background: "transparent" }}>Clear</button>
          )}
        </div>

        <div style={{ fontSize: 13, color: "var(--ink-faint)", marginBottom: 20 }}>
          Showing <strong style={{ color: "var(--ink-soft)" }}>{filtered.length}</strong> of {scoped.length} {cat.name.toLowerCase()} event{scoped.length === 1 ? "" : "s"}
          {hasFilter && " (filtered)"}
        </div>

        {loading && scoped.length === 0 ? (
          <Empty note="Fetching submissions…" />
        ) : filtered.length === 0 ? (
          <Empty note={hasFilter ? "No events match these filters. Try clearing them." : "No events of this type have been logged yet."} />
        ) : (
          <div key={view} style={{ animation: "fadeIn .35s ease both" }}>
            {/* SUMMARY */}
            {view === "summary" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <StatTile big label={headLabel + " — total"} value={sumField(filtered, cat.headlineMetric)} unit={headUnit} accent={cat.accent} />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))", gap: 14 }}>
                  <StatTile label="Events" value={filtered.length} accent={cat.accent} delay={40} />
                  {cat.metrics.map((k, i) => (
                    <StatTile key={k} label={ALL_METRICS[k].label} value={sumField(filtered, k)} unit={ALL_METRICS[k].unit} accent={cat.accent} delay={(i + 2) * 40} />
                  ))}
                </div>
              </div>
            )}

            {/* BY CENTRE */}
            {view === "centre" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <Panel title={`${headLabel} by centre`} action={<ExportBtn accent={cat.accent} onClick={() => exportRows("centre")} />}>
                  <Bars data={byCentre} accent={cat.accent} valueLabel={headUnit} />
                </Panel>
                <Panel title="Centre breakdown">
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead><tr style={{ borderBottom: "2px solid var(--stone-line)" }}>
                        <th style={th("left")}>Centre</th>
                        <th style={th("right")}>Events</th>
                        {cat.metrics.map((k) => <th key={k} style={th("right")}>{ALL_METRICS[k].label}</th>)}
                      </tr></thead>
                      <tbody>
                        {Object.entries(groupBy(filtered, "centre")).sort((a, b) => a[0].localeCompare(b[0])).map(([c, rs]) => (
                          <tr key={c} style={{ borderBottom: "1px solid var(--stone-line)" }}>
                            <td style={td("left", true)}>{c}</td>
                            <td style={td("right")}>{rs.length}</td>
                            {cat.metrics.map((k) => <td key={k} style={tdMono()}>{sumField(rs, k).toLocaleString()}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              </div>
            )}

            {/* TIMELINE */}
            {view === "timeline" && (
              <Panel title={`${headLabel} over time`} action={<ExportBtn accent={cat.accent} onClick={() => exportRows("timeline")} />}>
                <Bars data={byMonth} accent={cat.accent} valueLabel={headUnit} />
              </Panel>
            )}

            {/* EVENT LOG */}
            {view === "log" && (
              <Panel title={`Event log (${filtered.length})`} action={<ExportBtn accent={cat.accent} onClick={() => exportRows("log")} />}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead><tr style={{ borderBottom: "2px solid var(--stone-line)" }}>
                      <th style={th("left")}>Date</th>
                      <th style={th("left")}>Centre</th>
                      <th style={th("left")}>Type</th>
                      {cat.metrics.map((k) => <th key={k} style={th("right")}>{ALL_METRICS[k].label}</th>)}
                      <th style={th("left")}>Logged by</th>
                    </tr></thead>
                    <tbody>
                      {[...filtered].sort((a, b) => (b.eventDate || "").localeCompare(a.eventDate || "")).map((r, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid var(--stone-line)" }}>
                          <td style={td("left")}>{r.eventDate || "—"}</td>
                          <td style={td("left", true)}>{r.centre || "—"}</td>
                          <td style={td("left")}>{r.eventType || "—"}</td>
                          {cat.metrics.map((k) => <td key={k} style={tdMono()}>{fmt(r[k]).toLocaleString()}</td>)}
                          <td style={td("left")}>{r.submitterName || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            )}
          </div>
        )}

        {filtered.length > 0 && (
          <div style={{ marginTop: 22, display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => exportRows("log")} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, background: "var(--ink)", color: "#fff", border: "none", fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0 0 4-4m-4 4-4-4" /><path d="M5 21h14" /></svg>
              Export {cat.name.toLowerCase()} report
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const th = (align) => ({ padding: "10px 12px", textAlign: align, color: "var(--ink-faint)", fontWeight: 600, fontSize: 11.5, letterSpacing: ".05em", textTransform: "uppercase", whiteSpace: "nowrap" });
const td = (align, bold) => ({ padding: "10px 12px", textAlign: align, color: bold ? "var(--ink)" : "var(--ink-soft)", fontWeight: bold ? 600 : 400, whiteSpace: "nowrap" });
const tdMono = () => ({ padding: "10px 12px", textAlign: "right", fontFamily: "Spline Sans Mono, monospace", fontSize: 12.5, color: "var(--ink)" });

/* ======================================================================
   Root
   ====================================================================== */

export default function App() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [selected, setSelected] = useState(null); // category id or null = landing

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await fetchSubmissions();
      setRows(data); setLastRefresh(new Date());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && selected) setSelected(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  if (!selected) {
    return <Landing rows={rows} loading={loading} error={error} onPick={setSelected} onRefresh={load} lastRefresh={lastRefresh} />;
  }
  return <Report catId={selected} allRows={rows} loading={loading} onBack={() => setSelected(null)} onRefresh={load} lastRefresh={lastRefresh} />;
}
