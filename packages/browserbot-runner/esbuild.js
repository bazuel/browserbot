const esbuild = require('esbuild');

function getBuildOptions(more = {}) {
    const watch = process.argv.includes("-w")

    const options = {
        platform: "node",
        color: true,
        logLevel: 'error',
        outdir: "dist",
        entryPoints: ['src/index.ts'],
        bundle: true,
        sourcemap: true,
    }
    if (watch) {
        options.watch = {
            onRebuild(error, result) {
                if (error) console.error('watch build failed:', error)
                else {
                    console.log('watch build succeeded:', result)
                }
            },
        }
    }
    return {...options, ...more}
}

function build(options) {
    esbuild
        .build(getBuildOptions(options))
        .catch(() => process.exit(1));
}

const options = {
    target: ['esnext']
}

const prod = process.argv.includes("--prod")
if (prod) {
    console.log("Building for production")
    options.minify = true
}

build(options)
