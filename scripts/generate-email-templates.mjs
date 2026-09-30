import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { format } from 'prettier';

const output = fileURLToPath(new URL('../pocketbase/email-templates/', import.meta.url));
const nativeLink = (action) => `{APP_URL}/_/#/auth/${action}/{TOKEN}`;
const templates = [
	{
		id: 'verification',
		name: 'Verifikasi email',
		field: 'verificationTemplate',
		subject: 'Satu langkah lagi — verifikasi email Anda di Wedez',
		preheader: 'Konfirmasikan email Anda dan mulai merangkai undangan untuk hari istimewa.',
		label: 'SELAMAT DATANG',
		title: 'Cerita indah dimulai<br />dari sini.',
		intro:
			'Terima kasih sudah bergabung dengan Wedez. Sebelum mulai membuat undangan, mari pastikan alamat email Anda sudah benar.',
		action: 'Verifikasi email saya',
		url: nativeLink('confirm-verification'),
		note: 'Jika Anda tidak membuat akun Wedez, abaikan email ini. Anda tidak perlu melakukan tindakan apa pun.'
	},
	{
		id: 'password-reset',
		name: 'Reset kata sandi',
		field: 'resetPasswordTemplate',
		subject: 'Atur ulang kata sandi akun Wedez Anda',
		preheader: 'Gunakan tautan ini untuk membuat kata sandi baru.',
		label: 'PEMULIHAN AKUN',
		title: 'Kembali ke akun<br />Anda.',
		intro:
			'Kami menerima permintaan untuk mengatur ulang kata sandi akun Wedez Anda. Klik tombol di bawah untuk membuat kata sandi baru.',
		action: 'Buat kata sandi baru',
		url: nativeLink('confirm-password-reset'),
		note: 'Tidak meminta perubahan ini? Abaikan email ini. Kata sandi Anda tidak berubah sampai proses pengaturan ulang selesai.'
	},
	{
		id: 'email-change',
		name: 'Konfirmasi perubahan email',
		field: 'confirmEmailChangeTemplate',
		subject: 'Konfirmasikan alamat email baru akun Wedez Anda',
		preheader: 'Selesaikan perubahan alamat email akun Anda.',
		label: 'PENGATURAN AKUN',
		title: 'Email baru.<br />Cerita yang sama.',
		intro:
			'Alamat ini dipilih sebagai email baru akun Wedez Anda. Konfirmasikan perubahan tersebut agar akun Anda menggunakan alamat email ini.',
		action: 'Konfirmasi email baru',
		url: nativeLink('confirm-email-change'),
		note: 'Jika Anda tidak meminta perubahan email, abaikan pesan ini dan periksa keamanan akun Anda. Jangan teruskan tautan ini kepada orang lain.'
	},
	{
		id: 'otp',
		name: 'Kode OTP',
		field: 'otp.emailTemplate',
		subject: 'Kode masuk sekali pakai untuk akun Wedez Anda',
		preheader: 'Kode sekali pakai untuk melanjutkan proses masuk ke akun Anda.',
		label: 'KODE MASUK',
		title: 'Satu kode untuk<br />melanjutkan.',
		intro:
			'Masukkan kode berikut pada layar yang meminta kode verifikasi Wedez. Kode ini hanya dapat digunakan sekali.',
		code: '{OTP}',
		note: 'Jangan bagikan kode ini kepada siapa pun, termasuk pihak yang mengaku dari Wedez. Jika Anda tidak meminta kode, abaikan email ini.'
	},
	{
		id: 'auth-alert',
		name: 'Peringatan login baru',
		field: 'authAlert.emailTemplate',
		subject: 'Ada aktivitas masuk baru di akun Wedez Anda',
		preheader: 'Periksa aktivitas masuk ini untuk memastikan akun Anda tetap aman.',
		label: 'KEAMANAN AKUN',
		title: 'Apakah ini<br />Anda?',
		intro:
			'Kami mendeteksi aktivitas masuk ke akun Wedez Anda dari lokasi atau perangkat baru. Berikut informasi yang tercatat:',
		detail: '{ALERT_INFO}',
		action: 'Amankan akun saya',
		url: 'https://wedez.id/forgot-password',
		note: 'Jika ini Anda, tidak ada tindakan yang diperlukan. Jika Anda tidak mengenali aktivitas ini, segera atur ulang kata sandi untuk mengamankan akun Anda.'
	},
	{
		id: 'welcome',
		name: 'Selamat datang (tambahan)',
		field: null,
		subject: 'Selamat datang di Wedez — mari mulai cerita Anda',
		preheader: 'Akun Anda siap. Mulai merangkai undangan untuk hari istimewa.',
		label: 'AWAL CERITA ANDA',
		title: 'Hari istimewa Anda,<br />dirangkai dengan indah.',
		intro:
			'Selamat datang di Wedez. Dari memilih tema hingga membagikan undangan, mari siapkan setiap detail kecil yang membuat hari Anda terasa lebih personal.',
		steps: [
			'Pilih tema yang mencerminkan cerita Anda.',
			'Lengkapi nama, jadwal, dan detail acara.',
			'Bagikan undangan kepada orang-orang tersayang.'
		],
		action: 'Mulai membuat undangan',
		url: 'https://wedez.id/user/dashboard',
		note: 'Simpan email ini sebagai awal perjalanan Anda bersama Wedez. Anda dapat melanjutkan pengaturan undangan kapan saja dari dashboard.'
	}
];

const body = (item) => {
	const special = item.code
		? `<tr><td style="padding:4px 28px 26px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" bgcolor="#f4efff" style="padding:24px 12px;border:1px solid #e4d8ff;border-radius:12px;color:#7200e8;font-family:Consolas,'Courier New',monospace;font-size:32px;font-weight:700;letter-spacing:5px;line-height:44px;word-break:break-all;">${item.code}</td></tr></table><p style="margin:12px 0 0;color:#787080;font-size:12px;line-height:20px;text-align:center;">Kode berlaku terbatas. Jika kedaluwarsa, minta kode baru.</p></td></tr>`
		: item.detail
			? `<tr><td style="padding:0 28px 24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td bgcolor="#f5f2fa" style="padding:18px;border:1px solid #e9e1f2;border-radius:12px;"><p style="margin:0 0 8px;color:#797080;font-size:11px;font-weight:700;letter-spacing:1px;line-height:18px;">DETAIL AKTIVITAS</p><p style="margin:0;color:#3f364b;font-size:14px;line-height:24px;overflow-wrap:anywhere;word-break:break-word;">${item.detail}</p></td></tr></table></td></tr>`
			: item.steps
				? `<tr><td style="padding:0 28px 24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${item.steps.map((step, index) => `<tr><td width="30" valign="top" style="padding:8px 0;color:#7200e8;font-size:14px;font-weight:700;line-height:22px;">0${index + 1}</td><td style="padding:8px 0;color:#5f566a;font-size:14px;line-height:22px;">${step}</td></tr>`).join('')}</table></td></tr>`
				: '';
	const action = item.action
		? `<tr><td style="padding:0 28px 26px;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center" bgcolor="#7200e8" style="border-radius:10px;mso-padding-alt:15px 24px;"><a href="${item.url}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:15px 24px;color:#ffffff;font-size:15px;font-weight:700;line-height:22px;text-decoration:none;border-radius:10px;">${item.action}&nbsp;&nbsp;&#8594;</a></td></tr></table></td></tr>`
		: '';
	const fallback = item.url?.includes('{TOKEN}')
		? `<tr><td style="padding:0 28px 26px;"><p style="margin:0 0 8px;color:#80778a;font-size:12px;line-height:20px;">Tombol tidak terbuka? Salin tautan berikut ke browser Anda:</p><p style="margin:0;font-size:12px;line-height:20px;overflow-wrap:anywhere;word-break:break-all;"><a href="${item.url}" target="_blank" rel="noopener noreferrer" style="color:#7200e8;text-decoration:underline;">${item.url}</a></p></td></tr>`
		: '';
	return `<div style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;mso-hide:all;">${item.preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f4f1fa" style="width:100%;background-color:#f4f1fa;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center" style="padding:28px 12px;">
    <!--[if mso]><table role="presentation" width="560" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;">
      <tr><td style="padding:0 6px 22px;">
        <a href="https://wedez.id" style="color:#7200e8;font-size:25px;font-weight:700;letter-spacing:-1px;line-height:32px;text-decoration:none;">wedez.id<span style="color:#a89ab7;font-size:15px;letter-spacing:0;">&nbsp; &#10022;</span></a>
        <p style="margin:4px 0 0;color:#81768d;font-size:11px;letter-spacing:1px;line-height:18px;">UNTUK CERITA YANG BERARTI</p>
      </td></tr>
      <tr><td bgcolor="#ffffff" style="background-color:#ffffff;border:1px solid #e9e0f3;border-radius:18px;overflow:hidden;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td height="4" bgcolor="#7200e8" style="height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>
          <tr><td style="padding:30px 28px 14px;"><p style="margin:0;color:#8a52c5;font-size:11px;font-weight:700;letter-spacing:1.6px;line-height:18px;">${item.label}</p></td></tr>
          <tr><td style="padding:0 28px 20px;"><h1 style="margin:0;color:#281638;font-family:Arial,Helvetica,sans-serif;font-size:30px;font-weight:700;letter-spacing:-0.8px;line-height:38px;">${item.title}</h1></td></tr>
          <tr><td style="padding:0 28px 24px;"><p style="margin:0 0 12px;color:#3f334b;font-size:15px;font-weight:700;line-height:24px;">Halo,</p><p style="margin:0;color:#66596f;font-size:15px;line-height:26px;">${item.intro}</p></td></tr>
          ${special}
          ${action}
          ${fallback}
          <tr><td style="padding:0 28px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td height="1" bgcolor="#eee8f4" style="height:1px;font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>
          <tr><td style="padding:20px 28px 28px;"><p style="margin:0;color:#83788c;font-size:12px;line-height:21px;">${item.note}</p></td></tr>
        </table>
      </td></tr>
      <tr><td align="center" style="padding:22px 12px 0;"><p style="margin:0;color:#81768d;font-size:12px;line-height:20px;">Dengan hangat,<br /><strong style="color:#655571;">Tim Wedez</strong></p><p style="margin:12px 0 0;color:#a295af;font-size:10px;line-height:18px;">Email otomatis dari Wedez. Tidak perlu membalas email ini.</p></td></tr>
    </table>
    <!--[if mso]></td></tr></table><![endif]-->
  </td></tr>
</table>`;
};

const formatContent = (content, parser) =>
	format(content, {
		parser,
		useTabs: true,
		singleQuote: true,
		trailingComma: 'none',
		printWidth: 100
	});
const emailTemplates = await Promise.all(
	templates.map(async (item) => ({ ...item, body: await formatContent(body(item), 'html') }))
);
const bundled = JSON.stringify(emailTemplates).replaceAll('<', '\\u003c');
const preview = `<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Template email Wedez</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f7f6fa;color:#281638;font:14px/1.6 Arial,Helvetica,sans-serif}header{padding:28px 24px;border-bottom:1px solid #e7e0ef;background:white}main{max-width:1120px;margin:30px auto;padding:0 24px;display:grid;grid-template-columns:300px minmax(0,1fr);gap:32px}h1{margin:0;font-size:24px;letter-spacing:-.6px}p{margin:8px 0;color:#756b80}label{display:block;font-size:12px;font-weight:bold;margin:20px 0 6px}select,button{font:inherit;border:1px solid #dcd2e8;border-radius:10px;padding:11px 12px;background:white;color:#4b355c;cursor:pointer}select{width:100%}button.primary{background:#7200e8;color:white;border-color:#7200e8}button:focus-visible,select:focus-visible{outline:3px solid #cbb5f7;outline-offset:3px}.buttons{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}.subject{font-size:16px;font-weight:bold;line-height:1.5;overflow-wrap:anywhere}.note{font-size:12px;border-top:1px solid #e7e0ef;margin-top:22px;padding-top:14px}iframe{display:block;width:100%;height:1000px;border:1px solid #e7e0ef;border-radius:12px;background:white;margin:auto}.viewport{overflow:auto;min-width:0}#status{min-height:24px;color:#7200e8;margin-top:10px;font-size:12px}#field{font-family:monospace;font-size:12px;color:#7200e8;overflow-wrap:anywhere}.widths{margin:0 0 12px;display:flex;gap:8px;justify-content:flex-end}@media(max-width:760px){main{grid-template-columns:1fr;gap:20px;padding:0 14px;margin-top:16px}header{padding:18px}iframe{height:1150px}.widths{justify-content:flex-start}}
</style></head><body><header><h1>Template email Wedez <span style="color:#9400ff">✦</span></h1><p>Subject dan Body siap disalin ke PocketBase. Pratinjau memakai data contoh, bukan token asli.</p></header><main><aside><label for="template">Jenis email</label><select id="template"></select><label>Subject</label><div class="subject" id="subject"></div><label>Field PocketBase</label><div id="field"></div><div class="buttons"><button id="copy-subject">Salin Subject</button><button class="primary" id="copy-body">Salin Body HTML</button></div><div id="status" role="status" aria-live="polite"></div><p class="note" id="notice"></p><p class="note">Isi body adalah fragmen HTML untuk wrapper email PocketBase. Layout tabel dan CSS inline tidak memerlukan gambar atau font eksternal.</p></aside><section class="viewport"><div class="widths"><button data-width="100%">Desktop</button><button data-width="375px">375 px</button></div><iframe title="Pratinjau email" sandbox=""></iframe></section></main><script>
const templates=${bundled};
const selector=document.getElementById('template');
const frame=document.querySelector('iframe');
const samples={'{APP_URL}':'https://api.wedez.id','{APP_NAME}':'Wedez','{TOKEN}':'contoh-token-pratinjau','{OTP}':'48261957','{ALERT_INFO}':'Chrome · macOS · IP 203.0.113.24'};
const sample=(text)=>Object.entries(samples).reduce((result,[key,value])=>result.replaceAll(key,value),text);
for(const item of templates){const option=document.createElement('option');option.value=item.id;option.textContent=item.name;selector.append(option)}
const current=()=>templates.find(item=>item.id===selector.value);
const params=new URLSearchParams(location.search);if(templates.some(item=>item.id===params.get('template')))selector.value=params.get('template');if(params.get('width')==='375px')frame.style.width='375px';
function render(){const item=current();document.getElementById('subject').textContent=item.subject;document.getElementById('field').textContent=item.field||'Tambahan — tidak tersedia sebagai field bawaan';document.getElementById('notice').textContent=item.id==='password-reset'?'Project memiliki hook password_reset.pb.js yang menimpa Subject dan Body email ini. Menempel template ke PocketBase saja belum mengubah email yang dikirim hook.':item.id==='welcome'?'Template selamat datang memerlukan pengiriman khusus. PocketBase tidak mengirimnya otomatis setelah registrasi.':item.id==='auth-alert'?'Placeholder {ALERT_INFO} hanya tersedia pada email peringatan login baru. Tombol keamanan menuju halaman pemulihan Wedez produksi.':'Simpan Subject dan Body pada field di atas. {APP_URL} mengikuti Application URL PocketBase untuk environment yang digunakan.';frame.srcdoc='<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:20px 30px;background:white;font-family:Arial,Helvetica,sans-serif;">'+sample(item.body)+'</body></html>';document.getElementById('status').textContent=''}
async function copy(text,label){document.getElementById('copy-fallback')?.remove();let copied=false;if(navigator.clipboard)copied=await navigator.clipboard.writeText(text).then(()=>true,()=>false);if(!copied){const input=document.createElement('textarea');input.id='copy-fallback';input.value=text;input.readOnly=true;input.setAttribute('aria-label',label+' untuk disalin manual');input.style.cssText='position:fixed;top:0;left:0;opacity:0;width:1px;height:1px;';document.getElementById('status').after(input);input.focus();input.select();try{copied=document.execCommand('copy')}catch{copied=false}if(copied){input.remove()}else{input.style.cssText='width:100%;height:150px;margin:8px 0;border:1px solid #dcd2e8;border-radius:8px;padding:10px;font:12px monospace;';input.focus();input.select()}}document.getElementById('status').textContent=copied?label+' berhasil disalin.':'Teks sudah dipilih. Tekan Cmd+C (Mac) atau Ctrl+C untuk menyalin.'}
document.getElementById('copy-subject').onclick=()=>copy(current().subject,'Subject');document.getElementById('copy-body').onclick=()=>copy(current().body,'Body HTML');selector.onchange=render;document.querySelectorAll('[data-width]').forEach(button=>button.onclick=()=>frame.style.width=button.dataset.width);render();
</script></body></html>`;

await mkdir(output, { recursive: true });
for (const item of emailTemplates) {
	await writeFile(`${output}${item.id}.html`, item.body);
}
await writeFile(
	`${output}subjects.json`,
	await formatContent(
		JSON.stringify(Object.fromEntries(emailTemplates.map((item) => [item.id, item.subject]))),
		'json'
	)
);
await writeFile(
	`${output}templates.json`,
	await formatContent(
		JSON.stringify(
			emailTemplates.map(({ id, name, field, subject, body }) => ({
				id,
				name,
				field,
				subject,
				body
			})),
			null,
			2
		),
		'json'
	)
);
await writeFile(`${output}preview.html`, await formatContent(preview, 'html'));
console.log(
	`Created ${emailTemplates.length} templates and preview in pocketbase/email-templates/`
);
