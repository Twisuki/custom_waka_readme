# Waka Test Profile

Sanity check for `custom_waka_readme`. Renders Wakatime stats into a markdown body
and writes the result to `test.md` next to this file.

## Summary

This week I coded for **{waka.week.time / 3600} hrs**, all time **{waka.all.time / 3600} hrs**.

Range covers {waka.week.range.days} days, from `{waka.week.range.start}` to `{waka.week.range.end}`.

## Top 3 Languages This Week

<!--CUSTOM_WAKA_START-->

const topLangs = languages.week
.slice(0, 3)
.map((l, i) => `${i + 1}. **${l.name}** - ${(l.time / 3600).toFixed(2)} hrs`)
.join("\n")
<!--CUSTOM_WAKA_END-->

{topLangs}

## Top 3 Editors All Time

<!--CUSTOM_WAKA_START-->

const topEditors = editors.all
.slice(0, 3)
.map((e, i) => `${i + 1}. ${e.name} - ${(e.time / 3600).toFixed(2)} hrs`)
.join("\n")
<!--CUSTOM_WAKA_END-->

{topEditors}

## Literal Brace Test

The next line must contain literal braces, not be evaluated:

Raw token in source: {waka.all.time}
Escaped literal: {{waka.all.time}}
Double escaped: {{{waka.all.time}}}

## Null Safety Check

If `categories.week` exists, dump a count; otherwise print a placeholder.

<!--CUSTOM_WAKA_START-->

const n = categories.week ? categories.week.length : 0
const line = categories.week
? `categories.week has ${n} entries`
: `categories.week is null (fetch failed)`
<!--CUSTOM_WAKA_END-->

{line}
