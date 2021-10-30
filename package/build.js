const { build } = require('esbuild');

build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.js',
  loader: { '.ts': 'ts' },
  bundle: true,
  platform: 'node',
  watch: true,
  external: ['esbuild'],
});
