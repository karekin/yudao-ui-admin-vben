import MarkdownIt from 'markdown-it';

const markdownRenderer = new MarkdownIt({
  breaks: true,
  html: false,
  linkify: true,
  typographer: false,
});

function normalizeFrontMatter(content: string): string {
  const frontMatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?=\r?\n|$)/);
  if (!frontMatter) {
    return content;
  }

  return `\`\`\`yaml\n${frontMatter[1]}\n\`\`\`${content.slice(frontMatter[0].length)}`;
}

/** Renders remote Skill documentation while keeping source HTML inert. */
export function renderSkillMarkdown(content: string): string {
  return markdownRenderer.render(normalizeFrontMatter(content));
}
