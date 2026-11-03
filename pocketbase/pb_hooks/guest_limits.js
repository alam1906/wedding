var FREE_GUEST_LIMIT = 30;

function guestQuota(app, wedding) {
	var count = new DynamicModel({ total: 0 });
	app
		.db()
		.newQuery('SELECT COUNT(*) AS total FROM guests WHERE wedding = {:wedding}')
		.bind({ wedding: wedding.id })
		.one(count);
	var tier = wedding.getString('plan_tier') === 'pro' ? 'pro' : 'free';
	return { plan_tier: tier, total: count.total, limit: tier === 'pro' ? null : FREE_GUEST_LIMIT };
}

function enforceGuestQuota(e) {
	// Updating an existing invitation/RSVP must work even for legacy Free
	// weddings that already exceed the limit. Moving it consumes a new slot.
	if (
		!e.record.isNew() &&
		e.record.getString('wedding') === e.record.original().getString('wedding')
	) {
		return e.next();
	}
	var originalApp = e.app;
	try {
		// Serialize the count and INSERT together, including nested CSV batches.
		// Always pass txApp onward so the actual save uses the same transaction.
		originalApp.runInTransaction(function (txApp) {
			e.app = txApp;
			var wedding = txApp.findRecordById('weddings', e.record.getString('wedding'));
			if (
				wedding.getString('plan_tier') !== 'pro' &&
				guestQuota(txApp, wedding).total >= FREE_GUEST_LIMIT
			) {
				throw new BadRequestError('Batas tamu paket Free tercapai.', {
					wedding: new ValidationError(
						'guest_limit_reached',
						'Paket Free maksimal ' + FREE_GUEST_LIMIT + ' tamu. Upgrade ke Pro untuk menambah tamu.'
					)
				});
			}
			e.next();
		});
	} finally {
		e.app = originalApp;
	}
}

module.exports = { guestQuota: guestQuota, enforceGuestQuota: enforceGuestQuota };
