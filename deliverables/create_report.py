from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from xml.sax.saxutils import escape
from xml.etree import ElementTree as ET
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).parent
NAVY, TEAL, MUTED = '17324D', '007F86', '536579'

# Standalone architecture illustration; every label is based on the source tree.
im = Image.new('RGB', (1500, 770), '#f4f7fb')
d = ImageDraw.Draw(im)
font_path = 'C:/Windows/Fonts/arial.ttf'
bold_path = 'C:/Windows/Fonts/arialbd.ttf'
def font(size, bold=False): return ImageFont.truetype(bold_path if bold else font_path, size)
def box(rect, title, lines, color='#17324d'):
    d.rounded_rectangle(rect, radius=18, fill='white', outline=color, width=3)
    x,y,_,_ = rect
    d.text((x+22,y+18), title, font=font(27, True), fill=color)
    for i,line in enumerate(lines): d.text((x+22,y+60+i*33), line, font=font(23), fill='#34465a')
def arrow(start,end):
    d.line((start,end), fill='#007f86', width=5)
    x,y=end
    if end[0] != start[0]: d.polygon([(x,y),(x-14,y-9),(x-14,y+9)], fill='#007f86')
    else: d.polygon([(x,y),(x-9,y-14),(x+9,y-14)], fill='#007f86')
d.text((30,20), 'KIẾN TRÚC ĐÃ TRIỂN KHAI', font=font(29,True), fill='#17324d')
box((30,85,450,265),'TRÌNH DUYỆT',['React + Vite + Tailwind CSS','Giao diện quản lý, gọi REST API','Chế độ phát triển: cổng 5173'])
box((530,85,1020,265),'BACKEND TRÊN MÁY MSI',['Node.js + Express, cổng 4000','JWT, RBAC, nghiệp vụ, Prisma','Nhận file JSON; tạo tác vụ Nmap'])
box((1100,85,1470,265),'LƯU TRỮ',['SQLite: dữ liệu nghiệp vụ','ScanJob: lịch sử quét','Backup .db + SHA-256'])
arrow((450,175),(530,175)); arrow((1020,175),(1100,175))
box((530,330,1020,475),'NMAP TRÊN MÁY BACKEND',['D:/nmap/nmap.exe','Quét TCP / nhận diện dịch vụ'], '#007f86')
arrow((775,265),(775,330))
d.text((30,510),'LUỒNG DETECT DỰ KIẾN — CHƯA TÍCH HỢP TRONG WEB',font=font(27,True),fill='#9a5b00')
box((30,565,450,725),'WINDOWS 11 ẢO',['Wazuh Agent','Thu thập sự kiện máy Windows'], '#9a5b00')
box((530,565,1020,725),'UBUNTU SERVER',['Wazuh Manager phân tích','Custom integration gửi cảnh báo'], '#9a5b00')
box((1100,565,1470,725),'API NHẬN TRÊN MSI',['Cần xây dựng webhook','Xác thực, lưu, chống trùng'], '#9a5b00')
arrow((450,645),(530,645)); arrow((1020,645),(1100,645))
diagram = OUT / 'kien_truc_secureweb.png'
im.save(diagram)

body = []
def run(text, bold=False, color=None, size=None):
    props = ('<w:b/>' if bold else '') + (f'<w:color w:val="{color}"/>' if color else '') + (f'<w:sz w:val="{size}"/>' if size else '')
    return f'<w:r><w:rPr>{props}</w:rPr><w:t xml:space="preserve">{escape(str(text))}</w:t></w:r>'
def p(text='', style=None, bold=False, color=None, size=None):
    body.append(f'<w:p><w:pPr>{f"<w:pStyle w:val=\"{style}\"/>" if style else ""}</w:pPr>{run(text,bold,color,size)}</w:p>')
def heading(text): p(text,'Heading1')
def sub(text): p(text,'Heading2')
def bullet(text): p('•  '+text)
def note(text): p(text,'Note')
def page(): body.append('<w:p><w:r><w:br w:type="page"/></w:r></w:p>')
def table(headers, rows, widths=None):
    widths = widths or [int(9600/len(headers))]*len(headers)
    xml = '<w:tbl><w:tblPr><w:tblW w:w="9600" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders>'
    for edge in ['top','left','bottom','right','insideH','insideV']: xml += f'<w:{edge} w:val="single" w:sz="4" w:color="D9E2EC"/>'
    xml += '</w:tblBorders><w:tblCellMar><w:top w:w="90" w:type="dxa"/><w:left w:w="110" w:type="dxa"/><w:bottom w:w="90" w:type="dxa"/><w:right w:w="110" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>'
    xml += ''.join(f'<w:gridCol w:w="{width}"/>' for width in widths) + '</w:tblGrid>'
    for n,row in enumerate([headers]+rows):
        xml += '<w:tr><w:trPr><w:cantSplit/>' + ('<w:tblHeader/>' if n==0 else '') + '</w:trPr>'
        for i,cell in enumerate(row):
            shade = NAVY if n==0 else ('F1F5F9' if n%2 else 'FFFFFF')
            xml += f'<w:tc><w:tcPr><w:tcW w:w="{widths[i]}" w:type="dxa"/><w:shd w:fill="{shade}"/></w:tcPr><w:p><w:pPr><w:spacing w:after="30"/></w:pPr>{run(cell,n==0,"FFFFFF" if n==0 else NAVY,20)}</w:p></w:tc>'
        xml += '</w:tr>'
    body.append(xml+'</w:tbl>')
    p()
def source(text): p('Đối chiếu mã nguồn: '+text,'Source')

p('SECUREWEB', 'Title')
p('BÁO CÁO MÔ TẢ DỰ ÁN', 'Subtitle')
p('HỆ THỐNG QUẢN LÝ AN TOÀN THÔNG TIN', 'Subtitle')
p('Kiến trúc • Chức năng đã triển khai • Khoảng trống hiện tại', 'Lead')
p()
table(['Thuộc tính','Nội dung'],[
    ['Phạm vi','Phiên bản mã nguồn tại D:\\BTANM; bao gồm quét Nmap trực tiếp vừa bổ sung.'],
    ['Ngày lập','16/11/2026 — múi giờ Asia/Bangkok'],
    ['Cách phân nhóm','Identify, Protect, Detect, Respond, Recover theo cách tổ chức CSF 1.1 trong dự án.'],
    ['Mục đích','Dùng để trình bày dự án, đánh giá mức độ hoàn thiện và định hướng phát triển.'],
], [2100,7500])
note('Tài liệu phản ánh mã nguồn và các kiểm thử đã ghi nhận trong quá trình phát triển. Chưa phải kết quả kiểm toán độc lập hoặc chứng nhận tuân thủ. Không chứa mật khẩu, token hay nội dung file .env.')
sub('Nội dung tài liệu')
for s in ['01  Tổng quan và mức độ hoàn thiện', '02  Kiến trúc và luồng dữ liệu', '03–07  Đánh giá chi tiết 5 nhóm chức năng', '08  Các phần còn thiếu và lộ trình', '09  Kiểm thử, nghiệm thu và nguồn đối chiếu']: p(s)

page(); heading('01  Tổng quan dự án')
p('SecureWeb là ứng dụng web quản lý thông tin an ninh tập trung cho môi trường học tập, thử nghiệm và mô hình mạng nhỏ. Hệ thống tập hợp tài sản, phát hiện bảo mật, rủi ro, cảnh báo, sự cố, nhật ký và bản sao lưu vào cùng một giao diện.')
p('Giá trị chính của dự án là kết nối dữ liệu nghiệp vụ với quy trình quản lý: biết tài sản nào cần bảo vệ, phát hiện nào cần xử lý, ai đã thực hiện hành động và dữ liệu nào đã được sao lưu. Dự án chưa thay thế đầy đủ SIEM, IDS/IPS, firewall hoặc giải pháp phục hồi chuyên dụng.')
sub('Người sử dụng và màn hình chính')
bullet('Vai trò trong mã nguồn: Admin, Security Analyst, IT Manager và User. Quyền thực tế phụ thuộc từng API; không phải mọi vai trò đều được thao tác trên tất cả màn hình.')
bullet('Các màn hình: SOC Dashboard, Tài sản, Lỗ hổng, Rủi ro, Nhật ký kiểm toán, Cảnh báo, Sự cố, Tích hợp bảo mật, Sao lưu & Phục hồi, Báo cáo và tổng quan NIST.')
sub('Tóm tắt mức độ hoàn thiện')
table(['Nhóm','Đã có','Giới hạn chính'],[
 ['Identify','Quản lý tài sản/rủi ro; nhập báo cáo; chạy Nmap thật.','Chưa chạy tự động Nessus/OpenVAS/ZAP; cổng mở không đồng nghĩa lỗ hổng.'],
 ['Protect','Đăng nhập, băm mật khẩu, JWT, phân quyền, khóa đăng nhập.','Chưa tích hợp firewall/VPN/AD; còn khoảng trống quản lý phiên.'],
 ['Detect','Audit log, cảnh báo nội bộ; mô phỏng nguồn bên ngoài.','Chưa có bộ nhận cảnh báo thật từ Wazuh/Grafana/Snort.'],
 ['Respond','Hồ sơ sự cố, lịch sử xử lý, chuyển trạng thái.','Chặn IP/cô lập mới dừng ở thông tin và trạng thái trong DB.'],
 ['Recover','Tạo backup SQLite thật, checksum, lịch sử phục hồi.','Khôi phục mới mô phỏng; chưa thay thế DB đang chạy.'],
], [1300,4100,4200])
source('client/src/layouts/DashboardLayout.jsx; server/src/routes/*; server/src/services/*.')

page(); heading('02  Kiến trúc hệ thống')
body.append('<w:p><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="6096000" cy="3129280"/><wp:docPr id="1" name="Kiến trúc SecureWeb" descr="Kiến trúc hiện tại và luồng Wazuh dự kiến"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="1" name="kien_truc_secureweb.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdImage"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="6096000" cy="3129280"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>')
table(['Tầng','Công nghệ và trách nhiệm'],[
 ['Giao diện','React, Vite, React Router, Tailwind CSS, Recharts; Axios gọi API và gửi JWT.'],
 ['API / nghiệp vụ','Node.js, Express; phân lớp route → controller/service → Prisma; Zod kiểm tra đầu vào; Helmet, CORS và rate limiting.'],
 ['Dữ liệu','SQLite qua Prisma: User/Role, Asset, Vulnerability, Risk, Alert, SecurityEvent, Incident/Action, AuditLog, Backup/RecoveryHistory, Integration, ScanJob.'],
 ['Quét ngoài tiến trình','Backend gọi executable Nmap bằng spawn, shell:false; theo dõi stdout/stderr và lưu tác vụ.'],
], [2100,7500])
sub('Các luồng hoạt động chính')
bullet('Nhập file: trình duyệt đọc/chuẩn hóa báo cáo → JSON findings → API kiểm tra dữ liệu → lưu phát hiện → tải lại thống kê.')
bullet('Quét ngay: chọn tài sản/cổng → tạo ScanJob → Nmap chạy nền → đọc kết quả → lưu phát hiện và lịch sử trong transaction → giao diện lấy trạng thái mỗi 5 giây.')
note('Luồng Wazuh trong hình là thiết kế dự kiến. Chưa xác nhận Agent/Manager đã được cài và kết nối thành công; API nhận cảnh báo Wazuh chưa được xây dựng trong phiên bản này.')
source('server/src/app.js; server/prisma/schema.prisma; server/src/services/nmapScanService.js; client/src/services/api.js.')

page(); heading('03  Identify — Nhận diện')
p('Mục tiêu: quản lý tài sản, ghi nhận phát hiện bảo mật và hỗ trợ ưu tiên rủi ro theo tài sản bị ảnh hưởng.')
sub('Những phần đã thực hiện')
bullet('Quản lý tài sản với tên/mã, loại, IP, hệ điều hành, chủ sở hữu, trạng thái và mức quan trọng; liên kết với phát hiện, rủi ro và sự cố.')
bullet('Quản lý phát hiện: tạo/sửa/xóa, tìm kiếm và lọc theo mức độ, trạng thái, tài sản; lưu CVE/CWE, CVSS, mô tả và khuyến nghị khi dữ liệu có cung cấp.')
bullet('Đánh giá rủi ro dựa trên khả năng xảy ra và mức ảnh hưởng; theo dõi biện pháp xử lý và trạng thái.')
table(['Công cụ','Định dạng nhập đã hỗ trợ'],[
 ['Nmap','.txt dạng -oN; .json theo cấu trúc target/ports hoặc hosts mà ứng dụng quy định.'],
 ['Nessus','.nessus hoặc .xml theo Nessus v2.'],
 ['OpenVAS / Greenbone','.xml chứa results/result theo cấu trúc bộ đọc hiện tại.'],
 ['OWASP ZAP','.json dạng Traditional JSON với site và alerts.'],
], [2200,7400])
sub('Quét Nmap trực tiếp đã chạy thật')
bullet('Chọn một tài sản có IPv4 và tối đa 100 cổng TCP; thực thi Nmap tại D:/nmap/nmap.exe trên máy backend. Không nhận câu lệnh tùy ý từ người dùng.')
bullet('Mỗi backend chạy một tác vụ tại một thời điểm; thời gian tối đa 150 giây. Có tiến trình theo bước, nhật ký, 30 lần quét gần nhất và tải TXT; lịch sử cũ vẫn giữ trong DB.')
bullet('Kết quả được tự lưu ở mức Info. Một lần quét thành công không thấy cổng mở vẫn lưu lịch sử với 0 phát hiện.')
sub('Phần còn thiếu')
p('Chưa tự chạy Nessus/OpenVAS/ZAP, chưa có quét định kỳ hoặc hàng đợi nhiều worker. Nhập file chỉ hỗ trợ một mục tiêu/file, tối đa 2 MB; JSON Nmap không phải mọi biến thể JSON đều đọc được. Quét lại tạo bộ phát hiện mới, chưa chống trùng hoặc tự xác nhận đã vá. Cần thêm kiểm thử XML bằng báo cáo thực tế.')
note('Nmap -sV nhận diện dịch vụ; một cổng đang mở hoặc một banner phiên bản chưa đủ để khẳng định có CVE. Tổng số trên trang lỗ hổng hiện bao gồm cả phát hiện Info.')
source('assetService.js; vulnerabilityService.js; riskService.js; nmapScanService.js; client/src/utils/parseScanReport.js; parseNmapReport.js.')

page(); heading('04  Protect — Bảo vệ')
p('Mục tiêu hiện tại tập trung vào bảo vệ truy cập ứng dụng và kiểm soát thao tác với dữ liệu nghiệp vụ.')
sub('Những phần đã thực hiện')
bullet('Đăng ký tài khoản, chuẩn hóa email, băm mật khẩu bằng thư viện Argon2; đăng nhập cấp JWT và gắn token vào yêu cầu API.')
bullet('Phân quyền phía backend theo vai trò; giao diện ẩn/hiện thao tác tương ứng. Các chức năng như xóa dữ liệu, quét, backup có kiểm tra quyền ở route.')
bullet('Kiểm tra dữ liệu bằng Zod; Helmet thêm header bảo mật; CORS quản lý origin; giới hạn request chung cho /api là 200 yêu cầu/15 phút.')
sub('Quy tắc khóa đăng nhập mới')
table(['Tình huống','Hành vi'],[
 ['Sai 1–4 lần','Tăng bộ đếm và trả thông báo số lần sai. Mật khẩu sai ngắn vẫn được đếm nếu không rỗng và qua validation.'],
 ['Sai lần thứ 5 đầu tiên','Khóa đăng nhập 5 phút; lưu thời điểm hết khóa và lịch sử đã khóa.'],
 ['Thử trong thời gian khóa','Từ chối cả mật khẩu đúng; không cộng tiếp số lần sai.'],
 ['Hết 5 phút','Cho phép thử lại. Đăng nhập đúng xóa bộ đếm liên tiếp, giữ lịch sử khóa lần đầu.'],
 ['Đợt sai đủ 5 lần tiếp theo','Đặt isActive=false: khóa vĩnh viễn hoặc đến khi quản trị viên can thiệp.'],
], [2700,6900])
sub('Phần còn thiếu')
bullet('Chưa tích hợp cấu hình firewall, VPN/IPSec, Radius, Kerberos hoặc Active Directory/Domain Controller.')
bullet('Chưa có MFA, quy trình quên mật khẩu và quy trình mở khóa tài khoản hoàn chỉnh trên giao diện.')
bullet('Middleware xác thực JWT hiện chưa kiểm tra trạng thái khóa của tài khoản cho mọi request; token đã phát hành có thể còn dùng đến khi hết hạn. Chưa có cơ chế thu hồi phiên tập trung.')
bullet('Token đang lưu trong localStorage; triển khai thực tế cần đánh giá quản lý phiên, HTTPS và cấu hình secret. Rate limit dùng chung chưa thay thế kiểm soát đăng nhập chuyên biệt.')
source('authService.js; middleware/auth.js; validators/authValidator.js; app.js; client/src/services/api.js.')

page(); heading('05  Detect — Phát hiện')
p('Mục tiêu: ghi nhận sự kiện và cảnh báo, giúp người quản trị nhận biết vấn đề đang phát sinh. Phiên bản hiện tại có khả năng theo dõi bên trong ứng dụng nhưng chưa hoàn thiện tiếp nhận cảnh báo bên ngoài.')
sub('Những phần đã thực hiện')
bullet('Ghi AuditLog cho nhiều thao tác: đăng ký/đăng nhập, quản lý dữ liệu, quét, nhập báo cáo, backup và xử lý sự cố.')
bullet('Quản lý Alert và SecurityEvent: nguồn, mức độ, mô tả, IP và trạng thái; tổng hợp số liệu trên Dashboard.')
bullet('Khi tạo/nhập phát hiện Critical, backend có thể tạo cảnh báo và sự kiện. Sự cố High/Critical cũng có luồng tạo sự kiện nội bộ.')
bullet('Quản lý danh sách tích hợp, loại, endpoint và cấu hình. Hàm simulateEvent tạo sự kiện và cảnh báo mô phỏng để trình diễn luồng giao diện.')
sub('Điểm cần phân biệt khi thuyết trình')
table(['Có thật trong phiên bản này','Chưa có'],[
 ['Nhật ký thao tác và cảnh báo sinh bởi nghiệp vụ web.','Thu thập tự động sự kiện hệ điều hành Windows/Linux.'],
 ['Khai báo một tích hợp tên Wazuh hoặc Grafana.','Kết nối thật, xác thực nguồn và nhận sự kiện từ Wazuh/Grafana/Snort.'],
 ['Bấm mô phỏng để tạo cảnh báo thử.','Phát hiện độc lập dấu hiệu tấn công trong lưu lượng mạng.'],
], [4800,4800])
sub('Thiết kế tiếp theo với Wazuh')
p('Windows 11 ảo cài Agent → Ubuntu Server chạy Manager → custom integration gửi JSON qua HTTP(S) → API tiếp nhận trên máy MSI → lưu sự kiện/cảnh báo → hiển thị trên web. Đây là phương án tích hợp tiếp theo, chưa phải cấu hình đã hoàn tất.')
p('Backend cần thêm webhook có xác thực, ánh xạ rule/level/agent, nhận diện bản tin trùng, ghi thời điểm sự kiện và kết quả tiếp nhận. Script gửi cần timeout, retry và lưu lỗi. Linux phải truy cập được cổng backend; ping thành công không phải điều kiện bắt buộc.')
note('Chưa có dữ liệu chứng minh hệ thống hiện đã nhận được một cảnh báo Wazuh thật từ máy Windows 11.')
source('integrationService.js: simulateEvent; vulnerabilityService.js; incidentService.js; auditService.js; middleware/audit.js.')

page(); heading('06  Respond — Ứng phó')
p('Mục tiêu: quản lý vòng đời sự cố, trách nhiệm xử lý và bằng chứng về các thao tác ứng phó.')
sub('Những phần đã thực hiện')
bullet('Tạo/sửa/xóa hồ sơ sự cố với tiêu đề, mô tả, loại, mức độ, tài sản, người phụ trách và hướng giải quyết.')
bullet('Quản lý các trạng thái new, investigating, contained, resolved, closed; lưu lịch sử hành động, người thao tác và thời gian.')
bullet('Có các thao tác ứng phó theo mẫu và ghi nhật ký kiểm toán; quyền tạo/cập nhật và quyền phản ứng được kiểm soát theo API.')
sub('Tác động thực tế của các nút hiện tại')
table(['Thao tác','Code đang thực hiện','Chưa thực hiện'],[
 ['QUARANTINE_ASSET','Đổi status của Asset thành offline; chuyển sự cố sang contained và lưu hành động.','Không tắt card mạng, không đổi VLAN và không cô lập thiết bị ngoài đời thực.'],
 ['BLOCK_IP','Ghi nội dung chặn IP vào lịch sử; chuyển sự cố sang contained.','Không gọi API firewall hoặc chạy lệnh chặn IP trên hệ điều hành.'],
 ['RESOLVE_INCIDENT','Chuyển trạng thái resolved; lưu ghi chú, nội dung giải quyết và thời điểm kết thúc.','Không tự vá lỗ hổng hoặc kiểm chứng rằng nguyên nhân đã được loại bỏ.'],
], [2300,3650,3650])
sub('Phần còn thiếu')
bullet('Connector tới firewall, WAF, EDR hoặc Wazuh Active Response để thi hành hành động thật.')
bullet('Kiểm tra kết quả sau thi hành: luật đã tồn tại chưa, lưu lượng đã bị chặn chưa, thiết bị còn truy cập được không.')
bullet('Playbook có điều kiện, cơ chế phê duyệt thao tác nhạy cảm, rollback và xử lý khi thao tác thực tế thất bại.')
bullet('Liên kết tự động cảnh báo → sự cố → hành động, cùng SLA và thông báo cho người phụ trách.')
note('Thông báo “đã chặn IP” hoặc “đã cô lập” trên giao diện hiện chưa phải bằng chứng ngăn chặn mạng thật. Khi trình diễn cần mô tả đúng đây là quản lý quy trình và trạng thái.')
source('server/src/services/incidentService.js: executeResponseAction; server/src/routes/incidentRoutes.js.')

page(); heading('07  Recover — Phục hồi')
p('Mục tiêu: lưu bản sao dữ liệu và hỗ trợ theo dõi quá trình phục hồi sau sự cố. Phải tách biệt khả năng sao lưu đã có với khả năng phục hồi dữ liệu đang còn thiếu.')
sub('Những phần đã thực hiện')
bullet('Tạo file sao lưu cơ sở dữ liệu SQLite bằng VACUUM INTO; lưu tên, vị trí, dung lượng, người tạo, thời gian và trạng thái.')
bullet('Tính SHA-256 khi tạo backup và so sánh checksum khi kiểm tra; phát hiện file bị thay đổi khi có checksum đã lưu.')
bullet('Kiểm tra file tồn tại, trạng thái bản sao và checksum trước quy trình phục hồi; từ chối file không khớp checksum.')
bullet('Quản lý danh sách backup, xóa bản sao và lưu RecoveryHistory; có phân quyền cho Admin/IT Manager theo từng thao tác.')
sub('Cách khôi phục hiện tại hoạt động')
p('restoreBackup xác minh điều kiện rồi tạo bản ghi RecoveryHistory với status="simulated". Hàm trả thông báo mô phỏng; không thay thế file DB đang chạy, không nạp lại dữ liệu nghiệp vụ và không khởi động lại kết nối để phục hồi thật.')
table(['Khả năng','Đánh giá'],[
 ['Tạo file backup','Đã triển khai thực tế trong code.'],
 ['Kiểm tra toàn vẹn file','Có SHA-256; không đồng nghĩa đã thử phục hồi thành công.'],
 ['Phục hồi dữ liệu','Chưa triển khai thật; hiện chỉ ghi lịch sử mô phỏng.'],
 ['Dự phòng / HA','Chưa có failover, cân bằng tải hoặc nhân bản cơ sở dữ liệu.'],
], [3400,6200])
sub('Phần còn thiếu')
bullet('Quy trình restore thật có bảo trì, đóng kết nối DB, sao lưu trạng thái trước phục hồi, khôi phục và kiểm tra sau phục hồi.')
bullet('Lịch backup tự động, chính sách giữ bản sao, bản sao ngoài máy/off-site, mã hóa và kiểm soát quyền file.')
bullet('Đo RPO/RTO và diễn tập: tạo dữ liệu A → backup → sửa thành B → phục hồi → xác nhận trở về A.')
bullet('Đường dẫn DB trong backupService đang cố định theo thư mục dự án; cần đồng bộ với DATABASE_URL khi đổi môi trường triển khai.')
source('server/src/services/backupService.js; server/tests/backup-recovery.test.js; server/prisma/schema.prisma.')

page(); heading('08  Khoảng trống và lộ trình hoàn thiện')
table(['Ưu tiên','Hạng mục','Tiêu chí hoàn thành'],[
 ['1 — Detect','API nhận cảnh báo Wazuh thật; script gửi từ Manager; xác thực, chống trùng và ghi log lỗi.','Một sự kiện trên Win11 tạo cảnh báo ở Manager và tự xuất hiện trên web, không bấm mô phỏng.'],
 ['1 — Recover','Restore dữ liệu thật và diễn tập trên bản sao môi trường.','Khôi phục DB từ B về A, kiểm tra dữ liệu, kết nối và thời gian phục hồi.'],
 ['1 — Protect','Kiểm tra khóa tài khoản trên request; thu hồi phiên, MFA và quản trị mở khóa.','Token của tài khoản bị khóa không tiếp tục gọi API được; mở khóa có nhật ký.'],
 ['2 — Respond','Thực thi một hành động chặn IP thật qua công cụ được quản lý.','Có bằng chứng luật được áp dụng và kết nối thử bị chặn; có gỡ luật/rollback.'],
 ['2 — Identify','Chuẩn hóa kết quả và chống trùng; lịch quét; thêm connector cho máy quét khác.','Quét lặp không làm tăng trùng phát hiện; có định danh nguồn và lịch sử từng lần.'],
 ['2 — Báo cáo','Bỏ nhãn tuân thủ gắn cứng, thêm trạng thái và bằng chứng theo chức năng.','Báo cáo thể hiện rõ đã làm, mô phỏng, chưa làm và lần kiểm thử gần nhất.'],
 ['3 — Vận hành','HTTPS, secret management, giám sát tác vụ, backup ngoài máy và thử tải.','Có hướng dẫn triển khai và giám sát; kiểm thử theo cấu hình vận hành thực tế.'],
], [1600,3700,4300])
sub('Những giới hạn cần công bố khi báo cáo dự án')
bullet('reportService đang gắn cứng complianceStatus="100% Implemented" cho cả 5 nhóm và monitoringIntegrations=4. Những giá trị này chưa phản ánh mức độ tích hợp thực tế.')
bullet('Điểm Security Posture là công thức nội bộ dựa trên số lượng bản ghi; không phải điểm đánh giá hay chứng nhận chính thức của NIST.')
bullet('Đồ án tổ chức theo 5 nhóm CSF 1.1. Việc ánh xạ menu/nhãn chức năng chỉ giúp trình bày, không tự chứng minh đạt toàn bộ yêu cầu của khung.')
note('Đánh giá tổng thể: có nền tảng quản lý tập trung, bảo vệ ứng dụng cơ bản và quét Nmap thật; còn cần tích hợp nguồn phát hiện, tác động ứng phó và phục hồi dữ liệu thực tế để hoàn thiện chu trình.')

page(); heading('09  Kiểm thử và nguồn đối chiếu')
sub('Kết quả đã ghi nhận trong quá trình phát triển')
table(['Hạng mục','Bằng chứng / phạm vi'],[
 ['Nmap backend','7 kiểm thử đạt: kiểm tra đầu vào, đọc kết quả, lưu trạng thái, nhánh thất bại, thiếu executable, chặn chạy đồng thời và quét một HTTP service tạm trên localhost.'],
 ['Bộ đọc báo cáo','9 kiểm thử đạt cho Nmap TXT/JSON, ZAP và chặn khai báo XML ENTITY/DOCTYPE. Chưa chứng minh bộ đọc Nessus/OpenVAS tương thích tất cả file thực tế.'],
 ['Khóa đăng nhập','Bài test service đã đạt: khóa 5 phút lần đầu, không cộng lỗi lúc đang khóa, đăng nhập đúng sau hết khóa và khóa vĩnh viễn ở đợt sai tiếp theo.'],
 ['Frontend','Build thành công; lint thành phần quét Nmap mới thành công. Chưa có bộ test trình duyệt đầy đủ cho toàn bộ hệ thống.'],
 ['Backup / RBAC','Có mã test trong server/tests. Tài liệu không tuyên bố cả bộ backend đã được chạy lại và đạt; test backup hiện kiểm tra toàn vẹn/từ chối file hỏng, không kiểm chứng restore thật.'],
], [2200,7400])
sub('Kịch bản nghiệm thu đề xuất')
bullet('Identify: nhập hoặc quét tài sản thử → kiểm tra tổng số, bản ghi và lịch sử sau khi tải lại trang.')
bullet('Protect: test tài khoản riêng qua 2 đợt sai; dùng User gọi API đặc quyền và kiểm tra HTTP 403.')
bullet('Detect: hiện có thể test nhật ký và mô phỏng; sau tích hợp cần phát sinh sự kiện thật trên Agent và theo dấu tới web.')
bullet('Respond: hiện kiểm tra trạng thái/hành động; khi nối firewall cần kiểm tra kết nối mạng trước và sau chặn.')
bullet('Recover: kiểm tra file/checksum; chỉ đánh dấu restore hoàn thành khi dữ liệu thật quay về trạng thái bản sao.')
sub('Nguồn và phạm vi rà soát')
p('Nguồn chính là mã nguồn hiện tại: server/prisma/schema.prisma; server/src/services/{auth,asset,vulnerability,risk,integration,incident,backup,report,nmapScan}Service.js; middleware/auth.js; client/src/pages/VulnerabilityPage.jsx; client/src/utils/parse*Report.js; các file test trong server/tests và client/src/utils. Tài liệu không suy diễn rằng môi trường Wazuh bên ngoài đã triển khai xong.', 'Source')
p('Tham khảo triển khai Wazuh Manager và custom integration (thiết kế tương lai):', 'Source')
p('https://documentation.wazuh.com/current/installation-guide/wazuh-server/index.html', 'Source')
p('https://documentation.wazuh.com/current/user-manual/manager/integration-with-external-apis.html', 'Source')
note('Khuyến nghị khi bảo vệ đồ án: trình diễn bằng dữ liệu thử, kèm ảnh trước/sau, trạng thái API và nhật ký. Không sử dụng nhãn “100%” thay cho bằng chứng kiểm thử.')

NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"'
document = f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document {NS}><w:body>'+''.join(body)+'<w:sectPr><w:headerReference w:type="default" r:id="rIdHeader"/><w:footerReference w:type="default" r:id="rIdFooter"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1000" w:right="1100" w:bottom="1000" w:left="1100" w:header="420" w:footer="420"/></w:sectPr></w:body></w:document>'
styles = f'''<?xml version="1.0" encoding="UTF-8"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="22"/><w:color w:val="253B50"/><w:lang w:val="vi-VN"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="100" w:line="280" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="80" w:after="220"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:color w:val="{NAVY}"/><w:sz w:val="34"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="170" w:after="90"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:color w:val="{TEAL}"/><w:sz w:val="25"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:pPr><w:spacing w:before="800" w:after="240"/></w:pPr><w:rPr><w:b/><w:sz w:val="64"/><w:color w:val="{NAVY}"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="{TEAL}"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Lead"><w:name w:val="Lead"/><w:rPr><w:sz w:val="24"/><w:color w:val="{MUTED}"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Note"><w:name w:val="Note"/><w:pPr><w:spacing w:before="100" w:after="120"/><w:shd w:fill="EDF5F6"/><w:ind w:left="120" w:right="120"/></w:pPr><w:rPr><w:sz w:val="20"/><w:color w:val="{TEAL}"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Source"><w:name w:val="Source"/><w:rPr><w:sz w:val="18"/><w:color w:val="{MUTED}"/></w:rPr></w:style>
</w:styles>'''
header = f'<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:spacing w:after="0"/></w:pPr>{run("SECUREWEB  |  MÔ TẢ DỰ ÁN VÀ HIỆN TRẠNG",True,MUTED,17)}</w:p></w:hdr>'
footer = f'<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:jc w:val="right"/></w:pPr>{run("16/11/2026  •  Trang ",False,MUTED,17)}<w:fldSimple w:instr="PAGE"/>{run(" / ",False,MUTED,17)}<w:fldSimple w:instr="NUMPAGES"/></w:p></w:ftr>'
rels = '''<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdHeader" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/><Relationship Id="rIdFooter" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/><Relationship Id="rIdImage" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/architecture.png"/></Relationships>'''
types = '''<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>'''
rootrels = '''<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>'''
core = '''<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>SecureWeb — Mô tả dự án, kiến trúc và hiện trạng 5 nhóm chức năng</dc:title><dc:creator>SecureWeb</dc:creator><dc:description>Đối chiếu mã nguồn ngày 16/11/2026; phân biệt thực tế, mô phỏng và phần còn thiếu.</dc:description></cp:coreProperties>'''
files = {'[Content_Types].xml':types,'_rels/.rels':rootrels,'word/document.xml':document,'word/styles.xml':styles,'word/_rels/document.xml.rels':rels,'word/header1.xml':header,'word/footer1.xml':footer,'docProps/core.xml':core}
path = OUT / 'Bao_cao_du_an_SecureWeb.docx'
with ZipFile(path,'w',ZIP_DEFLATED) as z:
    for name,content in files.items():
        ET.fromstring(content)
        z.writestr(name,content.encode('utf-8'))
    z.write(diagram,'word/media/architecture.png')
with ZipFile(path) as z:
    assert z.testzip() is None
    root = ET.fromstring(z.read('word/document.xml'))
    ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    text = '\n'.join(node.text or '' for node in root.findall('.//w:t',ns))
    for term in ['Identify','Protect','Detect','Respond','Recover','simulated','100% Implemented']:
        assert term in text, term
    (OUT/'Bao_cao_du_an_SecureWeb_noi_dung.txt').write_text(text,encoding='utf-8')
print(f'Created: {path}; {path.stat().st_size:,} bytes; XML/ZIP validation OK; 10 planned pages')
