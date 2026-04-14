import { ColumnType, FileProfile, ColumnProfile, MetricFamily, AdaptiveScore, AnalysisResults, TopicDashboard } from './types';

// Semantic mapping synonyms
const SYNONYMS: Record<string, string[]> = {
  datetime: ['data', 'hora', 'datetime', 'timestamp', 'data_hora', 'call_start', 'start_time'],
  destination: ['destino', 'dst', 'called', 'numero_b', 'to', 'destination'],
  origin: ['origem', 'src', 'callerid', 'ani', 'from', 'origin'],
  billed_time: ['tempo tarifado', 'tarifado', 'billsec', 'billed_seconds', 'tempo_tarifado'],
  duration: ['duração', 'duration', 'tempo', 'seconds', 'duracao'],
  value: ['valor', 'custo', 'price', 'amount', 'total', 'valor_total', 'cost'],
  type: ['tipo de ligação', 'tipo', 'direction', 'call_type', 'tipo_ligacao'],
  pdd: ['pdd', 'post_dial_delay', 'post_dial'],
  route: ['rota', 'route', 'vendor_route', 'carrier_route'],
  vendor: ['fornecedor', 'vendor', 'carrier', 'supplier', 'fornecedor_nome'],
  customer: ['cliente', 'account', 'customer', 'cliente_nome'],
  server: ['servidor', 'server', 'router', 'switch', 'node'],
  sip_code: ['sip code', 'sip_response', 'status_sip', 'sip_status', 'response_code'],
  hangup_cause: ['hangup cause', 'release cause', 'reason', 'causa_desligamento', 'hangup_reason'],
  who_hung_up: ['who hung up', 'release source', 'bye side', 'quem_desligou', 'hangup_source'],
  codec: ['codec', 'media', 'audio_codec'],
  attempts: ['attempts', 'tentativas', 'calls', 'total_calls']
};

export class AnalysisEngine {
  public static profile(data: any[], originalColumns: string[]): FileProfile {
    const rowCount = data.length;
    const columnCount = originalColumns.length;
    const columns: ColumnProfile[] = originalColumns.map(col => {
      const values = data.map(row => row[col]).filter(v => v !== null && v !== undefined && v !== '');
      const nullRate = (rowCount - values.length) / rowCount;
      const uniqueValues = new Set(values).size;
      const sampleValues = values.slice(0, 5);
      
      // Infer type
      let type: ColumnType = 'unknown';
      const firstVal = values[0];
      if (typeof firstVal === 'number') {
        if (col.toLowerCase().includes('pdd')) type = 'pdd';
        else if (col.toLowerCase().includes('valor') || col.toLowerCase().includes('custo') || col.toLowerCase().includes('price')) type = 'currency';
        else if (col.toLowerCase().includes('tempo') || col.toLowerCase().includes('duration')) type = 'duration';
        else type = 'number';
      } else if (typeof firstVal === 'string') {
        if (this.isDateTime(firstVal)) type = 'datetime';
        else if (this.isTelecomNumber(firstVal)) type = 'telecom_number';
        else type = 'string';
      }

      // Semantic match
      let semanticMatch: string | null = null;
      for (const [key, synonyms] of Object.entries(SYNONYMS)) {
        if (synonyms.some(s => col.toLowerCase().includes(s.toLowerCase()))) {
          semanticMatch = key;
          break;
        }
      }

      return { name: col, originalName: col, type, nullRate, uniqueValues, sampleValues, semanticMatch };
    });

    // Calculate richness score
    const criticalFields = ['datetime', 'destination', 'duration', 'value', 'pdd', 'sip_code'];
    const foundCritical = columns.filter(c => c.semanticMatch && criticalFields.includes(c.semanticMatch)).length;
    const richnessScore = Math.round(Math.min(100, (foundCritical / criticalFields.length) * 100));

    // Infer dataset type
    const hasValue = columns.some(c => c.semanticMatch === 'value');
    const hasDuration = columns.some(c => c.semanticMatch === 'duration');
    const hasAttempts = columns.some(c => c.semanticMatch === 'attempts');
    let datasetType: 'attempts' | 'billed' | 'mixed' = 'mixed';
    if (hasValue && hasDuration && !hasAttempts) datasetType = 'billed';
    else if (hasAttempts && !hasValue) datasetType = 'attempts';

    return {
      rowCount,
      columnCount,
      columns,
      richnessScore,
      encoding: 'UTF-8', // Simplified
      delimiter: ',', // Simplified
      timeRange: null, // To be calculated
      datasetType,
      inconsistencies: []
    };
  }

  private static isDateTime(val: string): boolean {
    return !isNaN(Date.parse(val)) && (val.includes('-') || val.includes('/')) && val.length > 8;
  }

  private static isTelecomNumber(val: string): boolean {
    const clean = val.replace(/\D/g, '');
    return clean.length >= 8 && clean.length <= 15;
  }

  public static calculateAdaptiveScore(profile: FileProfile, data: any[]): AdaptiveScore {
    const families: MetricFamily[] = [
      { name: 'Qualidade Técnica', baseWeight: 25, appliedWeight: 0, score: 0, available: false },
      { name: 'PDD', baseWeight: 20, appliedWeight: 0, score: 0, available: false },
      { name: 'Duração / Utilidade', baseWeight: 20, appliedWeight: 0, score: 0, available: false },
      { name: 'Estabilidade', baseWeight: 15, appliedWeight: 0, score: 0, available: false },
      { name: 'Eficiência Financeira', baseWeight: 10, appliedWeight: 0, score: 0, available: false },
      { name: 'Integridade', baseWeight: 10, appliedWeight: 0, score: 0, available: false }
    ];

    // Check availability
    families[0].available = profile.columns.some(c => c.semanticMatch === 'sip_code' || c.semanticMatch === 'hangup_cause');
    families[1].available = profile.columns.some(c => c.semanticMatch === 'pdd');
    families[2].available = profile.columns.some(c => c.semanticMatch === 'duration' || c.semanticMatch === 'billed_time');
    families[3].available = profile.columns.some(c => c.semanticMatch === 'datetime');
    families[4].available = profile.columns.some(c => c.semanticMatch === 'value');
    families[5].available = true; // Always available

    // Redistribute weights
    const totalBaseWeight = families.filter(f => f.available).reduce((acc, f) => acc + f.baseWeight, 0);
    families.forEach(f => {
      if (f.available) {
        f.appliedWeight = Math.round((f.baseWeight / totalBaseWeight) * 100);
      }
    });

    // Calculate scores
    // 1. Technical Quality (based on SIP codes / Hangup causes)
    if (families[0].available) {
      const sipCol = profile.columns.find(c => c.semanticMatch === 'sip_code')?.name;
      if (sipCol) {
        const successfulCalls = data.filter(row => {
          const code = parseInt(row[sipCol]);
          return code >= 200 && code < 300;
        }).length;
        families[0].score = Math.round((successfulCalls / data.length) * 100);
      } else {
        families[0].score = 70; // Neutral if only hangup cause is available but not specific codes
      }
    }

    // 2. PDD
    if (families[1].available) {
      const pddCol = profile.columns.find(c => c.semanticMatch === 'pdd')!.name;
      const pdds = data.map(row => parseFloat(row[pddCol]) || 0).filter(v => v > 0);
      if (pdds.length > 0) {
        const avgPdd = pdds.reduce((acc, v) => acc + v, 0) / pdds.length;
        if (avgPdd <= 2) families[1].score = 100;
        else if (avgPdd <= 4) families[1].score = 90;
        else if (avgPdd <= 6) families[1].score = 75;
        else if (avgPdd <= 10) families[1].score = 40;
        else families[1].score = 15;
      }
    }

    // 3. Duration / Utility
    if (families[2].available) {
      const durCol = profile.columns.find(c => c.semanticMatch === 'duration' || c.semanticMatch === 'billed_time')!.name;
      const durations = data.map(row => parseFloat(row[durCol]) || 0);
      const avgDur = durations.reduce((acc, v) => acc + v, 0) / data.length;
      
      // ACD (Average Call Duration) scoring
      if (avgDur >= 120) families[2].score = 100;
      else if (avgDur >= 60) families[2].score = 90;
      else if (avgDur >= 30) families[2].score = 70;
      else if (avgDur >= 10) families[2].score = 40;
      else families[2].score = 20;
    }

    // 4. Stability (Call distribution consistency)
    if (families[3].available) {
      const dateCol = profile.columns.find(c => c.semanticMatch === 'datetime')!.name;
      try {
        const hours = data.map(row => new Date(row[dateCol]).getHours());
        const hourCounts: Record<number, number> = {};
        hours.forEach(h => { hourCounts[h] = (hourCounts[h] || 0) + 1; });
        const counts = Object.values(hourCounts);
        const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
        const variance = counts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / counts.length;
        const stdDev = Math.sqrt(variance);
        const cv = stdDev / mean; // Coefficient of variation
        
        if (cv < 0.5) families[3].score = 100;
        else if (cv < 1.0) families[3].score = 80;
        else if (cv < 1.5) families[3].score = 50;
        else families[3].score = 30;
      } catch {
        families[3].score = 50;
      }
    }

    // 5. Financial Efficiency
    if (families[4].available) {
      const valCol = profile.columns.find(c => c.semanticMatch === 'value')!.name;
      const durCol = profile.columns.find(c => c.semanticMatch === 'duration' || c.semanticMatch === 'billed_time')?.name;
      
      if (durCol) {
        const totalVal = data.reduce((acc, row) => acc + (parseFloat(row[valCol]) || 0), 0);
        const totalDurMin = data.reduce((acc, row) => acc + (parseFloat(row[durCol]) || 0), 0) / 60;
        const avgCostPerMin = totalDurMin > 0 ? totalVal / totalDurMin : 0;
        
        // Scoring based on typical market rates (lower is better for efficiency)
        if (avgCostPerMin > 0 && avgCostPerMin <= 0.05) families[4].score = 100;
        else if (avgCostPerMin <= 0.10) families[4].score = 85;
        else if (avgCostPerMin <= 0.20) families[4].score = 60;
        else families[4].score = 40;
      } else {
        families[4].score = 60;
      }
    }

    families[5].score = profile.richnessScore; // Integrity based on richness

    const finalScore = families.reduce((acc, f) => acc + (f.score * f.appliedWeight / 100), 0);
    
    let classification: AdaptiveScore['classification'] = 'REGULAR';
    if (finalScore >= 85) classification = 'EXCELENTE';
    else if (finalScore >= 70) classification = 'BOA';
    else if (finalScore >= 50) classification = 'REGULAR';
    else if (finalScore >= 30) classification = 'RUIM';
    else if (finalScore >= 10) classification = 'CRÍTICA';
    else classification = 'INCONCLUSIVA';

    return {
      finalScore: Math.round(finalScore),
      classification,
      confidence: profile.richnessScore,
      families,
      explanation: `Análise baseada em ${families.filter(f => f.available).length} famílias de métricas detectadas.`
    };
  }

  public static detectTopics(profile: FileProfile): TopicDashboard[] {
    const topics: TopicDashboard[] = [
      { id: 'overview', name: 'Visão Geral', available: true, kpis: [], insights: [] },
      { id: 'temporal', name: 'Temporal', available: profile.columns.some(c => c.semanticMatch === 'datetime'), kpis: [], insights: [] },
      { id: 'duration', name: 'Duração', available: profile.columns.some(c => c.semanticMatch === 'duration'), kpis: [], insights: [] },
      { id: 'pdd', name: 'PDD', available: profile.columns.some(c => c.semanticMatch === 'pdd'), kpis: [], insights: [] },
      { id: 'cost', name: 'Custo / Faturamento', available: profile.columns.some(c => c.semanticMatch === 'value'), kpis: [], insights: [] },
      { id: 'destination', name: 'Destino e DDD', available: profile.columns.some(c => c.semanticMatch === 'destination'), kpis: [], insights: [] },
      { id: 'technical', name: 'Qualidade Técnica', available: profile.columns.some(c => c.semanticMatch === 'sip_code'), kpis: [], insights: [] }
    ];
    return topics.filter(t => t.available);
  }

  public static calculateRanking(profile: FileProfile, data: any[]): any[] {
    const originCol = profile.columns.find(c => c.semanticMatch === 'origin')?.name;
    if (!originCol) return [];

    const groups: Record<string, any[]> = {};
    data.forEach(row => {
      const id = String(row[originCol] || 'Desconhecido');
      if (!groups[id]) groups[id] = [];
      groups[id].push(row);
    });

    const pddCol = profile.columns.find(c => c.semanticMatch === 'pdd')?.name;
    const durCol = profile.columns.find(c => c.semanticMatch === 'duration')?.name;
    const costCol = profile.columns.find(c => c.semanticMatch === 'value')?.name;

    return Object.entries(groups).map(([id, rows]) => {
      const count = rows.length;
      const avgPdd = pddCol ? Math.round(rows.reduce((acc, r) => acc + (parseFloat(r[pddCol]) || 0), 0) / count) : 0;
      const avgDur = durCol ? Math.round(rows.reduce((acc, r) => acc + (parseFloat(r[durCol]) || 0), 0) / count) : 0;
      const totalCost = costCol ? rows.reduce((acc, r) => acc + (parseFloat(r[costCol]) || 0), 0) : 0;
      
      // Simple score for ranking
      let score = 50;
      if (pddCol) {
        if (avgPdd <= 3) score += 25;
        else if (avgPdd > 8) score -= 25;
      }
      if (durCol) {
        if (avgDur >= 60) score += 25;
        else if (avgDur < 10) score -= 25;
      }

      let classification = 'REGULAR';
      if (score >= 85) classification = 'EXCELENTE';
      else if (score >= 70) classification = 'BOA';
      else if (score < 30) classification = 'CRÍTICA';

      return {
        id,
        count,
        avgPdd,
        avgDur,
        totalCost,
        score,
        classification
      };
    });
  }
}
