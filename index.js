const {inlineSource} = require('inline-source');

class InlineSourceWebpackPlugin {
    constructor(options = {}) {
        this.options = Object.assign({
            compress: false
        }, options);
    }

    /**
     * process html
     * @param compilation
     * @param data
     * @param cb
     * @private
     */
    _process(compilation, data, cb) {
        const options = Object.assign({}, this.options);
        options.handlers = (source, context) => {
            const bundle = source.props.bundle;
            if (bundle) {
                for (let name in compilation.assets) {
                    if (name.indexOf(bundle) > -1) {
                        source.content = compilation.assets[name].source();
                        break;
                    }
                }
                if (!source.content) {
                    compilation.errors.push(new Error(`[${this.constructor.name}]:no asset match '${bundle}'.`));
                }
            }
            if (source.filepath) {
                // watch inline target
                if (compilation.fileDependencies.add) {
                    compilation.fileDependencies.add(source.filepath);
                } else {
                    // Before Webpack 4
                    // fileDepenencies was an array
                    compilation.fileDependencies.push(source.filepath);
                }
            }
            if (this.options.handlers) {
                return this.options.handlers(source, context);
            }
            return Promise.resolve();
        };
        inlineSource(data.html, options)
            .then(html => {
                data.html = html;
                cb(null, data);
            })
            .catch(error => {
                cb(null, data);
                compilation.errors.push(error);
            });
    }

    apply(compiler) {
        if ('hooks' in compiler) {
            // webpack 4 or higher
            compiler.hooks.compilation.tap(this.constructor.name, compilation => {
                // if htmlWebpackPlugin is not exist, just do nothing
                if (compilation.hooks.htmlWebpackPluginAfterHtmlProcessing) {
                    compilation.hooks.htmlWebpackPluginAfterHtmlProcessing.tapAsync(
                        this.constructor.name,
                        (data, cb) => {
                            this._process(compilation, data, cb);
                        }
                    );
                }
            });
        } else {
            // webpack 2 or 3
            compiler.plugin('compilation', compilation => {
                compilation.plugin('html-webpack-plugin-after-html-processing', (data, cb) => {
                    this._process(compilation, data, cb);
                });
            });
        }
    }
}

module.exports = InlineSourceWebpackPlugin;
