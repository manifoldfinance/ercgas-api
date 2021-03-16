 import BigNumber from 'bignumber.js';

export const pick = <T, K extends keyof T>(obj: T, ks: readonly K[]): Pick<T, K> =>
  ks.reduce((acc: Pick<T, K>, k: K) => {
    acc[k] = obj[k];
    return acc;
  }, {} as Pick<T, K>);

export const mapObj = <T, K extends keyof T, V extends Record<K, any>>(obj: T, fn: (k: K, x: any) => any) =>
  (Object.keys(obj) as Array<K>)
    .reduce((acc: V, k: K) => {
      acc[k] = fn(k, obj[k]);
      return acc;
    }, {} as V);

export function idInc() {
  let id = 1;
  return () => `${id++}`;
}

export const bn = (val: string | number, base?: number) => new BigNumber(val, base);

export function curry(fn: (...args: any[]) => any) {
  const argN = fn.length;
  return function(...args: any[]) {
    if (args.length < argN) {
      // @ts-expect-error: Ignore no implicit this
      return curry(fn.bind(this, ...args));
    }
    // @ts-expect-error: Ignore no implicit this
    return fn.call(this, ...args);
  };
}

export function tryNull<E, T>(fn: () => Promise<T>): Promise<T | null> {
  return fn().catch(_ => null);
}

export function untilSuccessOrNull<T>(tasks: (() => Promise<T | null>)[]): Promise<T | null> {
  return tasks.reduce<Promise<T | null>>(
    (prev: Promise<T | null>, cur: () => Promise<T | null>) =>
      prev.then(x => x ?? cur()).catch(_ => null),
    Promise.resolve(null),
  );
}

type PromiseErrors<T> = Promise<{ value?: T, errors: Error[] }>;

export function wrapErrors<T>(fn: () => Promise<T>, errs: Error[]): () => PromiseErrors<T> {
  return () => fn().then(value => ({ value, errors: [...errs] })).catch(err => ({ errors: [...errs, err] }));
}

export function untilSuccessWithErrors<T>(tasks: (() => Promise<T>)[]): PromiseErrors<T> {
  return tasks.reduce<PromiseErrors<T>>(
    (prev: PromiseErrors<T>, cur: () => Promise<T>) =>
      prev.then(({ value, errors }) => value ? { value, errors } : wrapErrors(cur, errors)()),
    Promise.resolve({ errors: [] }),
  );
}

export function roundUp2(val: BigNumber): BigNumber {
  return val.decimalPlaces(2, BigNumber.ROUND_UP);
}

export const waitFor = (millis: number, reason = 'Timeout') => <T, A extends any[] | any[]>(fn: (...a: A) => Promise<T>): (...args: A) => Promise<T> => async (...args: A) => Promise.race([fn(...args), new Promise<T>((res, rej) => {
  setTimeout(() => rej(new Error(reason)), millis);
})]);


export const cacheFor = (millis: number) => <T, A extends any[] | any[]>(fn: (...a: A) => Promise<T>): (...args: A) => Promise<T> => {
  const cache = new Map();
  return async function(...args: A) {
    const k = args.join('#');
    if (cache.has(k)) {
      return Promise.resolve(cache.get(k));
    }
    const ret = await fn(...args);
    cache.set(k, ret);
    setTimeout(() => {
      cache.delete(k);
    }, millis);
    return ret;
  };
};

export function flow<T1, T2, A extends any>(fn1: (a: A) => T1, fn2: (a1: T1) => T2): (a: A) => T2;
export function flow<T1, T2, T3, A extends any>(fn1: (a: A) => T1, fn2: (a1: T1) => T2, fn3: (a2: T2) => T3): (a: A) => T3;
export function flow<T1, T2, T3, T4, A extends any>(fn1: (a: A) => T1, fn2: (a1: T1) => T2, fn3: (a2: T2) => T3, fn4: (a3: T3) => T4): (a: A) => T4;


export function flow(...fns: ((a: any) => any)[]) {
  return (x: any) => fns.reduce((v, f) => f(v), x);
}

export const identity = <T extends any>(x: T): T => x;


export function asyncFlow<T1, T2, A extends any>(fn1: (a: A) => Promise<T1> | T1, fn2: (a1: T1) => Promise<T2> | T2): (a: A) => Promise<T2>;
export function asyncFlow<T1, T2, T3, A extends any>(fn1: (a: A) => Promise<T1> | T1, fn2: (a1: T1) => Promise<T2> | T2, fn3: (a2: T2) => Promise<T3> | T3): (a: A) => Promise<T3>;
export function asyncFlow<T1, T2, T3, T4, A extends any>(fn1: (a: A) => Promise<T1> | T1, fn2: (a1: T1) => Promise<T2> | T2, fn3: (a2: T2) => Promise<T3> | T3, fn4: (a3: T3) => Promise<T4> | T4): (a: A) => Promise<T4>;

export function asyncFlow(...fns: ((a: any) => Promise<any>)[]) {
  return (x: any) => fns.reduce((v, f) => Promise.resolve(v).then(f), Promise.resolve(x));
}
