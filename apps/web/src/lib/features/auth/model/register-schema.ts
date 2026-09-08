import * as v from 'valibot';

export const registerSchema = v.pipe(
	v.object({
		name: v.pipe(
			v.string('Nama wajib diisi.'),
			v.trim(),
			v.nonEmpty('Nama wajib diisi.'),
			v.maxLength(100, 'Nama maksimal 100 karakter.')
		),
		email: v.pipe(
			v.string('Email wajib diisi.'),
			v.trim(),
			v.nonEmpty('Email wajib diisi.'),
			v.email('Format email tidak valid.')
		),
		password: v.pipe(
			v.string('Kata sandi wajib diisi.'),
			v.nonEmpty('Kata sandi wajib diisi.'),
			v.minLength(8, 'Kata sandi minimal 8 karakter.')
		),
		passwordConfirm: v.pipe(
			v.string('Konfirmasi kata sandi wajib diisi.'),
			v.nonEmpty('Konfirmasi kata sandi wajib diisi.')
		)
	}),
	v.forward(
		v.partialCheck(
			[['password'], ['passwordConfirm']],
			(input) => input.password === input.passwordConfirm,
			'Konfirmasi kata sandi tidak cocok.'
		),
		['passwordConfirm']
	)
);

export type RegisterInput = v.InferOutput<typeof registerSchema>;
export type RegisterFieldErrors = Partial<Record<keyof RegisterInput, string>>;

export type RegisterValidationResult =
	{ success: true; data: RegisterInput } | { success: false; errors: RegisterFieldErrors };

function isRegisterField(field: PropertyKey): field is keyof RegisterInput {
	return (
		field === 'name' || field === 'email' || field === 'password' || field === 'passwordConfirm'
	);
}

export function validateRegister(input: unknown): RegisterValidationResult {
	const result = v.safeParse(registerSchema, input);

	if (result.success) {
		return { success: true, data: result.output };
	}

	const errors: RegisterFieldErrors = {};

	for (const issue of result.issues) {
		const field = issue.path?.[0]?.key;

		if (typeof field === 'string' && isRegisterField(field) && !errors[field]) {
			errors[field] = issue.message;
		}
	}

	return { success: false, errors };
}
