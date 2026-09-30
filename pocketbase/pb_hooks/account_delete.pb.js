routerAdd(
	'DELETE',
	'/api/wedez/account',
	function (e) {
		e.response.header().set('Cache-Control', 'no-store');
		var data = new DynamicModel({ confirmation: '' });
		e.bindBody(data);
		if (data.confirmation !== 'HAPUS') {
			throw new BadRequestError('Konfirmasi tidak sesuai. Ketik HAPUS untuk melanjutkan.');
		}
		var userId = e.auth.id;
		e.app.runInTransaction(function (txApp) {
			var user = txApp.findRecordById('users', userId);
			// Only the immutable owner relation decides which invitations are removed.
			var weddings = txApp.findRecordsByFilter('weddings', 'owner = {:user}', '', 0, 0, {
				user: userId
			});
			var affiliates = txApp.findRecordsByFilter('affiliates', 'user = {:user}', '', 0, 0, {
				user: userId
			});
			weddings.forEach(function (wedding) {
				if (
					txApp.countRecords('payments', $dbx.hashExp({ wedding: wedding.id, status: 'pending' })) >
					0
				) {
					throw new ApiError(
						409,
						'Masih ada pembayaran yang berjalan. Selesaikan pembayaran sebelum menghapus akun.'
					);
				}
			});
			affiliates.forEach(function (affiliate) {
				var id = affiliate.id;
				var unsettledCommissions = txApp.countRecords(
					'affiliate_commissions',
					$dbx.exp("affiliate = {:id} AND status IN ('available', 'reserved')", { id: id })
				);
				var activePayouts = txApp.countRecords(
					'affiliate_payouts',
					$dbx.exp("affiliate = {:id} AND status IN ('requested', 'processing')", { id: id })
				);
				var unpaidConversions = txApp.countRecords(
					'payments',
					$dbx.exp("affiliate = {:id} AND status != 'paid' AND commission_amount > 0", { id: id })
				);
				if (unsettledCommissions || activePayouts || unpaidConversions) {
					throw new ApiError(
						409,
						'Selesaikan pembayaran, komisi, dan pencairan affiliate sebelum menghapus akun. Hubungi admin jika perlu rekonsiliasi.'
					);
				}
			});

			weddings.forEach(function (wedding) {
				// Detach, never delete, immutable financial records. Use bounded batches
				// because each saved record stops matching this wedding filter.
				var payments;
				do {
					payments = txApp.findRecordsByFilter('payments', 'wedding = {:id}', '', 200, 0, {
						id: wedding.id
					});
					payments.forEach(function (payment) {
						payment.set('archived_wedding_id', wedding.id);
						payment.set('wedding', '');
						payment.set('checkout_lock', '');
						txApp.save(payment);
					});
				} while (payments.length);
			});
			affiliates.forEach(function (affiliate) {
				affiliate.set('status', 'suspended');
				affiliate.set('user', '');
				['bank_name', 'account_number', 'account_name'].forEach(function (key) {
					affiliate.set(key, '');
				});
				txApp.save(affiliate);
			});
			user.set('wedding_id', '');
			txApp.save(user);
			weddings.forEach(function (wedding) {
				// PocketBase cascades stories/guests and removes their stored files.
				txApp.delete(wedding);
			});
			txApp.delete(user);
		});
		return e.json(200, { success: true });
	},
	$apis.requireAuth('users'),
	$apis.bodyLimit(1024)
);

// Other deletion paths must not silently detach financial history without
// its original wedding reference (or bypass the pending-payment guard).
onRecordDelete(function (e) {
	if (e.app.countRecords('payments', $dbx.hashExp({ wedding: e.record.id })) > 0) {
		throw new BadRequestError('Gunakan alur hapus akun untuk undangan dengan riwayat pembayaran.');
	}
	e.next();
}, 'weddings');
