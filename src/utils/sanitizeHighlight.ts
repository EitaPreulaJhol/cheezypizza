import DOMPurify from 'dompurify'

// Only allow highlight.js markup (spans with classes) in highlighted output.
// This keeps code highlighting intact while stripping event handlers,
// links, images and any other attacker-controlled markup.
export function sanitizeHljs(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['span'],
    ALLOWED_ATTR: ['class'],
    ALLOW_DATA_ATTR: false,
  })
}
