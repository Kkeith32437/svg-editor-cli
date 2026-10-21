import { Shape } from './Shape.js';
export class Line extends Shape {
  protected readonly geometry = ['x1', 'y1', 'x2', 'y2'];
  constructor(id: string) { super(id, 'line'); }
  move(dx: number, dy: number): void { this.shift('x1', 'y1', dx, dy); this.shift('x2', 'y2', dx, dy); }
  copy(): Shape { return this.copyValues(new Line(this.id)); }
}
