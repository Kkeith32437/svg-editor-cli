import { EditCommand } from '../EditCommand.js';
import { ShapeFactory } from '../../domain/ShapeFactory.js';
export class CreateCommand extends EditCommand {
  protected apply(): string {
    const args = [...this.args];
    let parent: string | undefined;
    if (args.length >= 4 && args.at(-2) === 'in') { parent = args.pop(); args.pop(); }
    const [type, id, ...params] = args;
    if (!type || !id) throw new Error('usage: create <type> <id> [params] [in <containerId>]');
    const shape = new ShapeFactory().create(type, id, params);
    this.document.add(shape, parent);
    return `${type}#${id} created${parent ? ` in g#${parent}` : ''}`;
  }
}
