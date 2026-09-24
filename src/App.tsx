import { useEffect, useMemo, useState } from "react";
import Map from "./Map";
import Trend from "./Trend";
import { SignalShare, AgeColumns } from "./Charts";
import {
  EMIRATES,
  SCENARIOS,
  SEASON_ORDER,
  SIGNALS,
  T,
  TIERS,
  covOf,
  effIdx,
  effVol,
  localeNum,
  predIdx,
  scenarioByKey,
  tierColor,
  tierText,
  tierOf,
  type Lang,
  type ScenarioKey,
  type Season,
} from "./model";

function Logo() {
  return (
    <svg viewBox="0 0 26 20" fill="none" aria-hidden="true">
      <path d="M1 10 h3 l2 -7 l3 15 l3 -12 l2 8 l2 -4 h6" stroke="#c62828" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function App() {
  const [lang, setLang] = useState<Lang>("en");
  const [season, setSeason] = useState<Season>("autumn");
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>("baseline");
  const [focus, setFocus] = useState<string>("all"); // "all" or emirate code

  const t = T[lang];
  const scenario = scenarioByKey(scenarioKey);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const rows = useMemo(
    () =>
      EMIRATES.map((e) => ({
        e,
        idx: Math.round(effIdx(e, season, scenario)),
        vol: effVol(e, season, scenario),
      })).sort((a, b) => b.idx - a.idx),
    [season, scenario]
  );

  const kpi = useMemo(() => {
    const totalVol = rows.reduce((a, r) => a + r.vol, 0);
    const sorted = rows.map((r) => r.idx).sort((a, b) => a - b);
    const median = Math.round((sorted[2] + sorted[3]) / 2);
    const elevated = rows.filter((r) => r.idx >= 56).length;
    return { totalVol, median, elevated };
  }, [rows]);

  // detail card: a single emirate when zoomed, else the national picture
  const detail = useMemo(() => {
    if (focus === "all") {
      const topSig = SIGNALS[0].k;
      return {
        name: t.national,
        idx: kpi.median,
        screened: kpi.totalVol,
        coverage: (kpi.totalVol / EMIRATES.reduce((a, e) => a + e.pop, 0)) * 1000,
        sig: t.sig[topSig],
        modeled: null as number | null,
      };
    }
    const e = EMIRATES.find((x) => x.code === focus)!;
    return {
      name: lang === "ar" ? e.ar : e.en,
      idx: Math.round(effIdx(e, season, scenario)),
      screened: effVol(e, season, scenario),
      coverage: covOf(e, season, scenario),
      sig: t.sig[e.sig],
      modeled: predIdx(e, season, scenario),
    };
  }, [focus, season, scenario, lang, kpi, t]);

  const detailTier = TIERS[tierOf(detail.idx)].key;

  return (
    <>
      <header className="topbar">
        <div className="topbar-in">
          <div className="brand">
            <div className="brandmark" aria-label="Virufy times EHS">
              <Logo />
              <span className="v">virufy</span>
              <span className="x">×</span>
              <span className="e">EHS</span>
            </div>
            <div className="rule" />
            <div>
              <h1>{t.title}</h1>
              <div className="sub">{t.subtitle}</div>
            </div>
          </div>
          <div className="grow" />
          <div className="tools">
            <span className="tag demo">{t.demo}</span>
            <div className="langtog" role="group" aria-label="Language">
              <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
              <button className={lang === "ar" ? "on" : ""} onClick={() => setLang("ar")}>ع</button>
            </div>
          </div>
        </div>
      </header>

      <div className="shell">
        <div className="disclaimer" role="note">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 2 2 21h20L12 2Z" stroke="#e0b23e" strokeWidth={1.8} strokeLinejoin="round" />
            <path d="M12 9v5" stroke="#e0b23e" strokeWidth={1.8} strokeLinecap="round" />
            <circle cx="12" cy="17.2" r="1.1" fill="#e0b23e" />
          </svg>
          <span><b>{t.discB}</b> {t.disc}</span>
        </div>

        {/* controls */}
        <section className="controls">
          <div className="ctrl">
            <label htmlFor="loc">{t.location}</label>
            <select id="loc" className="sel" value={focus} onChange={(e) => setFocus(e.target.value)}>
              <option value="all">{t.allEmirates}</option>
              {EMIRATES.map((e) => (
                <option key={e.code} value={e.code}>{lang === "ar" ? e.ar : e.en}</option>
              ))}
            </select>
          </div>

          <div className="ctrl">
            <label>{t.season}</label>
            <div className="seg" role="tablist" aria-label={t.season}>
              {SEASON_ORDER.map((s) => (
                <button key={s} role="tab" aria-selected={season === s} className={season === s ? "on" : ""} onClick={() => setSeason(s)}>
                  {t.seasonName[s]}
                </button>
              ))}
            </div>
          </div>

          <div className="ctrl grow-ctrl">
            <label>{t.scenario}</label>
            <div className="chips" role="tablist" aria-label={t.scenario}>
              {SCENARIOS.map((s) => (
                <button key={s.key} role="tab" aria-selected={scenarioKey === s.key} className={scenarioKey === s.key ? "on" : ""} onClick={() => setScenarioKey(s.key)}>
                  {t.scen[s.key]}
                </button>
              ))}
            </div>
          </div>

          <p className="ctrl-note">{t.seasonCap[season]} {scenarioKey !== "baseline" && `· ${t.scenNote[scenarioKey]}`}</p>
        </section>

        {/* KPIs */}
        <section className="kpis">
          <div className="kpi">
            <div className="klabel">{t.k1}</div>
            <div className="kval"><span className="n tnum">{localeNum(kpi.totalVol, lang)}</span></div>
            <div className="kmeta">{t.k1m}</div>
          </div>
          <div className="kpi tone-3">
            <div className="klabel">{t.k2}</div>
            <div className="kval"><span className="n tnum">{kpi.median}</span><span className="u">/ 100</span></div>
            <div className="kmeta">
              <span className="swatch" style={{ background: tierColor(kpi.median) }} />
              {t.tier[TIERS[tierOf(kpi.median)].key]} · {t.k2m}
            </div>
          </div>
          <div className="kpi tone-4">
            <div className="klabel">{t.k3}</div>
            <div className="kval"><span className="n tnum">{kpi.elevated}</span><span className="u">{t.k3u}</span></div>
            <div className="kmeta">{t.k3m}</div>
          </div>
        </section>

        {/* map + rail */}
        <section className="main">
          <div className="card mapcard">
            <div className="card-head">
              <div>
                <h2>{t.mapTitle}</h2>
                <div className="hint">{focus === "all" ? t.mapHintAll : t.mapHintOne(detail.name)}</div>
              </div>
              {focus !== "all" && (
                <button className="reset" onClick={() => setFocus("all")}>← {t.viewAll}</button>
              )}
            </div>
            <Map lang={lang} season={season} scenario={scenario} focus={focus} onFocus={setFocus} />
            <div className="maplegend">
              <div className="lg-grp">
                <span className="lg-h">{t.lgSeverity}</span>
                {TIERS.map((tr) => (
                  <span className="lg-item" key={tr.key}>
                    <span className="lg-dot" style={{ background: tr.c }} />{t.tier[tr.key]}
                  </span>
                ))}
              </div>
              <span className="lg-note">{t.positionsNote}</span>
            </div>
          </div>

          <aside className="rail">
            <div className="panel detail">
              <div className="eyebrow">{detail.name}</div>
              <div className="d-index">
                <span className="d-num tnum">{detail.idx}</span>
                <span className="d-slash">/ 100</span>
                <span className="d-tier" style={{ background: tierColor(detail.idx), color: tierText(detail.idx) }}>{t.tier[detailTier]}</span>
              </div>
              <div className="d-rows">
                <div className="d-row"><span>{t.dScreened}</span><b className="tnum">{localeNum(detail.screened, lang)}</b></div>
                <div className="d-row"><span>{t.dCoverage}</span><b className="tnum">{detail.coverage.toFixed(1)} {t.perThousand}</b></div>
                <div className="d-row"><span>{t.dSignal}</span><b>{detail.sig}</b></div>
                {detail.modeled !== null && (
                  <div className="d-row"><span>{t.dModeled}</span><b className="tnum muted">{detail.modeled} / 100</b></div>
                )}
              </div>
            </div>

            <div className="panel">
              <div className="eyebrow">{t.rankTitle}<span className="thin">{t.rankHint}</span></div>
              <ol className="rank">
                {rows.map((o, i) => (
                  <li key={o.e.code} className={"rrow" + (o.e.code === focus ? " sel" : "")} onClick={() => setFocus(o.e.code)}>
                    <div className="rrow-top">
                      <span className="rnum tnum">{i + 1}</span>
                      <span className="rnm">{lang === "ar" ? o.e.ar : o.e.en}</span>
                      <span className="rtierlbl" style={{ color: tierColor(o.idx) }}>{t.tier[TIERS[tierOf(o.idx)].key]}</span>
                      <span className="rval tnum">{o.idx}</span>
                    </div>
                    <span className="rtrack"><span className="rfill" style={{ width: `${o.idx}%`, background: tierColor(o.idx) }} /></span>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </section>

        {/* bottom: trend + signals/age */}
        <section className="bottom">
          <div className="card">
            <div className="card-head">
              <div>
                <h2>{t.trTitle}</h2>
                <div className="hint">{t.trHint}</div>
              </div>
              <div className="tr-key">
                <span><i className="k-obs" />{t.trActual}</span>
                <span><i className="k-mod" />{t.trModeled}</span>
              </div>
            </div>
            <div className="trendbody">
              <Trend lang={lang} season={season} scenario={scenario} />
            </div>
          </div>

          <div className="panel charts">
            <div className="chart-block">
              <div className="chart-head">
                <div className="eyebrow">{t.sigTitle}</div>
                <span className="chart-sub">{t.sigSub}</span>
              </div>
              <SignalShare lang={lang} />
            </div>
            <div className="chart-block">
              <div className="chart-head">
                <div className="eyebrow">{t.ageTitle}</div>
                <span className="chart-sub">{t.ageSub}</span>
              </div>
              <AgeColumns lang={lang} />
            </div>
          </div>
        </section>

        {/* explainer */}
        <section className="panel explain">
          <div className="explain-in">
            <div>
              <div className="eyebrow">{t.whatTitle}</div>
              <p className="whatp">{t.what}</p>
            </div>
            <div className="explain-app">
              <div className="mods">
                <span className="mod"><span className="d" />{t.mCough}</span>
                <span className="mod"><span className="d" />{t.mBreath}</span>
                <span className="mod"><span className="d" />{t.mVoice}</span>
              </div>
              <p className="modnote">{t.appNote}</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
