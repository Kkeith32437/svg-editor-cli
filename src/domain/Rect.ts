import { Shape } from './Shape.js';
export class Rect extends Shape {
  protected readonly geometry = ['x', 'y', 'width', 'height'];
  constructor(id: string) { super(id, 'rect'); }
  move(dx: number, dy: number): void { this.shift('x', 'y', dx, dy); }
  copy(): Shape { return this.copyValues(new Rect(this.id)); }
}
