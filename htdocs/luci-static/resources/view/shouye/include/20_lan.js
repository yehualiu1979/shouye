'use strict';
'require baseclass';
'require rpc';
'require network';
'require uci';

var callLuciDHCPLeases = rpc.declare({
	object: 'luci-rpc',
	method: 'getDHCPLeases',
	expect: { '': {} }
});

return baseclass.extend({
	title: _('DHCP Devices'),

	params: {},

	load: function() {
		return Promise.all([
			callLuciDHCPLeases(),
			network.getHostHints(),
			uci.load('dhcp')
		]);
	},

	renderHtml: function() {
		var container_wapper = E('div', { 'class': 'router-status-lan dashboard-bg box-s1' });
		var container_box = E('div', { 'class': 'lan-info devices-list' });
		container_box.appendChild(E('div', { 'class': 'title'}, [
			E('img', {
				'src': L.resource('view/shouye/icons/devices.svg'),
				'width': 55,
				'title': this.title,
				'class': 'middle svgmonotone'
			}),
			E('h3', this.title)
		]));

		var container_devices = E('table', { 'class': 'table assoclist devices-info' }, [
			E('thead', { 'class': 'thead dashboard-bg' }, [
				E('th', { 'class': 'th nowrap' }, _('Hostname')),
				E('th', { 'class': 'th' }, _('IP Address')),
				E('th', { 'class': 'th' }, _('MAC')),
				E('th', { 'class': 'th' }, _('设置标签'))
			])
		]);

		for (var idx in this.params.lan.devices) {
			var device = this.params.lan.devices[idx];

			container_devices.appendChild(E('tr', { 'class': idx % 2 ? 'tr cbi-rowstyle-2' : 'tr cbi-rowstyle-1' }, [
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
						E('span', { 'class': 'd-inline-block'}, [ device.macaddr ])
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
						E('span', { 'class': 'd-inline-block'}, [ this.params.lan.devices.length ])
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

	renderUpdateData: function(leases, hosthints) {
		var dev_arr = [];

		leases.forEach(function(entry) {
			var hostname = entry.hostname || '?';
			var ipv4 = entry.ipaddr || '-';
			var macaddr = entry.macaddr || '00:00:00:00:00:00';
			var tag = '-';

			if (hosthints) {
				if (typeof hosthints.getHostHintByMACAddr === 'function') {
					var hint = hosthints.getHostHintByMACAddr(macaddr);
					if (hint && hint.tag) {
						tag = hint.tag;
					}
				} else if (Array.isArray(hosthints)) {
					hosthints.forEach(function(hint) {
						if (hint.macaddr === macaddr && hint.tag) {
							tag = hint.tag;
						}
					});
				}
			}

			if (tag === '-' || !tag) {
				var uciTag = this.getTagFromUCI(macaddr);
				if (uciTag) {
					tag = uciTag;
				}
			}

			dev_arr.push({ hostname: hostname, ipv4: ipv4, macaddr: macaddr, tag: tag });
		}.bind(this));

		this.params.lan = { devices: dev_arr };
	},

	renderLeases: function(leases, hosthints) {
		this.renderUpdateData(leases.dhcp_leases ? leases.dhcp_leases.slice() : [], hosthints);
		return this.renderHtml();
	},

	render: function(data) {
		var leases = data[0];
		var hosthints = data[1];

		if (L.hasSystemFeature('dnsmasq') || L.hasSystemFeature('odhcpd')) {
			return this.renderLeases(leases, hosthints);
		}

		return E([]);
	}
});