import { getLocalizedValue } from "./api";

test("selects requested locale and falls back to English when a translation is missing", () => {
  const content = {
    name_en: "Classic Lashes",
    name_is: "Klassísk augnhár",
    description_en: "English description",
    description: "Legacy English description",
  };

  expect(getLocalizedValue(content, "name", "is")).toBe("Klassísk augnhár");
  expect(getLocalizedValue(content, "description", "is")).toBe("English description");
  expect(getLocalizedValue(content, "description", "en")).toBe("English description");
  expect(getLocalizedValue({ name: "Legacy name" }, "name", "is")).toBe("Legacy name");
});
