import Z from 'sanctuary-type-classes';
import {deepStrictEqual as eq} from 'assert';
import jsc from 'jsverify';
import test from 'oletus';

import {
  property as _property,
  stateEquals,
  identity,
  primitive,
} from './utils.js';

import {
  put,
  get,
  modify,
  execState,
  evalState,
  State,
  run,
  compose,
  constant,
} from '../index.js';

const property = _property (test);

test ('metadata', () => {
  eq (typeof State, 'function');
  eq (State.length, 1);
});
test ('constructor', () => {
  eq (State (42), new State (42));
});

test ('.put returns a state', () => {
  eq (put (42) instanceof State, true);
  eq (put.length, 1);
});
test ('.put sets the internal state to the given value', () => {
  eq (execState (0) (put (42)), 42);
  eq (
    execState () (Z.chain (() => put (42), put (21))),
    42
  );
});

test ('.modify returns a state', () => {
  eq (modify (Function.prototype) instanceof State, true);
  eq (modify.length, 1);
});
test ('.modify sets the internal value to null', () => {
  eq (evalState () (modify (Function.prototype)), null);
  eq (
    evalState () (Z.chain (
      () => modify (Function.prototype),
      Z.of (State, 42)
    )),
    null
  );
});

property ('put (a).chain (_ => modify (identity)) === put (a)', primitive, x => stateEquals (primitive) (
      Z.chain (() => modify (identity), put (x)),
      put (x)
    ));

property (
'put (a).chain (_ => modify (compose (f) (g))) === put (a).chain (_ => modify (f)).chain (_ => modify (g))'
, jsc.constant (Math.sqrt), jsc.fun (jsc.nat), jsc.nat, (f, g, x) => stateEquals (jsc.nat) (
    Z.chain (() => modify (compose (f) (g)), put (x)),
    Z.chain (
      () => modify (f),
      Z.chain (() => modify (g), put (x))
    )
  ));

test ('.get is a state', () => {
  eq (get instanceof State, true);
});
test ('.get sets the internal value to its state', () => {
  eq (evalState (42) (get), 42);
  eq (
    evalState () (
      Z.chain (() => get, put (42))
    ),
    42
  );
});

test ('.run returns internal state an value', () => {
  eq (run (42) (get), {state: 42, value: 42});
});

test ('.fantasy-land/ap propagates the state to both State instances', () => {
  eq (evalState (42) (Z.ap (Z.of (State, x => x), get)), 42);
  eq (evalState (42) (Z.ap (Z.map (constant, get), put (null))), 42);
});

test ('.fantasy-land/ap propagates state changes through the evaluation', () => {
  const statef = Z.chain (() => Z.of (State, x => x), modify (x => x.repeat (2)));
  const statex = Z.chain (() => Z.of (State, null), modify (x => x + '!'));
  const applied = Z.ap (statef, statex);
  eq (execState ('a') (applied), 'aa!');
});

test ('.fantasy-land/chainRec should be stack-safe', () => {
  eq (evalState () (
    Z.chainRec (State, (next, done, v) => Z.of (State, v < 10000 ? next (v + 1) : done (v)), 1)
  ), 10000);
});
