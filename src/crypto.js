// Cifrado AES-256-GCM de campos sensibles (autenticado: detecta manipulación).
const crypto = require('crypto');
let key;
const getKey = () => (key ||= Buffer.from(process.env.DATA_KEY, 'hex'));

function enc(text) {
  if (text === null || text === undefined) return null;
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const ct = Buffer.concat([c.update(String(text), 'utf8'), c.final()]);
  return ['v1', iv.toString('base64'), c.getAuthTag().toString('base64'), ct.toString('base64')].join(':');
}

function dec(value) {
  if (value === null || value === undefined) return null;
  try {
    const [v, iv, tag, ct] = String(value).split(':');
    if (v !== 'v1') throw new Error('formato');
    const d = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(iv, 'base64'));
    d.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([d.update(Buffer.from(ct, 'base64')), d.final()]).toString('utf8');
  } catch {
    return '[no se pudo descifrar]';
  }
}

module.exports = { enc, dec };
