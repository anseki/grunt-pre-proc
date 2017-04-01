# grunt-pre-proc

[![npm](https://img.shields.io/npm/v/grunt-pre-proc.svg)](https://www.npmjs.com/package/grunt-pre-proc) [![GitHub issues](https://img.shields.io/github/issues/anseki/grunt-pre-proc.svg)](https://github.com/anseki/grunt-pre-proc/issues) [![David](https://img.shields.io/david/anseki/grunt-pre-proc.svg)](package.json) [![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE-MIT)

This [Grunt](http://gruntjs.com/) plugin is wrapper of [preProc](https://github.com/anseki/pre-proc).

* [gulp](http://gulpjs.com/) plugin: [gulp-pre-proc](https://github.com/anseki/gulp-pre-proc)
* [webpack](https://webpack.js.org/) loader: [pre-proc-loader](https://github.com/anseki/pre-proc-loader)

The super simple preprocessor for front-end development.  
See [preProc](https://github.com/anseki/pre-proc) for options and more information about preProc.

## Getting Started

This plugin requires Grunt `~0.4.1`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-pre-proc --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-pre-proc');
```

## Usage

In your project's Gruntfile, add a section named `preProc` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  preProc: {
    deploy: {
      options: {
        // Remove `DEBUG` contents from all files in `dir1` directory and all JS files.
        removeTag: {tag: 'DEBUG', pathTest: ['/path/to/dir1', /\.js$/]}
      },
      expand: true,
      cwd: 'develop/',
      src: '**/*',
      dest: 'public_html/'
    }
  }
});
```

## Options

### `removeTag`

If `removeTag` option is specified, call [`removeTag`](https://github.com/anseki/pre-proc#removetag) method with current content.

You can specify an object that has properties as arguments of the method.  
Following properties are accepted:

- `tag`
- `pathTest`

Also, you can specify common values for the arguments into upper layer. That is, the `options.pathTest` is used when `options.removeTag.pathTest` is not specified.

If the `pathTest` is specified, current source file path is tested with the `pathTest`. If there are multiple source files (e.g. `src: ['file1', 'file2']`, `src: '*.js'`, etc.), the first file path is tested.

For example:

```js
grunt.initConfig({
  preProc: {
    deploy: {
      options: {
        tag: 'DEBUG',           // common
        pathTest: '/path/to',   // common

        removeTag: {},                            // tag: 'DEBUG', pathTest: '/path/to'
        replaceTag: {tag: ['SPEC1', 'SPEC2']},    // tag: ['SPEC1', 'SPEC2'], pathTest: '/path/to'
        pickTag: {}                               // tag: 'DEBUG', pathTest: '/path/to'
      },
      // ...
    }
  }
});
```

### `replaceTag`

If `replaceTag` option is specified, call [`replaceTag`](https://github.com/anseki/pre-proc#replacetag) method with current content.

You can specify arguments by the same way as the [`removeTag`](#removetag).  
Following arguments are accepted:

- `tag`
- `pathTest`

And the `options.replaceTag.replacement` also is accepted. (Not `options.replacement`)

### `pickTag`

If `pickTag` option is specified, call [`pickTag`](https://github.com/anseki/pre-proc#picktag) method with current content.

You can specify arguments by the same way as the [`removeTag`](#removetag).  
Following argument is accepted:

- `tag`
