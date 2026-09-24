import { useMemo, useRef, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import type { FeatureCollection, Feature } from "geojson";
import rawGeo from "./uae_adm1.json";
import {
  EMIRATES,
  T,
  TIERS,
  emById,
  effIdx,
  effVol,
  covOf,
  tierColor,
  tierText,
  tierOf,
  localeNum,
  type Emirate,
  type Lang,
  type Scenario,
  type Season,
} from "./model";

const GEO = rawGeo as unknown as FeatureCollection;
const W = 960;
const H = 560;

const byGeoName = new Map(EMIRATES.map((e) => [e.geoName, e]));

// Crowded northern emirates → leader-line callouts stacked down the eastern side.
const CALLOUTS: { code: string; y: number }[] = [
  { code: "UAQ", y: 92 },
  { code: "RAK", y: 148 },
  { code: "FUJ", y: 204 },
  { code: "AJM", y: 260 },
  { code: "SHJ", y: 316 },
];

// node radius from screening volume (sqrt scale keeps small emirates legible)
const rOf = (vol: number) => Math.max(6, 5 + (Math.sqrt(vol) - 18) * 0.4);

interface Props {
  lang: Lang;
  season: Season;
  scenario: Scenario;
  focus: string; // "all" or an emirate code
  onFocus: (code: string) => void;
}

export default function UAEMap({ lang, season, scenario, focus, onFocus }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ e: Emirate; x: number; y: number } | null>(null);
  const t = T[lang];
  const zoomed = focus !== "all";

  const { path, features, centroids } = useMemo(() => {
    const target: any = zoomed
      ? GEO.features.find((f) => (f.properties as any)?.shapeName === emById.get(focus)?.geoName) ?? GEO
      : GEO;
    const pad = zoomed ? 90 : 22;
    const projection = geoMercator().fitExtent(
      [
        [zoomed ? pad : 140, pad],
        [W - pad, H - pad],
      ],
      target
    );
    const path = geoPath(projection);
    const centroids = new Map<string, [number, number]>();
    for (const f of GEO.features) {
      const name = (f.properties as any)?.shapeName as string;
      centroids.set(name, path.centroid(f as Feature) as [number, number]);
    }
    return { path, features: GEO.features, centroids };
  }, [focus, zoomed]);

  const cOf = (code: string) => centroids.get(emById.get(code)!.geoName);

  function move(e: Emirate, ev: React.MouseEvent) {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    let x = ev.clientX - r.left + 14;
    const y = ev.clientY - r.top + 12;
    if (x > r.width - 220) x = r.width - 220;
    setHover({ e, x, y: Math.max(6, y - 8) });
  }

  const dim = (e: Emirate) => zoomed && e.code !== focus;

  return (
    <div className="mapwrap" ref={wrapRef}>
      <svg className="map" viewBox={`0 0 ${W} ${H}`} role="img"
        aria-label="Map of the United Arab Emirates showing simulated pediatric respiratory screening by emirate">
        <defs>
          {TIERS.map((tr) => (
            <radialGradient id={`g-${tr.key}`} key={tr.key}>
              <stop offset="0%" stopColor={tr.c} stopOpacity="0.42" />
              <stop offset="100%" stopColor={tr.c} stopOpacity="0" />
            </radialGradient>
          ))}
        </defs>

        {/* landmass */}
        <g>
          {features.map((f) => {
            const name = (f.properties as any)?.shapeName as string;
            const em = byGeoName.get(name);
            const d = path(f as Feature) || undefined;
            const sel = em?.code === focus;
            const faded = em ? dim(em) : false;
            return (
              <path
                key={name}
                className={"land" + (sel ? " sel" : "") + (faded ? " faded" : "")}
                d={d}
                tabIndex={em ? 0 : -1}
                role={em ? "button" : undefined}
                aria-label={em ? `${lang === "ar" ? em.ar : em.en}` : undefined}
                onMouseEnter={(ev) => em && move(em, ev)}
                onMouseMove={(ev) => em && move(em, ev)}
                onMouseLeave={() => setHover(null)}
                onClick={() => em && onFocus(em.code)}
                onKeyDown={(ev) => {
                  if (em && (ev.key === "Enter" || ev.key === " ")) {
                    ev.preventDefault();
                    onFocus(em.code);
                  }
                }}
              />
            );
          })}
        </g>

        {/* nodes */}
        <g>
          {EMIRATES.map((e) => {
            const c = cOf(e.code);
            if (!c) return null;
            const idx = effIdx(e, season, scenario);
            const r = zoomed ? 15 : rOf(effVol(e, season, scenario));
            const col = tierColor(idx);
            const faded = dim(e);
            const showVal = zoomed ? e.code === focus : e.code === "AUH" || e.code === "DXB";
            return (
              <g key={"n-" + e.code} opacity={faded ? 0.25 : 1} style={{ cursor: "pointer" }}
                onMouseEnter={(ev) => move(e, ev)} onMouseMove={(ev) => move(e, ev)}
                onMouseLeave={() => setHover(null)} onClick={() => onFocus(e.code)}>
                <circle cx={c[0]} cy={c[1]} r={r + 7} fill={`url(#g-${TIERS[tierOf(idx)].key})`} />
                <circle className={"dot" + (e.code === focus ? " sel" : "")} cx={c[0]} cy={c[1]} r={r} fill={col} />
                {showVal && (
                  <text className="nodeval" x={c[0]} y={c[1] + 4} textAnchor="middle" style={{ fill: tierText(idx) }}>
                    {Math.round(idx)}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* labels */}
        <g pointerEvents="none">
          {zoomed
            ? (() => {
                const em = emById.get(focus)!;
                const c = cOf(focus);
                if (!c) return null;
                return (
                  <text className="emlabel big" x={c[0]} y={c[1] + 40} textAnchor="middle">
                    {lang === "ar" ? em.ar : em.en}
                  </text>
                );
              })()
            : (["AUH", "DXB"] as const).map((code) => {
                const em = emById.get(code)!;
                const c = cOf(code);
                if (!c) return null;
                const r = rOf(effVol(em, season, scenario));
                return (
                  <text key={"lb-" + code} className="emlabel" x={c[0]} y={c[1] + r + 15} textAnchor="middle">
                    {lang === "ar" ? em.ar : em.en}
                  </text>
                );
              })}
        </g>

        {/* leader-line callouts for the crowded north (all-emirates view only) */}
        {!zoomed && (
          <g>
            {CALLOUTS.map(({ code, y }) => {
              const em = emById.get(code)!;
              const c = cOf(code);
              if (!c) return null;
              const idx = effIdx(em, season, scenario);
              const faded = dim(em);
              const lx = 800;
              return (
                <g key={"o-" + code} onClick={() => onFocus(em.code)}
                  onMouseEnter={(ev) => move(em, ev)} onMouseLeave={() => setHover(null)}
                  style={{ cursor: "pointer" }} opacity={faded ? 0.4 : 1}>
                  <line className="leader" x1={c[0]} y1={c[1]} x2={lx} y2={y} />
                  <rect className="chip-r" x={lx} y={y - 12} width={148} height={24} rx={6} />
                  <circle cx={lx + 13} cy={y} r={5} fill={tierColor(idx)} />
                  <text x={lx + 24} y={y + 4} className="callout-nm">{lang === "ar" ? em.ar : em.en}</text>
                  <text x={lx + 140} y={y + 4} className="callout-val" textAnchor="end">{Math.round(idx)}</text>
                </g>
              );
            })}
          </g>
        )}
      </svg>

      <div className={"tip" + (hover ? " on" : "")} style={hover ? { left: hover.x, top: hover.y } : undefined}>
        {hover && (
          <>
            <div className="n">
              {lang === "ar" ? hover.e.ar : hover.e.en}
              <span className="tier-pill" style={{ background: tierColor(effIdx(hover.e, season, scenario)), color: tierText(effIdx(hover.e, season, scenario)) }}>
                {t.tier[TIERS[tierOf(effIdx(hover.e, season, scenario))].key]}
              </span>
            </div>
            <div className="r"><span>{t.dIndex}</span><b>{Math.round(effIdx(hover.e, season, scenario))}/100</b></div>
            <div className="r"><span>{t.dScreened}</span><b>{localeNum(effVol(hover.e, season, scenario), lang)}</b></div>
            <div className="r"><span>{t.dCoverage}</span><b>{covOf(hover.e, season, scenario).toFixed(1)} {t.perThousand}</b></div>
            <div className="r"><span>{t.dSignal}</span><b>{t.sig[hover.e.sig]}</b></div>
          </>
        )}
      </div>
    </div>
  );
}
