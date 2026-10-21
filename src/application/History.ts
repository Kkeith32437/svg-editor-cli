import { Command } from './Command.js';
export class History {
  private past: Command[] = [];
  private future: Command[] = [];
  private blocked = true;
  execute(command: Command): string {
    const result = command.execute();
    this.past.push(command); this.future = []; this.blocked = false;
    return result;
  }
  barrier(): void { this.past = []; this.future = []; this.blocked = true; }
  undo(): string {
    if (this.blocked) throw new Error('undo not allowed after io command');
    const command = this.past.pop();
    if (!command) throw new Error('nothing to undo');
    const result = command.undo(); this.future.push(command); return result;
  }
  redo(): string {
    if (this.blocked) throw new Error('undo not allowed after io command');
    const command = this.future.pop();
    if (!command) throw new Error('nothing to redo');
    const result = command.redo(); this.past.push(command); return result;
  }
}
