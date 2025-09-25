# Simulador de Tren - Tiempo Real

Simulación física de tren con control de aceleración en tiempo real y visualización de gráficas interactivas.

## 🚂 Características

- **Simulación física en tiempo real** usando ecuaciones cinemáticas
- **Control interactivo** de aceleración mientras la simulación está en ejecución
- **Gráficas en vivo**: velocidad, posición y aceleración vs tiempo
- **Detección de estaciones** con cálculo preciso de tiempos de llegada
- **Comunicación bidireccional** vía WebSocket para baja latencia

## 📁 Estructura del Proyecto

```
TREN/
├── backend/           # Servidor Node.js con WebSocket
│   ├── src/
│   │   ├── server.js         # Servidor principal
│   │   ├── physics.js        # Motor de física cinemática
│   │   └── websocket.js      # Manejo de WebSocket
│   └── package.json
├── frontend/          # Cliente web
│   ├── index.html           # Interfaz principal
│   ├── css/
│   │   └── styles.css       # Estilos
│   └── js/
│       ├── app.js           # Lógica principal del cliente
│       ├── charts.js        # Manejo de gráficas
│       └── websocket.js     # Cliente WebSocket
├── docs/              # Documentación
└── README.md
```

## 🔧 Configuración

### Prerrequisitos
- Node.js (v14 o superior)
- Navegador web moderno

### Instalación
```bash
cd backend
npm install
npm start
```

### Uso
1. Abrir `frontend/index.html` en el navegador
2. Configurar parámetros iniciales
3. Hacer clic en "Iniciar Simulación"
4. Usar el slider para cambiar aceleración en tiempo real

## 📊 Parámetros de Entrada

- **Velocidad inicial** (m/s)
- **Número de estaciones**
- **Distancia entre estaciones** (m) 
- **Aceleración inicial** (m/s²)
- **Paso de simulación** (dt) - opcional

## 🎯 Salidas

- **Tiempos de llegada** a cada estación
- **Gráficas en tiempo real**:
  - Velocidad vs Tiempo
  - Posición vs Tiempo  
  - Aceleración vs Tiempo
- **Log de eventos** (estaciones alcanzadas)

## 🧮 Modelo Físico

Utiliza ecuaciones cinemáticas básicas:
- Posición: `x(t) = v₀·t + ½·a·t²`
- Velocidad: `v(t) = v₀ + a·t`

Con detección precisa de estaciones mediante interpolación lineal.