import { describe, expect, it } from "vitest";
import { localeNames, locales, translations } from "./translations";

describe("international translations", () => {
  it("supports the configured production locales", () => {
    expect(locales).toEqual(["en", "uk", "de", "nl", "ru", "es", "fr", "pl", "it", "pt"]);
  });

  it("provides an accessible flag and language name for every locale", () => {
    for (const locale of locales) {
      expect(localeNames[locale]).toMatch(/^\p{Regional_Indicator}{2} /u);
    }
  });

  it.each(["uk", "de", "nl", "ru", "es", "fr", "pl", "it", "pt"] as const)(
    "translates the core %s conversion flow",
    (locale) => {
      const dictionary = translations[locale];
      for (const key of [
        "Start project",
        "Project configurator",
        "Contact and billing",
        "Send request",
        "Forgot password?",
        "Client workspace"
      ]) {
        expect(dictionary[key]).toBeTruthy();
        expect(dictionary[key]).not.toBe(key);
      }
    }
  );
});
