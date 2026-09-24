// Two compact, professional chart blocks for the supporting panel:
//  SignalShare: a 100%-share stacked bar + legend (composition of presentations)
//  AgeColumns: a vertical column chart (distribution across age bands)
// Plain HTML/CSS so they scale responsively with no charting library.
import { AGE_BANDS, SIGNALS, T, type Lang, type SignalKey } from "./model";

// warm sequential red→amber ramp, ordered most→least common
const SIGNAL_COLORS: Record<SignalKey, string> = {
  asthma: "#9e1b23",
  uri: "#c62828",
  bronch: "#e35d4a",
  rhin: "#f0945f",
  pneu: "#f6c48a",
};

export function SignalShare({ lang }: { lang: Lang }) {
  const t = T[lang];
  const total = SIGNALS.reduce((a, s) => a + s.v, 0);
  return (
    <div className="sig-chart">
      <div className="sig-bar" role="img" aria-label={t.sigTitle}>
        {SIGNALS.map((s) => (
          <span key={s.k} className="sig-seg" style={{ flexGrow: s.v, background: SIGNAL_COLORS[s.k] }} title={`${t.sig[s.k]} ${s.v}%`}>
            {s.v / total >= 0.12 ? `${s.v}%` : ""}
          </span>
        ))}
      </div>
      <ul className="sig-legend">
        {SIGNALS.map((s) => (
          <li key={s.k}>
            <span className="sig-dot" style={{ background: SIGNAL_COLORS[s.k] }} />
            <span className="sig-nm">{t.sig[s.k]}</span>
            <span className="sig-pct tnum">{s.v}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AgeColumns({ lang }: { lang: Lang }) {
  const t = T[lang];
  const max = Math.max(...AGE_BANDS.map((a) => a.v));
  return (
    <div className="age-chart" role="img" aria-label={t.ageTitle}>
      {AGE_BANDS.map((a) => (
        <div className="age-col" key={a.k}>
          <span className="age-val tnum">{a.v}%</span>
          <div className="age-track">
            <div className={"age-bar" + (a.v === max ? " top" : "")} style={{ height: `${(a.v / max) * 100}%` }} />
          </div>
          <span className="age-lbl">{t.age[a.k]}</span>
        </div>
      ))}
    </div>
  );
}
