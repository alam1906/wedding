/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		const snapshot = [
			{
				createRule: null,
				deleteRule: null,
				fields: [
					{
						autogeneratePattern: '[a-z0-9]{15}',
						help: '',
						hidden: false,
						id: 'text3208210256',
						max: 15,
						min: 15,
						name: 'id',
						pattern: '^[a-z0-9]+$',
						presentable: false,
						primaryKey: true,
						required: true,
						system: true,
						type: 'text'
					},
					{
						autogeneratePattern: '',
						help: '',
						hidden: false,
						id: 'text455797646',
						max: 0,
						min: 0,
						name: 'collectionRef',
						pattern: '',
						presentable: false,
						primaryKey: false,
						required: true,
						system: true,
						type: 'text'
					},
					{
						autogeneratePattern: '',
						help: '',
						hidden: false,
						id: 'text127846527',
						max: 0,
						min: 0,
						name: 'recordRef',
						pattern: '',
						presentable: false,
						primaryKey: false,
						required: true,
						system: true,
						type: 'text'
					},
					{
						autogeneratePattern: '',
						help: '',
						hidden: false,
						id: 'text1582905952',
						max: 0,
						min: 0,
						name: 'method',
						pattern: '',
						presentable: false,
						primaryKey: false,
						required: true,
						system: true,
						type: 'text'
					},
					{
						hidden: false,
						id: 'autodate2990389176',
						name: 'created',
						onCreate: true,
						onUpdate: false,
						presentable: false,
						system: true,
						type: 'autodate'
					},
					{
						hidden: false,
						id: 'autodate3332085495',
						name: 'updated',
						onCreate: true,
						onUpdate: true,
						presentable: false,
						system: true,
						type: 'autodate'
					}
				],
				id: 'pbc_2279338944',
				indexes: [
					'CREATE INDEX `idx_mfas_collectionRef_recordRef` ON `_mfas` (collectionRef,recordRef)'
				],
				listRule:
					"@request.auth.id != '' && recordRef = @request.auth.id && collectionRef = @request.auth.collectionId",
				name: '_mfas',
				system: true,
				type: 'base',
				updateRule: null,
				viewRule:
					"@request.auth.id != '' && recordRef = @request.auth.id && collectionRef = @request.auth.collectionId"
			},
			{
				createRule: null,
				deleteRule: null,
				fields: [
					{
						autogeneratePattern: '[a-z0-9]{15}',
						help: '',
						hidden: false,
						id: 'text3208210256',
						max: 15,
						min: 15,
						name: 'id',
						pattern: '^[a-z0-9]+$',
						presentable: false,
						primaryKey: true,
						required: true,
						system: true,
						type: 'text'
					},
					{
						autogeneratePattern: '',
						help: '',
						hidden: false,
						id: 'text455797646',
						max: 0,
						min: 0,
						name: 'collectionRef',
						pattern: '',
						presentable: false,
						primaryKey: false,
						required: true,
						system: true,
						type: 'text'
					},
					{
						autogeneratePattern: '',
						help: '',
						hidden: false,
						id: 'text127846527',
						max: 0,
						min: 0,
						name: 'recordRef',
						pattern: '',
						presentable: false,
						primaryKey: false,
						required: true,
						system: true,
						type: 'text'
					},
					{
						cost: 8,
						help: '',
						hidden: true,
						id: 'password901924565',
						max: 0,
						min: 0,
						name: 'password',
						pattern: '',
						presentable: false,
						required: true,
						system: true,
						type: 'password'
					},
					{
						autogeneratePattern: '',
						help: '',
						hidden: true,
						id: 'text3866985172',
						max: 0,
						min: 0,
						name: 'sentTo',
						pattern: '',
						presentable: false,
						primaryKey: false,
						required: false,
						system: true,
						type: 'text'
					},
					{
						hidden: false,
						id: 'autodate2990389176',
						name: 'created',
						onCreate: true,
						onUpdate: false,
						presentable: false,
						system: true,
						type: 'autodate'
					},
					{
						hidden: false,
						id: 'autodate3332085495',
						name: 'updated',
						onCreate: true,
						onUpdate: true,
						presentable: false,
						system: true,
						type: 'autodate'
					}
				],
				id: 'pbc_1638494021',
				indexes: [
					'CREATE INDEX `idx_otps_collectionRef_recordRef` ON `_otps` (collectionRef, recordRef)'
				],
				listRule:
					"@request.auth.id != '' && recordRef = @request.auth.id && collectionRef = @request.auth.collectionId",
				name: '_otps',
				system: true,
				type: 'base',
				updateRule: null,
				viewRule:
					"@request.auth.id != '' && recordRef = @request.auth.id && collectionRef = @request.auth.collectionId"
			},
			{
				createRule: null,
				deleteRule:
					"@request.auth.id != '' && recordRef = @request.auth.id && collectionRef = @request.auth.collectionId",
				fields: [
					{
						autogeneratePattern: '[a-z0-9]{15}',
						help: '',
						hidden: false,
						id: 'text3208210256',
						max: 15,
						min: 15,
						name: 'id',
						pattern: '^[a-z0-9]+$',
						presentable: false,
						primaryKey: true,
						required: true,
						system: true,
						type: 'text'
					},
					{
						autogeneratePattern: '',
						help: '',
						hidden: false,
						id: 'text455797646',
						max: 0,
						min: 0,
						name: 'collectionRef',
						pattern: '',
						presentable: false,
						primaryKey: false,
						required: true,
						system: true,
						type: 'text'
					},
					{
						autogeneratePattern: '',
						help: '',
						hidden: false,
						id: 'text127846527',
						max: 0,
						min: 0,
						name: 'recordRef',
						pattern: '',
						presentable: false,
						primaryKey: false,
						required: true,
						system: true,
						type: 'text'
					},
					{
						autogeneratePattern: '',
						help: '',
						hidden: false,
						id: 'text2462348188',
						max: 0,
						min: 0,
						name: 'provider',
						pattern: '',
						presentable: false,
						primaryKey: false,
						required: true,
						system: true,
						type: 'text'
					},
					{
						autogeneratePattern: '',
						help: '',
						hidden: false,
						id: 'text1044722854',
						max: 0,
						min: 0,
						name: 'providerId',
						pattern: '',
						presentable: false,
						primaryKey: false,
						required: true,
						system: true,
						type: 'text'
					},
					{
						hidden: false,
						id: 'autodate2990389176',
						name: 'created',
						onCreate: true,
						onUpdate: false,
						presentable: false,
						system: true,
						type: 'autodate'
					},
					{
						hidden: false,
						id: 'autodate3332085495',
						name: 'updated',
						onCreate: true,
						onUpdate: true,
						presentable: false,
						system: true,
						type: 'autodate'
					}
				],
				id: 'pbc_2281828961',
				indexes: [
					'CREATE UNIQUE INDEX `idx_externalAuths_record_provider` ON `_externalAuths` (collectionRef, recordRef, provider)',
					'CREATE UNIQUE INDEX `idx_externalAuths_collection_provider` ON `_externalAuths` (collectionRef, provider, providerId)'
				],
				listRule:
					"@request.auth.id != '' && recordRef = @request.auth.id && collectionRef = @request.auth.collectionId",
				name: '_externalAuths',
				system: true,
				type: 'base',
				updateRule: null,
				viewRule:
					"@request.auth.id != '' && recordRef = @request.auth.id && collectionRef = @request.auth.collectionId"
			},
			{
				createRule: null,
				deleteRule:
					"@request.auth.id != '' && recordRef = @request.auth.id && collectionRef = @request.auth.collectionId",
				fields: [
					{
						autogeneratePattern: '[a-z0-9]{15}',
						help: '',
						hidden: false,
						id: 'text3208210256',
						max: 15,
						min: 15,
						name: 'id',
						pattern: '^[a-z0-9]+$',
						presentable: false,
						primaryKey: true,
						required: true,
						system: true,
						type: 'text'
					},
					{
						autogeneratePattern: '',
						help: '',
						hidden: false,
						id: 'text455797646',
						max: 0,
						min: 0,
						name: 'collectionRef',
						pattern: '',
						presentable: false,
						primaryKey: false,
						required: true,
						system: true,
						type: 'text'
					},
					{
						autogeneratePattern: '',
						help: '',
						hidden: false,
						id: 'text127846527',
						max: 0,
						min: 0,
						name: 'recordRef',
						pattern: '',
						presentable: false,
						primaryKey: false,
						required: true,
						system: true,
						type: 'text'
					},
					{
						autogeneratePattern: '',
						help: '',
						hidden: false,
						id: 'text4228609354',
						max: 0,
						min: 0,
						name: 'fingerprint',
						pattern: '',
						presentable: false,
						primaryKey: false,
						required: true,
						system: true,
						type: 'text'
					},
					{
						hidden: false,
						id: 'autodate2990389176',
						name: 'created',
						onCreate: true,
						onUpdate: false,
						presentable: false,
						system: true,
						type: 'autodate'
					},
					{
						hidden: false,
						id: 'autodate3332085495',
						name: 'updated',
						onCreate: true,
						onUpdate: true,
						presentable: false,
						system: true,
						type: 'autodate'
					}
				],
				id: 'pbc_4275539003',
				indexes: [
					'CREATE UNIQUE INDEX `idx_authOrigins_unique_pairs` ON `_authOrigins` (collectionRef, recordRef, fingerprint)'
				],
				listRule:
					"@request.auth.id != '' && recordRef = @request.auth.id && collectionRef = @request.auth.collectionId",
				name: '_authOrigins',
				system: true,
				type: 'base',
				updateRule: null,
				viewRule:
					"@request.auth.id != '' && recordRef = @request.auth.id && collectionRef = @request.auth.collectionId"
			},
			{
				authAlert: {
					emailTemplate: {
						body: "<p>Hello,</p>\n<p>We noticed a login to your {APP_NAME} account from a new location:</p>\n<p><em>{ALERT_INFO}</em></p>\n<p><strong>If this wasn't you, you should immediately change your {APP_NAME} account password to revoke access from all other locations.</strong></p>\n<p>If this was you, you may disregard this email.</p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>",
						subject: 'Login from a new location'
					},
					enabled: true
				},
				authRule: '',
				authToken: {
					duration: 86400
				},
				confirmEmailChangeTemplate: {
					body: '<p>Hello,</p>\n<p>Click on the button below to confirm your new email address.</p>\n<p>\n  <a class="btn" href="{APP_URL}/_/#/auth/confirm-email-change/{TOKEN}" target="_blank" rel="noopener">Confirm new email</a>\n</p>\n<p><i>If you didn\'t ask to change your email address, please ignore this email.</i></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>',
					subject: 'Confirm your {APP_NAME} new email address'
				},
				createRule: null,
				deleteRule: null,
				emailChangeToken: {
					duration: 1800
				},
				fields: [
					{
						autogeneratePattern: '[a-z0-9]{15}',
						help: '',
						hidden: false,
						id: 'text3208210256',
						max: 15,
						min: 15,
						name: 'id',
						pattern: '^[a-z0-9]+$',
						presentable: false,
						primaryKey: true,
						required: true,
						system: true,
						type: 'text'
					},
					{
						cost: 0,
						help: '',
						hidden: true,
						id: 'password901924565',
						max: 0,
						min: 8,
						name: 'password',
						pattern: '',
						presentable: false,
						required: true,
						system: true,
						type: 'password'
					},
					{
						autogeneratePattern: '[a-zA-Z0-9]{50}',
						help: '',
						hidden: true,
						id: 'text2504183744',
						max: 60,
						min: 30,
						name: 'tokenKey',
						pattern: '',
						presentable: false,
						primaryKey: false,
						required: true,
						system: true,
						type: 'text'
					},
					{
						exceptDomains: [],
						help: '',
						hidden: false,
						id: 'email3885137012',
						name: 'email',
						onlyDomains: [],
						presentable: false,
						required: true,
						system: true,
						type: 'email'
					},
					{
						help: '',
						hidden: false,
						id: 'bool1547992806',
						name: 'emailVisibility',
						presentable: false,
						required: false,
						system: true,
						type: 'bool'
					},
					{
						help: '',
						hidden: false,
						id: 'bool256245529',
						name: 'verified',
						presentable: false,
						required: false,
						system: true,
						type: 'bool'
					},
					{
						hidden: false,
						id: 'autodate2990389176',
						name: 'created',
						onCreate: true,
						onUpdate: false,
						presentable: false,
						system: true,
						type: 'autodate'
					},
					{
						hidden: false,
						id: 'autodate3332085495',
						name: 'updated',
						onCreate: true,
						onUpdate: true,
						presentable: false,
						system: true,
						type: 'autodate'
					}
				],
				fileToken: {
					duration: 180
				},
				id: 'pbc_3142635823',
				indexes: [
					'CREATE UNIQUE INDEX `idx_tokenKey_pbc_3142635823` ON `_superusers` (`tokenKey`)',
					"CREATE UNIQUE INDEX `idx_email_pbc_3142635823` ON `_superusers` (`email`) WHERE `email` != ''"
				],
				listRule: null,
				manageRule: null,
				mfa: {
					duration: 600,
					enabled: false,
					rule: ''
				},
				name: '_superusers',
				oauth2: {
					enabled: false,
					mappedFields: {
						avatarURL: '',
						id: '',
						name: '',
						username: ''
					}
				},
				otp: {
					duration: 180,
					emailTemplate: {
						body: "<p>Hello,</p>\n<p>Your one-time password is: <strong>{OTP}</strong></p>\n<p><i>If you didn't ask for the one-time password, you can ignore this email.</i></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>",
						subject: 'OTP for {APP_NAME}'
					},
					enabled: false,
					length: 8
				},
				passwordAuth: {
					enabled: true,
					identityFields: ['email']
				},
				passwordResetToken: {
					duration: 1800
				},
				resetPasswordTemplate: {
					body: '<p>Hello,</p>\n<p>Click on the button below to reset your password.</p>\n<p>\n  <a class="btn" href="{APP_URL}/_/#/auth/confirm-password-reset/{TOKEN}" target="_blank" rel="noopener">Reset password</a>\n</p>\n<p><i>If you didn\'t ask to reset your password, please ignore this email.</i></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>',
					subject: 'Reset your {APP_NAME} password'
				},
				system: true,
				type: 'auth',
				updateRule: null,
				verificationTemplate: {
					body: '<p>Hello,</p>\n<p>Thank you for joining us at {APP_NAME}.</p>\n<p>Click on the button below to verify your email address.</p>\n<p>\n  <a class="btn" href="{APP_URL}/_/#/auth/confirm-verification/{TOKEN}" target="_blank" rel="noopener">Verify</a>\n</p>\n<p><i>If you didn\'t recently register, please ignore this email.</i></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>',
					subject: 'Verify your {APP_NAME} email'
				},
				verificationToken: {
					duration: 86400
				},
				viewRule: null
			},
			{
				authAlert: {
					emailTemplate: {
						body: "<p>Hello,</p>\n<p>We noticed a login to your {APP_NAME} account from a new location:</p>\n<p><em>{ALERT_INFO}</em></p>\n<p><strong>If this wasn't you, you should immediately change your {APP_NAME} account password to revoke access from all other locations.</strong></p>\n<p>If this was you, you may disregard this email.</p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>",
						subject: 'Login from a new location'
					},
					enabled: true
				},
				authRule: '',
				authToken: {
					duration: 432000
				},
				confirmEmailChangeTemplate: {
					body: '<p>Hello,</p>\n<p>Click on the button below to confirm your new email address.</p>\n<p>\n  <a class="btn" href="{APP_URL}/_/#/auth/confirm-email-change/{TOKEN}" target="_blank" rel="noopener">Confirm new email</a>\n</p>\n<p><i>If you didn\'t ask to change your email address, please ignore this email.</i></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>',
					subject: 'Confirm your {APP_NAME} new email address'
				},
				createRule: '',
				deleteRule: 'id = @request.auth.id',
				emailChangeToken: {
					duration: 1800
				},
				fields: [
					{
						autogeneratePattern: '[a-z0-9]{15}',
						help: '',
						hidden: false,
						id: 'text3208210256',
						max: 15,
						min: 15,
						name: 'id',
						pattern: '^[a-z0-9]+$',
						presentable: false,
						primaryKey: true,
						required: true,
						system: true,
						type: 'text'
					},
					{
						cost: 0,
						help: '',
						hidden: true,
						id: 'password901924565',
						max: 0,
						min: 8,
						name: 'password',
						pattern: '',
						presentable: false,
						required: true,
						system: true,
						type: 'password'
					},
					{
						autogeneratePattern: '[a-zA-Z0-9]{50}',
						help: '',
						hidden: true,
						id: 'text2504183744',
						max: 60,
						min: 30,
						name: 'tokenKey',
						pattern: '',
						presentable: false,
						primaryKey: false,
						required: true,
						system: true,
						type: 'text'
					},
					{
						exceptDomains: [],
						help: '',
						hidden: false,
						id: 'email3885137012',
						name: 'email',
						onlyDomains: [],
						presentable: false,
						required: true,
						system: true,
						type: 'email'
					},
					{
						help: '',
						hidden: false,
						id: 'bool1547992806',
						name: 'emailVisibility',
						presentable: false,
						required: false,
						system: true,
						type: 'bool'
					},
					{
						help: '',
						hidden: false,
						id: 'bool256245529',
						name: 'verified',
						presentable: false,
						required: false,
						system: true,
						type: 'bool'
					},
					{
						autogeneratePattern: '',
						help: '',
						hidden: false,
						id: 'text1579384326',
						max: 255,
						min: 0,
						name: 'name',
						pattern: '',
						presentable: false,
						primaryKey: false,
						required: false,
						system: false,
						type: 'text'
					},
					{
						cascadeDelete: false,
						collectionId: 'pbc_1115120447',
						help: '',
						hidden: false,
						id: 'relation1653163849',
						maxSelect: 0,
						minSelect: 0,
						name: 'wedding_id',
						presentable: false,
						required: false,
						system: false,
						type: 'relation'
					},
					{
						hidden: false,
						id: 'autodate2990389176',
						name: 'created',
						onCreate: true,
						onUpdate: false,
						presentable: false,
						system: false,
						type: 'autodate'
					},
					{
						hidden: false,
						id: 'autodate3332085495',
						name: 'updated',
						onCreate: true,
						onUpdate: true,
						presentable: false,
						system: false,
						type: 'autodate'
					}
				],
				fileToken: {
					duration: 180
				},
				id: '_pb_users_auth_',
				indexes: [
					'CREATE UNIQUE INDEX `idx_tokenKey__pb_users_auth_` ON `users` (`tokenKey`)',
					"CREATE UNIQUE INDEX `idx_email__pb_users_auth_` ON `users` (`email`) WHERE `email` != ''"
				],
				listRule: 'id = @request.auth.id',
				manageRule: null,
				mfa: {
					duration: 600,
					enabled: false,
					rule: ''
				},
				name: 'users',
				oauth2: {
					enabled: false,
					mappedFields: {
						avatarURL: '',
						id: '',
						name: 'name',
						username: ''
					}
				},
				otp: {
					duration: 180,
					emailTemplate: {
						body: "<p>Hello,</p>\n<p>Your one-time password is: <strong>{OTP}</strong></p>\n<p><i>If you didn't ask for the one-time password, you can ignore this email.</i></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>",
						subject: 'OTP for {APP_NAME}'
					},
					enabled: false,
					length: 8
				},
				passwordAuth: {
					enabled: true,
					identityFields: ['email']
				},
				passwordResetToken: {
					duration: 1800
				},
				resetPasswordTemplate: {
					body: '<p>Hello,</p>\n<p>Click on the button below to reset your password.</p>\n<p>\n  <a class="btn" href="{APP_URL}/_/#/auth/confirm-password-reset/{TOKEN}" target="_blank" rel="noopener">Reset password</a>\n</p>\n<p><i>If you didn\'t ask to reset your password, please ignore this email.</i></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>',
					subject: 'Reset your {APP_NAME} password'
				},
				system: false,
				type: 'auth',
				updateRule:
					'id = @request.auth.id && (@request.body.wedding_id:changed = false || (wedding_id = "" && @collection.weddings.id ?= @request.body.wedding_id && @collection.weddings.owner ?= @request.auth.id))',
				verificationTemplate: {
					body: '<p>Hello,</p>\n<p>Thank you for joining us at {APP_NAME}.</p>\n<p>Click on the button below to verify your email address.</p>\n<p>\n  <a class="btn" href="{APP_URL}/_/#/auth/confirm-verification/{TOKEN}" target="_blank" rel="noopener">Verify</a>\n</p>\n<p><i>If you didn\'t recently register, please ignore this email.</i></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>',
					subject: 'Verify your {APP_NAME} email'
				},
				verificationToken: {
					duration: 86400
				},
				viewRule: 'id = @request.auth.id'
			},
			{
				createRule:
					'@request.auth.id != "" && @collection.weddings.id ?= @request.body.wedding && @collection.weddings.owner ?= @request.auth.id',
				deleteRule: '@request.auth.id != "" && wedding.owner = @request.auth.id',
				fields: [
					{
						autogeneratePattern: '[a-z0-9]{15}',
						help: '',
						hidden: false,
						id: 'text3208210256',
						max: 15,
						min: 15,
						name: 'id',
						pattern: '^[a-z0-9]+$',
						presentable: false,
						primaryKey: true,
						required: true,
						system: true,
						type: 'text'
					},
					{
						cascadeDelete: true,
						collectionId: 'pbc_1115120447',
						help: '',
						hidden: false,
						id: 'relation1539464342',
						maxSelect: 1,
						minSelect: 0,
						name: 'wedding',
						presentable: false,
						required: true,
						system: false,
						type: 'relation'
					},
					{
						autogeneratePattern: '',
						help: '',
						hidden: false,
						id: 'text1579384326',
						max: 150,
						min: 1,
						name: 'name',
						pattern: '',
						presentable: false,
						primaryKey: false,
						required: true,
						system: false,
						type: 'text'
					},
					{
						autogeneratePattern: '',
						help: '',
						hidden: false,
						id: 'text4222712125',
						max: 20,
						min: 8,
						name: 'whatsapp',
						pattern: '^\\+[1-9][0-9]{7,14}$',
						presentable: false,
						primaryKey: false,
						required: true,
						system: false,
						type: 'text'
					},
					{
						help: '',
						hidden: false,
						id: 'select3758166635',
						maxSelect: 1,
						name: 'rsvp_status',
						presentable: false,
						required: true,
						system: false,
						type: 'select',
						values: ['pending', 'attending', 'not_attending']
					},
					{
						autogeneratePattern: '',
						help: '',
						hidden: false,
						id: 'text3065852031',
						max: 1000,
						min: 0,
						name: 'message',
						pattern: '',
						presentable: false,
						primaryKey: false,
						required: false,
						system: false,
						type: 'text'
					},
					{
						autogeneratePattern: '',
						help: '',
						hidden: false,
						id: 'text981624571',
						max: 12,
						min: 6,
						name: 'rsvp_token',
						pattern: '^[A-Za-z0-9_-]+$',
						presentable: false,
						primaryKey: false,
						required: true,
						system: false,
						type: 'text'
					},
					{
						help: '',
						hidden: false,
						id: 'number2418529142',
						max: null,
						min: 1,
						name: 'guest_count',
						onlyInt: true,
						presentable: false,
						required: true,
						system: false,
						type: 'number'
					}
				],
				id: 'pbc_2047001084',
				indexes: ['CREATE UNIQUE INDEX idx_guests_rsvp_token ON guests (rsvp_token)'],
				listRule: '@request.auth.id != "" && wedding.owner = @request.auth.id',
				name: 'guests',
				system: false,
				type: 'base',
				updateRule:
					'@request.auth.id != "" && wedding.owner = @request.auth.id && @request.body.wedding:changed = false',
				viewRule: '@request.auth.id != "" && wedding.owner = @request.auth.id'
			},
			{
				createRule: null,
				deleteRule: null,
				fields: [
					{
						autogeneratePattern: '[a-z0-9]{15}',
						help: '',
						hidden: false,
						id: 'text3208210256',
						max: 15,
						min: 15,
						name: 'id',
						pattern: '^[a-z0-9]+$',
						presentable: false,
						primaryKey: true,
						required: true,
						system: true,
						type: 'text'
					},
					{
						cascadeDelete: true,
						collectionId: 'pbc_1115120447',
						help: '',
						hidden: false,
						id: 'relation1539464342',
						maxSelect: 1,
						minSelect: 0,
						name: 'wedding',
						presentable: false,
						required: true,
						system: false,
						type: 'relation'
					},
					{
						autogeneratePattern: '',
						help: '',
						hidden: false,
						id: 'text2462348188',
						max: 50,
						min: 0,
						name: 'provider',
						pattern: '',
						presentable: false,
						primaryKey: false,
						required: true,
						system: false,
						type: 'text'
					},
					{
						autogeneratePattern: '',
						help: '',
						hidden: false,
						id: 'text1998390439',
						max: 255,
						min: 0,
						name: 'provider_transaction_id',
						pattern: '',
						presentable: false,
						primaryKey: false,
						required: true,
						system: false,
						type: 'text'
					},
					{
						help: '',
						hidden: false,
						id: 'number2392944706',
						max: null,
						min: 1,
						name: 'amount',
						onlyInt: true,
						presentable: false,
						required: true,
						system: false,
						type: 'number'
					},
					{
						help: '',
						hidden: false,
						id: 'select1767278655',
						maxSelect: 1,
						name: 'currency',
						presentable: false,
						required: true,
						system: false,
						type: 'select',
						values: ['IDR']
					},
					{
						help: '',
						hidden: false,
						id: 'select2063623452',
						maxSelect: 1,
						name: 'status',
						presentable: false,
						required: true,
						system: false,
						type: 'select',
						values: ['pending', 'paid', 'failed', 'expired', 'refunded']
					},
					{
						help: '',
						hidden: false,
						id: 'date3735298188',
						max: '',
						min: '',
						name: 'paid_at',
						presentable: false,
						required: false,
						system: false,
						type: 'date'
					},
					{
						help: '',
						hidden: false,
						id: 'date261981154',
						max: '',
						min: '',
						name: 'expires_at',
						presentable: false,
						required: false,
						system: false,
						type: 'date'
					},
					{
						autogeneratePattern: '',
						help: '',
						hidden: false,
						id: 'text2000507297',
						max: 255,
						min: 0,
						name: 'provider_reference',
						pattern: '',
						presentable: false,
						primaryKey: false,
						required: false,
						system: false,
						type: 'text'
					},
					{
						exceptDomains: [],
						help: '',
						hidden: false,
						id: 'url2746590315',
						name: 'checkout_url',
						onlyDomains: [],
						presentable: false,
						required: false,
						system: false,
						type: 'url'
					},
					{
						hidden: false,
						id: 'autodate2990389176',
						name: 'created',
						onCreate: true,
						onUpdate: false,
						presentable: false,
						system: false,
						type: 'autodate'
					},
					{
						hidden: false,
						id: 'autodate3332085495',
						name: 'updated',
						onCreate: true,
						onUpdate: true,
						presentable: false,
						system: false,
						type: 'autodate'
					}
				],
				id: 'pbc_631030571',
				indexes: [
					'CREATE UNIQUE INDEX `idx_payments_provider_transaction` ON `payments` (`provider`, `provider_transaction_id`)'
				],
				listRule: '@request.auth.id != "" && wedding.owner = @request.auth.id',
				name: 'payments',
				system: false,
				type: 'base',
				updateRule: null,
				viewRule: '@request.auth.id != "" && wedding.owner = @request.auth.id'
			},
			{
				createRule:
					'@request.auth.id != "" && @collection.weddings.id ?= @request.body.wedding && @collection.weddings.owner ?= @request.auth.id',
				deleteRule: '@request.auth.id != "" && wedding.owner = @request.auth.id',
				fields: [
					{
						autogeneratePattern: '[a-z0-9]{15}',
						help: '',
						hidden: false,
						id: 'text3208210256',
						max: 15,
						min: 15,
						name: 'id',
						pattern: '^[a-z0-9]+$',
						presentable: false,
						primaryKey: true,
						required: true,
						system: true,
						type: 'text'
					},
					{
						hidden: false,
						id: 'autodate2990389176',
						name: 'created',
						onCreate: true,
						onUpdate: false,
						presentable: false,
						system: false,
						type: 'autodate'
					},
					{
						hidden: false,
						id: 'autodate3332085495',
						name: 'updated',
						onCreate: true,
						onUpdate: true,
						presentable: false,
						system: false,
						type: 'autodate'
					},
					{
						cascadeDelete: true,
						collectionId: 'pbc_1115120447',
						help: '',
						hidden: false,
						id: 'relation1539464342',
						maxSelect: 1,
						minSelect: 0,
						name: 'wedding',
						presentable: false,
						required: true,
						system: false,
						type: 'relation'
					},
					{
						autogeneratePattern: '',
						help: '',
						hidden: false,
						id: 'text724990059',
						max: 200,
						min: 1,
						name: 'title',
						pattern: '',
						presentable: false,
						primaryKey: false,
						required: true,
						system: false,
						type: 'text'
					},
					{
						autogeneratePattern: '',
						help: '',
						hidden: false,
						id: 'text4274335913',
						max: 5000,
						min: 1,
						name: 'content',
						pattern: '',
						presentable: false,
						primaryKey: false,
						required: true,
						system: false,
						type: 'text'
					},
					{
						help: '',
						hidden: false,
						id: 'date2862495610',
						max: '',
						min: '',
						name: 'date',
						presentable: false,
						required: false,
						system: false,
						type: 'date'
					},
					{
						help: '',
						hidden: false,
						id: 'file3309110367',
						maxSelect: 1,
						maxSize: 0,
						mimeTypes: [],
						name: 'image',
						presentable: false,
						protected: false,
						required: false,
						system: false,
						thumbs: [],
						type: 'file'
					},
					{
						help: '',
						hidden: false,
						id: 'number1169138922',
						max: null,
						min: 1,
						name: 'sort_order',
						onlyInt: true,
						presentable: false,
						required: true,
						system: false,
						type: 'number'
					}
				],
				id: 'pbc_2566319712',
				indexes: [],
				listRule:
					'wedding.slug != "" || (@request.auth.id != "" && wedding.owner = @request.auth.id)',
				name: 'wedding_stories',
				system: false,
				type: 'base',
				updateRule:
					'@request.auth.id != "" && wedding.owner = @request.auth.id && @request.body.wedding:changed = false',
				viewRule:
					'wedding.slug != "" || (@request.auth.id != "" && wedding.owner = @request.auth.id)'
			},
			{
				createRule:
					'@request.auth.id != "" && @request.body.owner = @request.auth.id && @request.body.plan_tier = "free"',
				deleteRule: '@request.auth.id != "" && owner = @request.auth.id',
				fields: [
					{
						autogeneratePattern: '[a-z0-9]{15}',
						help: '',
						hidden: false,
						id: 'text3208210256',
						max: 15,
						min: 15,
						name: 'id',
						pattern: '^[a-z0-9]+$',
						presentable: false,
						primaryKey: true,
						required: true,
						system: true,
						type: 'text'
					},
					{
						autogeneratePattern: '',
						help: '',
						hidden: false,
						id: 'text195033011',
						max: 0,
						min: 0,
						name: 'groom_name',
						pattern: '',
						presentable: false,
						primaryKey: false,
						required: false,
						system: false,
						type: 'text'
					},
					{
						autogeneratePattern: '',
						help: '',
						hidden: false,
						id: 'text2077532692',
						max: 0,
						min: 0,
						name: 'groom_father_name',
						pattern: '',
						presentable: false,
						primaryKey: false,
						required: false,
						system: false,
						type: 'text'
					},
					{
						autogeneratePattern: '',
						help: '',
						hidden: false,
						id: 'text1178342883',
						max: 0,
						min: 0,
						name: 'groom_mother_name',
						pattern: '',
						presentable: false,
						primaryKey: false,
						required: false,
						system: false,
						type: 'text'
					},
					{
						help: '',
						hidden: false,
						id: 'file2951315346',
						maxSelect: 0,
						maxSize: 0,
						mimeTypes: [],
						name: 'groom_photo',
						presentable: false,
						protected: false,
						required: false,
						system: false,
						thumbs: [],
						type: 'file'
					},
					{
						autogeneratePattern: '',
						help: '',
						hidden: false,
						id: 'text3314410471',
						max: 0,
						min: 0,
						name: 'bride_name',
						pattern: '',
						presentable: false,
						primaryKey: false,
						required: false,
						system: false,
						type: 'text'
					},
					{
						autogeneratePattern: '',
						help: '',
						hidden: false,
						id: 'text3099292394',
						max: 0,
						min: 0,
						name: 'bride_father_name',
						pattern: '',
						presentable: false,
						primaryKey: false,
						required: false,
						system: false,
						type: 'text'
					},
					{
						autogeneratePattern: '',
						help: '',
						hidden: false,
						id: 'text2236859677',
						max: 0,
						min: 0,
						name: 'bride_mother_name',
						pattern: '',
						presentable: false,
						primaryKey: false,
						required: false,
						system: false,
						type: 'text'
					},
					{
						help: '',
						hidden: false,
						id: 'file3273783403',
						maxSelect: 0,
						maxSize: 0,
						mimeTypes: [],
						name: 'bride_photo',
						presentable: false,
						protected: false,
						required: false,
						system: false,
						thumbs: [],
						type: 'file'
					},
					{
						help: '',
						hidden: false,
						id: 'file2366146245',
						maxSelect: 0,
						maxSize: 0,
						mimeTypes: [],
						name: 'cover',
						presentable: false,
						protected: false,
						required: false,
						system: false,
						thumbs: [],
						type: 'file'
					},
					{
						autogeneratePattern: '',
						help: '',
						hidden: false,
						id: 'text1802619892',
						max: 0,
						min: 0,
						name: 'quote',
						pattern: '',
						presentable: false,
						primaryKey: false,
						required: false,
						system: false,
						type: 'text'
					},
					{
						autogeneratePattern: '',
						help: '',
						hidden: false,
						id: 'text1559021502',
						max: 0,
						min: 0,
						name: 'address',
						pattern: '',
						presentable: false,
						primaryKey: false,
						required: false,
						system: false,
						type: 'text'
					},
					{
						help: '',
						hidden: false,
						id: 'date2862495610',
						max: '',
						min: '',
						name: 'akad',
						presentable: false,
						required: false,
						system: false,
						type: 'date'
					},
					{
						help: '',
						hidden: false,
						id: 'date1356236079',
						max: '',
						min: '',
						name: 'reception',
						presentable: false,
						required: false,
						system: false,
						type: 'date'
					},
					{
						help: '',
						hidden: false,
						id: 'file1194031162',
						maxSelect: 10,
						maxSize: 0,
						mimeTypes: [],
						name: 'gallery',
						presentable: false,
						protected: false,
						required: false,
						system: false,
						thumbs: [],
						type: 'file'
					},
					{
						autogeneratePattern: '',
						help: '',
						hidden: false,
						id: 'text2560465762',
						max: 0,
						min: 0,
						name: 'slug',
						pattern: '',
						presentable: false,
						primaryKey: false,
						required: false,
						system: false,
						type: 'text'
					},
					{
						exceptDomains: [],
						help: '',
						hidden: false,
						id: 'url1194199205',
						name: 'maps',
						onlyDomains: [],
						presentable: false,
						required: false,
						system: false,
						type: 'url'
					},
					{
						help: '',
						hidden: false,
						id: 'select2541086472',
						maxSelect: 0,
						name: 'theme',
						presentable: false,
						required: false,
						system: false,
						type: 'select',
						values: [
							'neubrutalism-1',
							'neubrutalism-2',
							'neubrutalism-3',
							'playful-1',
							'playful-2',
							'playful-3',
							'3d-design-1',
							'3d-design-2',
							'3d-design-3'
						]
					},
					{
						hidden: false,
						id: 'autodate2990389176',
						name: 'created',
						onCreate: true,
						onUpdate: false,
						presentable: false,
						system: false,
						type: 'autodate'
					},
					{
						hidden: false,
						id: 'autodate3332085495',
						name: 'updated',
						onCreate: true,
						onUpdate: true,
						presentable: false,
						system: false,
						type: 'autodate'
					},
					{
						convertURLs: false,
						help: '',
						hidden: false,
						id: 'editor_whatsapp_tpl',
						maxSize: 10000,
						name: 'whatsapp_template',
						presentable: false,
						required: false,
						system: false,
						type: 'editor'
					},
					{
						autogeneratePattern: '',
						help: '',
						hidden: false,
						id: 'text3778377555',
						max: 0,
						min: 0,
						name: 'groom_payment_number',
						pattern: '',
						presentable: false,
						primaryKey: false,
						required: false,
						system: false,
						type: 'text'
					},
					{
						autogeneratePattern: '',
						help: '',
						hidden: false,
						id: 'text2666298260',
						max: 0,
						min: 0,
						name: 'groom_payment_provider',
						pattern: '',
						presentable: false,
						primaryKey: false,
						required: false,
						system: false,
						type: 'text'
					},
					{
						autogeneratePattern: '',
						help: '',
						hidden: false,
						id: 'text39489692',
						max: 0,
						min: 0,
						name: 'bride_payment_number',
						pattern: '',
						presentable: false,
						primaryKey: false,
						required: false,
						system: false,
						type: 'text'
					},
					{
						autogeneratePattern: '',
						help: '',
						hidden: false,
						id: 'text3974112417',
						max: 0,
						min: 0,
						name: 'bride_payment_provider',
						pattern: '',
						presentable: false,
						primaryKey: false,
						required: false,
						system: false,
						type: 'text'
					},
					{
						help: '',
						hidden: false,
						id: 'select826825592',
						maxSelect: 1,
						name: 'plan_tier',
						presentable: false,
						required: true,
						system: false,
						type: 'select',
						values: ['free', 'pro']
					},
					{
						cascadeDelete: true,
						collectionId: '_pb_users_auth_',
						help: '',
						hidden: true,
						id: 'relation3479234172',
						maxSelect: 1,
						minSelect: 0,
						name: 'owner',
						presentable: false,
						required: false,
						system: false,
						type: 'relation'
					}
				],
				id: 'pbc_1115120447',
				indexes: [
					"CREATE UNIQUE INDEX `idx_4in7ijlqe6` ON `weddings` (slug) WHERE slug != ''",
					"CREATE UNIQUE INDEX `idx_weddings_owner` ON `weddings` (owner) WHERE owner != ''"
				],
				listRule: 'slug != "" || (@request.auth.id != "" && owner = @request.auth.id)',
				name: 'weddings',
				system: false,
				type: 'base',
				updateRule:
					'@request.auth.id != "" && owner = @request.auth.id && @request.body.owner:changed = false && @request.body.plan_tier:changed = false',
				viewRule: 'slug != "" || (@request.auth.id != "" && owner = @request.auth.id)'
			}
		];

		return app.importCollections(snapshot, false);
	},
	() => {
		return null;
	}
);
