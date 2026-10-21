import { Shape } from './Shape.js';
import { Rect } from './Rect.js';
import { Circle } from './Circle.js';
import { Ellipse } from './Ellipse.js';
import { Line } from './Line.js';
import { Text } from './Text.js';
import { Group } from './Group.js';
export class ShapeFactory {
  // Phase 1's single shape-name dispatch point; replace with providers in Phase 2.
  private readonly types = new Map<string, { ctor: new(id: string) => Shape; args: string[]; optional?: string }>([
    ['rect', { ctor: Rect, args: ['x', 'y', 'width', 'height'], optional: 'fill' }],
    ['circle', { ctor: Circle, args: ['cx', 'cy', 'r'], optional: 'fill' }],
    ['ellipse', { ctor: Ellipse, args: ['cx', 'cy', 'rx', 'ry'], optional: 'fill' }],
    ['line', { ctor: Line, args: ['x1', 'y1', 'x2', 'y2'], optional: 'stroke' }],
    ['text', { ctor: Text, args: ['x', 'y', 'text'] }],
    ['g', { ctor: Group, args: [] }]
  ]);
  empty(type: string, id: string): Shape {
    const spec = this.types.get(type);
    if (!spec) throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
    return new spec.ctor(id);
  }
  create(type: string, id: string, args: string[]): Shape {
    const shape = this.empty(type, id);
    const spec = this.types.get(type)!;
    if (args.length < spec.args.length || args.length > spec.args.length + (spec.optional ? 1 : 0)) {
      throw new Error(`invalid parameters for ${type}`);
    }
    spec.args.forEach((key, index) => shape.set(key, args[index]!));
    if (spec.optional && args.length > spec.args.length) shape.set(spec.optional, args.at(-1)!);
    return shape;
  }
}
