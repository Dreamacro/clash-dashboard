import React, { useMemo, useLayoutEffect, useCallback, useRef, useState, useEffect } from 'react'
import { Cell, Column, ColumnInstance, TableInstance, TableOptions, useBlockLayout, useFilters, UseFiltersInstanceProps, UseFiltersOptions, useResizeColumns, UseResizeColumnsColumnProps, UseResizeColumnsOptions, useSortBy, UseSortByColumnOptions, UseSortByColumnProps, UseSortByOptions, useTable } from 'react-table'
import classnames from 'classnames'
import { useLatest, useScroll } from 'react-use'
import { groupBy } from 'lodash-es'
import { Header, Checkbox, Modal, Icon, Drawer, Card, Button } from '@components'
import { useClient, useConnectionStreamReader, useI18n } from '@stores'
import * as API from '@lib/request'
import { useObject, useVisible } from '@lib/hook'
import { fromNow } from '@lib/date'
import { formatTraffic } from '@lib/helper'
import { RuleType } from '@models'
import { Devices } from './Devices'
import { ConnectionInfo } from './Info'
import { Connection, FormatConnection, useConnections } from './store'
import './style.scss'

enum Columns {
    Host = 'host',
    ProcessName = 'processName',
    Network = 'network',
    Type = 'type',
    Chains = 'chains',
    Rule = 'rule',
    Speed = 'speed',
    Upload = 'upload',
    Download = 'download',
    SourceIP = 'sourceIP',
    Time = 'time'
}

const shouldCenter = new Set<string>([Columns.Network, Columns.Type, Columns.Rule, Columns.Speed, Columns.Upload, Columns.Download, Columns.SourceIP, Columns.Time])

interface TableColumn<D extends object = {}> extends
    ColumnInstance<D>,
    UseSortByColumnProps<D>,
    UseResizeColumnsColumnProps<D> {}

type TableColumnOption<D extends object = {}> =
    Column<D> &
    UseResizeColumnsOptions<D> &
    UseSortByColumnOptions<D>

interface ITableOptions<D extends object = {}> extends
    TableOptions<D>,
    UseSortByOptions<D>,
    UseFiltersOptions<D> {}

interface ITableInstance<D extends object = {}> extends
    TableInstance<D>,
    UseFiltersInstanceProps<D> {}

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
    const connStreamReader = useConnectionStreamReader()
    const client = useClient()
    const cardRef = useRef<HTMLDivElement>(null)

    // total
    const [traffic, setTraffic] = useObject({
        uploadTotal: 0,
        downloadTotal: 0,
    })

    // close all connections
    const { visible, show, hide } = useVisible()
    function handleCloseConnections () {
        client.closeAllConnections().finally(() => hide())
    }

    // connections
    const { connections, feed, save, toggleSave } = useConnections()
    const data: FormatConnection[] = useMemo(() => connections.map(
        c => ({
            id: c.id,
            host: `${c.metadata.host || c.metadata.destinationIP}:${c.metadata.destinationPort}`,
            chains: c.chains.slice().reverse().join(' / '),
            rule: c.rule === RuleType.RuleSet ? `${c.rule}(${c.rulePayload})` : c.rule,
            time: new Date(c.start).getTime(),
            upload: c.upload,
            download: c.download,
            sourceIP: c.metadata.sourceIP,
            type: c.metadata.type,
            network: c.metadata.network.toUpperCase(),
            speed: { upload: c.uploadSpeed, download: c.downloadSpeed },
            completed: !!c.completed,
            original: c,
            processName: c.metadata.processName,
        }),
    ), [connections])
    const devices = useMemo(() => {
        const gb = groupBy(connections, 'metadata.sourceIP')
        return Object.keys(gb).map(key => ({ label: key, number: gb[key].length })).sort((a, b) => a.label.localeCompare(b.label))
    }, [connections])

    // table
    const tableRef = useRef<HTMLDivElement>(null)
    const { x: scrollX } = useScroll(tableRef)
    const columns: Array<TableColumnOption<FormatConnection>> = useMemo(() => [
        { Header: t(`columns.${Columns.Host}`), accessor: Columns.Host, minWidth: 260, width: 260 },
        { Header: t(`columns.${Columns.ProcessName}`), accessor: Columns.ProcessName, minWidth: 120, width: 120 },
        { Header: t(`columns.${Columns.Network}`), accessor: Columns.Network, minWidth: 80, width: 80 },
        { Header: t(`columns.${Columns.Type}`), accessor: Columns.Type, minWidth: 120, width: 120 },
        { Header: t(`columns.${Columns.Chains}`), accessor: Columns.Chains, minWidth: 200, width: 200 },
        { Header: t(`columns.${Columns.Rule}`), accessor: Columns.Rule, minWidth: 140, width: 140 },
        {
            id: Columns.Speed,
            Header: t(`columns.${Columns.Speed}`),
            accessor (originalRow: FormatConnection) {
                return [originalRow.speed.upload, originalRow.speed.download]
            },
            sortType (rowA, rowB) {
                const speedA = rowA.original.speed
                const speedB = rowB.original.speed
                return speedA.download === speedB.download
                    ? speedA.upload - speedB.upload
                    : speedA.download - speedB.download
            },
            minWidth: 200,
            width: 200,
            sortDescFirst: true,
        },
        { Header: t(`columns.${Columns.Upload}`), accessor: Columns.Upload, minWidth: 100, width: 100, sortDescFirst: true },
        { Header: t(`columns.${Columns.Download}`), accessor: Columns.Download, minWidth: 100, width: 100, sortDescFirst: true },
        { Header: t(`columns.${Columns.SourceIP}`), accessor: Columns.SourceIP, minWidth: 140, width: 140 },
        { Header: t(`columns.${Columns.Time}`), accessor: Columns.Time, minWidth: 120, width: 120, sortType (rowA, rowB) { return rowB.original.time - rowA.original.time } },
    ] as Array<TableColumnOption<FormatConnection>>, [t])

    useLayoutEffect(() => {
        function handleConnection (snapshots: API.Snapshot[]) {
            for (const snapshot of snapshots) {
                setTraffic({
                    uploadTotal: snapshot.uploadTotal,
                    downloadTotal: snapshot.downloadTotal,
                })

                feed(snapshot.connections)
            }
        }

        connStreamReader?.subscribe('data', handleConnection)
        return () => {
            connStreamReader?.unsubscribe('data', handleConnection)
            connStreamReader?.destory()
        }
    }, [connStreamReader, feed, setTraffic])

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
        setFilter,
    } = useTable(
        {
            columns,
            data,
            autoResetSortBy: false,
            autoResetFilters: false,
            initialState: { sortBy: [{ id: Columns.Time, desc: false }] },
        } as ITableOptions<FormatConnection>,
        useResizeColumns,
        useBlockLayout,
        useFilters,
        useSortBy,
    ) as ITableInstance<FormatConnection>
    const headerGroup = useMemo(() => headerGroups[0], [headerGroups])
    const renderCell = useCallback(function (cell: Cell<FormatConnection>) {
        switch (cell.column.id) {
            case Columns.Speed:
                return formatSpeed(cell.value[0], cell.value[1])
            case Columns.Upload:
            case Columns.Download:
                return formatTraffic(cell.value)
            case Columns.Time:
                return fromNow(new Date(cell.value), lang)
            default:
                return cell.value
        }
    }, [lang])

    // filter
    const [device, setDevice] = useState('')
    function handleDeviceSelected (label: string) {
        setDevice(label)
        setFilter?.(Columns.SourceIP, label)
    }

    // click item
    const [drawerState, setDrawerState] = useObject({
        visible: false,
        selectedID: '',
        connection: {} as Partial<Connection>,
    })
    function handleConnectionSelected (id: string) {
        setDrawerState({
            visible: true,
            selectedID: id,
        })
    }
    function handleConnectionClosed () {
        setDrawerState(d => { d.connection.completed = true })
        client.closeConnection(drawerState.selectedID)
    }
    const latestConntion = useLatest(drawerState.connection)
    useEffect(() => {
        const conn = data.find(c => c.id === drawerState.selectedID)?.original
        if (conn) {
            setDrawerState(d => {
                d.connection = conn
                if (drawerState.selectedID === latestConntion.current.id) {
                    d.connection.completed = latestConntion.current.completed
                }
            })
        } else if (Object.keys(latestConntion.current).length !== 0 && !latestConntion.current.completed) {
            setDrawerState(d => { d.connection.completed = true })
        }
    }, [data, drawerState.selectedID, latestConntion, setDrawerState])

    return (
        <div className="page">
            <Header title={t('title')}>
                <span className="connections-filter flex-1 cursor-default">
                    {`(${t('total.text')}: ${t('total.upload')} ${formatTraffic(traffic.uploadTotal)} ${t('total.download')} ${formatTraffic(traffic.downloadTotal)})`}
                </span>
                <Checkbox className="connections-filter" checked={save} onChange={toggleSave}>{t('keepClosed')}</Checkbox>
                <Icon className="connections-filter dangerous" onClick={show} type="close-all" size={20} />
            </Header>
            { devices.length > 1 && <Devices devices={devices} selected={device} onChange={handleDeviceSelected} /> }
            <Card ref={cardRef} className="connections-card relative">
                <div {...getTableProps()} className="flex flex-col w-full flex-1 overflow-auto" style={{ flexBasis: 0 }} ref={tableRef}>
                    <div {...headerGroup.getHeaderGroupProps()} className="connections-header">
                        {
                            headerGroup.headers.map((column, idx) => {
                                const realColumn = column as unknown as TableColumn<FormatConnection>
                                const id = realColumn.id
                                return (
                                    <div
                                        {...realColumn.getHeaderProps()}
                                        className={classnames('connections-th', {
                                            resizing: realColumn.isResizing,
                                            fixed: scrollX > 0 && realColumn.id === Columns.Host,
                                        })}
                                        key={id}>
                                        <div {...realColumn.getSortByToggleProps()}>
                                            {column.render('Header')}
                                            {
                                                realColumn.isSorted
                                                    ? realColumn.isSortedDesc ? ' ↓' : ' ↑'
                                                    : null
                                            }
                                        </div>
                                        { idx !== headerGroup.headers.length - 1 &&
                                            <div {...realColumn.getResizerProps()} className="connections-resizer" />
                                        }
                                    </div>
                                )
                            })
                        }
                    </div>

                    <div {...getTableBodyProps()} className="flex-1">
                        {
                            rows.map(row => {
                                prepareRow(row)
                                return (
                                    <div
                                        {...row.getRowProps()}
                                        className="connections-item cursor-default select-none"
                                        key={row.original.id}
                                        onClick={() => handleConnectionSelected(row.original.id)}>
                                        {
                                            row.cells.map(cell => {
                                                const classname = classnames(
                                                    'connections-block',
                                                    { 'text-center': shouldCenter.has(cell.column.id), completed: row.original.completed },
                                                    { fixed: scrollX > 0 && cell.column.id === Columns.Host },
                                                )
                                                return (
                                                    <div {...cell.getCellProps()} className={classname} key={cell.column.id}>
                                                        { renderCell(cell)}
                                                    </div>
                                                )
                                            })
                                        }
                                    </div>
                                )
                            })
                        }
                    </div>
                </div>
            </Card>
            <Modal title={t('closeAll.title')} show={visible} onClose={hide} onOk={handleCloseConnections}>{t('closeAll.content')}</Modal>
            <Drawer containerRef={cardRef} visible={drawerState.visible} width={450}>
                <div className="flex justify-between items-center h-8">
                    <span className="pl-3 font-bold">{t('info.title')}</span>
                    <Icon type="close" size={16} className="cursor-pointer" onClick={() => setDrawerState('visible', false)} />
                </div>
                <ConnectionInfo className="px-5 mt-3" connection={drawerState.connection} />
                <div className="flex justify-end mt-3 pr-3">
                    <Button type="danger" disiabled={drawerState.connection.completed} onClick={() => handleConnectionClosed()}>{ t('info.closeConnection') }</Button>
                </div>
            </Drawer>
        </div>
    )
}
