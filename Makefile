include $(TOPDIR)/rules.mk

PKG_NAME:=luci-mod-shouye
LUCI_TITLE:=LuCI Shouye Pages
LUCI_DEPENDS:=+luci-base +libiwinfo
LUCI_TYPE:=module

include $(TOPDIR)/feeds/luci/luci.mk
