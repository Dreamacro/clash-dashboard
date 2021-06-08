export function getLocalStorageItem (key: string, defaultValue = '') {
    return window.localStorage.getItem(key) || defaultValue
}

export function setLocalStorageItem (key: string, value: string) {
    return window.localStorage.setItem(key, value)
}

export function removeLocalStorageItem (key: string) {
    return window.localStorage.removeItem(key)
}

export function noop () {}

export function getSearchParam(key: string) {
    return new URLSearchParams(window.location.search).get(key)
}

/**
 * to return Promise<[T, Error]>
 * @param {Promise<T>} promise
 */
export async function to <T, E = Error> (promise: Promise<T>): Promise<[T, E]> {
    try {
        const ret = await promise
        return [ret, null as unknown as E]
    } catch (e) {
        return [null as unknown as T, e]
    }
}

export function partition<T> (arr: T[], fn: (arg: T) => boolean): [T[], T[]] {
    const left: T[] = []
    const right: T[] = []
    for (const item of arr) {
        fn(item) ? left.push(item) : right.push(item)
    }
    return [left, right]
}
