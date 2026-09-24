import { useMemo } from "react";
import { EMIRATES, TREND_SHAPE, effIdx, T, type Lang, type Scenario, type Season } from "./model";

const W = 960;
const H = 176;
const PAD = 30;

export default function Trend({ lang, season, scenario }: { lang: Lang; season: Season; scenario: Scenario }) {
  const t = T[lang];

  const { linePath, areaPath, modeledPath, pts, peak, end, X, Y } = useMemo(() => {
    // current national median index for the selected season + scenario
    const cur = Math.round(
      EMIRATES.map((e) => effIdx(e, season, scenario)).sort((a, b) => a - b).slice(2, 4).reduce((a, b) => a + b, 0) / 2
    );
    const scale = cur / 58; // rescale the annual shape around the live value
    const vals = TREND_SHAPE.map((v) => Math.min(96, Math.round(v * scale)));
    vals[11] = cur;
    const min = 34;
    const max = 96;
    const X = (i: number) => PAD + (i * (W - 2 * PAD)) / 11;
    const Y = (v: number) => H - 26 - ((v - min) / (max - min)) * (H - 52);
    let d = `M${X(0)} ${Y(vals[0])}`;
    vals.forEach((v, i) => {
      if (i) d += ` L${X(i)} ${Y(v)}`;
    });
    const area = `${d} L${X(11)} ${H - 10} L${X(0)} ${H - 10} Z`;
    // modeled projection: same shape, gently smoothed and lifted (illustrative RF/OLS)
    const modeled = vals.map((v, i) => Math.round((v + (vals[Math.max(0, i - 1)] + vals[Math.min(11, i + 1)]) / 2) / 2 * 1.02));
    let m = `M${X(0)} ${Y(modeled[0])}`;
    modeled.forEach((v, i) => {
      if (i) m += ` L${X(i)} ${Y(v)}`;
    });
    const pk = vals.indexOf(Math.max(...vals));
    return { linePath: d, areaPath: area, modeledPath: m, pts: vals, peak: { i: pk, v: vals[pk] }, end: { i: 11, v: vals[11] }, X, Y };
  }, [season, scenario]);

  return (
    <svg className="spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c62828" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#c62828" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {[50, 70, 90].map((gv) => (
        <g key={gv}>
          <line className="gridline" x1={PAD} y1={Y(gv)} x2={W - PAD} y2={Y(gv)} />
          <text className="axis" x={6} y={Y(gv) - 3}>
            {gv}
          </text>
        </g>
      ))}
      <path className="trend-area" d={areaPath} />
      <path className="trend-modeled" d={modeledPath} />
      <path className="trend-line" d={linePath} />
      <circle cx={X(peak.i)} cy={Y(peak.v)} r={3.6} fill="#9e1515" />
      <text className="peak" x={X(peak.i)} y={Y(peak.v) - 9} textAnchor="middle">
        {t.seasonName.winter}
      </text>
      <circle className="trend-end" cx={X(end.i)} cy={Y(end.v)} r={5} />
      {t.months.map((m, i) =>
        i % 2 === 0 ? (
          <text key={m + i} className="axis" x={X(i)} y={H - 6} textAnchor="middle">
            {m}
          </text>
        ) : null
      )}
      {pts.map((v, i) => (
        <circle key={i} cx={X(i)} cy={Y(v)} r={1.6} fill="#c62828" opacity={0.55} />
      ))}
    </svg>
  );
}
