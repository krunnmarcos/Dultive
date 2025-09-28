import { Router } from 'express';
import { register, login, requestEmailVerificationCode } from '../controllers/authController';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/email/request-code', requestEmailVerificationCode);

export default router;
