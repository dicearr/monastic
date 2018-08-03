import assert from 'assert';

import {compose, constant} from '..';

suite ('Helpers', function() {
  test ('compose should compose two functions', function() {
    function mul3(x) { return x * 3; }
    function add3(x) { return x + 3; }
    assert.deepStrictEqual (compose (mul3, add3) (3), 18);
    assert.deepStrictEqual (compose (add3, mul3) (3), 12);
  });
  test ('constant should wrap a value into a function', function() {
    assert.deepStrictEqual (constant (3) (), 3);
  });
});
