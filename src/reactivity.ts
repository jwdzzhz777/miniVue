import { isObject } from './helper';

// 暂存已经代理过的对象
const primitiveToReactive = new WeakMap();

const handler: ProxyHandler<object> = {
    get(target: object, key: string | symbol) {
        track(target, key);
        let result = Reflect.get(target, key);
        return isObject(result) ? reactive(result) : result;
    },
    set(target: object, key: string | symbol, value: unknown) {
        Reflect.set(target, key, value);
        trigger(target, key);
        return true;
    }
};

export const ref = function(value: any) {
    if (isObject(value)) {
        if ('isRef' in value) return value;
        else return;
    }

    let result = Object.create(Object.prototype, {
        isRef: { value: true },
        value: {
            get() {
                track(result, 'value');
                return value;
            },
            set(newValue) {
                value = newValue;
                trigger(result, 'value');
            }
        }
    });
    return result;
}

export const reactive = function(target: object) {
    if (!isObject(target)) return target;
    if (primitiveToReactive.has(target)) return primitiveToReactive.get(target);

    let observed = new Proxy(target, handler);

    primitiveToReactive.set(target, observed);
    return observed;
}

type Dep = Set<ReactiveEffect>
type KeyMap = Map<any, Dep>
const targetMap = new WeakMap<any, KeyMap>();

const track = function(target: object, key: string | symbol) {
    if (activeEffect === undefined) return;

    let keyMap = targetMap.get(target);
    if (!keyMap) targetMap.set(target, (keyMap = new Map()));

    let depsOfKey = keyMap.get(key);
    if (!depsOfKey) keyMap.set(key, (depsOfKey = new Set()));

    if (!depsOfKey.has(activeEffect)) depsOfKey.add(activeEffect);
}

const trigger = function(target: object, key: string | symbol) {
    let keyMap = targetMap.get(target);
    if (!keyMap) return;
    let deps = keyMap.get(key);
    if (!deps) return;
    deps.forEach((effect: ReactiveEffect) => {
        effect();
    });
}

interface ReactiveEffect<T = any> {
    (...args: any[]): T
    _isEffect: true
    deps: Array<Dep>
}

let activeEffect: ReactiveEffect | undefined;

export const effect = function<T = any>(fn: (...args: any[]) => T): ReactiveEffect<T> {
    const effect = function(...args: any[]) {
        try {
            activeEffect = effect;
            return fn(...args);
          } finally {
            activeEffect = undefined;
          }
    } as ReactiveEffect

    effect._isEffect = true;
    effect.deps = new Array<Dep>(); // 暂时用不到它

    effect();

    return effect;
}

