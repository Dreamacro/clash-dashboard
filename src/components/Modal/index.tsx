import React, { useRef, useLayoutEffect, MouseEvent } from 'react'
import classnames from 'classnames'
import { createPortal } from 'react-dom'
import { BaseComponentProps } from '@models'
import { Button } from '@components'
import { noop } from '@lib/helper'
import './style.scss'

interface ModalProps extends BaseComponentProps {
    // show modal
    show?: boolean

    // modal title
    title: string

    // size
    size?: 'small' | 'big'

    // body className
    bodyClassName?: string

    // body style
    bodyStyle?: React.CSSProperties

    // show footer
    footer?: boolean

    // on click ok
    onOk?: typeof noop

    // on click close
    onClose?: typeof noop
}

export function Modal (props: ModalProps) {
    const {
        show = true,
        title = 'Modal',
        size = 'small',
        footer = true,
        onOk = noop,
        onClose = noop,
        bodyClassName,
        bodyStyle,
        className,
        style,
        children
    } = props

    const portalRef = useRef<HTMLDivElement>(document.createElement('div'))
    const maskRef = useRef<HTMLDivElement>()

    useLayoutEffect(() => {
        document.body.appendChild(portalRef.current)
        return () => document.body.removeChild(portalRef.current)
    }, [])

    function handleMaskClick (e: MouseEvent) {
        if (e.target === maskRef.current) {
            onClose()
        }
    }

    const modal = (
        <div
            className={classnames('modal-mask', { 'modal-show': show })}
            ref={maskRef}
            onClick={handleMaskClick}
        >
            <form>
                <div
                    className={classnames('modal', `modal-${size}`, className)}
                    style={style}
                >
                    <div className="modal-title">{title}</div>
                    <div
                        className={classnames('modal-body', bodyClassName)}
                        style={bodyStyle}
                    >{children}</div>
                    {
                        footer && (
                            <div className="footer">
                                <Button onClick={() => onClose()}>取 消</Button>
                                <Button type="primary" onClick={() => onOk()}>确 定</Button>
                            </div>
                        )
                    }
                </div>
            </form>
        </div>
    )

    return createPortal(modal, portalRef.current)
}
