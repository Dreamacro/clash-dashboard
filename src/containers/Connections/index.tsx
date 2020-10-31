import React, { useMemo, useLayoutEffect } from 'react'
import { useBlockLayout, useResizeColumns, useTable } from 'react-table'
import classnames from 'classnames'
import { Header, Card, Checkbox, Modal, Icon } from '@components'
import { useI18n } from '@stores'
import * as API from '@lib/request'
import { StreamReader } from '@lib/streamer'
import { useObject, useVisible } from '@lib/hook'
import { noop } from '@lib/helper'
import { fromNow } from '@lib/date'
import { RuleType } from '@models'
import { useConnections } from './store'
import './style.scss'

enum Columns {
    Host = 'host',
    Network = 'network',
    Type = 'type',
    Chains = 'chains',
    Rule = 'rule',
    Speed = 'speed',
    Upload = 'upload',
    Download = 'download',
    Time = 'time'
}

type TableColumn = Columns | ''

type TableSort = {
    column: TableColumn
    asc: boolean
}

const columnsPair: [string, number][] = [
    [Columns.Host, 260],
    [Columns.Network, 80],
    [Columns.Type, 120],
    [Columns.Chains, 200],
    [Columns.Rule, 140],
    [Columns.Speed, 200],
    [Columns.Upload, 100],
    [Columns.Download, 100],
    [Columns.Time, 120]
]
const shouldCenter = new Set<string>([Columns.Network, Columns.Type, Columns.Rule, Columns.Speed, Columns.Upload, Columns.Download, Columns.Time])
const sortableColumns = new Set<TableColumn>([Columns.Host, Columns.Network, Columns.Type, Columns.Rule, Columns.Upload, Columns.Download])


function formatTraffic (num: number) {
    const s = ['B', 'KB', 'MB', 'GB', 'TB']
    let idx = 0
    while (~~(num / 1024) && idx < s.length) {
        num /= 1024
        idx++
    }

    return `${idx === 0 ? num : num.toFixed(2)} ${s[idx]}`
}

function formatSpeed (upload: number, download: number) {
    switch (true) {
    case upload === 0 && download === 0:
        return '-'
    case upload !== 0 && download !== 0:
        return `↑ ${formatTraffic(upload)}/s ↓ ${formatTraffic(download)}/s`
    case upload !== 0:
        return `↑ ${formatTraffic(upload)}/s`
    default:
        return `↓ ${formatTraffic(download)}/s`
    }
}

export default function Connections () {
    const { translation, lang } = useI18n()
    const t = useMemo(() => translation('Connections').t, [translation])

    // total
    const [traffic, setTraffic] = useObject({
        uploadTotal: 0,
        downloadTotal: 0
    })

    // sort
    const [sort, setSort] = useObject<TableSort>({
        column: '',
        asc: true
    })
    function handleSort (column: TableColumn) {
        if (column === sort.column) {
            sort.asc
                ? setSort('asc', false)
                : setSort({ column: '', asc: true })
        } else {
            setSort('column', column)
        }
    }

    // close all connections
    const { visible, show, hide } = useVisible()
    function handleCloseConnections () {
        API.closeAllConnections().finally(() => hide())
    }

    // connections
    const { connections, feed, save, toggleSave } = useConnections()
    const data = useMemo(() => {
        return connections
            .sort((a, b) => {
                if (a.completed !== b.completed) {
                    return a.completed ? 1 : -1
                }

                const diffTime = new Date(a.start).getTime() - new Date(b.start).getTime()
                if (diffTime !== 0) {
                    return diffTime
                }
                return a.id.localeCompare(b.id)
            })
            .map(c => ({
                id: c.id,
                host: `${c.metadata.host || c.metadata.destinationIP}:${c.metadata.destinationPort}`,
                chains: c.chains.slice().reverse().join(' --> '),
                rule: c.rule === RuleType.RuleSet ? `${c.rule}(${c.rulePayload})` : c.rule,
                time: fromNow(new Date(c.start), lang),
                upload: formatTraffic(c.upload),
                download: formatTraffic(c.download),
                type: c.metadata.type,
                network: c.metadata.network.toUpperCase(),
                speed: formatSpeed(c.speed.upload, c.speed.download),
                completed: !!c.completed
            }))
            .sort((a, b) => {
                const column = sort.column
                if (!column) {
                    return 0
                }

                const aValue = a[column] as string
                const bValue = b[column] as string

                if (column === 'download') {
                    const aSpeed = parseInt(aValue)
                    const bSpeed = parseInt(bValue)
                    return sort.asc
                        ? aSpeed - bSpeed
                        : bSpeed - aSpeed
                }

                return sort.asc
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue)
            })
    }, [connections, lang, sort.asc, sort.column])

    // table
    const columns = useMemo(() => columnsPair.map(
        c => ({
            Header: t(`columns.${c[0]}`),
            accessor: c[0],
            minWidth: c[1],
            width: c[1]
        })
    ), [t])

    useLayoutEffect(() => {
        let streamReader: StreamReader<API.Snapshot> | null = null

        function handleConnection (snapshots: API.Snapshot[]) {
            for (const snapshot of snapshots) {
                setTraffic({
                    uploadTotal: snapshot.uploadTotal,
                    downloadTotal: snapshot.downloadTotal
                })

                feed(snapshot.connections)
            }
        }

        (async function () {
            streamReader = await API.getConnectionStreamReader()
            streamReader.subscribe('data', handleConnection)
        }())

        return () => {
            if (streamReader) {
                streamReader.unsubscribe('data', handleConnection)
                streamReader.destory()
            }
        }
    }, [feed, setTraffic])

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow
    } = useTable(
        { columns: columns as any, data },
        useBlockLayout,
        useResizeColumns
    )
    const headerGroup = useMemo(() => headerGroups[0], [headerGroups])
    const renderItem = useMemo(() => rows.map((row, i) => {
        prepareRow(row)
        return (
            <div {...row.getRowProps()} className="connections-item" key={i}>
                {
                    row.cells.map((cell, j) => {
                        const classname = classnames(
                            'connections-block',
                            { center: shouldCenter.has(cell.column.id), completed: !!(row.original as any).completed }
                        )
                        return (
                            <div {...cell.getCellProps()} className={classname} key={j}>
                                { cell.render('Cell') }
                            </div>
                        )
                    })
                }
            </div>
        )
    }), [prepareRow, rows])

    return (
        <div className="page">
            <Header title={t('title')}>
                <span className="connections-filter total">
                    { `(${t('total.text')}: ${t('total.upload')} ${formatTraffic(traffic.uploadTotal)} ${t('total.download')} ${formatTraffic(traffic.downloadTotal)})` }
                </span>
                <Checkbox className="connections-filter" checked={save} onChange={toggleSave}>{ t('keepClosed') }</Checkbox>
                <Icon className="connections-filter dangerous" onClick={show} type="close-all" size={20} />
            </Header>
            <Card className="connections-card">
                <div {...getTableProps()} className="connections">
                    <div {...headerGroup.getHeaderGroupProps()} className="connections-header">
                        {
                            headerGroup.headers.map((column, idx) => {
                                // Is there a better way to hacking around it?
                                const id = column.id as TableColumn
                                const handleClick = sortableColumns.has(id) ? () => handleSort(id) : noop
                                return (
                                    <div {...column.getHeaderProps()} className="connections-th" onClick={handleClick} key={id}>
                                        { column.render('Header') }
                                        {
                                            sort.column === id && (sort.asc ? ' ↑' : ' ↓')
                                        }
                                        { idx !== headerGroup.headers.length - 1 &&
                                            <div {...(column as any).getResizerProps()} className="connections-resizer" />
                                        }
                                    </div>
                                )
                            })
                        }
                    </div>

                    <div {...getTableBodyProps()} className="connections-body">
                        { renderItem }
                    </div>
                </div>
            </Card>
            <Modal title={ t('closeAll.title') } show={visible} onClose={hide} onOk={handleCloseConnections}>{ t('closeAll.content') }</Modal>
        </div>
    )
}
