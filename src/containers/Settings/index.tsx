import React, { useEffect } from 'react'
import { Header, Card, Row, Col, Switch, ButtonSelect, ButtonSelectOptions, Input, Icon, Button, showMessage } from '@components'
import { useI18n, useClashXData, useAPIInfo, useGeneral, useIdentity } from '@stores'
import { updateConfig, reloadConfig } from '@lib/request'
import { useObject } from '@lib/hook'
import { isClashX, jsBridge } from '@lib/jsBridge'
import { Lang } from '@i18n'
import './style.scss'

const languageOptions: ButtonSelectOptions[] = [{ label: '中文', value: 'zh_CN' }, { label: 'English', value: 'en_US' }]

export default function Settings () {
    const { data: clashXData, update: fetchClashXData } = useClashXData()
    const { general, update: fetchGeneral } = useGeneral()
    const { set: setIdentity } = useIdentity()
    const { data: apiInfo } = useAPIInfo()
    const { useTranslation, setLang, lang } = useI18n()
    const { t } = useTranslation('Settings')
    const [info, set] = useObject({
        socks5ProxyPort: 7891,
        httpProxyPort: 7890,
        isClashX: false
    })

    useEffect(() => {
        fetchGeneral()
        if (isClashX()) {
            fetchClashXData().then(() => set('isClashX', true))
        }
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
    async function handleReloadConfig () {
        let resp = await reloadConfig({})
        if (resp.status === 204) {
            showMessage({ content: t('reloadConfig.success'), type: "success" })
        } else {
            showMessage({ content: t('reloadConfig.fail'), type: "error" })
        }
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
                            <span className="modify-btn" onClick={() => setIdentity(false)}>
                                {`${externalControllerHost}:${externalControllerPort}`}
                            </span>
                        </Col>
                    </Col>
                </Row>
                <Row gutter={24} align="middle">
                    <Col span={12}>
                        <Col span={14} offset={1}>
                            <Button type={"primary"} onClick={handleReloadConfig}>{t('reloadConfig.btn')}</Button>
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
