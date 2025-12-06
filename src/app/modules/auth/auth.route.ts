import { Router } from 'express'
import auth from '../../middlewares/auth';
import { AuthValidation } from './auth.validation';
import validateRequest from '../../middlewares/validateRequest';
import { AuthController } from './auth.controller';

const router: Router = Router()
// Public routes
router.post('/signup', validateRequest(AuthValidation.signupValidationSchema), AuthController.signup);
router.post('/login', validateRequest(AuthValidation.loginValidationSchema), AuthController.login);
router.post('/refresh', AuthController.refreshAccessToken);

// Protected routes (user ID should be attached by auth middleware)
router.get('/me', auth(), AuthController.getMe);
router.post('/logout', auth(), AuthController.logout);
export const AuthModuleRoutes = router
