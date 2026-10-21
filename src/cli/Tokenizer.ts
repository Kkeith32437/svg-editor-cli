export class Tokenizer {
  parse(line: string): string[] {
    if (line.trimStart().startsWith('#')) return [];
    const tokens: string[] = [];
    let token = '', quoted = false, active = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i]!;
      if (quoted && char === '\\' && ['"', '\\'].includes(line[i + 1] ?? '')) { token += line[++i]; active = true; }
      else if (char === '"') { quoted = !quoted; active = true; }
      else if (/\s/.test(char) && !quoted) { if (active) tokens.push(token); token = ''; active = false; }
      else { token += char; active = true; }
    }
    if (quoted) throw new Error('unterminated quoted string');
    if (active) tokens.push(token);
    return tokens;
  }
}
