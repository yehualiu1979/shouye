include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI Shouye Pages
LUCI_DEPENDS:=+luci-base +libiwinfo
LUCI_TYPE:=module          # 声明这是一个核心模块（非应用插件）

include ../../luci.mk
