import { Badge } from "@/components/ui/badge";

const cargoConfigs = {
  lider: { variant: "default", label: "Líder" },
  diacono: { variant: "secondary", label: "Diácono" },
  membro: { variant: "outline", label: "Membro" },
  batizando: { variant: "destructive", label: "Batizando" },
  visitante: { variant: "ghost", label: "Visitante" },
  outro: { variant: "outline", label: "Outro" },
};

export default function CargoLabel({ cargo, className = "" }) {
  const config = cargoConfigs[cargo?.toLowerCase()] || cargoConfigs.outro;
  
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}

