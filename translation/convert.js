// 翻訳ファイルの移行（古い版の翻訳ファイル → 新しい版の並び）。ブラウザ（convert.html）と Node（convert_test.js）の両方で使う
//   IJConvert.convert(古い翻訳, 新しい template) → { head, cats, rows, removed, stats }
//   IJConvert.build(結果, { keepRemoved }) → 書き出す JSON
(function (root) {
  'use strict';
  // 入れ子のカテゴリを平らにする（同じ原文が二度あれば、訳のあるほうを使う）
  function flat(strings) {
    const m = new Map();
    (function put(o, cat) {
      for (const [k, v] of Object.entries(o || {})) {
        if (v && typeof v === 'object') put(v, k);
        else if (typeof v === 'string' && (!m.has(k) || !m.get(k).v)) m.set(k, { v, cat });
      }
    })(strings, '');
    return m;
  }
  // 残しておくべき印（{0} と HTML タグ）の、種類ごとの数が合っているか。合わないものの名前を返す
  function marks(s) {
    const c = new Map();
    for (const x of s.match(/\{\d+\}|<\/?(?:b|i|u|s|em|strong|small|span|br|p|div)(?:\s[^<>]*)?\/?>/gi) || []) c.set(x, (c.get(x) || 0) + 1);
    return c;
  }
  function markDiff(ja, t) {
    const a = marks(ja), b = marks(t), bad = [];
    for (const k of new Set([...a.keys(), ...b.keys()])) {
      // {0} は、訳で二度使うことも許す（あるか無いかだけを見る）。タグは数も見る
      if (k[0] === '{' ? a.has(k) !== b.has(k) : (a.get(k) || 0) !== (b.get(k) || 0)) bad.push(k);
    }
    return bad;
  }
  // 似ている度合い（1文字と2文字の組の重なり。0〜1）
  function grams(s) {
    const c = new Map();
    for (let i = 0; i < s.length; i++) for (const g of i + 1 < s.length ? [s[i], s[i] + s[i + 1]] : [s[i]]) c.set(g, (c.get(g) || 0) + 1);
    return c;
  }
  function similar(a, b) {
    let n = 0, la = 0, lb = 0;
    for (const v of a.values()) la += v;
    for (const v of b.values()) lb += v;
    if (!la || !lb || Math.min(la, lb) / Math.max(la, lb) < 0.35) return 0;
    for (const [k, v] of a) n += Math.min(v, b.get(k) || 0);
    return (2 * n) / (la + lb);
  }
  const bare = (s) => s.replace(/[\s、。，．,.!！?？…・—ー〜～「」『』（）()]/g, '');   // 句読点や空白を除いた中身

  // old: 古い翻訳ファイル / tpl: 新しい版の template.json
  function convert(old, tpl) {
    if (!old || typeof old !== 'object' || !old.strings || typeof old.strings !== 'object') throw new Error('old');
    if (!tpl || typeof tpl !== 'object' || !tpl.strings || typeof tpl.strings !== 'object') throw new Error('template');
    const om = flat(old.strings), tm = flat(tpl.strings);
    const pend = new Map(Object.entries(old._review || {}).filter(([, r]) => r && typeof r.old === 'string' && typeof r.translation === 'string'));   // 前回の移行で「要確認」のまま残したもの
    const prevGone = new Map(Object.entries(old._removed || {}).filter(([, v]) => typeof v === 'string' && v));
    const rows = new Map();
    for (const [ja] of tm) {
      const o = om.get(ja);
      if (o && o.v) rows.set(ja, { ja, t: o.v, st: 'same' });
      else if (prevGone.has(ja)) rows.set(ja, { ja, t: prevGone.get(ja), st: 'same' });   // 一度無くなって、また戻ってきた文
      else rows.set(ja, { ja, t: '', st: o && !pend.has(ja) ? 'blank' : 'new' });
    }
    // 新しい版に無い、訳済みの文
    const gone = new Map();
    for (const [ja, v] of prevGone) if (!tm.has(ja)) gone.set(ja, v);
    for (const [ja, o] of om) if (o.v && !tm.has(ja)) gone.set(ja, o.v);
    const used = new Set();
    const review = (r, from, t) => { r.st = 'review'; r.from = from; r.cand = t; r.minor = bare(from) === bare(r.ja); used.add(from); };
    for (const [ja, p] of pend) { const r = rows.get(ja); if (r && !r.t) review(r, p.old, p.translation); else if (!r && !gone.has(p.old) && !tm.has(p.old)) gone.set(p.old, p.translation); }
    // 増えた文と、無くなった文の似ているものを、似ている順に一対一で結ぶ
    const g = [...gone.keys()].filter((ja) => !used.has(ja)).map((ja) => ({ ja, g: grams(ja), b: bare(ja) })), pairs = [];
    for (const r of rows.values()) {
      if (r.st !== 'new') continue;
      const rg = grams(r.ja), rb = bare(r.ja);
      for (const x of g) {
        const s = rb && rb === x.b ? 1 : similar(rg, x.g);
        if (s >= 0.55) pairs.push([s, r, x.ja]);
      }
    }
    pairs.sort((a, b) => b[0] - a[0]);
    for (const [, r, from] of pairs) if (r.st === 'new' && !used.has(from)) review(r, from, gone.get(from));
    for (const r of rows.values()) if (r.t) r.bad = markDiff(r.ja, r.t);
    const removed = [...gone].filter(([ja]) => !used.has(ja));
    const n = (st) => [...rows.values()].filter((r) => r.st === st).length;
    return { old, tpl, rows, removed, stats: { total: rows.size, same: n('same'), blank: n('blank'), new: n('new'), review: n('review'), removed: removed.length } };
  }

  // 書き出す形: 並びとカテゴリは新しい版のとおり。_review（まだ決めていない要確認）と _removed（無くなった文の訳）は、ゲームは読まない
  function build(res, opt) {
    const { old, tpl, rows, removed } = res, out = {};
    out.code = typeof old.code === 'string' ? old.code : 'xx';
    out.name = typeof old.name === 'string' ? old.name : out.code;
    if (tpl.version) out.version = tpl.version;
    if (Array.isArray(old.fixes)) out.fixes = old.fixes;
    const copy = (o) => { const r = {}; for (const [k, v] of Object.entries(o)) r[k] = v && typeof v === 'object' ? copy(v) : rows.get(k).t; return r; };
    out.strings = copy(tpl.strings);
    const gone = Object.fromEntries(removed);
    if (opt && opt.keepRemoved && removed.length) out.strings['（旧版のみ / old only）'] = gone;
    const rev = {};
    for (const r of rows.values()) if (r.st === 'review' && !r.t) rev[r.ja] = { old: r.from, translation: r.cand };
    if (Object.keys(rev).length) out._review = rev;
    if (removed.length && !(opt && opt.keepRemoved)) out._removed = gone;
    return out;
  }

  // 文字の差分: [種類, 文字列] の並び（0 同じ・-1 古いほうだけ・1 新しいほうだけ）
  function diff(a, b) {
    const A = [...a], B = [...b], n = A.length, m = B.length, W = m + 1, d = new Uint16Array((n + 1) * W), out = [];
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) d[i * W + j] = A[i] === B[j] ? d[(i + 1) * W + j + 1] + 1 : Math.max(d[(i + 1) * W + j], d[i * W + j + 1]);
    const add = (k, c) => { const l = out[out.length - 1]; if (l && l[0] === k) l[1] += c; else out.push([k, c]); };
    let i = 0, j = 0;
    while (i < n || j < m) {
      if (i < n && j < m && A[i] === B[j]) { add(0, A[i]); i++; j++; }
      else if (j >= m || (i < n && d[(i + 1) * W + j] >= d[i * W + j + 1])) add(-1, A[i++]);
      else add(1, B[j++]);
    }
    return out;
  }
  root.IJConvert = { convert, build, diff, markDiff };
  if (typeof module !== 'undefined') module.exports = root.IJConvert;
})(typeof globalThis !== 'undefined' ? globalThis : this);
