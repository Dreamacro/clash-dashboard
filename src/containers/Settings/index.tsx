import React, { useEffect } from 'react'
import { Header, Card, Row, Col, Switch, ButtonSelect, ButtonSelectOptions, Input, Icon } from '@components'
import { containers } from '@stores'
import { updateConfig } from '@lib/request'
import { useObject } from '@lib/hook'
import { to } from '@lib/helper'
import { isClashX, jsBridge } from '@lib/jsBridge'
import { Lang } from '@i18n'
import './style.scss'

const languageOptions: ButtonSelectOptions[] = [{ label: '中文', value: 'zh_CN' }, { label: 'English', value: 'en_US' }]

export default function Settings () {
    const { data: clashXData, fetch: fetchClashXData } = containers.useClashXData()
    const { data, fetch, unauthorized: { show } } = containers.useData()
    const { data: apiInfo } = containers.useAPIInfo()
    const { useTranslation, setLang, lang } = containers.useI18n()
    const { t } = useTranslation('Settings')
    const [info, set] = useObject({
        socks5ProxyPort: 7891,
        httpProxyPort: 7890,
        isClashX: false
    })

    useEffect(() => {
        fetch()
        if (isClashX()) {
            fetchClashXData().then(() => set('isClashX', true))
        }
    }, [])

    useEffect(() => {
        set('socks5ProxyPort', data.general.socksPort)
        set('httpProxyPort', data.general.port)
    }, [data])

    async function handleProxyModeChange (mode: string) {
        const [, err] = await to(updateConfig({ mode }))
        if (!err) {
            fetch()
        }
    }

    async function handleStartAtLoginChange (state: boolean) {
        await jsBridge.setStartAtLogin(state)
        fetchClashXData()
    }

    async function handleSetSystemProxy (state: boolean) {
        await jsBridge.setSystemProxy(state)
        fetchClashXData()
    }

    function changeLanguage (language: Lang) {
        setLang(language)
    }

    async function handleHttpPortSave () {
        const [, err] = await to(updateConfig({ port: info.httpProxyPort }))
        if (!err) {
            await fetch()
            set('httpProxyPort', data.general.port)
        }
    }

    async function handleSocksPortSave () {
        const [, err] = await to(updateConfig({ 'socks-port': info.socks5ProxyPort }))
        if (!err) {
            await fetch()
            set('socks5ProxyPort', data.general.socksPort)
        }
    }

    async function handleAllowLanChange (state: boolean) {
        const [, err] = await to(updateConfig({ 'allow-lan': state }))
        if (!err) {
            await fetch()
        }
    }

    const {
        protocol: externalControllerProtocol,
        hostname: externalControllerHost,
        port: externalControllerPort
    } = apiInfo

    const { allowLan, mode } = data.general
    const {
        startAtLogin,
        systemProxy
    } = clashXData

    const proxyModeOptions: ButtonSelectOptions[] = [
        { label: t('values.global'), value: 'Global' },
        { label: t('values.rules'), value: 'Rule' },
        { label: t('values.direct'), value: 'Direct' }
    ]

    return (
        <div className="page">
            <Header title={t('title')} />
            <Card className="settings-card">
                <Row gutter={24} align="middle">
                    <Col span={12}>
                        <Col span={14} offset={1}>
                            <span className="label">{t('labels.startAtLogin')}</span>
                        </Col>
                        <Col span={8} className="value-column">
                            <Switch disabled={!info.isClashX} checked={startAtLogin} onChange={handleStartAtLoginChange} />
                        </Col>
                    </Col>
                    <Col span={12}>
                        <Col span={8} offset={1}>
                            <span className="label">{t('labels.language')}</span>
                        </Col>
                        <Col span={14} className="value-column">
                            <ButtonSelect options={languageOptions} value={lang} onSelect={changeLanguage} />
                        </Col>
                    </Col>
                </Row>
                <Row gutter={24} align="middle">
                    <Col span={12}>
                        <Col span={14} offset={1}>
                            <span className="label">{t('labels.setAsSystemProxy')}</span>
                        </Col>
                        <Col span={8} className="value-column">
                            <Switch
                                disabled={!info.isClashX}
                                checked={systemProxy}
                                onChange={handleSetSystemProxy}
                            />
                        </Col>
                    </Col>
                    <Col span={12}>
                        <Col span={14} offset={1}>
                            <span className="label">{t('labels.allowConnectFromLan')}</span>
                        </Col>
                        <Col span={8} className="value-column">
                            <Switch
                                checked={allowLan}
                                onChange={handleAllowLanChange}
                            />
                        </Col>
                    </Col>
                </Row>
            </Card>

            <Card className="settings-card">
                <Row gutter={24} align="middle">
                    <Col span={12}>
                        <Col span={8} offset={1}>
                            <span className="label">{t('labels.proxyMode')}</span>
                        </Col>
                        <Col span={14} className="value-column">
                            <ButtonSelect
                                options={proxyModeOptions}
                                value={mode}
                                onSelect={handleProxyModeChange}
                            />
                        </Col>
                    </Col>
                    <Col span={12}>
                        <Col span={14} offset={1}>
                            <span className="label">{t('labels.socks5ProxyPort')}</span>
                        </Col>
                        <Col span={8}>
                            <Input
                                value={info.socks5ProxyPort}
                                onChange={socks5ProxyPort => set('socks5ProxyPort', parseInt(socks5ProxyPort, 10))}
                                onBlur={handleSocksPortSave}
                            />
                        </Col>
                    </Col>
                </Row>
                <Row gutter={24} align="middle">
                    <Col span={12}>
                        <Col span={14} offset={1}>
                            <span className="label">{t('labels.httpProxyPort')}</span>
                        </Col>
                        <Col span={8}>
                            <Input
                                value={info.httpProxyPort}
                                onChange={httpProxyPort => set('httpProxyPort', parseInt(httpProxyPort, 10))}
                                onBlur={handleHttpPortSave}
                            />
                        </Col>
                    </Col>
                    <Col span={12}>
                        <Col span={12} offset={1}>
                            <span className="label">{t('labels.externalController')}</span>
                        </Col>
                        <Col className="external-controller" span={10}>
                            <span className="modify-btn" onClick={show}>
                                {`${externalControllerProtocol}//${externalControllerHost}:${externalControllerPort}`}
                            </span>
                        </Col>
                    </Col>
                </Row>
            </Card>

            <Card className="clash-version" style={{ display: 'none' }}>
                <span className="check-icon">
                    <Icon type="check" size={20} />
                </span>
                <p className="version-info">{t('versionString')}</p>
                <span className="check-update-btn">{t('checkUpdate')}</span>
            </Card>
        </div>
    )
}
