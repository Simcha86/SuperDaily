// Release Notes als Markdown, eine Datei je Version unter docs/releasenotes/.
const fmt = k => new Date(k + 'T12:00').toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
const pct = d => `etwa ${Math.max(1, Math.round(d * 100))} % der Fläche verändert`;

module.exports = function releaseNotes({ version, prev, entry, sha, prevSha, note = {}, pairs, added, removed, unchanged, figmaUrl, archiv }) {
  const L = [];
  L.push(`# SuperDaily · Version ${version}`, '');
  L.push(`Veröffentlicht am ${entry?.date ? fmt(entry.date) : '–'} · Commit \`${(sha || '–').slice(0, 7)}\`` + (prevSha ? ` · Vorgänger: Version ${prev} (\`${prevSha.slice(0, 7)}\`)` : ''), '');
  if (note.summary) L.push(`> ${note.summary}`, '');
  L.push('## Neu in dieser Version', '');
  for (const i of entry?.items || []) L.push(`- ${i}`);
  if (!entry?.items?.length) L.push('- Keine Einträge im Änderungsprotokoll');
  L.push('');
  if (prevSha) {
    L.push(`## Was sich in der App sichtbar verändert hat`, '');
    if (pairs.length || added.length || removed.length) {
      L.push('| Screen | Bereich | Änderung |', '| --- | --- | --- |');
      for (const p of pairs) L.push(`| ${p.s.title} | ${p.s.group} | ${note.screens?.[p.s.key] || pct(p.diff)} |`);
      for (const p of added) L.push(`| ${p.s.title} | ${p.s.group} | ${note.screens?.[p.s.key] || 'Neuer Screen'} |`);
      for (const p of removed) L.push(`| ${p.s.title} | ${p.s.group} | ${note.screens?.[p.s.key] || 'Entfallen'} |`);
      L.push('');
    } else L.push('Keine sichtbaren Änderungen an den Screens.', '');
    L.push(`${unchanged} weitere Screens sind unverändert. Verglichen wurden alle Screens mit denselben Beispieldaten.`, '');
  }
  if (note.todo?.length) { L.push('## Was ihr tun müsst', ''); note.todo.forEach((t, i) => L.push(`${i + 1}. ${t}`)); L.push(''); }
  if (archiv) { L.push('Nachgetragen aus dem Änderungsprotokoll, ohne Screen-Vergleich.', ''); return L.join('\n'); }
  L.push('## Unterlagen zu dieser Version', '',
    '- [Anleitung](../SuperDaily-Anleitung.pptx) ([PDF](../SuperDaily-Anleitung.pdf))',
    ...(prevSha ? [`- [Vergleich Version ${prev} → ${version}](../SuperDaily-Vergleich.pptx) ([PDF](../SuperDaily-Vergleich.pdf))`] : []),
    '- [Alle Screens](../screens/)',
    ...(figmaUrl ? [`- [Figma: Screen-Übersicht und Schritt-für-Schritt-Anleitung](${figmaUrl})`] : []), '');
  return L.join('\n');
};
