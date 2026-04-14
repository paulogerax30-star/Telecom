import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
import chardet
import io
import re

# =================================================================
# CONFIGURAÇÃO DA PÁGINA E ESTILOS
# =================================================================
st.set_page_config(
    page_title="Gerax - BI Telecom & Análise Adaptativa",
    page_icon="📡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Estilo CSS customizado para visual profissional
st.markdown("""
    <style>
    .main {
        background-color: #f4f7f9;
    }
    .stMetric {
        background-color: #ffffff;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        border: 1px solid #eef2f6;
    }
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
        background-color: transparent;
    }
    .stTabs [data-baseweb="tab"] {
        height: 45px;
        white-space: pre-wrap;
        background-color: #ffffff;
        border-radius: 8px 8px 0 0;
        padding: 10px 20px;
        font-weight: 600;
        color: #495057;
        border: 1px solid #dee2e6;
    }
    .stTabs [aria-selected="true"] {
        background-color: #007bff !important;
        color: white !important;
        border-color: #007bff !important;
    }
    .reportview-container .main .block-container {
        padding-top: 2rem;
    }
    .highlight-card {
        background-color: #ffffff;
        padding: 20px;
        border-radius: 12px;
        border-left: 5px solid #007bff;
        margin-bottom: 20px;
    }
    </style>
    """, unsafe_allow_html=True)

# =================================================================
# MAPEAMENTO SEMÂNTICO DE COLUNAS (PARTE 2)
# =================================================================
SEMANTIC_MAP = {
    'datetime': ['data', 'hora', 'datetime', 'timestamp', 'data_hora', 'call_start', 'start_time'],
    'destination': ['destino', 'dst', 'called', 'numero_b', 'to', 'destination'],
    'origin': ['origem', 'src', 'callerid', 'ani', 'from', 'origin'],
    'billed_time': ['tempo tarifado', 'tarifado', 'billsec', 'duration', 'billed_seconds', 'tempo_tarifado', 'duração'],
    'value': ['valor', 'custo', 'valor_total', 'amount', 'total', 'price', 'custo_total'],
    'type': ['tipo de ligação', 'tipo', 'call_type', 'direction', 'tipo_ligacao'],
    'pdd': ['pdd', 'post_dial_delay', 'post_dial'],
    'route': ['rota', 'route', 'vendor_route', 'carrier_route'],
    'vendor': ['fornecedor', 'vendor', 'carrier', 'supplier', 'fornecedor_nome'],
    'customer': ['cliente', 'account', 'customer', 'cliente_nome'],
    'server': ['servidor', 'server', 'router', 'switch', 'node'],
    'sip_code': ['sip code', 'sip_response', 'status_sip', 'sip_status', 'response_code', 'status'],
    'hangup_cause': ['hangup cause', 'cause', 'release_cause', 'causa_desligamento', 'hangup_reason'],
    'who_hung_up': ['who hung up', 'release_source', 'bye_side', 'quem_desligou', 'hangup_source']
}

def resolve_semantics(columns):
    mapping = {}
    for col in columns:
        col_lower = col.lower()
        for key, synonyms in SEMANTIC_MAP.items():
            if any(syn in col_lower for syn in synonyms):
                mapping[key] = col
                break
    return mapping

# =================================================================
# UTILITÁRIOS DE PROCESSAMENTO (PARTE 1)
# =================================================================
def detect_file_params(uploaded_file):
    raw_data = uploaded_file.read(20000)
    uploaded_file.seek(0)
    
    # Encoding
    enc_result = chardet.detect(raw_data)
    encoding = enc_result['encoding'] or 'utf-8'
    
    # Delimiter
    try:
        content = raw_data.decode(encoding)
        if ';' in content and content.count(';') > content.count(','):
            delimiter = ';'
        else:
            delimiter = ','
    except:
        delimiter = ','
        
    return encoding, delimiter

@st.cache_data
def process_dataframe(uploaded_file):
    encoding, delimiter = detect_file_params(uploaded_file)
    
    try:
        df = pd.read_csv(uploaded_file, sep=delimiter, encoding=encoding)
    except Exception as e:
        st.error(f"Erro ao carregar CSV: {e}")
        return None, None

    # Limpeza e normalização
    for col in df.columns:
        # Tratar decimais com vírgula
        if df[col].dtype == 'object':
            try:
                if df[col].str.contains(',', na=False).any() and not df[col].str.contains('[a-zA-Z]', na=False).any():
                    df[col] = df[col].str.replace(',', '.').astype(float)
            except:
                pass

    mapping = resolve_semantics(df.columns)
    
    # Colunas derivadas
    if 'datetime' in mapping:
        df[mapping['datetime']] = pd.to_datetime(df[mapping['datetime']], errors='coerce')
        df = df.dropna(subset=[mapping['datetime']])
        df['hour'] = df[mapping['datetime']].dt.hour
        df['date'] = df[mapping['datetime']].dt.date
        
    if 'destination' in mapping:
        df['ddd'] = df[mapping['destination']].astype(str).str.extract(r'^(\d{2})')
        
    return df, mapping

# =================================================================
# MOTOR DE SCORE ADAPTATIVO (PARTE 5)
# =================================================================
def calculate_adaptive_score(df, mapping):
    families = {
        'Qualidade Técnica': {'weight': 25, 'score': 0, 'available': False},
        'PDD': {'weight': 20, 'score': 0, 'available': False},
        'Duração': {'weight': 20, 'score': 0, 'available': False},
        'Estabilidade': {'weight': 15, 'score': 0, 'available': False},
        'Custo / Eficiência': {'weight': 10, 'score': 0, 'available': False},
        'Integridade': {'weight': 10, 'score': 0, 'available': False}
    }
    
    # 1. Qualidade Técnica
    if 'sip_code' in mapping:
        families['Qualidade Técnica']['available'] = True
        success = df[mapping['sip_code']].astype(str).str.contains('200|OK|SUCCESS', case=False).mean()
        families['Qualidade Técnica']['score'] = success * 100
    
    # 2. PDD
    if 'pdd' in mapping:
        families['PDD']['available'] = True
        avg_pdd = df[mapping['pdd']].mean()
        if avg_pdd <= 3: families['PDD']['score'] = 100
        elif avg_pdd <= 5: families['PDD']['score'] = 80
        elif avg_pdd <= 8: families['PDD']['score'] = 50
        else: families['PDD']['score'] = 20
        
    # 3. Duração
    if 'billed_time' in mapping:
        families['Duração']['available'] = True
        avg_dur = df[mapping['billed_time']].mean()
        if avg_dur >= 60: families['Duração']['score'] = 100
        elif avg_dur >= 30: families['Duração']['score'] = 75
        else: families['Duração']['score'] = 40
        
    # 4. Estabilidade
    if 'datetime' in mapping:
        families['Estabilidade']['available'] = True
        hourly_vol = df.groupby('hour').size()
        if not hourly_vol.empty:
            cv = hourly_vol.std() / hourly_vol.mean()
            families['Estabilidade']['score'] = max(0, 100 - (cv * 50))
            
    # 5. Custo / Eficiência
    if 'value' in mapping:
        families['Custo / Eficiência']['available'] = True
        families['Custo / Eficiência']['score'] = 85 # Placeholder operacional
        
    # 6. Integridade
    families['Integridade']['available'] = True
    null_rate = df.isnull().mean().mean()
    families['Integridade']['score'] = (1 - null_rate) * 100

    # Redistribuição de pesos
    available_base = sum(f['weight'] for f in families.values() if f['available'])
    if available_base == 0: return 0, "INCONCLUSIVA", 0, families
    
    final_score = 0
    for f in families.values():
        if f['available']:
            f['applied_weight'] = (f['weight'] / available_base) * 100
            final_score += f['score'] * (f['applied_weight'] / 100)
            
    classification = "REGULAR"
    if final_score >= 85: classification = "EXCELENTE"
    elif final_score >= 70: classification = "BOA"
    elif final_score >= 50: classification = "REGULAR"
    elif final_score >= 30: classification = "RUIM"
    else: classification = "CRÍTICA"
    
    confidence = (available_base / 100) * 100
    
    return round(final_score, 1), classification, round(confidence, 1), families

# =================================================================
# INTERFACE PRINCIPAL
# =================================================================
def main():
    st.sidebar.title("Gerax BI 📡")
    st.sidebar.markdown("---")
    
    uploaded_file = st.sidebar.file_uploader("Upload Relatório CSV", type=["csv"])
    
    if uploaded_file:
        df, mapping = process_dataframe(uploaded_file)
        
        if df is not None:
            # Filtros Globais
            st.sidebar.subheader("Filtros Globais")
            filtered_df = df.copy()
            
            if 'date' in df.columns:
                min_date = df['date'].min()
                max_date = df['date'].max()
                sel_date = st.sidebar.date_input("Período", [min_date, max_date])
                if len(sel_date) == 2:
                    filtered_df = filtered_df[(filtered_df['date'] >= sel_date[0]) & (filtered_df['date'] <= sel_date[1])]
            
            for key in ['vendor', 'customer', 'route', 'server', 'type']:
                if key in mapping:
                    options = sorted(df[mapping[key]].dropna().unique())
                    sel = st.sidebar.multiselect(f"Filtrar {key.capitalize()}", options)
                    if sel:
                        filtered_df = filtered_df[filtered_df[mapping[key]].isin(sel)]

            # Abas Principais
            tabs = st.tabs([
                "📋 Análise do CSV", 
                "📊 Dashboards", 
                "🏆 Ranking", 
                "⚠️ Alertas", 
                "🧮 Calculador de Tempo"
            ])
            
            # ---------------------------------------------------------
            # ABA 1: ANÁLISE DO CSV (PARTE 3)
            # ---------------------------------------------------------
            with tabs[0]:
                st.header("Análise Estrutural e Semântica")
                
                c1, c2, c3 = st.columns(3)
                c1.metric("Linhas", len(df))
                c2.metric("Colunas", len(df.columns))
                richness = (len(mapping) / len(SEMANTIC_MAP)) * 100
                c3.metric("Riqueza de Dados", f"{richness:.0f}%")
                
                st.markdown("---")
                
                col_left, col_right = st.columns(2)
                with col_left:
                    st.subheader("Schema e Tipos")
                    schema_data = []
                    for col in df.columns:
                        role = next((k for k, v in mapping.items() if v == col), "Desconhecido")
                        schema_data.append({
                            'Coluna': col,
                            'Tipo': str(df[col].dtype),
                            'Nulos': f"{(df[col].isnull().mean()*100):.1f}%",
                            'Papel Semântico': role
                        })
                    st.table(pd.DataFrame(schema_data))
                
                with col_right:
                    st.subheader("Perfil do Tráfego")
                    has_attempts = 'sip_code' in mapping or 'hangup_cause' in mapping
                    has_billed = 'billed_time' in mapping and (df[mapping['billed_time']] > 0).any()
                    
                    if has_attempts and has_billed:
                        st.success("O arquivo representa um **Dataset Misto** (Tentativas + Faturamento).")
                    elif has_billed:
                        st.info("O arquivo parece representar apenas **Chamadas Faturadas**.")
                    elif has_attempts:
                        st.warning("O arquivo parece representar apenas **Tentativas Totais**.")
                    else:
                        st.error("Dataset Inconclusivo.")
                        
                    if 'billed_time' in mapping:
                        dur = df[mapping['billed_time']]
                        st.markdown("**Estatísticas de Duração**")
                        st.write(f"- Soma Total: {dur.sum():,.0f}s")
                        st.write(f"- Média: {dur.mean():.1f}s")
                        st.write(f"- P90: {dur.quantile(0.9):.1f}s | P95: {dur.quantile(0.95):.1f}s")
                        
                    if 'value' in mapping:
                        val = df[mapping['value']]
                        st.markdown("**Estatísticas Financeiras**")
                        st.write(f"- Valor Total: R$ {val.sum():,.2f}")
                        st.write(f"- Custo/Min Médio: R$ {(val.sum() / (dur.sum()/60) if dur.sum() > 0 else 0):.4f}")

            # ---------------------------------------------------------
            # ABA 2: DASHBOARDS (PARTE 4)
            # ---------------------------------------------------------
            with tabs[1]:
                st.header("Dashboards Operacionais Automáticos")
                
                # KPIs
                k1, k2, k3, k4 = st.columns(4)
                k1.metric("Volume", len(filtered_df))
                if 'billed_time' in mapping:
                    k2.metric("Duração Média", f"{filtered_df[mapping['billed_time']].mean():.1f}s")
                if 'pdd' in mapping:
                    k3.metric("PDD Médio", f"{filtered_df[mapping['pdd']].mean():.2f}s")
                if 'value' in mapping:
                    k4.metric("Receita", f"R$ {filtered_df[mapping['value']].sum():,.2f}")

                st.markdown("---")
                
                # Gráficos Dinâmicos
                if 'datetime' in mapping:
                    st.subheader("Análise Temporal")
                    hourly = filtered_df.groupby('hour').size().reset_index(name='Volume')
                    fig = px.area(hourly, x='hour', y='Volume', title="Volume por Hora do Dia", color_discrete_sequence=['#007bff'])
                    st.plotly_chart(fig, use_container_width=True)
                
                ga, gb = st.columns(2)
                with ga:
                    if 'billed_time' in mapping:
                        st.subheader("Distribuição de Duração")
                        fig = px.histogram(filtered_df, x=mapping['billed_time'], nbins=30, title="Frequência de Duração", color_discrete_sequence=['#28a745'])
                        st.plotly_chart(fig, use_container_width=True)
                with gb:
                    if 'pdd' in mapping:
                        st.subheader("Qualidade de PDD")
                        def pdd_cat(x):
                            if x <= 3: return 'Excelente (<=3s)'
                            if x <= 5: return 'Bom (3-5s)'
                            if x <= 8: return 'Atenção (5-8s)'
                            return 'Ruim (>8s)'
                        filtered_df['pdd_cat'] = filtered_df[mapping['pdd']].apply(pdd_cat)
                        pdd_dist = filtered_df['pdd_cat'].value_counts().reset_index()
                        fig = px.pie(pdd_dist, values='count', names='pdd_cat', title="Distribuição de Qualidade PDD", hole=0.4)
                        st.plotly_chart(fig, use_container_width=True)

                if 'ddd' in filtered_df.columns:
                    st.subheader("Top 10 DDDs")
                    ddd_data = filtered_df['ddd'].value_counts().head(10).reset_index()
                    fig = px.bar(ddd_data, x='ddd', y='count', title="Volume por DDD", color='count')
                    st.plotly_chart(fig, use_container_width=True)

            # ---------------------------------------------------------
            # ABA 3: RANKING E CLASSIFICAÇÃO (PARTE 5)
            # ---------------------------------------------------------
            with tabs[2]:
                st.header("Classificação de Performance")
                
                score, classe, conf, families = calculate_adaptive_score(filtered_df, mapping)
                
                sc1, sc2 = st.columns([1, 2])
                with sc1:
                    st.markdown(f"""
                        <div style="text-align:center; padding:30px; background:#fff; border-radius:15px; border: 2px solid #eef2f6;">
                            <h1 style="margin:0; font-size:60px; color:#007bff;">{score:.0f}</h1>
                            <p style="font-weight:bold; font-size:20px; color:#343a40;">{classe}</p>
                            <p style="color:#6c757d;">Confiança: {conf}%</p>
                        </div>
                    """, unsafe_allow_html=True)
                
                with sc2:
                    st.subheader("Pesos e Scores por Família")
                    f_data = []
                    for k, v in families.items():
                        f_data.append({
                            'Família': k,
                            'Score': f"{v['score']:.1f}",
                            'Peso Aplicado': f"{v.get('applied_weight', 0):.1f}%",
                            'Disponível': '✅' if v['available'] else '❌'
                        })
                    st.table(pd.DataFrame(f_data))

                st.markdown("---")
                st.subheader("Rankings Adaptativos")
                
                # Detectar entidades para ranking
                entities = [mapping[k] for k in ['vendor', 'customer', 'route', 'server'] if k in mapping]
                if entities:
                    sel_ent = st.selectbox("Rankear por:", entities)
                    
                    # Agrupar dados
                    agg_map = {'count': 'count'}
                    if 'billed_time' in mapping: agg_map[mapping['billed_time']] = 'mean'
                    if 'pdd' in mapping: agg_map[mapping['pdd']] = 'mean'
                    
                    rank_df = filtered_df.groupby(sel_ent).agg({
                        mapping['billed_time'] if 'billed_time' in mapping else filtered_df.columns[0]: ['count', 'mean'] if 'billed_time' in mapping else 'count'
                    })
                    rank_df.columns = ['Volume', 'Duração Média'] if 'billed_time' in mapping else ['Volume']
                    st.dataframe(rank_df.sort_values('Volume', ascending=False), use_container_width=True)
                else:
                    st.info("Colunas insuficientes para rankings automáticos.")

            # ---------------------------------------------------------
            # ABA 4: ALERTAS E ANOMALIAS (PARTE 6)
            # ---------------------------------------------------------
            with tabs[3]:
                st.header("Detecção de Anomalias Operacionais")
                
                alerts = []
                
                if 'pdd' in mapping:
                    pdd_outliers = filtered_df[filtered_df[mapping['pdd']] > 12]
                    if not pdd_outliers.empty:
                        alerts.append({
                            'Severidade': '🔴 CRÍTICA',
                            'Alerta': 'PDD Elevado (> 12s)',
                            'Afetados': len(pdd_outliers),
                            'Impacto': 'Possível falha de rota ou timeout de sinalização'
                        })
                
                if 'billed_time' in mapping:
                    short = filtered_df[(filtered_df[mapping['billed_time']] > 0) & (filtered_df[mapping['billed_time']] < 3)]
                    if len(short) > len(filtered_df) * 0.2:
                        alerts.append({
                            'Severidade': '🟡 ALERTA',
                            'Alerta': 'Volume de Chamadas Curtas (< 3s)',
                            'Afetados': len(short),
                            'Impacto': 'Possível problema de áudio ou fraude de CLI'
                        })
                
                if alerts:
                    st.table(pd.DataFrame(alerts))
                else:
                    st.success("Nenhuma anomalia crítica detectada nos dados atuais.")

    # ---------------------------------------------------------
    # ABA 5: CALCULADOR DE TEMPO (PARTE 7) - SEMPRE DISPONÍVEL
    # ---------------------------------------------------------
    with (tabs[4] if uploaded_file else st.container()):
        if not uploaded_file:
            st.header("🧮 Calculador de Tempo")
        else:
            st.markdown("---")
            st.subheader("🧮 Calculador de Tempo")
            
        st.markdown("""
            Esta ferramenta permite calcular o valor financeiro com base na tarifa e no tempo total.
            Ideal para conferência de faturas e repasses.
        """)
        
        c_left, c_right = st.columns(2)
        
        with c_left:
            st.markdown("#### Configuração do Cálculo")
            tarifa_input = st.text_input("Tarifa por Minuto (R$)", value="0.05")
            try:
                tarifa_val = float(tarifa_input.replace(',', '.'))
            except:
                tarifa_val = 0.0
                
            formato_tempo = st.radio("Formato da Entrada", ["Segundos", "Minutos", "hh:mm:ss"], horizontal=True)
            
            tempo_total_seg = 0
            if formato_tempo == "Segundos":
                tempo_total_seg = st.number_input("Total em Segundos", min_value=0.0, value=3600.0)
            elif formato_tempo == "Minutos":
                tempo_total_min = st.number_input("Total em Minutos", min_value=0.0, value=60.0)
                tempo_total_seg = tempo_total_min * 60
            else:
                tempo_hhmmss = st.text_input("Tempo (hh:mm:ss)", value="01:00:00")
                try:
                    h, m, s = map(int, tempo_hhmmss.split(':'))
                    tempo_total_seg = h * 3600 + m * 60 + s
                except:
                    st.error("Formato hh:mm:ss inválido.")
            
            pagar_fornecedor_mode = st.toggle("Pagar fornecedor")
            valor_fornecedor = 0.0
            if pagar_fornecedor_mode:
                valor_fornecedor_input = st.text_input("Valor devido ao fornecedor (R$)", value="0.00")
                try:
                    valor_fornecedor = float(valor_fornecedor_input.replace(',', '.'))
                except:
                    valor_fornecedor = 0.0

        with c_right:
            st.markdown("#### Resultado Financeiro")
            
            tempo_min_final = tempo_total_seg / 60
            valor_final = tempo_min_final * tarifa_val
            
            st.markdown(f"""
                <div style="background-color:#ffffff; padding:25px; border-radius:15px; border: 2px solid #007bff; text-align:center;">
                    <p style="color:#6c757d; margin:0; font-weight:bold; text-transform:uppercase; font-size:12px;">Valor Calculado</p>
                    <h1 style="color:#007bff; margin:0; font-size:48px;">R$ {valor_final:,.2f}</h1>
                </div>
            """, unsafe_allow_html=True)
            
            st.markdown("**Memória de Cálculo:**")
            st.code(f"""
Tempo Total: {tempo_min_final:.2f} minutos ({tempo_total_seg:,.0f} segundos)
Tarifa: R$ {tarifa_val:.4f} / min
Cálculo: {tempo_min_final:.2f} × {tarifa_val:.4f} = R$ {valor_final:,.2f}
            """)
            
            if pagar_fornecedor_mode:
                st.markdown("---")
                if valor_final > valor_fornecedor:
                    sobra = valor_final - valor_fornecedor
                    st.success(f"**CENÁRIO A: ABATER DO VALOR CALCULADO**")
                    st.write(f"Sobra após abatimento: **R$ {sobra:,.2f}**")
                    concl = f"deve abater a dívida do fornecedor e ainda sobra R$ {sobra:,.2f}"
                elif valor_fornecedor > valor_final:
                    falta = valor_fornecedor - valor_final
                    st.error(f"**CENÁRIO B: PAGAR PARA O FORNECEDOR**")
                    st.write(f"Falta pagar: **R$ {falta:,.2f}**")
                    concl = f"o valor calculado não cobre a dívida e ainda é necessário pagar R$ {falta:,.2f} ao fornecedor"
                else:
                    st.info(f"**CENÁRIO C: EMPATE EXATO**")
                    concl = "o valor calculado cobre exatamente o valor devido ao fornecedor"
                
                resumo_final = f"Com base na tarifa informada e no tempo total utilizado, o valor calculado foi de R$ {valor_final:,.2f}. Comparando com o valor devido ao fornecedor de R$ {valor_fornecedor:,.2f}, o sistema conclui que {concl}."
                st.info(resumo_final)
                
            if st.button("Limpar Campos"):
                st.rerun()

    # Rodapé
    st.sidebar.markdown("---")
    st.sidebar.caption("Gerax BI Operational v2.0")
    st.sidebar.caption("Engenharia de Dados & Telecom")

if __name__ == "__main__":
    main()
