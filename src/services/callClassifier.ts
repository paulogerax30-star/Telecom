import { CallRecord, CallClassification, TechnicalClass } from '../types';

export const COLUMN_MAPPINGS: Record<string, string[]> = {
  timestamp: ['data', 'hora', 'datetime', 'timestamp', 'data e hora', 'start_time'],
  callId: ['call-id', 'callid', 'id_chamada', 'id_interno', 'uniqueid'],
  origin: ['origem', 'src', 'ani', 'callerid origem', 'numero_a'],
  callerId: ['callerid enviado', 'callerid', 'cli', 'bina', 'caller_id'],
  destination: ['destino', 'dst', 'numero_b', 'called_number'],
  client: ['cliente', 'account', 'customer', 'client_name'],
  supplier: ['fornecedor', 'carrier', 'vendor', 'supplier', 'provider'],
  route: ['rota', 'trunk', 'route_name', 'route'],
  server: ['servidor', 'router', 'switch', 'server'],
  routeType: ['tipo de rota', 'route_type'],
  pdd: ['pdd', 'post_dial_delay'],
  ringTime: ['ring time', 'ringing_time', 'tempo_ring'],
  durationTotal: ['duração total', 'duration', 'tempo_total'],
  billsec: ['tempo tarifado', 'billsec', 'duração útil', 'tempo_conversacao'],
  sipCode: ['sip final', 'sip_code', 'status_sip', 'sip_status'],
  sipReason: ['sip reason', 'sip_msg', 'sip_cause'],
  hangupCause: ['hangup cause', 'cause_code', 'motivo_desligamento'],
  releaseSource: ['release source', 'release_by'],
  whoDisconnected: ['quem desligou', 'disconnected_by'],
  codec: ['codec'],
  rtp: ['rtp', 'has_rtp', 'audio_detected'],
  amd: ['amd', 'is_machine', 'detect_machine'],
  voicemail: ['voicemail', 'caixa_postal'],
  operator: ['operadora', 'carrier_name'],
  ddd: ['ddd'],
  country: ['país', 'country'],
  status: ['status final', 'status', 'disposition'],
  revenue: ['valor', 'receita', 'revenue', 'valor_cobrado'],
  cost: ['custo', 'cost', 'valor_custo'],
  profit: ['lucro', 'profit', 'margem'],
};

export function mapColumns(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  headers.forEach(header => {
    const normalized = header.toLowerCase().trim();
    for (const [field, aliases] of Object.entries(COLUMN_MAPPINGS)) {
      if (aliases.includes(normalized)) {
        mapping[field] = header;
        break;
      }
    }
  });
  
  return mapping;
}

export function classifyCall(record: Partial<CallRecord>): CallRecord {
  const result: CallRecord = {
    id: record.id || Math.random().toString(36).substr(2, 9),
    timestamp: record.timestamp || new Date().toISOString(),
    callId: record.callId || '',
    origin: record.origin || '',
    callerId: record.callerId || '',
    destination: record.destination || '',
    client: record.client || 'Desconhecido',
    supplier: record.supplier || 'Desconhecido',
    route: record.route || 'Desconhecida',
    server: record.server || 'Desconhecido',
    routeType: record.routeType || 'SIP',
    pdd: record.pdd || 0,
    ringTime: record.ringTime || 0,
    durationTotal: record.durationTotal || 0,
    billsec: record.billsec || 0,
    sipCode: record.sipCode || 0,
    sipReason: record.sipReason || '',
    hangupCause: record.hangupCause || '',
    releaseSource: record.releaseSource || '',
    whoDisconnected: record.whoDisconnected || '',
    codec: record.codec || '',
    rtp: record.rtp ?? true,
    amd: record.amd ?? false,
    voicemail: record.voicemail ?? false,
    operator: record.operator || '',
    ddd: record.ddd || '',
    country: record.country || '',
    status: record.status || '',
    revenue: record.revenue || 0,
    cost: record.cost || 0,
    profit: record.profit || 0,
    secondaryReasons: [],
  };

  let score = 100;
  let techClass: TechnicalClass = 'SUCCESS_GOOD';
  let reason = 'Chamada completada com sucesso e boa qualidade.';
  const secondaryReasons: string[] = [];

  const isAnswered = result.billsec > 0 || result.sipCode === 200 || result.status.toUpperCase() === 'ANSWERED';

  // 1. Check for Answer
  if (!isAnswered) {
    score -= 50;
    if ([404, 480, 486, 603].includes(result.sipCode)) {
      techClass = 'FAIL_DESTINATION';
      reason = 'Destino ocupado, indisponível ou inexistente.';
    } else if (result.sipCode >= 500) {
      techClass = 'FAIL_ROUTE';
      reason = 'Falha técnica na rota ou fornecedor (SIP 5xx).';
      score -= 20;
    } else if (result.pdd > 12) {
      techClass = 'FAIL_HIGH_PDD';
      reason = 'Falha por tempo de espera excessivo (PDD Alto).';
      score -= 30;
    } else {
      techClass = 'FAIL_SIGNALING';
      reason = 'Falha de sinalização ou erro desconhecido.';
    }
  } else {
    // Answered calls analysis
    
    // PDD Analysis
    if (result.pdd > 12) {
      score -= 40;
      techClass = 'FAIL_HIGH_PDD';
      reason = 'Chamada completada mas com PDD crítico.';
    } else if (result.pdd > 8) {
      score -= 20;
      secondaryReasons.push('PDD elevado detectado.');
    } else if (result.pdd > 5) {
      score -= 10;
    }

    // Duration Analysis
    if (result.billsec < 6) {
      score -= 40;
      techClass = 'SUCCESS_SHORT';
      reason = 'Chamada de curtíssima duração (possível falha ou caixa postal).';
    } else if (result.billsec < 15) {
      score -= 20;
      if (techClass === 'SUCCESS_GOOD') techClass = 'SUCCESS_SHORT';
      secondaryReasons.push('Chamada de curta duração.');
    }

    // Voicemail / AMD Analysis
    if (result.voicemail || result.amd || (result.billsec > 0 && result.billsec < 10 && result.whoDisconnected === 'callee')) {
      score -= 30;
      techClass = 'SUCCESS_SUSPECT_VM';
      reason = 'Suspeita de caixa postal ou atendimento automático.';
    }

    // Audio Analysis
    if (!result.rtp) {
      score -= 60;
      techClass = 'FAIL_AUDIO';
      reason = 'Chamada sem detecção de áudio (Muda).';
    }
  }

  // Final Classification mapping
  result.score = Math.max(0, Math.min(100, score));
  result.technicalClass = techClass;
  result.reason = reason;
  result.secondaryReasons = secondaryReasons;
  
  if (result.score >= 90) result.classification = 'EXCELENTE';
  else if (result.score >= 75) result.classification = 'BOA';
  else if (result.score >= 50) result.classification = 'REGULAR';
  else if (result.score >= 30) result.classification = 'RUIM';
  else result.classification = 'CRÍTICA';

  result.confidence = 'HIGH';
  if (Object.keys(record).length < 10) result.confidence = 'LOW';
  else if (Object.keys(record).length < 20) result.confidence = 'MEDIUM';

  result.impact = result.score < 50 ? 'Alto impacto na qualidade percebida pelo cliente.' : 'Baixo impacto operacional.';
  result.suggestion = techClass === 'FAIL_ROUTE' ? 'Verificar estabilidade do fornecedor ou trocar rota.' : 
                      techClass === 'FAIL_HIGH_PDD' ? 'Otimizar sinalização ou reduzir saltos na rota.' :
                      'Monitorar comportamento do destino.';

  return result;
}

export function calculateStats(records: CallRecord[]) {
  const stats = {
    total: records.length,
    answered: records.filter(r => r.billsec > 0).length,
    failed: records.filter(r => r.billsec === 0).length,
    avgScore: records.reduce((acc, r) => acc + (r.score || 0), 0) / records.length,
    totalRevenue: records.reduce((acc, r) => acc + r.revenue, 0),
    totalCost: records.reduce((acc, r) => acc + r.cost, 0),
    totalProfit: records.reduce((acc, r) => acc + r.profit, 0),
    avgPdd: records.reduce((acc, r) => acc + r.pdd, 0) / records.length,
    avgDuration: records.reduce((acc, r) => acc + r.billsec, 0) / records.length,
  };

  const byRoute = groupStats(records, 'route');
  const bySupplier = groupStats(records, 'supplier');
  const byClient = groupStats(records, 'client');
  const byCallerId = groupStats(records, 'callerId');
  const byDdd = groupStats(records, 'ddd');

  return { stats, byRoute, bySupplier, byClient, byCallerId, byDdd };
}

function groupStats(records: CallRecord[], key: keyof CallRecord) {
  const groups: Record<string, any> = {};
  
  records.forEach(r => {
    const val = String(r[key]);
    if (!groups[val]) {
      groups[val] = {
        name: val,
        volume: 0,
        answered: 0,
        totalScore: 0,
        totalPdd: 0,
        shortCalls: 0,
        vmCalls: 0,
        techFailures: 0,
      };
    }
    const g = groups[val];
    g.volume++;
    if (r.billsec > 0) g.answered++;
    g.totalScore += r.score || 0;
    g.totalPdd += r.pdd;
    if (r.billsec > 0 && r.billsec < 15) g.shortCalls++;
    if (r.technicalClass === 'SUCCESS_SUSPECT_VM') g.vmCalls++;
    if (r.technicalClass === 'FAIL_ROUTE') g.techFailures++;
  });

  return Object.values(groups).map((g: any) => ({
    ...g,
    asr: (g.answered / g.volume) * 100,
    avgScore: g.totalScore / g.volume,
    avgPdd: g.totalPdd / g.volume,
    shortRate: (g.shortCalls / g.volume) * 100,
    vmRate: (g.vmCalls / g.volume) * 100,
    techRate: (g.techFailures / g.volume) * 100,
  })).sort((a, b) => b.volume - a.volume);
}
