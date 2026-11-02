/* Kalıcı kayıt: sunucunun bütün durumu Supabase'de de tutulur (Render ücretsiz planda disk her uykuda ve güncellemede silinir).
   Veri dışarıya kapalı bir tabloda; sadece KO_DB_TOKEN'ı bilen sunucu public.ko_load / public.ko_save ile okur ve yazar.
   Ortam değişkenleri: KO_DB_TOKEN (gizli, sadece Render panelinde), isteğe bağlı SUPABASE_URL, SUPABASE_KEY. */
const URL = process.env.SUPABASE_URL || 'https://cdahgkqxserpslasboed.supabase.co';
const KEY = process.env.SUPABASE_KEY || 'sb_publishable_PJmwO58mucAViRZpc6KF0A_BEVYEkKf'; /* herkese açık anahtar, gizli değil */
const TOK = String(process.env.KO_DB_TOKEN || '');
const on = !!TOK && typeof fetch === 'function';

async function rpc(fn, body, ms) {
  const ctl = new AbortController(),
    t = setTimeout(() => ctl.abort(), ms || 10000);
  try {
    const r = await fetch(URL + '/rest/v1/rpc/' + fn, {
      method: 'POST',
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tok: TOK, ...body }),
      signal: ctl.signal
    });
    const txt = await r.text();
    if (!r.ok) throw new Error(fn + ' ' + r.status + ' ' + txt.slice(0, 160));
    return txt ? JSON.parse(txt) : null;
  } finally {
    clearTimeout(t);
  }
}
/* kayıtlı durumu getirir: {v,at,store,tokens} ya da null */
const load = () => rpc('ko_load', { key: 'state' }, 15000);
/* durumu yazar; snap = JSON metni (diske yazılanla aynı) */
const save = (snap, ms) => rpc('ko_save', { key: 'state', data: JSON.parse(snap) }, ms);

module.exports = { on, load, save };
