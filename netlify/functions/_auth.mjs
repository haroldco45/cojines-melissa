export const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });

// La clave se configura en Netlify: Site configuration > Environment variables > CLAVE_ADMIN
export const autorizado = (req) => {
  const clave = Netlify.env.get('CLAVE_ADMIN');
  return Boolean(clave) && req.headers.get('x-clave') === clave;
};
