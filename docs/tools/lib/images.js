// Bildbearbeitung: Screens verkleinert speichern und als Handy mit Rahmen (optional mit Tipp-Markierungen) darstellen.
const sharp = require('sharp');

const RED = '#E11D48';

// Für das Repo: verlustarm als Palette-PNG, deutlich kleiner als der Roh-Screenshot
const optimize = (src, dest) => sharp(src).png({ palette: true, quality: 92, compressionLevel: 9, effort: 8 }).toFile(dest);

// Markierungen in CSS-Pixeln (Screenshot ist doppelt so groß)
const marks = (w, h, boxes, scale) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs><filter id="g" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${7 * scale / 2}"/></filter></defs>
  ${boxes.map(b => { const x = (b.x - 6) * scale, y = (b.y - 6) * scale, bw = (b.w + 12) * scale, bh = (b.h + 12) * scale, r = 14 * scale;
    return `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="${r}" fill="none" stroke="${RED}" stroke-width="${6 * scale}" opacity=".45" filter="url(#g)"/>
    <rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="${r}" fill="${RED}" fill-opacity=".07" stroke="${RED}" stroke-width="${4 * scale}"/>`; }).join('')}
</svg>`);

async function phone(src, { highlights = [], css = 390 } = {}) {
  const meta = await sharp(src).metadata(), W = meta.width, H = meta.height, scale = W / css;
  const bez = Math.round(9 * scale), r = Math.round(50 * scale), pad = Math.round(40 * scale);
  const fw = W + 2 * bez, fh = H + 2 * bez, cw = fw + 2 * pad, ch = fh + 2 * pad;
  let screen = sharp(src).ensureAlpha();
  if (highlights.length) screen = sharp(await screen.composite([{ input: marks(W, H, highlights, scale) }]).png().toBuffer());
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" rx="${r}" fill="#fff"/></svg>`);
  const rounded = await screen.composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  const shadow = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cw}" height="${ch}"><rect x="${pad}" y="${pad + 20 * scale}" width="${fw}" height="${fh}" rx="${r + bez}" fill="#082824" fill-opacity=".35"/></svg>`)).blur(25 * scale).png().toBuffer();
  const bezel = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cw}" height="${ch}"><rect x="${pad}" y="${pad}" width="${fw}" height="${fh}" rx="${r + bez}" fill="#16211F"/></svg>`);
  const buf = await sharp({ create: { width: cw, height: ch, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: shadow }, { input: bezel }, { input: rounded, left: pad + bez, top: pad + bez }]).png({ compressionLevel: 9 }).toBuffer();
  return { buf, ratio: cw / ch };
}

// Anteil sichtbar unterschiedlicher Pixel zweier gleich großer Screenshots (0…1). Verglichen wird verkleinert und
// leicht weichgezeichnet, mit der kleinsten Abweichung über Verschiebungen bis 2 Pixel: Rundungen beim Scrollen zählen nicht.
async function difference(a, b) {
  const W = 130, Hh = 281, D = 2;
  const [x, y] = await Promise.all([a, b].map(f => sharp(f).resize(W, Hh).blur(0.8).removeAlpha().raw().toBuffer()));
  let best = 1;
  for (let dy = -D; dy <= D; dy++) for (let dx = -D; dx <= D; dx++) {
    let n = 0, t = 0;
    for (let r = D; r < Hh - D; r++) for (let c = D; c < W - D; c++) {
      const i = (r * W + c) * 3, j = ((r - dy) * W + (c - dx)) * 3; t++;
      if (Math.abs(x[i] - y[j]) + Math.abs(x[i + 1] - y[j + 1]) + Math.abs(x[i + 2] - y[j + 2]) > 60) n++;
    }
    best = Math.min(best, n / t);
  }
  return best;
}

module.exports = { optimize, phone, difference };
