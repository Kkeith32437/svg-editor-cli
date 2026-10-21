import { Document } from '../domain/Document.js';
export interface SvgStorage {
  read(path: string): { document: Document; warnings: string[] };
  write(path: string, document: Document): void;
}
