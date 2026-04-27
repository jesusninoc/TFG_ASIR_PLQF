import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeHtml, sanitizeMarkdown } from "../sanitizer";

test("sanitizeHtml removes script tags", () => {
  const malicious = "<p>Hello</p><script>alert('xss')</script>";
  const sanitized = sanitizeHtml(malicious);
  assert.equal(sanitized.includes("<script>"), false);
  assert.equal(sanitized.includes("<p>Hello</p>"), true);
});

test("sanitizeMarkdown converts markdown and sanitizes", () => {
  const md = "**bold** and <script>bad</script>";
  const sanitized = sanitizeMarkdown(md);
  assert.equal(sanitized.includes("<strong>bold</strong>"), true);
  assert.equal(sanitized.includes("<script>"), false);
});

test("sanitizeHtml keeps allowed tags", () => {
  const html = "<p>Paragraph</p><h1>Header</h1><a href='/'>Link</a>";
  const sanitized = sanitizeHtml(html);
  assert.equal(sanitized.includes("<p>Paragraph</p>"), true);
  assert.equal(sanitized.includes("<h1>Header</h1>"), true);
  assert.equal(sanitized.includes(">Link</a>"), true);
});

test("sanitizeHtml strips disallowed tags like iframe", () => {
  const html = "<iframe src='evil.com'></iframe>";
  const sanitized = sanitizeHtml(html);
  assert.equal(sanitized.includes("<iframe"), false);
});
