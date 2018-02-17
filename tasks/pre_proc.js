/*
 * grunt-pre-proc
 * https://github.com/anseki/grunt-pre-proc
 *
 * Copyright (c) 2018 anseki
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  var preProc = require('pre-proc');

  grunt.registerMultiTask('preProc', 'The super simple preprocessor for front-end development.', function() {
    var options = this.options();

    this.files.forEach(function(f) {
      var srcPath, pathTest;

      // Concat specified files.
      var src = f.src.filter(function(filepath) {
        // Warn on and remove invalid source files (if nonull was set).
        if (!grunt.file.exists(filepath)) {
          grunt.log.warn('Source file "' + filepath + '" not found.');
          return false;
        } else {
          if (!srcPath) { srcPath = require('path').resolve(filepath); }
          return true;
        }
      }).map(function(filepath) {
        return grunt.file.read(filepath);
      }).join(grunt.util.linefeed);

      // pickTag
      if (options.pickTag) {
        src = preProc.pickTag(options.pickTag.tag || options.tag, src);
      }

      // replaceTag
      if (options.replaceTag) {
        pathTest = options.replaceTag.pathTest || options.pathTest;
        src = preProc.replaceTag(options.replaceTag.tag || options.tag,
          options.replaceTag.replacement, src, pathTest ? srcPath : null, pathTest);
      }

      // removeTag
      if (options.removeTag) {
        pathTest = options.removeTag.pathTest || options.pathTest;
        src = preProc.removeTag(options.removeTag.tag || options.tag,
          src, pathTest ? srcPath : null, pathTest);
      }

      // Write the destination file.
      grunt.file.write(f.dest, src);
      grunt.log.writeln('File "' + f.dest + '" created.');
    });
  });

};
