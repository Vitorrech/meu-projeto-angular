# MedFlow AI

Frontend Angular completo para triagem médica inteligente com aparência premium, UX moderna e lógica clínica baseada em regras ponderadas.

## Proposta

O projeto simula uma plataforma de healthtech capaz de realizar uma avaliação inicial assistida por inteligência computacional. A aplicação não fornece diagnóstico médico definitivo. Em vez disso, classifica o caso em `BAIXO`, `MÉDIO`, `ALTO` ou `CRÍTICO`, apresenta justificativa, fatores decisivos, alertas e conduta inicial sugerida.

## Destaques

- Angular standalone com arquitetura organizada em `pages`, `components`, `services`, `models` e `constants`
- Fluxo completo com landing page, triagem em etapas, processamento animado, resultado, histórico local e dashboard
- Motor de triagem no frontend com score clínico, sinais de alarme, combinações de sintomas, comorbidades, idade, duração e intensidade
- Integração opcional com `openFDA` para consulta complementar de medicamentos, desacoplada do fluxo principal
- Persistência local via `localStorage`
- Exportação via impressão/PDF e compartilhamento de resumo
- Responsivo, acessível e pronto para apresentação acadêmica

## Estrutura

```text
src/app/
  components/
  constants/
  models/
  pages/
  services/
```

## Telas implementadas

1. Landing page com hero premium, benefícios, explicação do fluxo e aviso legal
2. Tela de triagem com questionário em etapas, stepper visual e validação contextual
3. Tela de processamento com loading refinado e mensagens de análise
4. Tela de resultado com score, nível de risco, justificativa, alertas, recomendações e consulta openFDA
5. Tela de histórico local com filtros por risco
6. Dashboard com indicadores e gráficos visuais em UI própria

## Lógica de triagem

O motor clínico considera:

- idade e extremos etários
- comorbidades e gestação
- febre, temperatura, duração e gravidade percebida
- falta de ar, saturação, dor no peito e tosse com sangue
- tontura, desmaio, confusão e dor intensa
- vômitos persistentes, diarreia, limitação funcional e início súbito
- combinações críticas como `dor no peito + falta de ar`

Os resultados são apresentados com:

- score numérico
- classificação de risco
- justificativa amigável
- fatores que elevaram o risco
- recomendações práticas
- alertas de emergência

## API pública

Integração com `openFDA`:

- consulta por medicamento informado pelo usuário
- exibe alertas públicos, reações adversas e marcas relacionadas quando disponíveis
- fallback elegante quando a API não responde ou não localiza dados

## Como rodar

```bash
npm install
npm start
```

Abra `http://localhost:4200`.

## Build de produção

```bash
npm run build
```

## Observações

- O histórico fica salvo no navegador, sem backend.
- A plataforma é educacional e de apresentação.
- Em caso de emergência, o usuário deve procurar atendimento médico imediatamente.
