import { createElement, Fragment, type ReactNode, useSyncExternalStore } from "react";
import { en } from "./locales/en";
import { DEFAULT_LOCALE, LOCALES, type LocaleInfo } from "./locales";

/** Plural forms, as `Intl.PluralRules` names them. `other` is always required. */
export interface PluralForms {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}

type Shape<T> = T extends string
  ? string
  : T extends { other: string }
    ? PluralForms
    : { [K in keyof T]?: Shape<T[K]> };

/**
 * What a locale file contains: the English catalog's shape with every entry optional (missing
 * entries fall back to English). Unknown keys are type errors.
 */
export type Translation = Shape<typeof en>;

type Paths<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string | { other: string }
    ? `${Prefix}${K}`
    : Paths<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

/** Every message key, e.g. `"transport.play"`. Device names go through `deviceText` instead. */
export type MessageKey = Paths<Omit<typeof en, "devices">>;

export type MessageParams = Record<string, string | number>;

/**
 * A message kept as a key, translated when shown, so text that stays on screen (progress,
 * errors) follows a language change.
 */
export interface Message {
  key: MessageKey;
  params?: MessageParams;
}

/** A `Message`, or plain text that can't be translated (errors from the engine or the OS). */
export type UiText = Message | string;

export function msg(key: MessageKey, params?: MessageParams): Message {
  return params ? { key, params } : { key };
}

/** The text to show for `text` in the current language. */
export function textOf(text: UiText): string {
  return typeof text === "string" ? text : t(text.key, text.params);
}

/** An error whose message is a `Message`: shown translated, and re-translated on a language change. */
export class LocalizedError extends Error {
  readonly text: Message;
  constructor(key: MessageKey, params?: MessageParams) {
    super(t(key, params));
    this.name = "LocalizedError";
    this.text = msg(key, params);
  }
}

export type { LocaleInfo };
export { LOCALES };

const STORAGE_KEY = "freedaw.locale";

let current: LocaleInfo = LOCALES.find((l) => l.code === DEFAULT_LOCALE)!;
/** The user's explicit choice; `undefined` follows the system language. */
let chosen: string | undefined;
const listeners = new Set<() => void>();

/** Translates `key` in the current locale, falling back to English, then to the key itself. */
export function t(key: MessageKey, params?: MessageParams): string {
  const entry = lookup(current.messages, key) ?? lookup(en, key);
  if (entry === undefined) return key;
  return interpolate(select(entry, params?.count), params);
}

/** A built-in device, parameter or choice name (English text from the Rust device tables). */
export function deviceText(english: string): string {
  const own = (current.messages.devices as Record<string, string> | undefined)?.[english];
  if (own) return own;
  // EQ band parameters: "Band 3 frequency".
  const band = /^Band (\d+) (.+)$/.exec(english);
  if (band) return t("device.eqBand", { n: Number(band[1]), param: deviceText(band[2]!) });
  return english;
}

/** `value` with exactly `digits` decimals in the current locale (no digit grouping). */
export function formatNumber(value: number, digits = 0): string {
  const key = `${current.code}:${digits}`;
  let format = numberFormats.get(key);
  if (!format) {
    format = new Intl.NumberFormat(current.code, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
      useGrouping: false,
    });
    numberFormats.set(key, format);
  }
  return format.format(value);
}
const numberFormats = new Map<string, Intl.NumberFormat>();

/**
 * Renders a message containing `<tag>text</tag>` markup: each tag's text is passed to the
 * matching renderer (unknown tags render as plain text).
 */
export function rich(message: string, tags: Record<string, (text: string) => ReactNode>): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /<(\w+)>(.*?)<\/\1>/g;
  let last = 0;
  for (let m = re.exec(message); m; m = re.exec(message)) {
    if (m.index > last) out.push(message.slice(last, m.index));
    const render = tags[m[1]!];
    out.push(createElement(Fragment, { key: out.length }, render ? render(m[2]!) : m[2]));
    last = re.lastIndex;
  }
  if (last < message.length) out.push(message.slice(last));
  return out;
}

export function getLocale(): string {
  return current.code;
}

/** The explicitly chosen locale, or `undefined` when following the system language. */
export function getChosenLocale(): string | undefined {
  return chosen;
}

/**
 * Switches the UI language and remembers the choice. `undefined` goes back to following the
 * system language.
 */
export function setLocale(code: string | undefined): void {
  chosen = code && LOCALES.some((l) => l.code === code) ? code : undefined;
  try {
    if (chosen) globalThis.localStorage?.setItem(STORAGE_KEY, chosen);
    else globalThis.localStorage?.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be unavailable (privacy modes); the choice then lasts for this session.
  }
  apply(chosen ?? matchLocale(systemLanguages()));
}

/**
 * Picks the saved or system language. Called once when the app starts (not at import time, so
 * tests always run in English).
 */
export function initLocale(): void {
  let saved: string | null | undefined;
  try {
    saved = globalThis.localStorage?.getItem(STORAGE_KEY);
  } catch {
    saved = undefined;
  }
  chosen = saved && LOCALES.some((l) => l.code === saved) ? saved : undefined;
  apply(chosen ?? matchLocale(systemLanguages()));
}

/**
 * The best supported locale for a list of preferred languages (like `navigator.languages`):
 * an exact match first, then the same base language ("pt-PT" → "pt-BR"), else English.
 */
export function matchLocale(preferred: readonly string[]): string {
  const codes = LOCALES.map((l) => l.code);
  for (const wanted of preferred) {
    const lower = wanted.toLowerCase();
    const exact = codes.find((c) => c.toLowerCase() === lower);
    if (exact) return exact;
    const base = lower.split("-")[0];
    const sameLanguage = codes.find((c) => c.toLowerCase().split("-")[0] === base);
    if (sameLanguage) return sameLanguage;
  }
  return DEFAULT_LOCALE;
}

/** Re-renders the calling component when the language changes; returns the locale code. */
export function useLocale(): string {
  return useSyncExternalStore(subscribe, getLocale, getLocale);
}

/** `t`, re-rendering the calling component when the language changes. */
export function useT(): typeof t {
  useLocale();
  return t;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

function apply(code: string) {
  const next = LOCALES.find((l) => l.code === code) ?? current;
  if (typeof document !== "undefined") document.documentElement.lang = next.code;
  if (next === current) return;
  current = next;
  for (const listener of listeners) listener();
}

function systemLanguages(): readonly string[] {
  if (typeof navigator === "undefined") return [];
  return navigator.languages?.length ? navigator.languages : [navigator.language];
}

function lookup(catalog: unknown, key: string): string | PluralForms | undefined {
  let node = catalog;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" || isPlural(node) ? node : undefined;
}

function isPlural(node: unknown): node is PluralForms {
  return typeof node === "object" && node !== null && typeof (node as PluralForms).other === "string";
}

function select(entry: string | PluralForms, count: string | number | undefined): string {
  if (typeof entry === "string") return entry;
  const n = typeof count === "number" ? count : Number(count);
  if (!Number.isFinite(n)) return entry.other;
  if (n === 0 && entry.zero !== undefined) return entry.zero;
  return entry[new Intl.PluralRules(current.code).select(n)] ?? entry.other;
}

function interpolate(text: string, params: MessageParams | undefined): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    if (value === undefined) return match;
    return typeof value === "number" ? plainNumber(value) : value;
  });
}

/** Numbers in messages: locale decimal separator, no digit grouping ("1024 samples"). */
function plainNumber(value: number): string {
  let format = plainFormats.get(current.code);
  if (!format) {
    format = new Intl.NumberFormat(current.code, { useGrouping: false, maximumFractionDigits: 3 });
    plainFormats.set(current.code, format);
  }
  return format.format(value);
}
const plainFormats = new Map<string, Intl.NumberFormat>();
