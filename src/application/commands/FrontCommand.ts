import { EditCommand } from '../EditCommand.js';
export class FrontCommand extends EditCommand {
  protected apply(): string { this.arity(1); this.document.reorder(this.args[0]!, true); return `${this.args[0]} moved to front`; }
}
