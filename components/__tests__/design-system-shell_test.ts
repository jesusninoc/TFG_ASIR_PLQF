import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

test("global styles expose the Polar-inspired design tokens", () => {
  const css = readFileSync(join(root, "app/globals.css"), "utf8");

  assert.match(css, /--accent:\s*#1e66f5/i);
  assert.match(css, /--secondary:\s*#8839ef/i);
  assert.match(css, /--radius-card:\s*16px/i);
  assert.match(css, /\.btn-pill/);
});

test("home page uses the design-system hero and pill CTAs", () => {
  const page = readFileSync(join(root, "app/page.tsx"), "utf8");

  assert.match(page, /design-hero/);
  assert.match(page, /btn-pill/);
  assert.match(page, /text-\[clamp\(3\.5rem,10vw,8rem\)\]/);
});

test("header exposes icon-only cart and AI assistant controls", () => {
  const header = readFileSync(join(root, "components/site-header.tsx"), "utf8");

  assert.match(header, /Brain/);
  assert.match(header, /ShoppingCart/);
  assert.match(header, /TOGGLE_AI_ASSISTANT_EVENT/);
  assert.doesNotMatch(header, />Carrito</);
});

test("assistant listens for the header toggle event", () => {
  const assistant = readFileSync(join(root, "components/ai-assistant.tsx"), "utf8");

  assert.match(assistant, /TOGGLE_AI_ASSISTANT_EVENT/);
  assert.match(assistant, /addEventListener\(TOGGLE_AI_ASSISTANT_EVENT/);
});

test("assistant persists conversation during shop filter navigations", () => {
  const assistant = readFileSync(join(root, "components/ai-assistant.tsx"), "utf8");

  assert.match(assistant, /ASSISTANT_MESSAGES_STORAGE_KEY/);
  assert.match(assistant, /sessionStorage\.getItem\(ASSISTANT_MESSAGES_STORAGE_KEY\)/);
  assert.match(assistant, /sessionStorage\.setItem\(\s*ASSISTANT_MESSAGES_STORAGE_KEY/);
  assert.match(assistant, /sessionStorage\.removeItem\(ASSISTANT_MESSAGES_STORAGE_KEY\)/);
});
