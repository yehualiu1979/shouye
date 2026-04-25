# LuCI Dashboard

一个简洁美观的 OpenWrt 路由器仪表盘界面。

## 功能特性

### 系统状态 (System)
- 主机名、型号、CPU温度、架构
- 内核版本、固件版本
- 运行时间、本地时间

### 网络状态 (Internet)
- IPv4/IPv6 连接状态
- IP地址、协议类型
- 网关、DNS服务器

### DHCP设备 (DHCP Devices)
- 主机名、MAC地址
- IPv4地址、IPv6地址
- 类型标签（静态IP/动态DHCP）

### 无线状态 (Wireless)
- 无线射频状态
- SSID、信道
- 已连接设备列表

## 文件结构

```
.
├── htdocs/
│   └── luci-static/
│       └── resources/
│           └── view/
│               └── dashboard/
│                   ├── index.js          # 仪表盘主页
│                   ├── include/
│                   │   ├── 10_router.js # 路由器状态
│                   │   ├── 20_lan.js    # DHCP设备
│                   │   └── 30_wifi.js   # 无线状态
│                   ├── css/
│                   │   └── custom.css    # 自定义样式
│                   └── icons/            # 图标文件
├── po/                          # 多语言翻译
│   └── zh_Hans/dashboard.po     # 简体中文
├── root/                        # 路由器配置文件
│   └── usr/
│       └── share/
│           ├── luci/
│           │   └── menu.d/
│           │       └── luci-mod-dashboard.json
│           └── rpcd/
│               └── acl.d/
│                   └── luci-mod-dashboard.json
└── Makefile                     # 编译文件
```

## 编译安装

1. 将项目文件复制到 OpenWrt 源码目录
2. 执行 `make menuconfig` 选择 LuCI → Applications → luci-app-dashboard
3. 编译固件或单独编译 ipk 包

## 依赖

- luci-mod-network
- luci-mod-status
- luci-base
- luci-compat

## 预览

访问路由器 `http://192.168.1.1/cgi-bin/luci/admin/dashboard` 查看仪表盘。

## 许可证

Apache-2.0
