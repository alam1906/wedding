/// <reference path="../pb_data/types.d.ts" />

migrate(
	(app) => {
		const users = app.findCollectionByNameOrId('users');
		const payments = app.findCollectionByNameOrId('payments');
		const own = '@request.auth.id != "" && user = @request.auth.id';
		const ownAffiliate = '@request.auth.id != "" && affiliate.user = @request.auth.id';
		const dates = () => [
			new AutodateField({ name: 'created', onCreate: true }),
			new AutodateField({ name: 'updated', onCreate: true, onUpdate: true })
		];
		const text = (name, max = 120) => new TextField({ name, max });
		const money = (name, required = false) =>
			new NumberField({ name, onlyInt: true, min: 0, max: 9007199254740991, required });
		const relation = (name, collectionId, required = true) =>
			new RelationField({ name, collectionId, maxSelect: 1, required, cascadeDelete: false });
		const bank = () => [text('bank_name', 80), text('account_number', 40), text('account_name')];
		const base = (name, rule, fields, indexes) => {
			const collection = new Collection({
				name,
				type: 'base',
				listRule: rule,
				viewRule: rule,
				createRule: null,
				updateRule: null,
				deleteRule: null,
				indexes
			});
			for (const field of [...fields, ...dates()]) collection.fields.add(field);
			return collection;
		};

		users.fields.add(
			new SelectField({ name: 'signup_intent', maxSelect: 1, values: ['wedding', 'affiliate'] })
		);
		users.updateRule = '(' + users.updateRule + ') && @request.body.signup_intent:changed = false';
		app.save(users);

		const affiliates = base(
			'affiliates',
			own,
			[
				relation('user', users.id),
				new TextField({ name: 'code', required: true, min: 6, max: 6, pattern: '^[A-Z0-9]{6}$' }),
				new SelectField({
					name: 'status',
					required: true,
					maxSelect: 1,
					values: ['pending', 'active', 'rejected', 'suspended']
				}),
				...bank()
			],
			[
				'CREATE UNIQUE INDEX `idx_affiliates_user` ON `affiliates` (`user`)',
				'CREATE UNIQUE INDEX `idx_affiliates_code` ON `affiliates` (`code`)'
			]
		);
		app.save(affiliates);

		const commissions = base(
			'affiliate_commissions',
			ownAffiliate,
			[
				relation('affiliate', affiliates.id),
				relation('payment', payments.id),
				money('amount', true),
				new SelectField({
					name: 'status',
					required: true,
					maxSelect: 1,
					values: ['available', 'reserved', 'paid', 'void']
				}),
				new DateField({ name: 'paid_at' }),
				text('void_reason', 500)
			],
			[
				'CREATE UNIQUE INDEX `idx_affiliate_commissions_payment` ON `affiliate_commissions` (`payment`)',
				'CREATE INDEX `idx_affiliate_commissions_balance` ON `affiliate_commissions` (`affiliate`, `status`)'
			]
		);
		app.save(commissions);

		const payouts = base(
			'affiliate_payouts',
			ownAffiliate,
			[
				relation('affiliate', affiliates.id),
				new RelationField({
					name: 'commissions',
					collectionId: commissions.id,
					required: true,
					maxSelect: 10000,
					cascadeDelete: false
				}),
				money('amount', true),
				new SelectField({
					name: 'status',
					required: true,
					maxSelect: 1,
					values: ['requested', 'processing', 'paid', 'rejected', 'failed']
				}),
				...bank(),
				text('transfer_reference', 200),
				new DateField({ name: 'paid_at' }),
				text('note', 500)
			],
			[
				"CREATE UNIQUE INDEX `idx_affiliate_payouts_active` ON `affiliate_payouts` (`affiliate`) WHERE `status` = 'requested' OR `status` = 'processing'",
				'CREATE INDEX `idx_affiliate_payouts_history` ON `affiliate_payouts` (`affiliate`, `created`)'
			]
		);
		app.save(payouts);

		payments.fields.add(relation('affiliate', affiliates.id, false));
		payments.fields.add(text('coupon_code', 6));
		for (const name of ['original_amount', 'discount_amount', 'commission_amount'])
			payments.fields.add(money(name));
		for (const name of ['discount_percent', 'commission_percent']) {
			payments.fields.add(new NumberField({ name, onlyInt: true, min: 0, max: 100 }));
		}
		payments.fields.add(
			new SelectField({ name: 'commission_basis', maxSelect: 1, values: ['after_discount'] })
		);
		payments.fields.add(text('checkout_lock', 15));
		payments.indexes.push(
			"CREATE UNIQUE INDEX `idx_payments_checkout_lock` ON `payments` (`checkout_lock`) WHERE `checkout_lock` != ''"
		);
		payments.fields.getByName('wedding').cascadeDelete = false;
		app.save(payments);

		// Keep historical prices intact; never attribute old payments retroactively.
		app
			.db()
			.newQuery('UPDATE payments SET original_amount = amount WHERE original_amount = 0')
			.execute();
		const settings = app.settings();
		settings.rateLimits.enabled = true;
		settings.rateLimits.rules = [
			{ label: 'POST /api/wedez/payments/quote', duration: 60, maxRequests: 30 },
			{ label: 'POST /api/wedez/payments/session', duration: 60, maxRequests: 30 },
			{ label: 'POST /api/wedez/affiliate/payouts', duration: 60, maxRequests: 10 },
			...settings.rateLimits.rules
		];
		app.save(settings);
	},
	() => {
		throw new Error(
			'Migration affiliate menyimpan riwayat keuangan. Gunakan migration koreksi; jangan hapus ledger melalui rollback.'
		);
	}
);
