import type { Translation } from "..";
import { en } from "./en";
import { ptBR } from "./pt-BR";

export interface LocaleInfo {
  /** BCP 47 tag, e.g. "pt-BR". Also used for plural rules and number formatting. */
  code: string;
  /** The language's name in that language, as shown in the language picker. */
  name: string;
  messages: Translation;
}

export const DEFAULT_LOCALE = "en";

/** Every bundled language. To add one, create its file next to this one and list it here. */
export const LOCALES: readonly LocaleInfo[] = [
  { code: "en", name: "English", messages: en },
  { code: "pt-BR", name: "Português (Brasil)", messages: ptBR },
];
