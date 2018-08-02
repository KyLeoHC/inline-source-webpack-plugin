const {inlineSource} = require('inline-source');

class InlineResourceWebpackPlugin {
    constructor(options = {}) {
        this.options = options;
        this.name = 'InlineResourceWebpackPlugin';
    }

    apply(compiler) {
        compiler.hooks.compilation.tap(this.name, compilation => {
            if (compilation.hooks.htmlWebpackPluginAfterHtmlProcessing) {
                compilation.hooks.htmlWebpackPluginAfterHtmlProcessing.tapAsync(
                    this.name,
                    (data, cb) => {
                        inlineSource(data.html, this.options)
                            .then(html => {
                                data.html = html;
                                cb(null, data);
                            })
                            .catch(error => {
                                cb(null, data);
                                throw error;
                            });
                    }
                );
            }
        });
    }
}

module.exports = InlineResourceWebpackPlugin;
