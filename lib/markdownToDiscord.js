/* returns a code-block-wrapped aligned table */
function tableToBlock (rows) {
    const cells = rows.map((line) =>
        line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.replace(/\*\*/g, '').trim())
    );
    const body = cells.filter((r) => !r.every((c) => /^:?-+:?$/.test(c)));
    const widths = body[0].map((_, i) => Math.max(...body.map((r) => (r[i] || '').length)));
    const lines = body.map((r) => r.map((c, i) => (c || '').padEnd(widths[i])).join('  ').trimEnd());
    return ['```', ...lines, '```'];
}

/**
 * Converts GitHub-flavored markdown into something Discord's renderer can handle.
 *
 * Discord supports most inline markdown but has no table syntax and no
 * horizontal rules, so this does two things: pipe tables are collected and
 * handed to tableToBlock (which returns them as an aligned code block), and
 * `---` separator lines are dropped, since `##` headers already provide
 * visual separation in Discord.
 *
 * Everything else passes through untouched.
 *
 * @param {string} raw - Markdown source text.
 * @returns {string} The same text with tables converted and rules removed.
 */
function normalize (raw) {
    const out = [];
    let table = [];

    for (const line of raw.split('\n')) {
        if (line.trim().startsWith('|')) {
            table.push(line);
            continue;
        }
        if (table.length) {
            out.push(...tableToBlock(table));
            table = [];
        }
        if (/^\s*---+\s*$/.test(line)) continue;
        out.push(line);
    }
    if (table.length) out.push(...tableToBlock(table));

    return out.join('\n');
}

/**
 * Splits a markdown document into sections, one per `##` heading.
 *
 * Each section keeps its own heading line as the first entry in `lines`, so
 * the chunk stays self-contained when posted on its own. Deeper headings
 * (`###` and below) stay inside their parent section rather than starting a
 * new one.
 *
 * Note: content before the first `##` is discarded, including a leading `#`
 * title and any introductory text.
 *
 * @param {string} text - Normalized markdown source.
 * @returns {Array<{title: string, lines: string[]}>} Sections in document
 *   order. `title` is the heading text with `##` stripped; `lines` includes
 *   the heading itself.
 */
function splitSections (text) {
    const sections = [];
    let current = null;

    for (const line of text.split('\n')) {
        if (/^## /.test(line)) {
            if (current) sections.push(current);
            current = { title: line.replace(/^##\s*/, '').trim(), lines: [line] };
        } else if (current) {
            current.lines.push(line);
        }
    }
    if (current) sections.push(current);
    return sections;
}

/**
 * Packs lines into chunks that fit Discord's per-message character cap.
 *
 * Splits on blank lines so paragraphs, list blocks, and code fences aren't
 * broken mid-structure, then fills each chunk as full as it can. A single
 * paragraph longer than `limit` is emitted as its own oversized chunk rather
 * than being cut — Discord will reject it, which is louder and easier to
 * diagnose than silently mangled output.
 *
 * @param {string[]} lines - Lines belonging to one section.
 * @param {number} [limit=1900] - Max characters per chunk. Defaults below
 *   Discord's 2000 cap to leave headroom.
 * @returns {string[]} One or more chunks, in order.
 */
function pack (lines, LIMIT) {
    const chunks = [];
    let buffer = '';

    for (const para of lines.join('\n').split(/\n{2,}/)) {
        const next = buffer ? `${buffer}\n\n${para}` : para;
        if (next.length > LIMIT && buffer) {
            chunks.push(buffer);
            buffer = para;
        } else {
            buffer = next;
        }
    }
    if (buffer.trim()) chunks.push(buffer);
    return chunks;
}

module.exports = { normalize, splitSections, pack }