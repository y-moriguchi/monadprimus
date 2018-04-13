/**
 * MonadPrimus
 *
 * Copyright (c) 2018 Yuichiro MORIGUCHI
 *
 * This software is released under the MIT License.
 * http://opensource.org/licenses/mit-license.php
 **/
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
		function at(index) {
			if(index < 0 || index > maxIndex) {
				throw new Error("index out of bounds");
			}
			return index > 0 ? at0(index - 1, succ()) : value;
		}
		return {
			at: at,
			value: function() {
				return value;
			},
			rest: function() {
				return succ();
			},
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
			map: function(fn) {
				var me = this;
				return new List(fn(me.value()), Memo(function() { return me.rest().map(fn); }));
			},
			some: function(pred) {
				var next;
				for(next = this; next !== nil; next = next.rest()) {
					if(pred(next.value())) {
						return true;
					}
				}
				return false;
			},
			every: function(pred) {
				return !this.some(function(x) { return !pred(x); });
			},
			isNull: function(index) {
				return index === undef || index === 0 ? false : this.rest().isNull(index - 1);
			},
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
	M.Nil = nil;
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
	M.L.unit = function(x) {
		return List(x, function() { return nil; });
	};
	M.L.N = function(one) {
		function succ(n) {
			return List(n, Memo(function() { return succ(n + 1); }));
		}
		return succ(one);
	};
	function successorZ(n) {
		return List(n, Memo(function() { return successorZ(n > 0 ? -n : -n + 1); }));
	}
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
	M.L.permutation = function(arr, num) {
		var n = num === undef ? arr.length : num;
		if(arr.length < n) {
			throw new Error("array size must be less or equal than number");
		}
		return permutationSuccessor(arr, n, permutationIndex(arr.length - 1, n));
	};
	M.L.combination = function(arr, num) {
		var n = num === undef ? arr.length : num;
		if(arr.length < n) {
			throw new Error("array size must be less or equal than number");
		}
		return permutationSuccessor(arr, n, combinationIndex(arr.length - 1, n));
	};
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
	M.L.power = function(list, n) {
		var args = new Array(n),
			i;
		for(i = 0; i < n; i++) {
			args[i] = list;
		}
		return M.L.product.apply(null, args);
	};
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
	M.L.zip = function(/*args*/) {
		var args = Array.prototype.slice.call(arguments);
		args.unshift(function(/*args*/) {
			return M.T.apply(null, arguments);
		});
		return M.L.map.apply(null, args);
	};
	M.L.create = function(value, rest) {
		return List(value, Memo(rest));
	};
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
			toArray: function() {
				return [].concat(args);
			},
			"@tupleId@": TUPLE_ID
		});
		return getTuple;
	};
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
			argumentsLength: function() {
				return len;
			},
			multiply: function(b) {
				return this.pipe(b);
			},
			value: function() {
				return func;
			},
			"@functionId@": FUNCTION_ID
		});
		return func;
	};
	M.$n = function(n) {
		if(placeholderFlyweight[n] === undef) {
			placeholderFlyweight[n] = placeholder(n);
		}
		return placeholderFlyweight[n];
	};
	M.$1 = M.$n(1);
	M.$2 = M.$n(2);
	M.$3 = M.$n(3);
	M.$4 = M.$n(4);
	M.$5 = M.$n(5);
	M.$6 = M.$n(6);
	M.$7 = M.$n(7);
	M.$8 = M.$n(8);
	M.$9 = M.$n(9);
	function _id(x) {
		return x;
	}
	M.F.unit = M.F.I = function(x) {
		return x;
	};
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
	M.Identity = function(x) {
		return {
			bind: function(b) {
				return b(x);
			},
			value: function() {
				return x;
			},
			toString: function() {
				return x + "";
			},
			multiply: function(b) {
				return this.bind(b);
			}
		};
	};
	M.Identity.unit = function(x) {
		return M.Identity(x);
	};
	M.State = function(func) {
		return {
			bind: function(b) {
				var me = this;
				return M.State(function(s0) {
					var s1 = me.runState(s0),
						s2 = b(s1(0)).runState(s1(1));
					return s2;
				});
			},
			runState: function(s) {
				return func(s);
			},
			evalState: function(s) {
				return this.runState(s)(0);
			},
			execState: function(s) {
				return this.runState(s)(1);
			},
			multiply: function(b) {
				return this.bind(b);
			}
		};
	}
	M.State.unit = function(x) {
		return M.State(function(s) {
			return M.T(x, s);
		});
	};
	M.State.getState = M.State(function(s) {
		return M.T(s, s);
	});
	M.State.putState = function(x) {
		return M.State(function(_) {
			return M.T(undef, x);
		});
	};
	M.State.modify = function(f) {
		return M.State(function(x) {
			return M.T(undef, f(x));
		});
	};
	M.StateT = function(Type) {
		function St(func) {
			return {
				bind: function(b) {
					var me = this;
					return St(function(s0) {
						return me.runStateT(s0).bind(function(s1) {
							return b(s1(0)).runStateT(s1(1));
						});
					});
				},
				runStateT: function(s) {
					return func(s);
				},
				multiply: function(b) {
					return this.bind(b);
				}
			};
		}
		St.unit = function(x) {
			return St(function(s) {
				return Type.unit(M.T(x, s));
			});
		};
		St.getState = St(function(s) {
			return Type.unit(M.T(s, s));
		});
		St.putState = function(x) {
			return St(function(_) {
				return Type.unit(M.T(undef, x));
			});
		};
		St.modify = function(f) {
			return St(function(x) {
				return Type.unit(M.T(undef, f(x)));
			});
		};
		St.lift = function(m) {
			return St(function(s) {
				return m.bind(function(a) {
					return Type.unit(M.T(a, s));
				});
			});
		};
		return St;
	};
	M.Just = function(x) {
		return {
			bind: function(b) {
				return b(x);
			},
			value: function() {
				return x;
			},
			or: function(_) {
				return this;
			},
			isNothing: function() {
				return false;
			},
			multiply: function(b) {
				return this.bind(b);
			},
			toString: function() {
				return "Just " + x;
			}
		};
	};
	M.Nothing = {
		bind: function(_) { return this; },
		value: function(_) {
			throw new Error("can not get value from Nothing");
		},
		or: function(b) {
			return b;
		},
		isNothing: function() {
			return true;
		},
		multiply: function(b) {
			return this.bind(b);
		},
		toString: function() {
			return "Nothing";
		}
	};
	M.Maybe = {
		unit: function(x) {
			return M.Just(x);
		}
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