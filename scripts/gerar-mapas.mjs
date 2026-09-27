// Gera os mapas estáticos (SVG) do Guarujá a partir de dados do OpenStreetMap.
// Uso: node scripts/gerar-mapas.mjs            (usa o cache em scripts/.osm-cache)
//      node scripts/gerar-mapas.mjs --atualizar (baixa os dados de novo do Overpass)
// Saída: src/assets/mapas/*.svg e src/data/mapa-bairros-praias.json
// Dados © colaboradores do OpenStreetMap, licença ODbL — o crédito aparece em cada mapa.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(ROOT, 'scripts', '.osm-cache');
const OUT_SVG = join(ROOT, 'src', 'assets', 'mapas');
const OUT_DATA = join(ROOT, 'src', 'data');
const UA = 'DestinosGuarujaBot/1.0 (https://destinosguaruja.com.br)';

// Relação OSM do município de Guarujá (IBGE 3518701).
const GUARUJA_REL = 298463;
const AREA = 3600000000 + GUARUJA_REL;

const QUERIES = {
  'city.json': `[out:json][timeout:120];
area(id:${AREA})->.g;
(relation(${GUARUJA_REL}); relation["boundary"="administrative"]["admin_level"="9"](area.g);)->.b;
.b out geom;
way["highway"~"^(motorway|trunk|primary|secondary)$"](area.g);
out tags geom;
way["route"="ferry"](-24.10,-46.45,-23.80,-46.05);
out tags geom;`,
  'places.json': `[out:json][timeout:90];
area(id:${AREA})->.g;
(
  relation["boundary"="administrative"]["admin_level"~"9|10"](area.g);
  node["place"~"suburb|neighbourhood|quarter|village|hamlet|locality"](area.g);
  nwr["natural"="beach"](area.g);
);
out tags center;`,
};

async function loadData(refresh) {
  mkdirSync(CACHE, { recursive: true });
  const data = {};
  for (const [file, query] of Object.entries(QUERIES)) {
    const path = join(CACHE, file);
    if (refresh || !existsSync(path)) {
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ data: query }),
      });
      if (!res.ok) throw new Error(`Overpass respondeu ${res.status} para ${file}`);
      writeFileSync(path, await res.text());
    }
    data[file] = JSON.parse(readFileSync(path, 'utf8'));
  }
  return data;
}

// ---------- geometria ----------

const LAT0 = -23.955;
const KX = Math.cos((LAT0 * Math.PI) / 180);

function makeProjection(bbox, width) {
  const scale = width / ((bbox.maxLon - bbox.minLon) * KX);
  const height = Math.round((bbox.maxLat - bbox.minLat) * scale);
  return {
    width,
    height,
    project: ([lon, lat]) => [(lon - bbox.minLon) * KX * scale, (bbox.maxLat - lat) * scale],
    // quilômetros por pixel, para a barra de escala
    kmPerPx: 111.32 / scale,
  };
}

const key = (p) => `${p.lon.toFixed(7)},${p.lat.toFixed(7)}`;

/** Junta os caminhos "outer" de uma relação em anéis fechados. */
function assembleRings(relation) {
  const segs = relation.members
    .filter((m) => m.type === 'way' && m.role === 'outer' && m.geometry)
    .map((m) => m.geometry.map((p) => ({ lon: p.lon, lat: p.lat })));
  const rings = [];
  while (segs.length) {
    let ring = segs.shift();
    let guard = 0;
    while (key(ring[0]) !== key(ring[ring.length - 1]) && guard++ < 1000) {
      const end = key(ring[ring.length - 1]);
      const i = segs.findIndex((s) => key(s[0]) === end || key(s[s.length - 1]) === end);
      if (i === -1) break;
      const [seg] = segs.splice(i, 1);
      ring = ring.concat(key(seg[0]) === end ? seg.slice(1) : seg.reverse().slice(1));
    }
    rings.push(ring.map((p) => [p.lon, p.lat]));
  }
  return rings;
}

/** Simplificação Douglas-Peucker em coordenadas já projetadas. */
function simplify(points, tolerance) {
  if (points.length < 3) return points;
  const sqTol = tolerance * tolerance;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let maxD = 0;
    let idx = -1;
    const [ax, ay] = points[a];
    const [bx, by] = points[b];
    const dx = bx - ax;
    const dy = by - ay;
    const len = dx * dx + dy * dy || 1;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = points[i];
      let t = ((px - ax) * dx + (py - ay) * dy) / len;
      t = Math.max(0, Math.min(1, t));
      const ex = ax + t * dx - px;
      const ey = ay + t * dy - py;
      const d = ex * ex + ey * ey;
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (maxD > sqTol && idx !== -1) {
      keep[idx] = 1;
      stack.push([a, idx], [idx, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

const fmt = (n) => Math.round(n * 10) / 10;

function pathD(rings, proj, tolerance, close = true) {
  return rings
    .map((ring) => {
      const pts = simplify(ring.map(proj.project), tolerance);
      if (pts.length < 2) return '';
      return 'M' + pts.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join('L') + (close ? 'Z' : '');
    })
    .join('');
}

function pointInRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

// ---------- estilo (cores da identidade do site) ----------

const C = {
  sea: '#dbf0f7',
  seaDeep: '#b8e2ef',
  land: '#fdfbf5',
  landAlt: '#f9f2e2',
  coast: '#86cce0',
  road: '#b57d38',
  roadMinor: '#e8cd94',
  ferry: '#23708c',
  text: '#1c3e4d',
  textSoft: '#1f5a70',
  beach: '#dcb066',
};
const FONT = "font-family=\"Inter, 'Segoe UI', Arial, sans-serif\"";

function textWithHalo(
  x,
  y,
  str,
  { size = 13, weight = 500, anchor = 'middle', fill = C.text, italic = false, rotate = 0 } = {},
) {
  const rot = rotate ? ` transform="rotate(${fmt(rotate)} ${fmt(x)} ${fmt(y)})"` : '';
  return `<text x="${fmt(x)}" y="${fmt(y)}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" fill="${fill}"${italic ? ' font-style="italic"' : ''}${rot} stroke="#ffffff" stroke-width="3.5" stroke-linejoin="round" paint-order="stroke">${esc(str)}</text>`;
}

/** Coordenadas [lon, lat] de um lugar/praia pelo nome, nos dados do OSM. */
function findPlace(data, name) {
  const e = data['places.json'].elements.find((el) => el.tags?.name === name);
  if (!e) throw new Error(`Lugar não encontrado nos dados do OSM: ${name}`);
  return [e.lon ?? e.center.lon, e.lat ?? e.center.lat];
}

/** Ponto médio (projetado) de um conjunto de caminhos. */
function centroidOf(ways, proj) {
  const pts = ways.flatMap((w) => w.geometry.map((p) => proj.project([p.lon, p.lat])));
  const sx = pts.reduce((s, p) => s + p[0], 0);
  const sy = pts.reduce((s, p) => s + p[1], 0);
  return [sx / pts.length, sy / pts.length];
}

function northArrow(x, y) {
  return `<g transform="translate(${x} ${y})"><path d="M0 -22 L8 6 L0 0 L-8 6 Z" fill="${C.text}"/>${textWithHalo(0, 22, 'N', { size: 13, weight: 700 })}</g>`;
}

function scaleBar(x, y, kmPerPx) {
  const km = 2;
  const px = km / kmPerPx;
  return `<g transform="translate(${x} ${y})"><rect x="0" y="0" width="${fmt(px / 2)}" height="6" fill="${C.text}"/><rect x="${fmt(px / 2)}" y="0" width="${fmt(px / 2)}" height="6" fill="#ffffff" stroke="${C.text}"/>${textWithHalo(0, -6, '0', { size: 11, anchor: 'start' })}${textWithHalo(px, -6, `${km} km`, { size: 11, anchor: 'end' })}</g>`;
}

function attribution(w, h) {
  return textWithHalo(w - 12, h - 12, '© colaboradores do OpenStreetMap', { size: 11, weight: 400, anchor: 'end', fill: C.textSoft });
}

function svgDoc(w, h, title, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(title)}" ${FONT}>
<title>${esc(title)}</title>
<rect width="${w}" height="${h}" fill="${C.sea}"/>
${body}
</svg>
`;
}

// ---------- mapas ----------

const BBOX = { minLon: -46.345, maxLon: -46.105, minLat: -24.062, maxLat: -23.842 };

function buildCityMap(data, proj) {
  const els = data['city.json'].elements;
  const city = els.find((e) => e.type === 'relation' && e.id === GUARUJA_REL);
  const cityRings = assembleRings(city);
  const landD = pathD(cityRings, proj, 0.8);

  const secondary = els.filter((e) => e.type === 'way' && e.tags?.highway === 'secondary');
  const motorway = els.filter((e) => e.type === 'way' && ['motorway', 'trunk', 'primary'].includes(e.tags?.highway));
  const sp061 = secondary.filter((e) => (e.tags.ref ?? '').includes('SP-061'));
  const lineD = (ways) => pathD(ways.map((w) => w.geometry.map((p) => [p.lon, p.lat])), proj, 0.6, false);

  const santosFerry = els.filter((e) => e.type === 'way' && e.tags?.name === 'Balsa Santos - Guarujá');
  const bertiogaFerry = els.filter((e) => e.type === 'way' && e.tags?.name === 'Balsa Bertioga - Guarujá');
  const boats = els.filter(
    (e) => e.type === 'way' && /Vicente de Carvalho/.test(e.tags?.name ?? '') && e.tags?.route === 'ferry',
  );

  const at = (lonlat, dx = 0, dy = 0) => {
    const [x, y] = proj.project(lonlat);
    return [x + dx, y + dy];
  };
  const place = (name, dx, dy) => at(findPlace(data, name), dx, dy);

  const labels = [
    ['Vicente de Carvalho', place('Vicente de Carvalho'), 15, 700],
    ['Centro', place('Santo Antônio', 20, 12), 14, 700],
    ['Pitangueiras', place('Pitangueiras', 0, 16), 12, 600],
    ['Enseada', place('Enseada', 0, -6), 14, 700],
    ['Perequê', place('Jardim Umuarama - Perequê', -20, 0), 13, 600],
    ['Pernambuco', place('Praia de Pernambuco', -52, 4), 13, 600],
    ['Guaiúba', place('Praia do Guaiúba', 0, -22), 12, 600],
    ['Iporanga', place('Praia de Iporanga', -40, 4), 12, 600],
  ].map(([t, [x, y], size, weight]) => textWithHalo(x, y, t, { size, weight }));

  const motorwayStart = motorway
    .flatMap((w) => w.geometry.map((p) => proj.project([p.lon, p.lat])))
    .reduce((top, p) => (p[1] < top[1] ? p : top), [0, Infinity]);
  const [s61x, s61y] = centroidOf(sp061, proj);
  const [sfx, sfy] = centroidOf(santosFerry, proj);
  const [bfx, bfy] = centroidOf(bertiogaFerry, proj);
  const [cbx, cby] = centroidOf(boats, proj);
  const [ox, oy] = at([-46.18, -24.04]);

  const ferryStyle = `fill="none" stroke="${C.ferry}" stroke-width="4" stroke-dasharray="7 4" stroke-linecap="round"`;

  const body = `
<path d="${landD}" fill="${C.land}" stroke="${C.coast}" stroke-width="1.5"/>
<path d="${lineD(secondary)}" fill="none" stroke="${C.roadMinor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="${lineD(sp061)}" fill="none" stroke="${C.road}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<path d="${lineD(motorway)}" fill="none" stroke="${C.road}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="${lineD(santosFerry)}" ${ferryStyle}/>
<path d="${lineD(bertiogaFerry)}" ${ferryStyle}/>
<path d="${lineD(boats)}" fill="none" stroke="${C.ferry}" stroke-width="2" stroke-dasharray="2 4" stroke-linecap="round"/>
${labels.join('\n')}
${textWithHalo(motorwayStart[0] + 10, motorwayStart[1] + 30, 'SP-055 — para Cubatão e São Paulo', { size: 12, weight: 700, anchor: 'start', fill: C.road })}
${textWithHalo(s61x + 14, s61y, 'SP-061', { size: 12, weight: 700, anchor: 'start', fill: C.road })}
${textWithHalo(sfx - 12, sfy + 4, 'Balsa para Santos', { size: 13, weight: 700, anchor: 'end', fill: C.ferry })}
${textWithHalo(cbx, cby - 16, 'Catraias para Santos (pedestres)', { size: 12, weight: 600, anchor: 'start', fill: C.ferry })}
${textWithHalo(bfx - 12, bfy + 4, 'Balsa para Bertioga', { size: 13, weight: 700, anchor: 'end', fill: C.ferry })}
${textWithHalo(ox, oy, 'Oceano Atlântico', { size: 16, weight: 400, italic: true, fill: C.textSoft })}
${northArrow(proj.width - 40, proj.height - 80)}
${scaleBar(24, proj.height - 30, proj.kmPerPx)}
${attribution(proj.width, proj.height)}`;

  return svgDoc(proj.width, proj.height, 'Mapa do Guarujá com vias principais e balsas', body);
}

function buildNeighbourhoodMap(data, proj) {
  const els = data['city.json'].elements;
  const city = els.find((e) => e.type === 'relation' && e.id === GUARUJA_REL);
  const districts = els.filter((e) => e.type === 'relation' && e.tags?.admin_level === '9');
  const places = data['places.json'].elements;

  const districtShapes = districts.map((d) => ({
    name: d.tags.name,
    rings: assembleRings(d),
  }));

  // Bairros (nomes únicos), com o distrito a que pertencem.
  const seen = new Set();
  const bairros = [];
  for (const e of places) {
    const t = e.tags ?? {};
    if (!t.place || !t.name || seen.has(t.name) || t.place === 'locality') continue;
    seen.add(t.name);
    const lonlat = [e.lon ?? e.center?.lon, e.lat ?? e.center?.lat];
    const district = districtShapes.find((d) => d.rings.some((r) => pointInRing(lonlat, r)))?.name ?? 'Guarujá';
    bairros.push({ name: t.name, lonlat, district, rank: t.place === 'village' ? 0 : 1 });
  }
  bairros.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name, 'pt-BR'));

  // Praias com nome, numeradas de oeste para leste ao longo da costa.
  const praiasSeen = new Set();
  const praias = [];
  for (const e of places) {
    const t = e.tags ?? {};
    if (t.natural !== 'beach' || !t.name || praiasSeen.has(t.name)) continue;
    praiasSeen.add(t.name);
    praias.push({ name: t.name, lonlat: [e.lon ?? e.center?.lon, e.lat ?? e.center?.lat] });
  }
  praias.sort((a, b) => a.lonlat[0] - b.lonlat[0]);
  praias.forEach((p, i) => (p.n = i + 1));

  // Marcadores de praia: afasta os que se sobrepõem, com linha guia até o ponto real.
  const R = 11;
  const markers = praias.map((p) => {
    const [x, y] = proj.project(p.lonlat);
    return { ...p, ox: x, oy: y, x, y };
  });
  for (let iter = 0; iter < 200; iter++) {
    let moved = false;
    for (let i = 0; i < markers.length; i++) {
      for (let j = i + 1; j < markers.length; j++) {
        const a = markers[i];
        const b = markers[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 0.01;
        const min = 2 * R + 3;
        if (d < min) {
          const push = (min - d) / 2;
          a.x -= (dx / d) * push;
          a.y -= (dy / d) * push;
          b.x += (dx / d) * push;
          b.y += (dy / d) * push;
          moved = true;
        }
      }
    }
    if (!moved) break;
  }

  // Rótulos de bairro: posicionamento guloso, pulando os que colidem.
  const boxes = markers.map((m) => [m.x - R, m.y - R, m.x + R, m.y + R]);
  const overlaps = (b) => boxes.some((o) => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]);
  const placedLabels = [];
  for (const b of bairros) {
    const [x, y] = proj.project(b.lonlat);
    const size = b.rank === 0 ? 13 : 11;
    const w = b.name.length * size * 0.56;
    const box = [x - w / 2 - 2, y - size, x + w / 2 + 2, y + 3];
    if (box[0] < 4 || box[2] > proj.width - 4 || overlaps(box)) continue;
    boxes.push(box);
    placedLabels.push(
      `<circle cx="${fmt(x)}" cy="${fmt(y + 5)}" r="2" fill="${C.textSoft}"/>` +
        textWithHalo(x, y, b.name, { size, weight: b.rank === 0 ? 700 : 500, fill: C.textSoft }),
    );
  }

  const districtFill = { 'Vicente de Carvalho': C.landAlt, Guarujá: C.land };
  const districtPaths = districtShapes
    .map((d) => `<path d="${pathD(d.rings, proj, 0.8)}" fill="${districtFill[d.name] ?? C.land}" stroke="${C.road}" stroke-width="1.2" stroke-dasharray="5 3"/>`)
    .join('\n');

  const markerSvg = markers
    .map((m) => {
      const lead =
        Math.hypot(m.x - m.ox, m.y - m.oy) > 4
          ? `<line x1="${fmt(m.ox)}" y1="${fmt(m.oy)}" x2="${fmt(m.x)}" y2="${fmt(m.y)}" stroke="${C.road}" stroke-width="1"/><circle cx="${fmt(m.ox)}" cy="${fmt(m.oy)}" r="2" fill="${C.road}"/>`
          : '';
      return `${lead}<circle cx="${fmt(m.x)}" cy="${fmt(m.y)}" r="${R}" fill="${C.beach}" stroke="#ffffff" stroke-width="2"/><text x="${fmt(m.x)}" y="${fmt(m.y + 4)}" font-size="11" font-weight="700" text-anchor="middle" fill="${C.text}">${m.n}</text>`;
    })
    .join('\n');

  const [vx, vy] = proj.project([-46.262, -23.925]);
  const [gx, gy] = proj.project([-46.19, -23.905]);
  const [ox, oy] = proj.project([-46.18, -24.045]);

  const legend = `<g transform="translate(20 20)">
<rect width="232" height="84" rx="8" fill="#ffffff" opacity="0.92" stroke="${C.coast}"/>
<rect x="12" y="14" width="16" height="12" fill="${C.landAlt}" stroke="${C.road}" stroke-dasharray="5 3"/>${textWithHalo(36, 25, 'Distrito de Vicente de Carvalho', { size: 11, anchor: 'start' })}
<rect x="12" y="36" width="16" height="12" fill="${C.land}" stroke="${C.road}" stroke-dasharray="5 3"/>${textWithHalo(36, 47, 'Distrito de Guarujá (sede)', { size: 11, anchor: 'start' })}
<circle cx="20" cy="66" r="8" fill="${C.beach}" stroke="#ffffff" stroke-width="2"/>${textWithHalo(36, 70, 'Praia (número na lista)', { size: 11, anchor: 'start' })}
</g>`;

  const body = `
<path d="${pathD(assembleRings(city), proj, 0.8)}" fill="${C.land}" stroke="${C.coast}" stroke-width="1.5"/>
${districtPaths}
${textWithHalo(vx, vy, 'VICENTE DE CARVALHO', { size: 14, weight: 800, fill: C.road })}
${textWithHalo(gx, gy, 'GUARUJÁ (SEDE)', { size: 14, weight: 800, fill: C.road })}
${placedLabels.join('\n')}
${markerSvg}
${textWithHalo(ox, oy, 'Oceano Atlântico', { size: 16, weight: 400, italic: true, fill: C.textSoft })}
${legend}
${northArrow(proj.width - 40, 50)}
${scaleBar(24, proj.height - 30, proj.kmPerPx)}
${attribution(proj.width, proj.height)}`;

  const svg = svgDoc(proj.width, proj.height, 'Mapa dos bairros e praias do Guarujá', body);
  const legendData = {
    praias: praias.map((p) => ({ n: p.n, name: p.name })),
    bairros: Object.fromEntries(
      ['Guarujá', 'Vicente de Carvalho'].map((d) => [
        d,
        bairros.filter((b) => b.district === d).map((b) => b.name).sort((a, b) => a.localeCompare(b, 'pt-BR')),
      ]),
    ),
  };
  return { svg, legendData };
}

// Esquema (fora de escala) das vias de acesso. Os nomes e códigos das rodovias
// foram conferidos nos dados do OpenStreetMap (passos das rotas OSRM).
function buildAccessDiagram() {
  const W = 1000;
  const H = 680;
  // [x, y, rótulo, posição do rótulo]
  const N = {
    sp: [470, 80, 'São Paulo', 'top'],
    cub: [330, 300, 'Cubatão', 'left'],
    jct: [620, 365, '', ''],
    ber: [860, 330, 'Bertioga', 'right'],
    nor: [900, 110, 'Litoral Norte e Rio de Janeiro', 'top'],
    san: [250, 468, 'Santos', 'top-left'],
    sul: [80, 468, 'Litoral Sul (Praia Grande)', 'bottom-start'],
    vc: [505, 568, 'Vicente de Carvalho', 'bottom'],
    gua: [700, 560, 'Guarujá', 'bottom'],
  };
  const road = `stroke="${C.road}" stroke-width="6" stroke-linecap="round"`;
  const ferry = `stroke="${C.ferry}" stroke-width="4" stroke-dasharray="10 7" stroke-linecap="round"`;
  const boat = `stroke="${C.ferry}" stroke-width="3" stroke-dasharray="1 7" stroke-linecap="round"`;
  const line = (a, b, style, dx = 0) => {
    const [x1, y1] = N[a];
    const [x2, y2] = N[b];
    return `<line x1="${x1 + dx}" y1="${y1}" x2="${x2 + dx}" y2="${y2}" ${style}/>`;
  };
  /** Rótulo alinhado a um segmento, deslocado perpendicularmente por `off` pixels. */
  const along = (a, b, text, off, opts = {}) => {
    const [x1, y1] = N[a];
    const [x2, y2] = N[b];
    let ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
    if (ang > 90) ang -= 180;
    if (ang < -90) ang += 180;
    const rad = (ang * Math.PI) / 180;
    const x = (x1 + x2) / 2 - Math.sin(rad) * off;
    const y = (y1 + y2) / 2 + Math.cos(rad) * off;
    return textWithHalo(x, y, text, { size: 13, weight: 600, rotate: ang, ...opts });
  };
  const label = (x, y, t, opts) => textWithHalo(x, y, t, { size: 13, weight: 600, ...opts });

  const nodes = Object.entries(N)
    .filter(([, [, , name]]) => name)
    .map(([id, [x, y, name, pos]]) => {
      const main = id === 'gua';
      const r = main ? 15 : 9;
      const size = main ? 20 : 14;
      const at = {
        top: [x, y - 18, 'middle'],
        bottom: [x, y + r + 20, 'middle'],
        left: [x - 16, y + 5, 'end'],
        right: [x + 16, y + 5, 'start'],
        'top-left': [x - 12, y - 14, 'end'],
        'bottom-start': [x - 12, y + 28, 'start'],
      }[pos];
      return `<circle cx="${x}" cy="${y}" r="${r}" fill="${main ? C.ferry : '#ffffff'}" stroke="${C.ferry}" stroke-width="3"/>${textWithHalo(at[0], at[1], name, { size, weight: 700, anchor: at[2] })}`;
    })
    .join('\n');

  const mainland = `M0 0 H${W} V405 C 900 425 820 440 760 432 C 680 420 600 425 520 440 C 420 460 330 490 230 492 C 150 494 60 490 0 492 Z`;
  const island = `M440 560 C 440 510 560 496 660 500 C 780 504 880 522 890 556 C 900 596 800 626 680 628 C 560 630 440 612 440 560 Z`;

  const body = `
<path d="${mainland}" fill="${C.land}" stroke="${C.coast}" stroke-width="2"/>
<path d="${island}" fill="${C.land}" stroke="${C.coast}" stroke-width="2"/>
${textWithHalo(420, 658, 'Oceano Atlântico', { size: 15, weight: 400, italic: true, fill: C.textSoft })}
${textWithHalo(665, 612, 'Ilha de Santo Amaro', { size: 12, weight: 400, italic: true, fill: C.textSoft })}
${line('sp', 'cub', road, -20)}
${line('sp', 'cub', road, 20)}
${line('cub', 'jct', road)}
${line('jct', 'ber', road)}
${line('jct', 'gua', road)}
${line('nor', 'ber', road)}
${line('cub', 'san', road)}
${line('sul', 'san', road)}
${line('san', 'gua', ferry)}
${line('ber', 'gua', ferry)}
<path d="M250 468 Q 340 590 505 568" fill="none" ${boat}/>
${label(365, 190, 'Rod. dos Imigrantes (SP-160)', { anchor: 'end' })}
${label(430, 190, 'Via Anchieta (SP-150)', { anchor: 'start' })}
${along('cub', 'jct', 'Rod. Cônego Domênico Rangoni (SP-055)', 22)}
${label(682, 440, 'SPA-248/055', { anchor: 'start' })}
${label(868, 225, 'Rio-Santos (SP-055/BR-101)', { anchor: 'end' })}
${along('san', 'gua', 'Balsa Santos–Guarujá', -12, { fill: C.ferry })}
${label(300, 588, 'Catraias e barcas', { fill: C.ferry, anchor: 'end' })}
${label(300, 606, '(só pedestres)', { fill: C.ferry, anchor: 'end', size: 12, weight: 500 })}
${along('ber', 'gua', 'Balsa Bertioga–Guarujá + SP-061', 16, { fill: C.ferry })}
${nodes}
<g transform="translate(20 20)">
<rect width="262" height="92" rx="8" fill="#ffffff" stroke="${C.coast}"/>
<line x1="14" y1="22" x2="54" y2="22" ${road}/>${label(64, 27, 'Rodovia', { anchor: 'start', weight: 500 })}
<line x1="14" y1="48" x2="54" y2="48" ${ferry}/>${label(64, 53, 'Balsa (veículos e pedestres)', { anchor: 'start', weight: 500 })}
<line x1="14" y1="74" x2="54" y2="74" ${boat}/>${label(64, 79, 'Barco (só pedestres)', { anchor: 'start', weight: 500 })}
</g>
${textWithHalo(W - 16, 24, 'Esquema fora de escala', { size: 12, weight: 400, anchor: 'end', italic: true, fill: C.textSoft })}
${attribution(W, H)}`;

  return svgDoc(W, H, 'Esquema das vias de acesso ao Guarujá', body);
}

// ---------- execução ----------

const data = await loadData(process.argv.includes('--atualizar'));
mkdirSync(OUT_SVG, { recursive: true });
const proj = makeProjection(BBOX, 1000);

writeFileSync(join(OUT_SVG, 'mapa-guaruja.svg'), buildCityMap(data, proj));
const { svg, legendData } = buildNeighbourhoodMap(data, proj);
writeFileSync(join(OUT_SVG, 'mapa-bairros-praias.svg'), svg);
writeFileSync(join(OUT_SVG, 'mapa-como-chegar.svg'), buildAccessDiagram());
writeFileSync(join(OUT_DATA, 'mapa-bairros-praias.json'), JSON.stringify(legendData, null, 2) + '\n');

console.log(`Mapas gerados em ${OUT_SVG} (${proj.width}x${proj.height}).`);
console.log(`Praias: ${legendData.praias.length}; bairros:`, Object.fromEntries(Object.entries(legendData.bairros).map(([k, v]) => [k, v.length])));
