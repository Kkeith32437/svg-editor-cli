import { EditCommand } from '../EditCommand.js';
export class DeleteCommand extends EditCommand {
  protected apply(): string { this.arity(1); const shape = this.document.find(this.args[0]!); this.document.delete(shape.id); return `${shape.type}#${shape.id} deleted`; }
}
