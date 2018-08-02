const {inlineSource} = require('inline-source');

class InlineSourceWebpackPlugin {
    constructor(options = {}) {
        this.name = 'InlineSourceWebpackPlugin';
        this.options = Object.assign({
            compress: false
        }, options);
    }

    apply(compiler) {
        compiler.hooks.compilation.tap(this.name, compilation => {
            // if htmlWebpackPlugin is not exist, just do nothing
            if (compilation.hooks.htmlWebpackPluginAfterHtmlProcessing) {
                compilation.hooks.htmlWebpackPluginAfterHtmlProcessing.tapAsync(
                    this.name,
                    (data, cb) => {
                        const options = Object.assign({}, this.options);
                        options.handlers = (source, context) => {
                            if (context && context.sources && context.sources.length) {
                                // watch inline target
                                context.sources.forEach(item => {
                                    if (compilation.fileDependencies.add) {
                                        compilation.fileDependencies.add(item.filepath);
                                    } else {
                                        // Before Webpack 4 - fileDepenencies was an array
                                        compilation.fileDependencies.push(item.filepath);
                                    }
                                });
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
                );
            }
        });
    }
}

module.exports = InlineSourceWebpackPlugin;
