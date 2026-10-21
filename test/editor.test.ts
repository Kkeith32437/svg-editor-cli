import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { Editor } from '../src/application/Editor.js';
import { Tokenizer } from '../src/cli/Tokenizer.js';
import { FileSvgStorage } from '../src/infrastructure/FileSvgStorage.js';
import { SvgCodec } from '../src/infrastructure/SvgCodec.js';
import { Document } from '../src/domain/Document.js';
import { ShapeFactory } from '../src/domain/ShapeFactory.js';

class Fixture {
  readonly editor = new Editor(new FileSvgStorage());
  private readonly tokenizer = new Tokenizer();
  run(line: string): string { return this.editor.execute(this.tokenizer.parse(line)); }
  init(): this { this.run('init'); return this; }
  tree(): string { return this.run('tree'); }
}

test('tokenizer preserves colors, quotes, empty text and Windows paths', () => {
  const parser = new Tokenizer();
  assert.deepEqual(parser.parse(' # comment'), []);
  assert.deepEqual(parser.parse('create text t 0 1 "hello world"'), ['create', 'text', 't', '0', '1', 'hello world']);
  assert.deepEqual(parser.parse('set t text ""'), ['set', 't', 'text', '']);
  assert.deepEqual(parser.parse('set t text "say \\"hi\\""'.replaceAll('\\\\', '\\')), ['set', 't', 'text', 'say "hi"']);
  assert.deepEqual(parser.parse('read "C:\\Users\\Keith\\my file.svg"'), ['read', 'C:\\Users\\Keith\\my file.svg']);
  assert.deepEqual(parser.parse('create rect a 0 0 1 1 #fff').at(-1), '#fff');
  assert.throws(() => parser.parse('set t text "oops'), /unterminated/);
});

test('no document and complete help', () => {
  const f = new Fixture();
  for (const line of ['tree', 'show a', 'undo', 'redo', 'save x.svg', 'create g a', 'canvas']) {
    assert.throws(() => f.run(line), /no document/);
  }
  for (const command of ['init', 'read', 'save', 'canvas', 'create', 'delete', 'move', 'scale', 'set', 'group', 'ungroup', 'addto', 'front', 'back', 'tree', 'show', 'help', 'undo', 'redo']) assert.match(f.run('help'), new RegExp(command));
  assert.throws(() => f.run('bogus'), /unknown command/);
});

test('all six shapes, float geometry, style omission and case-sensitive unique ids', () => {
  const f = new Fixture().init();
  for (const command of ['create g G', 'create rect r 1.5 2 3 4 in G', 'create circle c 1 2 3 red', 'create ellipse e 1 2 3 4', 'create line l 1 2 3 4 black', 'create text t 1 2 "中文 & <文本>"']) f.run(command);
  assert.match(f.run('show r'), /x="1.5"/);
  assert.doesNotMatch(f.run('show r'), /fill=/);
  assert.match(f.run('show r'), /parent=g#G/);
  assert.throws(() => f.run('create g G'), /id already exists/);
  f.run('create g g');
  assert.throws(() => f.run('create box b 1 2 3 4 "title"'), /unknown shape type/);
  assert.throws(() => f.run('create rect a 0 0 1'), /invalid parameters/);
});

test('nested Composite move and scale undo/redo as one unit', () => {
  const f = new Fixture().init();
  ['create g outer', 'create g inner in outer', 'create rect r 10 20 30 40 in inner', 'create text t 5 6 "label" in inner', 'create line l 1 2 3 4 in outer'].forEach(line => f.run(line));
  const before = f.tree();
  f.run('move outer 2 3');
  assert.match(f.run('show r'), /x="12"/);
  assert.match(f.run('show l'), /x2="5"/);
  f.run('scale outer 2');
  const after = f.tree();
  assert.match(f.run('show r'), /width="60"/);
  f.run('undo'); f.run('undo'); assert.equal(f.tree(), before);
  f.run('redo'); f.run('redo'); assert.equal(f.tree(), after);
});

test('failed edits preserve document and redo history, successful edits invalidate redo', () => {
  const f = new Fixture().init(); f.run('create rect r 1 2 3 4'); f.run('move r 5 5'); f.run('undo');
  const before = f.tree();
  for (const line of ['scale r 0', 'scale r -1', 'scale r NaN', 'set r width -5', 'set r id other', 'move r Infinity 1', 'create g r', 'delete missing', 'create g child in r', 'create g child in missing', 'group bad r missing']) {
    assert.throws(() => f.run(line)); assert.equal(f.tree(), before, line);
  }
  f.run('redo'); assert.match(f.run('show r'), /x="6"/);
  f.run('undo'); f.run('set r fill blue'); assert.throws(() => f.run('redo'), /nothing to redo/);
});

test('overflow mid-composite rolls back earlier changed children', () => {
  const f = new Fixture().init(); ['create g g', 'create rect a 1 2 3 4 in g', 'create circle b 1e308 0 1 in g'].forEach(line => f.run(line));
  const before = f.tree(); assert.throws(() => f.run('scale g 100'), /invalid number/); assert.equal(f.tree(), before);
});

test('group keeps document order; cycle and duplicate selection rejected', () => {
  const f = new Fixture().init(); ['create g p', 'create rect a 0 0 1 1 in p', 'create circle b 2 3 4', 'create g q'].forEach(line => f.run(line));
  const before = f.tree();
  assert.throws(() => f.run('group invalid p a'), /own descendant/);
  assert.throws(() => f.run('group invalid a a'), /distinct/);
  f.run('group selected b a'); assert.ok(f.run('tree selected').indexOf('rect#a') < f.run('tree selected').indexOf('circle#b'));
  f.run('undo'); assert.equal(f.tree(), before);
  assert.throws(() => f.run('addto p p'), /own descendant/);
  f.run('create g child in p'); assert.throws(() => f.run('addto child p'), /own descendant/);
});

test('ungroup inserts children at container position; delete restores whole subtree', () => {
  const f = new Fixture().init(); ['create g p', 'create g a in p', 'create g nested in p', 'create rect r 0 0 1 1 in nested', 'create circle c 1 1 1 in nested', 'create g z in p'].forEach(line => f.run(line));
  const before = f.tree(); f.run('ungroup nested');
  const flat = f.tree(); assert.ok(flat.indexOf('g#a') < flat.indexOf('rect#r')); assert.ok(flat.indexOf('circle#c') < flat.indexOf('g#z'));
  f.run('undo'); assert.equal(f.tree(), before);
  assert.throws(() => f.run('ungroup p'), /top-level/);
  f.run('delete p'); assert.doesNotMatch(f.tree(), /rect#r/); f.run('undo'); assert.equal(f.tree(), before);
});

test('addto, front/back only change siblings and can be undone', () => {
  const f = new Fixture().init(); ['create g p', 'create g q', 'create g a in p', 'create g b in p', 'create g c in p'].forEach(line => f.run(line));
  const before = f.tree(); f.run('front a'); assert.ok(f.tree().indexOf('g#c') < f.tree().indexOf('g#a'));
  f.run('back a'); assert.equal(f.tree(), before); f.run('addto q a'); assert.match(f.run('show a'), /parent=g#q/); f.run('undo'); assert.equal(f.tree(), before);
});

test('display and read-only canvas preserve history; document operations impose barrier', () => {
  const f = new Fixture().init(); const directory = mkdtempSync(join(tmpdir(), 'svg-editor-')); const path = join(directory, 'drawing.svg');
  f.run('create g a'); f.run('tree'); f.run('show a'); f.run('help'); f.run('canvas'); f.run('undo');
  assert.doesNotMatch(f.tree(), /g#a/); f.run('redo');
  f.run(`save "${path}"`); assert.throws(() => f.run('undo'), /undo not allowed after io command/);
  f.run('create g b'); f.run('undo'); assert.match(f.tree(), /g#a/); assert.doesNotMatch(f.tree(), /g#b/);
  f.run('canvas 123 456'); assert.throws(() => f.run('redo'), /undo not allowed/);
  f.run(`read "${path}"`); assert.equal(f.run('canvas'), 'canvas 800x600'); assert.throws(() => f.run('undo'), /undo not allowed/);
  f.run('init 40 30'); assert.equal(f.run('canvas'), 'canvas 40x30'); assert.throws(() => f.run('save'), /requires a file path/);
});

test('failed IO and canvas operations preserve state, history, and default file path', () => {
  const f = new Fixture().init(), directory = mkdtempSync(join(tmpdir(), 'svg-editor-')), file = join(directory, 'ok.svg');
  f.run(`save "${file}"`); f.run('create g a'); const before = f.tree();
  writeFileSync(join(directory, 'bad.svg'), '<svg><rect></svg>');
  for (const line of [`read "${directory}/missing.svg"`, `read "${directory}/bad.svg"`, `save "${directory}/missing/file.svg"`, 'canvas -1 30', 'init 0 0']) {
    assert.throws(() => f.run(line)); assert.equal(f.tree(), before);
  }
  f.run('undo'); assert.doesNotMatch(f.tree(), /g#a/); f.run('redo'); f.run('save'); assert.match(readFileSync(file, 'utf8'), /id="a"/);
});

test('SVG round trip preserves six shapes, hierarchy, text, styles, and dimensions', () => {
  const factory = new ShapeFactory(), document = new Document(400, 300), codec = new SvgCodec();
  document.add(factory.create('g', 'scene', []));
  for (const [type, id, args] of [
    ['rect', 'r', ['1', '2', '3', '4', '#fff']], ['circle', 'c', ['1', '2', '3']],
    ['ellipse', 'e', ['1', '2', '3', '4']], ['line', 'l', ['1', '2', '3', '4', 'black']],
    ['text', 't', ['1', '2', 'a < b & "quoted" 中文']]
  ] as [string, string, string[]][]) document.add(factory.create(type, id, args), 'scene');
  document.find('r').set('stroke-width', '2');
  const source = codec.encode(document), loaded = codec.decode(source).document;
  assert.match(source, /&lt;/); assert.match(source, /&amp;/); assert.equal(codec.encode(loaded), source);
});

test('missing ids reserve all existing ids, duplicate ids and unsupported XML fail', () => {
  const codec = new SvgCodec();
  const result = codec.decode('<svg width="100" height="200"><rect/><g><rect id="rect1"/><text>hello</text></g></svg>');
  assert.ok(result.document.has('rect2')); assert.ok(result.document.has('g1')); assert.ok(result.document.has('text1'));
  assert.deepEqual(result.warnings, ['warning: assigned id rect2 to unnamed <rect>', 'warning: assigned id g1 to unnamed <g>', 'warning: assigned id text1 to unnamed <text>']);
  for (const source of ['<svg><g id="x"/><rect id="x"/></svg>', '<svg><path id="p"/></svg>', '<svg><rect id="r" transform="rotate(2)"/></svg>', '<svg><rect></svg>', '<html/>', '<!DOCTYPE svg><svg/>', '<svg><text><tspan>hi</tspan></text></svg>']) assert.throws(() => codec.decode(source));
});

test('CLI processes script input, emits one-line errors and continues', () => {
  const result = spawnSync(process.execPath, ['--import', 'tsx', 'src/cli/Main.ts'], { cwd: process.cwd(), input: '# comment\ninit\ncreate rect r 1 2 3 4\nscale r 0\nshow r\n', encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr); assert.match(result.stdout, /error: scale factor must be positive/); assert.match(result.stdout, /width="3"/); assert.doesNotMatch(result.stdout, /svg>/);
});

test('every shape supports its geometry whitelist and styles; other attributes fail', () => {
  const factory = new ShapeFactory();
  for (const [type, args, geometry] of [
    ['rect', ['1', '2', '3', '4'], ['x', 'y', 'width', 'height']],
    ['circle', ['1', '2', '3'], ['cx', 'cy', 'r']],
    ['ellipse', ['1', '2', '3', '4'], ['cx', 'cy', 'rx', 'ry']],
    ['line', ['1', '2', '3', '4'], ['x1', 'y1', 'x2', 'y2']],
    ['text', ['1', '2', 'hello'], ['x', 'y']], ['g', [], []]
  ] as [string, string[], string[]][]) {
    const shape = factory.create(type, 's', args);
    for (const attr of geometry) { shape.set(attr, '5'); assert.equal(shape.get(attr), '5'); }
    for (const attr of ['fill', 'stroke', 'stroke-width']) shape.set(attr, attr === 'stroke-width' ? '2' : '#f00');
    assert.throws(() => shape.set('bogus', '1'), /unknown attribute/);
    if (type !== 'text') assert.throws(() => shape.set('text', 'wrong'), /unknown attribute/);
    if (type !== 'g') {
      shape.scale(2); for (const attr of geometry) assert.equal(shape.get(attr), '10');
      assert.equal(shape.get('stroke-width'), '2');
    }
  }
});

test('rejects unsupported root rendering semantics rather than silently changing appearance', () => {
  const codec = new SvgCodec();
  assert.throws(() => codec.decode('<svg width="100" height="100" viewBox="10 20 50 50"/>'), /unsupported viewBox/);
  assert.throws(() => codec.decode('<svg fill="red"/>'), /unsupported SVG root attribute/);
  assert.equal(codec.decode('<svg width="100" height="100" viewBox="0,0,100,100"/>').document.width, 100);
  const fallback = codec.decode('<svg><g id="box" data-kind="box"><rect id="part"/></g></svg>');
  assert.equal(fallback.document.find('box').type, 'g');
});
