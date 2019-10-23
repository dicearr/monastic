import Z from 'sanctuary-type-classes';
import Maybe from 'sanctuary-maybe';
import jsc from 'jsverify';
import FL from 'fantasy-laws';
import test from 'oletus';

import {
  primitive,
  stateEquals
} from './utils.js';

import {
  State,
  StateT,
  evalState,
  compose as B
} from '../index.js';

var StateMaybe = StateT (Maybe);
var eq = stateEquals (jsc.nat);

function _of(type) {
  return function(value) {
    return Z.of (type, value);
  };
}

function getValue(type) {
  if (type.evalState) { return type.evalState (); }
  return evalState ();
}

function Arb(type) {
  return function(varb) {
    function toStr(m) { return JSON.stringify (getValue (m)); }
    return varb.smap (_of (type), getValue, toStr);
  };
}

var {
  anyState,
  anyStateMaybe
} = jsc.letrec (function(tie) {
  return {
    anyState: Arb (State) (
      tie ('any'), tie ('anyState')
    ),
    anyStateMaybe: Arb (StateMaybe) (
      tie ('any'), tie ('anyStateMaybe')
    ),
    any: primitive
  };
});

function low3(x) { return x < 3; }
function mul3(x) { return x * 3; }
function sub3(x) { return x - 3; }

test ('Functor identity', FL.Functor (eq).identity (anyState));
test ('Functor composition', FL.Functor (eq).composition (
  Arb (State) (jsc.nat),
  jsc.constant (sub3),
  jsc.constant (mul3)
));

test ('Apply composition', FL.Apply (eq).composition (
  Arb (State) (jsc.constant (sub3)),
  Arb (State) (jsc.constant (mul3)),
  Arb (State) (jsc.nat)
));

test ('Applicative identity', FL.Applicative (eq, State).identity (Arb (State) (anyState)));
test ('Applicative homomorphism', FL.Applicative (eq, State).homomorphism (
  jsc.constant (sub3),
  jsc.nat
));
test ('Applicative interchange', FL.Applicative (eq, State).interchange (
  Arb (State) (jsc.constant (sub3)),
  jsc.nat
));

test ('Chain associativity', FL.Chain (eq).associativity (
  Arb (State) (jsc.nat),
  jsc.constant (B (_of (State)) (sub3)),
  jsc.constant (B (_of (State)) (mul3))
));

test ('Monad leftIdentity', FL.Monad (eq, State).leftIdentity (
  jsc.constant (B (_of (State)) (mul3)),
  jsc.nat
));
test ('Monad rightIdentity', FL.Monad (eq, State).rightIdentity (
  Arb (State) (anyState)
));

test ('ChainRec equivalence', FL.ChainRec (eq, State).equivalence (
  jsc.constant (low3),
  jsc.constant (B (_of (State)) (Math.sqrt)),
  jsc.constant (_of (State)),
  jsc.nat.smap (
    function(x) { return Math.min (x, 100); },
    function(x) { return x; }
  )
));

test ('StateT Functor identity', FL.Functor (eq).identity (anyStateMaybe));
test ('StateT Functor composition', FL.Functor (eq).composition (
  Arb (StateMaybe) (jsc.nat),
  jsc.constant (sub3),
  jsc.constant (sub3)
));

test ('StateT Apply composition', FL.Apply (eq).composition (
  Arb (StateMaybe) (jsc.constant (mul3)),
  Arb (StateMaybe) (jsc.constant (sub3)),
  Arb (StateMaybe) (jsc.nat)
));

test ('StateT Applicative identity', FL.Applicative (eq, StateMaybe).identity (Arb (StateMaybe) (anyStateMaybe)));
test ('StateT Applicative homomorphism', FL.Applicative (eq, StateMaybe).homomorphism (
  jsc.constant (mul3),
  jsc.nat
));
test ('interchange', FL.Applicative (eq, StateMaybe).interchange (
  Arb (StateMaybe) (jsc.constant (sub3)),
  jsc.nat
));

test ('StateT Chain associativity', FL.Chain (eq).associativity (
  Arb (StateMaybe) (anyStateMaybe),
  jsc.constant (B (_of (StateMaybe)) (sub3)),
  jsc.constant (B (_of (StateMaybe)) (mul3))
));

test ('StateT Monad leftIdentity', FL.Monad (eq, StateMaybe).leftIdentity (
  jsc.constant (B (_of (StateMaybe)) (sub3)),
  jsc.nat
));
test ('StateT Monad rightIdentity', FL.Monad (eq, StateMaybe).rightIdentity (
  Arb (StateMaybe) (anyStateMaybe)
));

test ('StateT ChainRec equivalence', FL.ChainRec (eq, StateMaybe).equivalence (
  jsc.constant (low3),
  jsc.constant (B (_of (StateMaybe)) (Math.sqrt)),
  jsc.constant (_of (StateMaybe)),
  jsc.nat.smap (
    function(x) { return Math.min (x, 100); },
    function(x) { return x; }
  )
));
