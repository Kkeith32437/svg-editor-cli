import { EditCommand } from '../EditCommand.js';
export class BackCommand extends EditCommand {
  protected apply(): string { this.arity(1); this.document.reorder(this.args[0]!, false); return `${this.args[0]} moved to back`; }
}
