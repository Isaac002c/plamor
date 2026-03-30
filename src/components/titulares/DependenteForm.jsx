import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function DependenteForm({ open, onClose, onSubmit, titularId }) {
  const [form, setForm] = useState({ nome: "", cpf: "", parentesco: "conjuge", data_nascimento: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, titular_id: titularId });
    setForm({ nome: "", cpf: "", parentesco: "conjuge", data_nascimento: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Adicionar Dependente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nome Completo *</Label>
            <Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} required />
          </div>
          <div>
            <Label>CPF</Label>
            <Input value={form.cpf} onChange={e => setForm(p => ({ ...p, cpf: e.target.value }))} />
          </div>
          <div>
            <Label>Parentesco *</Label>
            <Select value={form.parentesco} onValueChange={v => setForm(p => ({ ...p, parentesco: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="conjuge">Cônjuge</SelectItem>
                <SelectItem value="filho">Filho</SelectItem>
                <SelectItem value="filha">Filha</SelectItem>
                <SelectItem value="pai">Pai</SelectItem>
                <SelectItem value="mae">Mãe</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Data de Nascimento</Label>
            <Input type="date" value={form.data_nascimento} onChange={e => setForm(p => ({ ...p, data_nascimento: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Adicionar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}