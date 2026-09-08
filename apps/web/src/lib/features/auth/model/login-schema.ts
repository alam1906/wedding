import * as v from 'valibot';

export const loginSchema = v.object({
	email: v.pipe(
		v.string('Email wajib diisi.'),
		v.trim(),
		v.nonEmpty('Email wajib diisi.'),
		v.email('Format email tidak valid.')
	),
	password: v.pipe(v.string('Kata sandi wajib diisi.'), v.nonEmpty('Kata sandi wajib diisi.'))
});

export type LoginInput = v.InferOutput<typeof loginSchema>;
export type LoginFieldErrors = Partial<Record<keyof LoginInput, string>>;

export type LoginValidationResult =
	{ success: true; data: LoginInput } | { success: false; errors: LoginFieldErrors };

function isLoginField(field: PropertyKey): field is keyof LoginInput {
	return field === 'email' || field === 'password';
}

export function validateLogin(input: unknown): LoginValidationResult {
	const result = v.safeParse(loginSchema, input);

	if (result.success) {
		return { success: true, data: result.output };
	}

	const errors: LoginFieldErrors = {};

	for (const issue of result.issues) {
		const field = issue.path?.[0]?.key;

		if (typeof field === 'string' && isLoginField(field) && !errors[field]) {
			errors[field] = issue.message;
		}
	}

	return { success: false, errors };
}
