# MonadPrimus
MonadPrimus is a library of functional programming.  
MonadPrimus includes lazy evaluation list, tuple, function wrapper which can curry and compose,
Maybe and Either monad and so on.

## Examples

### Lazy Evaluation List
```js
// outputs [1, 4, 9, 16, 25]
console.log(M.L(1, 2, 3).concat(M.L(4, 5)).map(x => x * x).take());
// outputs [1, 3, 2, 6]
console.log(M.L(1, 2).bind(x => M.L(x * 2, x * 3).take());
// outputs [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]
console.log(M.L.N(2).filter(
  x => x < 4 || M.L.range(2, Math.floor(Math.sqrt(x))).every(y => x % y !== 0)).take(10));
```

### Tuple
```js
// outputs 1
console.log(M.T(1, 2, 3)(0));
// outputs [1, 2, 3]
console.log(M.T(1, 2, 3).toArray());
// outputs "(1,2,3)"
console.log(M.T(1, 2, 3).toString());
```

### Function Wrapper
```js
// curring: outputs 9
console.log(M.F((x, y, z) => x + y + z)(3)(2)(4));
// composition: outputs 10
console.log(M.F((x, y) => x * y).compose(x => x / 3).compose(x => x * 2)(3)(5));
```

### Maybe monad
```js
// outputs "Just 6"
console.log(M.Just(3).bind(x => M.Just(x + 3)).toString());
// outputs "Nothing"
console.log(M.Nothing.bind(x => M.Just(x + 3)).toString());
// outputs "Nothing"
console.log(M.Just(3).bind(x => M.Nothing).toString());
```