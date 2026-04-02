import { base44 } from "@/api/base44Client";
import { addMonths, format } from "date-fns";

export async function gerarMensalidadesAutomaticas(titular, dependentes = []) {
  if (!titular.data_adesao) return; // Validar data de adesão
  if (titular.nome_plano !== "plamor8" && titular.nome_plano !== "igreja") return;

  const dataAdesao = new Date(titular.data_adesao);
  const mensalidades = [];

  // Gerar para 12 meses a partir da data de adesão
  for (let i = 0; i < 12; i++) {
    const dataVencimento = new Date(dataAdesao);
    dataVencimento.setMonth(dataVencimento.getMonth() + i);
    dataVencimento.setDate(titular.dia_vencimento);

    const mesReferencia = format(dataVencimento, "yyyy-MM");

    mensalidades.push({
      titular_id: titular.id,
      titular_nome: titular.nome,
      mes_referencia: mesReferencia,
      valor: titular.valor_mensalidade,
      data_vencimento: format(dataVencimento, "yyyy-MM-dd"),
      status: "pendente",
    });
  }

  // Criar todas as mensalidades
  if (mensalidades.length > 0) {
    await base44.entities.Mensalidade.bulkCreate(mensalidades);
  }
}

export async function abonarMensalidades(titularId) {
  const mensalidades = await base44.entities.Mensalidade.filter({ titular_id: titularId });

  const updates = mensalidades.map(m =>
    base44.entities.Mensalidade.update(m.id, {
      status: "pago",
      data_pagamento: new Date().toISOString().split("T")[0],
    })
  );

  await Promise.all(updates);
}