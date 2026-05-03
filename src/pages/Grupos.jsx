import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import churchos from "@/api/churchos.js";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Users, Clock, Pencil, Trash2 } from "lucide-react";

const tipoLabels = {
  kids: "Kids",
  jovens: "Jovens",
  adultos: "Adultos",
  idosos: "Idosos",
  ministerio: "Ministério",
  escola_biblica: "Escola Bíblica",
  celula: "Célula",
  outro: "Outro",
};

const diaLabels = {
  domingo: "Domingo",
  segunda: "Segunda",
  terca: "Terça",
  quarta: "Quarta",
  quinta: "Quinta",
  sexta: "Sexta",
  sabado: "Sábado",
};

export default function Grupos() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [editData, setEditData] = useState(null);
  const queryClient = useQueryClient();

  const { data: grupos = [], isLoading } = useQuery({
    queryKey: ["grupos"],
    queryFn: () => churchos.grupos.listar({ sort: '-created_at' }),
  });

  const { data: igrejas = [] } = useQuery({
    queryKey: ["igrejas"],
    queryFn: () => churchos.usuarios.listar(),
  });

  const { data: titulares = [] } = useQuery({
    queryKey: ["titulares"],
    queryFn: () => churchos.membros.listar({ sort: '-created_at' }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => churchos.grupos.criar(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grupos"] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => churchos.grupos.atualizar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grupos"] });
      setShowForm(false);
      setEditData(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => churchos.grupos.atualizar(id, { status: 'inativo' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["grupos"] }),
  });

  const filtered = grupos.filter(g =>
    g.nome?.toLowerCase().includes(search.toLowerCase()) ||
    tipoLabels[g.tipo]?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (data) => {
    if (editData) {
      updateMutation.mutate({ id: editData.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (grupo) => {
    setEditData(grupo);
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
          <h1 className="text-2xl md:text-3xl font-serif font-bold">Grupos & Ministérios</h1>
          <p className="text-muted-foreground text-sm mt-1">{grupos.length} grupo(s) cadastrado(s)</p>
        </div>
        <Button onClick={() => { setEditData(null); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Grupo
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou tipo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>Nenhum grupo encontrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(grupo => {
            const igreja = igrejas.find(i => i.id === grupo.igreja_id);
            const lider = titulares.find(t => t.id === grupo.lider_id);
            return (
              <Card key={grupo.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-violet-100 text-violet-700">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{grupo.nome}</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">
                            {tipoLabels[grupo.tipo] || grupo.tipo}
                          </span>
                          {grupo.status === "ativo" ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">Ativo</span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">Inativo</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                          {igreja && <span>{igreja.nome}</span>}
                          {lider && <span>Líder: {lider.nome}</span>}
                          {grupo.dia_reuniao && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {diaLabels[grupo.dia_reuniao]} {grupo.horario_reuniao && `às ${grupo.horario_reuniao}`}
                            </span>
                          )}
                        </div>
                        {grupo.descricao && <p className="text-xs text-muted-foreground mt-2">{grupo.descricao}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(grupo)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(grupo.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <GrupoForm open={showForm} onClose={() => { setShowForm(false); setEditData(null); }} onSubmit={handleSubmit} editData={editData} igrejas={igrejas} titulares={titulares} />
    </div>
  );
}

function GrupoForm({ open, onClose, onSubmit, editData, igrejas, titulares }) {
  const [form, setForm] = useState({
    nome: "", descricao: "", tipo: "outro", lider_id: "", igreja_id: "",
    dia_reuniao: "", horario_reuniao: "", status: "ativo",
  });

  useState(() => {
    if (editData) {
      setForm({
        nome: editData.nome || "",
        descricao: editData.descricao || "",
        tipo: editData.tipo || "outro",
        lider_id: editData.lider_id || "",
        igreja_id: editData.igreja_id || "",
        dia_reuniao: editData.dia_reuniao || "",
        horario_reuniao: editData.horario_reuniao || "",
        status: editData.status || "ativo",
      });
    } else {
      setForm({ nome: "", descricao: "", tipo: "outro", lider_id: "", igreja_id: "", dia_reuniao: "", horario_reuniao: "", status: "ativo" });
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
          <DialogTitle className="font-serif text-xl">{editData ? "Editar Grupo" : "Novo Grupo"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs mb-1 block">Nome *</Label>
            <Input value={form.nome} onChange={e => set("nome", e.target.value)} required />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Descrição</Label>
            <Input value={form.descricao} onChange={e => set("descricao", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs mb-1 block">Tipo *</Label>
              <Select value={form.tipo} onValueChange={v => set("tipo", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(tipoLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Igreja *</Label>
              <Select value={form.igreja_id} onValueChange={v => set("igreja_id", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {igrejas.map(i => (
                    <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Líder</Label>
            <Select value={form.lider_id} onValueChange={v => set("lider_id", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione um membro" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum</SelectItem>
                {titulares.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs mb-1 block">Dia da Reunião</Label>
              <Select value={form.dia_reuniao} onValueChange={v => set("dia_reuniao", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(diaLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Horário</Label>
              <Input value={form.horario_reuniao} onChange={e => set("horario_reuniao", e.target.value)} placeholder="19:30" />
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

