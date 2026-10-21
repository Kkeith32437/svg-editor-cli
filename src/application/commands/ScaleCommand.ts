import { EditCommand } from '../EditCommand.js';
export class ScaleCommand extends EditCommand {
  protected apply(): string { this.arity(2); const factor = this.number(1); if (factor <= 0) throw new Error('scale factor must be positive'); const shape = this.document.find(this.args[0]!); shape.scale(factor); return `${shape.type}#${shape.id} scaled by ${factor}`; }
}
