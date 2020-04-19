import React, { useMemo } from 'react'
import useSWR from 'swr'
import EE from '@lib/event'
import { useRound } from '@lib/hook'
import { Card, Header, Icon, Checkbox } from '@components'
import { containers } from '@stores'
import * as API from '@lib/request'

import { Proxy, Group, Provider } from './components'
import './style.scss'

enum sortType {
    None,
    Asc,
    Desc
}

const sortMap = {
    [sortType.None]: 'sort',
    [sortType.Asc]: 'sort-ascending',
    [sortType.Desc]: 'sort-descending'
}

export function compareDesc (a: API.Proxy, b: API.Proxy) {
    const lastDelayA = a.history.length ? a.history.slice(-1)[0].delay : 0
    const lastDelayB = b.history.length ? b.history.slice(-1)[0].delay : 0
    return (lastDelayB || Number.MAX_SAFE_INTEGER) - (lastDelayA || Number.MAX_SAFE_INTEGER)
}

export default function Proxies () {
    const { data, fetch } = containers.useData()
    const { useTranslation } = containers.useI18n()
    const { data: config, set: setConfig } = containers.useConfig()
    const { t } = useTranslation('Proxies')
    useSWR('data', fetch)

    function handleNotitySpeedTest () {
        EE.notifySpeedTest()
    }

    const { current: sort, next } = useRound(
        [sortType.Asc, sortType.Desc, sortType.None]
    )
    const proxies = useMemo(() => {
        switch (sort) {
        case sortType.Desc:
            return data.proxy.slice().sort((a, b) => compareDesc(a, b))
        case sortType.Asc:
            return data.proxy.slice().sort((a, b) => -1 * compareDesc(a, b))
        default:
            return data.proxy.slice()
        }
    }, [sort, data])
    const handleSort = next

    return (
        <div className="page">
            {
                data.proxyGroup.length !== 0 &&
                <div className="proxies-container">
                    <Header title={t('groupTitle')}>
                        <Checkbox
                            className="connections-filter"
                            checked={config.breakConnections}
                            onChange={value => setConfig('breakConnections', value)}>
                            {t('breakConnectionsText')}
                        </Checkbox>
                    </Header>
                    <Card className="proxies-group-card">
                        <ul className="proxies-group-list">
                            {
                                data.proxyGroup.map(p => (
                                    <li className="proxies-group-item" key={p.name}>
                                        <Group config={p} />
                                    </li>
                                ))
                            }
                        </ul>
                    </Card>
                </div>
            }
            {
                data.proxyProviders.length !== 0 &&
                <div className="proxies-container">
                    <Header title={t('providerTitle')} />
                    <ul className="proxies-providers-list">
                        {
                            data.proxyProviders.map(p => (
                                <li className="proxies-providers-item" key={p.name}>
                                    <Provider provider={p} />
                                </li>
                            ))
                        }
                    </ul>
                </div>
            }
            {
                proxies.length !== 0 &&
                <div className="proxies-container">
                    <Header title={t('title')}>
                        <Icon className="proxies-action-icon" type={sortMap[sort]} onClick={handleSort} size={20} />
                        <Icon className="proxies-action-icon" type="speed" size={20} />
                        <span className="proxies-speed-test" onClick={handleNotitySpeedTest}>{t('speedTestText')}</span>
                    </Header>
                    <ul className="proxies-list">
                        {
                            proxies.map(p => (
                                <li key={p.name}>
                                    <Proxy config={p} />
                                </li>
                            ))
                        }
                    </ul>
                </div>
            }
        </div>
    )
}
