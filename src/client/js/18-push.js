/* sıra sende bildirimi (sunucuda): izin iste, abone ol, aboneliği sunucuya gönder */
let pushNote = '';
const b64u = s => {
  const p = '='.repeat((4 - (s.length % 4)) % 4),
    b = atob((s + p).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(b, c => c.charCodeAt(0));
};
function setRefresh() {
  const el = document.getElementById('setv');
  if (el && setOpen) {
    const sb = el.querySelector('.sbody'),
      y = sb ? sb.scrollTop : 0;
    el.innerHTML = setH();
    const sb2 = el.querySelector('.sbody');
    if (sb2) sb2.scrollTop = y;
  }
}
async function pushToggle(on) {
  if (!SRV) {
    pushNote = '';
    SET.push = false;
    saveSet();
    setRefresh();
    return;
  }
  try {
    if (!on) {
      SET.push = false;
      saveSet();
      try {
        const r = await navigator.serviceWorker.ready;
        const sub = await r.pushManager.getSubscription();
        if (sub) {
          await SRV.call({ op: 'push', off: true, ep: sub.endpoint });
          await sub.unsubscribe();
        }
      } catch (e) {}
      pushNote = '';
      setRefresh();
      return;
    }
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || typeof Notification === 'undefined') {
      pushNote = isStandalone()
        ? 'Bu telefon bildirimi desteklemiyor.'
        : 'Bu tarayıcı bildirimi desteklemiyor. iPhone\'da önce Paylaş → "Ana Ekrana Ekle", sonra uygulamadan aç.';
      SET.push = false;
      saveSet();
      setRefresh();
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') {
      pushNote = 'Bildirim izni verilmedi. Telefon ayarlarından izin verebilirsin.';
      SET.push = false;
      saveSet();
      setRefresh();
      return;
    }
    const k = await SRV.call({ op: 'pushKey' });
    if (!k || !k.ok || !k.key) {
      pushNote = 'Sunucu bildirim göndermeye hazır değil.';
      SET.push = false;
      saveSet();
      setRefresh();
      return;
    }
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(k.key) });
    const r = await SRV.call({ op: 'push', sub: sub.toJSON() });
    if (!r || !r.ok) throw new Error('kayıt');
    SET.push = true;
    saveSet();
    pushNote = 'Açık: sıra sana gelince bildirim gelir.';
  } catch (e) {
    SET.push = false;
    saveSet();
    pushNote = 'Bildirim açılamadı, tekrar dene.';
  }
  setRefresh();
}
/* sayfa arka plana geçince sunucuya haber ver (bildirim sadece bakmıyorken gelsin) */
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function')
  document.addEventListener('visibilitychange', () => {
    try {
      if (SRV && SRV.live) SRV.call({ op: 'vis', hidden: !!document.hidden }).catch(() => {});
    } catch (e) {}
  });
