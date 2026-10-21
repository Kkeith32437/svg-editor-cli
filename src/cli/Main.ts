import { createInterface } from 'node:readline';
import { Editor } from '../application/Editor.js';
import { FileSvgStorage } from '../infrastructure/FileSvgStorage.js';
import { Tokenizer } from './Tokenizer.js';
export class Main {
  run(): void {
    const editor = new Editor(new FileSvgStorage()), tokenizer = new Tokenizer();
    const terminal = Boolean(process.stdin.isTTY);
    const input = createInterface({ input: process.stdin, output: process.stdout, terminal });
    if (terminal) console.log("svg-editor 0.1 — type 'help' for commands");
    input.setPrompt('svg> ');
    if (terminal) input.prompt();
    input.on('line', line => {
      try { const output = editor.execute(tokenizer.parse(line)); if (output) console.log(output); }
      catch (error) { console.log(`error: ${(error instanceof Error ? error.message : String(error)).replace(/[\r\n]+/g, ' ')}`); }
      if (terminal) input.prompt();
    });
  }
}
new Main().run();
