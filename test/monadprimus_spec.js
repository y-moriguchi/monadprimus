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
			expect($L(1, 2)(0)).toBe(1);
			expect($L(1, 2)(1)).toBe(2);
			expect($L(1, 2)(2)).toBe(undefined);
			expect(M.Nil(0)).toBe(undefined);
			expect(M.L.N(1)(0)).toBe(1);
			expect(M.L.N(1)(100)).toBe(101);
			expect(function() { $L(1, 2)(-1) }).toThrow();
			expect(function() { $L(1, 2)(9007199254740992) }).toThrow();
			expect(function() { M.Nil(-1) }).toThrow();
			expect(function() { M.Nil(9007199254740992) }).toThrow();
		});
		it("bind", function () {
			expect($L(1, 2).bind(fn).take()).toEqual([2, 3, 4, 6]);
			expect($L(1, 2).bind(fl).take()).toEqual([2, 4]);
			expect(M.Nil.bind(fn).take()).toEqual([]);
			expect($L(1, 2).bind(fnil).take()).toEqual([]);
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
	});

	describe("testing State", function () {
		function fn(x) { return M.State(function(s) { return $T(s + 2, s * 2) }); }
		function fm(x) { return M.State(function(s) { return $T(s + 3, s * 3) }); }
		it("bind", function () {
			expect(M.State.unit(3).bind(fn).runState(4).toArray()).toEqual([6, 8]);
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
		it("compose", function () {
			expect($F(f1).compose(f3)(7)(6)(5)).toBe(40);
			expect($F(f1).compose(f3)(7, 6)(5)).toBe(40);
			expect($F(f1).compose(f3)(7, 6, 5)).toBe(40);
			expect($F(f1).compose(f3)(7)(6, 5)).toBe(40);
			expect($F(f1).compose(f3)()(7)(6)(5)).toBe(40);
			expect($F(f1).compose(f3)()()(7)(6)(5)).toBe(40);
			expect($F(f1).compose(f3).compose(f4)(7)(6)(5)).toBe(44);
			expect($F(f1).compose(f3).compose(f4)(7, 6)(5)).toBe(44);
			expect($F(f1).compose(f3).compose(f4)(7, 6, 5)).toBe(44);
			expect($F(f1).compose(f3).compose(f4)(7)(6, 5)).toBe(44);
			expect($F(f1).compose(f3).compose(f4)()(7)(6)(5)).toBe(44);
			expect($F(f1).compose(f3).compose(f4)()()(7)(6)(5)).toBe(44);
			expect($F(f2).compose(f3)()).toBe(768);
			expect($F(f2).compose(f3).compose(f4)()).toBe(772);
			expect($F(f3).compose(f3).compose(f3)(4)).toBe(13);
			expect(function() { $F(f1).compose(f2) }).toThrow();
			expect(function() { $F(f1).compose(f1) }).toThrow();
			expect(function() { $F(f2).compose(f2) }).toThrow();
			expect(function() { $F(f2).compose(f1) }).toThrow();
			expect($F(f5).compose(f3)("7")("6")("5")).toBe("7653");
			expect($F(f5).compose(f3)("7", "6")("5")).toBe("7653");
			expect($F(f5).compose(f3)("7", "6", "5")).toBe("7653");
			expect($F(f5).compose(f3)("7")("6", "5")).toBe("7653");
			expect($F(f5).compose(f3)()("7")("6")("5")).toBe("7653");
			expect($F(f5).compose(f3)()()("7")("6")("5")).toBe("7653");
		});
	});
});
