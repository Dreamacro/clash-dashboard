import * as React from 'react'
import { containers } from '@stores'
import { changeProxySelected, Group as IGroup, getConnections, closeConnection } from '@lib/request'
import { Tags, Tag } from '@components'
import './style.scss'

interface GroupProps {
    config: IGroup
}

export function Group (props: GroupProps) {
    const { fetch, data: Data } = containers.useData()
    const { data: Config } = containers.useConfig()
    const { config } = props

    async function handleChangeProxySelected (name: string) {
        await changeProxySelected(props.config.name, name)
        await fetch()
        if (Config.breakConnections) {
            const list: string[] = []
            const snapshot = await getConnections()
            for (const connection of snapshot.data.connections) {
                if (connection.chains.includes(props.config.name)) {
                    list.push(connection.id)
                }
            }

            for (const id of list) {
                closeConnection(id)
            }
        }
    }

    function shouldError (name: string) {
        const history = Data.proxyMap.get(name)?.history
        if (history?.length) {
            return !history.slice(-1)[0].delay
        }

        return false
    }

    const canClick = config.type === 'Selector'
    return (
        <div className="proxy-group">
            <div className="proxy-group-part">
                <span className="proxy-group-name">{ config.name }</span>
                <Tag className="proxy-group-type">{ config.type }</Tag>
            </div>
            <div className="proxy-group-tags-container">
                <Tags
                    className="proxy-group-tags"
                    data={config.all}
                    onClick={handleChangeProxySelected}
                    shouldError={shouldError}
                    select={config.now}
                    canClick={canClick}
                    rowHeight={30} />
            </div>
        </div>
    )
}
