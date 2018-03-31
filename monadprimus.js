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
		undef = void 0,
		nil,
		Nothing;
	function List(value, succ) {
		this._value = value;
		this._succ = succ;
	}
	List.prototype = {
		bind: function(b) {
			var me = this,
				mapped = b(me._value);
			function getNext(succ) {
				var next = succ(),
					meNext;
				if(next !== nil) {
					return new List(next._value, function() { return getNext(next._succ); });;
				} else if((meNext = me._succ()) !== nil) {
					return meNext.bind(b);
				} else {
					return nil;
				}
			}
			return mapped === nil ? nil : new List(mapped._value, function() { return getNext(mapped._succ); });
		},
		take: function(n) {
			var res = [],
				next = this,
				i;
			for(i = 0; (n === undef || i < n) && next !== nil; i++) {
				res.push(next._value);
				next = next._succ();
			}
			return res;
		},
		filter: function(pred) {
			function filterNext(succ) {
				var next;
				for(next = succ; next !== nil; next = next._succ()) {
					if(pred(next._value)) {
						return new List(next._value, function() { return filterNext(next._succ()); });
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
					return new List(next._value, function() { return concatList(next._succ); });;
				} else {
					return list;
				}
			}
			return list === nil ? me : new List(me._value, function() { return concatList(me._succ); });
		},
		map: function(fn) {
			var me = this;
			return new List(fn(me._value), function() { return me._succ().map(fn); });
		}
	};
	nil = {
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
		}
	};
	M.Nil = nil;
	M.L = function() {
		var args = Array.prototype.slice.call(arguments),
			res = nil,
			i;
		for(i = args.length - 1; i >= 0; i--) {
			res = (function(res, i) {
				return new List(args[i], function() { return res; })
			})(res, i);
		}
		return res;
	};
	M.L.Nil = nil;
	M.L.unit = function(x) {
		return new List(x, function() { return nil; });
	};
	M.L.N = function(one) {
		function succ(n) {
			return new List(n, function() { return succ(n + 1); });
		}
		return succ(one);
	};
	M.T = function() {
		var args = Array.prototype.slice.call(arguments);
		function getTuple(n) {
			return args[n];
		}
		getTuple.toString = function() {
			var res = "(",
				i;
			for(i = 0; i < args.length; i++) {
				res += (i > 0 ? "," : "") + args[i];
			}
			return res + ")";
		};
		getTuple.toArray = function() {
			return [].concat(args);
		};
		getTuple["@tupleId@"] = TUPLE_ID;
		return getTuple;
	};
	M.T.isTuple = function(obj) {
		return obj["@tupleId@"] === TUPLE_ID;
	};
	M.F = function(fn, arity) {
		var func,
			len = arity === undef ? fn.length : arity;
		function partial(args, action) {
			return function() {
				var argsnew = args.concat(Array.prototype.slice.call(arguments));
				if(argsnew.length < len) {
					return M.F(partial(argsnew, action));
				} else {
					var res = fn.apply(null, argsnew);
					return action ? action(res) : res;
				}
			};
		}
		func = partial([]);
		func.compose = function(b) {
			if(b.length !== 1) {
				throw new Error("arity of function to compose must be 1");
			}
			return M.F(partial([], b), fn.length);
		}
		return func;
	}
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
	if(typeof module !== "undefined" && module.exports) {
		module.exports = M;
	} else {
		root["MonadPrimus"] = root["M"] = M;
		root["$L"] = M.L;
		root["$T"] = M.T;
		root["$F"] = M.F;
	}
})(this);