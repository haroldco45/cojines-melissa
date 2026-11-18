import { getStore } from '@netlify/blobs';
import { json, autorizado } from './_auth.mjs';

export default async (req) => {
  const store = getStore({ name: 'fotos-cojines', consistency: 'strong' });
  const url = new URL(req.url);
  const k = (url.searchParams.get('k') || '').replace(/[^a-z0-9-]/gi, '');

  if (req.method === 'GET') {
    if (!k) return new Response('Falta la foto', { status: 400 });
    const foto = await store.get(k, { type: 'arrayBuffer' });
    if (!foto) return new Response('No existe', { status: 404 });
    return new Response(foto, {
      headers: { 'content-type': 'image/jpeg', 'cache-control': 'public, max-age=31536000, immutable' }
    });
  }

  if (!autorizado(req)) return json({ error: 'clave' }, 401);

  if (req.method === 'POST') {
    const datos = await req.arrayBuffer();
    if (!datos.byteLength || datos.byteLength > 4 * 1024 * 1024) return json({ error: 'tamaño' }, 400);
    const clave = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    await store.set(clave, datos);
    return json({ ok: true, url: '/api/foto?k=' + clave });
  }

  if (req.method === 'DELETE' && k) {
    await store.delete(k);
    return json({ ok: true });
  }

  return json({ error: 'metodo' }, 405);
};

export const config = { path: '/api/foto' };
