'use strict';

const quiz = require('..');
const assert = require('assert').strict;

assert.strictEqual(quiz(), 'Hello from quiz');
console.info('quiz tests passed');
