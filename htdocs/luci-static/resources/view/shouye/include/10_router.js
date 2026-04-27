'use strict';
'require baseclass';
'require fs';
'require rpc';
'require network';
'require uci';

var callSystemBoard = rpc.declare({
	object: 'system',
	method: 'board'
});

var callSystemInfo = rpc.declare({
	object: 'system',
	method: 'info'
});

var callGetUnixtime = rpc.declare({
	object: 'luci',
	method: 'getUnixtime',
	expect: { result: 0 }
});

return baseclass.extend({

	params: [],

	load: function() {
		return Promise.all([
			network.getWANNetworks(),
			L.resolveDefault(callSystemBoard(), {}),
			L.resolveDefault(callSystemInfo(), {}),
			L.resolveDefault(callGetUnixtime(), 0),
			uci.load('system'),
			L.resolveDefault(fs.trimmed('/sys/class/thermal/thermal_zone0/temp'), '0')
		]);
	},

	renderRow: function(title, value, className, tag) {
		tag = tag || 'p';
		className = className || '';
		return E(tag, { 'class': 'mt-2' }, [
			E('span', {}, [ title + '：' ]),
			E('span', { 'class': className }, [ value ])
		]);
	},

	renderArrayAsTable: function(title, values) {
		var table = E('table', { 'class': 'table' });

		if (Array.isArray(values) && values.length > 0) {
			values.forEach(function(val) {
				table.appendChild(E('tr', {}, [
					E('td', {}, [ title + '：' ]),
					E('td', {}, [ val ])
				]));
			});
		} else {
			table.appendChild(E('tr', {}, [
				E('td', {}, [ title + '：' ]),
				E('td', {}, [ '-' ])
			]));
		}

		return table;
	},

	renderHtml: function(data, type) {
		var icon = type;
		var title = 'router' == type ? _('System') : _('Internet');
		var container_wapper = E('div', { 'class': type + '-status-self dashboard-bg box-s1'});
		var container_box = E('div', { 'class': type + '-status-info'});
		var container_item = E('div', { 'class': 'settings-info'});

		if ('internet' == type) {
			icon = data.v4.connected.value ? type : 'not-internet';
		}

		container_box.appendChild(E('div', { 'class': 'title'}, [
			E('img', {
				'src': L.resource('view/shouye/icons/' + icon + '.svg'),
				'width': 'router' == type ? 64 : 54,
				'title': title,
				'class': (type == 'router' || icon == 'not-internet') ? 'middle svgmonotone' : 'middle'
			}),
			E('h3', title)
		]));

		container_box.appendChild(E('hr'));

		if ('internet' == type) {
			var container_internet_v4 = E('div');

			for (var ver in data.v4) {
				var classname = ver;
				var visible = data.v4[ver].visible;

				if ('connected' === ver) {
					classname = data.v4[ver].value ? 'label label-success' : 'label label-danger';
					data.v4[ver].value = data.v4[ver].value ? _('yes') : _('no');
				}

				if ('title' === ver) {
					container_internet_v4.appendChild(
						E('p', { 'class': 'mt-2'}, [
							E('span', {'class': ''}, [ data.v4.title ])
						])
					);
					continue;
				}

				if ('addrsv4' === ver) {
					var addrs = data.v4[ver].value;
					if (Array.isArray(addrs) && addrs.length) {
						for (var ip in addrs) {
							data.v4[ver].value = addrs[ip].split('/')[0];
						}
					}
				}

				if (visible) {
					if (['dnsv4', 'addrsv4'].indexOf(ver) !== -1 && Array.isArray(data.v4[ver].value)) {
						container_internet_v4.appendChild(this.renderArrayAsTable(data.v4[ver].title, data.v4[ver].value));
					} else {
						container_internet_v4.appendChild(this.renderRow(data.v4[ver].title, data.v4[ver].value, classname));
					}
				}
			}

			container_item.appendChild(container_internet_v4);
		} else {
			for (var idx in data) {
				container_item.appendChild(
					E('p', { 'class': 'mt-2'}, [
						E('span', {'class': ''}, [ data[idx].title + '：' ]),
						E('span', {'class': ''}, [ data[idx].value ])
					])
				);
			}
		}

		container_box.appendChild(container_item);
		container_box.appendChild(E('hr'));
		container_wapper.appendChild(container_box);
		return container_wapper;
	},

	renderUpdateWanData: function(data) {
		var min_metric = 2000000000;
		var min_metric_i = 0;
		for (var i = 0; i < data.length; i++) {
			var metric = data[i].getMetric();
			if (metric < min_metric) {
				min_metric = metric;
				min_metric_i = i;
			}
		}

		var ifc = data[min_metric_i];
		if (ifc) {
			var uptime = ifc.getUptime();
			this.params.internet.v4.uptime.value = (uptime > 0) ? '%t'.format(uptime) : '-';
			this.params.internet.v4.protocol.value = ifc.getI18n() || E('em', _('Not connected'));
			this.params.internet.v4.gatewayv4.value = ifc.getGatewayAddr() || '0.0.0.0';
			this.params.internet.v4.connected.value = ifc.isUp();
			this.params.internet.v4.addrsv4.value = ifc.getIPAddrs() || [ '-'];
			this.params.internet.v4.dnsv4.value = ifc.getDNSAddrs() || [ '-' ];
		}
	},

	renderInternetBox: function(data) {
		this.params.internet = {
			v4: {
				title: _('IPv4 Internet'),
				connected: {
					title: _('Connected'),
					visible: true,
					value: false
				},
				uptime: {
					title: _('Uptime'),
					visible: true,
					value: '-' 
				},
				protocol: {
					title: _('Protocol'),
					visible: true,
					value: '-' 
				},
				addrsv4: {
					title: _('IPv4'),
					visible: true,
					value: [ '-' ]
				},
				gatewayv4: {
					title: _('GatewayV4'),
					visible: true,
					value: '-' 
				},
				dnsv4: {
					title: _('DNSv4'),
					visible: true,
					value: ['-']
				}
			}
		};

		this.renderUpdateWanData(data[0]);

		return this.renderHtml(this.params.internet, 'internet');
	},

	renderRouterBox: function(data) {
		var boardinfo = data[1];
		var systeminfo = data[2];
		var unixtime = data[3];
		var cputemp = data[5] ? (parseInt(data[5]) / 1000).toFixed(1) + ' °C' : null;

		var datestr = null;

		if (unixtime && !isNaN(unixtime) && unixtime > 0) {
			try {
				var date = new Date(unixtime * 1000);
				var zn = uci.get('system', '@system[0]', 'zonename') ? uci.get('system', '@system[0]', 'zonename').replaceAll(' ', '_') : 'UTC';
				var ts = uci.get('system', '@system[0]', 'clock_timestyle') || 0;
				var hc = uci.get('system', '@system[0]', 'clock_hourcycle') || 0;

				datestr = new Intl.DateTimeFormat(undefined, {
					dateStyle: 'medium',
					timeStyle: (ts == 0) ? 'long' : 'full',
					hourCycle: (hc == 0) ? undefined : hc,
					timeZone: zn
				}).format(date);
			} catch (e) {
				datestr = '-';
			}
		}

		this.params.router = {
			uptime: {
				title: _('Uptime'),
				value: systeminfo.uptime ? '%t'.format(systeminfo.uptime) : null
			},
			localtime: {
				title: _('Local Time'),
				value: datestr
			},
			model: {
				title: _('Model'),
				value: boardinfo.model
			},
			cputemp: {
				title: _('CPU 温度'),
				value: cputemp
			},
			system: {
				title: _('Architecture'),
				value: boardinfo.system
			},
			kernel: {
				title: _('Kernel Version'),
				value: boardinfo.kernel
			},
			release: {
				title: _('Firmware Version'),
				value: boardinfo.release ? boardinfo.release.description : null
			}
		};

		return this.renderHtml(this.params.router, 'router');
	},

	render: function(data) {
		return [this.renderInternetBox(data), this.renderRouterBox(data)];
	}
});