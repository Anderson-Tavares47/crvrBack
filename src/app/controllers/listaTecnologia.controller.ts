import { Request, Response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export async function obterListaTecnologia(req: Request, res: Response): Promise<void> {
  const login = process.env.LOGIN;
  const senha = process.env.SENHA;
  const cnp = process.env.CNP_GERADOR;

  if (!login || !senha || !cnp) {
    res.status(400).json({
      success: false,
      message: "Parâmetros de ambiente 'login', 'senha' e 'cnp' são obrigatórios.",
    });
    return;
  }

  try {
    const url = `https://mtr.fepam.rs.gov.br/mtrservice/retornaListaTecnologia/${login}/${senha}/${cnp}`;

    const response = await axios.post(url, null, {
      headers: { 'Content-Type': 'application/json' },
      validateStatus: () => true
    });

    if (typeof response.data === 'string') {
      try {
        const json = JSON.parse(response.data);
        res.status(200).json({ success: true, unidades: json });
      } catch (e) {
        res.status(500).json({
          success: false,
          message: "Erro ao interpretar resposta como JSON",
          raw: response.data
        });
      }
    } else {
      res.status(200).json({ success: true, unidades: response.data });
    }

  } catch (error: any) {
    console.error('❌ Erro ao obter lista de unidades:', error.message);
    res.status(500).json({
      success: false,
      message: "Erro inesperado ao buscar unidades",
      detail: error.message
    });
  }
}
