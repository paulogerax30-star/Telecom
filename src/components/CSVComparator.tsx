import React, { useState, useCallback, useMemo } from 'react';
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Search, 
  Filter, 
  Download, 
  ArrowRight, 
  ArrowLeft,
  RefreshCw,
  Columns,
  Hash,
  Activity,
  Zap,
  Shield,
  AlertTriangle,
  XCircle,
  FileSearch,
  BarChart3
} from 'lucide-react';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface CSVData {
  name: string;
  data: any[];
  fields: string[];
}

interface ComparisonResult {
  onlyInA: any[];
  onlyInB: any[];
  missingColumnsInA: string[];
  missingColumnsInB: string[];
  identical: {
    key: string;
    row: any;
  }[];
  divergent: {
    key: string;
    rowA: any;
    rowB: any;
    diffs: string[];
    identicalFields: string[];
  }[];
  metrics: {
    totalA: number;
    totalB: number;
    uniqueA: number;
    uniqueB: number;
    divergentCount: number;
    identicalCount: number;
    parityPercentage: number;
  };
}

export default function CSVComparator() {
  const [fileA, setFileA] = useState<CSVData | null>(null);
  const [fileB, setFileB] = useState<CSVData | null>(null);
  const [primaryKey, setPrimaryKey] = useState<string>('');
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [activeView, setActiveView] = useState<'summary' | 'divergent' | 'identical' | 'onlyA' | 'onlyB'>('summary');

  const handleFileUpload = (file: File, target: 'A' | 'B') => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: true,
      complete: (results) => {
        const csvData: CSVData = {
          name: file.name,
          data: results.data,
          fields: results.meta.fields || []
        };
        if (target === 'A') setFileA(csvData);
        else setFileB(csvData);
        toast.success(`Arquivo ${target} carregado: ${file.name}`);
      },
      error: (error) => {
        toast.error(`Erro ao ler arquivo ${target}: ${error.message}`);
      }
    });
  };

  const commonFields = useMemo(() => {
    if (!fileA || !fileB) return [];
    return fileA.fields.filter(f => fileB.fields.includes(f));
  }, [fileA, fileB]);

  const runComparison = () => {
    if (!fileA || !fileB || !primaryKey) {
      toast.error("Selecione os arquivos e a chave primária.");
      return;
    }

    setIsComparing(true);
    
    // Use setTimeout to allow UI to show loading state
    setTimeout(() => {
      try {
        const getRowKey = (row: any) => primaryKey === 'FULL_ROW' ? JSON.stringify(row) : String(row[primaryKey]);
        
        const mapA = new Map(fileA.data.map(row => [getRowKey(row), row]));
        const mapB = new Map(fileB.data.map(row => [getRowKey(row), row]));

        const onlyInA: any[] = [];
        const divergent: ComparisonResult['divergent'] = [];
        const identical: ComparisonResult['identical'] = [];
        const commonKeys: string[] = [];

        mapA.forEach((rowA, key) => {
          const rowB = mapB.get(key);
          if (!rowB) {
            onlyInA.push(rowA);
          } else {
            commonKeys.push(key);
            const diffs: string[] = [];
            const identicalFields: string[] = [];
            
            commonFields.forEach(field => {
              if (rowA[field] === rowB[field]) {
                identicalFields.push(field);
              } else {
                diffs.push(field);
              }
            });

            if (diffs.length > 0) {
              divergent.push({ key, rowA, rowB, diffs, identicalFields });
            } else {
              identical.push({ key, row: rowA });
            }
          }
        });

        const onlyInB: any[] = [];
        mapB.forEach((rowB, key) => {
          if (!mapA.has(key)) {
            onlyInB.push(rowB);
          }
        });

        const missingColumnsInA = fileB.fields.filter(f => !fileA.fields.includes(f));
        const missingColumnsInB = fileA.fields.filter(f => !fileB.fields.includes(f));

        const totalCommon = commonKeys.length;
        const parityPercentage = totalCommon > 0 ? (identical.length / totalCommon) * 100 : 0;

        setComparisonResult({
          onlyInA,
          onlyInB,
          missingColumnsInA,
          missingColumnsInB,
          divergent,
          identical,
          metrics: {
            totalA: fileA.data.length,
            totalB: fileB.data.length,
            uniqueA: onlyInA.length,
            uniqueB: onlyInB.length,
            divergentCount: divergent.length,
            identicalCount: identical.length,
            parityPercentage
          }
        });
        setActiveView('summary');
        toast.success("Comparação concluída com sucesso!");
      } catch (err: any) {
        toast.error("Erro na comparação: " + err.message);
      } finally {
        setIsComparing(false);
      }
    }, 500);
  };

  const reset = () => {
    setFileA(null);
    setFileB(null);
    setPrimaryKey('');
    setComparisonResult(null);
    setActiveView('summary');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
            <FileSearch className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Comparador de Relatórios</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Análise de divergências entre arquivos CSV</p>
          </div>
        </div>
        {comparisonResult && (
          <button 
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Nova Comparação
          </button>
        )}
      </div>

      {!comparisonResult ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* File A */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
              {fileA ? `Arquivo A: ${fileA.name}` : "Arquivo A (Meu Relatório)"}
            </h3>
            <UploadZone 
              file={fileA} 
              onUpload={(f) => handleFileUpload(f, 'A')} 
              label="Arraste o primeiro CSV"
            />
          </div>

          {/* File B */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
              {fileB ? `Arquivo B: ${fileB.name}` : "Arquivo B (Relatório Externo)"}
            </h3>
            <UploadZone 
              file={fileB} 
              onUpload={(f) => handleFileUpload(f, 'B')} 
              label="Arraste o segundo CSV"
            />
          </div>

          {/* Configuration & Run */}
          {fileA && fileB && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Columns className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">Chave de Cruzamento</h4>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Selecione a coluna comum que identifica unicamente cada registro em ambos os arquivos.</p>
                  <select 
                    value={primaryKey}
                    onChange={(e) => setPrimaryKey(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="">Selecione a coluna...</option>
                    <option value="FULL_ROW" className="text-blue-600 font-black italic">TODAS AS COLUNAS (COMPARAÇÃO INTEGRAL)</option>
                    {commonFields.map(field => (
                      <option key={field} value={field}>{field}</option>
                    ))}
                  </select>
                  {commonFields.length === 0 && (
                    <div className="p-4 bg-rose-50 rounded-xl border border-rose-100 flex items-center gap-3">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest">Nenhuma coluna comum encontrada entre os arquivos.</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-end">
                  <button 
                    onClick={runComparison}
                    disabled={!primaryKey || isComparing}
                    className={cn(
                      "w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl",
                      !primaryKey || isComparing 
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                        : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200"
                    )}
                  >
                    {isComparing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Activity className="w-4 h-4" />
                        Iniciar Comparação Técnica
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Metrics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl shadow-slate-200 flex flex-col justify-between min-h-[140px]">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Paridade de Dados</p>
              <div>
                <h3 className="text-4xl font-black tracking-tight">{comparisonResult.metrics.parityPercentage.toFixed(1)}%</h3>
                <div className="h-1.5 bg-white/20 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-blue-400" style={{ width: `${comparisonResult.metrics.parityPercentage}%` }}></div>
                </div>
              </div>
            </div>
            
            <StatCard 
              title="Idênticos" 
              value={comparisonResult.metrics.identicalCount} 
              sub="Registros 100% iguais"
              color="emerald"
              icon={CheckCircle2}
            />
            
            <StatCard 
              title="Divergências" 
              value={comparisonResult.metrics.divergentCount} 
              sub="Valores diferentes encontrados"
              color={comparisonResult.metrics.divergentCount > 0 ? "rose" : "emerald"}
              icon={AlertTriangle}
            />
            
            <StatCard 
              title={fileB ? `Apenas em ${fileB.name}` : "Exclusivos em B"} 
              value={comparisonResult.metrics.uniqueB} 
              sub={`De um total de ${comparisonResult.metrics.totalB}`}
              color="amber"
              icon={ArrowLeft}
            />
          </div>

          {/* View Tabs */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-100 px-6">
              <ViewTab 
                active={activeView === 'summary'} 
                onClick={() => setActiveView('summary')} 
                label="Resumo" 
                count={null}
              />
              <ViewTab 
                active={activeView === 'divergent'} 
                onClick={() => setActiveView('divergent')} 
                label="Divergentes" 
                count={comparisonResult.metrics.divergentCount}
              />
              <ViewTab 
                active={activeView === 'identical'} 
                onClick={() => setActiveView('identical')} 
                label="Idênticos" 
                count={comparisonResult.metrics.identicalCount}
              />
              <ViewTab 
                active={activeView === 'onlyA'} 
                onClick={() => setActiveView('onlyA')} 
                label={fileA ? `Apenas em ${fileA.name}` : "Apenas em A"} 
                count={comparisonResult.metrics.uniqueA}
              />
              <ViewTab 
                active={activeView === 'onlyB'} 
                onClick={() => setActiveView('onlyB')} 
                label={fileB ? `Apenas em ${fileB.name}` : "Apenas em B"} 
                count={comparisonResult.metrics.uniqueB}
              />
            </div>

            <div className="p-6">
              {activeView === 'summary' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4">
                    <div className="space-y-6">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-600" />
                        Análise de Integridade
                      </h4>
                      <div className="space-y-4">
                        <MetricRow label={fileA ? `Total ${fileA.name}` : "Total Arquivo A"} value={comparisonResult.metrics.totalA} />
                        <MetricRow label={fileB ? `Total ${fileB.name}` : "Total Arquivo B"} value={comparisonResult.metrics.totalB} />
                        <MetricRow label="Registros em Comum" value={comparisonResult.metrics.totalA - comparisonResult.metrics.uniqueA} />
                        <MetricRow label="Registros Idênticos" value={(comparisonResult.metrics.totalA - comparisonResult.metrics.uniqueA) - comparisonResult.metrics.divergentCount} color="text-emerald-600" />
                      </div>
                    </div>
                    <div className="space-y-6">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-600" />
                        Qualidade da Chave
                      </h4>
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Chave Primária Utilizada</p>
                        <p className="text-lg font-black text-slate-900">{primaryKey === 'FULL_ROW' ? 'Comparação Integral (Todas as Colunas)' : primaryKey}</p>
                        <p className="text-xs text-slate-500 font-medium mt-2">
                          {primaryKey === 'FULL_ROW' 
                            ? 'Os registros foram comparados considerando a igualdade de todos os campos simultaneamente.'
                            : `Esta chave foi usada para cruzar ${comparisonResult.metrics.totalA} registros de A com ${comparisonResult.metrics.totalB} registros de B.`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Column Discrepancies */}
                  {(comparisonResult.missingColumnsInA.length > 0 || comparisonResult.missingColumnsInB.length > 0) && (
                    <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 space-y-4">
                      <div className="flex items-center gap-2 text-amber-700">
                        <AlertTriangle className="w-5 h-5" />
                        <h4 className="text-sm font-black uppercase tracking-tight">Divergências de Estrutura (Colunas)</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {comparisonResult.missingColumnsInB.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                              Colunas apenas em {fileA?.name || 'Arquivo A'}:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {comparisonResult.missingColumnsInB.map(col => (
                                <span key={col} className="px-2 py-1 bg-white border border-amber-200 rounded-lg text-[10px] font-bold text-amber-700">
                                  {col}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {comparisonResult.missingColumnsInA.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                              Colunas apenas em {fileB?.name || 'Arquivo B'}:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {comparisonResult.missingColumnsInA.map(col => (
                                <span key={col} className="px-2 py-1 bg-white border border-amber-200 rounded-lg text-[10px] font-bold text-amber-700">
                                  {col}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeView === 'divergent' && (
                <ComparisonTable 
                  data={comparisonResult.divergent} 
                  type="divergent" 
                  primaryKey={primaryKey}
                  fields={commonFields}
                  fileAName={fileA?.name}
                  fileBName={fileB?.name}
                />
              )}

              {activeView === 'identical' && (
                <ComparisonTable 
                  data={comparisonResult.identical} 
                  type="identical" 
                  primaryKey={primaryKey}
                  fields={commonFields}
                  fileAName={fileA?.name}
                  fileBName={fileB?.name}
                />
              )}

              {activeView === 'onlyA' && (
                <ComparisonTable 
                  data={comparisonResult.onlyInA} 
                  type="unique" 
                  primaryKey={primaryKey}
                  fields={fileA?.fields || []}
                  fileAName={fileA?.name}
                />
              )}

              {activeView === 'onlyB' && (
                <ComparisonTable 
                  data={comparisonResult.onlyInB} 
                  type="unique" 
                  primaryKey={primaryKey}
                  fields={fileB?.fields || []}
                  fileBName={fileB?.name}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Sub-components ---

function UploadZone({ file, onUpload, label }: { file: CSVData | null, onUpload: (f: File) => void, label: string }) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div 
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const f = e.dataTransfer.files[0];
        if (f && f.name.endsWith('.csv')) onUpload(f);
        else toast.error("Apenas arquivos CSV são permitidos.");
      }}
      className={cn(
        "border-2 border-dashed rounded-3xl p-8 transition-all duration-300 flex flex-col items-center justify-center text-center min-h-[240px] relative overflow-hidden",
        isDragging ? "border-blue-500 bg-blue-50/50" : "border-slate-200 bg-white hover:border-slate-300",
        file ? "border-emerald-500 bg-emerald-50/10" : ""
      )}
    >
      {file ? (
        <div className="space-y-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900 truncate max-w-[200px]">{file.name}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{file.data.length} Registros</p>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onUpload(null as any);
            }}
            className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline relative z-10"
          >
            Remover
          </button>
        </div>
      ) : (
        <>
          <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-4">
            <Upload className={cn("w-6 h-6 text-slate-400 transition-transform", isDragging && "scale-110")} />
          </div>
          <p className="text-xs font-black text-slate-800 uppercase tracking-tight mb-1">{label}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ou clique para selecionar</p>
          <input 
            type="file" 
            accept=".csv" 
            className="absolute inset-0 opacity-0 cursor-pointer" 
            onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
          />
        </>
      )}
    </div>
  );
}

function StatCard({ title, value, sub, color, icon: Icon }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100'
  };

  return (
    <div className={cn("p-6 rounded-3xl border shadow-sm flex flex-col justify-between min-h-[140px]", colors[color])}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{title}</p>
        <Icon className="w-5 h-5 opacity-40" />
      </div>
      <div>
        <h3 className="text-3xl font-black tracking-tight">{value}</h3>
        <p className="text-[10px] font-bold mt-1 opacity-70 uppercase tracking-tight">{sub}</p>
      </div>
    </div>
  );
}

function ViewTab({ active, onClick, label, count }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2",
        active ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"
      )}
    >
      {label}
      {count !== null && (
        <span className={cn(
          "px-1.5 py-0.5 rounded-md text-[8px]",
          active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
        )}>
          {count}
        </span>
      )}
    </button>
  );
}

function MetricRow({ label, value, color = "text-slate-900" }: any) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">{label}</span>
      <span className={cn("text-sm font-black", color)}>{value.toLocaleString()}</span>
    </div>
  );
}

function ComparisonTable({ data, type, primaryKey, fields, fileAName, fileBName }: any) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllColumns, setShowAllColumns] = useState(false);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter((item: any) => {
      const val = (type === 'divergent' || type === 'identical') ? item.key : (primaryKey === 'FULL_ROW' ? JSON.stringify(item) : String(item[primaryKey]));
      return val.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [data, searchTerm, type, primaryKey]);

  const displayFields = showAllColumns ? fields : fields.slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder={`Buscar por ${primaryKey}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 outline-none w-64"
            />
          </div>
          <button 
            onClick={() => setShowAllColumns(!showAllColumns)}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              showAllColumns ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            <Columns className="w-3.5 h-3.5" />
            {showAllColumns ? "Ocultar Colunas" : "Ver Todas as Colunas"}
          </button>
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mostrando {filteredData.length} registros</p>
      </div>

      <div className="overflow-x-auto border border-slate-100 rounded-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{primaryKey}</th>
              {type === 'divergent' ? (
                <>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Status de Campos</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Valor em {fileAName || 'A'}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Valor em {fileBName || 'B'}</th>
                </>
              ) : type === 'identical' ? (
                displayFields.map((f: string) => f !== primaryKey && (
                  <th key={f} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{f}</th>
                ))
              ) : (
                displayFields.map((f: string) => f !== primaryKey && (
                  <th key={f} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{f}</th>
                ))
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredData.slice(0, 50).map((item: any, idx: number) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-xs font-black text-slate-900 whitespace-nowrap">
                  {(type === 'divergent' || type === 'identical') ? item.key : item[primaryKey]}
                </td>
                {type === 'divergent' ? (
                  <>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[300px]">
                        {item.diffs.map((d: string) => (
                          <span key={d} className="px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[8px] font-black rounded uppercase tracking-widest border border-rose-200">
                            DIFF: {d}
                          </span>
                        ))}
                        {item.identicalFields.map((d: string) => (
                          <span key={d} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[8px] font-black rounded uppercase tracking-widest border border-emerald-100">
                            OK: {d}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {item.diffs.map((d: string) => (
                          <p key={d} className="text-[10px] font-bold text-slate-600 truncate max-w-[200px]">
                            <span className="text-rose-500 font-black mr-1">{d}:</span> {String(item.rowA[d])}
                          </p>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {item.diffs.map((d: string) => (
                          <p key={d} className="text-[10px] font-bold text-slate-600 truncate max-w-[200px]">
                            <span className="text-rose-500 font-black mr-1">{d}:</span> {String(item.rowB[d])}
                          </p>
                        ))}
                      </div>
                    </td>
                  </>
                ) : type === 'identical' ? (
                  displayFields.map((f: string) => f !== primaryKey && (
                    <td key={f} className="px-6 py-4 text-xs font-bold text-slate-600 truncate max-w-[200px]">
                      {String(item.row[f])}
                    </td>
                  ))
                ) : (
                  displayFields.map((f: string) => f !== primaryKey && (
                    <td key={f} className="px-6 py-4 text-xs font-bold text-slate-600 truncate max-w-[200px]">
                      {String(item[f])}
                    </td>
                  ))
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filteredData.length > 50 && (
          <div className="p-4 text-center bg-slate-50 border-t border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Exibindo apenas os primeiros 50 registros</p>
          </div>
        )}
        {filteredData.length === 0 && (
          <div className="p-12 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">
            Nenhum registro encontrado
          </div>
        )}
      </div>
    </div>
  );
}
