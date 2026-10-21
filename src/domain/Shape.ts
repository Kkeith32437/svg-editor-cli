export abstract class Shape {
  private readonly values = new Map<string, string>();
  protected abstract readonly geometry: readonly string[];
  constructor(public readonly id: string, public readonly type: string) {
    if (!id || /\s/.test(id)) throw new Error('id must be nonempty and contain no whitespace');
  }
  get children(): readonly Shape[] { return []; }
  get isContainer(): boolean { return false; }
  get attributes(): ReadonlyMap<string, string> { return new Map(this.values); }
  get(attr: string): string | undefined { return this.values.get(attr); }
  set(attr: string, value: string): void {
    if (![...this.geometry, 'fill', 'stroke', 'stroke-width', ...(this.type === 'text' ? ['text'] : [])].includes(attr)) {
      throw new Error(`unknown attribute: ${attr}`);
    }
    if (this.geometry.includes(attr) || attr === 'stroke-width') {
      if (value.trim() === '' || !Number.isFinite(Number(value))) throw new Error(`invalid number: ${value}`);
      if (['width', 'height', 'r', 'rx', 'ry', 'stroke-width'].includes(attr) && Number(value) < 0) {
        throw new Error(`${attr} must be nonnegative`);
      }
      value = String(Number(value));
    }
    this.values.set(attr, value);
  }
  protected shift(x: string, y: string, dx: number, dy: number): void {
    this.set(x, String(Number(this.get(x) ?? 0) + dx));
    this.set(y, String(Number(this.get(y) ?? 0) + dy));
  }
  abstract move(dx: number, dy: number): void;
  scale(factor: number): void {
    for (const key of this.geometry) this.set(key, String(Number(this.get(key) ?? 0) * factor));
  }
  abstract copy(): Shape;
  protected copyValues(target: Shape): Shape {
    for (const [key, value] of this.values) target.set(key, value);
    return target;
  }
  summary(): string {
    return `${this.type}#${this.id}${[...this.values].map(([key, value]) => ` ${key}=${JSON.stringify(value)}`).join('')}`;
  }
}
