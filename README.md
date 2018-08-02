<a href="https://www.npmjs.com/package/inline-source-webpack-plugin"><img src="https://img.shields.io/npm/v/inline-source-webpack-plugin.svg" alt="Version"></a>

# inline-source-webpack-plugin
A webpack plugin to embed css/js resource in the html with inline-source module(webpack 4.x and HtmlWebpackPlugin is needed).
> This plugin doesn't support webpack v1.x,v2.x and v3.x. If you need this feature, you can try [this](https://github.com/KyLeoHC/inline-resource-plugin).

## Install
```bash
$ npm install -S inline-source-webpack-plugin
```

## example
```html
<!-- ./build/hello.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>test</title>
    <link href="inline.css" inline>
    <script src="inline.js" inline></script>
</head>
<body>
<div class="container">
    <h1>hello world!</h1>
</div>
</body>
</html>
```

```js
/* ./src/inline.js */
function Person() {
}

Person.prototype.sayHello = function () {
    var word = 'hello';
    console.log(word);
};
```

```css
/* ./src/inline.css */
.container {
    border: 1px solid #000;
}
```

Output:
```html
<!-- ./build/hello.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>test</title>
    <style>.container{border:1px solid #000}</style>
    <script>function Person(){}Person.prototype.sayHello=function(){var o="hello";console.log(o)};</script>
</head>
<body>
<div class="container">
    <h1>hello world!</h1>
</div>
</body>
</html>
```

## Usage
Available `options` include(refer to [this](https://github.com/popeindustries/inline-source#usage) for more options):
- `compress`: enable/disable compression.(default `false`)
- `rootpath`: path used for resolving inlineable paths.

```javascript
// webpack.config.js example
const HtmlWebpackPlugin = require('html-webpack-plugin');
const InlineSourceWebpackPlugin = require('inline-source-webpack-plugin');

module.exports = {
    ...
    plugins: [
        new HtmlWebpackPlugin({
            ...
        }),
        new InlineSourceWebpackPlugin({
            compress: true,
            rootpath: './src'
        })
    ]
};
```

## License

[MIT License](https://github.com/KyLeoHC/inline-source-webpack-plugin/blob/master/LICENSE)