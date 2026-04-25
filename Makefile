include $(TOPDIR)/rules.mk

PKG_NAME:=luci-mod-shouye
LUCI_TITLE:=LuCI Shouye Pages
LUCI_DEPENDS:=+luci-base +libiwinfo
LUCI_TYPE:=module

PKG_LICENSE:=Apache-2.0

# 自动判断 luci.mk 位置
ifneq ($(wildcard $(TOPDIR)/feeds/luci/luci.mk),)
  include $(TOPDIR)/feeds/luci/luci.mk
else
  include ../../luci.mk
endif
