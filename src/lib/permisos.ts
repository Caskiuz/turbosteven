import type { Rol } from "./tipos";

/**
 * Matriz de permisos (RBAC).
 * admin    — control total: usuarios, métricas, todos los pedidos, clientes.
 * vendedor — crea pedidos y clientes, ve métricas e historial.
 * taller   — ve solo sus asignaciones y actualiza estados de fabricación.
 */
export type Accion =
  | "ver_dashboard"
  | "ver_pedidos"
  | "crear_pedido"
  | "editar_pedido"
  | "cambiar_estado"
  | "ver_historial"
  | "ver_clientes"
  | "gestionar_clientes"
  | "ver_usuarios"
  | "gestionar_usuarios"
  | "ver_asignaciones"
  | "ver_todos_los_pedidos";

const MATRIZ: Record<Rol, Accion[]> = {
  admin: [
    "ver_dashboard", "ver_pedidos", "crear_pedido", "editar_pedido",
    "cambiar_estado", "ver_historial", "ver_clientes", "gestionar_clientes",
    "ver_usuarios", "gestionar_usuarios", "ver_asignaciones", "ver_todos_los_pedidos",
  ],
  vendedor: [
    "ver_dashboard", "ver_pedidos", "crear_pedido", "editar_pedido",
    "cambiar_estado", "ver_historial", "ver_clientes", "gestionar_clientes",
    "ver_asignaciones", "ver_todos_los_pedidos",
  ],
  taller: ["ver_pedidos", "cambiar_estado", "ver_asignaciones"],
};

export function puede(rol: Rol, accion: Accion): boolean {
  return MATRIZ[rol]?.includes(accion) ?? false;
}
