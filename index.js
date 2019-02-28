const HtmlWebpackPlugin = require('html-webpack-plugin');
const { inlineSource } = require('inline-source');
const { getTagRegExp } = require('inline-source/lib/utils');
const htmlparser = require('htmlparser2');

class InlineSourceWebpackPlugin {
  constructor(options = {}) {
    this.deleteAssets = [];
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
        const regExp = new RegExp(bundle);
        for (let name in compilation.assets) {
          if (regExp.test(name)) {
            source.content = compilation.assets[name].source();
            if (source.type === 'css') {
              // change tag type
              source.tag = 'style';
            }
            if (source.props['bundle-delete']) {
              // mark the asset that need to delete
              this.deleteAssets.push({
                name,
                regExp
              });
            }
            break;
          }
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
        data.html = this._deleteTag(html);
        cb(null, data);
      })
      .catch(error => {
        cb(null, data);
        compilation.errors.push(error);
      });
  }

  /**
   * delete the tag of inline file
   * @param html
   * @returns {*}
   * @private
   */
  _deleteTag(html) {
    let needDelete = false;
    const tagRegExp = getTagRegExp(false);
    const parser = new htmlparser.Parser(
      new htmlparser.DomHandler((error, dom) => {
        if (error) throw error;
        const attributes = dom[0].attribs;
        const url = attributes.href || attributes.src;
        needDelete = this.deleteAssets.some(bundle => {
          return bundle.regExp.test(url);
        });
      })
    );

    return html.replace(tagRegExp, match => {
      parser.parseComplete(match);
      return needDelete ? '' : match;
    });
  }

  /**
   * delete target asset
   * @param compilation
   * @private
   */
  _deleteAsset(compilation) {
    if (this.deleteAssets.length) {
      this.deleteAssets.forEach(bundle => delete compilation.assets[bundle.name]);
    }
    this.deleteAssets = [];
  }

  apply(compiler) {
    if ('hooks' in compiler) {
      // webpack 4 or higher
      const name = this.constructor.name;
      if (HtmlWebpackPlugin.version >= 4) {
        // HtmlWebpackPlugin 4 or higher
        compiler.hooks.compilation.tap(name, compilation => {
          HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync(
            name, // Set a meaningful name here for stack traces
            (data, cb) => {
              this._process(compilation, data, cb);
            }
          );
        });
      } else {
        // HtmlWebpackPlugin 3 or lower
        compiler.hooks.compilation.tap(name, compilation => {
          // if htmlWebpackPlugin is not exist, just do nothing
          if (compilation.hooks.htmlWebpackPluginAfterHtmlProcessing) {
            compilation.hooks.htmlWebpackPluginAfterHtmlProcessing.tapAsync(
              name,
              (data, cb) => {
                this._process(compilation, data, cb);
              }
            );
          }
        });
      }
      compiler.hooks.emit.tapAsync(name, (compilation, callback) => {
        this._deleteAsset(compilation);
        callback && callback();
      });
    } else {
      // webpack 2 or 3
      compiler.plugin('compilation', compilation => {
        compilation.plugin('html-webpack-plugin-after-html-processing', (data, cb) => {
          this._process(compilation, data, cb);
        });
      });
      compiler.plugin('emit', (compilation, callback) => {
        this._deleteAsset(compilation);
        callback && callback();
      });
    }
  }
}

module.exports = InlineSourceWebpackPlugin;
