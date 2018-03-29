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
      var srcFiles = f.src.filter(function(filepath) {
          // Warn on and remove invalid source files (if nonull was set).
          if (!grunt.file.exists(filepath)) {
            grunt.log.warn('Source file "' + filepath + '" not found.');
            return false;
          }
          if (!srcPath) { srcPath = require('path').resolve(filepath); }
          return true;
        }),
        content = srcFiles.length
          ? srcFiles.map(function(filepath) { return grunt.file.read(filepath); })
            .join(grunt.util.linefeed) :
          null;

      if (content == null) { return; }

      // pickTag
      if (options.pickTag) {
        content = preProc.pickTag(options.pickTag.tag || options.tag, content);
      }

      if (content != null) {
        // replaceTag
        if (options.replaceTag) {
          pathTest = options.replaceTag.pathTest || options.pathTest;
          content = preProc.replaceTag(options.replaceTag.tag || options.tag,
            options.replaceTag.replacement, content, pathTest ? srcPath : null, pathTest);
        }

        // removeTag
        if (options.removeTag) {
          pathTest = options.removeTag.pathTest || options.pathTest;
          content = preProc.removeTag(options.removeTag.tag || options.tag,
            content, pathTest ? srcPath : null, pathTest);
        }

        // Write the destination file.
        grunt.file.write(f.dest, content);
        grunt.log.writeln('File "' + f.dest + '" created.');

      } else { // The content was changed to null by pickTag.
        var errorMessage = 'Not found tag: ' + (options.pickTag.tag || options.tag);
        if (!options.pickTag.allowErrors) {
          grunt.warn(new Error(errorMessage));
          return;
        }
        grunt.log.warn(errorMessage);
      }
    });
  });

};
