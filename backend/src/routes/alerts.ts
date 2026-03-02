import { Router } from 'express';
import { listAlertsController } from '../controllers/alertsController';

const router = Router();

router.get('/', listAlertsController);

export default router;
