import { getStore } from '@netlify/blobs';
import { json, autorizado } from './_auth.mjs';

const ESTADOS = ['disponible', 'pocos', 'agotado'];
const CATS = ['santa', 'pesebre', 'nieve', 'arbol'];
const txt = (v, max) => String(v ?? '').slice(0, max);

function limpiar(p) {
  const par = (a) => (Array.isArray(a) ? [txt(a[0], 120), txt(a[1], 600)] : null);
  const precio = Number(p.precio);
  return {
    id: txt(p.id, 60).replace(/[^a-z0-9-]/gi, '') || 'c' + Date.now(),
    cat: CATS.includes(p.cat) ? p.cat : 'arbol',
    img: (Array.isArray(p.img) ? p.img : []).slice(0, 8).map((u) => txt(u, 300)),
    es: par(p.es) || ['Cojín', ''],
    en: par(p.en),
    precio: Number.isFinite(precio) && precio > 0 ? Math.round(precio) : null,
    estado: ESTADOS.includes(p.estado) ? p.estado : 'disponible',
    visible: p.visible !== false
  };
}

export default async (req) => {
  const store = getStore({ name: 'cojines', consistency: 'strong' });

  if (req.method === 'GET') {
    const data = await store.get('catalogo', { type: 'json' });
    return json(data || { productos: null });
  }

  if (req.method !== 'POST') return json({ error: 'metodo' }, 405);
  if (!autorizado(req)) return json({ error: 'clave' }, 401);

  const url = new URL(req.url);
  if (url.searchParams.has('login')) return json({ ok: true });

  let body;
  try { body = await req.json(); } catch { return json({ error: 'datos' }, 400); }
  if (!Array.isArray(body.productos)) return json({ error: 'datos' }, 400);

  const data = { productos: body.productos.slice(0, 200).map(limpiar), actualizado: new Date().toISOString() };
  await store.setJSON('catalogo', data);
  return json({ ok: true, actualizado: data.actualizado });
};

export const config = { path: '/api/catalogo' };
