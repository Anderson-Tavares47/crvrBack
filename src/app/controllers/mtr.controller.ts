import { Request, Response } from 'express';
import axios from 'axios';
import pdfParse from 'pdf-parse';
import dotenv from 'dotenv';

dotenv.config();

// Função para normalizar CNPJ (remover pontuação)
function normalizarCnpj(cnpj: string | null): string {
  if (!cnpj) return '';
  return cnpj.replace(/[^\d]/g, '');
}

// Função utilitária para extrair campos com regex
function extrairCampo(texto: string, regex: RegExp): string | null {
  const match = texto.match(regex);
  return match ? match[1].trim() : null;
}

// Função que extrai todos os dados do texto do PDF
// export function extrairTodosDados(texto: string) {
//   return {
//     numeroMTR: extrairCampo(texto, /MTR nº (\d+)/),
//     dataEmissao: extrairCampo(texto, /data da emissão:\s*(\d{2}\/\d{2}\/\d{4})/i),
//     dataTransporte: extrairCampo(texto, /data do transporte:\s*(\d{2}\/\d{2}\/\d{4})/i),
//     dataRecebimento: extrairCampo(texto, /data do recebimento:\s*(\d{2}\/\d{2}\/\d{4})/i),

//     gerador: {
//       nome: extrairCampo(texto, /Identificação do Gerador\s*([^\n]+)/i),
//       municipio: extrairCampo(texto, /Identificação do Gerador[\s\S]*?Município:\s*(.+?)\n/i),
//       estado: extrairCampo(texto, /Identificação do Gerador[\s\S]*?Estado:\s*(\w+)/i),
//       cnpj: extrairCampo(texto, /Identificação do Gerador[\s\S]*?CPF\/CNPJ:\s*([\d./-]+)/i),
//       razaoSocial: extrairCampo(texto, /Identificação do Gerador[\s\S]*?Razão Social:\s*(.*?)\s*(Telefone|Fax|Estado|Município|CPF|$)/i)
//     },

//     transportador: {
//       placa: extrairCampo(texto, /Placa do Veículo\s*\n(.+)/i),
//       nomeMotorista: extrairCampo(texto, /Nome do Motorista\s*\n(.+)/i),
//       cnpj: extrairCampo(texto, /Identificação do Transportador[\s\S]*?CPF\/CNPJ:\s*([\d./-]+)/i),
//       endereco: extrairCampo(texto, /Identificação do Transportador[\s\S]*?Endereço:\s*([^\n]+)/i),
//       municipio: extrairCampo(texto, /Identificação do Transportador[\s\S]*?Município:\s*([^\n]+)/i)
//     },

//     destinador: {
//       razaoSocial: extrairCampo(texto, /Identificação do Destinador\s*([^\n]+)/i),
//       cnpj: extrairCampo(texto, /Identificação do Destinador[\s\S]*?CPF\/CNPJ:\s*([\d./-]+)/i),
//       endereco: extrairCampo(texto, /Identificação do Destinador[\s\S]*?Endereço:\s*([^\n]+)/i),
//       municipio: extrairCampo(texto, /Identificação do Destinador[\s\S]*?Município:\s*([^\n]+)/i),
//       estado: extrairCampo(texto, /Identificação do Destinador[\s\S]*?Estado:\s*(\w+)/i)
//     },

//     residuo: {
//       item: extrairCampo(texto, /Item\.\s*(\d+)/),
//       codigoIbama: extrairCampo(texto, /(\d{6}\(\*\))\s*-\s*Lixiviados/i),
//       denominacao: extrairCampo(texto, /-\s*(Lixiviados.+?)\n/i),
//       estadoFisico: extrairCampo(texto, /Estado Físico\s*([^\n]+)/i),
//       classe: extrairCampo(texto, /Classe\s*([^\n]+)/i),
//       acondicionamento: extrairCampo(texto, /Acondicionamento\s*([^\n]+)/i),
//       quantidade: extrairCampo(texto, /Tonelada\s*(\d+,\d+)/),
//       tecnologia: extrairCampo(texto, /Tecnologia\s*([^\n]+)/i),
//       onu: extrairCampo(texto, /ONU\s*(\d{4})/)
//     }
//   };
// }


export function extrairTodosDados(texto: string) {
  const extrairCampo = (texto: string, regex: RegExp): string | null => {
    const match = texto.match(regex);
    return match ? match[1].trim() : null;
  }; 

  const limparValor = (valor: string | null) => valor ? valor.replace(/\n/g, ' ').trim() : null;

  // Extrai seções do texto
  const secaoDestinador = texto.match(/Identificação do Destinador([\s\S]*?)(?=Identificação dos Resíduos|Observações do Gerador|$)/i)?.[1] || '';
  // const linhaResMatch = texto.match(/^\s*\d+\.\s*\d{6}[\s\S]*?Tonelada[\s\S]*?\d{1,3},\d{3,5}[\s\S]*?Aterro/im);
  // let linhaResiduo = linhaResMatch?.[0] || '';

  // let linhaResMatch = texto.match(/^\s*\d+\.\s*\d{6}[\s\S]*?Tonelada[\s\S]*?\d{1,3},\d{3,5}[\s\S]*?Aterro/im);
//    let linhaResMatch =
//   texto.match(/^\s*\d+\.\s*\d{6}[\s\S]*?Tonelada[\s\S]*?(Aterro|Triagem|Armazenamento|Incineração|Valorização)/im) ||
//   texto.match(/^\s*\d+\.\s*Grupo D[\s\S]*?Tonelada[\s\S]*?(Aterro|Triagem|Armazenamento|Incineração|Valorização)/im) ||
//   texto.match(/^\s*\d+\.\s*[\s\S]*?Tonelada[\s\S]*?(Aterro|Triagem|Armazenamento|Incineração|Valorização)/im);

// // Se não encontrou com a primeira regex, tenta uma alternativa mais abrangente
// if (!linhaResMatch) {
//   linhaResMatch = texto.match(/^\s*\d+\.\s*\d{6}[\s\S]*?Tonelada\s*\d{1,3},\d{3,5}[\s\S]*?(Triagem|Armazenamento|Incineração|Coprocessamento|Valorização)?/im);
// }

// let linhaResiduo = linhaResMatch?.[0] || '';

//   linhaResiduo = linhaResiduo
//     .replace(/([a-z])([A-Z])/g, '$1 $2')
//     .replace(/([A-Z]{2,3})(E\d{2})/, '$1 $2')
//     .replace(/(E\d{2})(-?\s*[A-Za-z]+)/, '$1 - $2')
//     .replace(/Tonelada\s*(\d+,\d+)/, 'Tonelada $1')
//     .replace(/\s{2,}/g, ' ')

//   const tecnologia = extrairCampo(linhaResiduo, /Tonelada\s*[\d,.]+\s*(\w+)/);

//   const item = extrairCampo(linhaResiduo, /^\s*(\d+)\./);
//   // const codigoIbama = extrairCampo(linhaResiduo, /\b(\d{6})\b/);
//   let codigoIbama = extrairCampo(linhaResiduo, /\b(\d{6})\b/);

// if (!codigoIbama && linhaResiduo.includes('Grupo D')) {
//   codigoIbama = '200399'; // fallback para resíduos do tipo Grupo D
// }

//   const denominacao = (() => {
//     const afterHifen = linhaResiduo.split('-')[1] || '';
//     return afterHifen
//       .replace(/(Sólido|Líquido|Gasoso).*/i, '')
//       .replace(/II[A-Z]?.*/i, '')
//       .replace(/E\d{2}.*/i, '')
//       .replace(/Tonelada.*/i, '')
//       .trim();
//   })();

//   const estadoFisico = extrairCampo(linhaResiduo, /(Sólido|Líquido|Gasoso)/);
//   const classe = extrairCampo(linhaResiduo, /\b(I{1,3}[A-Z]?)\b/);
//   const acondicionamento = extrairCampo(linhaResiduo, /(E\d{2}\s*-\s*[^\s]+)/);
//   const quantidade = extrairCampo(linhaResiduo, /Tonelada\s+([\d,.]+)/);
//   const unidade = extrairCampo(linhaResiduo, /\b(Tonelada|Kg|Litro|Unidade)\b/i);

//   const residuo = {
//     item,
//     codigoIbama,
//     denominacao,
//     estadoFisico,
//     classe,
//     acondicionamento,
//     quantidade,
//     tecnologia,
//     unidade
//   };

// 🔁 NOVO BLOCO que substitui toda a extração de 1 resíduo:
const residuos: any[] = [];

// const blocosResiduos = texto.match(/^\s*\d+\..*?(Tonelada[\s\S]*?(Aterro|Triagem|Armazenamento|Incineração|Valorização))/gim) || [];

const blocosResiduos = [
  ...texto.matchAll(/^\s*\d+\..*?(?=\n\s*\d+\.\s|\nJustificativa|\nObservação do Recebimento|\nResiduo|\n$)/gms)
];


for (const match of blocosResiduos) {
  const bloco = match[0];

  const linhaResiduo = bloco
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]{2,3})(E\d{2})/, '$1 $2')
    .replace(/(E\d{2})(-?\s*[A-Za-z]+)/, '$1 - $2')
    .replace(/Tonelada\s*(\d+,\d+)/, 'Tonelada $1')
    .replace(/\s{2,}/g, ' ');

  const tecnologia = extrairCampo(linhaResiduo, /Tonelada\s*[\d,.]+\s*(\w+)/);
  const item = extrairCampo(linhaResiduo, /^\s*(\d+)\./);

  let codigoIbama = extrairCampo(linhaResiduo, /\b(\d{6})\b/);
  if (!codigoIbama && linhaResiduo.includes('Grupo D')) {
    codigoIbama = '200399';
  }

 const denominacao = (() => {
  const match = linhaResiduo.match(/\d+\.\s*(Grupo D.*?)\s*(Sólido|Líquido|Gasoso)/is);
  if (match) return match[1].replace(/\s+/g, ' ').trim();

  const fallback = linhaResiduo.match(/\d+\.\s*(.*?)\s*(Sólido|Líquido|Gasoso)/is);
  return fallback ? fallback[1].replace(/\s+/g, ' ').trim() : '';
})();


  const estadoFisico = extrairCampo(linhaResiduo, /(Sólido|Líquido|Gasoso)/);
  const classe = extrairCampo(linhaResiduo, /\b(I{1,3}[A-Z]?)\b/);
  const acondicionamento = extrairCampo(linhaResiduo, /(E\d{2}\s*-\s*[^\s]+)/);
  const quantidade = extrairCampo(linhaResiduo, /Tonelada\s+([\d,.]+)/);
  const unidade = extrairCampo(linhaResiduo, /\b(Tonelada|Kg|Litro|Unidade)\b/i);

  residuos.push({
    item,
    codigoIbama,
    denominacao,
    estadoFisico,
    classe,
    acondicionamento,
    quantidade,
    tecnologia,
    unidade
  });
}

  
  
  return {
    numeroMTR: extrairCampo(texto, /MTR nº (\d+)/),
    dataEmissao: extrairCampo(texto, /data da emissão:\s*(\d{2}\/\d{2}\/\d{4})/i),
    dataTransporte: extrairCampo(texto, /data do transporte:\s*(\d{2}\/\d{2}\/\d{4})/i),
    dataRecebimento: extrairCampo(texto, /data do recebimento:\s*(\d{2}\/\d{2}\/\d{4})/i),

    gerador: {
      nome: extrairCampo(texto, /Identificação do Gerador\s*([^\n]+)/i),
      municipio: extrairCampo(texto, /Identificação do Gerador[\s\S]*?Município:\s*(.+?)\n/i),
      estado: extrairCampo(texto, /Identificação do Gerador[\s\S]*?Estado:\s*(\w+)/i),
      cnpj: extrairCampo(texto, /Identificação do Transportador[\s\S]*?CPF\/CNPJ:\s*([\d./-]+)/i),
      razaoSocial: extrairCampo(texto, /Identificação do Gerador[\s\S]*?Razão Social:\s*(.*?)\s*(Telefone|Fax|Estado|Município|CPF|$)/i)
    },

    transportador: {
      placa: extrairCampo(texto, /\b([A-Z]{3}[0-9][A-Z0-9][0-9]{2})\b/),
      nomeMotorista: extrairCampo(texto, /Identificação do Destinador\s+([^\n]+)\n/i),
      cnpj: extrairCampo(texto, /Nome do Responsável pela Emissão[\s\S]*?CPF\/CNPJ:\s*([\d./-]+)/i),
      endereco: extrairCampo(texto, /Identificação do Destinador[\s\S]*?Endereço:\s*([^\n]+)/i),
      municipio: extrairCampo(texto, /Identificação do Transportador[\s\S]*?Município:\s*([^\n]+)/i)
    },

    destinador: {
      razaoSocial: extrairCampo(texto, /Razão Social:\s*([^\n]+)/i),
      cnpj: extrairCampo(texto, /Identificação do Destinador[\s\S]*?CPF\/CNPJ:\s*([\d./-]+)/i),
      endereco: extrairCampo(texto, /Endereço:\s*(.+)/i),
      municipio: extrairCampo(secaoDestinador, /Município:\s*(.+)/i),
      estado: extrairCampo(secaoDestinador, /Estado:\s*([A-Z]{2})/i)
    },

    residuos: residuos
  };
}

// Controller principal
export async function obterManifestoPDF(req: Request, res: Response): Promise<void> {
  const { CNP_GERADOR, LOGIN, SENHA } = process.env;

  try {
    // 1. Chamada para obter o PDF
    const response = await axios.post(
      'https://mtr.fepam.rs.gov.br/mtrservice/retornaManifestoPdf',
      {
        cnp: CNP_GERADOR,
        login: LOGIN,
        senha: SENHA,
        manifestoJSON: {
          manifestoCodigo: req.body.manifestoCodigo ?? ''
        }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        responseType: 'arraybuffer',
        validateStatus: () => true
      }
    );

    // 2. Verificação de erro na resposta do PDF
    const contentType = response.headers['content-type'];
    if (contentType !== 'application/pdf') {
      const textoErro = response.data.toString('utf-8');
      res.status(400).json({
        error: true,
        message: 'Erro ao consultar manifesto',
        detalhe: textoErro
      });
      return;
    }

    // 3. Conversão e extração dos dados
    const pdfBuffer = Buffer.from(response.data);
    const pdfData = await pdfParse(pdfBuffer);
    const dadosExtraidos = extrairTodosDados(pdfData.text);

    // 4. Requisição para verificar situação
    const verificacao = await axios.post(
      'https://mtr.fepam.rs.gov.br/mtrservice/verificaSituacaoManifesto',
      {
        cnpGerador: CNP_GERADOR,
        login: LOGIN,
        senha: SENHA,
        manifestoCodigo: dadosExtraidos.numeroMTR,
        cnpTransportador: normalizarCnpj(dadosExtraidos.transportador?.cnpj || ''),
        cnpDestinador: normalizarCnpj(dadosExtraidos.destinador?.cnpj || '')
      },
      {
        headers: { 'Content-Type': 'application/json' },
        validateStatus: () => true
      }
    );

    // 5. Interpretação da situação e validações
    let respostaVerificacao;
    try {
      respostaVerificacao = typeof verificacao.data === 'string' 
        ? JSON.parse(verificacao.data) 
        : verificacao.data;
    } catch (error) {
      throw new Error('Erro ao interpretar resposta de verificação');
    }

    const situacaoCodigo = respostaVerificacao.situacaoManifestoCodigo?.toString();
    const situacaoDescricao = respostaVerificacao.situacaoManifestoDescricao || 'Desconhecido';

    // Definição dos status de validação
    const STATUS = {
      OK: 200,          // MTR válido (não recebido nem cancelado)
      RECEBIDO: 405,    // MTR já recebido (código 3)
      CANCELADO: 406,    // MTR cancelado (código 4)
      DESTINADOR_INVALIDO: 407, // CNPJ do destinador diferente do gerador
      TEMPORARIO: 405
    };

    // Validação do status do MTR (única que afeta isValid)
    let statusValidacao = STATUS.OK;
    let isValid = true;
    let validationMessage = 'MTR válido';

    if (situacaoCodigo === '3') {
      statusValidacao = STATUS.RECEBIDO;
      isValid = false;
      validationMessage = 'MTR já recebido';
    } else if (situacaoCodigo === '4') {
      statusValidacao = STATUS.CANCELADO;
      isValid = false;
      validationMessage = 'MTR cancelado';
    }  else if (situacaoCodigo === '9') {
      statusValidacao = STATUS.TEMPORARIO;
      isValid = false;
      validationMessage = 'MTR temporario';
    } 

    // Validação do CNPJ do destinador (independente, não afeta isValid)
    const cnpjGeradorNormalizado = normalizarCnpj(CNP_GERADOR || null);
    const cnpjDestinadorNormalizado = normalizarCnpj(dadosExtraidos.destinador?.cnpj || '');
    const destinadorValido = cnpjGeradorNormalizado === cnpjDestinadorNormalizado;
    const destinadorStatus = destinadorValido ? STATUS.OK : STATUS.DESTINADOR_INVALIDO;
    const destinadorMessage = destinadorValido 
      ? 'CNPJ do destinador válido (igual ao gerador)' 
      : 'CNPJ do destinador deve ser igual ao do gerador';

    // 6. Retorno final padronizado
    const responseData = {
      success: true,
      data: dadosExtraidos,
      status: {
        code: situacaoCodigo,
        description: situacaoDescricao
      },
      validation: {
        isValid, // Só é afetado pelo status do MTR
        code: !isValid ? statusValidacao : !destinadorValido ? destinadorStatus : STATUS.OK,
        message: !isValid ? validationMessage : !destinadorValido ? destinadorMessage : validationMessage,
        details: {
          statusMTR: {
            isValid,
            code: situacaoCodigo,
            description: situacaoDescricao
          },
          destinador: {
            isValid: destinadorValido,
            code: destinadorStatus,
            message: destinadorMessage,
            cnpjGerador: CNP_GERADOR,
            cnpjDestinador: dadosExtraidos.destinador?.cnpj
          }
        }
      }
    };

    // Retorna com o status HTTP correspondente à prioridade mais alta
    const responseStatus = !isValid ? statusValidacao : !destinadorValido ? destinadorStatus : STATUS.OK;
    res.status(responseStatus).json(responseData);

  } catch (error: any) {
    console.error('❌ Erro inesperado:', error.message);
    res.status(500).json({
      success: false,
      error: true,
      message: 'Erro inesperado ao processar manifesto',
      detail: error.message
    });
  }
}
