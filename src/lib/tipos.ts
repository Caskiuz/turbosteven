export type Rol = "admin" | "vendedor" | "taller";

export type Estado =
  | "pendiente"
  | "en_fabricacion"
  | "control_calidad"
  | "listo"
  | "entregado"
  | "cancelado";

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  creado: string;
}

export interface Cliente {
  id: number;
  nombre: string;
  telefono: string;
  direccion: string | null;
  notas: string | null;
  creado: string;
}

export interface FotoPedido {
  id: number;
  pedido_id: number;
  src: string;
  orden: number;
}

export interface MovimientoHistorial {
  id: number;
  pedido_id: number;
  usuario_nombre: string | null;
  accion: string;
  detalle: string | null;
  creado: string;
}

export interface Pedido {
  id: number;
  codigo: string;
  numero: number;
  cliente_id: number;
  cliente_nombre: string;
  cliente_telefono: string | null;
  vendedor_id: number | null;
  vendedor_nombre: string | null;
  responsable_id: number | null;
  responsable_nombre: string | null;
  producto: string;
  tipo: "parlante" | "mini_turbo" | "otro";
  cantidad: number;
  medidas: string | null;
  color_principal: string | null;
  color_secundario: string | null;
  especificaciones: string | null;
  precio: number | null;
  abono: number | null;
  fecha_inicio: string | null;
  fecha_entrega: string | null;
  estado: Estado;
  creado: string;
  actualizado: string;
  fotos?: FotoPedido[];
}

export const ESTADOS: { id: Estado; nombre: string; color: string; emoji: string }[] = [
  { id: "pendiente",        nombre: "Pendiente",         color: "#FFD400", emoji: "🕒" },
  { id: "en_fabricacion",   nombre: "En Fabricación",    color: "#35D6FF", emoji: "🔧" },
  { id: "control_calidad",  nombre: "Control de Calidad", color: "#9A4FFF", emoji: "🔍" },
  { id: "listo",            nombre: "Listo",             color: "#22DD88", emoji: "✅" },
  { id: "entregado",        nombre: "Entregado",         color: "#8B93A5", emoji: "📦" },
  { id: "cancelado",        nombre: "Cancelado",         color: "#FF5C7A", emoji: "✖️" },
];

export const nombreEstado = (e: Estado) =>
  ESTADOS.find((x) => x.id === e)?.nombre ?? e;
export const colorEstado = (e: Estado) =>
  ESTADOS.find((x) => x.id === e)?.color ?? "#8B93A5";
