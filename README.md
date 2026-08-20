# Días Naranja Gulf — buscador de promoción

Sitio estático listo para Vercel. No usa base de datos ni servicios pagos.

## Archivos
- `index.html`: interfaz.
- `styles.css`: diseño Gulf / Días Naranja.
- `app.js`: buscador y lógica de promoción.
- `data.json`: base de vehículos, motores y promociones tomada del Excel suministrado.
- `assets/`: piezas de campaña de referencia.
- `vercel.json`: configuración básica de Vercel.

## Cómo subirlo a Vercel
### Opción A: GitHub + Vercel
1. Crea un repositorio nuevo en GitHub.
2. Sube **todo el contenido de esta carpeta** a la raíz del repositorio.
3. En Vercel selecciona `Add New > Project` y conecta el repositorio.
4. Framework Preset: `Other`.
5. Build Command: déjalo vacío.
6. Output Directory: déjalo vacío.
7. Deploy.

### Opción B: Vercel CLI
Dentro de esta carpeta ejecuta:
```bash
npx vercel
```
Y sigue los pasos de Vercel.

## Cómo actualizar promociones
Edita `data.json`. Cada registro usa esta estructura:
```json
{
  "marcaEquipo": "SHACMAN",
  "linea": "SHC-X5000",
  "motor": "X12 CM2670 (EURO 6)",
  "capacidad": 36,
  "paga": 32,
  "recibe": 36,
  "obsequio": 4
}
```

La web busca por marca, línea o motor. También permite filtrar por capacidad de cárter.

## Nota de datos
Para evitar inconsistencias tipográficas en textos de la hoja original, `paga` se calcula como `capacidad - obsequio` y `recibe` como la capacidad total. Por ejemplo, un registro de 44 cuartos con 4 de obsequio queda `Paga 40 / Recibe 44`.
