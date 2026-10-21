import { Shape } from './Shape.js';
export class Circle extends Shape {
  protected readonly geometry = ['cx', 'cy', 'r'];
  constructor(id: string) { super(id, 'circle'); }
  move(dx: number, dy: number): void { this.shift('cx', 'cy', dx, dy); }
  copy(): Shape { return this.copyValues(new Circle(this.id)); }
}
