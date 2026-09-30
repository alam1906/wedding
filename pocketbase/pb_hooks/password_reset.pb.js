onMailerRecordPasswordResetSend(function (e) {
	// Never derive the destination from Origin/Host or client-provided redirect URLs.
	var appUrl = String($os.getenv('WEDEZ_APP_URL') || 'https://wedez.id').replace(/\/+$/, '');
	if (
		!/^https:\/\/[^\s<>"'?#]+$/.test(appUrl) &&
		!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(appUrl)
	) {
		throw new Error('WEDEZ_APP_URL tidak valid untuk pemulihan kata sandi.');
	}
	var resetUrl = appUrl + '/reset-password#token=' + encodeURIComponent(e.meta.token);
	e.message.subject = 'Atur ulang kata sandi Wedez';
	e.message.html =
		'<p>Halo,</p><p>Klik tautan berikut untuk mengatur ulang kata sandi akun Wedez Anda:</p>' +
		'<p><a href="' +
		resetUrl +
		'">Atur ulang kata sandi</a></p>' +
		'<p>Jika Anda tidak meminta pemulihan kata sandi, abaikan email ini.</p>';
	e.message.text =
		'Atur ulang kata sandi Wedez: ' +
		resetUrl +
		'\nJika Anda tidak meminta pemulihan, abaikan email ini.';
	e.next();
}, 'users');
