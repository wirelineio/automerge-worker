# Benchmarks

## Messages
One peer receiving multiple changes over a single DOC.

Configuration:
```javascript
// Changes number to be made.
const CHANGES_MAX = 50;

// Total peers conected (Including doc owner).
const PEERS_MAX = 200;

// Min and max (ms) to delay before trigger a change.
const DELAY_MIN = 0;
const DELAY_MAX = 500;

// Min and max random number of words to be inserted on a single change.
const WORDS_MIN = 5;
const WORDS_MAX = 100;
```