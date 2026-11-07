# Translating FreeDAW

FreeDAW's interface is available in:

| Code    | Language           |
| ------- | ------------------ |
| `en`    | English (default)  |
| `pt-BR` | Português (Brasil) |

The app picks the browser or system language when it's supported, and falls back to English.
Anyone can override it in **Settings (⚙) → General → Language**.

## Adding a language

You only need to know your language; no audio or Rust knowledge is required.

1. **Create the locale file.** Copy `locales/pt-BR.ts` to `locales/<code>.ts`, where `<code>` is
   a [BCP 47 tag](https://www.w3.org/International/articles/language-tags/): a language (`de`,
   `fr`, `ja`), or a language and region when the variants differ (`pt-BR`, `es-419`, `zh-Hant`).
   Rename the exported constant (for example `export const de = { … } satisfies Translation;`).
2. **Translate the strings.** `locales/en.ts` is the source of truth; its comments explain the
   format. Translate the values, never the keys.
3. **Register it.** Import the file in `locales/index.ts` and add a line to `LOCALES` with the
   code and the language's name written in that language:
   ```ts
   { code: "de", name: "Deutsch", messages: de },
   ```
4. **Check it.**
   ```sh
   pnpm i18n:status <code>   # how complete it is, and which keys are missing
   pnpm typecheck            # catches misspelled or removed keys
   pnpm test                 # checks placeholders, plurals and markup
   ```
5. **Try it.** `pnpm dev:web`, then pick your language in Settings.
6. Open a pull request. Partial translations are welcome: anything missing shows in English.

## Message format

| In `en.ts`                                             | Meaning                                                                         |
| ------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `"Delete {name}"`                                      | `{name}` is filled in by the app. Keep it, in whatever position fits.           |
| `{ one: "{count} track", other: "{count} tracks" }`    | A plural. Provide the forms your language needs (see below).                    |
| `"<b>Drop audio files here</b> or use <i>Import…</i>"` | `<b>` and `<i>` mark emphasized words. Keep the tags around the matching words. |

**Plurals** use the CLDR categories `zero`, `one`, `two`, `few`, `many` and `other`. `other` is
always required; add the others your language uses. The
[CLDR plural rules](https://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html)
list them. For example, Russian uses `one`, `few`, `many` and `other`, and Japanese only
needs `other`. A plural form may leave out `{count}` ("one track").

**Numbers** passed to a message are formatted for your locale automatically (decimal comma in
`pt-BR`, for example), so don't hard-code separators.

**Built-in effects** (`devices` at the end of the file) are keyed by their English name, because
those names come from the audio engine's Rust tables. Translate the values only. The EQ shows
"Band 3 frequency" through `device.eqBand` (`"Band {n} {param}"`) and the lowercase entries
`on`, `type`, `frequency`, `gain` and `Q`.

### Style

- Use the terms musicians in your language actually use in recording software. Leave terms
  untranslated where that is the norm (many languages keep "Mixer", "Delay" or "Reverb").
- Keep it short: buttons, menus and the mixer have little room. Check long strings in the app.
- Keyboard shortcuts in parentheses, like "(Space)" or "(R)", refer to physical keys: translate
  the key's name if your keyboards label it differently, but keep the letter.
- "Tune" and "FreeDAW" are names; don't translate them.

## For developers

- Every user-facing string goes through `t("namespace.key", params)` from `packages/ui/src/i18n`.
  Components call `useT()` (or `useLocale()`) so they re-render when the language changes; plain
  functions called during render can use `t` directly. `deviceText()` translates built-in device
  names, `formatNumber()` formats decimals and `rich()` renders `<b>`/`<i>` markup.
- Text kept in state that stays on screen (progress, errors) is stored as a `Message`
  (`msg(key, params)`) and translated when rendered with `textOf()`, so it follows a language
  change. Throw `LocalizedError` instead of `Error` for messages from the catalog.
- When you add a string, add it to `locales/en.ts` only. Other languages fall back to English until
  a translator adds it; `pnpm i18n:status` shows what's missing. If you can, add the translations
  you know.
- When a new built-in device or parameter appears in the Rust tables, the "names every built-in
  device" test fails until its English name is added to `devices` in `en.ts`.
- Not translated on purpose: undo labels (internal for now; they aren't shown anywhere), error
  messages that come from the engine or the operating system, project data (track and clip names
  already created keep their names), and the desktop app's native menu.
