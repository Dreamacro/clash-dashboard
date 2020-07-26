export default {
    SideBar: {
        Proxies: '代理',
        Overview: '总览',
        Logs: '日志',
        Rules: '规则',
        Settings: '设置',
        Connections: '连接',
        Version: '版本'
    },
    Settings: {
        title: '设置',
        labels: {
            startAtLogin: '开机时启动',
            language: '语言',
            setAsSystemProxy: '设置为系统代理',
            allowConnectFromLan: '允许来自局域网的连接',
            proxyMode: '代理模式',
            socks5ProxyPort: 'Socks5 代理端口',
            httpProxyPort: 'HTTP 代理端口',
            externalController: '外部控制设置'
        },
        values: {
            cn: '中文',
            en: 'English',
            global: '全局',
            rules: '规则',
            direct: '直连',
            script: '脚本'
        },
        versionString: '当前 ClashX 已是最新版本：{{version}}',
        checkUpdate: '检查更新',
        externalControllerSetting: {
            title: '编辑外部控制设置',
            note: '请注意，修改该配置项并不会修改你的 Clash 配置文件，请确认修改后的外部控制地址和 Clash 配置文件内的地址一致，否则会导致 Dashboard 无法连接。',
            host: 'Host',
            port: '端口',
            secret: '密钥'
        }
    },
    Logs: {
        title: '日志'
    },
    Rules: {
        title: '规则',
        providerTitle: '规则集',
        providerUpdateTime: '最后更新于',
        ruleCount: '规则条数'
    },
    Connections: {
        title: '连接',
        keepClosed: '保留关闭连接',
        total: {
            text: '总量',
            upload: '上传',
            download: '下载'
        },
        closeAll: {
            title: '警告',
            content: '将会关闭所有连接'
        },
        columns: {
            host: '域名',
            network: '网络',
            type: '类型',
            chains: '节点链',
            rule: '规则',
            time: '连接时间',
            speed: '速率',
            upload: '上传',
            download: '下载'
        }
    },
    Proxies: {
        title: '代理',
        editDialog: {
            title: '编辑代理',
            color: '颜色',
            name: '名字',
            type: '类型',
            server: '服务器',
            port: '端口',
            password: '密码',
            cipher: '加密方式',
            obfs: 'Obfs',
            'obfs-host': 'Obfs-host',
            uuid: 'UUID',
            alterId: 'AlterId',
            tls: 'TLS'
        },
        groupTitle: '策略组',
        providerTitle: '代理集',
        providerUpdateTime: '最后更新于',
        expandText: '展开',
        collapseText: '收起',
        speedTestText: '测速',
        breakConnectionsText: '切换时打断包含策略组的连接'
    },
    Modal: {
        ok: '确 定',
        cancel: '取 消'
    }
}
