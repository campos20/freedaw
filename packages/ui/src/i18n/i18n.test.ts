import { DEVICES } from "@freedaw/schema";
import { afterEach, describe, expect, it } from "vitest";
import {
  deviceText,
  formatNumber,
  getChosenLocale,
  getLocale,
  LOCALES,
  matchLocale,
  rich,
  setLocale,
  t,
} from ".";
import { formatPan, formatParam } from "../mixer/scale";
import { en } from "./locales/en";

afterEach(() => setLocale("en"));

type Node = string | { [key: string]: Node };
const PLURAL_FORMS = new Set(["zero", "one", "two", "few", "many", "other"]);

/** Flattens a catalog to `key → text`; plural forms become `key#form`. */
function flatten(node: Node, prefix = "", out = new Map<string, string>()): Map<string, string> {
  if (typeof node === "string") {
    out.set(prefix, node);
    return out;
  }
  const plural = typeof node.other === "string";
  for (const [key, child] of Object.entries(node)) {
    flatten(child, prefix ? `${prefix}${plural ? "#" : "."}${key}` : key, out);
  }
  return out;
}

const placeholders = (text: string) => new Set([...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]));
const tags = (text: string) => [...text.matchAll(/<(\w+)>/g)].map((m) => m[1]).sort();
const base = (key: string) => key.split("#")[0]!;

describe("catalogs", () => {
  const english = flatten(en as unknown as Node);
  const englishBases = new Set([...english.keys()].map(base));

  it("plurals in English have the forms the UI relies on", () => {
    for (const [key] of english) {
      if (!key.includes("#")) continue;
      expect(PLURAL_FORMS.has(key.split("#")[1]!), key).toBe(true);
    }
  });

  it("no namespace uses a plural form name as a key", () => {
    const visit = (node: Node, path: string) => {
      if (typeof node === "string" || typeof node.other === "string") return;
      for (const [key, child] of Object.entries(node)) {
        expect(PLURAL_FORMS.has(key), `${path}.${key}`).toBe(false);
        visit(child, `${path}.${key}`);
      }
    };
    visit(en as unknown as Node, "en");
  });

  for (const locale of LOCALES) {
    describe(locale.code, () => {
      const own = flatten(locale.messages as unknown as Node);

      it("has a valid BCP 47 code", () => {
        expect(Intl.getCanonicalLocales(locale.code)).toEqual([locale.code]);
      });

      it("only has keys that exist in English", () => {
        for (const key of own.keys()) expect(englishBases.has(base(key)), key).toBe(true);
      });

      it("gives every plural an `other` form", () => {
        const plurals = new Set([...own.keys()].filter((k) => k.includes("#")).map(base));
        for (const key of plurals) expect(own.has(`${key}#other`), key).toBe(true);
      });

      it("keeps placeholders and markup", () => {
        for (const [key, text] of own) {
          const source = english.get(key) ?? english.get(`${base(key)}#other`);
          expect(source, key).toBeDefined();
          const wanted = placeholders(source!);
          const got = placeholders(text);
          // Plural forms may leave out {count} ("one track"); nothing may be invented.
          for (const name of got) expect(wanted.has(name), `${key}: unknown {${name}}`).toBe(true);
          if (!key.includes("#")) expect(got, key).toEqual(wanted);
          expect(tags(text), key).toEqual(tags(source!));
        }
      });
    });
  }

  it("names every built-in device, parameter and choice", () => {
    const names = en.devices as Record<string, string>;
    for (const info of Object.values(DEVICES)) {
      expect(names[info.name], info.name).toBeDefined();
      for (const param of info.params as readonly { name: string; options?: readonly string[] }[]) {
        const band = /^Band \d+ (.+)$/.exec(param.name);
        const name = band ? band[1]! : param.name;
        expect(names[name], `${info.name}: ${param.name}`).toBeDefined();
        for (const option of param.options ?? []) expect(names[option], option).toBeDefined();
      }
    }
  });
});

describe("t", () => {
  it("interpolates and pluralizes", () => {
    expect(t("footer.tracks", { count: 1 })).toBe("1 track");
    expect(t("footer.tracks", { count: 3 })).toBe("3 tracks");
    expect(t("project.deleteLabel", { name: "Song" })).toBe("Delete Song");
    expect(t("settings.samples", { count: 1024, ms: "2.7" })).toBe("1024 samples (2.7 ms)");
  });

  it("leaves a missing placeholder visible", () => {
    expect(t("project.deleteLabel")).toBe("Delete {name}");
  });

  it("switches language and falls back to English", () => {
    setLocale("pt-BR");
    expect(getLocale()).toBe("pt-BR");
    expect(t("transport.play")).toBe("Reproduzir");
    expect(t("footer.tracks", { count: 1 })).toBe("1 faixa");
    expect(t("footer.tracks", { count: 2 })).toBe("2 faixas");
    expect(getChosenLocale()).toBe("pt-BR");
    // Unknown codes go back to following the system language.
    setLocale("xx");
    expect(getChosenLocale()).toBeUndefined();
  });

  it("formats numbers for the locale", () => {
    expect(formatNumber(48, 1)).toBe("48.0");
    expect(formatNumber(12345.678, 2)).toBe("12345.68");
    setLocale("pt-BR");
    expect(formatNumber(48, 1)).toBe("48,0");
    expect(t("tune.quantizeTitle", { tempo: 92.5 })).toBe("Quantizar tempo (92,5 BPM)");
  });

  it("translates device names, EQ band parameters and readouts", () => {
    const freq = DEVICES.eq.params.find((p) => p.id === "b1Freq")!;
    const type = DEVICES.eq.params.find((p) => p.id === "b1Type")!;
    expect(deviceText("Band 3 frequency")).toBe("Band 3 frequency");
    expect(formatParam(freq, 1500)).toBe("1.50 kHz");
    setLocale("pt-BR");
    expect(deviceText("Limiter")).toBe("Limitador");
    expect(deviceText("Band 3 frequency")).toBe("Banda 3: frequência");
    expect(deviceText("Not a device")).toBe("Not a device");
    expect(formatParam(freq, 1500)).toBe("1,50 kHz");
    expect(formatParam(type, 0)).toBe("Corte de graves");
    expect(formatPan(-0.5)).toBe("50E");
  });
});

describe("matchLocale", () => {
  it("prefers exact matches, then the same language, then English", () => {
    expect(matchLocale(["pt-BR"])).toBe("pt-BR");
    expect(matchLocale(["pt-br"])).toBe("pt-BR");
    expect(matchLocale(["pt-PT"])).toBe("pt-BR");
    expect(matchLocale(["pt"])).toBe("pt-BR");
    expect(matchLocale(["de-DE", "en-GB"])).toBe("en");
    expect(matchLocale(["fr"])).toBe("en");
    expect(matchLocale([])).toBe("en");
  });
});

describe("rich", () => {
  it("renders tagged spans and keeps the rest as text", () => {
    const parts = rich("<b>Drop</b> or <i>import</i>.", { b: (s) => `[${s}]` });
    expect(parts.length).toBe(4);
    expect(parts[1]).toBe(" or ");
    expect(parts[3]).toBe(".");
    expect((parts[0] as { props: { children: unknown } }).props.children).toBe("[Drop]");
    // Unknown tags render their text.
    expect((parts[2] as { props: { children: unknown } }).props.children).toBe("import");
  });
});
