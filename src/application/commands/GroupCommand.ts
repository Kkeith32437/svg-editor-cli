import { EditCommand } from '../EditCommand.js';
export class GroupCommand extends EditCommand {
  protected apply(): string { if (this.args.length < 2) throw new Error('usage: group <newGid> <id1> [id2...]'); this.document.group(this.args[0]!, this.args.slice(1)); return `g#${this.args[0]} created with ${this.args.length - 1} children`; }
}
