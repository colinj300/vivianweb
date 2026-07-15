"use client";

import { useEffect, useMemo, useState } from "react";
import { geoAlbersUsa, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import { FIPS_TO_CODE, STATE_NAMES } from "@/lib/usStates";

const W = 960;
const H = 600;

// A soft US map with a rose dot on every state that's had an order — bigger
// and bolder the more orders. `counts` is { CA: 3, NY: 1, ... }.
export default function UsDotMap({ counts = {} }) {
  const [topo, setTopo] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch("/us-states-10m.json")
      .then((r) => r.json())
      .then((t) => alive && setTopo(t))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const { paths, dots } = useMemo(() => {
    if (!topo) return { paths: [], dots: [] };
    const fc = feature(topo, topo.objects.states);
    const projection = geoAlbersUsa().fitSize([W, H], fc);
    const path = geoPath(projection);
    const max = Math.max(1, ...Object.values(counts));

    const paths = fc.features.map((f) => ({ id: f.id, d: path(f) }));

    const dots = [];
    for (const f of fc.features) {
      const code = FIPS_TO_CODE[f.id];
      const n = code ? counts[code] || 0 : 0;
      if (!n) continue;
      const c = path.centroid(f);
      if (!c || Number.isNaN(c[0])) continue;
      // area-proportional radius so 4 orders reads as ~2× a single order
      const r = 10 + 26 * Math.sqrt(n / max);
      dots.push({ code, n, x: c[0], y: c[1], r });
    }
    // draw biggest first so small dots sit on top and stay legible
    dots.sort((a, b) => b.r - a.r);
    return { paths, dots };
  }, [topo, counts]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label="Map of the United States showing where orders have shipped"
    >
      {/* states */}
      {paths.map((p) => (
        <path key={p.id} d={p.d} fill="#efeafb" stroke="#ddd6f2" strokeWidth={1} />
      ))}
      {/* order dots */}
      {dots.map((d) => (
        <g key={d.code}>
          <title>{`${STATE_NAMES[d.code]}: ${d.n} order${d.n === 1 ? "" : "s"}`}</title>
          <circle cx={d.x} cy={d.y} r={d.r} fill="#8c64bd" fillOpacity={0.4} />
          <circle cx={d.x} cy={d.y} r={Math.max(4, d.r * 0.42)} fill="#8c64bd" fillOpacity={0.9} />
          {d.r >= 16 && (
            <text
              x={d.x}
              y={d.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={13}
              fontWeight="700"
              fill="#fff"
            >
              {d.n}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
