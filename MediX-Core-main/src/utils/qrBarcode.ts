import QRCode from 'qrcode';

/**
 * Generate a QR Code data URL asynchronously
 */
export async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 256,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Error generating QR Code:', err);
    return '';
  }
}

/**
 * Generate simple SVG Code 128 / Barcode representation
 */
export function generateBarcodeSvgString(code: string): string {
  // Simple clean visual pseudo-barcode SVG pattern based on character codes
  let bars = '';
  let x = 10;
  const barHeight = 40;

  // Start quiet zone & start guard
  bars += `<rect x="${x}" y="0" width="3" height="${barHeight}" fill="#0f172a"/>`;
  x += 5;
  bars += `<rect x="${x}" y="0" width="2" height="${barHeight}" fill="#0f172a"/>`;
  x += 5;

  for (let i = 0; i < code.length; i++) {
    const charCode = code.charCodeAt(i);
    const w1 = (charCode % 3) + 1.5;
    const w2 = ((charCode >> 1) % 3) + 1;
    bars += `<rect x="${x}" y="0" width="${w1}" height="${barHeight}" fill="#0f172a"/>`;
    x += w1 + 2;
    bars += `<rect x="${x}" y="0" width="${w2}" height="${barHeight}" fill="#0f172a"/>`;
    x += w2 + 3;
  }

  // Stop guard
  bars += `<rect x="${x}" y="0" width="3" height="${barHeight}" fill="#0f172a"/>`;
  x += 5;
  bars += `<rect x="${x}" y="0" width="1.5" height="${barHeight}" fill="#0f172a"/>`;
  x += 10;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${x} ${barHeight + 16}" width="${x}" height="${barHeight + 16}">
    <rect width="100%" height="100%" fill="white"/>
    ${bars}
    <text x="${x / 2}" y="${barHeight + 12}" font-family="monospace" font-size="11" font-weight="600" text-anchor="middle" fill="#334155">${code}</text>
  </svg>`;
}
