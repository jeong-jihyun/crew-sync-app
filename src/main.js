const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { openWin, collectLinks, readReport, sleep } = require('./scraper');
const { parseIdeas } = require('./parser');
const sheets = require('./sheets');

const cfgFile = () => path.join(app.getPath('userData'), 'settings.json');
const loadCfg = () => { try { return JSON.parse(fs.readFileSync(cfgFile(), 'utf8')); } catch { return {}; } };
const saveCfg = (c) => fs.writeFileSync(cfgFile(), JSON.stringify(c, null, 2));
const findDate = (s = '') => {
  let m = s.match(/(20\d{2})[-./]\s?(\d{1,2})[-./]\s?(\d{1,2})/) || s.match(/(20\d{2})년\s*(\d{1,2})월\s*(\d{1,2})일/);
  return m ? `${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}` : '';
};

let win, running = false, stopFlag = false;
app.whenReady().then(() => {
  win = new BrowserWindow({ width: 820, height: 760, webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true } });
  win.loadFile(path.join(__dirname, 'index.html'));
});
app.on('window-all-closed', () => app.quit());

ipcMain.handle('cfg:get', () => loadCfg());
ipcMain.handle('pick-key', async () => {
  const r = await dialog.showOpenDialog(win, { filters: [{ name: 'JSON', extensions: ['json'] }], properties: ['openFile'] });
  return r.canceled ? null : r.filePaths[0];
});
ipcMain.on('stop', () => { stopFlag = true; });

ipcMain.handle('run', async (_e, opt) => {
  if (running) return;
  running = true; stopFlag = false;
  saveCfg({ sheet: opt.sheet, keyPath: opt.keyPath, tab: opt.tab, limit: opt.limit });
  const log = (m) => win.webContents.send('log', m);
  const prog = (a, b) => win.webContents.send('progress', { a, b });
  let w;
  try {
    const tab = opt.tab || '아이디어';
    log('구글 시트 연결 중…');
    const ctx = await sheets.connect(opt.sheet, opt.keyPath, tab);
    log(`연결됨 (${ctx.email}) · 시트에 이미 있는 리포트 ${ctx.done.size}편`);
    w = await openWin();
    const items = await collectLinks(w, log);
    let todo = items.filter((i) => !ctx.done.has(i.id));
    if (opt.limit > 0) todo = todo.slice(0, opt.limit);
    log(`새로 처리할 리포트 ${todo.length}편`);
    const failed = []; let batch = [], okCount = 0;
    for (let k = 0; k < todo.length; k++) {
      if (stopFlag) { log('사용자가 중지함'); break; }
      const it = todo[k];
      try {
        const { title, body } = await readReport(w, it.url);
        const date = findDate(it.card) || findDate(body);
        const ideas = parseIdeas(body);
        if (ideas.length < 5) { failed.push(it.url); batch.push([date, title, it.url, 0, '(자동 추출 실패 - 원문)', body.slice(0, 3000), '']); }
        else { okCount++; ideas.forEach(([n, t, c, m]) => batch.push([date, title, it.url, n, t, c, m])); }
        log(`[${k + 1}/${todo.length}] ${date} ${title.slice(0, 40)} → ${ideas.length === 5 ? 'OK' : '추출 실패'}`);
      } catch (e) { failed.push(it.url); log(`[${k + 1}/${todo.length}] 오류 ${it.url}: ${e.message}`); }
      prog(k + 1, todo.length);
      if (batch.length >= 50 && !opt.dryRun) { await sheets.append(ctx, tab, batch); log(`시트에 ${batch.length}행 저장`); batch = []; }
      await sleep(400);
    }
    if (opt.dryRun) log(`(시험 실행: 시트에 쓰지 않음) 미리보기 ${batch.length}행 중 첫 행: ${JSON.stringify(batch[0] || [])}`);
    else if (batch.length) { await sheets.append(ctx, tab, batch); log(`시트에 ${batch.length}행 저장`); }
    log(`완료: 성공 ${okCount}편, 수동 확인 필요 ${failed.length}편`);
    failed.forEach((u) => log('  확인 필요: ' + u));
  } catch (e) { log('오류: ' + e.message); }
  finally { try { w && w.destroy(); } catch {} running = false; }
});
