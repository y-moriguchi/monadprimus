/**
 * MonadPrimus
 *
 * Copyright (c) 2018 Yuichiro MORIGUCHI
 *
 * This software is released under the MIT License.
 * http://opensource.org/licenses/mit-license.php
 **/
/*
 * This test case describe by Jasmine.
 */
describe("MonadPrimus", function () {
	beforeEach(function () {
	});

	describe("testing Maybe", function () {
		function fn(x) { return M.Just(x * x); }
		function fm(x) { return M.Just(x - 3); }
		function fnothing(x) { return M.Nothing; }
		it("bind", function () {
			expect(M.Just(3).bind(fn).value()).toBe(9);
			expect(M.Nothing.bind(fn).isNothing()).toBe(true);
			expect(M.Just(3).bind(fnothing).isNothing()).toBe(true);
			expect(M.Nothing.bind(fnothing).isNothing()).toBe(true);
		});
		it("multiply", function () {
			expect(M.Just(3).multiply(fn).value()).toBe(9);
			expect(M.Nothing.multiply(fn).isNothing()).toBe(true);
			expect(M.Just(3).multiply(fnothing).isNothing()).toBe(true);
			expect(M.Nothing.multiply(fnothing).isNothing()).toBe(true);
		});
		it("value", function () {
			expect(M.Just(3).value()).toBe(3);
			expect(function() { M.Nothing.value() }).toThrow();
		});
		it("or", function () {
			expect(M.Just(3).or(M.Just(4)).value()).toBe(3);
			expect(M.Nothing.or(M.Just(4)).value()).toBe(4);
			expect(M.Just(3).or(M.Nothing).value()).toBe(3);
			expect(M.Nothing.or(M.Nothing).isNothing()).toBe(true);
		});
		it("isNothing", function () {
			expect(M.Just(3).isNothing()).toBe(false);
			expect(M.Nothing.isNothing()).toBe(true);
		});
		it("monad rule", function () {
			expect(M.Maybe.unit(3).bind(fn).value()).toBe(fn(3).value());
			expect(M.Just(3).bind(M.Maybe.unit).value()).toBe(M.Just(3).value());
			expect(M.Just(3).bind(fn).bind(fm).value()).toBe(M.Just(3).bind(function(x) {
				return fn(x).bind(fm)
			}).value());
			expect(M.Nothing.bind(M.Maybe.unit).isNothing()).toBe(M.Nothing.isNothing());
			expect(M.Nothing.bind(fn).bind(fm).isNothing()).toBe(M.Nothing.bind(function(x) {
				return fn(x).bind(fm)
			}).isNothing());
			expect(M.Just(3).bind(fnothing).bind(fm).isNothing()).toBe(M.Just(3).bind(function(x) {
				return fnothing(x).bind(fm)
			}).isNothing());
			expect(M.Just(3).bind(fn).bind(fnothing).isNothing()).toBe(M.Just(3).bind(function(x) {
				return fn(x).bind(fnothing)
			}).isNothing());
		});
	});

	describe("testing Either", function () {
		function fn(x) { return M.Right(x * x); }
		function fm(x) { return M.Right(x - 3); }
		function fleft(x) { return M.Left(x * 2); }
		function fl(x) { return "L" + x; }
		function fr(x) { return "R" + x; }
		it("bind", function () {
			expect(M.Right(3).bind(fn).either(fl, fr)).toBe("R9");
			expect(M.Left(3).bind(fn).either(fl, fr)).toBe("L3");
			expect(M.Right(3).bind(fleft).either(fl, fr)).toBe("L6");
			expect(M.Left(3).bind(fleft).either(fl, fr)).toBe("L3");
		});
		it("multiply", function () {
			expect(M.Right(3).multiply(fn).either(fl, fr)).toBe("R9");
			expect(M.Left(3).multiply(fn).either(fl, fr)).toBe("L3");
			expect(M.Right(3).multiply(fleft).either(fl, fr)).toBe("L6");
			expect(M.Left(3).multiply(fleft).either(fl, fr)).toBe("L3");
		});
		it("either", function () {
			expect(M.Right(3).either(fl, fr)).toBe("R3");
			expect(M.Left(3).either(fl, fr)).toBe("L3");
		});
		it("or", function () {
			expect(M.Right(3).or(M.Right(4)).either(fl, fr)).toBe("R3");
			expect(M.Left(3).or(M.Right(4)).either(fl, fr)).toBe("R4");
			expect(M.Right(3).or(M.Left(3)).either(fl, fr)).toBe("R3");
			expect(M.Left(3).or(M.Left(4)).either(fl, fr)).toBe("L4");
		});
		it("monad rule", function () {
			expect(M.Either.unit(3).bind(fn).either(fl, fr)).toBe(fn(3).either(fl, fr));
			expect(M.Right(3).bind(M.Either.unit).either(fl, fr)).toBe(M.Right(3).either(fl, fr));
			expect(M.Right(3).bind(fn).bind(fm).either(fl, fr)).toBe(M.Right(3).bind(function(x) {
				return fn(x).bind(fm)
			}).either(fl, fr));
			expect(M.Left(3).bind(M.Either.unit).either(fl, fr)).toBe(M.Left(3).either(fl, fr));
			expect(M.Left(3).bind(fn).bind(fm).either(fl, fr)).toBe(M.Left(3).bind(function(x) {
				return fn(x).bind(fm)
			}).either(fl, fr));
			expect(M.Right(3).bind(fleft).bind(fm).either(fl, fr)).toBe(M.Right(3).bind(function(x) {
				return fleft(x).bind(fm)
			}).either(fl, fr));
			expect(M.Right(3).bind(fn).bind(fleft).either(fl, fr)).toBe(M.Right(3).bind(function(x) {
				return fn(x).bind(fleft)
			}).either(fl, fr));
		});
	});

	describe("testing List", function () {
		function fn(x) { return $L(x * 2, x * 3); }
		function fm(x) { return $L(x + 2, x + 3); }
		function fl(x) { return $L(x * 2); }
		function fnil(x) { return M.Nil; }
		it("at", function () {
			expect($L(1, 2).at(0)).toBe(1);
			expect($L(1, 2).at(1)).toBe(2);
			expect($L(1, 2).at(2)).toBe(undefined);
			expect(M.Nil.at(0)).toBe(undefined);
			expect(M.L.N(1).at(0)).toBe(1);
			expect(M.L.N(1).at(100)).toBe(101);
			expect(function() { $L(1, 2).at(-1) }).toThrow();
			expect(function() { $L(1, 2).at(9007199254740992) }).toThrow();
			expect(function() { M.Nil.at(-1) }).toThrow();
			expect(function() { M.Nil.at(9007199254740992) }).toThrow();
		});
		it("bind", function () {
			expect($L(1, 2).bind(fn).take()).toEqual([2, 3, 4, 6]);
			expect($L(1, 2).bind(fl).take()).toEqual([2, 4]);
			expect(M.Nil.bind(fn).take()).toEqual([]);
			expect($L(1, 2).bind(fnil).take()).toEqual([]);
		});
		it("multiply", function () {
			expect($L(1, 2).multiply(fn).take()).toEqual([2, 3, 4, 6]);
			expect($L(1, 2).multiply(fl).take()).toEqual([2, 4]);
			expect(M.Nil.multiply(fn).take()).toEqual([]);
			expect($L(1, 2).multiply(fnil).take()).toEqual([]);
		});
		it("take", function () {
			expect($L(1, 2, 3, 4).take()).toEqual([1, 2, 3, 4]);
			expect($L(1, 2, 3, 4).take(2)).toEqual([1, 2]);
			expect($L(1, 2, 3, 4).take(4)).toEqual([1, 2, 3, 4]);
			expect($L(1, 2, 3, 4).take(5)).toEqual([1, 2, 3, 4]);
			expect($L(1, 2, 3, 4).take(0)).toEqual([]);
			expect(M.L.N(1).take(2)).toEqual([1, 2]);
			expect(M.Nil.take()).toEqual([]);
			expect(M.Nil.take(0)).toEqual([]);
			expect(M.Nil.take(2)).toEqual([]);
		});
		it("filter", function () {
			var memo = [];
			expect($L(1, 2, 3, 4).filter(function(x) { return x % 2 === 0; }).take()).toEqual([2, 4]);
			expect($L(1, 2, 3, 4).filter(function(x) { return x % 2 === 1; }).take()).toEqual([1, 3]);
			expect(M.L.N(2).filter(function(x) {
				var i;
				for(i = 0; i < memo.length; i++) {
					if(x % memo[i] === 0) {
						return false;
					}
				}
				memo.push(x);
				return true;
			}).take(5)).toEqual([2, 3, 5, 7, 11]);
			expect(M.Nil.filter(function(x) { return x % 2 === 0; }).take()).toEqual([]);
		});
		it("concat", function () {
			expect($L(1, 2).concat($L(5, 6)).take()).toEqual([1, 2, 5, 6]);
			expect($L(1, 2).concat(M.Nil).take()).toEqual([1, 2]);
			expect(M.Nil.concat($L(5, 6)).take()).toEqual([5, 6]);
			expect(M.Nil.concat(M.Nil).take()).toEqual([]);
			expect($L(765, 346).concat(M.L.N(1)).take(4)).toEqual([765, 346, 1, 2]);
			expect($L(765, 346).concat(M.L.N(1)).take(3)).toEqual([765, 346, 1]);
			expect($L(765, 346).concat(M.L.N(1)).take(2)).toEqual([765, 346]);
			expect($L(765, 346).concat(M.L.N(1)).take(1)).toEqual([765]);
		});
		it("map", function () {
			expect($L(1, 2, 3).map(function(x) { return x * x; }).take()).toEqual([1, 4, 9]);
			expect(M.Nil.map(function(x) { return x * x; }).take()).toEqual([]);
			expect(M.L.N(1).map(function(x) { return x * x; }).take(5)).toEqual([1, 4, 9, 16, 25]);
		});
		it("some", function () {
			expect($L(1, 4, 5).some(function(x) { return x % 2 === 0; })).toBe(true);
			expect($L(1, 3, 6).some(function(x) { return x % 2 === 0; })).toBe(true);
			expect($L(2, 3, 6).some(function(x) { return x % 2 === 0; })).toBe(true);
			expect($L(1, 3, 5).some(function(x) { return x % 2 === 0; })).toBe(false);
			expect(M.Nil.some(function(x) { return x % 2 === 0; })).toBe(false);
			expect($L().some(function(x) { return x % 2 === 0; })).toBe(false);
			expect(M.L.N(1).some(function(x) { return x % 5 === 0; })).toBe(true);
		});
		it("every", function () {
			expect($L(1, 4, 5).every(function(x) { return x % 2 === 1; })).toBe(false);
			expect($L(1, 3, 6).every(function(x) { return x % 2 === 1; })).toBe(false);
			expect($L(2, 3, 6).every(function(x) { return x % 2 === 1; })).toBe(false);
			expect($L(1, 3, 5).every(function(x) { return x % 2 === 1; })).toBe(true);
			expect(M.Nil.every(function(x) { return x % 2 === 0; })).toBe(true);
			expect($L().every(function(x) { return x % 2 === 0; })).toBe(true);
			expect(M.L.N(1).every(function(x) { return x % 5 !== 0; })).toBe(false);
		});
		it("range", function () {
			expect(M.L.range(1, 5).take()).toEqual([1, 2, 3, 4, 5]);
			expect(M.L.range(1, 1).take()).toEqual([1]);
			expect(function() { M.L.range(2, 1) }).toThrow();
		});
		it("permutation", function () {
			expect(M.L.permutation(["a", "b", "c", "d"], 3).take().map(function(x) { return x.toArray(); })).toEqual([
				["a", "b", "c"],
				["a", "b", "d"],
				["a", "c", "b"],
				["a", "c", "d"],
				["a", "d", "b"],
				["a", "d", "c"],
				["b", "a", "c"],
				["b", "a", "d"],
				["b", "c", "a"],
				["b", "c", "d"],
				["b", "d", "a"],
				["b", "d", "c"],
				["c", "a", "b"],
				["c", "a", "d"],
				["c", "b", "a"],
				["c", "b", "d"],
				["c", "d", "a"],
				["c", "d", "b"],
				["d", "a", "b"],
				["d", "a", "c"],
				["d", "b", "a"],
				["d", "b", "c"],
				["d", "c", "a"],
				["d", "c", "b"]
			]);
			expect(M.L.permutation(["a", "b", "c"]).take().map(function(x) { return x.toArray(); })).toEqual([
				["a", "b", "c"],
				["a", "c", "b"],
				["b", "a", "c"],
				["b", "c", "a"],
				["c", "a", "b"],
				["c", "b", "a"]
			]);
			expect(M.L.permutation(["a", "b", "c", "d"], 2).take().map(function(x) { return x.toArray(); })).toEqual([
				["a", "b"],
				["a", "c"],
				["a", "d"],
				["b", "a"],
				["b", "c"],
				["b", "d"],
				["c", "a"],
				["c", "b"],
				["c", "d"],
				["d", "a"],
				["d", "b"],
				["d", "c"]
			]);
			expect(M.L.permutation(["a", "b", "c", "d"], 1).take().map(function(x) { return x.toArray(); })).toEqual([
				["a"], ["b"], ["c"], ["d"]
			]);
			expect(M.L.permutation(["a", "b", "c", "d"], 0).take().map(function(x) { return x.toArray(); })).toEqual([[]]);
		});
		it("product", function () {
			expect(M.L.product(M.L(2, 4, 6), M.L(3, 6), M.L(4, 8)).take().map(function(x) { return x.toArray(); })).toEqual([
				[2, 3, 4],
				[4, 3, 4],
				[2, 6, 4],
				[2, 3, 8],
				[6, 3, 4],
				[4, 6, 4],
				[4, 3, 8],
				[2, 6, 8],
				[6, 6, 4],
				[6, 3, 8],
				[4, 6, 8],
				[6, 6, 8]
			]);
			expect(M.L.product(M.L(2, 4, 6), M.L(3, 6)).take().map(function(x) { return x.toArray(); })).toEqual([
				[2, 3],
				[4, 3],
				[2, 6],
				[6, 3],
				[4, 6],
				[6, 6]
			]);
			expect(M.L.product(M.L(2, 4, 6), M.L(3, 6), M.L(4)).take().map(function(x) { return x.toArray(); })).toEqual([
				[2, 3, 4],
				[4, 3, 4],
				[2, 6, 4],
				[6, 3, 4],
				[4, 6, 4],
				[6, 6, 4]
			]);
			expect(M.L.product(M.L(2, 4, 6), M.Nil, M.L(4)).take().map(function(x) { return x.toArray(); })).toEqual([]);
			expect(M.L.product(M.L.N(1), M.L.N(1)).take(10).map(function(x) { return x.toArray(); })).toEqual([
				[1, 1],
				[2, 1],
				[1, 2],
				[3, 1],
				[2, 2],
				[1, 3],
				[4, 1],
				[3, 2],
				[2, 3],
				[1, 4]
			]);
			expect(M.L.product(M.L.N(1), M.L(1, 2)).take(10).map(function(x) { return x.toArray(); })).toEqual([
				[1, 1],
				[2, 1],
				[1, 2],
				[3, 1],
				[2, 2],
				[4, 1],
				[3, 2],
				[5, 1],
				[4, 2],
				[6, 1]
			]);
			expect(M.L.product(M.L.N(1), M.Nil).take(10).map(function(x) { return x.toArray(); })).toEqual([]);
		});
		it("combination", function () {
			expect(M.L.combination(["a", "b", "c", "d"], 3).take().map(function(x) { return x.toArray(); })).toEqual([
				["a", "b", "c"],
				["a", "b", "d"],
				["a", "c", "d"],
				["b", "c", "d"]
			]);
			expect(M.L.combination(["a", "b", "c"]).take().map(function(x) { return x.toArray(); })).toEqual([
				["a", "b", "c"]
			]);
			expect(M.L.combination(["a", "b", "c", "d"], 2).take().map(function(x) { return x.toArray(); })).toEqual([
				["a", "b"],
				["a", "c"],
				["a", "d"],
				["b", "c"],
				["b", "d"],
				["c", "d"]
			]);
			expect(M.L.combination(["a", "b", "c", "d"], 1).take().map(function(x) { return x.toArray(); })).toEqual([
				["a"], ["b"], ["c"], ["d"]
			]);
			expect(M.L.combination(["a", "b", "c", "d"], 0).take().map(function(x) { return x.toArray(); })).toEqual([[]]);
		});
		it("Z", function () {
			expect(M.L.Z.take(6)).toEqual([0, 1, -1, 2, -2, 3]);
		});
		it("power", function () {
			expect(M.L.power(M.L("a", "b"), 3).take().map(function(x) { return x.toArray(); })).toEqual([
				["a", "a", "a"],
				["b", "a", "a"],
				["a", "b", "a"],
				["a", "a", "b"],
				["b", "b", "a"],
				["b", "a", "b"],
				["a", "b", "b"],
				["b", "b", "b"]
			]);
			expect(M.L.power(M.Nil, 3).take().map(function(x) { return x.toArray(); })).toEqual([]);
		});
		it("map many arguments", function () {
			expect(M.L.map(function(x, y, z) { return x + y + z; }, $L(1, 2, 3), $L(3, 4, 5), $L(6, 7)).take()).toEqual([10, 13]);
			expect(M.L.map(function(x, y, z) { return x + y + z; }, $L(1, 2, 3), M.Nil, $L(6, 7)).take()).toEqual([]);
			expect(M.L.map(function(x) { return x * x; }, $L(1, 2, 3)).take()).toEqual([1, 4, 9]);
			expect(M.L.map(function(x, y) { return x * y; }, M.L.N(1), M.L.N(2)).take(5)).toEqual([2, 6, 12, 20, 30]);
			expect(M.L.map(function(x, y) { return x * y; }, M.L.N(1), $L(3, 4, 5)).take()).toEqual([3, 8, 15]);
			expect(function() { M.L.map(); }).toThrow();
			expect(function() { M.L.map(function(x) { return x * x; }); }).toThrow();
		});
		it("create", function () {
			function succ(n) {
				return M.L.create(n, function() { return succ(n + 1); });
			}
			expect(succ(1).take(5)).toEqual([1, 2, 3, 4, 5]);
		});
		it("zip", function () {
			function toarray(x) {
				return x.toArray();
			}
			expect(M.L.zip($L(1, 2, 3), $L(3, 4, 5), $L(6, 7)).take().map(toarray)).toEqual([[1, 3, 6], [2, 4, 7]]);
			expect(M.L.zip($L(1, 2, 3), M.Nil, $L(6, 7)).take().map(toarray)).toEqual([]);
			expect(M.L.zip($L(1, 2, 3)).take().map(toarray)).toEqual([[1], [2], [3]]);
			expect(M.L.zip(M.L.N(1), M.L.N(2)).take(5).map(toarray)).toEqual([[1, 2], [2, 3], [3, 4], [4, 5], [5, 6]]);
			expect(M.L.zip(M.L.N(1), $L(3, 4, 5)).take().map(toarray)).toEqual([[1, 3], [2, 4], [3, 5]]);
		});
		it("find", function () {
			expect($L(1, 4, 5).find(function(x) { return x % 2 === 0; })).toBe(4);
			expect($L(1, 3, 6).find(function(x) { return x % 2 === 0; })).toBe(6);
			expect($L(2, 3, 6).find(function(x) { return x % 2 === 0; })).toBe(2);
			expect($L(1, 3, 5).find(function(x) { return x % 2 === 0; })).toBe(undefined);
			expect(M.Nil.find(function(x) { return x % 2 === 0; })).toBe(undefined);
			expect($L().find(function(x) { return x % 2 === 0; })).toBe(undefined);
			expect(M.L.N(1).find(function(x) { return x % 5 === 0; })).toBe(5);
		});
		it("includes", function () {
			expect($L(3, 4, 6).includes(3)).toBe(true);
			expect($L(3, 4, 6).includes(6)).toBe(true);
			expect($L(3, 4, 6).includes(5)).toBe(false);
			expect(M.Nil.includes(1)).toBe(false);
			expect($L().includes(1)).toBe(false);
			expect($L(3, 9, NaN).includes(NaN)).toBe(true);
			expect(M.L.N(1).includes(5)).toBe(true);
		});
		it("toString", function () {
			expect($L(3, 4, 6).toString()).toBe("$L(3, 4, 6)");
			expect($L(6).toString()).toBe("$L(6)");
			expect(M.L.range(1, 10).toString()).toBe("$L(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)");
			expect(M.L.range(1, 11).toString()).toBe("$L(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, ...)");
			expect(M.Nil.toString()).toBe("$L()");
			expect($L().toString()).toBe("$L()");
			expect(M.L.N(1).toString()).toBe("$L(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, ...)");
		});
		it("isList", function () {
			expect(M.L.isList($L(1, 2))).toBe(true);
			expect(M.L.isList($L())).toBe(true);
			expect(M.L.isList(M.Nil)).toBe(true);
			expect(M.L.isList($T(1, 2))).toBe(false);
			expect(M.L.isList($T())).toBe(false);
			expect(M.L.isList($F(function() {}))).toBe(false);
			expect(M.L.isList({a: 1})).toBe(false);
			expect(M.L.isList(961)).toBe(false);
			expect(M.L.isList("961")).toBe(false);
			expect(M.L.isList([1, 2, 3])).toBe(false);
			expect(M.L.isList(null)).toBe(false);
			expect(M.L.isList(true)).toBe(false);
			expect(M.L.isList(false)).toBe(false);
			expect(M.L.isList(undefined)).toBe(false);
			expect(M.L.isList(function() {})).toBe(false);
		});
		it("monad rule", function () {
			expect(M.L.unit(3).bind(fn).take()).toEqual(fn(3).take());
			expect($L(1, 2, 3).bind(M.L.unit).take()).toEqual($L(1, 2, 3).take());
			expect($L(1, 2, 3).bind(fn).bind(fm).take()).toEqual($L(1, 2, 3).bind(function(x) {
				return fn(x).bind(fm)
			}).take());
			expect(M.Nil.bind(M.L.unit).take()).toEqual(M.Nil.take());
			expect(M.Nil.bind(fn).bind(fm).take()).toEqual(M.Nil.bind(function(x) {
				return fn(x).bind(fm)
			}).take());
			expect(M.Right(3).bind(fnil).bind(fm).take()).toEqual(M.Right(3).bind(function(x) {
				return fnil(x).bind(fm)
			}).take());
			expect(M.Right(3).bind(fn).bind(fnil).take()).toEqual(M.Right(3).bind(function(x) {
				return fn(x).bind(fnil)
			}).take());
		});
	});

	describe("testing Identity", function () {
		function fn(x) { return M.Identity(x * 2); }
		function fm(x) { return M.Identity(x + 2); }
		it("bind", function () {
			expect(M.Identity(1).bind(fn).value()).toEqual(2);
		});
		it("multiply", function () {
			expect(M.Identity(1).multiply(fn).value()).toEqual(2);
		});
		it("value", function () {
			expect(M.Identity(1).value()).toEqual(1);
		});
		it("monad rule", function () {
			expect(M.Identity.unit(3).bind(fn).value()).toEqual(fn(3).value());
			expect(M.Identity(1).bind(M.Identity.unit).value()).toEqual(M.Identity(1).value());
			expect(M.Identity(1).bind(fn).bind(fm).value()).toEqual(M.Identity(1).bind(function(x) {
				return fn(x).bind(fm);
			}).value());
		});
	});

	describe("testing Tuple", function () {
		it("tuple", function () {
			expect($T(1, 2, 3)(0)).toBe(1);
			expect($T(1, 2, 3)(1)).toBe(2);
			expect($T(1, 2, 3)(2)).toBe(3);
			expect($T(1, 2, 3)(3)).toBe(undefined);
			expect($T(1, 2, 3).toArray()).toEqual([1, 2, 3]);
			expect($T(1, 2, 3).toString()).toBe("(1,2,3)");
			expect($T()(0)).toBe(undefined);
			expect($T().toArray()).toEqual([]);
			expect($T().toString()).toBe("()");
		});
		it("isTuple", function () {
			expect(M.T.isTuple($T(1, 2))).toBe(true);
			expect(M.T.isTuple($T())).toBe(true);
			expect(M.T.isTuple($L(1, 2))).toBe(false);
			expect(M.T.isTuple($L())).toBe(false);
			expect(M.T.isTuple(M.Nil)).toBe(false);
			expect(M.T.isTuple($F(function() {}))).toBe(false);
			expect(M.T.isTuple({a: 1})).toBe(false);
			expect(M.T.isTuple(961)).toBe(false);
			expect(M.T.isTuple("961")).toBe(false);
			expect(M.T.isTuple([1, 2, 3])).toBe(false);
			expect(M.T.isTuple(null)).toBe(false);
			expect(M.T.isTuple(true)).toBe(false);
			expect(M.T.isTuple(false)).toBe(false);
			expect(M.T.isTuple(undefined)).toBe(false);
			expect(M.T.isTuple(function() {})).toBe(false);
		});
	});

	describe("testing State", function () {
		function fn(x) { return M.State(function(s) { return $T(s + 2, s * 2) }); }
		function fm(x) { return M.State(function(s) { return $T(s + 3, s * 3) }); }
		it("bind", function () {
			expect(M.State.unit(3).bind(fn).runState(4).toArray()).toEqual([6, 8]);
		});
		it("multiply", function () {
			expect(M.State.unit(3).multiply(fn).runState(4).toArray()).toEqual([6, 8]);
		});
		it("runState", function () {
			expect(M.State.unit(3).runState(4).toArray()).toEqual([3, 4]);
		});
		it("evalState", function () {
			expect(M.State.unit(3).evalState(4)).toBe(3);
		});
		it("execState", function () {
			expect(M.State.unit(3).execState(4)).toBe(4);
		});
		it("getState", function () {
			expect(M.State.getState.runState(4).toArray()).toEqual([4, 4]);
		});
		it("putState", function () {
			expect(M.State.putState(5).runState(4).toArray()).toEqual([undefined, 5]);
		});
		it("modify", function () {
			expect(M.State.modify(function(x) { return x * 2; }).runState(4).toArray()).toEqual([undefined, 8]);
		});
		it("monad rule", function () {
			expect(M.State.unit(3).bind(fn).runState(4).toArray()).toEqual(fn(3).runState(4).toArray());
			expect(fn(3).bind(M.State.unit).runState(4).toArray()).toEqual(fn(3).runState(4).toArray());
			expect(fm(3).bind(fn).bind(fm).runState(4).toArray()).toEqual(fm(3).bind(function(x) {
				return fn(x).bind(fm);
			}).runState(4).toArray());
		});
	});

	describe("testing StateT 1", function () {
		var St = M.StateT(M.Identity);
		function fn(x) { return St(function(s) { return M.Identity($T(s + 2, s * 2)); }); }
		function fm(x) { return St(function(s) { return M.Identity($T(s + 3, s * 3)); }); }
		it("bind", function () {
			expect(St.unit(3).bind(fn).runStateT(4).value().toArray()).toEqual([6, 8]);
		});
		it("multiply", function () {
			expect(St.unit(3).multiply(fn).runStateT(4).value().toArray()).toEqual([6, 8]);
		});
		it("runState", function () {
			expect(St.unit(3).runStateT(4).value().toArray()).toEqual([3, 4]);
		});
		it("getState", function () {
			expect(St.getState.runStateT(4).value().toArray()).toEqual([4, 4]);
		});
		it("putState", function () {
			expect(St.putState(5).runStateT(4).value().toArray()).toEqual([undefined, 5]);
		});
		it("modify", function () {
			expect(St.modify(function(x) { return x * 2; }).runStateT(4).value().toArray()).toEqual([undefined, 8]);
		});
		it("lift", function () {
			expect(St.lift(M.Identity(5)).runStateT(4).value().toArray()).toEqual([5, 4]);
		});
		it("monad rule", function () {
			expect(St.unit(3).bind(fn).runStateT(4).value().toArray()).toEqual(fn(3).runStateT(4).value().toArray());
			expect(fn(3).bind(St.unit).runStateT(4).value().toArray()).toEqual(fn(3).runStateT(4).value().toArray());
			expect(fm(3).bind(fn).bind(fm).runStateT(4).value().toArray()).toEqual(fm(3).bind(function(x) {
				return fn(x).bind(fm);
			}).runStateT(4).value().toArray());
		});
	});

	describe("testing function wrapper", function () {
		function f1(x, y, z) { return x + y * z; }
		function f2() { return 765; }
		function f3(x) { return x + 3; }
		function f4(x) { return x + 4; }
		function f5(x, y, z) { return x + y + z; }
		function f6(x) { return x + "3"; }
		function f7(x) { return x + "2"; }
		function f8(x, y) { return this.x + x + y; }
		it("function", function () {
			expect($F(f1)(7)(6)(5)).toBe(37);
			expect($F(f1)(7, 6)(5)).toBe(37);
			expect($F(f1)(7, 6, 5)).toBe(37);
			expect($F(f1)(7)(6, 5)).toBe(37);
			expect($F(f1)()(7)(6)(5)).toBe(37);
			expect($F(f1)()()(7)(6)(5)).toBe(37);
			expect($F(f2)()).toBe(765);
			expect($F(f5)("7")("6")("5")).toBe("765");
			expect($F(f5)("7", "6")("5")).toBe("765");
			expect($F(f5)("7", "6", "5")).toBe("765");
			expect($F(f5)("7")("6", "5")).toBe("765");
			expect($F(f5)()("7")("6")("5")).toBe("765");
			expect($F(f5)()()("7")("6")("5")).toBe("765");
		});
		it("placeholder", function () {
			expect($F(f5)(M.$1, "6", "5")("7")).toBe("765");
			expect($F(f5)(M.$1, "6", M.$2)("7")("5")).toBe("765");
			expect($F(f5)(M.$1, "6", M.$2)("7", "5")).toBe("765");
			expect($F(f5)(M.$2, "6", M.$1)("5")("7")).toBe("765");
			expect($F(f5)(M.$2, "6", M.$1)("5", "7")).toBe("765");
			expect($F(f5)(M.$2, M.$3, M.$1)("5")("7")("6")).toBe("765");
			expect($F(f5)(M.$2, M.$3, M.$1)("5", "7")("6")).toBe("765");
			expect($F(f5)(M.$2, M.$3, M.$1)("5")("7", "6")).toBe("765");
			expect($F(f5)(M.$2, M.$3, M.$1)("5", "7", "6")).toBe("765");
			expect($F(f5)(M.$3, M.$2, M.$1)("5")("6")("7")).toBe("765");
			expect($F(f5)(M.$1, "6")("7")("5")).toBe("765");
			expect($F(f5)(M.$3, M.$2, M.$1)(M.$2, "6", M.$1)("7")("5")).toBe("765");
			expect($F(f5)(M.$3, M.$2, M.$1)("5", M.$1)("6")("7")).toBe("765");
			expect($F(f5)(M.$3, M.$2, M.$1)("5", M.$1)("6", "7")).toBe("765");
			expect($F(f5)(M.$3, M.$2, M.$1)(M.$1, "6")("5", "7")).toBe("765");
			expect($F(f5)(M.$3, M.$2, M.$1)(M.$1, "6")("5")("7")).toBe("765");
			expect($F(f5)(M.$3, M.$2, M.$1)(M.$2, M.$1)("6", "5", "7")).toBe("765");
			expect($F(f5)(M.$3, M.$2, M.$1)(M.$2, M.$1)("6")("5")("7")).toBe("765");
			expect($F(f5)(M.$1, M.$3, M.$2)(M.$2, M.$1)("5")("7")("6")).toBe("765");
		});
		it("pipe", function () {
			expect($F(f1).pipe(f3)(7)(6)(5)).toBe(40);
			expect($F(f1).pipe(f3)(7, 6)(5)).toBe(40);
			expect($F(f1).pipe(f3)(7, 6, 5)).toBe(40);
			expect($F(f1).pipe(f3)(7)(6, 5)).toBe(40);
			expect($F(f1).pipe(f3)()(7)(6)(5)).toBe(40);
			expect($F(f1).pipe(f3)()()(7)(6)(5)).toBe(40);
			expect($F(f1).pipe(f3).pipe(f4)(7)(6)(5)).toBe(44);
			expect($F(f1).pipe(f3).pipe(f4)(7, 6)(5)).toBe(44);
			expect($F(f1).pipe(f3).pipe(f4)(7, 6, 5)).toBe(44);
			expect($F(f1).pipe(f3).pipe(f4)(7)(6, 5)).toBe(44);
			expect($F(f1).pipe(f3).pipe(f4)()(7)(6)(5)).toBe(44);
			expect($F(f1).pipe(f3).pipe(f4)()()(7)(6)(5)).toBe(44);
			expect($F(f2).pipe(f3)()).toBe(768);
			expect($F(f2).pipe(f3).pipe(f4)()).toBe(772);
			expect($F(f3).pipe(f3).pipe(f3)(4)).toBe(13);
			expect(function() { $F(f1).pipe(f2) }).toThrow();
			expect(function() { $F(f1).pipe(f1) }).toThrow();
			expect(function() { $F(f2).pipe(f2) }).toThrow();
			expect(function() { $F(f2).pipe(f1) }).toThrow();
			expect($F(f5).pipe(f3)("7")("6")("5")).toBe("7653");
			expect($F(f5).pipe(f3)("7", "6")("5")).toBe("7653");
			expect($F(f5).pipe(f3)("7", "6", "5")).toBe("7653");
			expect($F(f5).pipe(f3)("7")("6", "5")).toBe("7653");
			expect($F(f5).pipe(f3)()("7")("6")("5")).toBe("7653");
			expect($F(f5).pipe(f3)()()("7")("6")("5")).toBe("7653");
			expect($F(f1).pipe(f6).pipe(f7)(3)(4)(6)).toBe("2732");
			expect($F(f1).multiply(f6).multiply(f7)(3)(4)(6)).toBe("2732");
			expect(M.F(f1).pipe(M.F(f3))(7)(6)(5)).toBe(40);
		});
		it("apply", function () {
			expect($F(f5).apply(null, ["7", "6", "5"])).toBe("765");
			expect($F(f5).apply(null, ["7", "6"])("5")).toBe("765");
			expect($F(f5).apply(null, [M.$1, "6", M.$2])("7")("5")).toBe("765");
			expect($F(f8).apply({x: "7"}, ["6", "5"])).toBe("765");
			expect($F(f8).apply({x: "7"}, ["6"])("5")).toBe("765");
		});
		it("bind", function () {
			expect($F(f8).bind({x: "7"}).apply({x: "9"}, ["6", "5"])).toBe("765");
			expect($F(f8).bind({x: "7"}).apply({x: "9"}, ["6"])("5")).toBe("765");
		});
		it("call", function () {
			expect($F(f5).call(null, "7", "6", "5")).toBe("765");
			expect($F(f5).call(null, "7", "6")("5")).toBe("765");
			expect($F(f5).call(null, M.$1, "6", M.$2)("7")("5")).toBe("765");
			expect($F(f8).call({x: "7"}, "6", "5")).toBe("765");
			expect($F(f8).call({x: "7"}, "6")("5")).toBe("765");
		});
//		it("toString", function () {
//			expect($F(function() {}).toString()).toBe("function () {}");
//		});
		it("monoid rule", function () {
			expect(M.F.unit.multiply(M.F(f7))(3)).toBe("32");
			expect(M.F(f7).multiply(M.F.unit)(3)).toBe("32");
			expect(M.F(f1).multiply(M.F(f6).multiply(f7))(3)(4)(6)).toBe("2732");
			expect((M.F(f1).multiply(f6)).multiply(f7)(3)(4)(6)).toBe("2732");
		});
	});

	describe("testing do notation", function () {
		function fn(x) { return $L(x * 2, x * 3); }
		function fm(x) { return $L(x + 2, x + 3); }
		function fl(x) { return $L(x * 2); }
		it("do", function () {
			expect(M.tu($L(1, 2), fn, fm, fl).take()).toEqual([8, 10, 10, 12, 12, 14, 16, 18]);
			expect(M.faites($L(1, 2), fn, fm, fl).take()).toEqual([8, 10, 10, 12, 12, 14, 16, 18]);
			expect(M["do"]($L(1, 2), fn, fm, fl).take()).toEqual([8, 10, 10, 12, 12, 14, 16, 18]);
		});
	});
});
