
/**
 * Login request payload
 */
export interface ILoginRequest {
  email: string
  password: string
}

/**
 * Signup request payload
 */
export interface ISignupRequest {
  email: string
  password: string
  firstName?: string
  lastName?: string
  username?: string
  profilePicture?: string
}

/**
 * JWT token payload
 */
export interface IJWTPayload {
  userId: string
  email: string
  iat?: number
  exp?: number
}

/**
 * Authentication response with tokens
 */
export interface IAuthResponse {
  accessToken: string
  refreshToken: string
}

/**
 * User profile response (without sensitive data)
 */
export interface IUserResponse {
  _id: string
  email: string
  firstName?: string
  lastName?: string
  username?: string
  phone?: string
  profilePicture?: string
  isEmailVerified: boolean
  isPhoneVerified: boolean
  createdAt: Date
  role: string
  department?: string
  employeeId?: string
  isActive: boolean
}

/**
 * Auth service response
 */
export interface IAuthServiceResponse {
  user: IUserResponse
  tokens: IAuthResponse
}
