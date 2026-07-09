# ============================================================
# PLAN DE PRUEBAS - SENA BIENESTAR
# Sistema de Gestion de Citas
# Version: 1.0 | Fecha: Julio 2026
# ============================================================

## 1. CONCEPTOS DE PRUEBAS

### 1.1 Definicion
Las pruebas de software son actividades destinadas a evaluar una propiedad del sistema
y verificar que cumple con los requisitos especificados. El objetivo es encontrar errores,
garantizar calidad y validar el comportamiento esperado.

### 1.2 Objetivos
- Detectar defectos antes de la puesta en produccion
- Verificar que el sistema cumple requisitos funcionales y no funcionales
- Asegurar la confiabilidad, usabilidad y rendimiento
- Validar la integracion entre componentes

---

## 2. NIVELES DE PRUEBAS

| Nivel | Descripcion | Herramienta | Estado |
|-------|-------------|-------------|--------|
| Unitarias | Prueban funciones/metodos individuales | Vitest | Implementado |
| Integracion | Prueban interaccion entre componentes | Vitest + MSW | Implementado |
| Sistema | Prueban el flujo completo del usuario | Manual | Documentado |
| Aceptacion | Validacion con el usuario final | Manual | Documentado |

---

## 3. TIPOS DE PRUEBAS

### 3.1 Funcionales
- **Pruebas de regreso**: Verificar que cambios no rompen funcionalidad existente
- **Pruebas de validacion**: Formularios, campos requeridos, formatos
- **Pruebas de autenticacion**: Login, registro, roles, sesiones
- **Pruebas de CRUD**: Crear, leer, actualizar, eliminar citas

### 3.2 No Funcionales
- **Rendimiento**: Tiempo de respuesta bajo carga
- **Usabilidad**: Interfaz intuitiva, navegacion clara
- **Seguridad**: RLS, autenticacion, autorizacion
- **Compatibilidad**: Responsive design, dark mode

### 3.3 Estructurales
- **Cobertura de codigo**: Porcentaje de lineas/ramas ejecutadas
- **Analisis estatico**: ESLint, validacion de tipos

---

## 4. ENFOQUES DE PRUEBAS

### 4.1 Black Box (Caja Negra)
- Pruebas basadas en requisitos sin conocer codigo interno
- Equivalence partitioning: Dividir entradas en grupos validos/invalidos
- Boundary value analysis: Probar limites de rangos
- Decision table testing: Tablas de decision para logica compleja

### 4.2 White Box (Caja Blanca)
- Pruebas basadas en la estructura del codigo
- Statement coverage: Ejecutar cada linea de codigo
- Branch coverage: Ejecutar cada camino condicional
- Path coverage: Ejecutar cada trayectoria posible

### 4.3 Grey Box (Caja Gris)
- Combinacion de ambos enfoques
- Conocimiento parcial de la estructura interna
- Pruebas de integracion basadas en conocimiento de la arquitectura

---

## 5. HERRAMIENTAS TECNOLOGICAS

| Herramienta | Uso | Tipo |
|-------------|-----|------|
| Vitest | Framework de pruebas unitarias | Unit/Integration |
| @testing-library/react | Pruebas de componentes React | Integration |
| MSW (Mock Service Worker) | Mock de APIs | Integration |
| ESLint | Analisis estatico | Estructural |
| Artillery | Pruebas de carga y estres | Performance |
| npm audit | Auditoria de seguridad | Seguridad |

---

## 6. CASOS DE PRUEBA

### 6.1 Pruebas Unitarias

#### CP-001: AppointmentRepository.fetch
- **Objetivo**: Verificar que fetch retorna citas filtradas
- **Precondiciones**: Base de datos con citas existentes
- **Pasos**: Llamar fetch() con filtros
- **Resultado esperado**: Array de citas con profiles unidos

#### CP-002: AppointmentRepository.create
- **Objetivo**: Verificar creacion de cita
- **Precondiciones**: Usuario autenticado
- **Pasos**: Llamar create() con datos validos
- **Resultado esperado**: Cita creada con ID

#### CP-003: hasRole
- **Objetivo**: Verificar validacion de roles
- **Precondiciones**: Profile con rol asignado
- **Pasos**: Llamar hasRole() con diferentes roles
- **Resultado esperado**: true/false segun coincidencia

#### CP-004: AppointmentRepository.checkAvailability
- **Objetivo**: Verificar disponibilidad de horario
- **Precondiciones**: Horarios ocupados y libres
- **Pasos**: Consultar horarios
- **Resultado esperado**: true si disponible, false si ocupado

### 6.2 Pruebas de Integracion

#### CP-005: Flujo completo de login
- **Objetivo**: Verificar login + redireccion por rol
- **Pasos**: Ingresar credenciales -> Verificar sesion -> Verificar redireccion
- **Resultado esperado**: Redirige a dashboard correcto

#### CP-006: Flujo de agendar cita
- **Objetivo**: Verificar creacion completa de cita
- **Pasos**: Seleccionar dependencia -> Fecha -> Hora -> Confirmar
- **Resultado esperada**: Cita creada y visible en dashboard

### 6.3 Pruebas de Carga

#### CP-007: 50 usuarios simultaneos
- **Objetivo**: Verificar rendimiento bajo carga moderada
- **Herramienta**: Artillery
- **Metricas**: Tiempo respuesta < 2s, errores < 5%

#### CP-008: 200 usuarios simultaneos
- **Objetivo**: Verificar comportamiento bajo alta carga
- **Herramienta**: Artillery
- **Metricas**: Tiempo respuesta < 5s, errores < 10%

### 6.4 Pruebas de Estres

#### CP-009: Carga progresiva
- **Objetivo**: Encontrar punto de quiebre del sistema
- **Metodo**: Aumentar usuarios de 10 a 500 gradualmente
- **Metricas**: Throughput, latencia, tasa de error

---

## 7. CRITERIOS DE ACEPTACION

- [ ] 100% pruebas unitarias pasan
- [ ] 0 errores criticos en pruebas de integracion
- [ ] Tiempo de respuesta < 2s para operaciones normales
- [ ] Cobertura de codigo > 60%
- [ ] ESLint: 0 errores

---

## 8. REGISTRO DE RESULTADOS

| Fecha | Tipo | Pruebas | Pasaron | Fallaron | Observaciones |
|-------|------|---------|---------|----------|---------------|
| 09/07/2026 | Unitarias | - | - | - | Pendiente |
| 09/07/2026 | Integracion | - | - | - | Pendiente |
| 09/07/2026 | Carga | - | - | - | Pendiente |
