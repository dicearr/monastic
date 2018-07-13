import {
  Functor,
  Apply,
  Applicative,
  Chain
} from 'fantasy-laws';

import {
  letrec,
  oneof,
  number,
  string,
  bool,
  falsy,
  constant as _k
} from 'jsverify';

import Z from 'sanctuary-type-classes';

import State from '..';

function StateArb(varb) {
  function getValue(m) { return m.eval (); }
  function toStr(m) { return JSON.stringify (getValue (m)); }

  return varb.smap (State.of, getValue, toStr);
}

function B(f) {
  return function(g) {
    return function(x) {
      return f (g (x));
    };
  };
}

var {anyState} = letrec (function(tie) {
  return {
    anyState: StateArb (tie ('any')),
    any: oneof (
      number,
      string,
      bool,
      falsy,
      tie ('anyState')
    )
  };
});

function eq(actual, expected) {
  var state = Math.random ();
  return Z.equals (actual.run (state), expected.run (state));
}

function of(x) {
  return Z.of (State, x);
}

function sub3(x) { return x - 3; }
function mul3(x) { return x * 3; }

suite ('Compliance to Fantasy Land', function() {
  suite ('Functor', function() {
    test ('identity', Functor (eq).identity (anyState));
    test ('composition', Functor (eq).composition (
      StateArb (number),
      _k (sub3),
      _k (mul3)
    ));
  });

  suite ('Apply', function() {
    test ('composition', Apply (eq).composition (
      StateArb (_k (sub3)),
      StateArb (_k (mul3)),
      StateArb (number)
    ));
  });

  suite ('Applicative', function() {
    test ('identity', Applicative (eq, State).identity (StateArb (number)));
    test ('homomorphism', Applicative (eq, State).homomorphism (
      _k (sub3),
      number
    ));
    test ('interchange', Applicative (eq, State).interchange (
      StateArb (_k (sub3)),
      number
    ));
  });

  suite ('Chain', function() {
    test ('associativity', Chain (eq).associativity (
      StateArb (number),
      _k (B (of) (sub3)),
      _k (B (of) (mul3))
    ));
  });
});
