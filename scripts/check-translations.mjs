// Checks every translation against en.json: same keys, valid ICU syntax, same placeholders and tags.

import fs from 'node:fs';
import { parse, TYPE } from '@formatjs/icu-messageformat-parser';
const dir = new URL('../shared/i18n/messages/', import.meta.url).pathname;
const flat = (o, p = '') =>
    Object.entries(o).flatMap(([k, v]) =>
        typeof v === 'object' ? flat(v, p + k + '.') : [[p + k, v]],
    );
const sig = (msg) => {
    const args = new Set(),
        tags = new Set();
    const walk = (els) => {
        for (const e of els) {
            if (
                e.type === TYPE.argument ||
                e.type === TYPE.number ||
                e.type === TYPE.date ||
                e.type === TYPE.time
            )
                args.add(e.value);
            if (e.type === TYPE.plural || e.type === TYPE.select) {
                args.add(e.value);
                Object.values(e.options).forEach((o) => walk(o.value));
            }
            if (e.type === TYPE.tag) {
                tags.add(e.value);
                walk(e.children);
            }
        }
    };
    walk(parse(msg));
    return [...args].sort().join(',') + '|' + [...tags].sort().join(',');
};
const en = Object.fromEntries(flat(JSON.parse(fs.readFileSync(dir + 'en.json'))));
let bad = 0;
for (const file of fs
    .readdirSync(dir)
    .filter((f) => f !== 'en.json' && f.endsWith('.json'))
    .sort()) {
    const t = Object.fromEntries(flat(JSON.parse(fs.readFileSync(dir + file))));
    const problems = [];
    for (const k of Object.keys(en)) {
        if (!(k in t)) {
            problems.push('missing ' + k);
            continue;
        }
        try {
            if (sig(t[k]) !== sig(en[k]))
                problems.push(`placeholders ${k}: ${sig(t[k])} vs ${sig(en[k])}`);
        } catch (e) {
            problems.push(`syntax ${k}: ${e.message}`);
        }
    }
    for (const k of Object.keys(t)) if (!(k in en)) problems.push('extra ' + k);
    bad += problems.length;
    console.log(file, problems.length ? '\n  ' + problems.join('\n  ') : 'OK');
}
process.exit(bad ? 1 : 0);
