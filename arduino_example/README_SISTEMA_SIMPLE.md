# 🔌 Sistema Arduino - Detección Salida/Llegada de Tren

## 🎯 Nuevo Sistema Simplificado

### Concepto
- **1ra detección** = 🚂 SALIDA del tren
- **2da detección** = 🚉 LLEGADA del tren  
- El servidor calcula automáticamente tiempo, distancia y velocidad

---

## 📋 Archivos Disponibles

### ✅ `train_detection_simple.ino` (RECOMENDADO)
**Sistema simplificado: Salida → Llegada**

- Código ultra simple (30 líneas)
- Solo detecta y envía eventos
- Cálculos en el servidor
- Más preciso y fácil de depurar

### `train_sensor.ino` (Referencia)
Sistema original con cálculos en Arduino

---

## 🚀 Código Recomendado

```cpp
const int SENSOR_PIN = 2;

void setup() {
  Serial.begin(9600);
  pinMode(SENSOR_PIN, INPUT);
  Serial.println("Sistema Iniciado");
}

void loop() {
  if (digitalRead(SENSOR_PIN) == LOW) {
    Serial.println("Sensor activado");
    
    while (digitalRead(SENSOR_PIN) == LOW) {
      delay(10);
    }
    delay(200);
  }
  delay(50);
}
```

---

## 🔧 Hardware

### Necesitas:
- Arduino Uno/Nano/Mega
- Sensor IR de proximidad
- Cables

### Conexiones:
```
Sensor IR → Arduino
VCC     → 5V
GND     → GND
OUT     → Pin 2
```

---

## 📊 Cómo Funciona

### Flujo del Sistema

```
PASO 1: Primera Detección
┌────────────────────────────┐
│ Objeto pasa por el sensor  │
│ Arduino: "Sensor activado" │
│ Servidor: SALIDA registrada│
│ Web: "🚂 Tren saliendo..." │
└────────────────────────────┘
         ⏱️ Cronómetro inicia
              ⬇️
PASO 2: Segunda Detección
┌────────────────────────────┐
│ Objeto pasa de nuevo       │
│ Arduino: "Sensor activado" │
│ Servidor: LLEGADA + cálculos│
│ Web: Muestra datos         │
└────────────────────────────┘
         ⏱️ Cronómetro para

RESULTADO EN LA WEB:
🚉 Estación 1
⏱️  Tiempo: 2.50 s
📏 Distancia: 3.20 m
🚄 Velocidad: 1.28 m/s
```

---

## 💻 Instalación

### 1. Cargar Código Arduino
1. Abre Arduino IDE
2. Abre `train_detection_simple.ino`
3. Selecciona tu placa (Arduino Uno)
4. Selecciona puerto COM
5. Sube el código ⬆️

### 2. Verificar
1. Abre Monitor Serial (9600 baud)
2. Verás: "Sistema Iniciado"
3. Pasa objeto por sensor
4. Verás: "Sensor activado"

### 3. Conectar al Servidor
1. **Cierra** el Monitor Serial (importante!)
2. Inicia servidor Node.js
3. Abre http://localhost:8080
4. Arduino se conecta automáticamente

---

## 🎮 Uso del Sistema

### Ejemplo Práctico

1. **Preparación**
   - Enciende Arduino y servidor
   - Abre la interfaz web
   - Verifica: "● Conectado" (verde)

2. **Primera Pasada** (Salida)
   - Pasa objeto por el sensor
   - La web muestra notificación naranja:
   - "🚂 Tren saliendo de Estación 0..."

3. **Segunda Pasada** (Llegada)
   - Pasa objeto nuevamente
   - La web muestra tarjeta con datos:
   - Tiempo, distancia, velocidad calculados

4. **Repetir**
   - Cada par de pasadas = 1 viaje completo
   - Los datos se acumulan en el historial

---

## 📐 Cálculos Automáticos

El servidor calcula automáticamente:

### Tiempo de Recorrido
```javascript
tiempo = llegada - salida  // en segundos
```

### Distancia
```javascript
distancia = 3.20 m  // fijo (configurable)
```

### Velocidad
```javascript
velocidad = distancia / tiempo  // m/s
```

**Ejemplo:**
- Tiempo: 2.50 segundos
- Distancia: 3.20 metros
- Velocidad: 3.20 / 2.50 = **1.28 m/s**

---

## 🐛 Solución de Problemas

### ❌ No detecta objetos
**Soluciones:**
- ✅ Verifica conexiones del sensor
- ✅ Comprueba LED del sensor se encienda
- ✅ Ajusta distancia objeto-sensor (2-10cm)
- ✅ Revisa que sea Pin 2

### ❌ Solo detecta salida
**Soluciones:**
- ✅ Pasa el objeto **dos veces**
- ✅ Espera 200ms entre pasadas
- ✅ Asegura que sensor se desactive entre pasadas

### ❌ No llegan datos al servidor
**Soluciones:**
- ✅ **CIERRA** Monitor Serial Arduino
- ✅ Verifica servidor esté corriendo
- ✅ Comprueba puerto COM correcto (COM3)
- ✅ Reinicia servidor

### ❌ Puerto ocupado
**Soluciones:**
- ✅ Cierra Arduino IDE Monitor Serial
- ✅ Cierra otros programas usando puerto
- ✅ Desconecta y reconecta USB

---

## ⚙️ Configuración

### Cambiar Distancia
**Archivo:** `backend/src/arduino.js`
```javascript
// Línea ~170
this.calculatedDistance = 3.20;  // Cambia aquí
```

### Cambiar Puerto COM
**En la interfaz web:**
- Panel Arduino → Selector de puerto
- Elige tu puerto (COM1, COM2, COM3...)

### Cambiar Baud Rate
**Solo si es necesario:**

Arduino:
```cpp
Serial.begin(9600);  // Cambiar aquí
```

Web:
- Panel Arduino → Selector baud rate

---

## 📊 Datos Mostrados

### En la Interfaz Web

**Panel Central:**
- Tarjetas grandes con datos de cada llegada
- Tiempo de recorrido
- Distancia recorrida
- Velocidad promedio

**Panel Derecho:**
- Estado actual (tiempo, posición, velocidad)
- Datos Arduino en tiempo real
- Historial de todas las estaciones

**Notificaciones:**
- Salida: Mensaje naranja con flecha →
- Llegada: Tarjeta verde con todos los datos

---

## 🎓 Entendiendo el Código

### Arduino (Simple)
```cpp
// Detecta cuando hay objeto
if (digitalRead(SENSOR_PIN) == LOW) {
    Serial.println("Sensor activado");  // Envía evento
    
    // Espera a que pase
    while (digitalRead(SENSOR_PIN) == LOW) delay(10);
    
    delay(200);  // Anti-rebote
}
```

### Servidor (arduino.js)
```javascript
// Cuenta detecciones
if (line.includes('Sensor activado')) {
    this.detectionCount++;
    
    if (this.detectionCount === 1) {
        // SALIDA - guardar tiempo
        this.departureTime = Date.now();
    } 
    else if (this.detectionCount === 2) {
        // LLEGADA - calcular todo
        this.arrivalTime = Date.now();
        this.travelTime = (arrivalTime - departureTime) / 1000;
        this.velocity = 3.20 / this.travelTime;
        
        // Resetear para siguiente viaje
        this.detectionCount = 0;
    }
}
```

---

## 📝 Notas Importantes

1. **Distancia Fija**: 3.20m (modificable en código servidor)
2. **Baud Rate**: 9600 obligatorio
3. **Puerto**: Usualmente COM3 en Windows
4. **Monitor Serial**: Debe estar CERRADO
5. **Contador**: Se resetea automáticamente

---

## 🔄 Ventajas vs Sistema Original

| Aspecto | Nuevo (Simple) | Original |
|---------|----------------|----------|
| **Código Arduino** | 30 líneas | 150+ líneas |
| **Complejidad** | Muy simple | Compleja |
| **Cálculos** | Servidor | Arduino |
| **Precisión** | Alta (milisegundos) | Media |
| **Debug** | Muy fácil | Difícil |
| **Recomendado** | ✅ **SÍ** | Solo referencia |

---

## 💡 Tips y Trucos

1. **Objetos Oscuros**: Funcionan mejor con sensores IR
2. **Velocidad**: Pasa rápido para velocidades altas
3. **Precisión**: Mantén distancia sensor constante
4. **Múltiples Estaciones**: Sigue pasando objetos
5. **Resetear**: Recarga la página web

---

## 🔗 Ver También

- `INSTRUCCIONES_USO.md` - Guía completa del sistema
- `README.md` - Información general del proyecto
- Interfaz Web: http://localhost:8080

---

**¿Problemas?** Revisa los logs del servidor y la consola del navegador.
