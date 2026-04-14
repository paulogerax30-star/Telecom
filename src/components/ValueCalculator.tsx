import React, { useState } from 'react';
import { 
  Calculator, 
  Clock, 
  DollarSign, 
  RefreshCw, 
  Copy, 
  CheckCircle2, 
  AlertCircle,
  ArrowRightLeft,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export default function ValueCalculator() {
  const [mode, setMode] = useState<'value' | 'rate'>('value');
  const [tarifa, setTarifa] = useState<string>("0.05");
  const [valorTotalInput, setValorTotalInput] = useState<string>("3.00");
  const [formatoTempo, setFormatoTempo] = useState<'segundos' | 'minutos' | 'hhmmss'>('minutos');
  const [tempoInput, setTempoInput] = useState<string>("60");
  const [pagarFornecedor, setPagarFornecedor] = useState(false);
  const [valorDevido, setValorDevido] = useState<string>("0.00");

  const handleClear = () => {
    setTarifa("0.05");
    setValorTotalInput("3.00");
    setTempoInput("60");
    setValorDevido("0.00");
    setPagarFornecedor(false);
    setFormatoTempo('minutos');
  };

  const calculateSeconds = () => {
    if (formatoTempo === 'segundos') return parseFloat(tempoInput.replace(',', '.')) || 0;
    if (formatoTempo === 'minutos') return (parseFloat(tempoInput.replace(',', '.')) || 0) * 60;
    if (formatoTempo === 'hhmmss') {
      try {
        const parts = tempoInput.split(':');
        if (parts.length !== 3) return 0;
        const [h, m, s] = parts.map(p => parseInt(p, 10) || 0);
        return h * 3600 + m * 60 + s;
      } catch {
        return 0;
      }
    }
    return 0;
  };

  const tempoSeg = calculateSeconds();
  const tempoMin = tempoSeg / 60;
  
  // Logic for Calculate Value mode
  const tarifaVal = parseFloat(tarifa.replace(',', '.')) || 0;
  const valorCalculado = mode === 'value' ? (tempoMin * tarifaVal) : (parseFloat(valorTotalInput.replace(',', '.')) || 0);
  
  // Logic for Calculate Rate mode
  const calculatedTarifa = mode === 'rate' && tempoMin > 0 ? (valorCalculado / tempoMin) : tarifaVal;

  const valorDevidoVal = parseFloat(valorDevido.replace(',', '.')) || 0;

  const getScenario = () => {
    if (!pagarFornecedor) return null;
    if (Math.abs(valorCalculado - valorDevidoVal) < 0.01) return 'EQUAL';
    if (valorCalculado > valorDevidoVal) return 'ABATER';
    return 'PAGAR';
  };

  const scenario = getScenario();
  const diff = Math.abs(valorCalculado - valorDevidoVal);

  const copySummary = () => {
    let text = mode === 'value' 
      ? `Com base na tarifa de R$ ${tarifaVal.toFixed(4)}/min e no tempo de ${tempoMin.toFixed(2)} min, o valor calculado foi de R$ ${valorCalculado.toFixed(2)}.`
      : `Com base no valor total de R$ ${valorCalculado.toFixed(2)} e no tempo de ${tempoMin.toFixed(2)} min, a tarifa calculada foi de R$ ${calculatedTarifa.toFixed(4)}/min.`;
    
    if (pagarFornecedor) {
      if (scenario === 'ABATER') {
        text += ` Comparando com o valor devido ao fornecedor de R$ ${valorDevidoVal.toFixed(2)}, o sistema conclui que deve abater a dívida do fornecedor e ainda sobra R$ ${diff.toFixed(2)}.`;
      } else if (scenario === 'PAGAR') {
        text += ` Comparando com o valor devido ao fornecedor de R$ ${valorDevidoVal.toFixed(2)}, o sistema conclui que o valor calculado não cobre a dívida e ainda é necessário pagar R$ ${diff.toFixed(2)} ao fornecedor.`;
      } else {
        text += ` O valor calculado cobre exatamente o valor devido ao fornecedor.`;
      }
    }
    navigator.clipboard.writeText(text);
    toast.success('Resumo copiado para a área de transferência!');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Calculador de Tempo</h2>
            <p className="text-slate-500 font-medium">Cálculo financeiro rápido de repasse e custo operacional.</p>
          </div>
        </div>
        
        <div className="flex p-1 bg-slate-100 rounded-2xl">
          <button
            onClick={() => setMode('value')}
            className={cn(
              "px-6 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all",
              mode === 'value' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Calcular Valor
          </button>
          <button
            onClick={() => setMode('rate')}
            className={cn(
              "px-6 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all",
              mode === 'rate' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Calcular Tarifa
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                {mode === 'value' ? (
                  <>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <DollarSign className="w-3 h-3" /> Tarifa por Minuto (R$)
                    </label>
                    <input 
                      type="text"
                      value={tarifa}
                      onChange={(e) => setTarifa(e.target.value)}
                      placeholder="0,05"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    />
                  </>
                ) : (
                  <>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <DollarSign className="w-3 h-3" /> Valor Total (R$)
                    </label>
                    <input 
                      type="text"
                      value={valorTotalInput}
                      onChange={(e) => setValorTotalInput(e.target.value)}
                      placeholder="3,00"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    />
                  </>
                )}
                <p className="text-[10px] text-slate-400 font-bold italic">Use ponto ou vírgula para decimais.</p>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Clock className="w-3 h-3" /> Formato do Tempo
                </label>
                <div className="flex p-1 bg-slate-100 rounded-2xl">
                  {(['segundos', 'minutos', 'hhmmss'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFormatoTempo(f)}
                      className={cn(
                        "flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all",
                        formatoTempo === f ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      {f === 'hhmmss' ? 'hh:mm:ss' : f}
                    </button>
                  ))}
                </div>
                <input 
                  type="text"
                  value={tempoInput}
                  onChange={(e) => setTempoInput(e.target.value)}
                  placeholder={formatoTempo === 'hhmmss' ? "01:30:00" : "60"}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                    pagarFornecedor ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
                  )}>
                    <ArrowRightLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Pagar Fornecedor</h4>
                    <p className="text-[10px] text-slate-400 font-bold">Habilitar comparação de dívida</p>
                  </div>
                </div>
                <button 
                  onClick={() => setPagarFornecedor(!pagarFornecedor)}
                  className={cn(
                    "w-14 h-7 rounded-full transition-all relative",
                    pagarFornecedor ? "bg-blue-600" : "bg-slate-200"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm",
                    pagarFornecedor ? "left-8" : "left-1"
                  )} />
                </button>
              </div>

              {pagarFornecedor && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3 overflow-hidden"
                >
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    Valor devido ao fornecedor (R$)
                  </label>
                  <input 
                    type="text"
                    value={valorDevido}
                    onChange={(e) => setValorDevido(e.target.value)}
                    placeholder="0,00"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  />
                </motion.div>
              )}
            </div>

            <div className="flex items-center gap-4 pt-4">
              <button 
                onClick={handleClear}
                className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" /> Limpar
              </button>
              <button 
                onClick={copySummary}
                className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-2"
              >
                <Copy className="w-5 h-5" /> Copiar Resumo
              </button>
            </div>
          </div>
        </div>

        {/* Result Section */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden h-full flex flex-col">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            
            <div className="relative z-10 flex-1">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">
                {mode === 'value' ? (pagarFornecedor ? 'Saldo Final' : 'Resultado Final') : 'Tarifa Calculada'}
              </p>
              <h3 className={cn(
                "text-6xl font-black tracking-tighter mb-8 transition-colors",
                mode === 'value' && pagarFornecedor && (valorCalculado - valorDevidoVal < 0) ? "text-rose-400" : "text-blue-400"
              )}>
                {mode === 'value' ? (
                  `R$ ${(pagarFornecedor ? (valorCalculado - valorDevidoVal) : valorCalculado).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                ) : (
                  `R$ ${calculatedTarifa.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`
                )}
              </h3>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center py-3 border-b border-white/10">
                  <span className="text-xs font-bold text-slate-400">Tempo em Minutos</span>
                  <span className="text-sm font-black text-blue-400">{tempoMin.toFixed(2)} min</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/10">
                  <span className="text-xs font-bold text-slate-400">Tempo em Segundos</span>
                  <span className="text-sm font-black text-blue-400">{tempoSeg.toLocaleString()}s</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/10">
                  <span className="text-xs font-bold text-slate-400">{mode === 'value' ? 'Tarifa Aplicada' : 'Valor Total'}</span>
                  <span className="text-sm font-black text-blue-400">
                    {mode === 'value' ? `R$ ${tarifaVal.toFixed(4)}/min` : `R$ ${valorCalculado.toFixed(2)}`}
                  </span>
                </div>
              </div>

              {pagarFornecedor && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-6 rounded-2xl border-2 flex flex-col gap-3",
                    scenario === 'ABATER' ? "bg-emerald-500/10 border-emerald-500/20" :
                    scenario === 'PAGAR' ? "bg-rose-500/10 border-rose-500/20" :
                    "bg-blue-500/10 border-blue-500/20"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {scenario === 'ABATER' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> :
                     scenario === 'PAGAR' ? <AlertCircle className="w-5 h-5 text-rose-400" /> :
                     <Info className="w-5 h-5 text-blue-400" />}
                    <h5 className={cn(
                      "text-xs font-black uppercase tracking-widest",
                      scenario === 'ABATER' ? "text-emerald-400" :
                      scenario === 'PAGAR' ? "text-rose-400" :
                      "text-blue-400"
                    )}>
                      {scenario === 'ABATER' ? 'Cenário: Abater Dívida' :
                       scenario === 'PAGAR' ? 'Cenário: Pagar Faltante' :
                       'Cenário: Quitado'}
                    </h5>
                  </div>
                  <p className="text-xs font-medium text-slate-300 leading-relaxed">
                    {scenario === 'ABATER' ? `O valor calculado é maior que a dívida. Deve abater a dívida do fornecedor e ainda sobra R$ ${diff.toFixed(2)}.` :
                     scenario === 'PAGAR' ? `O valor calculado não cobre a dívida. Ainda é necessário pagar R$ ${diff.toFixed(2)} ao fornecedor.` :
                     `O valor calculado cobre exatamente o valor devido ao fornecedor.`}
                  </p>
                </motion.div>
              )}
            </div>

            <div className="relative z-10 mt-8 pt-8 border-t border-white/10">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <Info className="w-3 h-3" /> Memória de Cálculo
              </div>
              <p className="text-[10px] text-slate-400 mt-2 font-mono">
                {mode === 'value' ? (
                  `(${tempoSeg}s / 60) * ${tarifaVal} = ${valorCalculado.toFixed(4)}`
                ) : (
                  `${valorCalculado.toFixed(2)} / (${tempoSeg}s / 60) = ${calculatedTarifa.toFixed(4)}`
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
