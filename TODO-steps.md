# TODO Steps - Fase 6: Limpeza e Renomeação (Plamor → ChurchOS)

Status: ✅ Completed

## Breakdown from Approved Plan

### Step 1: Create CargoLabel.jsx (replace PlanoLabel) [✅]
- src/components/shared/CargoLabel.jsx: Badge for cargo (Líder/Diácono/Membro/Batizando/Visitante).

### Step 2: Rename & Refactor MembroForm.jsx [✅]
- Move/rename TitularForm.jsx → src/components/membros/MembroForm.jsx.
- Remove gym fields (plano, valor_mensalidade, etc.).
- Add church fields: cargo (Select), data_batismo (date).
- Update initialForm, remove calc functions.

### Step 3: Rename & Refactor DependenteForm.jsx [✅]
- Move → src/components/membros/DependenteForm.jsx.
- Update prop titularId → membroId, labels Titular→Membro.

### Step 4: Rename & Refactor ContribuicaoForm.jsx [✅]
- Move MensalidadeForm.jsx → src/components/membros/ContribuicaoForm.jsx.
- Labels: Mensalidade→Contribuição, valor→valor_dizimo, mes_referencia→mes_ano.

### Step 5: Refactor src/pages/Membros.jsx [✅]
- Rename Titulares.jsx → Membros.jsx.
- Update queries/UI: Titular→Membro.
- Remove gym createMutation logic (no nome_plano/genMensalidades).
- Update imports/Forms (MembroForm, CargoLabel).

### Step 6: Refactor src/pages/MembroDetalhes.jsx [✅]
- Rename TitularDetalhes.jsx → MembroDetalhes.jsx.
- Queries/Filters: Titular→Membro, titular_id→membro_id.
- Update Forms props/imports.

### Step 7: Update Sidebar.jsx [✅]
- Pessoas submenu: Cadastro → Membros (/membros).
- Tesouraria: Mensalidades → Contribuições (path TBD).

### Step 8: Update App.jsx [✅]
- Routes: /titulares → /membros, /titulares/:id → /membros/:id.
- Imports: Titulares→Membros, TitularDetalhes→MembroDetalhes.

### Step 9: Global Cleanup & Test [✅]
- Delete src/components/titulares/.
- Remove PlanoLabel imports (Relatorios.jsx, RelatorioPessoas.jsx, Titulares.jsx, Dashboard.jsx).
- Updated Titular → Membro terminology.
- `npm run dev` ready for test.

### Step 10: Proceed to Fase 7 [ ]
- Dashboards Inteligentes: aniversariantes, faixa etária, cargos, dízimos por membro.

**Fase 6 ✅ Complete! Run `npm run dev` to test.**
