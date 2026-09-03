export { LoginError, loginWithPassword } from './api/login';
export { RegisterError, registerWithPassword } from './api/register.js';
export {
	VerificationError,
	confirmEmailVerification,
	refreshAuthenticatedUser,
	requestEmailVerification,
	subscribeToEmailVerification
} from './api/verification.js';
export {
	getAuthenticatedEmail,
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
export { loginSchema, validateLogin } from './model/login-schema';
export type { LoginFieldErrors, LoginInput, LoginValidationResult } from './model/login-schema';
