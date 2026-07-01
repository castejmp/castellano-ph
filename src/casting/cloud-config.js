/**
 * Config de la nube (Supabase). La clave `anon` es pública por diseño:
 * con RLS + login activados, sin la contraseña nadie accede a los datos.
 * Si URL/ANON quedan vacíos, la app funciona 100% local (IndexedDB).
 */
export const CLOUD = {
  url: 'https://wybrebbesljxgphxxgwv.supabase.co',
  anon: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5YnJlYmJlc2xqeGdwaHh4Z3d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MjUzMjIsImV4cCI6MjA5ODUwMTMyMn0.D4sc-WMz43ruB6KwKIbeYOa8lh9-JAexvELG32PDj7I',
  bucket: 'casting-fotos',
};

export const cloudEnabled = () => Boolean(CLOUD.url && CLOUD.anon);
