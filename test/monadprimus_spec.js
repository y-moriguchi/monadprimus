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
	});
});
