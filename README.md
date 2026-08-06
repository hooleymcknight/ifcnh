# if/cnh Discord Bot

A deliberately small bot for a games-only server: incident reports, anonymous
usage stats, and a few markdown documents synced into channels.

## Setup

```bash
npm install
cp .env.example .env    # then fill it in
npm run register        # registers /report with the guild
npm start
```

Requires Node 20.6+ for `--env-file`.

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Runs the bot (reports, usage tracking) |
| `npm run dev` | Same, with nodemon |
| `npm run register` | Registers slash commands to the guild |
| `npm run sync:rules` | Posts/updates `content/rules.md` in the rules channel |
| `npm run sync:reference` | Posts/updates the mod reference sheet |
| `npm run sync:welcome` | Posts/updates the pinned welcome message |

The three sync commands are idempotent: the first run posts, every run after
edits the same messages in place. That's what keeps the reference sheet's jump
links valid. The `*-ids.json` files in `content/` map sections to message IDs —
**back them up.** Losing one means the next sync posts a duplicate set instead
of editing.

## Privacy

The bot has no `MessageContent` intent, so it cannot read what anyone says. It
counts messages and voice sessions only. User IDs are HMAC-hashed with
`USER_HASH_KEY` before they ever touch disk, and same-day active-member sets
collapse to plain counts once the day rolls over.

`USER_HASH_KEY` is keep-forever — rotating it orphans every hash already
stored.

## Reports

`/report` and the Report button open the same modal. The description field is
required; everything else is optional, including the reporter's identity, which
is only attached if they tick the box. Screenshots are re-uploaded rather than
linked, because the originals are ephemeral attachments that expire.

If `REPORT_FORM_URL` is set, a link button to it appears beside the Report
button. Link buttons need no handler, so the form keeps working when the bot
doesn't.

## Planned

- Report queries against the usage JSON (most-used channels, quiet hours)
- Consider moving usage data out of a JSON file if it gets big
