import Z from 'sanctuary-type-classes';
import Maybe from 'sanctuary-maybe';
import jsc from 'jsverify';
import test from 'oletus';

import {
  deepStrictEqual as eq,
  throws,
} from 'assert';

import {
  primitive,
  identity,
  stateEquals,
  property as _prop,
  assertEquals,
} from './utils.js';

import {
  StateT,
  run,
  compose,
} from '../index.js';

const S = StateT (Maybe);
const property = _prop (test);

function mul3(x) { return x * 3; }

function hoistFun(fn) {
  return function(mx) {
    return Z.of (Maybe, fn (mx.value));
  };
}

test ('metadata', () => {
  eq (typeof S, 'function');
  eq (S.length, 1);
});

test ('.put returns a StateT (m)', () => {
  eq (S.put (42) instanceof S, true);
  eq (S.put.length, 1);
});
test ('.put sets the internal state to the given value', () => {
  assertEquals (S.execState (0) (S.put (42)), Z.of (Maybe, 42));
  assertEquals (
    S.execState () (Z.chain (() => S.put (42), S.put (21))),
    Z.of (Maybe, 42)
  );
});

test ('.modify returns a StateT (m)', () => {
  eq (S.modify (Function.prototype) instanceof S, true);
  eq (S.modify.length, 1);
});
test ('.modify changes the internal value to null', () => {
  assertEquals (S.evalState () (S.modify (Function.prototype)), Z.of (Maybe, null));
  assertEquals (
    S.evalState () (Z.chain (
      () => S.modify (Function.prototype),
      Z.of (S, 42)
    )),
    Z.of (Maybe, null)
  );
});

property ('S.put (a).chain (_ => S.modify (identity)) === S.put (a)', primitive, x => stateEquals (primitive) (
      Z.chain (() => S.modify (identity), S.put (x)),
      S.put (x)
    ));

property ('S.put (a).chain (_ => S.modify (compose (f) (g))) === S.put (a).chain (_ => S.modify (f)).chain (_ => S.modify (g))'
, jsc.constant (Math.sqrt), jsc.fun (jsc.nat), jsc.nat, (f, g, x) => stateEquals (jsc.nat) (
    Z.chain (() => S.modify (compose (f) (g)), S.put (x)),
    Z.chain (
      () => S.modify (f),
      Z.chain (() => S.modify (g), S.put (x))
    )
  ));

test ('.get is a StateT (m)', () => {
  eq (S.get instanceof S, true);
});
test ('.get sets the internal value to its state', () => {
  eq (S.evalState (42) (S.get), Z.of (Maybe, 42));
  eq (
    S.evalState () (
      Z.chain (() => S.get, S.put (42))
    ),
    Z.of (Maybe, 42)
  );
});

test ('.run returns the internal state an value wrapped in a Monad', () => {
  eq (run (42) (S.get), Z.of (Maybe, {state: 42, value: 42}));
});

test ('.lift returns a StateT (m)', () => {
  eq (S.lift (Z.of (Maybe, 1)) instanceof S, true);
});

property ('S.lift (M.of (n)) === S.of (n)', primitive, x => stateEquals (primitive) (
    S.lift (Z.of (Maybe, x)),
    Z.of (S, x)
  ));

test ('.hoist returns a StateT (m)', () => {
  eq (
    S.hoist (Z.of (S, 1)) (Z.of (Maybe, Function.prototype)) instanceof S,
    true
  );
});

property ('S.hoist (Z.of (S, a)) (identity)) === Z.of (S, a)', primitive, x => stateEquals (primitive) (
      S.hoist (Z.of (S, x)) (identity),
      Z.of (S, x)
    ));

property (
  'S.hoist (Z.of (S, a)) (compose (f) (g))) === S.hoist (S.hoist (Z.of (S, a)) (g)) (f)',
  jsc.constant (hoistFun (Math.sqrt)),
  jsc.constant (hoistFun (mul3)),
  jsc.nat,
  (f, g, x) => stateEquals (jsc.nat) (
      S.hoist (Z.of (S, x)) (compose (f) (g)),
      S.hoist (S.hoist (Z.of (S, x)) (g)) (f)
    )
);

test ('.fantasy-land/chainRec throws if the given monad is not ChainRec', () => throws (
  () => Z.chainRec ([], Function.prototype, 0),
  /TypeError: staticMethod\(\.\.\.\) is not a function/
));

test ('.fantasy-land/chainRec is stack-safe', () => {
  const s = Z.chainRec (S, (next, done, v) => Z.of (S, v < 10000 ? next (v + 1) : done (v)), 1);
  assertEquals (
    S.evalState () (s),
    Z.of (Maybe, 10000)
  );
});

test ('.fantasy-land/ap propagates state changes through the evaluation', () => {
  const statef = Z.chain (() => Z.of (S, x => x), S.modify (x => x.repeat (2)));
  const statex = Z.chain (() => Z.of (S, null), S.modify (x => x + '!'));
  const applied = Z.ap (statef, statex);
  eq (S.execState ('a') (applied), Z.of (Maybe, 'aa!'));
});
