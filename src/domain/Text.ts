import { Shape } from './Shape.js';
export class Text extends Shape {
  protected readonly geometry = ['x', 'y'];
  constructor(id: string) { super(id, 'text'); }
  move(dx: number, dy: number): void { this.shift('x', 'y', dx, dy); }
  copy(): Shape { return this.copyValues(new Text(this.id)); }
}
