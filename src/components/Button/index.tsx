import * as React from 'react'
import classnames from 'classnames'
import { BaseComponentProps } from '@models'
import { noop } from '@lib/helper'
import './style.scss'

interface ButtonProps extends BaseComponentProps {
    type?: 'primary' | 'normal' | 'danger' | 'success' | 'warning'
    onClick?: React.MouseEventHandler<HTMLButtonElement>
}

export function Button (props: ButtonProps) {
    const { type = 'normal', onClick = noop, children, className, style } = props
    const classname = classnames('button', `button-${type}`, className)
    const buttonType = type === 'primary' ? 'submit' : 'button'

    return (
        <button
            className={classname}
            style={style}
            onClick={onClick}
            type={buttonType}
        >{children}</button>
    )
}
