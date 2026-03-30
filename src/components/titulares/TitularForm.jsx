import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const initialForm = {
  nome: "", cpf: "", telefone: "", email: "", endereco: "",
  tipo_plano: "individual", nome_plano: "basico",
  valor_mensalidade: "", dia_vencimento: "", data_adesao: "",
  status: "ativo",
};

export default function TitularForm({ open, onClose, onSubmit, editData }) {
  const [form, setForm] = useState(editData || initialForm);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      valor_mensalidade: parseFloat(form.valor_mensalidade) || 0,
      dia_vencimento: parseInt(form.dia_vencimento) || 1,
    });
    if (!editData) setForm(initialForm);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">{editData ? "Editar Titular" : "Novo Titular"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Nome Completo *</Label>
              <Input value={form.nome} onChange={e => handleChange("nome", e.target.value)} required />
            </div>
            <div>
              <Label>CPF *</Label>
              <Input value={form.cpf} onChange={e => handleChange("cpf", e.target.value)} required />
            </div>
            <div>
              <Label>Telefone *</Label>
              <Input value={form.telefone} onChange={e => handleChange("telefone", e.target.value)} placeholder="(XX) XXXXX-XXXX" required />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => handleChange("email", e.target.value)} />
            </div>
            <div>
              <Label>Data de Adesão</Label>
              <Input type="date" value={form.data_adesao} onChange={e => handleChange("data_adesao", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label>Endereço</Label>
              <Input value={form.endereco} onChange={e => handleChange("endereco", e.target.value)} />
            </div>
            <div>
              <Label>Tipo de Plano *</Label>
              <Select value={form.tipo_plano} onValueChange={v => handleChange("tipo_plano", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="familiar">Familiar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Plano *</Label>
              <Select value={form.nome_plano} onValueChange={v => handleChange("nome_plano", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="basico">Básico</SelectItem>
                  <SelectItem value="essencial">Essencial</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor Mensalidade (R$) *</Label>
              <Input type="number" step="0.01" value={form.valor_mensalidade} onChange={e => handleChange("valor_mensalidade", e.target.value)} required />
            </div>
            <div>
              <Label>Dia Vencimento *</Label>
              <Input type="number" min="1" max="31" value={form.dia_vencimento} onChange={e => handleChange("dia_vencimento", e.target.value)} required />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{editData ? "Salvar" : "Cadastrar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}