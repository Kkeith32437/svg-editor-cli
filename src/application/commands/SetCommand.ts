import { EditCommand } from '../EditCommand.js';
export class SetCommand extends EditCommand {
  protected apply(): string { this.arity(3); const shape = this.document.find(this.args[0]!); shape.set(this.args[1]!, this.args[2]!); return `${shape.type}#${shape.id} updated: ${this.args[1]}=${JSON.stringify(this.args[2])}`; }
}
