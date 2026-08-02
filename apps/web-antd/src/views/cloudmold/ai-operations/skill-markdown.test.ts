import { describe, expect, it } from 'vitest';

import { renderSkillMarkdown } from './skill-markdown';

describe('renderSkillMarkdown', () => {
  it('renders standard Markdown and presents YAML front matter as readable code', () => {
    const html = renderSkillMarkdown(`---
name: merchant-growth
---

# 托管商家运营

- 每日评估
- 风险升级

| 状态 | 动作 |
| --- | --- |
| ACTIVE | 继续运营 |
`);

    expect(html).toContain('<pre><code class="language-yaml">');
    expect(html).toContain('<h1>托管商家运营</h1>');
    expect(html).toContain('<li>每日评估</li>');
    expect(html).toContain('<table>');
  });

  it('keeps raw HTML inert before the DOM sanitizer applies its final policy', () => {
    const html = renderSkillMarkdown('<script>alert("unsafe")</script>');

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
