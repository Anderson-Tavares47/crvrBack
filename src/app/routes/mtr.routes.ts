import { Router } from 'express';
import { obterManifestoPDF } from '../controllers/mtr.controller';
import { obterListaUnidades } from '../controllers/listaUnidades.controller';
import { obterListaResiduo } from '../controllers/listaResiduo.controller';
import { obterListaClasse } from '../controllers/listaClasse.controller';
import { obterListaEstadoFisico } from '../controllers/listaEstadoFisico.controller';
import { obterListaAcondicionamento } from '../controllers/listaAcondicionamento.controller';
import { obterListaTecnologia } from '../controllers/listaTecnologia.controller';

const router = Router();

// Middleware de log para todas as rotas
router.use((req, res, next) => {
  console.log(`📥 Requisição recebida: ${req.method} ${req.originalUrl}`);
  next();
});

// Rota para obter PDF do manifesto
router.post('/manifesto-pdf', obterManifestoPDF);

router.post('/unidades', obterListaUnidades);
router.post('/residuo', obterListaResiduo);
router.post('/classe', obterListaClasse);
router.post('/estado-fisico', obterListaEstadoFisico);
router.post('/acondicionamento', obterListaAcondicionamento);
router.post('/tecnologia', obterListaTecnologia);

export default router;