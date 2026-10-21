import { Shape } from './Shape.js';
export class Group extends Shape {
  protected readonly geometry: readonly string[] = [];
  private readonly items: Shape[] = [];
  constructor(id: string) { super(id, 'g'); }
  override get children(): readonly Shape[] { return [...this.items]; }
  override get isContainer(): boolean { return true; }
  insert(shape: Shape, index = this.items.length): void { this.items.splice(index, 0, shape); }
  remove(shape: Shape): void {
    const index = this.items.indexOf(shape);
    if (index < 0) throw new Error(`no such shape: ${shape.id}`);
    this.items.splice(index, 1);
  }
  move(dx: number, dy: number): void { for (const shape of this.items) shape.move(dx, dy); }
  override scale(factor: number): void { for (const shape of this.items) shape.scale(factor); }
  copy(): Group {
    const result = new Group(this.id);
    this.copyValues(result);
    for (const shape of this.items) result.insert(shape.copy());
    return result;
  }
}
