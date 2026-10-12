// 리포트 본문에서 '5가지 아이디어'를 뽑는 규칙 파서 (토큰 0)
const NUM_RE = /^\s*(?:#{1,6}\s*)?(?:\*\*)?(?:아이디어\s*)?(\d)\s*[.):：]\s*(?:\*\*)?\s*(.+?)\s*(?:\*\*)?\s*$/;
const MONEY_RE = /(\$\s?[\d,]+(?:\s?[~\-–]\s?\$?[\d,]+)?(?:K|M)?|[\d,]+\s?(?:달러|만원|원|%))/g;
const clean = (s) => s.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();

function findSeq(lines, from) {
  const hits = [];
  let expect = 1;
  for (let i = from; i < lines.length && expect <= 5; i++) {
    const m = NUM_RE.exec(lines[i]);
    if (m && Number(m[1]) === expect) { hits.push([i, expect, clean(m[2])]); expect++; }
  }
  return hits;
}

function parseIdeas(text) {
  const lines = text.split(/\r?\n/);
  let hits = findSeq(lines, 0);
  if (hits.length < 5) {
    const starts = [];
    lines.forEach((l, i) => { const m = NUM_RE.exec(l); if (m && m[1] === '1') starts.push(i); });
    for (const s of starts.reverse()) { hits = findSeq(lines, s); if (hits.length === 5) break; }
  }
  if (hits.length < 5) return [];
  return hits.map(([i, n, title], k) => {
    const end = k + 1 < hits.length ? hits[k + 1][0] : Math.min(lines.length, i + 25);
    let body = clean(lines.slice(i + 1, end).filter((l) => l.trim()).join(' '));
    body = body.split(/(도구\s*트렌드|시장\s*분석|Tool Trends|Market Analysis)/)[0].trim();
    const money = [...new Set([...(title + ' ' + body).matchAll(MONEY_RE)].map((m) => m[0].replace(/^[ ,]+|[ ,]+$/g, '')))].join('; ');
    return [n, title, body.slice(0, 1500), money.slice(0, 300)];
  });
}
module.exports = { parseIdeas };
