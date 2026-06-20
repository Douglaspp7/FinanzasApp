// Deterministic mock data for Flujo — LATAM financial SaaS

export type ClienteStatus = "activo" | "inactivo" | "moroso" | "nuevo";
export type Segmento = "VIP" | "Frecuente" | "Ocasional" | "Riesgo";

export interface Cliente {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  status: ClienteStatus;
  segmento: Segmento;
  ltv: number;
  totalCompras: number;
  ultimaCompra: string;
  ingreso: string;
  ciudad: string;
  puntos: number;
}

export interface Transaccion {
  id: string;
  fecha: string;
  descripcion: string;
  categoria: string;
  centroCosto: string;
  tipo: "ingreso" | "egreso";
  monto: number;
  estado: "conciliado" | "pendiente";
  metodo: string;
  cliente?: string;
}

export interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  costo: number;
  stock: number;
  stockMinimo: number;
  proveedor: string;
  sku: string;
}

export interface Servicio {
  id: string;
  nombre: string;
  categoria: string;
  duracion: number;
  precio: number;
  profesional: string;
}

export interface Agendamiento {
  id: string;
  cliente: string;
  servicio: string;
  profesional: string;
  fecha: string;
  hora: string;
  duracion: number;
  estado: "confirmado" | "pendiente" | "cancelado" | "completado";
}

export interface Actividad {
  id: string;
  tipo: "venta" | "cliente" | "pago" | "alerta" | "sistema";
  titulo: string;
  detalle: string;
  fecha: string;
}

const nombres = [
  "María González", "Carlos Rodríguez", "Ana Martínez", "Luis Hernández", "Sofía López",
  "Diego Ramírez", "Valentina Torres", "Javier Flores", "Camila Díaz", "Andrés Morales",
  "Isabella Cruz", "Mateo Reyes", "Lucía Ortiz", "Sebastián Gómez", "Daniela Vargas",
  "Nicolás Castro", "Renata Jiménez", "Emilio Ruiz", "Antonella Núñez", "Tomás Mendoza",
  "Gabriela Silva", "Martín Romero", "Florencia Aguilar", "Benjamín Herrera", "Catalina Vega",
];
const ciudades = ["CDMX", "Bogotá", "Buenos Aires", "Santiago", "Lima", "Monterrey", "Medellín", "Guadalajara"];
const segmentos: Segmento[] = ["VIP", "Frecuente", "Ocasional", "Riesgo"];
const statuses: ClienteStatus[] = ["activo", "activo", "activo", "nuevo", "inactivo", "moroso"];

function seeded(i: number, mod: number) {
  return (i * 9301 + 49297) % mod;
}

export const clientes: Cliente[] = nombres.map((nombre, i) => {
  const ltv = 8000 + seeded(i, 92000);
  return {
    id: `CLI-${String(1000 + i)}`,
    nombre,
    email: nombre.toLowerCase().replace(/ /g, ".").replace(/[áéíóú]/g, (c) => "aeiou"["aeiou".indexOf(c)]) + "@email.com",
    telefono: `+52 55 ${1000 + seeded(i, 8999)} ${2000 + seeded(i, 7999)}`,
    status: statuses[i % statuses.length],
    segmento: segmentos[i % segmentos.length],
    ltv,
    totalCompras: 3 + seeded(i, 80),
    ultimaCompra: new Date(2026, 5, 1 + (i % 19)).toISOString(),
    ingreso: new Date(2024, i % 12, 1 + (i % 27)).toISOString(),
    ciudad: ciudades[i % ciudades.length],
    puntos: seeded(i, 5000),
  };
});

const categoriasIngreso = ["Ventas", "Servicios", "Suscripciones", "Otros ingresos"];
const categoriasEgreso = ["Nómina", "Proveedores", "Renta", "Marketing", "Impuestos", "Servicios públicos"];
const metodos = ["Transferencia", "Tarjeta", "Efectivo", "PIX", "Mercado Pago"];

export const transacciones: Transaccion[] = Array.from({ length: 48 }, (_, i) => {
  const esIngreso = i % 3 !== 0;
  return {
    id: `TRX-${String(5000 + i)}`,
    fecha: new Date(2026, 5, 1 + (i % 20)).toISOString(),
    descripcion: esIngreso
      ? `Cobro ${categoriasIngreso[i % categoriasIngreso.length]} #${100 + i}`
      : `Pago ${categoriasEgreso[i % categoriasEgreso.length]} #${100 + i}`,
    categoria: esIngreso ? categoriasIngreso[i % categoriasIngreso.length] : categoriasEgreso[i % categoriasEgreso.length],
    centroCosto: ["Operaciones", "Comercial", "Administración"][i % 3],
    tipo: esIngreso ? "ingreso" : "egreso",
    monto: esIngreso ? 5000 + seeded(i, 45000) : 2000 + seeded(i, 28000),
    estado: i % 4 === 0 ? "pendiente" : "conciliado",
    metodo: metodos[i % metodos.length],
    cliente: esIngreso ? nombres[i % nombres.length] : undefined,
  };
});

export const productos: Producto[] = [
  "Shampoo Premium", "Acondicionador Pro", "Tinte Profesional", "Crema Facial", "Sérum Vitamina C",
  "Mascarilla Capilar", "Aceite Esencial", "Kit Manicura", "Esmalte Gel", "Protector Solar",
  "Exfoliante Corporal", "Loción Hidratante",
].map((nombre, i) => ({
  id: `PRD-${String(2000 + i)}`,
  nombre,
  categoria: ["Cuidado Capilar", "Cuidado Facial", "Uñas", "Corporal"][i % 4],
  precio: 180 + seeded(i, 820),
  costo: 90 + seeded(i, 400),
  stock: seeded(i, 120),
  stockMinimo: 10,
  proveedor: ["Distribuidora Bella", "CosmeticsMX", "ProSupply", "BeautyDist"][i % 4],
  sku: `SKU${4000 + i}`,
}));

export const servicios: Servicio[] = [
  "Corte de Cabello", "Coloración", "Manicura", "Pedicura", "Tratamiento Facial",
  "Masaje Relajante", "Depilación", "Maquillaje", "Peinado", "Barba",
].map((nombre, i) => ({
  id: `SRV-${String(3000 + i)}`,
  nombre,
  categoria: ["Cabello", "Uñas", "Estética", "Spa"][i % 4],
  duracion: [30, 45, 60, 90][i % 4],
  precio: 250 + seeded(i, 750),
  profesional: nombres[i % 6],
}));

export const agendamientos: Agendamiento[] = Array.from({ length: 12 }, (_, i) => ({
  id: `AGD-${String(6000 + i)}`,
  cliente: nombres[i % nombres.length],
  servicio: servicios[i % servicios.length].nombre,
  profesional: nombres[(i + 3) % 6],
  fecha: new Date(2026, 5, 20 + (i % 5)).toISOString(),
  hora: `${9 + (i % 8)}:${i % 2 === 0 ? "00" : "30"}`,
  duracion: [30, 45, 60][i % 3],
  estado: (["confirmado", "pendiente", "confirmado", "completado", "cancelado"] as const)[i % 5],
}));

export const actividades: Actividad[] = [
  { id: "a1", tipo: "venta", titulo: "Nueva venta", detalle: "María González · $2,450", fecha: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: "a2", tipo: "cliente", titulo: "Cliente nuevo", detalle: "Tomás Mendoza se registró", fecha: new Date(Date.now() - 22 * 60000).toISOString() },
  { id: "a3", tipo: "pago", titulo: "Pago recibido", detalle: "Factura #1042 · $8,900", fecha: new Date(Date.now() - 65 * 60000).toISOString() },
  { id: "a4", tipo: "alerta", titulo: "Stock bajo", detalle: "Tinte Profesional · 4 unidades", fecha: new Date(Date.now() - 3 * 3600000).toISOString() },
  { id: "a5", tipo: "pago", titulo: "Pago vencido", detalle: "Carlos Rodríguez · $3,200", fecha: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: "a6", tipo: "sistema", titulo: "Respaldo completado", detalle: "Backup automático diario", fecha: new Date(Date.now() - 8 * 3600000).toISOString() },
];

export const flujoMensual = [
  { mes: "Ene", ingresos: 320000, egresos: 210000 },
  { mes: "Feb", ingresos: 298000, egresos: 225000 },
  { mes: "Mar", ingresos: 385000, egresos: 240000 },
  { mes: "Abr", ingresos: 412000, egresos: 258000 },
  { mes: "May", ingresos: 468000, egresos: 272000 },
  { mes: "Jun", ingresos: 521000, egresos: 295000 },
].map((m) => ({ ...m, neto: m.ingresos - m.egresos }));

export const flujoAcumulado = flujoMensual.reduce<{ mes: string; acumulado: number }[]>((acc, m, i) => {
  const prev = i === 0 ? 0 : acc[i - 1].acumulado;
  acc.push({ mes: m.mes, acumulado: prev + m.neto });
  return acc;
}, []);

export const gastosPorCategoria = [
  { categoria: "Nómina", monto: 145000 },
  { categoria: "Proveedores", monto: 78000 },
  { categoria: "Renta", monto: 42000 },
  { categoria: "Marketing", monto: 28000 },
  { categoria: "Impuestos", monto: 35000 },
  { categoria: "Servicios", monto: 18000 },
];

export const ingresosPorDia = Array.from({ length: 30 }, (_, i) => ({
  dia: i + 1,
  monto: 12000 + ((i * 7919) % 18000),
}));

export const topClientes = [...clientes].sort((a, b) => b.ltv - a.ltv).slice(0, 8);
