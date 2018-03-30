/**
 * MonadPrimus
 *
 * Copyright (c) 2018 Yuichiro MORIGUCHI
 *
 * This software is released under the MIT License.
 * http://opensource.org/licenses/mit-license.php
 **/
(function(root) {
	var MP = {},
		undef = void 0,
		nil;
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
			return new List(mapped._value, function() { return getNext(mapped._succ); });
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
	function Nil() {}
	Nil.prototype = {
		bind: function(b) {
			return b;
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
	}
	nil = new Nil();
	MP.List = function() {
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
	MP.List.Nil = nil;
	MP.List.unit = function(x) {
		return new List(x, function() { return nil; });
	};
	MP.List.N = function(one) {
		function succ(n) {
			return new List(n, function() { return succ(n + 1); });
		}
		return succ(one);
	};
	if(typeof module !== "undefined" && module.exports) {
		module.exports = MP;
	} else {
		root["MonadPrimus"] = root["MP"] = MP;
		root["$L"] = MP.List;
	}
})(this);