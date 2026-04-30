import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, MapPin, Phone, Mail, Pencil, Trash2, Church } from "lucide-react";

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export default function Igrejas() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [editData, setEditData] = useState(null);
  const queryClient = useQueryClient();

  const { data: igrejas = [], isLoading } = useQuery({
    queryKey: ["igrejas"],
    queryFn: () => base44.entities.Igreja.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Igreja.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["igrejas"] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Igreja.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["igrejas"] });
      setShowForm(false);
      setEditData(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Igreja.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["igrejas"] }),
  });

  const filtered = igrejas.filter(i =>
    i.nome?.toLowerCase().includes(search.toLowerCase()) ||
    i.cidade?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (data) => {
    if (editData) {
      updateMutation.mutate({ id: editData.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (igreja) => {
    setEditData(igreja);
    setShowForm(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold">Igrejas</h1>
          <p className="text-muted-foreground text-sm mt-1">{igrejas.length} unidade(s) cadastrada(s)</p>
        </div>
        <Button onClick={() => { setEditData(null); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Nova Igreja
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou cidade..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>Nenhuma igreja encontrada.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(igreja => (
            <Card key={igreja.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Church className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{igreja.nome}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                        {igreja.endereco && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {igreja.endereco}</span>}
                        {igreja.cidade && <span>{igreja.cidade}, {igreja.estado}</span>}
                        {igreja.telefone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {igreja.telefone}</span>}
                        {igreja.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {igreja.email}</span>}
                      </div>
                      {igreja.pastor_responsavel && (
                        <p className="text-xs text-muted-foreground mt-2">Pastor: {igreja.pastor_responsavel}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(igreja)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(igreja.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <IgrejaForm open={showForm} onClose={() => { setShowForm(false); setEditData(null); }} onSubmit={handleSubmit} editData={editData} />
    </div>
  );
}

function IgrejaForm({ open, onClose, onSubmit, editData }) {
  const [form, setForm] = useState({
    nome: "", endereco: "", cidade: "", estado: "", telefone: "", email: "",
    pastor_responsavel: "", data_fundacao: "", status: "ativa",
  });

  useState(() => {
    if (editData) {
      setForm({
        nome: editData.nome || "",
        endereco: editData.endereco || "",
        cidade: editData.cidade || "",
        estado: editData.estado || "",
        telefone: editData.telefone || "",
        email: editData.email || "",
        pastor_responsavel: editData.pastor_responsavel || "",
        data_fundacao: editData.data_fundacao || "",
        status: editData.status || "ativa",
      });
    } else {
      setForm({ nome: "", endereco: "", cidade: "", estado: "", telefone: "", email: "", pastor_responsavel: "", data_fundacao: "", status: "ativa" });
    }
  }, [editData]);

  const set = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">{editData ? "Editar Igreja" : "Nova Igreja"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs mb-1 block">Nome *</Label>
            <Input value={form.nome} onChange={e => set("nome", e.target.value)} required />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Endereço</Label>
            <Input value={form.endereco} onChange={e => set("endereco", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs mb-1 block">Cidade *</Label>
              <Input value={form.cidade} onChange={e => set("cidade", e.target.value)} required />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Estado *</Label>
              <Select value={form.estado} onValueChange={v => set("estado", v)}>
                <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                <SelectContent>
                  {UFS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs mb-1 block">Telefone</Label>
              <Input value={form.telefone} onChange={e => set("telefone", e.target.value)} placeholder="(XX) XXXXX-XXXX" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">E-mail</Label>
              <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs mb-1 block">Pastor Responsável</Label>
              <Input value={form.pastor_responsavel} onChange={e => set("pastor_responsavel", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Data de Fundação</Label>
              <Input type="date" value={form.data_fundacao} onChange={e => set("data_fundacao", e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{editData ? "Salvar" : "Cadastrar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

