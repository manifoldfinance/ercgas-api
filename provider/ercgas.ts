import fetch from 'cross-fetch';
import { pick, mapObj } from 'lib';
import { GasPrices, gasPrice, TX_SPEEDS, GasPriceProvider } from './index';

const PROVIDER_NAME = 'ercgas';

export interface ERCGasData {
  average: number;
  fast: number;
  fastest: number;
  safeLow: number;
}

// export async function fetchERCGasData(apiKey: string): Promise<ERCGasData> {
export async function fetchERCGasData(): Promise<ERCGasData> {
  const res = await fetch(`https://ercgas.org/api`);
  if (res.status !== 200) {
    throw new Error(res.statusText);
  }
  try {
    const data = await res.json();
    return pick(data, TX_SPEEDS);
  } catch (e) {
    throw new Error('Invalid server response: ' + e.message);
  }
}

export const convertERCGasData = (data: ERCGasData): GasPrices =>
  mapObj(data, (k, x) => gasPrice(x).times(100000000));

export function ercGasPricingProvider(): GasPriceProvider {
  return async () => ({ data: convertERCGasData(await fetchERCGasData()), provider: PROVIDER_NAME });
}

