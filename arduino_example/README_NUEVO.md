# 🔌 Sistema de Medición de Tren con Arduino

## 📋 Descripción General

Este código Arduino mide el tiempo que tarda un tren en completar una vuelta en un circuito. **Cada vuelta completada representa la llegada a una estación**. El sistema calcula automáticamente la **velocidad** y **aceleración** del tren basándose en el tiempo medido y la distancia fija de **3.33 metros**.

### 🎯 Características Principales

- ✅ **Medición de tiempo de vuelta** con sensor IR
- ✅ **Cada vuelta = 1 estación alcanzada**
- ✅ **Cálculo automático de velocidad** (m/s)
- ✅ **Cálculo automático de aceleración** (m/s²)
- ✅ **Ignora vagones individuales** (detecciones < 5 segundos)
- ✅ **Envío de datos en formato JSON** al servidor
- ✅ **Contador de estaciones** automático
- ✅ **Distancia fija de 3.33 metros** por estación

## 🚂 Funcionamiento del Sistema

### El Tren
- **Configuración**: Tren con 2 vagones
- **Distancia de recorrido**: 3.33 metros (fija por vuelta)
- **Sensor**: IR en pin digital 2 (interrupción)
- **Lógica**: 1 vuelta = 1 estación alcanzada

### Sistema de Estaciones
```
Vuelta 1 → Estación 1
Vuelta 2 → Estación 2
Vuelta 3 → Estación 3
Vuelta 4 → Estación 4
...y así sucesivamente
```

### Lógica de Detección
1. **Primera detección** → Salida hacia la siguiente estación (inicia cronómetro)
2. **Segunda detección** (> 5 segundos después) → Llegada a estación (para cronómetro y calcula resultados)
3. **Detecciones < 5 segundos** → Ignoradas (son vagones del mismo tren)

### Cálculos Realizados

#### Velocidad Media
```
v = distancia / tiempo
v = 3.33 m / t segundos
```

#### Aceleración Media
Asumiendo velocidad inicial = 0 y aceleración constante:
```
d = 0.5 * a * t²
a = (2 * d) / t²
a = (2 * 3.33) / t²
```

## 🔧 Configuración del Hardware

### Componentes Necesarios
- Arduino Uno/Nano/Mega
- Sensor IR (infrarrojo)
- Resistencias pull-up/pull-down según sensor
- Cables de conexión

### Conexiones

```
Sensor IR → Arduino
───────────────────
VCC → 5V
GND → GND  
OUT → Pin Digital 2 (INT0)
```

## 📊 Formato de Salida

### Salida en Monitor Serial (Humana)
```
=== Sistema de medición de tren ===
Distancia de recorrido: 3.33 m
Cada vuelta = 1 estación alcanzada
Esperando paso del tren a la primera estación...

✓ Tren detectado - salida hacia estación 1
✓ Tren detectado - llegada a estación

--- RESULTADOS ---
Estación alcanzada: 1
Tiempo de recorrido: 5.2341 s
Distancia: 3.33 m
Velocidad media: 0.6363 m/s
Aceleración media: 0.2433 m/s²
-------------------

Esperando llegada a estación 2...
```

### Salida JSON (Para Backend)
```json
{"station":1,"time":5.2341,"distance":3.33,"velocity":0.6363,"acceleration":0.2433}
```

## 🚀 Instalación y Uso

### 1. Cargar el Código
1. Abrir Arduino IDE
2. Abrir archivo: `train_sensor.ino`
3. Seleccionar placa: Tools → Board → Arduino Uno
4. Seleccionar puerto: Tools → Port → COM# (Windows)
5. Hacer clic en "Upload" (→)

### 2. Verificar Conexión
1. Abrir Monitor Serial: Tools → Serial Monitor
2. Configurar velocidad: 9600 baud
3. Deberías ver: "=== Sistema de medición de tren ==="

### 3. Conectar con el Backend
1. En la interfaz web, click en "Actualizar Puertos"
2. Seleccionar el puerto detectado
3. Click en "Conectar"

### 4. Probar el Sistema
1. Hacer pasar el tren por el sensor
2. Esperar mensaje: "✓ Tren detectado - inicio de medición"
3. Esperar a que complete la vuelta (> 5 segundos)
4. Ver resultados en Monitor Serial y en la interfaz web

## 📈 Interpretación de Resultados

### Ejemplo de Medición

**Entrada:**
- Tiempo medido: 5.2341 segundos
- Distancia: 3.33 metros (fija por estación)

**Salida calculada:**
- Estación alcanzada: 1
- Velocidad media: 0.6363 m/s
- Aceleración media: 0.2433 m/s²

### Significado de los Valores

| Parámetro | Valor | Interpretación |
|-----------|-------|----------------|
| Estación | 1, 2, 3... | Número de vueltas completadas (estaciones alcanzadas) |
| Tiempo | 5.23 s | Tiempo que tardó en llegar a la estación |
| Velocidad | 0.64 m/s | Velocidad promedio entre estaciones |
| Aceleración | 0.24 m/s² | Aceleración constante asumida |
| Distancia | 3.33 m | Longitud del circuito (distancia entre estaciones) |

## ⚙️ Parámetros Configurables

```cpp
// Cambiar distancia del circuito
const float DISTANCIA_RECORRIDO = 3.33; // metros

// Cambiar tiempo mínimo entre vueltas (5 segundos)
const unsigned long tiempoMinimoEntreVueltas = 5000000; // microsegundos

// Cambiar velocidad de comunicación serial
Serial.begin(9600); // baudios
```

## 🔍 Diagnóstico de Problemas

### El Arduino no se conecta
- ✓ Verificar que el cable USB esté bien conectado
- ✓ Verificar que el puerto COM sea el correcto
- ✓ Cerrar otras aplicaciones que usen el puerto serial

### No detecta el tren
- ✓ Verificar conexiones del sensor IR
- ✓ Verificar que el sensor tenga alimentación
- ✓ Ajustar sensibilidad del sensor

### Detecta vagones como vueltas
- ✓ Aumentar `tiempoMinimoEntreVueltas` en el código
- ✓ Verificar que el tren tarde > 5 segundos en dar la vuelta

## 🎓 Conceptos Físicos

### Ecuaciones Utilizadas

#### Movimiento Uniformemente Acelerado (MUA)
Asumiendo velocidad inicial (v₀) = 0:

**Posición:**
```
x = ½·a·t²
```

**Despejando aceleración:**
```
a = 2x / t²
```

**Velocidad media:**
```
v_promedio = distancia / tiempo
```

### Limitaciones del Modelo

⚠️ **Importante:** El modelo asume:
- Aceleración constante durante toda la vuelta
- Velocidad inicial = 0 (parte del reposo)
- Sin fricción ni resistencia del aire

En realidad, el tren puede tener velocidad variable, pero estos cálculos proporcionan valores promedio útiles para el análisis.
