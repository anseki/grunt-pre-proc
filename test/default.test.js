'use strict';

let pickTagRturnsNull;
const expect = require('chai').expect,
  sinon = require('sinon'),
  proxyquire = require('proxyquire').noPreserveCache(),
  preProc = {
    pickTag: sinon.spy((tag, content) => (pickTagRturnsNull ? null : `${content}<pickTag>`)),
    replaceTag: sinon.spy((tag, replacement, content) => `${content}<replaceTag>`),
    removeTag: sinon.spy((tag, content) => `${content}<removeTag>`),
    '@global': true
  },
  grunt = proxyquire('./init-grunt.js', {'pre-proc': preProc}),
  path = require('path'),

  FIXTURES_DIR_PATH = path.resolve(__dirname, 'fixtures'),
  ALL_CONTENTS = ['content-1.html', 'content-2.html']
    .map(fileName => require('fs').readFileSync(
      path.join(FIXTURES_DIR_PATH, fileName), {encoding: 'utf8'}))
    .join(grunt.util.linefeed),
  OUTPUT_PATH = 'path/to/output',
  SRC1_PATH = path.join(FIXTURES_DIR_PATH, 'content-1.html'),
  LIB_NAME = 'preProc';

function resetAll() {
  preProc.pickTag.resetHistory();
  preProc.replaceTag.resetHistory();
  preProc.removeTag.resetHistory();
  grunt.file.write.resetHistory();
  grunt.warn.resetHistory();
}

function runTask(done, options, files) {
  let error;
  grunt.initConfig({
    [LIB_NAME]: {
      test: {
        options,
        files: files || [{
          src: `${FIXTURES_DIR_PATH}/*.html`,
          dest: OUTPUT_PATH
        }]
      }
    }
  });
  grunt.task.options({done: () => { done(error); }});
  grunt.task.options({error: err => { error = err; }});
  grunt.task.run('default');
  grunt.task.start({asyncDone: true});
}

grunt.registerTask('default', [`${LIB_NAME}:test`]);
sinon.stub(grunt.file, 'write');
sinon.stub(grunt, 'warn');

describe('implements a basic flow as file based plugin', () => {
  const OPTS_REPLACETAG = {tag: 'TAG1'};

  it('should accept contents from all source files', done => {
    pickTagRturnsNull = false;
    resetAll();
    runTask(
      () => {
        expect(preProc.pickTag.notCalled).to.be.true;
        expect(preProc.replaceTag
          .calledOnceWithExactly(OPTS_REPLACETAG.tag, void 0, ALL_CONTENTS, null, void 0))
          .to.be.true;
        expect(preProc.removeTag.notCalled).to.be.true;
        expect(grunt.file.write
          .calledOnceWithExactly(OUTPUT_PATH, `${ALL_CONTENTS}<replaceTag>`)).to.be.true;

        done();
      },
      {replaceTag: OPTS_REPLACETAG}
    );
  });

  it('should skip process if no file is input', done => {
    pickTagRturnsNull = false;
    resetAll();
    runTask(
      () => {
        expect(preProc.pickTag.notCalled).to.be.true;
        expect(preProc.replaceTag.notCalled).to.be.true;
        expect(preProc.removeTag.notCalled).to.be.true;
        expect(grunt.file.write.notCalled).to.be.true;

        done();
      },
      {replaceTag: OPTS_REPLACETAG},
      [{
        src: `${FIXTURES_DIR_PATH}/*.txt`,
        dest: OUTPUT_PATH
      }]
    );
  });

});

describe('when option for each method is passed', () => {
  const OPTS_PICKTAG = {tag: 'TAG1'},
    OPTS_REPLACETAG = {tag: 'TAG2'};

  it('should call only pickTag', done => {
    pickTagRturnsNull = false;
    resetAll();
    runTask(
      () => {
        expect(preProc.pickTag.calledOnceWithExactly(OPTS_PICKTAG.tag, ALL_CONTENTS)).to.be.true;
        expect(preProc.replaceTag.notCalled).to.be.true;
        expect(preProc.removeTag.notCalled).to.be.true;
        expect(grunt.file.write
          .calledOnceWithExactly(OUTPUT_PATH, `${ALL_CONTENTS}<pickTag>`)).to.be.true;

        done();
      },
      {pickTag: OPTS_PICKTAG}
    );
  });

  it('should call pickTag and replaceTag', done => {
    pickTagRturnsNull = false;
    resetAll();
    runTask(
      () => {
        expect(preProc.pickTag.calledOnceWithExactly(OPTS_PICKTAG.tag, ALL_CONTENTS)).to.be.true;
        expect(preProc.replaceTag
          .calledOnceWithExactly(OPTS_REPLACETAG.tag, void 0, `${ALL_CONTENTS}<pickTag>`,
            null, void 0)).to.be.true;
        expect(preProc.removeTag.notCalled).to.be.true;
        expect(grunt.file.write
          .calledOnceWithExactly(OUTPUT_PATH, `${ALL_CONTENTS}<pickTag><replaceTag>`)).to.be.true;

        done();
      },
      {pickTag: OPTS_PICKTAG, replaceTag: OPTS_REPLACETAG}
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
        pickTagRturnsNull = false;
        resetAll();
        runTask(
          () => {
            expect(preProc.pickTag
              .calledOnceWithExactly(test.expectedTag, ALL_CONTENTS)).to.be.true;
            expect(preProc.replaceTag.notCalled).to.be.true;
            expect(preProc.removeTag.notCalled).to.be.true;

            done();
          },
          test.options
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
        pickTagRturnsNull = false;
        resetAll();
        test.options.replaceTag.replacement = 'replacement';
        runTask(
          () => {
            expect(preProc.pickTag.notCalled).to.be.true;
            expect(preProc.replaceTag
              .calledOnceWithExactly(test.expectedTag, 'replacement', ALL_CONTENTS, null, void 0))
              .to.be.true;
            expect(preProc.removeTag.notCalled).to.be.true;

            done();
          },
          test.options
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
        pickTagRturnsNull = false;
        resetAll();
        test.options.replaceTag.tag = 'TAG';
        test.options.replaceTag.replacement = 'replacement';
        runTask(
          () => {
            expect(preProc.pickTag.notCalled).to.be.true;
            expect(preProc.replaceTag
              .calledOnceWithExactly('TAG', 'replacement', ALL_CONTENTS,
                test.expected.srcPath, test.expected.pathTest)).to.be.true;
            expect(preProc.removeTag.notCalled).to.be.true;

            done();
          },
          test.options
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
        pickTagRturnsNull = false;
        resetAll();
        runTask(
          () => {
            expect(preProc.pickTag.notCalled).to.be.true;
            expect(preProc.replaceTag.notCalled).to.be.true;
            expect(preProc.removeTag
              .calledOnceWithExactly(test.expectedTag, ALL_CONTENTS, null, void 0)).to.be.true;

            done();
          },
          test.options
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
        pickTagRturnsNull = false;
        resetAll();
        test.options.removeTag.tag = 'TAG';
        runTask(
          () => {
            expect(preProc.pickTag.notCalled).to.be.true;
            expect(preProc.replaceTag.notCalled).to.be.true;
            expect(preProc.removeTag
              .calledOnceWithExactly('TAG', ALL_CONTENTS,
                test.expected.srcPath, test.expected.pathTest)).to.be.true;

            done();
          },
          test.options
        );
      });
    });
  });

});

describe('passed/returned value', () => {
  const OPTS_ALL = {pickTag: {}, replaceTag: {}, removeTag: {}, tag: 'TAG1'},
    RES_ALL = `${ALL_CONTENTS}<pickTag><replaceTag><removeTag>`;

  it('should return processed value by all required methods', done => {
    pickTagRturnsNull = false;
    resetAll();
    runTask(
      () => {
        expect(preProc.pickTag.calledOnceWithExactly(OPTS_ALL.tag, ALL_CONTENTS)).to.be.true;
        expect(preProc.replaceTag
          .calledOnceWithExactly(OPTS_ALL.tag, void 0, `${ALL_CONTENTS}<pickTag>`, null, void 0))
          .to.be.true;
        expect(preProc.removeTag
          .calledOnceWithExactly(OPTS_ALL.tag, `${ALL_CONTENTS}<pickTag><replaceTag>`,
            null, void 0)).to.be.true;
        expect(grunt.file.write.calledOnceWithExactly(OUTPUT_PATH, RES_ALL)).to.be.true;

        done();
      },
      OPTS_ALL
    );
  });

  it('should not save file if no file is input', done => {
    pickTagRturnsNull = false;
    resetAll();
    runTask(
      () => {
        expect(preProc.pickTag.notCalled).to.be.true;
        expect(preProc.replaceTag.notCalled).to.be.true;
        expect(preProc.removeTag.notCalled).to.be.true;
        expect(grunt.file.write.notCalled).to.be.true;

        done();
      },
      OPTS_ALL,
      [{
        src: `${FIXTURES_DIR_PATH}/*.txt`,
        dest: OUTPUT_PATH
      }]
    );
  });

  it('should throw an error if pickTag returned a null', done => {
    const OPTS_PICKTAG = {pickTag: {}, tag: 'TAG1'},
      ERR_MSG = `Not found tag: ${OPTS_PICKTAG.tag}`;

    pickTagRturnsNull = false;
    resetAll();
    runTask(
      () => {
        expect(preProc.pickTag.calledOnceWithExactly(OPTS_PICKTAG.tag, ALL_CONTENTS)).to.be.true;
        expect(grunt.file.write
          .calledOnceWithExactly(OUTPUT_PATH, `${ALL_CONTENTS}<pickTag>`)).to.be.true;

        // Returns null
        pickTagRturnsNull = true;
        resetAll();
        runTask(
          () => {
            expect(preProc.pickTag.calledOnceWithExactly(OPTS_PICKTAG.tag, ALL_CONTENTS)).to.be.true;
            expect(grunt.file.write.notCalled).to.be.true;
            expect(grunt.warn.calledOnce).to.be.true;
            // expect(grunt.warn.args[0] instanceof Error).to.be.true;
            // expect(grunt.warn.args[0]).to.be.an('error', ERR_MSG);
            // These above don't work well...
            // https://github.com/chaijs/chai/issues/930
            expect(grunt.warn.args[0].toString()).to.equal(`Error: ${ERR_MSG}`);

            done();
          },
          OPTS_PICKTAG
        );
      },
      OPTS_PICKTAG
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
      () => {
        expect(grunt.file.write.notCalled).to.be.true;
        expect(grunt.warn.calledOnce).to.be.true;
        expect(grunt.warn.args[0].toString()).to.equal(`Error: ${ERR_MSG}`);

        resetAll();
        runTask(
          () => {
            expect(grunt.file.write.notCalled).to.be.true;
            expect(grunt.warn.calledOnce).to.be.true;
            expect(grunt.warn.args[0].toString()).to.equal(`Error: ${ERR_MSG}`);

            resetAll();
            runTask(
              () => {
                expect(grunt.file.write.notCalled).to.be.true;
                expect(grunt.warn.notCalled).to.be.true;

                done();
              },
              OPTS3
            );
          },
          OPTS2
        );
      },
      OPTS1
    );
  });

  it('should not save file if pickTag returned a null with allowErrors', done => {
    const OPTS_PICKTAG = {pickTag: {allowErrors: true}, tag: 'TAG1'};

    pickTagRturnsNull = false;
    resetAll();
    runTask(
      () => {
        expect(preProc.pickTag.calledOnceWithExactly(OPTS_PICKTAG.tag, ALL_CONTENTS)).to.be.true;
        expect(grunt.file.write
          .calledOnceWithExactly(OUTPUT_PATH, `${ALL_CONTENTS}<pickTag>`)).to.be.true;

        // Returns null
        pickTagRturnsNull = true;
        resetAll();
        runTask(
          () => {
            expect(preProc.pickTag
              .calledOnceWithExactly(OPTS_PICKTAG.tag, ALL_CONTENTS)).to.be.true;
            expect(grunt.file.write.notCalled).to.be.true;
            expect(grunt.warn.notCalled).to.be.true;

            done();
          },
          OPTS_PICKTAG
        );
      },
      OPTS_PICKTAG
    );
  });

  it('should not call other methods when pickTag returned a null', done => {
    const OPTS_ALL = {pickTag: {allowErrors: true}, replaceTag: {}, removeTag: {}, tag: 'TAG1'};

    pickTagRturnsNull = false;
    resetAll();
    runTask(
      () => {
        expect(preProc.pickTag.calledOnceWithExactly(OPTS_ALL.tag, ALL_CONTENTS)).to.be.true;
        expect(preProc.replaceTag
          .calledOnceWithExactly(OPTS_ALL.tag, void 0, `${ALL_CONTENTS}<pickTag>`,
            null, void 0)).to.be.true;
        expect(preProc.removeTag
          .calledOnceWithExactly(OPTS_ALL.tag, `${ALL_CONTENTS}<pickTag><replaceTag>`,
            null, void 0)).to.be.true;
        expect(grunt.file.write.calledOnceWithExactly(OUTPUT_PATH, RES_ALL)).to.be.true;

        // Returns null
        pickTagRturnsNull = true;
        resetAll();
        runTask(
          () => {
            expect(preProc.pickTag.calledOnceWithExactly(OPTS_ALL.tag, ALL_CONTENTS)).to.be.true;
            expect(preProc.replaceTag.notCalled).to.be.true;
            expect(preProc.removeTag.notCalled).to.be.true;
            expect(grunt.file.write.notCalled).to.be.true;

            done();
          },
          OPTS_ALL
        );
      },
      OPTS_ALL
    );
  });

});
