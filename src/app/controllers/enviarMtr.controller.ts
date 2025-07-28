'use client';

import { useState, useEffect, useRef } from 'react';
import { buscarListas, enviarMtr } from './action';

interface ListaItem {
  [key: string]: any;
}

interface MTRResponse {
  numeroMTR: string;
  gerador: {
    cnpj: string;
  };
  transportador: {
    placa: string;
    nomeMotorista: string;
    cnpj: string;
  };
  residuo: {
    codigoIbama: string;
    estadoFisico: string;
    classe: string;
    tecnologia: string;
    quantidade: string;
    unidade: string;
    acondicionamento: string;
  };
  dataTransporte: string;
}

interface MtrError {
  codigo: string;
  erro: string;
}

interface RetornoErro {
  manifestoCodigo: string | number;
  retornoCodigo: number;
  retorno: string;
  [key: string]: any;
}

export default function MtrBaixaPage() {
  const [, setListas] = useState({
    acondicionamentos: [] as ListaItem[],
    classes: [] as ListaItem[],
    estadosFisicos: [] as ListaItem[],
    residuos: [] as ListaItem[],
    tecnologias: [] as ListaItem[],
    unidades: [] as ListaItem[]
  });

  const [loading, setLoading] = useState(true);
  const [mtrsSelecionados, setMtrsSelecionados] = useState<string[]>([]);
  const [mtrsValidos, setMtrsValidos] = useState<MTRResponse[]>([]);
  const [mtrsInvalidos, setMtrsInvalidos] = useState<MtrError[]>([]);
  const [retornosErro, setRetornosErro] = useState<RetornoErro[]>([]);
  const [form, setForm] = useState({
    placaVeiculo: '',
    nomeMotorista: '',
    recebimentoMtrResponsavel: 'Pierre',
    recebimentoMtrCargo: 'Balanceiro',
    recebimentoMtrData: '',
    transporteMtrData: '',
    recebimentoMtrObs: '',
    qtdRecebida: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [consultando, setConsultando] = useState(false);
  const [mtrsDuplicados, setMtrsDuplicados] = useState<string[]>([]);

  useEffect(() => {
    async function carregarListas() {
      try {
        const dados = await buscarListas();
        setListas({
          acondicionamentos: dados.acondicionamentos.unidades || [],
          classes: dados.classes.unidades || [],
          estadosFisicos: dados.estadosFisicos.unidades || [],
          residuos: dados.residuos.unidades || [],
          tecnologias: dados.tecnologias.unidades || [],
          unidades: dados.unidades.unidades || []
        });
      } catch (error) {
        console.error("Erro ao carregar listas:", error);
      } finally {
        setLoading(false);
      }
    }
    carregarListas();

    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const limparDados = () => {
    setMtrsSelecionados([]);
    setMtrsValidos([]);
    setMtrsInvalidos([]);
    setMtrsDuplicados([]);
    setRetornosErro([]);
    setForm({
      placaVeiculo: '',
      nomeMotorista: '',
      recebimentoMtrResponsavel: 'Pierre',
      recebimentoMtrCargo: 'Balanceiro',
      recebimentoMtrData: '',
      transporteMtrData: '',
      recebimentoMtrObs: '',
      qtdRecebida: ''
    });
    setErrors({});
    if (textareaRef.current) {
      textareaRef.current.value = '';
      textareaRef.current.focus();
    }
  };

 async function handleEnviarDados() {
  const payload = gerarObjetoFinal();
  if (!payload) return;

  try {
    const resposta = await enviarMtr(payload);

    if (!resposta) {
      throw new Error("Resposta vazia recebida do servidor");
    }

    if (resposta.success) {      
      
      // Verifica se temos dados e se eles contêm a estrutura esperada
      if (resposta.data && typeof resposta.data === 'object') {
        // Extrai os manifestos da resposta
        const manifestos = resposta.data.data.manifestoRecebimentoJSONs || [];
        

        if (Array.isArray(manifestos)) {
          // Filtra apenas os itens com erro (retornoCodigo !== 0)
          const erros = manifestos.filter(
            (item: any) => item.retornoCodigo !== undefined && item.retornoCodigo !== 0
          );
        
          setRetornosErro(erros);

          if (erros.length === 0) {
            alert("Todos os MTRs foram processados com sucesso!");
            limparDados();
          } else {
            alert(`Processamento concluído com ${erros.length} erro(s). Verifique os detalhes abaixo.`);
          }
        } else {
          console.warn("Formato de manifestos inesperado:", manifestos);
          setRetornosErro([{
            manifestoCodigo: 'N/A',
            retornoCodigo: -2,
            retorno: 'Formato de dados inesperado na resposta'
          }]);
        }
      } else {
        console.warn("Estrutura de dados inesperada:", resposta.data);
        setRetornosErro([{
          manifestoCodigo: 'N/A',
          retornoCodigo: -1,
          retorno: 'Resposta do servidor em formato inesperado'
        }]);
      }
    } else {
      const errorMessage = resposta.message || 'Erro desconhecido ao enviar MTRs';
      alert(`Erro ao enviar MTRs: ${errorMessage}`);
      setRetornosErro([{
        manifestoCodigo: 'N/A',
        retornoCodigo: -1,
        retorno: errorMessage
      }]);
    }
  } catch (error) {
    console.error("Erro no envio:", error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    alert(`Erro ao comunicar com o servidor: ${errorMessage}`);
    setRetornosErro([{
      manifestoCodigo: 'N/A',
      retornoCodigo: -1,
      retorno: errorMessage
    }]);
  }
}

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'qtdRecebida') {
      if (!/^\d*\.?\d*$/.test(value) && value !== '') {
        return;
      }
    }

    setForm(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.placaVeiculo.trim()) newErrors.placaVeiculo = "Placa do veículo é obrigatória";
    if (!form.nomeMotorista.trim()) newErrors.nomeMotorista = "Nome do motorista é obrigatório";
    if (!form.recebimentoMtrData) newErrors.recebimentoMtrData = "Data de recebimento é obrigatória";
    if (!form.qtdRecebida) {
      newErrors.qtdRecebida = "Quantidade recebida é obrigatória";
    } else if (!/^\d+(\.\d{1,3})?$/.test(form.qtdRecebida)) {
      newErrors.qtdRecebida = "Quantidade deve ser numérica (ex: 10 ou 10.5)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const processarMTRs = (mtrs: string[]): { unicos: string[], duplicados: string[] } => {
    const seen = new Set<string>();
    const duplicados: string[] = [];
    const unicos: string[] = [];

    mtrs.forEach(mtr => {
      const mtrProcessado = mtr.substring(0, 10);
      if (!mtrProcessado) return;

      if (seen.has(mtrProcessado)) {
        duplicados.push(mtrProcessado);
      } else {
        seen.add(mtrProcessado);
        unicos.push(mtrProcessado);
      }
    });

    return { unicos, duplicados };
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (/[0-9]|Backspace|Delete|ArrowLeft|ArrowRight|ArrowUp|ArrowDown|Tab|Enter|Home|End|PageUp|PageDown/.test(e.key)) {
      return;
    }

    if (e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }

    e.preventDefault();
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const lines = value.split('\n');
    const processedLines = lines.map(line => {
      const numbers = line.replace(/\D/g, '').substring(0, 10);
      return numbers;
    });

    e.target.value = processedLines.join('\n');
    const validMtrs = processedLines.filter(line => line.length > 0);
    const { unicos, duplicados } = processarMTRs(validMtrs);
    setMtrsSelecionados(unicos);
    setMtrsDuplicados(duplicados);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = textareaRef.current.value.length;
      }
    }, 0);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text/plain');
    const lines = pastedText.split(/\r?\n/);
    const numbers = lines.flatMap(line => {
      const matches = line.match(/\d+/g) || [];
      return matches.map(num => num.substring(0, 10));
    }).filter(num => num.length > 0);

    const currentMtrs = textareaRef.current?.value.split('\n').filter(Boolean) || [];
    const allMtrs = [...currentMtrs, ...numbers];

    const { unicos, duplicados } = processarMTRs(allMtrs);
    setMtrsSelecionados(unicos);
    setMtrsDuplicados(duplicados);

    if (textareaRef.current) {
      textareaRef.current.value = unicos.join('\n');
      textareaRef.current.selectionStart = textareaRef.current.selectionEnd = textareaRef.current.value.length;
    }
  };

  async function consultarMtrs() {
    const { unicos, duplicados } = processarMTRs(mtrsSelecionados);

    if (unicos.length === 0) {
      alert("Por favor, insira pelo menos um MTR válido para consulta");
      return;
    }

    setConsultando(true);
    setMtrsValidos([]);
    setMtrsInvalidos([]);
    setMtrsDuplicados(duplicados);

    const resultados: MTRResponse[] = [];
    const erros: MtrError[] = [];

    const STATUS = {
      OK: 200,
      RECEBIDO: 405,
      CANCELADO: 406,
      DESTINADOR_INVALIDO: 407,
      TEMPORARIO: 405
    };

    for (const codigo of unicos) {
      try {
        const res = await fetch('https://crvr-back.vercel.app/api/mtr/manifesto-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ manifestoCodigo: codigo }),
        });

        const data = await res.json();

        switch (res.status) {
          case STATUS.OK:
            if (data.validation?.isValid) {
              resultados.push(data.data);
            } else {
              erros.push({
                codigo,
                erro: "MTR inválido (validação falhou)"
              });
            }
            break;

          case STATUS.RECEBIDO:
            erros.push({
              codigo,
              erro: "MTR já recebido anteriormente (Status 405 - Recebido)"
            });
            break;

          case STATUS.CANCELADO:
            erros.push({
              codigo,
              erro: "MTR cancelado (Status 406 - Cancelado)"
            });
            break;

          case STATUS.DESTINADOR_INVALIDO:
            erros.push({
              codigo,
              erro: "CNPJ do destinador não corresponde ao gerador (Status 407)"
            });
            break;

          case STATUS.TEMPORARIO:
            erros.push({
              codigo,
              erro: "MTR temporário não pode ser recebido (Status 405 - Temporário)"
            });
            break;

          default:
            erros.push({
              codigo,
              erro: `Erro desconhecido (Status ${res.status})`
            });
        }
      } catch {
        erros.push({
          codigo,
          erro: "Falha na conexão com o servidor"
        });
      }
    }

    if (resultados.length > 0) {
      const dataTransporte = resultados[0].dataTransporte || new Date().toLocaleDateString('pt-BR');
      const [dia, mes, ano] = dataTransporte.split('/');
      const dataFormatada = `${ano}${mes.padStart(2, '0')}${dia.padStart(2, '0')}`;

      setForm(prev => ({
        ...prev,
        transporteMtrData: dataFormatada
      }));
    }

    setMtrsValidos(resultados);
    setMtrsInvalidos(erros);
    setConsultando(false);
  }

  function gerarObjetoFinal() {
    if (!validateForm()) return;
    if (mtrsValidos.length === 0) {
      alert("Nenhum MTR válido para gerar o JSON");
      return;
    }

    const formatDate = (dateString: string) => {
      if (!dateString) return '';
      if (/^\d{8}$/.test(dateString)) return dateString;

      const date = new Date(dateString);
      date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}${month}${day}`;
    };

    const limparCNPJ = (cnpj: string) => cnpj.replace(/\D/g, '');

    const qtdPorManifesto = parseFloat((parseFloat(form.qtdRecebida) / mtrsValidos.length).toFixed(3));

    const payload = {
      login: '12345678901',
      senha: 'fepampass',
      cnp: '12345678901234',
      manifestoRecebimentoJSONs: mtrsValidos.map((m) => {
        const codigoEstadoFisico = m.residuo.estadoFisico === 'Sólido' ? 1 : 2;
        const codigoClasse = m.residuo.classe === 'IIA' ? 3 : 1;
        const codigoTecnologia = m.residuo.tecnologia === 'Aterro' ? 7 : 5;
        const codigoUnidade = m.residuo.unidade === 'Tonelada' ? 4 : 1;
        const codigoAcondicionamento = 1;

        return {
          manifestoCodigo: m.numeroMTR,
          cnpGerador: limparCNPJ(m.gerador?.cnpj || ''),
          cnpTransportador: limparCNPJ(m.transportador?.cnpj || ''),
          recebimentoMtrResponsavel: form.recebimentoMtrResponsavel,
          recebimentoMtrCargo: form.recebimentoMtrCargo,
          recebimentoMtrData: formatDate(form.recebimentoMtrData),
          transporteMtrData: form.transporteMtrData,
          recebimentoMtrObs: form.recebimentoMtrObs || '',
          nomeMotorista: form.nomeMotorista,
          placaVeiculo: form.placaVeiculo,
          itemManifestoRecebimentoJSONs: [
            {
              codigoSequencial: 1,
              justificativa: null,
              codigoInterno: null,
              qtdRecebida: qtdPorManifesto,
              residuo: m.residuo?.codigoIbama?.replace(/\D/g, '') || '',
              codigoAcondicionamento: codigoAcondicionamento,
              codigoClasse: codigoClasse,
              codigoTecnologia: codigoTecnologia,
              codigoTipoEstado: codigoEstadoFisico,
              codigoUnidade: codigoUnidade
            }
          ]
        };
      })
    };

    console.log('Payload para envio:', JSON.stringify(payload, null, 2));
    return payload;
  }

  const renderInputField = (
    label: string,
    name: string,
    type = "text",
    placeholder = "",
    required = false,
    className = ""
  ) => {
    const error = errors[name];
    const value = (form as any)[name];

    return (
      <div className={className}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
          name={name}
          type={type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={`w-full p-2 text-sm border rounded-md transition-colors duration-200
            ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' :
              'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}
            focus:outline-none focus:ring-2`}
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Dar baixa em MTRs</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-700">Lista de MTRs</h3>
          <button
            onClick={limparDados}
            className="text-sm text-red-600 hover:text-red-800 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Limpar dados
          </button>
        </div>

        <textarea
          ref={textareaRef}
          className={`w-full p-3 border rounded-md focus:ring-2 focus:outline-none transition-colors duration-200
            ${mtrsInvalidos.length > 0 || mtrsDuplicados.length > 0 ?
              'border-red-300 focus:ring-red-500 focus:border-red-500' :
              'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
          rows={8}
          placeholder="Digite ou cole os MTRs (um por linha ou separados por espaços/tabs)\nApenas os 10 primeiros dígitos serão considerados"
          onChange={handleTextareaChange}
          onKeyDown={handleTextareaKeyDown}
          onPaste={handlePaste}
        />

        <div className="flex flex-wrap items-center gap-4 mt-4">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors 
              disabled:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={consultarMtrs}
            disabled={consultando || mtrsSelecionados.length === 0}
          >
            {consultando ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Consultando...
              </span>
            ) : 'Consultar MTRs'}
          </button>

          <div className="text-sm text-gray-600">
            {mtrsSelecionados.length > 0 ? (
              <span className="font-medium text-blue-600">
                {mtrsSelecionados.length} MTR(s) únicos prontos para consulta
              </span>
            ) : 'Digite ou cole os códigos MTR'}
          </div>
        </div>

        {mtrsDuplicados.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-yellow-700 mb-2">
              {mtrsDuplicados.length} MTR(s) duplicados (removidos automaticamente):
            </p>
            <div className="max-h-40 overflow-y-auto border border-yellow-200 rounded-md p-3 bg-yellow-50">
              {mtrsDuplicados.map((mtr, index) => (
                <div key={index} className="text-sm text-yellow-700 mb-1 flex items-start">
                  <span className="inline-block mr-2 mt-0.5">
                    <svg className="h-4 w-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </span>
                  <span className="font-mono bg-yellow-100 px-1 rounded">{mtr}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {mtrsValidos.length > 0 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm font-medium text-green-800">
              {mtrsValidos.length} MTR(s) válidos prontos para envio.
            </p>
          </div>
        )}

        {mtrsInvalidos.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-red-700 mb-2">
              {mtrsInvalidos.length} MTR(s) com problemas:
            </p>
            <div className="max-h-40 overflow-y-auto border border-red-200 rounded-md p-3 bg-red-50">
              {mtrsInvalidos.map((mtr, index) => (
                <div key={index} className="text-sm text-red-600 mb-1 flex items-start">
                  <span className="inline-block mr-2 mt-0.5">
                    <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <span>
                    <span className="font-mono bg-red-100 px-1 rounded">{mtr.codigo}</span> - {mtr.erro}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {mtrsValidos.length > 0 && (
        <>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Informações do Recebimento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderInputField("Placa do Veículo", "placaVeiculo", "text", "ABC-1234", true)}
              {renderInputField("Nome do Motorista", "nomeMotorista", "text", "", true)}
              {renderInputField("Data de Recebimento", "recebimentoMtrData", "date", "", true)}
              {renderInputField(
                "Quantidade Total Recebida (será dividida entre os MTRs)",
                "qtdRecebida",
                "text",
                "Ex: 10.5",
                true,
                "md:col-span-1"
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  name="recebimentoMtrObs"
                  value={form.recebimentoMtrObs}
                  onChange={handleChange}
                  className={`w-full p-2 text-sm border rounded-md transition-colors duration-200
                    ${errors.recebimentoMtrObs ? 'border-red-500 focus:ring-red-500 focus:border-red-500' :
                      'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}
                    focus:outline-none focus:ring-2`}
                  rows={2}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors 
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={gerarObjetoFinal}
            >
              Gerar JSON Final
            </button>
            <button
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors 
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              onClick={handleEnviarDados}
            >
              Enviar para FEPAM
            </button>
          </div>

          {retornosErro.length > 0 && (
            <div className="mt-6 bg-red-50 border border-red-300 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-red-700 font-semibold">Erros no processamento:</h3>
                <button 
                  onClick={() => setRetornosErro([])}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Limpar erros
                </button>
              </div>
              <ul className="space-y-2 text-sm text-red-800">
                {retornosErro.map((retorno, index) => (
                  <li key={index} className="border border-red-200 rounded-md p-2 bg-white">
                    <p><strong>MTR:</strong> {retorno.manifestoCodigo}</p>
                    <p><strong>Código:</strong> {retorno.retornoCodigo}</p>
                    <p><strong>Mensagem:</strong> {retorno.retorno}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
