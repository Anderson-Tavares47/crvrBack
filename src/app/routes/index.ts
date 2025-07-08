import { Router } from 'express';
import mtrRoutes from './mtr.routes';

const routes = Router();

routes.use('/mtr', mtrRoutes);

export default routes;
