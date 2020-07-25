import { Proxy, ProxyGroup } from './Proxy'
import { Rule } from './Rule'
import * as API from '@lib/request'

/**
 * clash config
 * @see https://github.com/Dreamacro/clash#config
 */
export interface Config {

    general?: {

        /**
         * http proxy port
         */
        port?: number

        /**
         * socks proxy port
         */
        socksPort?: number

        /**
         * redir proxy port
         */
        redirPort?: number

        /**
         * proxy is allow lan
         */
        allowLan?: boolean

        /**
         * controller port
         */
        externalControllerPort?: string

        /**
         * controller address
         */
        externalControllerAddr?: string

        /**
         * controller secret
         */
        secret?: string

        /**
         * clash proxy mode
         */
        mode?: string

        /**
         * clash tty log level
         */
        logLevel?: string
    }

    proxy?: Proxy[]

    proxyGroup?: ProxyGroup[]

    rules?: Rule[]

}

export interface Data {
    version?: string

    general?: {

        /**
         * http proxy port
         */
        port?: number

        /**
         * socks proxy port
         */
        socksPort?: number

        /**
         * mixed porxy port
         */
        mixedPort?: number

        /**
         * redir proxy port
         */
        redirPort?: number

        /**
         * proxy is allow lan
         */
        allowLan?: boolean

        /**
         * clash proxy mode
         */
        mode?: 'script' | 'rule' | 'direct' | 'global'

        /**
         * clash tty log level
         */
        logLevel?: string
    }

    proxy?: API.Proxy[]

    proxyGroup?: API.Group[]

    proxyProviders?: API.Provider[]

    rules?: API.Rule[]

    proxyMap?: Map<string, API.Proxy>
}
