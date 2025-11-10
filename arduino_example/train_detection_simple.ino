/*
 * Sistema de Detección de Tren Simplificado
 * 
 * LÓGICA:
 * - 1ra detección del sensor = SALIDA del tren
 * - 2da detección del sensor = LLEGADA del tren
 * - El servidor calcula automáticamente:
 *   * Tiempo de recorrido (diferencia entre llegada y salida)
 *   * Distancia (fija: 3.20m)
 *   * Velocidad (distancia / tiempo)
 */

const int SENSOR_PIN = 2;  // Pin del sensor IR

void setup() {
  Serial.begin(9600);
  pinMode(SENSOR_PIN, INPUT);
  
  Serial.println("Sistema de Detección de Tren Iniciado");
  Serial.println("Esperando detecciones...");
}

void loop() {
  int sensorValue = digitalRead(SENSOR_PIN);
  
  // Si el sensor detecta un objeto
  if (sensorValue == LOW) {  // LOW = objeto detectado (sensor IR activo)
    
    // Enviar evento de detección al servidor
    Serial.println("Sensor activado");
    
    // Esperar a que el objeto pase completamente
    while (digitalRead(SENSOR_PIN) == LOW) {
      delay(10);
    }
    
    // Pequeña pausa para evitar rebotes
    delay(200);
  }
  
  delay(50);  // Pequeño delay para estabilidad
}

/*
 * CÓMO FUNCIONA:
 * 
 * 1. Cada vez que el sensor detecta algo, envía: "Sensor activado"
 * 2. El servidor cuenta las detecciones:
 *    - Detección 1 = Salida (registra tiempo de salida)
 *    - Detección 2 = Llegada (calcula tiempo, distancia, velocidad)
 * 3. Después de la 2da detección, el contador se resetea para el siguiente viaje
 * 
 * EJEMPLO DE FLUJO:
 * - Pasa objeto por el sensor -> "Sensor activado" (SALIDA registrada)
 * - Pasa objeto de nuevo -> "Sensor activado" (LLEGADA registrada, datos calculados)
 * - El servidor muestra:
 *   * Tiempo de recorrido: X segundos
 *   * Distancia: 3.20 m
 *   * Velocidad: Y m/s
 */
