import { Shape } from './Shape.js';
export class Rect extends Shape {
  protected readonly geometry = ['x', 'y', 'width', 'height'];
  constructor(id: string) { super(id, 'rect'); }
  move(dx: number, dy: number): void { this.shift('x', 'y', dx, dy); }
  protected override geometrySummary(): string {
    return `x=${this.get('x') ?? 0} y=${this.get('y') ?? 0} w=${this.get('width') ?? 0} h=${this.get('height') ?? 0}`;
  }
  copy(): Shape { return this.copyValues(new Rect(this.id)); }
}
