const { google } = require('googleapis');
const fs = require('fs');
const HEADER = ['발행일', '리포트 제목', '링크', '번호', '아이디어 제목', '내용(실행 방법)', '수익화 모델·수치'];
const ID_RE = /\/signals\/business-mnlbecto-6bac\/([0-9a-f-]{36})/;

async function connect(sheetUrl, keyPath, tab) {
  const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  const auth = new google.auth.JWT({ email: key.client_email, key: key.private_key, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
  const api = google.sheets({ version: 'v4', auth });
  const m = sheetUrl.match(/\/d\/([\w-]+)/);
  const spreadsheetId = m ? m[1] : sheetUrl.trim();
  const meta = await api.spreadsheets.get({ spreadsheetId });
  if (!meta.data.sheets.some((s) => s.properties.title === tab)) {
    await api.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: [{ addSheet: { properties: { title: tab } } }] } });
  }
  const cur = await api.spreadsheets.values.get({ spreadsheetId, range: `'${tab}'!A:G` }).then((r) => r.data.values || []);
  if (cur.length === 0) {
    await api.spreadsheets.values.update({ spreadsheetId, range: `'${tab}'!A1`, valueInputOption: 'RAW', requestBody: { values: [HEADER] } });
  }
  const done = new Set(cur.slice(1).map((r) => (r[2] || '').match(ID_RE)?.[1]).filter(Boolean));
  return { api, spreadsheetId, done, email: key.client_email };
}
async function append(ctx, tab, rows) {
  if (!rows.length) return;
  await ctx.api.spreadsheets.values.append({
    spreadsheetId: ctx.spreadsheetId, range: `'${tab}'!A1`, valueInputOption: 'USER_ENTERED', insertDataOption: 'INSERT_ROWS',
    requestBody: { values: rows },
  });
}
module.exports = { connect, append };
