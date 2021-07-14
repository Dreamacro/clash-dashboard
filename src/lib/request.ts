import axios, { AxiosInstance } from 'axios'

export interface Config {
    port: number
    'socks-port': number
    'redir-port': number
    'mixed-port': number
    'allow-lan': boolean
    mode: string
    'log-level': string
}

export interface Rules {
    rules: Rule[]
}

export interface Rule {
    type: string
    payload: string
    proxy: string
}

export interface Proxies {
    proxies: Record<string, Proxy | Group>
}

export interface Provider {
    name: string
    proxies: Array<Group | Proxy>
    type: 'Proxy'
    vehicleType: 'HTTP' | 'File' | 'Compatible'
    updatedAt?: string
}

export interface RuleProvider {
    name: string
    type: 'Rule'
    vehicleType: 'HTTP' | 'File'
    behavior: string
    ruleCount: number
    updatedAt?: string
}

export interface RuleProviders {
    providers: Record<string, RuleProvider>
}

export interface ProxyProviders {
    providers: Record<string, Provider>
}

interface History {
    time: string
    delay: number
}

export interface Proxy {
    name: string
    type: 'Direct' | 'Reject' | 'Shadowsocks' | 'Vmess' | 'Socks' | 'Http' | 'Snell'
    history: History[]
}

export interface Group {
    name: string
    type: 'Selector' | 'URLTest' | 'Fallback'
    now: string
    all: string[]
    history: History[]
}

export interface Snapshot {
    uploadTotal: number
    downloadTotal: number
    connections: Connections[]
}

export interface Connections {
    id: string
    metadata: {
        network: string
        type: string
        host: string
        sourceIP: string
        sourcePort: string
        destinationPort: string
        destinationIP?: string
        processName: string
    }
    upload: number
    download: number
    start: string
    chains: string[]
    rule: string
    rulePayload: string
}

export class Client {
    private readonly axiosClient: AxiosInstance
    constructor (url: string, secret?: string) {
        this.axiosClient = axios.create({
            baseURL: url,
            headers: secret ? { Authorization: `Bearer ${secret}` } : {},
        })
    }

    async getConfig () {
        return await this.axiosClient.get<Config>('configs')
    }

    async updateConfig (config: Partial<Config>) {
        return await this.axiosClient.patch<void>('configs', config)
    }

    async getRules () {
        return await this.axiosClient.get<Rules>('rules')
    }

    async getProxyProviders () {
        const resp = await this.axiosClient.get<ProxyProviders>('providers/proxies', {
            validateStatus (status) {
                // compatible old version
                return (status >= 200 && status < 300) || status === 404
            },
        })
        if (resp.status === 404) {
            resp.data = { providers: {} }
        }
        return resp
    }

    async getRuleProviders () {
        return await this.axiosClient.get<RuleProviders>('providers/rules')
    }

    async updateProvider (name: string) {
        return await this.axiosClient.put<void>(`providers/proxies/${encodeURIComponent(name)}`)
    }

    async updateRuleProvider (name: string) {
        return await this.axiosClient.put<void>(`providers/rules/${encodeURIComponent(name)}`)
    }

    async healthCheckProvider (name: string) {
        return await this.axiosClient.get<void>(`providers/proxies/${encodeURIComponent(name)}/healthcheck`)
    }

    async getProxies () {
        return await this.axiosClient.get<Proxies>('proxies')
    }

    async getProxy (name: string) {
        return await this.axiosClient.get<Proxy>(`proxies/${encodeURIComponent(name)}`)
    }

    async getVersion () {
        return await this.axiosClient.get<{ version: string, premium?: boolean }>('version')
    }

    async getProxyDelay (name: string) {
        return await this.axiosClient.get<{ delay: number }>(`proxies/${encodeURIComponent(name)}/delay`, {
            params: {
                timeout: 5000,
                url: 'http://www.gstatic.com/generate_204',
            },
        })
    }

    async closeAllConnections () {
        return await this.axiosClient.delete('connections')
    }

    async closeConnection (id: string) {
        return await this.axiosClient.delete(`connections/${id}`)
    }

    async getConnections () {
        return await this.axiosClient.get<Snapshot>('connections')
    }

    async changeProxySelected (name: string, select: string) {
        return await this.axiosClient.put<void>(`proxies/${encodeURIComponent(name)}`, { name: select })
    }
}
