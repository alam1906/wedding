// Run with Bun to test the actual TypeScript helpers used by the form and API.
import assert from 'node:assert/strict';
import {
	INVALID_GUEST_WHATSAPP_MESSAGE,
	normalizeGuestWhatsapp,
	sanitizeGuestWhatsappInput,
	validateGuestForm
} from '../apps/web/src/lib/features/guests/model/guest-form.ts';

for (const [input, expected] of [
	['abc', ''],
	['0812abc3456', '08123456'],
	['+62 (812) 3456-7890', '+6281234567890'],
	['++62+812', '+62812'],
	['08e+12.34', '081234'],
	['081234567890', '081234567890']
]) {
	assert.equal(sanitizeGuestWhatsappInput(input), expected);
}

for (const input of ['081234567890', '6281234567890', '+6281234567890', '81234567890']) {
	assert.equal(normalizeGuestWhatsapp(input), '+6281234567890');
	assert.deepEqual(validateGuestForm({ name: 'Nur Alam', whatsapp: input }), {});
}

for (const input of ['abc', '+', '1234567890', '081', '081234567890123456']) {
	assert.equal(normalizeGuestWhatsapp(input), null);
	assert.equal(
		validateGuestForm({ name: 'Nur Alam', whatsapp: input }).whatsapp,
		INVALID_GUEST_WHATSAPP_MESSAGE
	);
}

assert.deepEqual(validateGuestForm({ name: '  ', whatsapp: '' }), {
	name: 'Nama tamu wajib diisi.',
	whatsapp: 'Nomor WhatsApp wajib diisi.'
});
assert.equal(normalizeGuestWhatsapp('0812345'), '+62812345');
assert.equal(normalizeGuestWhatsapp('08123456789012'), '+628123456789012');
assert.equal(normalizeGuestWhatsapp('081234567890123'), null);
console.log('Guest form validation passed.');
