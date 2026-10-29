// Feste Beispieldaten für Tests: Simon und Irina, fünf Routinen, drei Wochen Verlauf, sieben Aufgaben.
// Wird im Browser vor dem Laden der App ausgeführt und setzt globalThis.SD_SAMPLE.
// Fester Zufallsstartwert, damit jeder Testlauf dieselben Haken hat.
(function () {
  const pad = n => String(n).padStart(2, '0');
  const dk = o => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + o); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const list = [['w', 'Glas Wasser nach dem Aufstehen', 'Morgen', 's'], ['z', 'Zahnseide', 'Morgen', 'ab'], ['s', '30 Minuten Sport', 'Tagsüber', 'a'], ['l', '20 Seiten lesen', 'Abend', 'ab'], ['m', 'Meditation', 'Abend', 'b']];
  const routines = {}, done = {};
  list.forEach(([id, title, slot, who], i) => { routines[id] = { id, title, slot, who, rep: { type: 'daily' }, created: dk(-21), createdAt: i }; });
  for (let o = -21; o < 0; o++) {
    const day = done[dk(o)] = {};
    list.forEach(([id, , , who]) => {
      if (who !== 'b' && rnd() < .78) day[(who === 's' ? 's' : 'a') + '|' + id] = true;
      if (who !== 'a' && who !== 's' && rnd() < .72) day['b|' + id] = true;
    });
  }
  done[dk(0)] = { 's|w': true, 'a|z': true, 'b|z': true };
  // Aufgaben: überfällig, heute, morgen, später, ohne Datum, erledigt – in alle Richtungen vergeben
  const tasks = {};
  [['t1', 'Paket zur Post bringen', 'b', 'a', -1, false], ['t2', 'Arzttermin für Mia ausmachen', 'b', 'a', 0, false], ['t3', 'Geschenk für Oma besorgen', 'a', 's', 0, false],
   ['t4', 'Steuerunterlagen sortieren', 'a', 'a', 4, false], ['t5', 'Babysitter für Samstag fragen', 'a', 'b', 1, false], ['t6', 'Urlaub planen', 'b', 's', null, false],
   ['t7', 'Fahrrad zur Inspektion', 'b', 'a', -2, true]].forEach(([id, title, from, to, due, isDone], i) => {
    tasks[id] = { id, title, note: id === 't2' ? 'Kinderarzt Dr. Weber, vormittags anrufen' : '', from, to, due: due === null ? null : dk(due), done: isDone, doneAt: isDone ? dk(-1) : null, doneBy: isDone ? to : null, createdAt: Date.now() - (7 - i) * 864e5 };
  });
  globalThis.SD_SAMPLE = { app: 'SuperDaily', version: 1, names: { a: 'Simon', b: 'Irina' }, routines, done, tasks, me: 'a' };
})();
