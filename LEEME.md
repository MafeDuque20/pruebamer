# Talma Mercancías Dashboard V2

Aplicación estática para GitHub Pages conectada directamente con Firebase. No requiere `127.0.0.1`, PowerShell, un computador encendido, un servidor intermedio ni GitHub Actions.

## Actualización manual de datos y notas

El botón **Actualizar** inicia dos acciones:

1. refresca la conexión en tiempo real con Firebase;
2. descarga `reporteglobal.xlsx` y abre el asistente para revisar notas.

La importación masiva también descarga el reporte cuando se confirma la carga y abre el asistente al finalizar. Debido a la protección CORS del servidor de Aprende Talma, el navegador exige que el usuario seleccione el archivo recién descargado; una página de GitHub Pages no puede leer silenciosamente un archivo de Descargas.

En el asistente:

1. selecciona `reporteglobal.xlsx`;
2. pulsa **Procesar y guardar notas**;
3. espera el resumen final.

El archivo grande se analiza en un Web Worker para no congelar la interfaz. Solo se conservan los registros de:

- Mercancías Peligrosas Básico 8 Horas · Inicial 2026V2;
- Mercancías Peligrosas Básico 4 Horas · Recurrente 2026V2.

El cruce usa cédula normalizada, familia de curso y compatibilidad del nombre. Cuando una persona tiene varios registros del mismo tipo se actualiza el más reciente cuyo nombre coincida. El historial no se elimina. Las escrituras por lotes modifican exclusivamente `NOTA` y la redondean sin decimales.

## Cursos estandarizados

La aplicación presenta y agrupa todos los derivados como:

- `Básico Inicial`;
- `Básico Repaso`.

Se ignoran diferencias de tildes, mayúsculas y las variantes Repaso, Recurrente o Recurrencia. La normalización se aplica a datos históricos en memoria y a todo registro creado, editado o importado.

## Vistas operativas

- **Resumen:** asistencia general, inasistencias y comparación rápida por base.
- **Registros:** tabla maestra paginada, filtros, CRUD, importación y exportación.
- **Personas:** agenda de colaboradores con curso hoy y directorio histórico.
- **Cursos:** comparación de Inicial y Repaso por personas, grupos, bases y asistencia.
- **Grupos:** agenda separada en Hoy, Próximos e Historial.

## Seguridad

- No hay cuentas de servicio, claves privadas ni Secrets de GitHub.
- Firebase usa la configuración pública normal del frontend y sus reglas de seguridad existentes.
- El reporte permanece en el equipo del usuario y se procesa localmente en el navegador.
- Si la lectura o el cruce falla, no se inicia ninguna escritura de notas.

## Validación

```bash
node test-logica.mjs
node test-v2.mjs
```

Para publicar, sube el contenido de esta carpeta a la rama configurada para GitHub Pages.
