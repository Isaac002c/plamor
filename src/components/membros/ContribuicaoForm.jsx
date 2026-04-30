import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ContribuicaoForm({ open, onClose, onSubmit, membro }) {
  const [form, setForm] = useState({
    mes_ano: "",
    valor_dizimo: membro?.valor_mensalidade || "",
    data_vencimento: "",
    status: "pendente",
    forma_pagamento: "",
    data_pagamento: "",
    observacao: "",
    tipo: "dizimo",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      membro_id: membro.id,
      membro_nome: membro.nome,
      valor_dizimo: parseFloat(form.valor_dizimo) || 0,
    });
    setForm({
      mes_ano: "", valor_dizimo: membro?.valor_mensalidade || "",
      data_vencimento: "", status: "pendente",
      forma_pagamento: "", data_pagamento: "", observacao: "", tipo: "dizimo",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Gerar Contribuição</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Mês/Ano Referência * (ex: 2026-03)</Label>
            <Input value={form.mes_ano} onChange={e => setForm(p => ({ ...p, mes_ano: e.target.value }))} placeholder="2026-03" required />
          </div>
          <div>
            <Label>Tipo de Contribuição</Label>
            <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dizimo">Dízimo</SelectItem>
                <SelectItem value="oferta">Oferta</SelectItem>
                <SelectItem value="doacao">Doação</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Valor (R$) *</Label>
            <Input type="number" step="0.01" value={form.valor_dizimo} onChange={e => setForm(p => ({ ...p, valor_dizimo: e.target.value }))} required />
          </div>
          <div>
            <Label>Data Vencimento *</Label>
            <Input type="date" value={form.data_vencimento} onChange={e => setForm(p => ({ ...p, data_vencimento: e.target.value }))} required />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.status === "pago" && (
            <>
              <div>
                <Label>Data Pagamento</Label>
                <Input type="date" value={form.data_pagamento} onChange={e => setForm(p => ({ ...p, data_pagamento: e.target.value }))} />
              </div>
              <div>
                <Label>Forma de Pagamento</Label>
                <Select value={form.forma_pagamento} onValueChange={v => setForm(p => ({ ...p, forma_pagamento: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          <div>
            <Label>Observação</Label>
            <Input value={form.observacao} onChange={e => setForm(p => ({ ...p, observacao: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

