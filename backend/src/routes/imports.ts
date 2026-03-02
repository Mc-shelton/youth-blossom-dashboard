import { Router } from 'express';
import { listImportsController } from '../controllers/importsController';

const router = Router();

router.get('/', listImportsController);

export default router;
