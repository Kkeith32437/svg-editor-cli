import { Document } from '../domain/Document.js';
import { Shape } from '../domain/Shape.js';
export class DocumentView {
  tree(document: Document, id?: string): string {
    const lines = [id ? document.find(id).summary() : `svg (${document.width}x${document.height})`];
    const walk = (children: readonly Shape[], prefix: string): void => {
      children.forEach((child, index) => {
        const last = index === children.length - 1;
        lines.push(`${prefix}${last ? '└── ' : '├── '}${child.summary()}`);
        walk(child.children, `${prefix}${last ? '    ' : '│   '}`);
      });
    };
    walk(id ? document.find(id).children : document.children, '');
    return lines.join('\n');
  }
  show(document: Document, id: string): string {
    const shape = document.find(id), parent = document.parent(shape);
    return [`${shape.type}#${id}  parent=${document.children.includes(shape) ? 'svg' : `g#${parent.id}`}`, shape.details()].filter(Boolean).join('\n');
  }
}
