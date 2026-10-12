const { BrowserWindow } = require('electron');
const FEED = 'https://crew.you/signals/business-mnlbecto-6bac';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function openWin() {
  return new BrowserWindow({ show: false, width: 1280, height: 900, webPreferences: { sandbox: true, contextIsolation: true } });
}
async function load(win, url) {
  await win.loadURL(url);
  await sleep(2500); // 클라이언트 렌더링 대기
}

// 피드를 열고 'Load more'를 끝까지 눌러 모든 리포트 링크를 수집
async function collectLinks(win, log) {
  await load(win, FEED);
  const js = `(async () => {
    const sel = "a[href*='/signals/business-mnlbecto-6bac/']";
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    for (let k = 0; k < 300; k++) {
      const btn = [...document.querySelectorAll('button')].find(b => /load more|더 ?보기/i.test(b.innerText) && b.offsetParent);
      if (!btn) break;
      const before = document.querySelectorAll(sel).length;
      btn.click();
      let grew = false;
      for (let w = 0; w < 24; w++) { await sleep(500); if (document.querySelectorAll(sel).length > before) { grew = true; break; } }
      if (!grew) break;
    }
    const seen = new Set(), out = [];
    for (const a of document.querySelectorAll(sel)) {
      const m = a.getAttribute('href').match(/\\/signals\\/business-mnlbecto-6bac\\/([0-9a-f-]{36})/);
      if (!m || seen.has(m[1])) continue;
      seen.add(m[1]); out.push({ id: m[1], url: 'https://crew.you' + m[0], card: a.innerText });
    }
    return out;
  })()`;
  const items = await win.webContents.executeJavaScript(js);
  log(`피드 전체 링크 ${items.length}개 수집`);
  return items;
}

async function readReport(win, url) {
  await load(win, url);
  return win.webContents.executeJavaScript(`({
    title: (document.querySelector('h1')?.innerText || document.title || '').trim(),
    body: (document.querySelector('main') || document.body).innerText
  })`);
}
module.exports = { openWin, collectLinks, readReport, sleep };
