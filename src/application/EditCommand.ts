import { Document } from '../domain/Document.js';
import { Command } from './Command.js';
export abstract class EditCommand implements Command {
  private before?: Document;
  private after?: Document;
  private result = '';
  constructor(protected readonly document: Document, protected readonly args: string[]) {}
  protected abstract apply(): string;
  execute(): string {
    this.before = this.document.copy();
    try {
      const result = this.apply();
      this.after = this.document.copy();
      this.result = result;
      return result;
    } catch (error) { this.document.restore(this.before); throw error; }
  }
  undo(): string { if (this.before) this.document.restore(this.before); return `undone: ${this.result}`; }
  redo(): string { if (this.after) this.document.restore(this.after); return `redone: ${this.result}`; }
  protected arity(count: number): void {
    if (this.args.length !== count) throw new Error(`expected ${count} arguments`);
  }
  protected number(index: number): number {
    const value = this.args[index];
    if (value === undefined || value.trim() === '' || !Number.isFinite(Number(value))) throw new Error(`invalid number: ${value}`);
    return Number(value);
  }
}
