'use strict';

let pickTagRturnsNull;
const expect = require('chai').expect,
  sinon = require('sinon'),
  proxyquire = require('proxyquire').noPreserveCache(),
  preProc = {
    replaceTag: sinon.spy((tag, replacement, content) => `${content}<replaceTag>`),
    removeTag: sinon.spy((tag, content) => `${content}<removeTag>`),
    pickTag: sinon.spy((tag, content) => (pickTagRturnsNull ? null : `${content}<pickTag>`)),
    '@global': true
  },
  grunt = proxyquire('./init-grunt.js', {'pre-proc': preProc}),
  path = require('path'),

  FIXTURES_DIR_PATH = path.resolve(__dirname, 'fixtures'),
  ALL_CONTENTS = ['content-1.html', 'content-2.html']
    .map(fileName => require('fs').readFileSync(
      path.join(FIXTURES_DIR_PATH, fileName), {encoding: 'utf8'}))
    .join(grunt.util.linefeed),
  SRC1_PATH = path.join(FIXTURES_DIR_PATH, 'content-1.html'),
  OUTPUT_PATH = 'path/to/output';

function resetAll() {
  preProc.replaceTag.resetHistory();
  preProc.removeTag.resetHistory();
  preProc.pickTag.resetHistory();
  grunt.file.write.resetHistory();
  grunt.warn.resetHistory();
}

function runTask(options, done, files) {
  grunt.initConfig({
    preProc: {
      test: {
        options,
        files: files || [{
          src: `${FIXTURES_DIR_PATH}/*.html`,
          dest: OUTPUT_PATH
        }]
      }
    }
  });
  grunt.task.options({done});
  grunt.task.run('default');
  grunt.task.start({asyncDone: true});
}

grunt.registerTask('default', ['preProc:test']);
sinon.stub(grunt.file, 'write');
sinon.stub(grunt, 'warn');

describe('implements a basic flow as file based plugin', () => {

  it('should skip process if no file is input', done => {
    resetAll();
    runTask(
      {replaceTag: {}}, // Dummy option
      () => {
        expect(preProc.replaceTag.notCalled).to.be.true;
        expect(preProc.removeTag.notCalled).to.be.true;
        expect(preProc.pickTag.notCalled).to.be.true;
        expect(grunt.file.write.notCalled).to.be.true;

        done();
      },
      [{
        src: `${FIXTURES_DIR_PATH}/*.txt`,
        dest: OUTPUT_PATH
      }]
    );
  });

  it('should accept contents from all source files', done => {
    resetAll();
    runTask(
      {},
      () => {
        expect(preProc.replaceTag.notCalled).to.be.true;
        expect(preProc.removeTag.notCalled).to.be.true;
        expect(preProc.pickTag.notCalled).to.be.true;
        expect(grunt.file.write.calledOnceWithExactly(
          OUTPUT_PATH, ALL_CONTENTS)).to.be.true;

        done();
      }
    );
  });

});

describe('when option for each method is passed', () => {

  it('should call only pickTag', done => {
    resetAll();
    runTask(
      {pickTag: {}},
      () => {
        expect(preProc.replaceTag.notCalled).to.be.true;
        expect(preProc.removeTag.notCalled).to.be.true;
        expect(preProc.pickTag.calledOnce).to.be.true;

        done();
      }
    );
  });

  it('should call replaceTag and pickTag', done => {
    resetAll();
    runTask(
      {replaceTag: {}, pickTag: {}},
      () => {
        expect(preProc.replaceTag.calledOnce).to.be.true;
        expect(preProc.removeTag.notCalled).to.be.true;
        expect(preProc.pickTag.calledOnce).to.be.true;

        done();
      }
    );
  });

});

describe('pickTag()', () => {

  describe('should call the method with preferred tag', () => {
    [
      {
        options: {pickTag: {/* tag: 'SPEC'*/}/* , tag: 'SHARE'*/},
        expectedTag: void 0
      },
      {
        options: {pickTag: {/* tag: 'SPEC'*/}, tag: 'SHARE'},
        expectedTag: 'SHARE'
      },
      {
        options: {pickTag: {tag: 'SPEC'}/* , tag: 'SHARE'*/},
        expectedTag: 'SPEC'
      },
      {
        options: {pickTag: {tag: 'SPEC'}, tag: 'SHARE'},
        expectedTag: 'SPEC'
      }
    ].forEach(test => {
      it(`options.pickTag.tag: ${test.options.pickTag.tag || 'NONE'}` +
          ` / options.tag: ${test.options.tag || 'NONE'}`, done => {
        resetAll();
        runTask(
          test.options,
          () => {
            expect(preProc.replaceTag.notCalled).to.be.true;
            expect(preProc.removeTag.notCalled).to.be.true;
            expect(preProc.pickTag.calledOnceWithExactly(test.expectedTag, ALL_CONTENTS)).to.be.true;

            done();
          }
        );
      });
    });
  });

});

describe('replaceTag()', () => {

  describe('should call the method with preferred tag', () => {
    [
      {
        options: {replaceTag: {/* tag: 'SPEC'*/}/* , tag: 'SHARE'*/},
        expectedTag: void 0
      },
      {
        options: {replaceTag: {/* tag: 'SPEC'*/}, tag: 'SHARE'},
        expectedTag: 'SHARE'
      },
      {
        options: {replaceTag: {tag: 'SPEC'}/* , tag: 'SHARE'*/},
        expectedTag: 'SPEC'
      },
      {
        options: {replaceTag: {tag: 'SPEC'}, tag: 'SHARE'},
        expectedTag: 'SPEC'
      }
    ].forEach(test => {
      it(`options.replaceTag.tag: ${test.options.replaceTag.tag || 'NONE'}` +
          ` / options.tag: ${test.options.tag || 'NONE'}`, done => {
        resetAll();
        test.options.replaceTag.replacement = 'replacement';
        runTask(
          test.options,
          () => {
            expect(preProc.replaceTag.calledOnceWithExactly(test.expectedTag,
              'replacement', ALL_CONTENTS, null, void 0)).to.be.true;
            expect(preProc.removeTag.notCalled).to.be.true;
            expect(preProc.pickTag.notCalled).to.be.true;

            done();
          }
        );
      });
    });
  });

  describe('should call the method with preferred srcPath and pathTest', () => {
    [
      {
        options: {replaceTag: {/* pathTest: 'SPEC'*/}/* , pathTest: 'SHARE'*/},
        expected: {srcPath: null, pathTest: void 0}
      },
      {
        options: {replaceTag: {/* pathTest: 'SPEC'*/}, pathTest: 'SHARE'},
        expected: {srcPath: SRC1_PATH, pathTest: 'SHARE'}
      },
      {
        options: {replaceTag: {pathTest: 'SPEC'}/* , pathTest: 'SHARE'*/},
        expected: {srcPath: SRC1_PATH, pathTest: 'SPEC'}
      },
      {
        options: {replaceTag: {pathTest: 'SPEC'}, pathTest: 'SHARE'},
        expected: {srcPath: SRC1_PATH, pathTest: 'SPEC'}
      }
    ].forEach(test => {
      it(`options.replaceTag.pathTest: ${test.options.replaceTag.pathTest || 'NONE'}` +
          ` / options.pathTest: ${test.options.pathTest || 'NONE'}`, done => {
        resetAll();
        test.options.replaceTag.tag = 'TAG';
        test.options.replaceTag.replacement = 'replacement';
        runTask(
          test.options,
          () => {
            expect(preProc.replaceTag.calledOnceWithExactly('TAG', 'replacement', ALL_CONTENTS,
              test.expected.srcPath, test.expected.pathTest)).to.be.true;
            expect(preProc.removeTag.notCalled).to.be.true;
            expect(preProc.pickTag.notCalled).to.be.true;

            done();
          }
        );
      });
    });
  });

});

describe('removeTag()', () => {

  describe('should call the method with preferred tag', () => {
    [
      {
        options: {removeTag: {/* tag: 'SPEC'*/}/* , tag: 'SHARE'*/},
        expectedTag: void 0
      },
      {
        options: {removeTag: {/* tag: 'SPEC'*/}, tag: 'SHARE'},
        expectedTag: 'SHARE'
      },
      {
        options: {removeTag: {tag: 'SPEC'}/* , tag: 'SHARE'*/},
        expectedTag: 'SPEC'
      },
      {
        options: {removeTag: {tag: 'SPEC'}, tag: 'SHARE'},
        expectedTag: 'SPEC'
      }
    ].forEach(test => {
      it(`options.removeTag.tag: ${test.options.removeTag.tag || 'NONE'}` +
          ` / options.tag: ${test.options.tag || 'NONE'}`, done => {
        resetAll();
        runTask(
          test.options,
          () => {
            expect(preProc.replaceTag.notCalled).to.be.true;
            expect(preProc.removeTag.calledOnceWithExactly(test.expectedTag,
              ALL_CONTENTS, null, void 0)).to.be.true;
            expect(preProc.pickTag.notCalled).to.be.true;

            done();
          }
        );
      });
    });
  });

  describe('should call the method with preferred srcPath and pathTest', () => {
    [
      {
        options: {removeTag: {/* pathTest: 'SPEC'*/}/* , pathTest: 'SHARE'*/},
        expected: {srcPath: null, pathTest: void 0}
      },
      {
        options: {removeTag: {/* pathTest: 'SPEC'*/}, pathTest: 'SHARE'},
        expected: {srcPath: SRC1_PATH, pathTest: 'SHARE'}
      },
      {
        options: {removeTag: {pathTest: 'SPEC'}/* , pathTest: 'SHARE'*/},
        expected: {srcPath: SRC1_PATH, pathTest: 'SPEC'}
      },
      {
        options: {removeTag: {pathTest: 'SPEC'}, pathTest: 'SHARE'},
        expected: {srcPath: SRC1_PATH, pathTest: 'SPEC'}
      }
    ].forEach(test => {
      it(`options.removeTag.pathTest: ${test.options.removeTag.pathTest || 'NONE'}` +
          ` / options.pathTest: ${test.options.pathTest || 'NONE'}`, done => {
        resetAll();
        test.options.removeTag.tag = 'TAG';
        runTask(
          test.options,
          () => {
            expect(preProc.replaceTag.notCalled).to.be.true;
            expect(preProc.removeTag.calledOnceWithExactly('TAG', ALL_CONTENTS,
              test.expected.srcPath, test.expected.pathTest)).to.be.true;
            expect(preProc.pickTag.notCalled).to.be.true;

            done();
          }
        );
      });
    });
  });

});

describe('passed/returned value', () => {
  const OPTS_METHODS = {pickTag: {}, replaceTag: {}, removeTag: {}, tag: 'TAG1'},
    R_METHODS = `${ALL_CONTENTS}<pickTag><replaceTag><removeTag>`;

  it('should return processed value by all required methods', done => {
    pickTagRturnsNull = false;

    resetAll();
    runTask(
      OPTS_METHODS,
      () => {
        expect(grunt.file.write.calledOnceWithExactly(
          OUTPUT_PATH, R_METHODS)).to.be.true;
        expect(preProc.replaceTag.calledOnce).to.be.true;
        expect(preProc.removeTag.calledOnce).to.be.true;
        expect(preProc.pickTag.calledOnce).to.be.true;

        done();
      }
    );
  });

  it('should not save file when no file is input', done => {
    pickTagRturnsNull = false;

    resetAll();
    runTask(
      OPTS_METHODS,
      () => {
        expect(grunt.file.write.notCalled).to.be.true;
        expect(preProc.replaceTag.notCalled).to.be.true;
        expect(preProc.removeTag.notCalled).to.be.true;
        expect(preProc.pickTag.notCalled).to.be.true;

        done();
      },
      [{
        src: `${FIXTURES_DIR_PATH}/*.txt`,
        dest: OUTPUT_PATH
      }]
    );
  });

  it('should throw an error if pickTag returned null', done => {
    const OPTS_PICKTAG = {pickTag: {}, tag: 'TAG1'},
      R_PICKTAG = `${ALL_CONTENTS}<pickTag>`,
      ERR_MSG = `Not found tag: ${OPTS_PICKTAG.tag}`;
    pickTagRturnsNull = false;

    resetAll();
    runTask(
      OPTS_PICKTAG,
      () => {
        expect(grunt.file.write.calledOnceWithExactly(
          OUTPUT_PATH, R_PICKTAG)).to.be.true;
        expect(preProc.pickTag.calledOnce).to.be.true;

        // Returns null
        pickTagRturnsNull = true;

        resetAll();
        runTask(
          OPTS_PICKTAG,
          () => {
            expect(preProc.pickTag.calledOnce).to.be.true;
            expect(grunt.warn.calledOnce).to.be.true;
            // expect(grunt.warn.args[0] instanceof Error).to.be.true;
            // expect(grunt.warn.args[0]).to.be.an('error', ERR_MSG);
            // These above don't work well...
            // https://github.com/chaijs/chai/issues/930
            expect(grunt.warn.args[0].toString()).to.equal(`Error: ${ERR_MSG}`);

            done();
          }
        );
      }
    );
  });

  it('should control an error by allowErrors', done => {
    const
      OPTS1 = {tag: 'TAG1', pickTag: {}},
      OPTS2 = {tag: 'TAG1', pickTag: {allowErrors: false}},
      OPTS3 = {tag: 'TAG1', pickTag: {allowErrors: true}},
      ERR_MSG = `Not found tag: ${OPTS1.tag}`;
    pickTagRturnsNull = true;

    resetAll();
    runTask(
      OPTS1,
      () => {
        expect(grunt.warn.calledOnce).to.be.true;
        expect(grunt.warn.args[0].toString()).to.equal(`Error: ${ERR_MSG}`);

        resetAll();
        runTask(
          OPTS2,
          () => {
            expect(grunt.warn.calledOnce).to.be.true;
            expect(grunt.warn.args[0].toString()).to.equal(`Error: ${ERR_MSG}`);

            resetAll();
            runTask(
              OPTS3,
              () => {
                expect(grunt.warn.notCalled).to.be.true;
                expect(grunt.file.write.notCalled).to.be.true;

                done();
              }
            );
          }
        );
      }
    );
  });

  it('should not save file if pickTag returned null with allowErrors', done => {
    const OPTS_PICKTAG = {pickTag: {allowErrors: true}, tag: 'TAG1'},
      R_PICKTAG = `${ALL_CONTENTS}<pickTag>`;
    pickTagRturnsNull = false;

    resetAll();
    runTask(
      OPTS_PICKTAG,
      () => {
        expect(grunt.file.write.calledOnceWithExactly(
          OUTPUT_PATH, R_PICKTAG)).to.be.true;
        expect(preProc.pickTag.calledOnce).to.be.true;

        // Returns null
        pickTagRturnsNull = true;

        resetAll();
        runTask(
          OPTS_PICKTAG,
          () => {
            expect(grunt.file.write.notCalled).to.be.true;
            expect(preProc.pickTag.calledOnce).to.be.true;

            done();
          }
        );
      }
    );
  });

  it('should not call other methods when pickTag returned null', done => {
    const OPTS_METHODS_ARR =
      {pickTag: {allowErrors: true}, replaceTag: {}, removeTag: {}, tag: 'TAG1'};
    pickTagRturnsNull = false;

    resetAll();
    runTask(
      OPTS_METHODS_ARR,
      () => {
        expect(grunt.file.write.calledOnceWithExactly(
          OUTPUT_PATH, R_METHODS)).to.be.true;
        expect(preProc.replaceTag.calledOnce).to.be.true;
        expect(preProc.removeTag.calledOnce).to.be.true;
        expect(preProc.pickTag.calledOnce).to.be.true;

        // Returns null
        pickTagRturnsNull = true;

        resetAll();
        runTask(
          OPTS_METHODS_ARR,
          () => {
            expect(grunt.file.write.notCalled).to.be.true;
            expect(preProc.replaceTag.notCalled).to.be.true;
            expect(preProc.removeTag.notCalled).to.be.true;
            expect(preProc.pickTag.calledOnce).to.be.true;

            done();
          }
        );
      }
    );
  });

});
