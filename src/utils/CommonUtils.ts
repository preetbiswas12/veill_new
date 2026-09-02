export class CommonUtils {
  static clone<T extends any>(arg: T): T {
    if (typeof arg !== 'object' || !arg) {
      return arg;
    }
    let res;
    if (Array.isArray(arg)) {
      res = [];
      for (const value of arg) {
        res.push(CommonUtils.clone(value));
      }
      return res as T;
    } else {
      res = {};
      const descriptor = Object.getOwnPropertyDescriptors(arg);
      for (const k of Reflect.ownKeys(descriptor)) {
        const curDescriptor = descriptor[k as any];
        if (curDescriptor.hasOwnProperty('value')) {
          Object.defineProperty(res, k, {
            ...curDescriptor,
            value: CommonUtils.clone(curDescriptor['value']),
          });
        } else {
          Object.defineProperty(res, k, curDescriptor);
        }
      }
      Object.setPrototypeOf(res, Object.getPrototypeOf(arg));
    }
    return res as T;
  }
}

// @ts-nocheck

