# Integración con Arduino - Simulador de Tren

Este documento explica cómo conectar y usar un Arduino para enviar datos reales de tiempo, velocidad, aceleración y distancia al simulador de tren.

## 📋 Requisitos

### Hardware
- Arduino (Uno, Mega, Nano, etc.)
- Cable USB para conectar Arduino a la computadora
- Sensores opcionales:
  - Encoder rotativo o sensor de velocidad
  - Acelerómetro (MPU6050, ADXL345, etc.)
  - Sensor de distancia o encoder de rueda

### Software
- Arduino IDE instalado
- Node.js y dependencias del proyecto instaladas
- Drivers USB para Arduino (CH340, FTDI, etc.)

## 🚀 Configuración Rápida

### 1. Programar el Arduino

1. Abre Arduino IDE
2. Abre el archivo `arduino_example/train_sensor.ino`
3. Ajusta los parámetros según tu hardware:
   ```cpp
   const int VELOCITY_SENSOR_PIN = A0;  // Pin del sensor de velocidad
   const int ACCEL_SENSOR_PIN = A1;     // Pin del acelerómetro
   const int DISTANCE_SENSOR_PIN = A2;  // Pin del sensor de distancia
   ```
4. Selecciona tu placa y puerto en Arduino IDE
5. Sube el código al Arduino

### 2. Instalar Dependencias

```bash
cd backend
npm install
```

Las nuevas dependencias incluyen:
- `serialport`: Para comunicación serial con Arduino
- `@serialport/parser-readline`: Para parsear datos línea por línea

### 3. Iniciar el Servidor

```bash
cd backend
npm start
```

El servidor se iniciará en `http://localhost:8080`

### 4. Conectar Arduino desde la Interfaz Web

1. Abre el navegador en `http://localhost:8080`
2. En el panel "Conexión Arduino":
   - Haz clic en **"Actualizar Puertos"** para buscar puertos disponibles
   - Selecciona el puerto de tu Arduino (o deja en "Auto-detectar")
   - Selecciona la velocidad (baud rate): 9600 o 115200
   - Haz clic en **"Conectar"**

## 📊 Formatos de Datos Soportados

El sistema acepta dos formatos de datos desde Arduino:

### Formato 1: JSON (Recomendado)
```json
{"time":123.45,"velocity":10.5,"acceleration":2.3,"distance":500.0}
```

**Ventajas:**
- Fácil de extender con nuevos campos
- Menos propenso a errores de parseo
- Estándar y legible

### Formato 2: Clave:Valor
```
TIME:123.45,VEL:10.5,ACC:2.3,DIST:500.0
```

**Ventajas:**
- Más compacto
- Menor overhead
- Más rápido de transmitir

## 🔧 Configuración de Sensores

### Sensor de Velocidad

**Opción 1: Encoder Rotativo**
```cpp
volatile long encoderCount = 0;
const float WHEEL_CIRCUMFERENCE = 0.5; // metros

void setup() {
  attachInterrupt(digitalPinToInterrupt(2), encoderISR, RISING);
}

void encoderISR() {
  encoderCount++;
}

float calculateVelocity() {
  float distance = encoderCount * WHEEL_CIRCUMFERENCE;
  float velocity = distance / currentTime;
  return velocity;
}
```

**Opción 2: Sensor de Efecto Hall**
```cpp
const int HALL_SENSOR_PIN = 2;
unsigned long lastPulseTime = 0;
float velocity = 0.0;

void setup() {
  attachInterrupt(digitalPinToInterrupt(HALL_SENSOR_PIN), hallISR, FALLING);
}

void hallISR() {
  unsigned long currentMillis = millis();
  float timeBetweenPulses = (currentMillis - lastPulseTime) / 1000.0;
  velocity = WHEEL_CIRCUMFERENCE / timeBetweenPulses;
  lastPulseTime = currentMillis;
}
```

### Acelerómetro MPU6050

```cpp
#include <Wire.h>
#include <MPU6050.h>

MPU6050 mpu;

void setup() {
  Wire.begin();
  mpu.initialize();
}

float readAcceleration() {
  int16_t ax, ay, az;
  mpu.getAcceleration(&ax, &ay, &az);
  
  // Convertir a m/s² (ajustar según calibración)
  float accel = (ax / 16384.0) * 9.81;
  return accel;
}
```

## 📡 Protocolo de Comunicación

### Comandos que Arduino puede recibir (futuro)
```
START     - Iniciar medición
STOP      - Detener medición
RESET     - Resetear contadores
CALIBRATE - Modo de calibración
```

### Respuestas esperadas del Arduino

**Al conectar:**
```
Arduino Train Sensor initialized
```

**Durante operación (cada 50ms):**
```json
{"time":0.05,"velocity":0.1,"acceleration":2.0,"distance":0.0025}
{"time":0.10,"velocity":0.2,"acceleration":2.0,"distance":0.0075}
{"time":0.15,"velocity":0.3,"acceleration":2.0,"distance":0.0150}
...
```

## 🎯 Ejemplo de Uso Completo

### 1. Modo Simulación (sin sensores reales)

El código de ejemplo incluye una simulación que genera datos realistas:

```cpp
float readVelocitySensor() {
  // Simula aceleración constante
  float simulatedVelocity = velocity + acceleration * 0.05;
  if (simulatedVelocity > 50.0) simulatedVelocity = 50.0;
  return simulatedVelocity;
}
```

### 2. Con Sensores Reales

Modifica las funciones `readVelocitySensor()`, `readAccelerationSensor()` y `readDistanceSensor()` según tu hardware.

## 🔍 Depuración

### Ver datos en Serial Monitor

1. Abre Arduino IDE
2. Herramientas → Monitor Serial
3. Configura baud rate a 9600
4. Observa los datos enviados

### Verificar conexión en el servidor

El servidor muestra logs cuando recibe datos:
```
✅ Conectado a Arduino en COM3 @ 9600 baud
```

### Panel de depuración en la web

Los datos recibidos se muestran en tiempo real en el panel "Datos en Tiempo Real del Arduino".

## ⚙️ Configuración Avanzada

### Cambiar frecuencia de muestreo

En Arduino:
```cpp
const unsigned long SEND_INTERVAL = 50; // 50ms = 20Hz
```

Menor intervalo = más datos pero mayor carga de procesamiento.

### Usar baud rate más alto

Para transmisión más rápida:

**En Arduino:**
```cpp
Serial.begin(115200);
```

**En la interfaz web:**
- Selecciona 115200 en el dropdown de velocidad

### Formato personalizado

Puedes extender el formato JSON con campos adicionales:

```cpp
void sendDataJSON() {
  Serial.print("{\"time\":");
  Serial.print(currentTime, 2);
  Serial.print(",\"velocity\":");
  Serial.print(velocity, 2);
  Serial.print(",\"acceleration\":");
  Serial.print(acceleration, 2);
  Serial.print(",\"distance\":");
  Serial.print(distance, 1);
  Serial.print(",\"temperature\":");
  Serial.print(temperature, 1);
  Serial.print(",\"battery\":");
  Serial.print(batteryLevel, 1);
  Serial.println("}");
}
```

El servidor parseará automáticamente los campos conocidos (time, velocity, acceleration, distance).

## 🐛 Solución de Problemas

### Arduino no detectado

1. **Verificar drivers USB:**
   - Windows: Instalar drivers CH340 o FTDI según el chip USB
   - Linux: Agregar usuario al grupo `dialout`
   - Mac: Generalmente no requiere drivers adicionales

2. **Verificar puerto:**
   - Windows: Revisar en Administrador de Dispositivos
   - Linux: `ls /dev/ttyUSB* /dev/ttyACM*`
   - Mac: `ls /dev/tty.*`

3. **Permisos (Linux):**
   ```bash
   sudo usermod -a -G dialout $USER
   # Reiniciar sesión después
   ```

### Sin datos o datos incorrectos

1. **Verificar baud rate:** Debe coincidir entre Arduino y configuración web
2. **Verificar formato:** Asegúrate de que Arduino envía JSON o clave:valor correctamente
3. **Ver Serial Monitor:** Confirma que Arduino está enviando datos
4. **Revisar logs del servidor:** Buscar errores de parseo

### Conexión se pierde

1. **Cable USB:** Usar cable de datos (no solo carga)
2. **Alimentación:** Asegúrar alimentación estable del Arduino
3. **Interferencia:** Alejar de fuentes de interferencia electromagnética

## 📚 Recursos Adicionales

- [Arduino Reference](https://www.arduino.cc/reference/en/)
- [SerialPort Node.js](https://serialport.io/docs/)
- [MPU6050 Library](https://github.com/jrowberg/i2cdevlib/tree/master/Arduino/MPU6050)
- [Encoder Library](https://www.pjrc.com/teensy/td_libs_Encoder.html)

## 💡 Ideas para Expansión

1. **Múltiples Trenes:** Conectar varios Arduinos con IDs únicos
2. **Control Bidireccional:** Enviar comandos de control al Arduino
3. **Grabación de Datos:** Guardar datos en SD card en el Arduino
4. **Telemetría Inalámbrica:** Usar Bluetooth o WiFi (ESP32)
5. **Visualización 3D:** Agregar orientación con giroscopio
6. **Detección de Obstáculos:** Integrar sensores ultrasónicos
7. **GPS:** Añadir posicionamiento GPS para trenes reales

## 📝 Notas Finales

- La simulación y datos reales pueden usarse simultáneamente para comparación
- Los gráficos se actualizan automáticamente con los datos del Arduino
- El sistema detecta automáticamente cruces de estaciones basándose en la distancia
- Todos los cálculos de tiempo de llegada se ajustan dinámicamente según los datos reales

---

**¿Preguntas o problemas?** Abre un issue en el repositorio del proyecto.
