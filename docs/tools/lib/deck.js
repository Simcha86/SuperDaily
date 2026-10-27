// Gemeinsames Folien-Design (Minze) für Anleitung und Versionsvergleich. 16:9, 13,33 × 7,5 Zoll.
const pptxgen = require('pptxgenjs');
const React = require('react');
const RDS = require('react-dom/server');
const sharp = require('sharp');
const Pi = require('react-icons/pi');

const C = { ink: '10302B', deep: '0F5F56', bg: 'F2F8F6', white: 'FFFFFF', teal: '14B8A6', teal2: '0D7A70', mint: '99F6E4', lime: '84CC16',
  amber: 'F59E0B', gray: '53625E', line: 'DDE5E2', red: 'E11D48' };
const FONT = 'Calibri';

function createDeck({ title, footer }) {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';
  pres.theme = { headFontFace: FONT, bodyFontFace: FONT };
  pres.title = title; pres.author = 'SuperDaily';
  pres.defineSlideMaster({ title: 'TITEL', background: { color: C.ink }, objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.8, y: 2.2, w: 6.6, h: 1.7, fontSize: 52, bold: true, color: C.white, valign: 'bottom', align: 'left', margin: 0 }, text: 'Titel' } },
    { placeholder: { options: { name: 'body', type: 'body', x: 0.8, y: 4.1, w: 6.4, h: 1.5, fontSize: 20, color: C.mint, valign: 'top', align: 'left', margin: 0 }, text: 'Untertitel' } }] });
  pres.defineSlideMaster({ title: 'KAPITEL', background: { color: C.ink }, objects: [
    { placeholder: { options: { name: 'num', type: 'body', x: 0.8, y: 1.7, w: 3, h: 1.3, fontSize: 80, bold: true, color: C.teal, valign: 'bottom', align: 'left', margin: 0 }, text: '01' } },
    { placeholder: { options: { name: 'title', type: 'title', x: 0.8, y: 3.1, w: 7.4, h: 1.1, fontSize: 44, bold: true, color: C.white, valign: 'top', align: 'left', margin: 0 }, text: 'Kapitel' } },
    { placeholder: { options: { name: 'body', type: 'body', x: 0.8, y: 4.3, w: 7, h: 1.2, fontSize: 20, color: C.mint, valign: 'top', align: 'left', margin: 0 }, text: 'Beschreibung' } }] });
  pres.defineSlideMaster({ title: 'INHALT', background: { color: C.bg }, margin: [0.5, 0.6, 0.6, 0.6],
    slideNumber: { x: 12.2, y: 6.95, w: 0.6, h: 0.3, fontSize: 11, color: C.gray, align: 'right' },
    objects: [
      { text: { text: footer, options: { x: 0.6, y: 6.95, w: 6, h: 0.3, fontSize: 11, color: C.gray, margin: 0 } } },
      { placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 0.45, w: 7.3, h: 0.75, fontSize: 36, bold: true, color: C.ink, valign: 'top', align: 'left', margin: 0 }, text: 'Titel' } },
      { placeholder: { options: { name: 'sub', type: 'body', x: 0.6, y: 1.2, w: 7.3, h: 0.45, fontSize: 17, color: C.deep, valign: 'top', align: 'left', margin: 0 }, text: 'Untertitel' } }] });
  pres.defineSlideMaster({ title: 'INHALT_DUNKEL', background: { color: C.ink },
    slideNumber: { x: 12.2, y: 6.95, w: 0.6, h: 0.3, fontSize: 11, color: C.mint, align: 'right' },
    objects: [
      { placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 0.45, w: 6.4, h: 0.75, fontSize: 36, bold: true, color: C.white, valign: 'top', align: 'left', margin: 0 }, text: 'Titel' } },
      { placeholder: { options: { name: 'sub', type: 'body', x: 0.6, y: 1.2, w: 6.4, h: 0.45, fontSize: 17, color: C.mint, valign: 'top', align: 'left', margin: 0 }, text: 'Untertitel' } }] });
  pres.defineSlideMaster({ title: 'BREIT', background: { color: C.bg },
    slideNumber: { x: 12.2, y: 6.95, w: 0.6, h: 0.3, fontSize: 11, color: C.gray, align: 'right' },
    objects: [
      { text: { text: footer, options: { x: 0.6, y: 6.95, w: 6, h: 0.3, fontSize: 11, color: C.gray, margin: 0 } } },
      { placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 0.35, w: 12.1, h: 0.7, fontSize: 32, bold: true, color: C.ink, valign: 'top', align: 'left', margin: 0 }, text: 'Titel' } }] });
  return pres;
}

const iconCache = {};
async function iconPng(name, hex) {
  const k = name + hex; if (iconCache[k]) return iconCache[k];
  const Icon = Pi[name] || Pi.PiCircle;
  const svg = RDS.renderToStaticMarkup(React.createElement(Icon, { color: '#' + hex, size: 256 }));
  return (iconCache[k] = 'image/png;base64,' + (await sharp(Buffer.from(svg)).resize(256, 256).png().toBuffer()).toString('base64'));
}

// Hilfsfunktionen für eine Folie; ph = { buf, ratio } aus images.phone()
function kit(pres) {
  const H = {
    head(s, title, sub) { s.addText(title, { placeholder: 'title' }); if (sub) s.addText(sub, { placeholder: 'sub' }); },
    phone(s, ph, x, y, h, alt) { s.addImage({ data: 'image/png;base64,' + ph.buf.toString('base64'), x, y, w: h * ph.ratio, h, altText: alt || '', objectName: 'Screenshot' }); return h * ph.ratio; },
    card(s, x, y, w, h, fill = C.white) {
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.18, fill: { color: fill }, line: { color: fill, width: 0 },
        shadow: { type: 'outer', color: '10302B', opacity: 0.10, blur: 12, offset: 3, angle: 90 }, objectName: 'Karte' });
    },
    async icon(s, name, x, y, d = 0.6, bg = C.teal, fg = 'FFFFFF') {
      s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: bg }, line: { color: bg, width: 0 }, objectName: 'Icon-Kreis' });
      const p = d * 0.27; s.addImage({ data: await iconPng(name, fg), x: x + p, y: y + p, w: d - 2 * p, h: d - 2 * p, altText: '', objectName: 'Icon' });
    },
    num(s, n, x, y, d = 0.46, bg = C.teal) {
      s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: bg }, line: { color: C.white, width: bg === C.red ? 2 : 0 }, objectName: 'Nummer ' + n });
      s.addText(String(n), { x, y, w: d, h: d, align: 'center', valign: 'middle', fontSize: d > 0.5 ? 18 : 16, bold: true, color: C.white, margin: 0, isTextBox: true });
    },
    text(s, str, o) { s.addText(str, { margin: 0, valign: 'top', isTextBox: true, color: C.ink, fontSize: 14, ...o }); },
    tdesc(s, title, desc, x, y, w, h, o = {}) {
      s.addText([
        { text: title, options: { bold: true, fontSize: o.tsize || 17, color: o.dark ? C.white : C.ink, breakLine: true } },
        { text: desc, options: { fontSize: o.dsize || 14, color: o.dark ? C.mint : C.gray } }
      ], { x, y, w, h, valign: 'top', margin: 0, paraSpaceAfter: 3, isTextBox: true });
    },
    steps(s, list, x, y, w, rowH) { list.forEach(([t, d], i) => { H.num(s, i + 1, x, y + i * rowH); H.tdesc(s, t, d, x + 0.65, y + i * rowH - 0.02, w - 0.65, rowH - 0.1); }); },
    chip(s, text, x, y, w, o = {}) {
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h: 0.4, rectRadius: 0.2, fill: { color: o.fill || C.mint }, line: { color: o.fill || C.mint, width: 0 }, objectName: 'Chip' });
      s.addText(text, { x, y, w, h: 0.4, align: 'center', valign: 'middle', fontSize: 14, bold: true, color: o.color || C.ink, margin: 0, isTextBox: true });
    },
    bar(s, x, y, w, h, color) { s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: h / 2, fill: { color }, line: { color, width: 0 }, objectName: 'Linie' }); }
  };
  return H;
}

module.exports = { C, createDeck, kit };
