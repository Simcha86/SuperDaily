// Feste Beispieldaten für Screenshots: Simon und Irina, 8 Routinen, 75 Tage Verlauf.
// Zufall mit festem Startwert, damit alte und neue Version dieselben Daten zeigen.
module.exports = function seed() {
  let x = 7; const rnd = () => (x = (x * 16807) % 2147483647) / 2147483647;
  const pad = n => String(n).padStart(2, '0');
  const key = o => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + o); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const dow = o => { const d = new Date(); d.setDate(d.getDate() + o); return d.getDay(); };
  const R = [
    ['w', 'Glas Wasser nach dem Aufstehen', 'Morgen', 'ab', { type: 'daily' }, .9],
    ['v', 'Vitamine nehmen', 'Morgen', 'ab', { type: 'daily' }, .8],
    ['d', '5 Minuten dehnen', 'Morgen', 'a', { type: 'weekdays', days: [1, 2, 3, 4, 5] }, .7],
    ['s', '10 Minuten spazieren', 'Tagsüber', 's', { type: 'daily' }, .75],
    ['t', 'Sport', 'Tagsüber', 'ab', { type: 'perweek', n: 3 }, .45],
    ['l', '20 Seiten lesen', 'Abend', 'b', { type: 'daily' }, .7],
    ['z', 'Zahnseide', 'Abend', 'ab', { type: 'daily' }, .6],
    ['p', 'Pflanzen gießen', 'Abend', 's', { type: 'every', n: 3 }, .85]];
  const routines = {};
  R.forEach(([id, title, slot, who, rep], i) => { routines[id] = { id, title, slot, who, rep, created: key(-75), createdAt: i }; });
  const done = {};
  for (let o = -75; o <= 0; o++) {
    const day = {};
    for (const [id, , , who, rep, p] of R) {
      if (rep.type === 'weekdays' && !rep.days.includes(dow(o))) continue;
      if (rep.type === 'every' && (o + 75) % rep.n) continue;
      for (const q of who === 's' ? ['s'] : who === 'ab' ? ['a', 'b'] : [who]) {
        if (o === 0) { if (['w', 'v', 'd'].includes(id) && q === 'a' || id === 'w' && q === 'b') day[q + '|' + id] = true; continue; }
        if (rnd() < p + (q === 'b' ? -.08 : 0)) day[q + '|' + id] = true;
      }
    }
    if (Object.keys(day).length) done[key(o)] = day;
  }
  return { names: { a: 'Simon', b: 'Irina' }, routines, done, me: 'a' };
};
