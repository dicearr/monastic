import assert from 'assert';

import State from '..';

suite ('State', function() {
  test ('#modify', function() {
    var state = Math.random ();
    var res = State.modify (_ => state).run ();
    assert.deepStrictEqual (res.state, state);
    assert.equal (res.value, undefined);
  });
  test ('#put', function() {
    var state = Math.random ();
    var res = State.put (state).exec ();
    assert.deepStrictEqual (res, state);
  });
  test ('#get', function() {
    var state = Math.random ();
    var res = State.put (state)['fantasy-land/chain'] (
      _ => State.get
    ).run ();
    assert.deepStrictEqual (res, {
      state: state,
      value: state
    });
  });
});
