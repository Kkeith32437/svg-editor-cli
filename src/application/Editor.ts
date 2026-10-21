import { Document } from '../domain/Document.js';
import { SvgStorage } from './SvgStorage.js';
import { History } from './History.js';
import { EditCommand } from './EditCommand.js';
import { DocumentView } from './DocumentView.js';
import { CreateCommand } from './commands/CreateCommand.js';
import { DeleteCommand } from './commands/DeleteCommand.js';
import { MoveCommand } from './commands/MoveCommand.js';
import { ScaleCommand } from './commands/ScaleCommand.js';
import { SetCommand } from './commands/SetCommand.js';
import { GroupCommand } from './commands/GroupCommand.js';
import { UngroupCommand } from './commands/UngroupCommand.js';
import { AddToCommand } from './commands/AddToCommand.js';
import { FrontCommand } from './commands/FrontCommand.js';
import { BackCommand } from './commands/BackCommand.js';
export class Editor {
  private document?: Document;
  private path?: string;
  private readonly history = new History();
  private readonly view = new DocumentView();
  private readonly handlers = new Map<string, (args: string[]) => string>();
  private readonly usage = [
    'init [w] [h]', 'read <file.svg>', 'save [file.svg]', 'canvas [w] [h]',
    'create <type> <id> [params...] [in <containerId>]',
    '  rect: x y width height [fill]; circle: cx cy r [fill]',
    '  ellipse: cx cy rx ry [fill]; line: x1 y1 x2 y2 [stroke]',
    '  text: x y "content"; g: no geometry parameters',
    'delete <id>', 'move <id> <dx> <dy>', 'scale <id> <factor>', 'set <id> <attr> <value>',
    'group <newGid> <id1> [id2...]', 'ungroup <gid>', 'addto <gid> <id>',
    'front <id>', 'back <id>', 'tree [id]', 'show <id>', 'help', 'undo', 'redo'
  ].join('\n');
  constructor(private readonly storage: SvgStorage) {
    // Phase 1's single command-name dispatch point; planned provider registry refactor.
    const edits: Record<string, new(document: Document, args: string[]) => EditCommand> = {
      create: CreateCommand, delete: DeleteCommand, move: MoveCommand, scale: ScaleCommand,
      set: SetCommand, group: GroupCommand, ungroup: UngroupCommand, addto: AddToCommand,
      front: FrontCommand, back: BackCommand
    };
    for (const [name, CommandType] of Object.entries(edits)) {
      this.handlers.set(name, args => this.history.execute(new CommandType(this.current(), args)));
    }
    this.handlers.set('help', args => { this.count(args, 0); return this.usage; });
    this.handlers.set('init', args => {
      if (args.length > 2) throw new Error('usage: init [w] [h]');
      const document = new Document(this.numeric(args[0] ?? '800'), this.numeric(args[1] ?? '600'));
      this.document = document; this.path = undefined; this.history.barrier();
      return `canvas ${document.width}x${document.height} created`;
    });
    this.handlers.set('read', args => {
      this.count(args, 1); const result = this.storage.read(args[0]!);
      this.document = result.document; this.path = args[0]; this.history.barrier();
      return [...result.warnings, `read ${this.path} (${this.document.all().length} elements)`].join('\n');
    });
    this.handlers.set('save', args => {
      if (args.length > 1) throw new Error('usage: save [file.svg]');
      const document = this.current(), path = args[0] ?? this.path;
      if (!path) throw new Error('save requires a file path');
      this.storage.write(path, document); this.path = path; this.history.barrier();
      return `saved to ${path} (${document.all().length} elements)`;
    });
    this.handlers.set('canvas', args => {
      const document = this.current();
      if (args.length) { this.count(args, 2); document.resize(this.numeric(args[0]!), this.numeric(args[1]!)); this.history.barrier(); }
      return `canvas ${document.width}x${document.height}`;
    });
    this.handlers.set('tree', args => { if (args.length > 1) throw new Error('usage: tree [id]'); return this.view.tree(this.current(), args[0]); });
    this.handlers.set('show', args => { this.count(args, 1); return this.view.show(this.current(), args[0]!); });
    this.handlers.set('undo', args => { this.current(); this.count(args, 0); return this.history.undo(); });
    this.handlers.set('redo', args => { this.current(); this.count(args, 0); return this.history.redo(); });
  }
  execute(tokens: string[]): string {
    if (!tokens.length) return '';
    const handler = this.handlers.get(tokens[0]!);
    if (!handler) throw new Error(`unknown command: ${tokens[0]}`);
    return handler(tokens.slice(1));
  }
  private current(): Document {
    if (!this.document) throw new Error("no document. use 'init' or 'read' first");
    return this.document;
  }
  private count(args: string[], length: number): void { if (args.length !== length) throw new Error(`expected ${length} arguments`); }
  private numeric(value: string): number {
    if (!value.trim() || !Number.isFinite(Number(value))) throw new Error(`invalid number: ${value}`);
    return Number(value);
  }
}
