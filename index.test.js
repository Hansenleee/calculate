const Calc = require('./dist/bundle')

test('adds 1 + 2 to equal 3', ()=> {
  expect(new Calc().plus(1).plus(2).val()).toBe(3);
});

test('mins 3 - 2 to equal 1', ()=> {
  expect(new Calc({ value: 3}).minus(2).val()).toBe(1);
});

test('multiple 3 * 2 to equal 6', ()=> {
  expect(new Calc({ value: 3}).multiple(2).val()).toBe(6);
}); 

test('divide 6 / 2 to equal 3', ()=> {
  expect(new Calc({ value: 6}).divide(2).val()).toBe(3);
});

test('divide 1 + 2 - 3 to equal 0', ()=> {
  expect(new Calc().formul('1+2-3').val()).toBe(0);
});