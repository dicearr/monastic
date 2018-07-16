import assert from 'assert';

import {
  put,
  get,
  modify,
  execState
} from '..';

suite ('State', function() {
  test ('#modify', function() {
    var state = Math.random ();
    var res = modify (_ => state).run ();
    assert.deepStrictEqual (res.state, state);
    assert.equal (res.value, undefined);
  });
  test ('#put', function() {
    var state = Math.random ();
    var res = execState () (put (state));
    assert.deepStrictEqual (res, state);
  });
  test ('#get', function() {
    var state = Math.random ();
    var res = put (state)['fantasy-land/chain'] (
      function() { return get; }
    ).run ();
    assert.deepStrictEqual (res, {
      state: state,
      value: state
    });
  });
});
