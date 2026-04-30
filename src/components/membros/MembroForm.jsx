import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

const initialForm = {
  // Dados Pessoais
  nome: "", cpf: "", rg: "", orgao_emissor: "", data_nascimento: "",
  sexo: "", estado_civil: "", profissao: "", nacionalidade: "Brasileiro(a)",
  // Contato
  telefone: "", telefone2: "", email: "",
  // Endereço
  cep: "", endereco: "", bairro: "", cidade: "", estado: "",
  // Igreja
  cargo: "", data_batismo: "", observacoes: "",
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

const cargos = ["lider", "diacono", "membro", "batizando", "visitante", "outro"];

export default function MembroForm({ open, onClose, onSubmit, editData }) {
  const [form, setForm] = useState(editData || initialForm);

  const set = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
    if (!editData) setForm(initialForm);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-muted-foreground/70">
            {editData ? "Editar Membro" : "Novo Cadastro"}
          </DialogTitle>
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

            <Field label="CPF" required>
              <Input value={form.cpf} onChange={e => set("cpf", e.target.value)} placeholder="000.000.000-00" required />
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

            <Field label="Estado Civil">
              <Select value={form.estado_civil} onValueChange={v => set("estado_civil", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                  <SelectItem value="casado">Casado(a)</SelectItem>
                  <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                  <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                  <SelectItem value="uniao_estavel">União Estável</SelectItem>
                  <SelectItem value="separado">Separado(a)</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Profissão">
              <Input value={form.profissao} onChange={e => set("profissao", e.target.value)} />
            </Field>

            <Field label="Nacionalidade">
              <Input value={form.nacionalidade} onChange={e => set("nacionalidade", e.target.value)} />
            </Field>

            {/* Contato */}
            <SectionTitle>Contato</SectionTitle>

            <Field label="Telefone Principal" required>
              <Input value={form.telefone} onChange={e => set("telefone", e.target.value)} placeholder="(XX) XXXXX-XXXX" required />
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

            {/* Igreja */}
            <SectionTitle>Dados da Igreja</SectionTitle>

            <Field label="Cargo" required>
              <Select value={form.cargo} onValueChange={v => set("cargo", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {cargos.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Data de Batismo">
              <Input type="date" value={form.data_batismo} onChange={e => set("data_batismo", e.target.value)} />
            </Field>

            {/* Observações */}
            <SectionTitle>Observações</SectionTitle>

            <div className="sm:col-span-2">
              <textarea
                value={form.observacoes}
                onChange={e => set("observacoes", e.target.value)}
                rows={3}
                placeholder="Anotações adicionais sobre o membro..."
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="min-w-[120px]">{editData ? "Salvar Alterações" : "Cadastrar Membro"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

