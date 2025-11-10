/**
 * Sistema de medición de tren con sensor IR
 * 
 * Mide el tiempo de vuelta completa del tren y calcula:
 * - Velocidad media (m/s)
 * - Aceleración media (m/s²)
 * - Distancia de recorrido: 3.33 metros
 * 
 * El tren tiene 2 vagones, ignora detecciones < 5 segundos
 * para medir solo vueltas completas del tren.
 * 
 * IMPORTANTE: Cada vuelta completada = 1 estación alcanzada
 * Vuelta 1 → Estación 1
 * Vuelta 2 → Estación 2
 * Vuelta 3 → Estación 3
 * etc.
 */

volatile unsigned long tiempoPrimeraVuelta = 0;
volatile unsigned long tiempoSegundaVuelta = 0;
volatile bool primeraVueltaRegistrada = false;
volatile bool medicionCompletada = false;

unsigned long ultimoEvento = 0;
const unsigned long tiempoMinimoEntreVueltas = 5000000; // 5 segundos en microsegundos
int contadorVueltas = 0;

const float DISTANCIA_RECORRIDO = 3.33; // Distancia fija en metros

void setup() {
  Serial.begin(9600);
  pinMode(2, INPUT); // Sensor IR en pin 2 (INT0)
  attachInterrupt(digitalPinToInterrupt(2), sensorDetectado, RISING);

  Serial.println("=== Sistema de medición de tren ===");
  Serial.print("Distancia de recorrido: ");
  Serial.print(DISTANCIA_RECORRIDO);
  Serial.println(" m");
  Serial.println("Cada vuelta = 1 estación alcanzada");
  Serial.println("Esperando paso del tren a la primera estación...");
}

void loop() {
  if (medicionCompletada) {
    contadorVueltas++; // Cada vuelta = 1 estación

    // Calcular tiempo de recorrido
    unsigned long deltaT = tiempoSegundaVuelta - tiempoPrimeraVuelta; // microsegundos
    float tiempo = deltaT / 1000000.0; // segundos

    // Calcular velocidad media: v = d / t
    float velocidad = DISTANCIA_RECORRIDO / tiempo; // m/s
    
    // Calcular aceleración media (asumiendo velocidad inicial = 0)
    // Usando cinemática: d = 0.5 * a * t²  =>  a = 2d / t²
    float aceleracion = (2.0 * DISTANCIA_RECORRIDO) / (tiempo * tiempo); // m/s²

    // Mostrar resultados en formato legible
    Serial.println("\n--- RESULTADOS ---");
    Serial.print("Estación alcanzada: "); 
    Serial.println(contadorVueltas);
    Serial.print("Tiempo de recorrido: "); 
    Serial.print(tiempo, 4); 
    Serial.println(" s");
    Serial.print("Distancia: "); 
    Serial.print(DISTANCIA_RECORRIDO, 2); 
    Serial.println(" m");
    Serial.print("Velocidad media: "); 
    Serial.print(velocidad, 4); 
    Serial.println(" m/s");
    Serial.print("Aceleración media: "); 
    Serial.print(aceleracion, 4); 
    Serial.println(" m/s²");
    Serial.println("-------------------\n");

    // Enviar datos en formato JSON para el backend
    // "station" indica el número de estación alcanzada
    Serial.print("{\"station\":");
    Serial.print(contadorVueltas);
    Serial.print(",\"time\":");
    Serial.print(tiempo, 4);
    Serial.print(",\"distance\":");
    Serial.print(DISTANCIA_RECORRIDO, 2);
    Serial.print(",\"velocity\":");
    Serial.print(velocidad, 4);
    Serial.print(",\"acceleration\":");
    Serial.print(aceleracion, 4);
    Serial.println("}");

    // Preparar para la siguiente vuelta/estación
    tiempoPrimeraVuelta = tiempoSegundaVuelta;
    medicionCompletada = false;

    Serial.print("Esperando llegada a estación ");
    Serial.print(contadorVueltas + 1);
    Serial.println("...");
  }
}

void sensorDetectado() {
  unsigned long ahora = micros();

  // Calcular tiempo desde el último evento válido
  unsigned long diferencia = ahora - ultimoEvento;

  // Ignorar detecciones menores a 5 segundos (son vagones del mismo tren)
  if (diferencia < tiempoMinimoEntreVueltas) {
    Serial.print("✗ Detección ignorada (vagón, ");
    Serial.print(diferencia / 1000000.0, 2);
    Serial.println(" s < 5 s)");
    return;
  }

  // Detección válida: es el tren pasando nuevamente
  if (!primeraVueltaRegistrada) {
    // Primera vez que pasa el tren - salida hacia estación 1
    tiempoPrimeraVuelta = ahora;
    primeraVueltaRegistrada = true;
    ultimoEvento = ahora;
    Serial.println("✓ Tren detectado - salida hacia estación 1");
  } else {
    // Segunda vez que pasa el tren (completó una vuelta = llegada a estación)
    tiempoSegundaVuelta = ahora;
    medicionCompletada = true;
    ultimoEvento = ahora;
    Serial.println("✓ Tren detectado - llegada a estación");
  }
}
