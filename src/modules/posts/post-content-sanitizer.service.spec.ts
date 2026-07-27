import { PayloadTooLargeException } from '@nestjs/common';

import { POST_CONTENT_MAX_BYTES } from './post-content.constants';
import { PostContentSanitizerService } from './post-content-sanitizer.service';

describe('PostContentSanitizerService', () => {
  const sanitizer = new PostContentSanitizerService();

  it('preserves supported semantic article formatting and normalizes h1', () => {
    const result = sanitizer.sanitizeInput(`
      <h1>Page-owned title</h1>
      <h2>Section</h2>
      <p><strong>Useful</strong> <em>content</em>.</p>
      <blockquote>Train consistently.</blockquote>
      <figure>
        <img src="/uploads/media/posts/example.webp" alt="Example" width="1200" height="630">
        <figcaption>Example caption</figcaption>
      </figure>
      <table><thead><tr><th scope="col">Day</th></tr></thead><tbody><tr><td>Monday</td></tr></tbody></table>
    `);

    expect(result).toContain('<h2>Page-owned title</h2>');
    expect(result).toContain('<h2>Section</h2>');
    expect(result).toContain('<strong>Useful</strong>');
    expect(result).toContain('<blockquote>Train consistently.</blockquote>');
    expect(result).toContain('<img src="/uploads/media/posts/example.webp"');
    expect(result).toContain('alt="Example"');
    expect(result).toContain('width="1200"');
    expect(result).toContain('height="630"');
    expect(result).toContain('loading="lazy"');
    expect(result).toContain('decoding="async"');
    expect(result).toContain('<table>');
    expect(result).not.toContain('<h1>');
  });

  it('removes active content, styles, embeds, forms, and dangerous URLs', () => {
    const result = sanitizer.sanitizeInput(`
      <html><head><style>body{display:none}</style></head><body>
        <script>alert(1)</script>
        <p onclick="alert(1)" style="color:red">Safe text</p>
        <a href="java&#x0A;script:alert(1)" target="_blank" rel="opener">Bad link</a>
        <img src="data:image/svg+xml;base64,PHN2Zy8+" onerror="alert(1)">
        <iframe src="https://example.com"></iframe>
        <object data="https://example.com"></object>
        <form><input name="secret"><button>Submit</button></form>
      </body></html>
    `);

    expect(result).toContain('<p>Safe text</p>');
    expect(result).toContain('<a>Bad link</a>');
    expect(result).not.toMatch(
      /script|onclick|style=|javascript:|data:|iframe|object|form|input|button/i,
    );
  });

  it('normalizes external links and keeps safe internal links', () => {
    const result = sanitizer.sanitizeInput(`
      <a href="https://example.com/article" rel="opener">External</a>
      <a href="/news/local" target="_blank" rel="opener">Internal</a>
      <a href="#section-2">Section</a>
    `);

    expect(result).toContain(
      '<a href="https://example.com/article" target="_blank" rel="noopener noreferrer">External</a>',
    );
    expect(result).toContain('<a href="/news/local">Internal</a>');
    expect(result).toContain('<a href="#section-2">Section</a>');
  });

  it('allows HTTPS, root-relative images, and canonical managed markers', () => {
    const assetId = '5e8e7b84-56cb-4db1-82ba-33f1a740a9e1';
    const result = sanitizer.sanitizeInput(`
      <img src="https://evil.example.com/ignored.webp" data-media-asset-id="${assetId}" alt="Managed">
      <img src="/uploads/media/post.webp">
      <img src="http://cdn.example.com/insecure.webp">
    `);

    expect(result).toContain(`data-media-asset-id="${assetId}"`);
    expect(result).toContain('alt="Managed"');
    expect(result).not.toContain('evil.example.com');
    expect(result).toContain('src="/uploads/media/post.webp"');
    expect(result).not.toContain('http://cdn.example.com/insecure.webp');
  });

  it('rejects invalid managed marker UUIDs and strips arbitrary data attributes', () => {
    expect(() =>
      sanitizer.sanitizeInput(
        '<img data-media-asset-id="asset-1" data-editor-state="secret">',
      ),
    ).toThrow('Post inline media markers');

    const result = sanitizer.sanitizeInput(
      '<img src="/uploads/media/post.webp" data-editor-state="secret">',
    );
    expect(result).not.toContain('data-editor-state');
  });

  it('preserves bilingual text and treats null or empty sanitized input as clear', () => {
    expect(
      sanitizer.sanitizeInput(
        '<p>Training safely — Táº­p luyá»‡n an toÃ n.</p>',
      ),
    ).toBe('<p>Training safely — Táº­p luyá»‡n an toÃ n.</p>');
    expect(sanitizer.sanitizeInput(null)).toBeNull();
    expect(sanitizer.sanitizeInput('  <script>alert(1)</script>  ')).toBeNull();
  });

  it('rejects content above the per-locale byte limit', () => {
    expect(() =>
      sanitizer.sanitizeInput('a'.repeat(POST_CONTENT_MAX_BYTES + 1)),
    ).toThrow(PayloadTooLargeException);
  });
});
