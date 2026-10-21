import { EditCommand } from '../EditCommand.js';
export class UngroupCommand extends EditCommand {
  protected apply(): string { this.arity(1); this.document.ungroup(this.args[0]!); return `g#${this.args[0]} ungrouped`; }
}
