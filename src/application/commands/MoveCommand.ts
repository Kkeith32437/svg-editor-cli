import { EditCommand } from '../EditCommand.js';
export class MoveCommand extends EditCommand {
  protected apply(): string { this.arity(3); const dx = this.number(1), dy = this.number(2), shape = this.document.find(this.args[0]!); shape.move(dx, dy); return `${shape.type}#${shape.id} moved by (${dx},${dy})`; }
}
