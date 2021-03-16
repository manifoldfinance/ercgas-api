
import { BigNumber } from 'bignumber.js';
import { mapObj, roundUp2 } from 'lib';

export * from './ercgas';
export * from './eth-node';

export type GasPrice = BigNumber;

export interface GasPriceInfo {
  data: GasPrice,
  provider: string,
  errors: Error[]
}

export const gasPrice = (val: number | string) => new BigNumber(val);

export type TxSpeed = 'safeLow' | 'average' | 'fast' | 'fastest';
export const TX_SPEEDS: TxSpeed[] = ['safeLow', 'average', 'fast', 'fastest'];
export type GasPrices = { [key in TxSpeed]: GasPrice };
export type Factors = { [key in TxSpeed]: BigNumber };

export interface GasPricesInfo {
  data: GasPrices,
  provider: string,
}

export type GasPriceProvider = () => Promise<GasPricesInfo>;

export const multiply = (val: BigNumber, factors: Factors): GasPrices =>
  mapObj(factors, (k, x) => val.times(x));

export const getMultipliers = (values: GasPrices): Factors => {
  const avg = values.average;
  return mapObj(values, (k, x) => roundUp2(x.div(avg)));
};