export interface Command {
  execute(): string;
  undo(): string;
  redo(): string;
}
