// import express from 'express';
// import routes from './app/routes'; // ✅ importa do app/routes/index.ts

// const app = express();
// app.use(express.json());

// // Middleware global para logar qualquer requisição
// app.use((req, res, next) => {
//   console.log(`📡 ${req.method} ${req.originalUrl}`);
//   next();
// });

// // Usa todas as rotas definidas com prefixo /api
// app.use('/api', routes);

// app.listen(5000, () => {
//   console.log('🚀 Servidor rodando na porta 5000');
// });

import express from 'express';
import routes from './app/routes'; // ✅ importa corretamente

const app = express();
app.use(express.json());

// Middleware de log
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.originalUrl}`);
  next();
});

app.use('/api', routes);

// ✅ Exporta o app para que a Vercel use como handler
export default app;
