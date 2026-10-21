import { readFileSync, writeFileSync, renameSync, unlinkSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { Document } from '../domain/Document.js';
import { SvgStorage } from '../application/SvgStorage.js';
import { SvgCodec } from './SvgCodec.js';
export class FileSvgStorage implements SvgStorage {
  constructor(private readonly codec = new SvgCodec()) {}
  read(path: string): { document: Document; warnings: string[] } {
    let source: string;
    try { source = readFileSync(path, 'utf8'); } catch { throw new Error(`cannot read file: ${path}`); }
    return this.codec.decode(source);
  }
  write(path: string, document: Document): void {
    const temporary = `${path}.${randomUUID()}.tmp`;
    try { writeFileSync(temporary, this.codec.encode(document), { encoding: 'utf8', flag: 'wx' }); renameSync(temporary, path); }
    catch { try { unlinkSync(temporary); } catch {} throw new Error(`cannot write file: ${path}`); }
  }
}
