import EventEmitter from 'eventemitter3'
import { SetRequired } from 'type-fest'
import { to } from '@lib/helper'

export interface Config {
    url: string
    useWebsocket: boolean
    token?: string
    bufferLength?: number
    retryInterval?: number
}

export class StreamReader<T> {
    protected EE = new EventEmitter()
    protected config: SetRequired<Config, 'bufferLength' | 'retryInterval'>
    protected innerBuffer: T[] = []
    protected isClose = false

    constructor (config: Config) {
        this.config = Object.assign(
            {
                bufferLength: 0,
                retryInterval: 5000,
                headers: {}
            },
            config
        )

        this.config.useWebsocket
            ? this.websocketLoop()
            : this.loop()
    }

    protected websocketLoop () {
        const url = new URL(this.config.url)
        url.protocol = url.protocol === 'http:' ? 'ws:' : 'wss:'
        url.searchParams.set('token', this.config.token ?? '')

        const connection = new WebSocket(url.toString())
        connection.addEventListener('message', msg => {
            const data = JSON.parse(msg.data)
            this.EE.emit('data', [data])
            if (this.config.bufferLength > 0) {
                this.innerBuffer.push(data)
                if (this.innerBuffer.length > this.config.bufferLength) {
                    this.innerBuffer.splice(0, this.innerBuffer.length - this.config.bufferLength)
                }
            }
        })

        connection.addEventListener('close', () => setTimeout(this.websocketLoop, this.config.retryInterval))
        connection.addEventListener('error', err => {
            this.EE.emit('error', err)
            setTimeout(this.websocketLoop, this.config.retryInterval)
        })
    }

    protected async loop () {
        const [resp, err] = await to(fetch(
            this.config.url,
            {
                mode: 'cors',
                headers: this.config.token ? { Authorization: `Bearer ${this.config.token}` } : {}
            }
        ))
        if (err || !resp.body) {
            this.retry(err)
            return
        }

        const reader = resp.body.getReader()
        const decoder = new TextDecoder()
        while (true) {
            if (this.isClose) {
                break
            }

            const [{ value }, err] = await to(reader?.read())
            if (err) {
                this.retry(err)
                break
            }

            const lines = decoder.decode(value).trim().split('\n')
            const data = lines.map(l => JSON.parse(l))
            this.EE.emit('data', data)
            if (this.config.bufferLength! > 0) {
                this.innerBuffer.push(...data)
                if (this.innerBuffer.length > this.config.bufferLength) {
                    this.innerBuffer.splice(0, this.innerBuffer.length - this.config.bufferLength)
                }
            }
        }
    }

    protected retry (err: Error) {
        if (!this.isClose) {
            this.EE.emit('error', err)
            window.setTimeout(this.loop, this.config.retryInterval)
        }
    }

    subscribe (event: string, callback: (data: T[]) => void) {
        this.EE.addListener(event, callback)
    }

    unsubscribe (event: string, callback: (data: T[]) => void) {
        this.EE.removeListener(event, callback)
    }

    buffer () {
        return this.innerBuffer.slice()
    }

    destory () {
        this.EE.removeAllListeners()
        this.isClose = true
    }
}
