 import { gasPriceEstimator, gasPriceSetter } from 'index';
import fetch from '@helpers/fetch';
import { gasPrice } from 'provider';
import { TxData } from 'ethereum-types';
import { GasHelperConfig } from 'index';
import { timeout } from '@helpers/timeout';

const config: GasHelperConfig = {
  gasStationApiKey: 'test',
  ethNodeUrl: 'http://ethnode',
  cacheTimeout: 400,
  gasPriceLimit: 100,
  providerTimeout: 200,
};

afterEach(() => {
  fetch.reset();
});

test('estimate the gas price', async () => {
  fetch.mock('https://ethgasstation.info/api/ethgasAPI.json?api-key=test',
    _ => Promise.resolve({
      status: 200,
      body: '{"fast":910,"fastest":1000,"safeLow":820,"average":890,"block_time":14.5,"blockNum":10847268,"speed":0.8971149948865037,"safeLowWait":14.4,"avgWait":3.5,"fastWait":0.5,"fastestWait":0.5,"gasPriceRange":{"4":241.7,"6":241.7,"8":241.7,"10":241.7,"20":241.7,"30":241.7,"40":241.7,"50":241.7,"60":241.7,"70":241.7,"80":241.7,"90":241.7,"100":241.7,"110":241.7,"120":241.7,"130":241.7,"140":241.7,"150":241.7,"160":241.7,"170":241.7,"180":241.7,"190":241.7,"200":241.7,"220":241.7,"240":241.7,"260":241.7,"280":241.7,"300":241.7,"320":241.7,"340":241.7,"360":241.7,"380":241.7,"400":241.7,"420":241.7,"440":241.7,"460":241.7,"480":241.7,"500":241.7,"520":241.7,"540":241.7,"560":241.7,"580":241.7,"600":241.7,"620":241.7,"640":241.7,"660":241.7,"680":241.7,"700":241.7,"720":241.7,"740":241.7,"760":241.7,"780":241.7,"800":241.7,"820":14.4,"840":6,"860":4.8,"880":4.1,"890":3.5,"900":1.1,"910":0.5,"920":0.5,"940":0.5,"960":0.5,"980":0.5,"1000":0.5}}',
    }));
  const estimate = gasPriceEstimator(config);
  const average = await estimate('average');
  const fast = await estimate('fast');
  const fastest = await estimate('fastest');
  const safeLow = await estimate('safeLow');
  expect(average.errors).toBeEmpty();
  expect(average.provider).toEqual('ethgasstation');
  expect(average.data).toEqual(gasPrice(89000000000));
  expect(fast.data).toEqual(gasPrice(91000000000));
  expect(fastest.data).toEqual(gasPrice(100000000000));
  expect(safeLow.data).toEqual(gasPrice(82000000000));
});


test('estimate the gas price when gas station fails', async () => {
  fetch.get(/^https:\/\/ethgasstation\.info\/api\/ethgasAPI\.json\?api-key=.*$/,
    500);
  fetch.post('http://ethnode', { 'jsonrpc': '2.0', 'id': 1, 'result': '0x1f6ea08600' });

  const estimate = gasPriceEstimator(config);
  const average = await estimate('average');
  const fast = await estimate('fast');
  const fastest = await estimate('fastest');
  const safeLow = await estimate('safeLow');
  expect(average.errors).toEqual([new Error('Internal Server Error')]);
  expect(average.provider).toEqual('eth-node');
  expect(average.data).toEqual(gasPrice(135000000000));
  expect(fast.data).toEqual(gasPrice(148500000000));
  expect(fastest.data).toEqual(gasPrice(162000000000));
  expect(safeLow.data).toEqual(gasPrice(135000000000));
});

test('set the gas price on a tx', async () => {
  fetch.mock(/^https:\/\/ethgasstation.info\/api\/ethgasAPI\.json\?api-key=.*$/,
    req => Promise.resolve({
      status: 200,
      body: '{"fast":910,"fastest":1000,"safeLow":820,"average":890,"block_time":14.5,"blockNum":10847268,"speed":0.8971149948865037,"safeLowWait":14.4,"avgWait":3.5,"fastWait":0.5,"fastestWait":0.5,"gasPriceRange":{"4":241.7,"6":241.7,"8":241.7,"10":241.7,"20":241.7,"30":241.7,"40":241.7,"50":241.7,"60":241.7,"70":241.7,"80":241.7,"90":241.7,"100":241.7,"110":241.7,"120":241.7,"130":241.7,"140":241.7,"150":241.7,"160":241.7,"170":241.7,"180":241.7,"190":241.7,"200":241.7,"220":241.7,"240":241.7,"260":241.7,"280":241.7,"300":241.7,"320":241.7,"340":241.7,"360":241.7,"380":241.7,"400":241.7,"420":241.7,"440":241.7,"460":241.7,"480":241.7,"500":241.7,"520":241.7,"540":241.7,"560":241.7,"580":241.7,"600":241.7,"620":241.7,"640":241.7,"660":241.7,"680":241.7,"700":241.7,"720":241.7,"740":241.7,"760":241.7,"780":241.7,"800":241.7,"820":14.4,"840":6,"860":4.8,"880":4.1,"890":3.5,"900":1.1,"910":0.5,"920":0.5,"940":0.5,"960":0.5,"980":0.5,"1000":0.5}}',
    }));
  const setter = gasPriceSetter(config);
  const tx: TxData = {
    from: 'xxx',
    gasPrice: 0,
    gas: 100,
    nonce: 42,
    value: 10000,
    data: 'fffff',
  };
  const average = await setter('average', tx);
  const fast = await setter('fast', tx);
  const fastest = await setter('fastest', tx);
  const safeLow = await setter('safeLow', tx);

  expect(average.gasPrice).toEqual(gasPrice(89000000000));
  expect(fast.gasPrice).toEqual(gasPrice(91000000000));
  expect(fastest.gasPrice).toEqual(gasPrice(100000000000));
  expect(safeLow.gasPrice).toEqual(gasPrice(82000000000));

  const eqProps = (x: TxData, y: TxData) => (Object.keys(x) as (keyof TxData)[])
    .every((k: keyof TxData) => k === 'gasPrice' || x[k] === y[k]);

  const expectEqProps = (x: TxData, y: TxData) => expect(eqProps(x, y)).toBeTrue();

  expectEqProps(average, tx);
  expectEqProps(fast, tx);
  expectEqProps(fastest, tx);
  expectEqProps(safeLow, tx);

});


test('estimate the gas price when providers time out', async () => {
  fetch.get(/^https:\/\/ethgasstation\.info\/api\/ethgasAPI\.json\?api-key=.*$/,
    () => timeout(300, { safeLow: 1000, average: 1000, fast: 2000, fastest: 2100 }));
  fetch.post('http://ethnode', () => timeout(300, { 'jsonrpc': '2.0', 'id': 1, 'result': '0x1f6ea08600' }));

  const estimate = gasPriceEstimator(config);
  await expect(async () => estimate('average')).rejects.toEqual(new Error('Provider timeout, Provider timeout'));
});

test('estimate the gas price when providers timeout', async () => {
  fetch.get(/^https:\/\/ethgasstation\.info\/api\/ethgasAPI\.json\?api-key=.*$/,
    500);
  fetch.post('http://ethnode', () => timeout(300, { 'jsonrpc': '2.0', 'id': 1, 'result': '0x1f6ea08600' }));

  const estimate = gasPriceEstimator(config);
  await expect(async () => estimate('average')).rejects.toEqual(new Error('Internal Server Error, Provider timeout'));
});

test('cached estimate', async () => {
  fetch.get(/^https:\/\/ethgasstation.info\/api\/ethgasAPI\.json\?api-key=.*$/,
    req => Promise.resolve({
      status: 200,
      body: '{"fast":910,"fastest":1000,"safeLow":820,"average":890,"block_time":14.5,"blockNum":10847268,"speed":0.8971149948865037,"safeLowWait":14.4,"avgWait":3.5,"fastWait":0.5,"fastestWait":0.5,"gasPriceRange":{"4":241.7,"6":241.7,"8":241.7,"10":241.7,"20":241.7,"30":241.7,"40":241.7,"50":241.7,"60":241.7,"70":241.7,"80":241.7,"90":241.7,"100":241.7,"110":241.7,"120":241.7,"130":241.7,"140":241.7,"150":241.7,"160":241.7,"170":241.7,"180":241.7,"190":241.7,"200":241.7,"220":241.7,"240":241.7,"260":241.7,"280":241.7,"300":241.7,"320":241.7,"340":241.7,"360":241.7,"380":241.7,"400":241.7,"420":241.7,"440":241.7,"460":241.7,"480":241.7,"500":241.7,"520":241.7,"540":241.7,"560":241.7,"580":241.7,"600":241.7,"620":241.7,"640":241.7,"660":241.7,"680":241.7,"700":241.7,"720":241.7,"740":241.7,"760":241.7,"780":241.7,"800":241.7,"820":14.4,"840":6,"860":4.8,"880":4.1,"890":3.5,"900":1.1,"910":0.5,"920":0.5,"940":0.5,"960":0.5,"980":0.5,"1000":0.5}}',
    }), { overwriteRoutes: true, repeat: 1 });

  const estimate = gasPriceEstimator(config);
  let average = await estimate('average');
  expect(fetch.calls().length).toEqual(1);
  const fast = await estimate('fast');
  expect(fetch.calls().length).toEqual(1);
  const fastest = await estimate('fastest');
  expect(fetch.calls().length).toEqual(1);
  const safeLow = await estimate('safeLow');
  expect(fetch.calls().length).toEqual(1);
  expect(average.data).toEqual(gasPrice(89000000000));
  expect(fast.data).toEqual(gasPrice(91000000000));
  expect(fastest.data).toEqual(gasPrice(100000000000));
  expect(safeLow.data).toEqual(gasPrice(82000000000));

  fetch.get(/^https:\/\/ethgasstation.info\/api\/ethgasAPI\.json\?api-key=.*$/,
    req => Promise.resolve({
      status: 200,
      body: '{"fast":910,"fastest":1000,"safeLow":820,"average":790,"block_time":14.5,"blockNum":10847268,"speed":0.8971149948865037,"safeLowWait":14.4,"avgWait":3.5,"fastWait":0.5,"fastestWait":0.5,"gasPriceRange":{"4":241.7,"6":241.7,"8":241.7,"10":241.7,"20":241.7,"30":241.7,"40":241.7,"50":241.7,"60":241.7,"70":241.7,"80":241.7,"90":241.7,"100":241.7,"110":241.7,"120":241.7,"130":241.7,"140":241.7,"150":241.7,"160":241.7,"170":241.7,"180":241.7,"190":241.7,"200":241.7,"220":241.7,"240":241.7,"260":241.7,"280":241.7,"300":241.7,"320":241.7,"340":241.7,"360":241.7,"380":241.7,"400":241.7,"420":241.7,"440":241.7,"460":241.7,"480":241.7,"500":241.7,"520":241.7,"540":241.7,"560":241.7,"580":241.7,"600":241.7,"620":241.7,"640":241.7,"660":241.7,"680":241.7,"700":241.7,"720":241.7,"740":241.7,"760":241.7,"780":241.7,"800":241.7,"820":14.4,"840":6,"860":4.8,"880":4.1,"890":3.5,"900":1.1,"910":0.5,"920":0.5,"940":0.5,"960":0.5,"980":0.5,"1000":0.5}}',
    }), { overwriteRoutes: true });

  average = await estimate('average');
  expect(average.data).toEqual(gasPrice(89000000000));
  expect(fetch.calls().length).toEqual(1);

  await timeout(500);
  average = await estimate('average');
  expect(average.data).toEqual(gasPrice(79000000000));
  expect(fetch.calls().length).toEqual(2);
});
