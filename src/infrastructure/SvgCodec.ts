import { DOMParser, XMLSerializer, DOMImplementation } from '@xmldom/xmldom';
import { Document } from '../domain/Document.js';
import { Group } from '../domain/Group.js';
import { Shape } from '../domain/Shape.js';
import { ShapeFactory } from '../domain/ShapeFactory.js';
export class SvgCodec {
  decode(source: string): { document: Document; warnings: string[] } {
    if (/<!DOCTYPE|<!ENTITY/i.test(source)) throw new Error('DTD and entities are unsupported');
    const errors: string[] = [];
    const xml = new DOMParser({ errorHandler: { warning: message => errors.push(message), error: message => errors.push(message), fatalError: message => errors.push(message) } }).parseFromString(source, 'image/svg+xml');
    const root = xml.documentElement;
    if (errors.length || !root || root.tagName !== 'svg' || (root.namespaceURI && root.namespaceURI !== 'http://www.w3.org/2000/svg')) throw new Error('invalid SVG document');
    const document = new Document(Number(root.getAttribute('width') || 800), Number(root.getAttribute('height') || 600));
    const used = new Set<string>(), reserved = new Set<string>(), warnings: string[] = [];
    for (const element of Array.from(root.getElementsByTagName('*'))) {
      const id = element.getAttribute('id');
      if (id) { if (reserved.has(id)) throw new Error(`id already exists: ${id}`); reserved.add(id); }
    }
    const factory = new ShapeFactory();
    const parse = (element: Element): Shape => {
      const type = element.tagName;
      let id = element.getAttribute('id');
      if (!id) {
        let counter = 1;
        while (reserved.has(`${type}${counter}`) || used.has(`${type}${counter}`)) counter++;
        id = `${type}${counter}`; warnings.push(`warning: assigned id ${id} to unnamed <${type}>`);
      }
      used.add(id);
      const shape = factory.empty(type, id);
      for (const attr of Array.from(element.attributes)) {
        if (['id', 'xmlns', 'data-kind'].includes(attr.name)) continue;
        // Reject unsupported rendering attributes explicitly, rather than silently losing them.
        shape.set(attr.name, attr.value);
      }
      if (shape instanceof Group) {
        for (const child of Array.from(element.childNodes)) {
          if (child.nodeType === 1) shape.insert(parse(child as Element));
          else if (child.nodeType === 3 && child.textContent?.trim()) throw new Error('unexpected text inside group');
        }
      } else if (type === 'text') {
        if (Array.from(element.childNodes).some(child => child.nodeType === 1)) throw new Error('nested text elements are unsupported');
        shape.set('text', element.textContent ?? '');
      } else if (Array.from(element.childNodes).some(child => child.nodeType === 1)) throw new Error(`unexpected children in ${type}`);
      return shape;
    };
    for (const child of Array.from(root.childNodes)) {
      if (child.nodeType === 1) document.add(parse(child as unknown as Element));
    }
    return { document, warnings };
  }
  encode(document: Document): string {
    const xml = new DOMImplementation().createDocument('http://www.w3.org/2000/svg', 'svg', null);
    const root = xml.documentElement;
    root.setAttribute('width', String(document.width)); root.setAttribute('height', String(document.height));
    root.setAttribute('viewBox', `0 0 ${document.width} ${document.height}`);
    const append = (shape: Shape, parent: Node): void => {
      const element = xml.createElementNS('http://www.w3.org/2000/svg', shape.type);
      element.setAttribute('id', shape.id);
      for (const [key, value] of shape.attributes) {
        if (key === 'text') element.appendChild(xml.createTextNode(value)); else element.setAttribute(key, value);
      }
      parent.appendChild(element);
      for (const child of shape.children) append(child, element);
    };
    for (const child of document.children) append(child, root);
    return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(xml)}\n`;
  }
}
