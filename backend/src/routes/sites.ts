import { Router } from 'express';
import multer from 'multer';
import { listSitesController, importSitesController } from '../controllers/sitesController';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.get('/', listSitesController);
router.post('/import', upload.single('file'), importSitesController);

export default router;
