 import { gasPrice, getMultipliers } from 'provider';


test('getMultipliers', () => {
  const prices = {
    safeLow: gasPrice(100000000000),
    average: gasPrice(115000000000),
    fast: gasPrice(261000000000),
    fastest: gasPrice(280000000000),
  };

  const factors = getMultipliers(prices);
  expect(factors.safeLow.toNumber()).toEqual(0.87);
  expect(factors.average.toNumber()).toEqual(1);
  expect(factors.fast.toNumber()).toEqual(2.27);
  expect(factors.fastest.toNumber()).toEqual(2.44);
});
