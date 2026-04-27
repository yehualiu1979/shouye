'use strict';
'require baseclass';
'require network';
'require uci';

return baseclass.extend({
	title: _('WiFi Devices'),

	params: {},

	load: function() {
		return Promise.all([
			network.getWifiDevices(),
			network.getHostHints(),
			uci.load('dhcp')
		]);
	},

	renderHtml: function() {
		var container_wapper = E('div', { 'class': 'router-status-wifi dashboard-bg box-s1' });
		var container_box = E('div', { 'class': 'wifi-info devices-list' });

		container_box.appendChild(E('div', { 'class': 'title'}, [
			E('img', {
				'src': L.resource('view/shouye/icons/wireless.svg'),
				'width': 55,
				'title': this.title,
				'class': 'middle svgmonotone'
			}),
			E('h3', this.title)
		]));

		var container_devices = E('table', { 'class': 'table assoclist devices-info' }, [
			E('thead', { 'class': 'thead dashboard-bg' }, [
				E('th', { 'class': 'th nowrap' }, _('SSID')),
				E('th', { 'class': 'th' }, _('Hostname')),
				E('th', { 'class': 'th' }, _('IP Address')),
				E('th', { 'class': 'th' }, _('MAC')),
				E('th', { 'class': 'th' }, _('设置标签'))
			])
		]);

		for (var idx in this.params.wifi.devices) {
			var device = this.params.wifi.devices[idx];

			container_devices.appendChild(E('tr', { 'class': idx % 2 ? 'tr cbi-rowstyle-2' : 'tr cbi-rowstyle-1' }, [
				E('td', { 'class': 'td device-info'}, [
					E('p', {}, [
						E('span', { 'class': 'd-inline-block'}, [ device.ssid ])
					])
				]),
				E('td', { 'class': 'td device-info'}, [
					E('p', {}, [
						E('span', { 'class': 'd-inline-block'}, [ device.hostname ])
					])
				]),
				E('td', { 'class': 'td device-info'}, [
					E('p', {}, [
						E('span', { 'class': 'd-inline-block'}, [ device.ipv4 ])
					])
				]),
				E('td', { 'class': 'td device-info'}, [
					E('p', {}, [
						E('span', { 'class': 'd-inline-block'}, [ device.mac ])
					])
				]),
				E('td', { 'class': 'td device-info'}, [
					E('p', {}, [
						E('span', { 'class': 'd-inline-block'}, [ device.tag || '-' ])
					])
				])
			]));
		}

		container_devices.appendChild(E('tfoot', { 'class': 'tfoot dashboard-bg' }, [
			E('tr', { 'class': 'tr cbi-rowstyle-1' }, [
				E('td', { 'class': 'td device-info'}, [
					E('p', {}, [
						E('span', { 'class': 'd-inline-block'}, [ '' ])
					])
				]),
				E('td', { 'class': 'td device-info'}, [
					E('p', {}, [
						E('span', { 'class': 'd-inline-block'}, [ _('Total') + '：' ])
					])
				]),
				E('td', { 'class': 'td device-info'}, [
					E('p', {}, [
						E('span', { 'class': 'd-inline-block'}, [ this.params.wifi.devices.length ])
					])
				]),
				E('td', { 'class': 'td device-info'}, [
					E('p', {}, [
						E('span', { 'class': 'd-inline-block'}, [ '' ])
					])
				]),
				E('td', { 'class': 'td device-info'}, [
					E('p', {}, [
						E('span', { 'class': 'd-inline-block'}, [ '' ])
					])
				])
			])
		]));

		container_box.appendChild(container_devices);
		container_wapper.appendChild(container_box);

		return container_wapper;
	},

	getTagFromUCI: function(macaddr) {
		try {
			var hosts = uci.sections('dhcp', 'host');
			if (!Array.isArray(hosts)) {
				return null;
			}

			for (var i = 0; i < hosts.length; i++) {
				var host = hosts[i];

				var hostMac = host.mac;
				var hostTag = host.tag;

				if (Array.isArray(hostMac)) {
					hostMac = hostMac[0];
				}
				if (Array.isArray(hostTag)) {
					hostTag = hostTag[0];
				}

				if (hostMac && hostTag && typeof hostMac === 'string' && typeof macaddr === 'string') {
					if (hostMac.toLowerCase() === macaddr.toLowerCase()) {
						return hostTag;
					}
				}
			}
		} catch (e) {
			console.error('Error getting tag from UCI:', e);
		}
		return null;
	},

	renderWifiDevice: function(wifidev, hosthints) {
		var dev_arr = [];

		if (!wifidev) {
			return dev_arr;
		}

		var networks = [];
		if (typeof wifidev.getNetworks === 'function') {
			networks = wifidev.getNetworks();
		} else if (wifidev.networks) {
			networks = wifidev.networks;
		}

		if (!Array.isArray(networks)) {
			networks = [];
		}

		for (var i = 0; i < networks.length; i++) {
			var network = networks[i];
			if (!network) continue;

			var ssid = '';
			if (typeof network.getSSID === 'function') {
				ssid = network.getSSID();
			} else if (network.ssid) {
				ssid = network.ssid;
			}

			var assoclist = [];
			if (typeof network.getAssocList === 'function') {
				assoclist = network.getAssocList();
			} else if (network.assoclist) {
				assoclist = network.assoclist;
			}

			if (Array.isArray(assoclist) && assoclist.length > 0) {
				for (var k = 0; k < assoclist.length; k++) {
					var bss = assoclist[k];
					if (!bss || !bss.mac) continue;

					var name = '?';
					var tag = '-';

					if (hosthints) {
						if (typeof hosthints.getHostnameByMACAddr === 'function') {
							name = hosthints.getHostnameByMACAddr(bss.mac) || '?';
						}

						if (typeof hosthints.getHostHintByMACAddr === 'function') {
							var hint = hosthints.getHostHintByMACAddr(bss.mac);
							if (hint && hint.tag) {
								tag = hint.tag;
							}
						} else if (Array.isArray(hosthints)) {
							hosthints.forEach(function(hint) {
								if (hint.macaddr === bss.mac && hint.tag) {
									tag = hint.tag;
								}
							});
						}
					}

					if (tag === '-' || !tag) {
						var uciTag = this.getTagFromUCI(bss.mac);
						if (uciTag) {
							tag = uciTag;
						}
					}

					dev_arr.push({
						ssid: ssid,
						hostname: name,
						ipv4: bss.ip || '-',
						mac: bss.mac,
						tag: tag
					});
				}
			}
		}

		return dev_arr;
	},

	renderUpdateData: function(wifidevs, hosthints) {
		var dev_arr = [];

		if (Array.isArray(wifidevs)) {
			for (var i = 0; i < wifidevs.length; i++) {
				var wifidev = wifidevs[i];
				var network_devs = this.renderWifiDevice(wifidev, hosthints);
				dev_arr = dev_arr.concat(network_devs);
			}
		}

		this.params.wifi = { devices: dev_arr };
	},

	render: function(data) {
		var wifidevs = data[0];
		var hosthints = data[1];

		if (L.hasSystemFeature('wifi')) {
			this.renderUpdateData(wifidevs, hosthints);
			return this.renderHtml();
		}

		return E([]);
	}
});