# Flowspace — Instrucciones de configuración

## Requisitos previos (todos gratis)
- Cuenta en [supabase.com](https://supabase.com) (free tier)
- Cuenta en [vercel.com](https://vercel.com) (free tier)
- Cuenta en [github.com](https://github.com)

---

## Paso 1 — Configurar Supabase

1. Creá un nuevo proyecto en [supabase.com/dashboard](https://supabase.com/dashboard)
2. Poné un nombre (ej: "flowspace") y elegí una contraseña segura
3. Esperá ~2 minutos a que inicialice

4. Andá a **SQL Editor** (ícono de base de datos)
5. Hacé clic en **"New query"**
6. Copiá todo el contenido de `supabase/schema.sql` y pegalo
7. Ejecutá con el botón **"Run"**

8. Andá a **Project Settings → API**
9. Copiá:
   - `Project URL` → tu `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` (de API Keys) → tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Paso 2 — Configurar variables de entorno locales

Creá un archivo `.env.local` en la raíz del proyecto:

```
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_CLAVE_ANON
```

---

## Paso 3 — Probar localmente

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000)

---

## Paso 4 — Subir a GitHub

```bash
git init
git add .
git commit -m "Flowspace inicial"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/flowspace.git
git push -u origin main
```

---

## Paso 5 — Deploy en Vercel

1. Andá a [vercel.com/new](https://vercel.com/new)
2. Importá el repositorio de GitHub
3. En **"Environment Variables"** agregá:
   - `NEXT_PUBLIC_SUPABASE_URL` → tu URL de Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → tu clave anon
4. Hacé clic en **"Deploy"**
5. En ~2 minutos tenés tu app en `https://flowspace-TU_USUARIO.vercel.app`

---

## Paso 6 — Configurar URL de callback en Supabase (para producción)

1. En Supabase → **Authentication → URL Configuration**
2. Agregá en **"Redirect URLs"**:
   ```
   https://TU_APP.vercel.app/api/auth/callback
   ```

---

## Cómo invitar colaboradores

1. Abrí la app y andá al sidebar
2. Hacé clic en **"Invitar colaborador"** — copia el link automáticamente
3. Enviá ese link al colaborador
4. Cuando lo abran (deben tener cuenta), se agregan al workspace automáticamente

---

## Resumen de costos

| Servicio | Costo |
|----------|-------|
| Supabase | $0 (hasta 500MB DB, 50k usuarios) |
| Vercel | $0 (hasta 100GB bandwidth) |
| GitHub | $0 |
| **Total** | **$0/mes** |
