# 🚂 Simulador de Tren - Tiempo Real

[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![WebSocket](https://img.shields.io/badge/WebSocket-000000?style=for-the-badge&logo=websocket&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
[![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chart.js&logoColor=white)](https://www.chartjs.org/)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)

Simulación física de tren en tiempo real con interfaz glassmorphism, control de aceleración interactivo y visualización de gráficas dinámicas.

## ✨ Características Principales

- 🎮 **Control en Tiempo Real** - Ajusta la aceleración mientras la simulación está en ejecución
- 📊 **Gráficas Dinámicas** - Velocidad, posición y aceleración actualizándose en vivo
- 🏷️ **Estaciones Personalizadas** - Nombres personalizados y generador automático de ciudades
- ⏰ **Tiempos Estimados** - Cálculo analítico de tiempos de llegada a cada estación
- 🌐 **WebSocket** - Comunicación bidireccional de baja latencia
- 🎨 **Glassmorphism UI** - Interfaz moderna con efectos de vidrio esmerilado
- 🧮 **Física Precisa** - Motor basado en ecuaciones cinemáticas reales

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

## 🎯 Demo

![Train Simulator Demo](https://via.placeholder.com/800x400/667eea/FFFFFF?text=🚂+Train+Simulator+Demo)

## 🎮 Controles

- **Barra Espaciadora**: Iniciar/Pausar simulación
- **Escape**: Detener simulación
- **Slider**: Cambiar aceleración en tiempo real
- **Botón "Generar Nombres"**: Crear nombres aleatorios de ciudades españolas

## 🎨 Capturas de Pantalla

### Panel de Configuración
- Interfaz glassmorphism elegante
- Controles intuitivos para todos los parámetros
- Validación en tiempo real

### Gráficas en Tiempo Real
- Velocidad vs Tiempo (verde)
- Posición vs Tiempo (azul)
- Aceleración vs Tiempo (rojo)

### Estaciones Personalizadas
- Nombres personalizables
- Tiempos de llegada estimados
- Log de eventos en tiempo real

## 🔧 Tecnologías Utilizadas

### Backend
- **Node.js** - Servidor principal
- **Express.js** - Framework web
- **WebSocket (ws)** - Comunicación en tiempo real
- **CORS** - Configuración de acceso

### Frontend
- **HTML5** - Estructura
- **CSS3** - Estilos glassmorphism
- **Vanilla JavaScript** - Lógica del cliente
- **Chart.js** - Gráficas interactivas
- **Font Awesome** - Iconografía

## 🚀 Próximas Características

- [ ] Múltiples trenes simultáneos
- [ ] Mapas visuales de rutas
- [ ] Exportación de datos a CSV
- [ ] Control automático (PID)
- [ ] Efectos de sonido
- [ ] Modo offline
- [ ] Responsive mobile

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 👨‍💻 Autor

**Tu Nombre**
- GitHub: [@tu-usuario](https://github.com/tu-usuario)
- Email: tu-email@ejemplo.com

## ⭐ ¿Te gustó el proyecto?

¡Dale una estrella en GitHub si te pareció útil!