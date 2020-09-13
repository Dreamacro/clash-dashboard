import { atom, useRecoilState, selector } from 'recoil'
import get from 'lodash/get'
import { useCallback, useEffect } from 'react'
import { AxiosError } from 'axios'
import swr from 'swr'

import { getLanguage, setLanguage, Lang, locales, Language } from '@i18n'
import { useRecoilObjectWithImmer } from '@lib/recoil'
import * as API from '@lib/request'
import { setLocalStorageItem, partition, to } from '@lib/helper'
import { jsBridge, isClashX } from '@lib/jsBridge'
import * as Models from '@models'

const identity = atom({
    key: 'identity',
    default: true
})

type AsyncFunction<A, O> = (...args: A[]) => Promise<O>

export function useIdentity () {
    const [id, set] = useRecoilState(identity)

    function wrapFetcher<A, O> (fn: AsyncFunction<A, O>) {
        return async function (...args: A[]) {
            const [resp, err] = await to(fn(...args))
            const rErr = err as AxiosError
            if (rErr && (!rErr.response || rErr.response.status === 401)) {
                set(false)
                throw err
            }
            set(true)
            return resp
        }
    }

    return { identity: id, wrapFetcher, set }
}

const language = atom({
    key: 'i18n',
    default: getLanguage()
})

export function useI18n () {
    const [lang, set] = useRecoilState(language)

    function setLang (lang: Lang) {
        set(lang)
        setLanguage(lang)
    }

    const useTranslation = useCallback(
        function (namespace: string) {
            function t (path: string) {
                return get(Language[lang][namespace], path) as string
            }
            return { t }
        },
        [lang]
    )

    return { lang, locales, setLang, useTranslation }
}

export const version = atom({
    key: 'version',
    default: {
        version: '',
        premium: false
    }
})

export function useVersion () {
    const [data, set] = useRecoilState(version)
    const { set: setIdentity } = useIdentity()

    async function update () {
        const [resp, err] = await to(API.getVersion())
        setIdentity(!err)

        set(
            err
                ? { version: '', premium: false }
                : { version: resp.data.version, premium: !!resp.data.premium }
        )
    }

    return { version: data.version, premium: data.premium, update }
}

export const config = atom({
    key: 'config',
    default: {
        breakConnections: false
    }
})

export function useConfig () {
    const [data, set] = useRecoilObjectWithImmer(config)

    return { data, set }
}

export const proxyProvider = atom({
    key: 'proxyProvider',
    default: [] as API.Provider[]
})

export function useProxyProviders () {
    const [providers, set] = useRecoilState(proxyProvider)

    const { data, mutate } = swr('/providers/proxy', async () => {
        const proxyProviders = await API.getProxyProviders()

        return Object.keys(proxyProviders.data.providers)
            .map<API.Provider>(name => proxyProviders.data.providers[name])
            .filter(pd => pd.name !== 'default')
            .filter(pd => pd.vehicleType !== 'Compatible')
    })

    useEffect(() => set(data ?? []), [data, set])
    return { providers, update: mutate }
}

export function useRuleProviders () {
    const [{ premium }] = useRecoilState(version)

    const { data, mutate } = swr('/providers/rule', async () => {
        if (!premium) {
            return []
        }

        const ruleProviders = await API.getRuleProviders()

        return Object.keys(ruleProviders.data.providers)
            .map<API.RuleProvider>(name => ruleProviders.data.providers[name])
    })

    return { providers: data ?? [], update: mutate }
}

export function useGeneral () {
    const { data, mutate } = swr('/config', async () => {
        const resp = await API.getConfig()
        const data = resp.data
        return {
            port: data.port,
            socksPort: data['socks-port'],
            mixedPort: data['mixed-port'] ?? 0,
            redirPort: data['redir-port'],
            mode: data.mode.toLowerCase() as Models.Data['general']['mode'],
            logLevel: data['log-level'],
            allowLan: data['allow-lan']
        } as Models.Data['general']
    })

    return { general: data ?? {} as Models.Data['general'], update: mutate }
}

export const proxies = atom({
    key: 'proxies',
    default: {
        proxies: [] as API.Proxy[],
        groups: [] as API.Group[],
        global: {} as API.Group
    }
})

export function useProxy () {
    const [allProxy, set] = useRecoilObjectWithImmer(proxies)

    const { mutate } = swr(['/proxies', set], async () => {
        const allProxies = await API.getProxies()

        const global = allProxies.data.proxies.GLOBAL as API.Group
        // fix missing name
        global.name = 'GLOBAL'

        const policyGroup = new Set(['Selector', 'URLTest', 'Fallback', 'LoadBalance'])
        const unUsedProxy = new Set(['DIRECT', 'REJECT', 'GLOBAL'])
        const proxies = global.all
            .filter(key => !unUsedProxy.has(key))
            .map(key => ({ ...allProxies.data.proxies[key], name: key }))
        const [proxy, groups] = partition(proxies, proxy => !policyGroup.has(proxy.type))
        set({ proxies: proxy as API.Proxy[], groups: groups as API.Group[], global: global })
    })

    const markProxySelected = useCallback((name: string, selected: string) => {
        set(draft => {
            for (const group of draft.groups) {
                if (group.name === name) {
                    group.now = selected
                }
            }
        })
    }, [set])

    return {
        proxies: allProxy.proxies,
        groups: allProxy.groups,
        global: allProxy.global,
        update: mutate,
        markProxySelected,
        set
    }
}

export const proxyMapping = selector({
    key: 'proxyMapping',
    get: ({ get }) => {
        const ps = get(proxies)
        const providers = get(proxyProvider)
        const proxyMap = new Map<string, API.Proxy>()
        for (const p of ps.proxies) {
            proxyMap.set(p.name, p as API.Proxy)
        }

        for (const provider of providers) {
            for (const p of provider.proxies) {
                proxyMap.set(p.name, p as API.Proxy)
            }
        }

        return proxyMap
    }
})

export function useClashXData () {
    const { data, mutate } = swr('/clashx', async () => {
        if (!isClashX()) {
            return {
                isClashX: false,
                startAtLogin: false,
                systemProxy: false
            }
        }

        const startAtLogin = await jsBridge?.getStartAtLogin() ?? false
        const systemProxy = await jsBridge?.isSystemProxySet() ?? false

        return { startAtLogin, systemProxy, isClashX: true }
    })

    return { data, update: mutate }
}

export const apiData = atom({
    key: 'apiData',
    default: isClashX() ? {
        hostname: '127.0.0.1',
        port: '9090',
        secret: '',
        path: '',
        protocol: ''
    } : {
        hostname: location.hostname,
        port: location.port,
        secret: '',
        path: location.pathname,
        protocol: location.protocol
    }
})

export function useAPIInfo () {
    const [data, set] = useRecoilState(apiData)

    async function fetch () {
        const info = await API.getExternalControllerConfig()
        set({ ...info })
    }

    async function update (info: typeof data) {
        const { hostname, port, secret, path, protocol } = info
        setLocalStorageItem('externalControllerAddr', hostname)
        setLocalStorageItem('externalControllerPort', port)
        setLocalStorageItem('secret', secret)
        setLocalStorageItem('path', path)
        setLocalStorageItem('protocol', protocol)
        window.location.reload()
    }

    return { data, fetch, update }
}

export const rules = atom({
    key: 'rules',
    default: [] as API.Rule[]
})

export function useRule () {
    const [data, set] = useRecoilObjectWithImmer(rules)

    async function update () {
        const resp = await API.getRules()
        set(resp.data.rules)
    }

    return { rules: data, update }
}
