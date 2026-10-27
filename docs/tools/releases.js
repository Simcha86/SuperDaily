// Erläuterungen für den Versionsvergleich, je Version. Optional: Ohne Eintrag zeigt der Vergleich die
// Neuerungen aus CHANGES (app.js) und jeden Screen, der sich sichtbar verändert hat, ohne eigenen Text.
// screens: key → Satz zum Unterschied. todo: Schritte, die nach dem Update nötig sind.
module.exports = {
  5: {
    summary: 'Die App zeigt ihre Versionsnummer und erzählt nach einem Update, was neu ist.',
    screens: {
      '05-heute-neu-in-version': 'Neu: Nach einem Update erscheint auf „Heute“ einmalig „Neu in Version 5“. „Mehr“ öffnet die Details, das X blendet den Hinweis aus.',
      '32-mehr-haushalt': 'Neu: Ganz unten unter „Mehr“ steht die Karte „Über SuperDaily“ mit Versionsnummer und Datum.',
      '33-mehr-ueber-superdaily': 'Neu: Die Karte listet, was in dieser Version neu ist, und klappt die früheren Versionen auf.'
    },
    todo: ['App auf beiden Handys einmal schließen und neu öffnen, damit Version 5 geladen wird.']
  }
};
