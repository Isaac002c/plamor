import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

const initialForm = {
  // Dados Pessoais
  nome: "", cpf: "", rg: "", orgao_emissor: "", data_nascimento: "", sexo: "", parentesco: "conjuge",
  // Contato
  telefone: "", telefone2: "", email: "",
  // Endereço
  mesmo_endereco: false, cep: "", endereco: "", bairro: "", cidade: "", estado: "",
};

const SectionTitle = ({ children }) => (
  <div className="sm:col-span-2">
    <h3 className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-1">{children}</h3>
    <Separator />
  </div>
);

const Field = ({ label, required, children }) => (
  <div>
    <Label className="text-xs mb-1 block">{label}{required && " *"}</Label>
    {children}
  </div>
);

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export default function DependenteForm({ open, onClose, onSubmit, membroId, _membro }) {
  const [form, setForm] = useState(initialForm);

  const set = (field, value) => {
    setForm(p => ({ ...p, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, membro_id: membroId });
    setForm(initialForm);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-muted-foreground/70">Adicionar Dependente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">

            {/* Dados Pessoais */}
            <SectionTitle>Dados Pessoais</SectionTitle>

            <div className="sm:col-span-2">
              <Field label="Nome Completo" required>
                <Input value={form.nome} onChange={e => set("nome", e.target.value)} required />
              </Field>
            </div>

            <Field label="CPF">
              <Input value={form.cpf} onChange={e => set("cpf", e.target.value)} placeholder="000.000.000-00" />
            </Field>

            <Field label="RG">
              <Input value={form.rg} onChange={e => set("rg", e.target.value)} />
            </Field>

            <Field label="Órgão Emissor">
              <Input value={form.orgao_emissor} onChange={e => set("orgao_emissor", e.target.value)} placeholder="SSP/UF" />
            </Field>

            <Field label="Data de Nascimento">
              <Input type="date" value={form.data_nascimento} onChange={e => set("data_nascimento", e.target.value)} />
            </Field>

            <Field label="Sexo">
              <Select value={form.sexo} onValueChange={v => set("sexo", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="feminino">Feminino</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Parentesco" required>
              <Select value={form.parentesco} onValueChange={v => set("parentesco", v)}>
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
            </Field>

            {/* Contato */}
            <SectionTitle>Contato</SectionTitle>

            <Field label="Telefone Principal">
              <Input value={form.telefone} onChange={e => set("telefone", e.target.value)} placeholder="(XX) XXXXX-XXXX" />
            </Field>

            <Field label="Telefone Secundário">
              <Input value={form.telefone2} onChange={e => set("telefone2", e.target.value)} placeholder="(XX) XXXXX-XXXX" />
            </Field>

            <div className="sm:col-span-2">
              <Field label="E-mail">
                <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} />
              </Field>
            </div>

            {/* Endereço */}
            <SectionTitle>Endereço</SectionTitle>

            <div className="sm:col-span-2 flex items-center gap-3">
              <Checkbox 
                id="mesmo_endereco" 
                checked={form.mesmo_endereco} 
                onCheckedChange={checked => set("mesmo_endereco", checked)}
              />
              <Label htmlFor="mesmo_endereco" className="text-sm cursor-pointer mb-0">
                Mesmo endereço do membro
              </Label>
            </div>

            {!form.mesmo_endereco && (
              <>
                <Field label="CEP">
                  <Input value={form.cep} onChange={e => set("cep", e.target.value)} placeholder="00000-000" />
                </Field>

                <Field label="Estado (UF)">
                  <Select value={form.estado} onValueChange={v => set("estado", v)}>
                    <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                    <SelectContent>
                      {UFS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Logradouro e Número">
                    <Input value={form.endereco} onChange={e => set("endereco", e.target.value)} placeholder="Rua, Av., nº..." />
                  </Field>
                </div>

                <Field label="Bairro">
                  <Input value={form.bairro} onChange={e => set("bairro", e.target.value)} />
                </Field>

                <Field label="Cidade">
                  <Input value={form.cidade} onChange={e => set("cidade", e.target.value)} />
                </Field>
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="min-w-[120px]">Adicionar Dependente</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

