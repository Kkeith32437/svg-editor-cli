import { Group } from './Group.js';
import { Shape } from './Shape.js';
export class Document {
  private root = new Group('__root__');
  constructor(private w = 800, private h = 600) { this.resize(w, h); }
  get width(): number { return this.w; }
  get height(): number { return this.h; }
  get children(): readonly Shape[] { return this.root.children; }
  resize(w: number, h: number): void {
    if (![w, h].every(n => Number.isFinite(n) && n > 0)) throw new Error('canvas dimensions must be positive');
    this.w = w; this.h = h;
  }
  all(parent: Shape = this.root): Shape[] { return parent.children.flatMap(child => [child, ...this.all(child)]); }
  find(id: string): Shape {
    const shape = this.all().find(item => item.id === id);
    if (!shape) throw new Error(`no such shape: ${id}`);
    return shape;
  }
  has(id: string): boolean { return this.all().some(item => item.id === id); }
  container(id?: string): Group {
    if (id === undefined) return this.root;
    if (!this.has(id)) throw new Error(`no such container: ${id}`);
    const shape = this.find(id);
    if (!(shape instanceof Group)) throw new Error(`not a container: ${id}`);
    return shape;
  }
  parent(shape: Shape): Group {
    return [this.root, ...this.all().filter((item): item is Group => item instanceof Group)]
      .find(item => item.children.includes(shape))!;
  }
  add(shape: Shape, parent?: string): void {
    const incoming = [shape, ...this.all(shape)];
    const ids = new Set<string>();
    for (const item of incoming) {
      if (ids.has(item.id) || this.has(item.id)) throw new Error(`id already exists: ${item.id}`);
      ids.add(item.id);
    }
    this.container(parent).insert(shape);
  }
  delete(id: string): void { const shape = this.find(id); this.parent(shape).remove(shape); }
  group(id: string, ids: string[]): void {
    if (!ids.length || new Set(ids).size !== ids.length) throw new Error('group requires distinct shape ids');
    if (this.has(id)) throw new Error(`id already exists: ${id}`);
    const shapes = ids.map(item => this.find(item));
    for (const shape of shapes) {
      if (this.all(shape).some(child => shapes.includes(child))) {
        throw new Error(`cannot group a container into its own descendant: ${shape.id}`);
      }
    }
    // Preserve document order, including when input ids are reversed or have different parents.
    const ordered = this.all().filter(shape => shapes.includes(shape));
    const group = new Group(id);
    for (const shape of ordered) { this.parent(shape).remove(shape); group.insert(shape); }
    this.root.insert(group);
  }
  ungroup(id: string): void {
    const group = this.container(id);
    const parent = this.parent(group);
    if (parent === this.root) throw new Error(`cannot ungroup top-level container: ${id}`);
    let index = parent.children.indexOf(group);
    parent.remove(group);
    for (const child of group.children) { group.remove(child); parent.insert(child, index++); }
  }
  addTo(gid: string, id: string): void {
    const group = this.container(gid), shape = this.find(id);
    if (shape === group || this.all(shape).includes(group)) throw new Error(`cannot group a container into its own descendant: ${id}`);
    this.parent(shape).remove(shape); group.insert(shape);
  }
  reorder(id: string, front: boolean): void {
    const shape = this.find(id), parent = this.parent(shape);
    parent.remove(shape); parent.insert(shape, front ? parent.children.length : 0);
  }
  copy(): Document { const result = new Document(this.w, this.h); result.root = this.root.copy(); return result; }
  restore(snapshot: Document): void { this.w = snapshot.w; this.h = snapshot.h; this.root = snapshot.root.copy(); }
}
