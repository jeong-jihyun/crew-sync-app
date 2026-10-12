const $ = (id) => document.getElementById(id);
const log = (m) => { const l = $('log'); l.textContent += m + '\n'; l.scrollTop = l.scrollHeight; };
api.cfg().then((c) => { $('sheet').value = c.sheet || ''; $('key').value = c.keyPath || ''; $('tab').value = c.tab || '아이디어'; $('limit').value = c.limit || 0; });
$('pick').onclick = async () => { const p = await api.pickKey(); if (p) $('key').value = p; };
$('go').onclick = () => {
  if (!$('sheet').value || !$('key').value) return log('시트 주소와 키 파일을 먼저 입력하세요.');
  $('log').textContent = '';
  api.run({ sheet: $('sheet').value.trim(), keyPath: $('key').value, tab: $('tab').value.trim(), limit: Number($('limit').value) || 0, dryRun: $('dry').checked });
};
$('stop').onclick = () => api.stop();
api.onLog(log);
api.onProgress(({ a, b }) => { $('p').max = b || 1; $('p').value = a; });
