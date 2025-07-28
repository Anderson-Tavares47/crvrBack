import { Request, Response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export async function enviarLoteMTR(req: Request, res: Response): Promise<void> {
  const login = process.env.LOGIN;
  const senha = process.env.SENHA;
  const cnp = process.env.CNP_GERADOR;

  if (!login || !senha || !cnp) {
    res.status(400).json({
      success: false,
      message: "Parâmetros de ambiente 'LOGIN', 'SENHA' e 'CNP_GERADOR' são obrigatórios.",
    });
    return;
  }

  const payload = req.body;

  if (!payload || !payload.manifestoRecebimentoJSONs) {
    res.status(400).json({
      success: false,
      message: "Payload inválido ou ausente.",
    });
    return;
  }

  // ✅ Sobrescrevendo login, senha e cnp do payload com os valores do .env
  const payloadCorrigido = {
    login,
    senha,
    cnp,
    manifestoRecebimentoJSONs: payload.manifestoRecebimentoJSONs,
  };

  console.log(payloadCorrigido, 'Payload corrigido para envio');

  try {
    // const url = `https://mtr.fepam.rs.gov.br/mtrservice/receberManifesto`;
    const url = `https://mtr.fepam.rs.gov.br/mtrservice/receberManifestoLote`;

    const response = await axios.post(url, payloadCorrigido, {
      headers: { 'Content-Type': 'application/json' },
      httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: false
      }),
      validateStatus: () => true
    });


    if (typeof response.data === 'string') {
      try {
        const json = JSON.parse(response.data);

         console.log(response, 'resposta do envio do lote MTR');
         console.log(response.data, 'resposta do envio do lote MTR .data');
        res.status(200).json({ success: true, data: json });
      } catch (e) {
        res.status(500).json({
          success: false,
          message: "Erro ao interpretar resposta como JSON",
          raw: response.data
        });
      }
    } else {
      res.status(200).json({ success: true, data: response.data });
    }

  } catch (error: any) {
    console.error('❌ Erro ao enviar lote MTR:', error.message);
    res.status(500).json({
      success: false,
      message: "Erro ao enviar lote para FEPAM",
      detail: error.message
    });
  }
}
