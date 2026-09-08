export { LoginError, loginWithPassword } from './api/login.js';
export { RegisterError, registerWithPassword } from './api/register.js';
export { UpdateProfileError, updateAuthenticatedName } from './api/update-profile.js';
export {
	ACCOUNT_DELETE_CONFIRMATION,
	DeleteAccountError,
	deleteCurrentAccount
} from './api/delete-account.js';
export {
	VerificationError,
	confirmEmailVerification,
	refreshAuthenticatedUser,
	requestEmailVerification,
	subscribeToEmailVerification
} from './api/verification.js';
export {
	getAuthenticatedEmail,
	getAuthenticatedName,
	isAuthenticated,
	isEmailVerified,
	logout
} from './model/session.js';
export {
	registerSchema,
	validateRegister,
	type RegisterFieldErrors,
	type RegisterInput,
	type RegisterValidationResult
} from './model/register-schema.js';
export { loginSchema, validateLogin } from './model/login-schema.js';
export type { LoginFieldErrors, LoginInput, LoginValidationResult } from './model/login-schema.js';
