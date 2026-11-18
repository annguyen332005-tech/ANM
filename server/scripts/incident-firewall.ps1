param(
  [Parameter(Mandatory=$true)][ValidateSet('Block','Unblock')][string]$Operation,
  [Parameter(Mandatory=$true)][string]$RemoteIP,
  [Parameter(Mandatory=$true)][string]$LocalIP
)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
try {
  foreach ($value in @($RemoteIP, $LocalIP)) {
    $parsed = $null
    if (-not [System.Net.IPAddress]::TryParse($value, [ref]$parsed) -or $parsed.AddressFamily -ne [System.Net.Sockets.AddressFamily]::InterNetwork) { throw 'Invalid IPv4 address.' }
  }
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  if (-not ([Security.Principal.WindowsPrincipal]::new($identity)).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { throw 'ADMIN_REQUIRED: Restart backend from PowerShell Run as administrator.' }
  if (-not (Get-NetIPAddress -AddressFamily IPv4 -IPAddress $LocalIP -ErrorAction SilentlyContinue)) { throw 'LOCAL_IP_NOT_FOUND: FIREWALL_LOCAL_IP must belong to backend.' }
  $name = 'SecureWeb-Ping-' + $LocalIP.Replace('.','_') + '-From-' + $RemoteIP.Replace('.','_')
  $group = 'SecureWeb Incident Response'
  $existing = Get-NetFirewallRule -PolicyStore PersistentStore -Name $name -ErrorAction SilentlyContinue
  if ($existing -and $existing.Group -ne $group) { throw 'RULE_CONFLICT: Rule not owned by SecureWeb.' }
  if ($Operation -eq 'Unblock') {
    if ($existing) { Remove-NetFirewallRule -PolicyStore PersistentStore -Name $name }
    if (Get-NetFirewallRule -PolicyStore ActiveStore -Name $name -ErrorAction SilentlyContinue) { throw 'VERIFY_FAILED: Rule still exists.' }
    @{ success=$true; blocked=$false; ruleName=$name; remoteIP=$RemoteIP; localIP=$LocalIP } | ConvertTo-Json -Compress
    exit 0
  }
  if (Get-NetFirewallProfile -PolicyStore ActiveStore | Where-Object { $_.Enabled -eq $false }) { throw 'FIREWALL_DISABLED: Enable Windows Firewall profiles first.' }
  if ($existing) { Remove-NetFirewallRule -PolicyStore PersistentStore -Name $name }
  New-NetFirewallRule -PolicyStore PersistentStore -Name $name -DisplayName $name -Group $group -Direction Inbound -Action Block -Enabled True -Profile Any -Protocol ICMPv4 -IcmpType 8 -RemoteAddress $RemoteIP -LocalAddress $LocalIP | Out-Null
  $rule = Get-NetFirewallRule -PolicyStore ActiveStore -Name $name
  $address = $rule | Get-NetFirewallAddressFilter
  $port = $rule | Get-NetFirewallPortFilter
  if ($rule.Enabled -ne 'True' -or $rule.Action -ne 'Block' -or $rule.Direction -ne 'Inbound' -or $address.RemoteAddress -notcontains $RemoteIP -or $address.LocalAddress -notcontains $LocalIP -or $port.Protocol -notin @('ICMPv4','1') -or -not ($port.IcmpType | Where-Object { $_ -in @('8','8:*') })) { throw 'VERIFY_FAILED: ICMP rule not verified.' }
  @{ success=$true; blocked=$true; ruleName=$name; remoteIP=$RemoteIP; localIP=$LocalIP } | ConvertTo-Json -Compress
} catch {
  @{ success=$false; error=$_.Exception.Message } | ConvertTo-Json -Compress
  exit 1
}
