import React, { useEffect, useMemo } from 'react'
import classnames from 'classnames'
import capitalize from 'lodash/capitalize'
import { Header, Card, Row, Col, Switch, ButtonSelect, ButtonSelectOptions, Input, Icon } from '@components'
import { useI18n, useClashXData, useAPIInfo, useGeneral, useIdentity, useVersion } from '@stores'
import { updateConfig } from '@lib/request'
import { useObject } from '@lib/hook'
import { jsBridge } from '@lib/jsBridge'
import { Lang } from '@i18n'
import './style.scss'

const languageOptions: ButtonSelectOptions[] = [{ label: '中文', value: 'zh_CN' }, { label: 'English', value: 'en_US' }]

export default function Settings () {
    const { premium } = useVersion()
    const { data: clashXData, update: fetchClashXData } = useClashXData()
    const { general, update: fetchGeneral } = useGeneral()
    const { set: setIdentity } = useIdentity()
    const { data: apiInfo } = useAPIInfo()
    const { useTranslation, setLang, lang } = useI18n()
    const { t } = useTranslation('Settings')
    const [info, set] = useObject({
        socks5ProxyPort: 7891,
        httpProxyPort: 7890
    })

    useEffect(() => {
        fetchGeneral()
        fetchClashXData()
    }, [])

    useEffect(() => {
        set('socks5ProxyPort', general.socksPort)
        set('httpProxyPort', general.port)
    }, [general])

    async function handleProxyModeChange (mode: string) {
        await updateConfig({ mode })
        await fetchGeneral()
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
        await updateConfig({ port: info.httpProxyPort })
        await fetchGeneral()
    }

    async function handleSocksPortSave () {
        await updateConfig({ 'socks-port': info.socks5ProxyPort })
        await fetchGeneral()
    }

    async function handleAllowLanChange (state: boolean) {
        await updateConfig({ 'allow-lan': state })
        await fetchGeneral()
    }

    const {
        hostname: externalControllerHost,
        port: externalControllerPort
    } = apiInfo

    const { allowLan, mode } = general
    const {
        startAtLogin,
        systemProxy
    } = clashXData

    const proxyModeOptions = useMemo(() => {
        const options = [
            { label: t('values.global'), value: 'Global' },
            { label: t('values.rules'), value: 'Rule' },
            { label: t('values.direct'), value: 'Direct' }
        ]
        if (premium) {
            options.push({ label: t('values.script'), value: 'Script' })
        }
        return options
    }, [t, premium])

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
                            <Switch disabled={!clashXData.isClashX} checked={startAtLogin} onChange={handleStartAtLoginChange} />
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
                                disabled={!clashXData.isClashX}
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
                                value={capitalize(mode)}
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
                                disabled={clashXData.isClashX}
                                value={info.socks5ProxyPort}
                                onChange={socks5ProxyPort => set('socks5ProxyPort', +socks5ProxyPort)}
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
                                disabled={clashXData.isClashX}
                                value={info.httpProxyPort}
                                onChange={httpProxyPort => set('httpProxyPort', +httpProxyPort)}
                                onBlur={handleHttpPortSave}
                            />
                        </Col>
                    </Col>
                    <Col span={12}>
                        <Col span={12} offset={1}>
                            <span className="label">{t('labels.externalController')}</span>
                        </Col>
                        <Col className="external-controller" span={10}>
                            <span
                                className={classnames({ 'modify-btn': !clashXData.isClashX })}
                                onClick={() => !clashXData.isClashX && setIdentity(false)}>
                                {`${externalControllerHost}:${externalControllerPort}`}
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
