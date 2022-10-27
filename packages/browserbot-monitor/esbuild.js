const esbuild = require('esbuild');

function getBuildOptions(more = {}) {
  const watch = process.argv.includes('-w');

  const options = {
    color: true,
    logLevel: 'error',
    entryPoints: ['src/index.ts', 'src/session.monitor.ts'],
    tsconfig: './tsconfig.json',
    bundle: true,
    sourcemap: true
  };
  if (watch) {
    options.watch = {
      onRebuild(error, result) {
        if (error) console.error('watch build failed:', error);
        else console.log('watch build succeeded:', result);
      }
    };
  }
  return { ...options, ...more };
}

function build(options) {
  esbuild.build(getBuildOptions(options)).catch(() => process.exit(1));
}

build({
  outdir: 'dist/',
  format: 'esm',
  target: ['esnext']
});
