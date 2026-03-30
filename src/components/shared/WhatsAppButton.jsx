import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WhatsAppButton({ telefone, nome, valor, mesReferencia, className }) {
  const formatPhone = (phone) => {
    const digits = phone?.replace(/\D/g, "") || "";
    return digits.startsWith("55") ? digits : `55${digits}`;
  };

  const getMessage = () => {
    const msg = `Olá ${nome || ""}! 👋\n\nIdentificamos que a mensalidade do seu plano funerário referente a *${mesReferencia || "mês vigente"}* no valor de *R$ ${valor?.toFixed(2) || "—"}* encontra-se pendente.\n\nPor gentileza, entre em contato conosco para regularizar sua situação e manter seu plano ativo.\n\nEstamos à disposição para ajudar! 🙏`;
    return encodeURIComponent(msg);
  };

  const handleClick = () => {
    const phone = formatPhone(telefone);
    const url = `https://wa.me/${phone}?text=${getMessage()}`;
    window.open(url, "_blank");
  };

  return (
    <Button
      onClick={handleClick}
      className={`bg-emerald-600 hover:bg-emerald-700 text-white gap-2 ${className || ""}`}
      size="sm"
    >
      <MessageCircle className="w-4 h-4" />
      Cobrar via WhatsApp
    </Button>
  );
}