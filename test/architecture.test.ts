import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, basename } from 'node:path';

test('production imports follow documented layer boundaries; classes match filenames', () => {
  const allowed: Record<string, string[]> = {
    domain: ['domain'], application: ['domain', 'application'],
    infrastructure: ['domain', 'application', 'infrastructure'],
    cli: ['cli', 'application', 'infrastructure']
  };
  for (const layer of Object.keys(allowed)) {
    const directory = join(process.cwd(), 'src', layer);
    const visit = (path: string): void => {
      for (const entry of readdirSync(path, { withFileTypes: true })) {
        const file = join(path, entry.name);
        if (entry.isDirectory()) { visit(file); continue; }
        if (!file.endsWith('.ts')) continue;
        const source = readFileSync(file, 'utf8');
        const classes = [...source.matchAll(/export (?:abstract )?class (\w+)/g)];
        assert.ok(classes.length <= 1, file);
        for (const match of classes) assert.equal(match[1], basename(file, '.ts'), file);
        for (const match of source.matchAll(/from ['"]([^'"]+)['"]/g)) {
          const imported = match[1]!;
          if (!imported.startsWith('.')) {
            assert.ok(layer === 'infrastructure' || layer === 'cli', `${file} imports external package ${imported}`);
            continue;
          }
          const resolved = join(path, imported).replaceAll('\\', '/');
          const target = resolved.split('/src/')[1]!.split('/')[0]!;
          assert.ok(allowed[layer]!.includes(target), `${layer} -> ${target}: ${file}`);
        }
        assert.doesNotMatch(source, /switch\s*\(/, file);
      }
    };
    visit(directory);
  }
});
