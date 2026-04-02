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
  // Plano
  tipo_plano: "individual", nome_plano: "plamor8", tipo_titular: "beneficiario",
  valor_mensalidade: "", dia_vencimento: "", data_adesao: "",
  forma_pagamento_preferida: "",
  observacoes: "", status: "ativo",
};

const calcularIdade = (dataNascimento) => {
  if (!dataNascimento) return null;
  const hoje = new Date();
  const nascimento = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  if (hoje.getMonth() < nascimento.getMonth() || (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  return idade;
};

const calcularValorPorIdade = (dataNascimento) => {
  const idade = calcularIdade(dataNascimento);
  if (idade === null) return 0;
  return idade >= 65 ? 38 : 26;
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

export default function TitularForm({ open, onClose, onSubmit, editData }) {
  const [form, setForm] = useState(editData || initialForm);
  const [dependentes, setDependentes] = useState([]);

  const set = (field, value) => {
    const newForm = { ...form, [field]: value };
    
    // Auto-calcular valor se data_nascimento for alterada
    if (field === "data_nascimento") {
      newForm.valor_mensalidade = calcularValorPorIdade(value);
    }
    
    setForm(newForm);
  };

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
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-muted-foreground/70">
            {editData ? "Editar Titular" : "Novo Cadastro"}
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

            {/* Dados do Plano */}
            <SectionTitle>Dados do Plano</SectionTitle>

            <Field label="Data de Adesão">
              <Input type="date" value={form.data_adesao} onChange={e => set("data_adesao", e.target.value)} />
            </Field>

            <Field label="Status">
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="suspenso">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Tipo de Plano" required>
              <Select value={form.tipo_plano} onValueChange={v => set("tipo_plano", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="familiar">Familiar</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Tipo de Titular" required>
              <Select value={form.tipo_titular} onValueChange={v => set("tipo_titular", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beneficiario">Beneficiário</SelectItem>
                  <SelectItem value="pagador">Apenas Pagador</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Plano" required>
              <Select value={form.nome_plano} onValueChange={v => set("nome_plano", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="plamor8">Plamor 8</SelectItem>
                  <SelectItem value="igreja">Igreja</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Valor Mensalidade (R$)" required>
              <Input type="number" step="0.01" value={form.valor_mensalidade} onChange={e => set("valor_mensalidade", e.target.value)} required disabled={form.nome_plano === "plamor8" || form.nome_plano === "igreja"} />
              {form.nome_plano === "plamor8" && <p className="text-xs text-muted-foreground mt-1">Calculado automaticamente por idade</p>}
              {form.nome_plano === "igreja" && <p className="text-xs text-green-400 mt-1 font-medium">✓ Plano abonado (sem mensalidade)</p>}
            </Field>

            <Field label="Dia do Vencimento" required>
              <Input type="number" min="1" max="31" value={form.dia_vencimento} onChange={e => set("dia_vencimento", e.target.value)} required />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Forma de Pagamento Preferida">
                <Select value={form.forma_pagamento_preferida} onValueChange={v => set("forma_pagamento_preferida", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {/* Observações */}
            <SectionTitle>Observações</SectionTitle>

            <div className="sm:col-span-2">
              <textarea
                value={form.observacoes}
                onChange={e => set("observacoes", e.target.value)}
                rows={3}
                placeholder="Anotações adicionais sobre o titular..."
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="min-w-[120px]">{editData ? "Salvar Alterações" : "Cadastrar Titular"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}