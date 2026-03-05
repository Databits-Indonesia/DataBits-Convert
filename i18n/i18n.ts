const messages: Record<string, string> = {
  'multiTool.renderingPages': 'Rendering pages...',
};

export function t(key: string): string {
  return messages[key] ?? key;
}
