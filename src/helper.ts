interface ArrayLike {
    [index: number]: any,
    length: number
}

export function isObject(target: unknown) {
    return target !== null && typeof target === 'object';
}

export function toArray(arr: ArrayLike) {
    return Array.prototype.slice.call(arr);
}