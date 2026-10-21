import { EditCommand } from '../EditCommand.js';
export class AddToCommand extends EditCommand {
  protected apply(): string { this.arity(2); this.document.addTo(this.args[0]!, this.args[1]!); return `${this.args[1]} added to g#${this.args[0]}`; }
}
