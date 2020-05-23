import React, { useEffect } from 'react'
import { useObject } from '@lib/hook'
import { Modal, Input, Row, Col, Alert } from '@components'
import { containers } from '@stores'
import './style.scss'

export default function ExternalController () {
    const { useTranslation } = containers.useI18n()
    const { t } = useTranslation('Settings')
    const { data: info, update, fetch } = containers.useAPIInfo()
    const { unauthorized: { hide, visible } } = containers.useData()
    const [value, set] = useObject({
        protocol: '',
        hostname: '',
        port: '',
        secret: ''
    })

    useEffect(() => {
        fetch()
    }, [])

    useEffect(() => {
        set({ protocol: info.protocol, hostname: info.hostname, port: info.port, secret: info.secret })
    }, [info])

    function handleOk () {
        const { protocol, hostname, port, secret } = value
        update({ protocol, hostname, port, secret })
    }

    return (
        <Modal
            show={visible}
            title={t('externalControllerSetting.title')}
            bodyClassName="external-controller"
            onClose={hide}
            onOk={handleOk}
        >
            <Alert type="info" inside={true}>
                <p>{t('externalControllerSetting.note')}</p>
            </Alert>
            <Row gutter={24} align="middle">
                <Col span={4} className="title">{t('externalControllerSetting.protocol')}</Col>
                <Col span={20} className="form">
                    <Input
                        align="left"
                        inside={true}
                        value={value.protocol}
                        onChange={protocol => set('protocol', protocol)}
                    />
                </Col>
            </Row><Row gutter={24} align="middle">
                <Col span={4} className="title">{t('externalControllerSetting.host')}</Col>
                <Col span={20} className="form">
                    <Input
                        align="left"
                        inside={true}
                        value={value.hostname}
                        onChange={hostname => set('hostname', hostname)}
                    />
                </Col>
            </Row>
            <Row gutter={24} align="middle">
                <Col span={4} className="title">{t('externalControllerSetting.port')}</Col>
                <Col span={20} className="form">
                    <Input
                        align="left"
                        inside={true}
                        value={value.port}
                        onChange={port => set('port', port)}
                    />
                </Col>
            </Row>
            <Row gutter={24} align="middle">
                <Col span={4} className="title">{t('externalControllerSetting.secret')}</Col>
                <Col span={20} className="form">
                    <Input
                        align="left"
                        inside={true}
                        value={value.secret}
                        onChange={secret => set('secret', secret)}
                    />
                </Col>
            </Row>
        </Modal>
    )
}
