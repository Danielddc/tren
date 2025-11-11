/**
 * Servidor principal para simulación de tren
 * Combina servidor HTTP (Express) con WebSocket para comunicación en tiempo real
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const cors = require('cors');

const TrainWebSocketHandler = require('./websocket');

class TrainSimulationServer {
    constructor(port = 8080) {
        this.port = port;
        this.app = express();
        this.server = http.createServer(this.app);
        
        this.setupExpress();
        this.setupWebSocket();
        this.setupGracefulShutdown();
    }

    setupExpress() {
        // Middleware
        this.app.use(cors({
            origin: '*',
            methods: ['GET', 'POST'],
            allowedHeaders: ['Content-Type']
        }));
        
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, '../../frontend')));

        // Rutas API
        this.app.get('/api/status', (req, res) => {
            res.json({
                status: 'running',
                timestamp: new Date().toISOString(),
                connections: this.wsHandler.clients.size,
                hasActiveSimulation: this.wsHandler.trainSimulation !== null
            });
        });

        this.app.get('/api/simulation/state', (req, res) => {
            if (this.wsHandler.trainSimulation) {
                res.json({
                    state: this.wsHandler.trainSimulation.getState(),
                    arrivalTimes: this.wsHandler.trainSimulation.calculateAllArrivalTimes()
                });
            } else {
                res.json({ message: 'No active simulation' });
            }
        });

        // Endpoint de depuración: inyectar evento de llegada a estación (solo para pruebas locales)
        this.app.post('/api/debug/stationReached', (req, res) => {
            try {
                const payload = req.body;
                if (!payload || typeof payload !== 'object') {
                    return res.status(400).json({ error: 'Payload inválido' });
                }

                // Normalizar campos mínimos esperados
                const stationEvent = {
                    stationIndex: payload.stationIndex ?? payload.station ?? 0,
                    stationName: payload.stationName || `Estación ${payload.stationIndex ?? payload.station ?? 0}`,
                    arrivalTime: payload.arrivalTime || Date.now() / 1000,
                    travelTime: payload.travelTime || payload.time || 0,
                    distance: payload.distance || payload.position || 3.33,
                    velocity: payload.velocity || 0,
                    acceleration: payload.acceleration || 0,
                    position: payload.position || payload.distance || (payload.stationIndex ?? 0) * (payload.distance || 3.33),
                    time: payload.time || payload.travelTime || 0
                };

                // Enviar a todos los clientes
                if (this.wsHandler) {
                    this.wsHandler.broadcastMessage('stationReached', stationEvent);
                    this.wsHandler.broadcastUpdate({
                        time: stationEvent.time,
                        position: stationEvent.position,
                        velocity: stationEvent.velocity,
                        acceleration: stationEvent.acceleration,
                        fromArduino: false,
                        stationEvent: stationEvent,
                        isFinished: false
                    });
                }

                return res.json({ ok: true, stationEvent });
            } catch (err) {
                console.error('Error en /api/debug/stationReached:', err);
                return res.status(500).json({ error: err.message });
            }
        });

        // Ruta principal - servir el frontend
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../../frontend/index.html'));
        });

        // Manejo de rutas no encontradas
        this.app.use((req, res) => {
            res.status(404).json({ error: 'Ruta no encontrada' });
        });

        // Manejo de errores
        this.app.use((error, req, res, next) => {
            console.error('Error en servidor:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        });
    }

    setupWebSocket() {
        // Crear servidor WebSocket
        this.wss = new WebSocket.Server({ 
            server: this.server,
            path: '/ws'
        });

        // Inicializar manejador de WebSocket
        this.wsHandler = new TrainWebSocketHandler(this.wss);

        console.log('Servidor WebSocket configurado en /ws');
    }

    setupGracefulShutdown() {
        const shutdown = (signal) => {
            console.log(`\nRecibida señal ${signal}. Cerrando servidor...`);
            
            // Limpiar WebSocket handler
            if (this.wsHandler) {
                this.wsHandler.cleanup();
            }

            // Cerrar servidor WebSocket
            if (this.wss) {
                this.wss.close(() => {
                    console.log('Servidor WebSocket cerrado');
                });
            }

            // Cerrar servidor HTTP
            this.server.close(() => {
                console.log('Servidor HTTP cerrado');
                process.exit(0);
            });

            // Forzar cierre después de 10 segundos
            setTimeout(() => {
                console.log('Forzando cierre del servidor');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
    }

    start() {
        return new Promise((resolve) => {
            this.server.listen(this.port, () => {
                console.log(`🚂 Servidor de simulación de tren ejecutándose:`);
                console.log(`   HTTP: http://localhost:${this.port}`);
                console.log(`   WebSocket: ws://localhost:${this.port}/ws`);
                console.log(`   Frontend: http://localhost:${this.port}/`);
                console.log(`   API Status: http://localhost:${this.port}/api/status`);
                console.log('\nPresiona Ctrl+C para detener el servidor\n');
                resolve();
            });
        });
    }
}

// Iniciar servidor si este archivo se ejecuta directamente
if (require.main === module) {
    const server = new TrainSimulationServer(process.env.PORT || 8080);
    
    server.start().catch((error) => {
        console.error('Error iniciando servidor:', error);
        process.exit(1);
    });
}

module.exports = TrainSimulationServer;