export interface Command {
  execute(): string;
  undo(): void;
  redo(): void;
}
