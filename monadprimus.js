/*
 * MonadPrimus
 *
 * Copyright (c) 2018 Yuichiro MORIGUCHI
 *
 * This software is released under the MIT License.
 * http://opensource.org/licenses/mit-license.php
 */
(function(root) {
	var M = {},
		TUPLE_ID = {},
		FUNCTION_ID = {},
		PLACEHOLDER_ID = {},
		UNMEMOED = {},
		placeholderFlyweight = {},
		undef = void 0,
		maxIndex = 9007199254740991,
		nil,
		Nothing;
	function arrayIndexOf(array, element) {
		var i;
		for(i = 0; i < array.length; i++) {
			if(array[i] === element) {
				return i;
			}
		}
		return -1;
	}
	function addMethod(obj, extend) {
		var i;
		for(i in extend) {
			if(extend.hasOwnProperty(i)) {
				obj[i] = extend[i];
			}
		}
	}
	function permutationIndexWithDuplicate(size, num, filter) {
		function perm0(lst) {
			return {
				value: function() {
					return [].concat(lst);
				},
				next: function() {
					var nl = [].concat(lst),
						i;
					for(i = nl.length - 1; i >= 0;) {
						if(nl[i] < size) {
							nl[i]++;
							if(filter(nl)) {
								return perm0(nl);
							} else {
								i = nl.length - 1;
							}
						} else {
							nl[i--] = 0;
						}
					}
					return null;
				}
			};
		}
		var arr = new Array(num),
			ret,
			i;
		for(i = 0; i < arr.length; i++) {
			arr[i] = 0;
		}
		ret = perm0(arr);
		return filter(arr) ? ret : ret.next();
	}
	function uniqueSeq(comparator) {
		return function(arr) {
			var i, j;
			for(i = 0; i < arr.length; i++) {
				for(j = i + 1; j < arr.length; j++) {
					if(comparator(arr[i], arr[j])) {
						return false;
					}
				}
			}
			return true;
		};
	}
	function permutationIndex(size, num) {
		return permutationIndexWithDuplicate(size, num, uniqueSeq(function(a, b) {
			return a === b;
		}));
	}
	function combinationIndex(size, num) {
		return permutationIndexWithDuplicate(size, num, uniqueSeq(function(a, b) {
			return a >= b;
		}));
	}
	function directProductIndex(size, sum) {
		function make(list, stack, flag) {
			return {
				value: function() {
					return [].concat(list);
				},
				next: function() {
					var nl = [].concat(list),
						ns = [].concat(stack),
						i;
					nl[nl.length - 1] = ns[nl.length - 1] = 0;
					for(i = nl.length - 2; i >= 0; i--) {
						if(nl[i] > 0) {
							nl[i]--;
							nl[i + 1] = ns[i + 1] = ns[i] - nl[i];
							return make(nl, ns, flag);
						} else {
							nl[i] = ns[i] = 0;
						}
					}
					return flag ? directProductIndex(size, sum + 1, false) : null;
				},
				setOk: function() {
					return make(list, stack, true);
				}
			};
		}
		var list = new Array(size),
			stack = new Array(size),
			i;
		for(i = 1; i < size; i++) {
			list[i] = stack[i] = 0;
		}
		list[0] = stack[0] = sum;
		return make(list, stack, false);
	}
	function Memo(thunk) {
		var memoed = UNMEMOED;
		return function() {
			if(memoed === UNMEMOED) {
				memoed = thunk();
			}
			return memoed;
		};
	}
	function List(value, succ) {
		function at0(index, lst) {
			var i,
				nxt = lst;
			for(i = index; i > 0; i--, lst = lst.rest()) {
				if(lst.isNull()) {
					return undef;
				}
			}
			return lst.value();
		}
		return {
			/**
			 * @class M.L
			 * gets an element at the specified index.
			 * ```
			 * M.L.N(1).at(10);  // outputs 10
			 * ```
			 */
			at: function(index) {
				if(index < 0 || index > maxIndex) {
					throw new Error("index out of bounds");
				}
				return index > 0 ? at0(index - 1, succ()) : value;
			},
			/**
			 * @class M.L
			 * gets first element.
			 * ```
			 * M.L(3, 4, 6).value();  // outputs 3
			 * ```
			 */
			value: function() {
				return value;
			},
			/**
			 * @class M.L
			 * gets rest of this list.
			 * ```
			 * M.L(3, 4, 6).rest();  // outputs M.L(4, 6)
			 * ```
			 */
			rest: function() {
				return succ();
			},
			/**
			 * @class M.L
			 * Monad 'bind' function.  
			 * The first argument is a function whose input is element of list and output is M.L.
			 * ```
			 * M.L(2, 7).bind(x => M.L(x + 2, x + 3));  // outputs M.L(4, 5, 9, 10)
			 * ```
			 */
			bind: function(b) {
				var me = this,
					mapped = b(me.value());
				function getNext(succ) {
					var next = succ(),
						meNext;
					if(next !== nil) {
						return new List(next.value(), Memo(function() { return getNext(next.rest); }));;
					} else if((meNext = me.rest()) !== nil) {
						return meNext.bind(b);
					} else {
						return nil;
					}
				}
				return mapped === nil ? nil : new List(mapped.value(), Memo(function() { return getNext(mapped.rest); }));
			},
			/**
			 * @class M.L
			 * returns an array of first n elements.  
			 * If the argument is not given, returns an array of all elements.  
			 * Notice: This method may not stop if elements of the list is infinity.
			 * ```
			 * M.L.N(2).take(5));  // outputs [2, 3, 4, 5, 6]
			 * ```
			 */
			take: function(n) {
				var res = [],
					next = this,
					i;
				for(i = 0; (n === undef || i < n) && next !== nil; i++) {
					res.push(next.value());
					next = next.rest();
				}
				return res;
			},
			/**
			 * @class M.L
			 * returns new list which pass the test which is given the first argument.  
			 * This method is available when the list has infinity elements.
			 * ```
			 * M.L.N(1).filter(x => x % 2 === 0);  // outputs M.L(2, 4, 6, ...)
			 * ```
			 */
			filter: function(pred) {
				function filterNext(succ) {
					var next;
					for(next = succ; next !== nil; next = next.rest()) {
						if(pred(next.value())) {
							return new List(next.value(), Memo(function() { return filterNext(next.rest()); }));
						}
					}
					return nil;
				}
				return filterNext(this);
			},
			/**
			 * @class M.L
			 * concatenates the given list to this list.
			 * ```
			 * M.L(3, 4).concat(M.L(6));  // outputs M.L(3, 4, 6)
			 * ```
			 */
			concat: function(list) {
				var me = this;
				function concatList(succ) {
					var next = succ();
					if(next !== nil) {
						return new List(next.value(), Memo(function() { return concatList(next.rest); }));
					} else {
						return list;
					}
				}
				return list === nil ? me : new List(me.value(), Memo(function() { return concatList(me.rest); }));
			},
			/**
			 * @class M.L
			 * returns new list with the result of calling the function given by the argument
			 * on every element of this list.  
			 * This method is available when the list has infinite elements.
			 * ```
			 * M.L.N(1).map(x => x * 2);  // outputs M.L(2, 4, 6, ...)
			 * ```
			 */
			map: function(fn) {
				var me = this;
				return new List(fn(me.value()), Memo(function() { return me.rest().map(fn); }));
			},
			/**
			 * @class M.L
			 * returns true if it exists that the element of this list applies to the function
			 * given by the first argument is truthy.  
			 * Notice: This method may not stop if elements of the list is infinity.
			 * ```
			 * M.L(3, 4, 6).some(x => x % 2 === 0);  // outputs true
			 * ```
			 */
			some: function(pred) {
				var next;
				for(next = this; next !== nil; next = next.rest()) {
					if(pred(next.value())) {
						return true;
					}
				}
				return false;
			},
			/**
			 * @class M.L
			 * returns false if it exists that the element of this list applies to the function
			 * given by the first argument is falsy.  
			 * Notice: This method may not stop if elements of the list is infinity.
			 * ```
			 * M.L(3, 4, 6).every(x => x % 2 === 0);  // outputs false
			 * ```
			 */
			every: function(pred) {
				return !this.some(function(x) { return !pred(x); });
			},
			/**
			 * @class M.L
			 * returns true if this list is empty.
			 */
			isNull: function(index) {
				return index === undef || index === 0 ? false : this.rest().isNull(index - 1);
			},
			/**
			 * @class M.L
			 * This method is equivalent to 'bind'.
			 */
			multiply: function(b) {
				return this.bind(b);
			}
		};
	}
	nil = {
		at: function at(index) {
			if(index < 0 || index > maxIndex) {
				throw new Error("index out of bounds");
			}
			return undef;
		},
		value: function() {
			return undef;
		},
		rest: function() {
			return this;
		},
		bind: function(b) {
			return this;
		},
		take: function(_) {
			return [];
		},
		filter: function(_) {
			return this;
		},
		concat: function(list) {
			return list === nil ? this : list;
		},
		map: function(_) {
			return this;
		},
		some: function(_) {
			return false;
		},
		every: function(pred) {
			return true;
		},
		isNull: function(index) {
			return true;
		},
		multiply: function(b) {
			return this.bind(b);
		}
	};
	/**
	 * An empty list.
	 */
	M.Nil = nil;
	/**
	 * creates a list from the given arguments.
	 * ```
	 * M.L(3, 4, 6).at(1);   // outputs 4
	 * ```
	 */
	M.L = function() {
		var args = Array.prototype.slice.call(arguments),
			res = nil,
			i;
		for(i = args.length - 1; i >= 0; i--) {
			res = (function(res, i) {
				return List(args[i], Memo(function() { return res; }))
			})(res, i);
		}
		return res;
	};
	M.L.Nil = nil;
	/**
	 * Monad 'unit' (or 'return') function.  
	 * The method returns new list which contains only the given element.
	 * ```
	 * M.L.unit(9);  // outputs M.L(9)
	 * ```
	 */
	M.L.unit = function(x) {
		return List(x, function() { return nil; });
	};
	/**
	 * returns an infinite list of natural number.  
	 * The first argument is first number.
	 * ```
	 * M.L.N(0);  // outputs M.L(0, 1, 2, ...)
	 * ```
	 */
	M.L.N = function(one) {
		function succ(n) {
			return List(n, Memo(function() { return succ(n + 1); }));
		}
		return succ(one);
	};
	function successorZ(n) {
		return List(n, Memo(function() { return successorZ(n > 0 ? -n : -n + 1); }));
	}
	/**
	 * A infinite list of integer.
	 */
	M.L.Z = successorZ(0);
	M.L.range = function(start, end) {
		function succ(n) {
			return List(n, Memo(function() { return n < end ? succ(n + 1) : nil; }));
		}
		if(start > end) {
			throw new Error("start must be less than or equal to end");
		}
		return succ(start);
	};
	function permutationSuccessor(arr, num, index) {
		var val = [],
			indexArr = index.value(),
			i;
		for(i = 0; i < num; i++) {
			val.push(arr[indexArr[i]]);
		}
		return List(M.T.apply(null, val), Memo(function() {
			var nxt = index.next()
			return nxt ? permutationSuccessor(arr, num, nxt) : nil;
		}));
	}
	/**
	 * returns a list which consist of k-permutation of the array given by first argument.  
	 * Every element of the list is a tuple.  
	 * The number k is given by second argument.
	 * If k is not given, k is the length of the given array.
	 * ```
	 * M.L.permutation(["a", "b", "c"], 2);  // outputs M.L(M.T("a", "b"), M.T("a", "c"), ...)
	 * ```
	 */
	M.L.permutation = function(arr, num) {
		var n = num === undef ? arr.length : num;
		if(arr.length < n) {
			throw new Error("array size must be less or equal than number");
		}
		return permutationSuccessor(arr, n, permutationIndex(arr.length - 1, n));
	};
	/**
	 * returns a list which consists of k-combination of the array given by first argument.  
	 * Every element of the list is a tuple.  
	 * The number k is given by second argument.
	 * If k is not given, k is the length of the given array.
	 * ```
	 * M.L.combination(["a", "b", "c"], 2);  // outputs M.L(M.T("a", "b"), M.T("a", "c"), ...)
	 * ```
	 */
	M.L.combination = function(arr, num) {
		var n = num === undef ? arr.length : num;
		if(arr.length < n) {
			throw new Error("array size must be less or equal than number");
		}
		return permutationSuccessor(arr, n, combinationIndex(arr.length - 1, n));
	};
	/**
	 * returns new list of cross product of the given lists.  
	 * A infinite list can give as an operand.
	 * ```
	 * // outputs M.L(M.T(2, 3), M.T(4, 3), M.T(2, 6), M.T(6, 3), M.T(4, 6), M.T(6, 6))
	 * M.L.product(M.L(2, 4, 6), M.L(3, 6));
	 * ```
	 */
	M.L.product = function() {
		var args = Array.prototype.slice.call(arguments);
		function next(index) {
			var val,
				nxt,
				indexArr,
				i;
			outer: for(nxt = index; nxt; nxt = nxt.next()) {
				for(val = [], i = 0; i < args.length; i++) {
					indexArr = nxt.value();
					if(args[i].isNull(indexArr[i])) {
						continue outer;
					}
					val.push(args[i].at(indexArr[i]));
				}
				return List(M.T.apply(null, val), Memo(function() {
					return next(nxt.setOk().next());
				}));
			}
			return nil;
		}
		return next(directProductIndex(args.length, 0));
	};
	/**
	 * returns nth power list of the list given by first argument.  
	 * The number n is given by second argument.  
	 * A infinite list can give as an operand.
	 * ```
	 * // outputs M.L(M.T("a", "a"), M.T("a", "b"), M.T("b", "a"), M.T("b", "b"))
	 * M.L.power(M.L("a", "b"), 2);
	 * ```
	 */
	M.L.power = function(list, n) {
		var args = new Array(n),
			i;
		for(i = 0; i < n; i++) {
			args[i] = list;
		}
		return M.L.product.apply(null, args);
	};
	/**
	 * returns new list with the result of
	 * calling the function given by the argument on every element of the lists.  
	 * This method is available when the list has infinite elements.
	 * ```
	 * M.L.map((x, y, z) => x + y + z, M.L(1, 2, 3), M.L(3, 4, 5), M.L(6, 7));  // outputs M.L(10, 13)
	 * ```
	 */
	M.L.map = function(fn /* ,args */) {
		var args = Array.prototype.slice.call(arguments, 1),
			vals = [],
			rests = [fn],
			i;
		if(arguments.length <= 1) {
			throw new Error("at least one list required");
		}
		for(i = 0; i < args.length; i++) {
			if(args[i].isNull()) {
				return nil;
			}
			vals.push(args[i].value());
			rests.push(args[i].rest());
		}
		return new List(fn.apply(null, vals), Memo(function() { return M.L.map.apply(null, rests); }));
	};
	/**
	 * returns new list with the tuples of the given lists.
	 * ```
	 * M.L.zip(M.L(1, 2, 3), M.L(3, 4, 5), M.L(6, 7));  // outputs M.L(M.T(1, 3, 6), M.T(2, 4, 7))
	 * ```
	 */
	M.L.zip = function(/*args*/) {
		var args = Array.prototype.slice.call(arguments);
		args.unshift(function(/*args*/) {
			return M.T.apply(null, arguments);
		});
		return M.L.map.apply(null, args);
	};
	/**
	 * creates new list whose first value is the first arguement and rest value is
	 * the result of a thunk (a function with no arguments) given by second argument.
	 * ```
	 * function succ(n) {
	 * 	return M.L.create(n, function() { return succ(n + 1); });
	 * }
	 * succ(1);  // outputs M.L(1, 2, 3, 4, 5, ...)
	 * ```
	 */
	M.L.create = function(value, rest) {
		return List(value, Memo(rest));
	};
	/**
	 * creates new tuple of the given elements.
	 * ```
	 * M.T(1, 2, 3);  // outputs a tuple (1, 2, 3)
	 * ```
	 */
	M.T = function() {
		var args = Array.prototype.slice.call(arguments);
		function getTuple(n) {
			return args[n];
		}
		addMethod(getTuple, {
			toString: function() {
				var res = "(",
					i;
				for(i = 0; i < args.length; i++) {
					res += (i > 0 ? "," : "") + args[i];
				}
				return res + ")";
			},
			/**
			 * @class M.T
			 * converts this tuple to an array.
			 * ```
			 * M.T(1, 2, 3).toArray()  // outputs [1, 2, 3]
			 * ```
			 */
			toArray: function() {
				return [].concat(args);
			},
			"@tupleId@": TUPLE_ID
		});
		return getTuple;
	};
	/**
	 * returns true is the given object is a tuple.
	 */
	M.T.isTuple = function(obj) {
		return obj["@tupleId@"] === TUPLE_ID;
	};
	function placeholder(n) {
		return {
			index: function() {
				return n - 1;
			},
			"@placeholderId@": PLACEHOLDER_ID
		};
	}
	/**
	 * creates a function which can curry and compose.  
	 * First argument is a function to wrap and second argument is arity of the function.  
	 * If second argument is omitted, arity is equals to length of the first argument.
	 * ```
	 * M.F((x, y, z) => x + y + z)(7)(6)(5);  // outputs 18
	 * ```
	 */
	M.F = function(fn, arity) {
		var func,
			len = arity === undef ? fn.length : arity;
		function assignArgs(args, argsnew) {
			var result = [].concat(args),
				i,
				index;
			for(i = 0; i < argsnew.length; i++) {
				index = arrayIndexOf(args, M.$n(i + 1));
				if(index < 0) {
					result.push(argsnew[i]);
				} else {
					result[index] = argsnew[i];
				}
			}
			return result;
		}
		function shiftPlaceholder(args) {
			var collect = [],
				argsnew = [].concat(args),
				i,
				j;
			for(i = 0; i < args.length; i++) {
				if(args[i]["@placeholderId@"] === PLACEHOLDER_ID) {
					for(j = 0; j <= collect.length; j++) {
						if(j === collect.length || args[i].index() < collect[j].place.index()) {
							collect.splice(j, 0, {
								orgIndex: i,
								place: args[i]
							});
							break;
						}
					}
				}
			}
			for(i = 0; i < collect.length; i++) {
				argsnew[collect[i].orgIndex] = M.$n(i + 1);
			}
			return argsnew;
		}
		function existsPlaceholder(args) {
			var i;
			for(i = 0; i < args.length; i++) {
				if(args[i]["@placeholderId@"] === PLACEHOLDER_ID) {
					return true;
				}
			}
			return false;
		}
		function partial(args, action) {
			return function() {
				var argsnew = assignArgs(args, arguments);
				argsnew = shiftPlaceholder(argsnew);
				if(argsnew.length < len || existsPlaceholder(argsnew)) {
					return M.F(partial(argsnew, action));
				} else {
					var res = fn.apply(null, argsnew);
					return action ? action(res) : res;
				}
			};
		}
		func = partial([]);
		addMethod(func, {
			/**
			 * @class M.F
			 * concatenates this function and the given function.  
			 * Arity of the given function must be 1.  
			 * The concatenated function can be curried.
			 * ```
			 * M.F((x, y, z) => x + y + z).pipe(x => x + 2)(7)(6)(5);  // outputs 20
			 */
			pipe: function(b) {
				var f;
				if(typeof b !== "function") {
					throw new Error("argument must be a function");
				} else if(b.length !== 1 && b.argumentsLength() !== 1) {
					throw new Error("arity of function to compose must be 1");
				} else if(b === M.F.unit) {
					return this;
				} else {
					f = b["@functionId@"] === FUNCTION_ID ? b.value() : b;
					return M.F(partial([], b), fn.length);
				}
			},
			/**
			 * @class M.F
			 * returns arity of this function.
			 */
			argumentsLength: function() {
				return len;
			},
			/**
			 * @class M.F
			 * This method is equivalent to 'bind'.
			 */
			multiply: function(b) {
				return this.pipe(b);
			},
			/**
			 * @class M.F
			 * unwraps this function.
			 */
			value: function() {
				return func;
			},
			"@functionId@": FUNCTION_ID
		});
		return func;
	};
	/**
	 * The placeholder of argument.
	 * ```
	 * $F((x, y, z) => x + y + z)(M.$n(1), "6", M.$n(2))("7")("5");  // outputs "765"
	 * ```
	 */
	M.$n = function(n) {
		if(placeholderFlyweight[n] === undef) {
			placeholderFlyweight[n] = placeholder(n);
		}
		return placeholderFlyweight[n];
	};
	/**
	 * A shortcut of M.$n(1)
	 */
	M.$1 = M.$n(1);
	/**
	 * A shortcut of M.$n(2)
	 */
	M.$2 = M.$n(2);
	/**
	 * A shortcut of M.$n(3)
	 */
	M.$3 = M.$n(3);
	/**
	 * A shortcut of M.$n(4)
	 */
	M.$4 = M.$n(4);
	/**
	 * A shortcut of M.$n(5)
	 */
	M.$5 = M.$n(5);
	/**
	 * A shortcut of M.$n(6)
	 */
	M.$6 = M.$n(6);
	/**
	 * A shortcut of M.$n(7)
	 */
	M.$7 = M.$n(7);
	/**
	 * A shortcut of M.$n(8)
	 */
	M.$8 = M.$n(8);
	/**
	 * A shortcut of M.$n(9)
	 */
	M.$9 = M.$n(9);
	function _id(x) {
		return x;
	}
	/**
	 * An identity function (I combinator).  
	 * M.F.I is an alias of this method.
	 */
	M.F.unit = function(x) {
		return x;
	};
	M.F.I = M.F.unit;
	addMethod(M.F.unit, {
		pipe: function(b) {
			var f = b["@functionId@"] === FUNCTION_ID ? b : M.F(b);
			return b === M.F.unit ? M.F.unit : f;
		},
		argumentLength: function() {
			return 1;
		},
		multiply: function(b) {
			return this.pipe(b);
		},
		value: function() {
			return _id;
		},
		"@functionId@": FUNCTION_ID
	});
	/**
	 * creates an identity monad with the given value.
	 */
	M.Identity = function(x) {
		return {
			/**
			 * @class M.Identity
			 * Monad 'bind' function.  
			 * This method simply apply the element to the given function.
			 * ```
			 * M.Identity(4).bind(x => M.Identity(x + 2));  // outputs M.Identity(6)
			 * ```
			 */
			bind: function(b) {
				return b(x);
			},
			/**
			 * @class M.Identity
			 * returns the element.
			 */
			value: function() {
				return x;
			},
			toString: function() {
				return x + "";
			},
			/**
			 * @class M.Identity
			 * This method is equivalent to 'bind'.
			 */
			multiply: function(b) {
				return this.bind(b);
			}
		};
	};
	/**
	 * Monad 'unit' function.  
	 * This method is equivalent to M.Identity.
	 */
	M.Identity.unit = function(x) {
		return M.Identity(x);
	};
	/**
	 * creates new state monad.
	 */
	M.State = function(func) {
		return {
			/**
			 * @class M.State
			 * Monad 'bind' function.
			 */
			bind: function(b) {
				var me = this;
				return M.State(function(s0) {
					var s1 = me.runState(s0),
						s2 = b(s1(0)).runState(s1(1));
					return s2;
				});
			},
			/**
			 * @class M.State
			 * returns a tuple of the result and state by executing this monad.
			 */
			runState: function(s) {
				return func(s);
			},
			/**
			 * @class M.State
			 * returns the result value by executing this monad.
			 */
			evalState: function(s) {
				return this.runState(s)(0);
			},
			/**
			 * @class M.State
			 * returns the state by executing this monad.
			 */
			execState: function(s) {
				return this.runState(s)(1);
			},
			/**
			 * @class M.State
			 * This method is equivalent to 'bind'.
			 */
			multiply: function(b) {
				return this.bind(b);
			}
		};
	}
	/**
	 * Monad 'unit' function.  
	 * This method creates a state monad whose value is the given value.
	 */
	M.State.unit = function(x) {
		return M.State(function(s) {
			return M.T(x, s);
		});
	};
	/**
	 * A monad which copies the state to the value.
	 */
	M.State.getState = M.State(function(s) {
		return M.T(s, s);
	});
	/**
	 * creates new monad which replaces the state to the given value.
	 */
	M.State.putState = function(x) {
		return M.State(function(_) {
			return M.T(undef, x);
		});
	};
	/**
	 * creates new monad which replaces the state to the result of calling the given function.
	 */
	M.State.modify = function(f) {
		return M.State(function(x) {
			return M.T(undef, f(x));
		});
	};
	/*
	 * creates new state monad transformer.  
	 * This method has two curried arguments.  
	 * First argument is constructor of monad m, and second argument is a function a → m (v, s).
	 */
	M.StateT = function(Type) {
		function St(func) {
			return {
				/*
				 * @class M.StateT
				 * Monad 'bind' function.
				 */
				bind: function(b) {
					var me = this;
					return St(function(s0) {
						return me.runStateT(s0).bind(function(s1) {
							return b(s1(0)).runStateT(s1(1));
						});
					});
				},
				/*
				 * @class M.StateT
				 * returns a tuple of the result and state by executing this monad.
				 */
				runStateT: function(s) {
					return func(s);
				},
				/*
				 * @class M.StateT
				 * This method is equivalent to 'bind'.
				 */
				multiply: function(b) {
					return this.bind(b);
				}
			};
		}
		/*
		 * Monad 'unit' function.  
		 * This method creates a state monad whose value is the given value.
		 */
		St.unit = function(x) {
			return St(function(s) {
				return Type.unit(M.T(x, s));
			});
		};
		/*
		 * A monad which copies the state to the value.
		 */
		St.getState = St(function(s) {
			return Type.unit(M.T(s, s));
		});
		/*
		 * creates new monad which replaces the state to the given value.
		 */
		St.putState = function(x) {
			return St(function(_) {
				return Type.unit(M.T(undef, x));
			});
		};
		/*
		 * creates new monad which replaces the state to the result of calling the given function.
		 */
		St.modify = function(f) {
			return St(function(x) {
				return Type.unit(M.T(undef, f(x)));
			});
		};
		/*
		 * lifts the given monad to state monad transformer.
		 */
		St.lift = function(m) {
			return St(function(s) {
				return m.bind(function(a) {
					return Type.unit(M.T(a, s));
				});
			});
		};
		return St;
	};
	/**
	 * creates new maybe monad with the given value.
	 */
	M.Just = function(x) {
		return {
			/**
			 * @class M.Just
			 * Monad 'bind' function.  
			 * This method returns the result calling given function a → M.Maybe a.
			 * ```
			 * M.Just(3).bind(x => M.Just(x * x));  // outputs M.Just(9)
			 * ```
			 */
			bind: function(b) {
				return b(x);
			},
			/**
			 * @class M.Just
			 * returns a wrapped value.
			 * ```
			 * M.Just(3).value();  // outputs 3
			 * ```
			 */
			value: function() {
				return x;
			},
			/**
			 * @class M.Just
			 * returns this monad.
			 * ```
			 * M.Just(3).or(M.Just(4));  // output M.Just(3)
			 * ```
			 */
			or: function(_) {
				return this;
			},
			/**
			 * @class M.Just
			 * always returns false.
			 */
			isNothing: function() {
				return false;
			},
			/**
			 * @class M.Just
			 * This method is equivalent to 'bind'.
			 */
			multiply: function(b) {
				return this.bind(b);
			},
			toString: function() {
				return "Just " + x;
			}
		};
	};
	/**
	 * A nothing monad.
	 */
	M.Nothing = {
		/**
		 * @class M.Nothing
		 * Monad 'bind' function.  
		 * returns this monad.
		 * ```
		 * M.Nothing.bind(x => M.Just(x * x));  // outputs M.Nothing
		 * ```
		 */
		bind: function(_) { return this; },
		/**
		 * @class M.Nothing
		 * always throws an error.
		 */
		value: function(_) {
			throw new Error("can not get value from Nothing");
		},
		/**
		 * @class M.Nothing
		 * returns the given argument.
		 * ```
		 * M.Nothing.or(M.Just(4));  // outputs M.Just(4)
		 * ```
		 */
		or: function(b) {
			return b;
		},
		/**
		 * @class M.Nothing
		 * always returns true.
		 */
		isNothing: function() {
			return true;
		},
		/**
		 * @class M.Nothing
		 * This method is equivalent to 'bind'.
		 */
		multiply: function(b) {
			return this.bind(b);
		},
		toString: function() {
			return "Nothing";
		}
	};
	/**
	 * Monad 'unit' function.  
	 * This method is equivalent to M.Just(x).
	 */
	M.Maybe.unit = function(x) {
		return M.Just(x);
	};
	M.Right = function(x) {
		return {
			bind: function(b) {
				return b(x);
			},
			either: function(leftf, rightf) {
				return rightf(x);
			},
			or: function(_) {
				return this;
			},
			multiply: function(b) {
				return this.bind(b);
			},
			toString: function() {
				return "Right " + x;
			}
		};
	};
	M.Left = function(x) {
		return {
			bind: function(_) {
				return this;
			},
			either: function(leftf, rightf) {
				return leftf(x);
			},
			or: function(b) {
				return b;
			},
			multiply: function(b) {
				return this.bind(b);
			},
			toString: function() {
				return "Left " + x;
			}
		};
	};
	M.Either = {
		unit: function(x) {
			return M.Right(x);
		}
	};
	M.tu = M.faites = M["do"] = function(monad, /*args*/) {
		var res = monad,
			i;
		for(i = 1; i < arguments.length; i++) {
			res = res.bind(arguments[i]);
		}
		return res;
	};
	if(typeof module !== "undefined" && module.exports) {
		module.exports = M;
	} else {
		root["MonadPrimus"] = root["M"] = M;
		root["$L"] = M.L;
		root["$T"] = M.T;
		root["$F"] = M.F;
	}
})(this);