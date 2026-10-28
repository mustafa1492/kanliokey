# Simge ve paylaşım görseli üretir (bir kere çalıştırılır, çıktılar src/assets'e kaydedilir).
# Gerekenler: python3 + playwright (chromium). Kullanım: python3 tools/assets.py
import asyncio,os
from playwright.async_api import async_playwright
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A=os.path.join(ROOT,'src','assets')
LOGO=open(os.path.join(A,'logo.svg'),encoding='utf8').read()
BG="radial-gradient(120% 90% at 50% 15%,#4a1412 0%,#1f0c0a 55%,#0b0606 100%)"
def icon(size,pad):
    return f"""<html lang="tr"><body style="margin:0;width:{size}px;height:{size}px;background:{BG};display:grid;place-items:center">
<div style="width:{size*(1-2*pad)}px;height:{size*(1-2*pad)}px">{LOGO.replace('<svg ','<svg width="100%" height="100%" ')}</div></body></html>"""
OG=f"""<html lang="tr"><head><meta charset="utf-8"><style>
body{{margin:0;width:1200px;height:630px;background:{BG};font-family:'Inter Display','Inter',sans-serif;color:#f6eed4;overflow:hidden;position:relative}}
.felt{{position:absolute;right:-180px;bottom:-330px;width:900px;height:720px;border-radius:50%;background:radial-gradient(60% 60% at 50% 40%,#27774f 0%,#18533b 55%,#0c3225 100%);box-shadow:0 0 0 18px #2a0508,0 0 0 26px #84131b,0 0 80px #000}}
.logo{{position:absolute;left:70px;top:95px;width:250px;height:250px;filter:drop-shadow(0 18px 30px #000a)}}
.wm{{position:absolute;left:340px;top:120px;font-weight:900;font-size:128px;line-height:.9;letter-spacing:-1px;text-transform:uppercase}}
.wm .k{{color:#e3262f;text-shadow:0 6px 0 #6d0a10}}
.sub{{position:absolute;left:346px;top:380px;font:600 34px/1.3 'Inter',sans-serif;color:#e8d9c2;max-width:520px}}
.tiles{{position:absolute;left:790px;top:478px;display:flex;gap:10px;transform:rotate(-6deg)}}
.t{{width:66px;height:92px;border-radius:10px;background:linear-gradient(165deg,#fffcf3,#f3ead2 55%,#dccfa9);box-shadow:0 5px 0 #b5a97f,0 9px 0 #8a7a55,0 16px 20px #000a;display:grid;place-items:center;font:800 48px/1 'Inter',sans-serif}}
.r{{color:#d3241b}}.b{{color:#1b54d6}}.y{{color:#c27600}}.k2{{color:#1b1b1b}}
.tag{{position:absolute;left:70px;bottom:52px;font:700 26px/1 'Inter',sans-serif;letter-spacing:4px;color:#e8b93a;text-transform:uppercase}}
</style></head><body><div class="felt"></div><div class="logo">{LOGO.replace('<svg ','<svg width="100%" height="100%" ')}</div>
<div class="wm"><span class="k">Kanlı</span><br>Okey</div>
<div class="sub">Arkadaşlarınla telefondan oyna. Kodu paylaş, masaya otur.</div>
<div class="tiles"><div class="t r">7</div><div class="t b">8</div><div class="t y">9</div><div class="t k2">10</div></div>
<div class="tag">4 kişilik · yöresel okey</div></body></html>"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for name,size,pad in [('icon-192.png',192,.1),('icon-512.png',512,.1),('icon-maskable.png',512,.2),('apple-touch-icon.png',180,.08)]:
            pg=await b.new_page(viewport={'width':size,'height':size})
            await pg.set_content(icon(size,pad));await pg.screenshot(path=os.path.join(A,name));await pg.close()
        pg=await b.new_page(viewport={'width':1200,'height':630})
        await pg.set_content(OG);await pg.wait_for_timeout(200);await pg.screenshot(path=os.path.join(A,'og.png'));await pg.close()
        from PIL import Image
        im=Image.open(os.path.join(A,'og.png')).convert('RGB');im.save(os.path.join(A,'og.jpg'),quality=84,optimize=True,progressive=True);os.remove(os.path.join(A,'og.png'))
        for n in ['icon-512.png','icon-maskable.png']:
            im=Image.open(os.path.join(A,n)).convert('RGB').quantize(colors=256,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.FLOYDSTEINBERG);im.save(os.path.join(A,n),optimize=True)
        await b.close()
asyncio.run(main())
