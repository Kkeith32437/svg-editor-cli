import { Shape } from './Shape.js';
export class Ellipse extends Shape {
  protected readonly geometry = ['cx', 'cy', 'rx', 'ry'];
  constructor(id: string) { super(id, 'ellipse'); }
  move(dx: number, dy: number): void { this.shift('cx', 'cy', dx, dy); }
  copy(): Shape { return this.copyValues(new Ellipse(this.id)); }
}
