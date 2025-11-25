/**
 * Sistema de Permisos - Definición centralizada de todas las acciones
 * Basado en ACCIONES_Y_GRUPOS.md
 * 
 * Total: 56 acciones definidas
 */

export enum Permission {
  // ==================== RESERVAS (1) ====================
  RESERVAS_LISTAR = 'reservas.listar',

  // ==================== CHECK-OUT (3) ====================
  CHECKOUT_REGISTRAR_PAGO = 'checkout.registrarPago',
  CHECKOUT_CERRAR = 'checkout.cerrar',
  CHECKOUT_IMPRIMIR_COMPROBANTE = 'checkout.imprimirComprobante',

  // ==================== COMPROBANTES (4) ====================
  COMPROBANTES_EMITIR = 'comprobantes.emitir',
  COMPROBANTES_ANULAR = 'comprobantes.anular',
  COMPROBANTES_IMPRIMIR = 'comprobantes.imprimir',
  COMPROBANTES_VER = 'comprobantes.ver',

  // ==================== HABITACIONES (6) ====================
  HABITACIONES_LISTAR = 'habitaciones.listar',
  HABITACIONES_VER = 'habitaciones.ver',
  HABITACIONES_CREAR = 'habitaciones.crear',
  HABITACIONES_MODIFICAR = 'habitaciones.modificar',
  HABITACIONES_ELIMINAR = 'habitaciones.eliminar',
  HABITACIONES_CAMBIAR_ESTADO = 'habitaciones.cambiarEstado',

  // ==================== CLIENTES (5) ====================
  CLIENTES_LISTAR = 'clientes.listar',
  CLIENTES_VER = 'clientes.ver',
  CLIENTES_CREAR = 'clientes.crear',
  CLIENTES_MODIFICAR = 'clientes.modificar',
  CLIENTES_ELIMINAR = 'clientes.eliminar',

  // ==================== PAGOS (4) ====================
  PAGOS_LISTAR = 'pagos.listar',
  PAGOS_VER = 'pagos.ver',
  PAGOS_REGISTRAR = 'pagos.registrar',
  PAGOS_ANULAR = 'pagos.anular',

  // ==================== SERVICIOS (5) ====================
  SERVICIOS_LISTAR = 'servicios.listar',
  SERVICIOS_VER = 'servicios.ver',
  SERVICIOS_CREAR = 'servicios.crear',
  SERVICIOS_MODIFICAR = 'servicios.modificar',
  SERVICIOS_ELIMINAR = 'servicios.eliminar',

  // ==================== NOTIFICACIONES (3) ====================
  NOTIFICACIONES_LISTAR = 'notificaciones.listar',
  NOTIFICACIONES_MARCAR_LEIDA = 'notificaciones.marcarLeida',
  NOTIFICACIONES_ELIMINAR = 'notificaciones.eliminar',

  // ==================== REPORTES (3) ====================
  REPORTES_OCUPACION = 'reportes.ocupacion',
  REPORTES_INGRESOS = 'reportes.ingresos',
  REPORTES_CLIENTES = 'reportes.clientes',

  // ==================== CONFIGURACIÓN - USUARIOS (8) ====================
  CONFIG_USUARIOS_LISTAR = 'config.usuarios.listar',
  CONFIG_USUARIOS_VER = 'config.usuarios.ver',
  CONFIG_USUARIOS_CREAR = 'config.usuarios.crear',
  CONFIG_USUARIOS_MODIFICAR = 'config.usuarios.modificar',
  CONFIG_USUARIOS_ELIMINAR = 'config.usuarios.eliminar',
  CONFIG_USUARIOS_ASIGNAR_GRUPOS = 'config.usuarios.asignarGrupos',
  CONFIG_USUARIOS_ASIGNAR_ACCIONES = 'config.usuarios.asignarAcciones',
  CONFIG_USUARIOS_RESETEAR_PASSWORD = 'config.usuarios.resetearPassword',

  // ==================== CONFIGURACIÓN - GRUPOS (7) ====================
  CONFIG_GRUPOS_LISTAR = 'config.grupos.listar',
  CONFIG_GRUPOS_VER = 'config.grupos.ver',
  CONFIG_GRUPOS_CREAR = 'config.grupos.crear',
  CONFIG_GRUPOS_MODIFICAR = 'config.grupos.modificar',
  CONFIG_GRUPOS_ELIMINAR = 'config.grupos.eliminar',
  CONFIG_GRUPOS_ASIGNAR_ACCIONES = 'config.grupos.asignarAcciones',
  CONFIG_GRUPOS_ASIGNAR_HIJOS = 'config.grupos.asignarHijos',

  // ==================== CONFIGURACIÓN - ACCIONES (5) ====================
  CONFIG_ACCIONES_LISTAR = 'config.acciones.listar',
  CONFIG_ACCIONES_VER = 'config.acciones.ver',
  CONFIG_ACCIONES_CREAR = 'config.acciones.crear',
  CONFIG_ACCIONES_MODIFICAR = 'config.acciones.modificar',
  CONFIG_ACCIONES_ELIMINAR = 'config.acciones.eliminar',
}

/**
 * Helper type para extraer los valores del enum como tipo literal
 * Útil para validaciones y type-safety
 */
export type PermissionValue = `${Permission}`;

/**
 * Mapeo de permisos a descripciones legibles
 * Útil para mostrar en UI de administración
 */
export const PERMISSION_LABELS: Record<Permission, string> = {
  // Reservas
  [Permission.RESERVAS_LISTAR]: 'Listar Reservas',

  // Check-out
  [Permission.CHECKOUT_REGISTRAR_PAGO]: 'Registrar Pago de Check-out',
  [Permission.CHECKOUT_CERRAR]: 'Cerrar Check-out',
  [Permission.CHECKOUT_IMPRIMIR_COMPROBANTE]: 'Imprimir Comprobante de Check-out',

  // Comprobantes
  [Permission.COMPROBANTES_EMITIR]: 'Emitir Comprobante',
  [Permission.COMPROBANTES_ANULAR]: 'Anular Comprobante',
  [Permission.COMPROBANTES_IMPRIMIR]: 'Imprimir Comprobante',
  [Permission.COMPROBANTES_VER]: 'Ver Comprobante',

  // Habitaciones
  [Permission.HABITACIONES_LISTAR]: 'Listar Habitaciones',
  [Permission.HABITACIONES_VER]: 'Ver Habitación',
  [Permission.HABITACIONES_CREAR]: 'Crear Habitación',
  [Permission.HABITACIONES_MODIFICAR]: 'Modificar Habitación',
  [Permission.HABITACIONES_ELIMINAR]: 'Eliminar Habitación',
  [Permission.HABITACIONES_CAMBIAR_ESTADO]: 'Cambiar Estado de Habitación',

  // Clientes
  [Permission.CLIENTES_LISTAR]: 'Listar Clientes',
  [Permission.CLIENTES_VER]: 'Ver Cliente',
  [Permission.CLIENTES_CREAR]: 'Crear Cliente',
  [Permission.CLIENTES_MODIFICAR]: 'Modificar Cliente',
  [Permission.CLIENTES_ELIMINAR]: 'Eliminar Cliente',

  // Pagos
  [Permission.PAGOS_LISTAR]: 'Listar Pagos',
  [Permission.PAGOS_VER]: 'Ver Pago',
  [Permission.PAGOS_REGISTRAR]: 'Registrar Pago',
  [Permission.PAGOS_ANULAR]: 'Anular Pago',

  // Servicios
  [Permission.SERVICIOS_LISTAR]: 'Listar Servicios',
  [Permission.SERVICIOS_VER]: 'Ver Servicio',
  [Permission.SERVICIOS_CREAR]: 'Crear Servicio',
  [Permission.SERVICIOS_MODIFICAR]: 'Modificar Servicio',
  [Permission.SERVICIOS_ELIMINAR]: 'Eliminar Servicio',

  // Notificaciones
  [Permission.NOTIFICACIONES_LISTAR]: 'Listar Notificaciones',
  [Permission.NOTIFICACIONES_MARCAR_LEIDA]: 'Marcar Notificación como Leída',
  [Permission.NOTIFICACIONES_ELIMINAR]: 'Eliminar Notificación',

  // Reportes
  [Permission.REPORTES_OCUPACION]: 'Ver Reporte de Ocupación',
  [Permission.REPORTES_INGRESOS]: 'Ver Reporte de Ingresos',
  [Permission.REPORTES_CLIENTES]: 'Ver Reporte de Clientes',

  // Config - Usuarios
  [Permission.CONFIG_USUARIOS_LISTAR]: 'Listar Usuarios',
  [Permission.CONFIG_USUARIOS_VER]: 'Ver Usuario',
  [Permission.CONFIG_USUARIOS_CREAR]: 'Crear Usuario',
  [Permission.CONFIG_USUARIOS_MODIFICAR]: 'Modificar Usuario',
  [Permission.CONFIG_USUARIOS_ELIMINAR]: 'Eliminar Usuario',
  [Permission.CONFIG_USUARIOS_ASIGNAR_GRUPOS]: 'Asignar Grupos a Usuario',
  [Permission.CONFIG_USUARIOS_ASIGNAR_ACCIONES]: 'Asignar Acciones a Usuario',
  [Permission.CONFIG_USUARIOS_RESETEAR_PASSWORD]: 'Resetear Contraseña de Usuario',

  // Config - Grupos
  [Permission.CONFIG_GRUPOS_LISTAR]: 'Listar Grupos',
  [Permission.CONFIG_GRUPOS_VER]: 'Ver Grupo',
  [Permission.CONFIG_GRUPOS_CREAR]: 'Crear Grupo',
  [Permission.CONFIG_GRUPOS_MODIFICAR]: 'Modificar Grupo',
  [Permission.CONFIG_GRUPOS_ELIMINAR]: 'Eliminar Grupo',
  [Permission.CONFIG_GRUPOS_ASIGNAR_ACCIONES]: 'Asignar Acciones a Grupo',
  [Permission.CONFIG_GRUPOS_ASIGNAR_HIJOS]: 'Asignar Grupos Hijos',

  // Config - Acciones
  [Permission.CONFIG_ACCIONES_LISTAR]: 'Listar Acciones',
  [Permission.CONFIG_ACCIONES_VER]: 'Ver Acción',
  [Permission.CONFIG_ACCIONES_CREAR]: 'Crear Acción',
  [Permission.CONFIG_ACCIONES_MODIFICAR]: 'Modificar Acción',
  [Permission.CONFIG_ACCIONES_ELIMINAR]: 'Eliminar Acción',
};
