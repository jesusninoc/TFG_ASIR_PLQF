import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

test("footer links company pages", () => {
  const footer = readFileSync(join(root, "components/site-footer.tsx"), "utf8");

  assert.match(footer, /href: "\/about"/);
  assert.match(footer, /href: "\/contact"/);
  assert.match(footer, /href: "\/privacy"/);
  assert.match(footer, /href: "\/terms"/);
});

test("company pages exist with Spanish content", () => {
  for (const route of ["about", "contact", "privacy", "terms"]) {
    const pagePath = join(root, "app", route, "page.tsx");
    assert.equal(existsSync(pagePath), true, `${route} page is missing`);

    const page = readFileSync(pagePath, "utf8");
    assert.match(page, /PC Selector/);
    assert.match(page, /export default function/);
  }
});

test("company page paragraphs have enough editorial depth", () => {
  for (const route of ["about", "contact", "privacy", "terms"]) {
    const page = readFileSync(join(root, "app", route, "page.tsx"), "utf8");
    const paragraphs = [...page.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/g)];

    assert.ok(paragraphs.length > 0, `${route} should include paragraphs`);

    for (const [index, paragraph] of paragraphs.entries()) {
      const text = paragraph[1]
        .replace(/<[^>]+>/g, " ")
        .replace(/\{[^}]*\}/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      assert.ok(
        text.length >= 180,
        `${route} paragraph ${index + 1} is too short: ${text.length} characters`,
      );
    }
  }
});
