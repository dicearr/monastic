import {
  Functor,
  Apply,
  Applicative,
  Chain,
  ChainRec,
  Monad
} from 'fantasy-laws';

import {
  letrec,
  constant as _k,
  nat
} from 'jsverify';

import Z from 'sanctuary-type-classes';
import Maybe from 'sanctuary-maybe';

import {
  primitive,
  stateEquals
} from './utils';

import {
  State,
  StateT,
  evalState,
  compose as B
} from '..';

var StateMaybe = StateT (Maybe);
var eq = stateEquals (nat);

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
} = letrec (function(tie) {
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

suite ('Compliance to Fantasy Land', function() {
  suite ('State', function() {
    suite ('Functor', function() {
      test ('identity', Functor (eq).identity (anyState));
      test ('composition', Functor (eq).composition (
        Arb (State) (nat),
        _k (sub3),
        _k (mul3)
      ));
    });

    suite ('Apply', function() {
      test ('composition', Apply (eq).composition (
        Arb (State) (_k (sub3)),
        Arb (State) (_k (mul3)),
        Arb (State) (nat)
      ));
    });

    suite ('Applicative', function() {
      test ('identity', Applicative (eq, State).identity (Arb (State) (anyState)));
      test ('homomorphism', Applicative (eq, State).homomorphism (
        _k (sub3),
        nat
      ));
      test ('interchange', Applicative (eq, State).interchange (
        Arb (State) (_k (sub3)),
        nat
      ));
    });

    suite ('Chain', function() {
      test ('associativity', Chain (eq).associativity (
        Arb (State) (nat),
        _k (B (_of (State)) (sub3)),
        _k (B (_of (State)) (mul3))
      ));
    });

    suite ('Monad', function() {
      test ('leftIdentity', Monad (eq, State).leftIdentity (
        _k (B (_of (State)) (mul3)),
        nat
      ));
      test ('rightIdentity', Monad (eq, State).rightIdentity (
        Arb (State) (anyState)
      ));
    });

    suite ('ChainRec', function() {
      test ('equivalence', ChainRec (eq, State).equivalence (
        _k (low3),
        _k (B (_of (State)) (Math.sqrt)),
        _k (_of (State)),
        nat.smap (
          function(x) { return Math.min (x, 100); },
          function(x) { return x; }
        )
      ));
    });
  });

  suite ('StateT', function() {
    suite ('Functor', function() {
      test ('identity', Functor (eq).identity (anyStateMaybe));
      test ('composition', Functor (eq).composition (
        Arb (StateMaybe) (nat),
        _k (sub3),
        _k (sub3)
      ));
    });

    suite ('Apply', function() {
      test ('composition', Apply (eq).composition (
        Arb (StateMaybe) (_k (mul3)),
        Arb (StateMaybe) (_k (sub3)),
        Arb (StateMaybe) (nat)
      ));
    });

    suite ('Applicative', function() {
      test ('identity', Applicative (eq, StateMaybe).identity (Arb (StateMaybe) (anyStateMaybe)));
      test ('homomorphism', Applicative (eq, StateMaybe).homomorphism (
        _k (mul3),
        nat
      ));
      test ('interchange', Applicative (eq, StateMaybe).interchange (
        Arb (StateMaybe) (_k (sub3)),
        nat
      ));
    });

    suite ('Chain', function() {
      test ('associativity', Chain (eq).associativity (
        Arb (StateMaybe) (anyStateMaybe),
        _k (B (_of (StateMaybe)) (sub3)),
        _k (B (_of (StateMaybe)) (mul3))
      ));
    });

    suite ('Monad', function() {
      test ('leftIdentity', Monad (eq, StateMaybe).leftIdentity (
        _k (B (_of (StateMaybe)) (sub3)),
        nat
      ));
      test ('rightIdentity', Monad (eq, StateMaybe).rightIdentity (
        Arb (StateMaybe) (anyStateMaybe)
      ));
    });

    suite ('ChainRec', function() {
      test ('equivalence', ChainRec (eq, StateMaybe).equivalence (
        _k (low3),
        _k (B (_of (StateMaybe)) (Math.sqrt)),
        _k (_of (StateMaybe)),
        nat.smap (
          function(x) { return Math.min (x, 100); },
          function(x) { return x; }
        )
      ));
    });

  });
});
