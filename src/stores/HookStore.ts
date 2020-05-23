import * as Models from '@models'
import * as API from '@lib/request'
import { useObject, composeContainer, useVisible } from '@lib/hook'
import { jsBridge } from '@lib/jsBridge'
import { setLocalStorageItem, partition, to } from '@lib/helper'
import { useI18n } from '@i18n'
import { AxiosError } from 'axios'

function useData () {
    const [data, set] = useObject<Models.Data>({
        version: '',
        general: {},
        proxy: [],
        proxyGroup: [],
        proxyProviders: [],
        rules: [],
        proxyMap: new Map<string, API.Proxy>()
    })

    const { visible, show, hide } = useVisible()

    async function fetch () {
        const [resp, err] = await to(Promise.all([API.getConfig(), API.getProxies(), API.getRules(), API.getProxyProviders()]))
        const rErr = err as AxiosError
        if (rErr && (!rErr.response || rErr.response.status === 401)) {
            show()
        }

        const [{ data: general }, rawProxies, rules, proxyProviders] = resp

        set('general', {
            port: general.port,
            socksPort: general['socks-port'],
            redirPort: general['redir-port'],
            mode: general.mode,
            logLevel: general['log-level'],
            allowLan: general['allow-lan']
        })

        const policyGroup = new Set(['Selector', 'URLTest', 'Fallback', 'LoadBalance'])
        const unUsedProxy = new Set(['DIRECT', 'REJECT', 'GLOBAL'])
        const proxyList = rawProxies.data.proxies.GLOBAL as API.Group
        // fix missing name
        proxyList.name = 'GLOBAL'
        const proxies = proxyList.all
            .filter(key => !unUsedProxy.has(key))
            .map(key => ({ ...rawProxies.data.proxies[key], name: key }))
        const [proxy, groups] = partition(proxies, proxy => !policyGroup.has(proxy.type))

        const providers = Object.keys(proxyProviders.data.providers)
            .map<API.Provider>(name => proxyProviders.data.providers[name])
            .filter(pd => pd.name !== 'default')
            .filter(pd => pd.vehicleType !== 'Compatible')

        const proxyMap = new Map<string, API.Proxy>()
        for (const p of proxy) {
            proxyMap.set(p.name, p as API.Proxy)
        }

        for (const provider of providers) {
            for (const p of provider.proxies) {
                proxyMap.set(p.name, p as API.Proxy)
            }
        }

        set({
            proxy: proxy as API.Proxy[],
            proxyGroup: general.mode === 'Global' ? [proxyList] : groups as API.Group[],
            proxyProviders: providers,
            rules: rules.data.rules,
            proxyMap
        })

        const [version, vErr] = await to(API.getVersion())
        if (vErr) {
            return
        }

        set('version', version.data.version)
    }

    function updateDelay (proxy: string, delay: number) {
        set(draft => {
            const p = draft.proxy.find(p => p.name === proxy)
            if (p) {
                p.history.push({ time: Date.now().toString(), delay })
            }
        })
    }

    return { data, fetch, unauthorized: { visible, show, hide }, updateDelay }
}

function useAPIInfo () {
    const [data, set] = useObject<Models.APIInfo>({
        protocol: 'http:',
        hostname: '127.0.0.1',
        port: '9090',
        secret: ''
    })

    async function fetch () {
        const info = await API.getExternalControllerConfig()
        set({ ...info })
    }

    async function update (info: Models.APIInfo) {
        const { protocol, hostname, port, secret } = info
        setLocalStorageItem('externalControllerProtocol', protocol)
        setLocalStorageItem('externalControllerAddr', hostname)
        setLocalStorageItem('externalControllerPort', port)
        setLocalStorageItem('secret', secret)
        window.location.reload()
    }

    return { data, fetch, update }
}

function useConfig () {
    const [data, set] = useObject({
        breakConnections: false
    })

    return { data, set }
}

function useClashXData () {
    const [data, set] = useObject<Models.ClashXData>({
        startAtLogin: false,
        systemProxy: false
    })

    async function fetch () {
        const startAtLogin = await jsBridge.getStartAtLogin()
        const systemProxy = await jsBridge.isSystemProxySet()

        set({ startAtLogin, systemProxy })
    }

    return { data, fetch }
}

const { Provider, containers } = composeContainer({
    useData,
    useAPIInfo,
    useClashXData,
    useI18n,
    useConfig
})

export { Provider, containers }
