# Catálogo de ropa con revendedoras

Sitio de venta de ropa por catálogo con carrito de compras y un sistema de
códigos de descuento para revendedoras: cada revendedora tiene un código
propio que le da un descuento a sus clientas y le genera a ella una comisión
por cada venta.

## Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind CSS
- **Prisma** + **PostgreSQL**
- Autenticación simple por cookie firmada para el panel de administración

## Funcionalidad

**Sitio público**
- Catálogo con filtro por categoría
- Ficha de producto con selector de cantidad y, si el producto tiene
  variantes, un listado de **color** y otro de **talle** (cuando corresponda)
  que se filtran entre sí y muestran sin stock las combinaciones agotadas
- Carrito de compras (persistido en el navegador)
- Checkout simplificado: solo pide el **código de revendedora (obligatorio,
  no se puede finalizar la compra sin uno válido, ni desde la interfaz ni
  llamando a la API directamente)** y una nota opcional del pedido. El único
  medio de pago es **efectivo/transferencia**. El nombre, teléfono y
  localidad del pedido se toman automáticamente de los datos de la
  revendedora (ya cargados en `/admin/revendedoras`), porque solo compran
  ellas.
- Confirmación de pedido ("¡Gracias por tu compra!") que muestra los datos
  para transferir (alias, titular y el número para enviar el comprobante,
  configurables en `/admin/configuracion`) y el botón de WhatsApp

**Panel de administración** (`/admin`)
- Resumen de ventas y comisiones generadas
- ABM de productos (nombre, precio, stock, categoría, imagen, alta/baja).
  Opcionalmente se le pueden cargar **variantes de color y/o talle**, cada
  una con su propio stock; si un producto tiene variantes, el stock general
  se ignora y las clientas eligen la variante en la ficha del producto
- **Precio de costo y ganancia**: al cargar un producto se puede anotar su
  costo (opcional); el formulario calcula al toque cuánto se gana en pesos
  y en % sobre el precio de venta, y el listado de productos también lo
  muestra.
  El costo es un dato privado del admin, nunca se expone en la tienda
- **Categorías** (`/admin/categorias`): crear o eliminar las categorías que después
  se eligen al cargar un producto y que aparecen como filtro en el catálogo. No
  se puede eliminar una categoría que todavía tiene productos cargados.
- ABM de revendedoras: código de descuento, % de descuento para la clienta,
  % de comisión y contraseña opcional para su panel. Al registrarse solas
  desde `/revendedora/registro` tanto el descuento para la clienta como la
  comisión arrancan en **0%**, y el admin les asigna los valores reales
  desde "Editar" al aprobarlas. La lista muestra la
  comisión total histórica y la comisión pendiente (desde el último pago);
  el botón **"Marcar pagada"** registra la fecha de pago y reinicia el
  contador de pendiente a $0, sin borrar el historial de ventas. También se
  puede **habilitar/deshabilitar el descuento para la clienta** de forma
  independiente de la cuenta y del código: si se deshabilita, el código
  sigue funcionando y sigue generando comisión para la revendedora, solo
  que sin aplicarle descuento a la compra. El listado se puede **ordenar
  por más ventas, más ganancia generada o localidad**, y cada nombre lleva
  a una **página de detalle** con sus artículos vendidos, monto total y
  ganancia generada para el negocio
- **Reportes** (`/admin/reportes`): ventas y ganancia neta de hoy, los
  últimos 7 y 30 días, tabla de ventas por día (últimas 2 semanas) y por
  mes, ranking de productos más vendidos y ranking de revendedoras por
  ganancia generada. La ganancia neta = ventas − costo de los productos
  vendidos (usando el precio de costo cargado en cada uno) − comisión
  pagada a la revendedora. También muestra el **margen de ganancia
  promedio de los productos activos** (precio vs. costo) y el **margen de
  ganancia promedio de las ventas** realizadas hasta el momento, con la
  opción de verlo por día, semana o mes. Ambos solo tienen en cuenta los
  productos con precio de costo cargado. Si configurás un **margen de
  ganancia objetivo** en `/admin/configuracion`, Reportes te muestra si el
  promedio de tus productos activos lo alcanza o cuánto te falta
- Listado de pedidos con detalle y cambio de estado (pendiente, confirmado,
  enviado, cancelado); los pedidos cancelados se pueden eliminar de la lista
- **Banners** (`/admin/banners`): carrusel de banners para la home, subiendo
  las imágenes desde archivos (requiere Vercel Blob, ver más abajo)
- **Configuración** (`/admin/configuracion`): nombre de la tienda, color
  principal del sitio, título/subtítulo/imagen del banner y número de
  WhatsApp — todo editable sin tocar código ni redeployar

**Panel de revendedoras** (`/revendedora`)
- Página pública "¿Querés ser revendedora?" con botones para registrarse o
  iniciar sesión
- Registro con nombre, email, teléfono, localidad y contraseña: genera un
  código de descuento único y queda **pendiente de aprobación** (el admin la
  activa desde `/admin/revendedoras`). La localidad se muestra en el listado
  de admin para organizar los envíos
- Panel propio (`/revendedora/panel`) donde cada revendedora ve su código,
  sus ventas, la comisión acumulada desde el primer día y la comisión
  pendiente desde el último pago que le registró el admin

El descuento se calcula sobre el subtotal del pedido; la comisión de la
revendedora se calcula sobre el total ya con el descuento aplicado.

## Cómo correrlo localmente

Necesitás una base de datos Postgres. La forma más rápida es crear una
gratis en [Neon](https://neon.tech) o [Supabase](https://supabase.com) (un
par de minutos, te dan la cadena de conexión); también podés usar un
Postgres local si ya tenés uno instalado.

```bash
npm install
cp .env.example .env   # completar DATABASE_URL y el resto de los valores
npm run db:push        # crea las tablas en la base de datos
npm run db:seed        # carga productos y revendedoras de ejemplo
npm run dev
```

Abrí http://localhost:3000 para el catálogo y http://localhost:3000/admin
para el panel (usuario/clave definidos en `.env`).

## Variables de entorno (`.env`)

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión de Postgres (`postgresql://usuario:password@host:5432/db`) |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Credenciales del panel de admin (acceso completo) |
| `EMPLOYEE_USERNAME` / `EMPLOYEE_PASSWORD` | Opcional. Credenciales de un acceso restringido para un empleado (ver abajo) |
| `ADMIN_SESSION_SECRET` | Cadena secreta larga para firmar las sesiones (admin y revendedoras) |

**Importante:** cambiá `ADMIN_PASSWORD` y `ADMIN_SESSION_SECRET` antes de
publicar el sitio. El nombre de la tienda, el color, el banner y el número
de WhatsApp se configuran desde `/admin/configuracion`, no acá.

### Acceso para un empleado (sin ver ganancias)

Si configurás `EMPLOYEE_USERNAME` y `EMPLOYEE_PASSWORD`, esas credenciales
también entran por `/admin/login`, pero con acceso limitado únicamente a
`/admin/pedidos`: puede ver la lista de pedidos, sus datos de envío
(nombre, teléfono, dirección), cambiar el estado del pedido (a preparación,
enviado, entregado, etc) y registrar ventas hechas en persona desde
"+ Registrar venta", eligiendo los productos con foto desde un catálogo
visual (con buscador), su variante de color/talle si tiene, y la cantidad,
así el stock se descuenta correctamente. No puede ver ni acceder a Resumen,
Reportes, Productos, Categorías, Revendedoras, Banners ni Configuración, y en
el detalle de un pedido no ve la comisión de la revendedora. Tampoco puede
eliminar pedidos cancelados. Si dejás esas dos variables vacías, ese acceso
directamente no existe.

## Cargar tus propios productos

Desde `/admin/productos` podés cargar cada producto con su nombre, precio,
stock, categoría e imagen. Las fotos se suben directamente desde tu
computadora (esto requiere conectar Vercel Blob Storage, ver la sección
siguiente): la primera reemplaza la foto principal y el resto se agrega
como galería adicional en la ficha del producto. Los productos de ejemplo
usan íconos en `public/products/` como respaldo cuando una foto no carga.

## Subir fotos y banners desde archivos (Vercel Blob Storage)

Para poder subir fotos de productos y banners desde tu computadora (en vez
de pegar una URL), necesitás conectar **Vercel Blob Storage** a tu
proyecto — es un servicio de almacenamiento de archivos de Vercel, con un
plan gratuito que alcanza de sobra para un catálogo. Sin esto, el sitio
sigue funcionando normalmente, pero el panel solo permite cargar imágenes
por URL y `/admin/banners` queda deshabilitado para subir banners nuevos.

1. En tu proyecto en Vercel, andá a la pestaña **Storage** → **Create
   Database** → elegí **Blob**.
2. Seguí los pasos para crear el store y conectarlo a tu proyecto. Vercel
   agrega automáticamente la variable `BLOB_READ_WRITE_TOKEN` — no hace
   falta copiarla a mano.
3. Redeployá el proyecto (o esperá al próximo deploy) para que la variable
   quede disponible.

## Mercado Pago (integración desactivada en el checkout)

El checkout de la tienda ya **no ofrece pagar con tarjeta/Mercado Pago**:
el único medio de pago es efectivo/transferencia. La integración con
Mercado Pago (Checkout Pro) sigue en el código sin usarse en pedidos
nuevos, solo para poder reintentar el cobro de pedidos viejos que ya se
habían pagado por esa vía (botón "Reintentar pago" en la confirmación de
un pedido rechazado). Si en algún momento querés volver a ofrecerlo en el
checkout, avisame.

1. Entrá a [mercadopago.com.ar/developers/panel](https://www.mercadopago.com.ar/developers/panel)
   con la cuenta de Mercado Pago del negocio (o creá una, es gratis).
2. Creá una aplicación ("Tus integraciones" → "Crear aplicación").
3. En "Credenciales de producción" copiá el **Access Token** (empieza con
   `APP_USR-...`). Para probar sin cobrar de verdad primero, usá las
   "Credenciales de prueba" (`TEST-...`) y las tarjetas de prueba que
   Mercado Pago provee en su documentación.
4. Cargá `MERCADOPAGO_ACCESS_TOKEN` con ese valor en Vercel (Settings →
   Environment Variables) y redeployá.
5. **Webhook (recomendado, opcional):** en la misma aplicación, sección
   "Webhooks", agregá la URL `https://tu-sitio.vercel.app/api/mercadopago/webhook`
   y copiá la "Clave secreta" que te da ahí. Cargala como
   `MERCADOPAGO_WEBHOOK_SECRET` en Vercel. Sin esto, el sitio igual detecta
   el pago apenas la clienta vuelve del checkout (por eso es opcional),
   pero el webhook es una confirmación más confiable si la clienta cierra
   la pestaña antes de volver.

**Nota:** el stock se descuenta al crear el pedido, no al confirmarse el
pago. Si una clienta abandona el pago con Mercado Pago sin completarlo, el
stock queda reservado en ese pedido; revisalo de vez en cuando en
`/admin/pedidos` (quedan como "Pendiente") y cancelalo manualmente si
corresponde liberar el stock.

## Despliegue en producción (ej. Vercel)

1. Creá una base de datos Postgres gratis en [Neon](https://neon.tech) o
   [Supabase](https://supabase.com) y copiá su cadena de conexión.
2. En el proyecto de Vercel, cargá las variables de entorno: `DATABASE_URL`
   (la de Postgres), `ADMIN_USERNAME`, `ADMIN_PASSWORD` y
   `ADMIN_SESSION_SECRET` (`EMPLOYEE_USERNAME`, `EMPLOYEE_PASSWORD`,
   `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET` y
   `BLOB_READ_WRITE_TOKEN` son opcionales, ver más abajo).
3. Deployá. El comando `build` (`prisma generate && prisma db push && ...`)
   crea las tablas automáticamente en cada deploy, y el seed carga el
   catálogo, las categorías y las revendedoras de ejemplo **solo la primera
   vez** que se despliega (base vacía) — no hace falta correr nada a mano.
   En los deploys siguientes no se vuelve a tocar esos datos, así que borrar
   un producto, una categoría o una revendedora desde el admin es
   definitivo y no reaparece en el próximo deploy.

Vercel sirve el sitio por HTTPS automáticamente, que es necesario porque la
cookie de sesión del admin se marca `Secure`.

**Importante:** no uses SQLite en un hosting serverless (Vercel, Netlify,
etc.) — su sistema de archivos es de solo lectura, así que la base de datos
no puede crearse ni escribirse ahí y todas las páginas fallan con un error
de servidor. Por eso este proyecto usa Postgres desde el principio.

**Sobre `prisma db push --accept-data-loss` en el build:** como las tablas
se sincronizan automáticamente en cada deploy (sin migraciones prolijas),
Prisma a veces pide confirmar cambios que él clasifica como "riesgosos"
(por ejemplo, agregar una restricción `unique` a una columna) aunque en la
práctica no borren nada. Se usa esta bandera para que el deploy no se corte
esperando una confirmación manual. Si en algún momento se agrega un cambio
de esquema realmente destructivo (por ejemplo, borrar una columna con datos
reales de clientas), conviene revisarlo a mano antes de deployar en lugar
de confiar en el build automático.

**Nota de seguridad:** el proyecto usa la última versión parcheada de la
rama Next.js 14 (`14.2.35`). Una divulgación menor de endpoints internos
de Server Actions ([GHSA-955p-x3mx-jcvp](https://github.com/advisories/GHSA-955p-x3mx-jcvp))
solo está resuelta en Next.js 16; migrar a esa versión mayor implica
cambios de breaking changes que quedan fuera del alcance de este proyecto.
