/**
 * Manejador de WebSocket para comunicación en tiempo real
 */

const WebSocket = require('ws');
const TrainPhysics = require('./physics');

class TrainWebSocketHandler {
    constructor(wss) {
        this.wss = wss;
        this.trainSimulation = null;
        this.simulationInterval = null;
        this.clients = new Set();
        
        this.setupWebSocketHandlers();
    }

    setupWebSocketHandlers() {
        this.wss.on('connection', (ws) => {
            console.log('Cliente conectado');
            this.clients.add(ws);

            // Configurar manejadores de mensajes
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleMessage(ws, data);
                } catch (error) {
                    console.error('Error procesando mensaje:', error);
                    this.sendError(ws, 'Mensaje inválido');
                }
            });

            // Manejar desconexión
            ws.on('close', () => {
                console.log('Cliente desconectado');
                this.clients.delete(ws);
                
                // Si no quedan clientes, detener simulación
                if (this.clients.size === 0 && this.trainSimulation) {
                    this.stopSimulation();
                }
            });

            // Enviar estado inicial si hay simulación activa
            if (this.trainSimulation) {
                this.sendUpdate(ws, this.trainSimulation.getState());
            }
        });
    }

    handleMessage(ws, data) {
        const { type, payload } = data;

        switch (type) {
            case 'start':
                this.startSimulation(payload);
                break;
                
            case 'pause':
                this.pauseSimulation();
                break;
                
            case 'resume':
                this.resumeSimulation();
                break;
                
            case 'stop':
                this.stopSimulation();
                break;
                
            case 'setAcceleration':
                this.setAcceleration(payload.acceleration);
                break;
                
            case 'setStationNames':
                this.setStationNames(payload.stationNames);
                break;
                
            case 'getArrivalTimes':
                this.sendArrivalTimes(ws);
                break;
                
            case 'getState':
                this.sendCurrentState(ws);
                break;
                
            default:
                this.sendError(ws, `Tipo de mensaje desconocido: ${type}`);
        }
    }

    startSimulation(params) {
        // Detener simulación existente si existe
        this.stopSimulation();

        // Validar parámetros
        const validatedParams = this.validateSimulationParams(params);
        if (!validatedParams.valid) {
            this.broadcastError(validatedParams.error);
            return;
        }

        // Crear nueva simulación
        this.trainSimulation = new TrainPhysics(validatedParams.params);
        this.trainSimulation.start();

        // Iniciar bucle de simulación
        this.simulationInterval = setInterval(() => {
            const result = this.trainSimulation.step();
            
            if (result) {
                this.broadcastUpdate(result);
                
                // Si la simulación terminó, detenerla
                if (result.isFinished) {
                    this.stopSimulation();
                    this.broadcastMessage('simulationComplete', {
                        message: 'Simulación completada - todas las estaciones alcanzadas',
                        finalState: this.trainSimulation.getState()
                    });
                }
            }
        }, validatedParams.params.timeStep * 1000); // Convertir a milisegundos

        console.log('Simulación iniciada');
        this.broadcastMessage('simulationStarted', {
            message: 'Simulación iniciada',
            initialState: this.trainSimulation.getState()
        });
    }

    pauseSimulation() {
        if (this.trainSimulation) {
            this.trainSimulation.pause();
            console.log('Simulación pausada');
            this.broadcastMessage('simulationPaused', {
                message: 'Simulación pausada',
                state: this.trainSimulation.getState()
            });
        }
    }

    resumeSimulation() {
        if (this.trainSimulation) {
            this.trainSimulation.start();
            console.log('Simulación reanudada');
            this.broadcastMessage('simulationResumed', {
                message: 'Simulación reanudada',
                state: this.trainSimulation.getState()
            });
        }
    }

    stopSimulation() {
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
            this.simulationInterval = null;
        }

        if (this.trainSimulation) {
            this.trainSimulation.stop();
            console.log('Simulación detenida');
            this.broadcastMessage('simulationStopped', {
                message: 'Simulación detenida y reiniciada'
            });
        }
    }

    setAcceleration(acceleration) {
        if (this.trainSimulation && this.trainSimulation.isRunning) {
            this.trainSimulation.setAcceleration(acceleration);
            
            // Notificar cambio de aceleración
            this.broadcastMessage('accelerationChanged', {
                acceleration: this.trainSimulation.a,
                time: this.trainSimulation.t
            });
        }
    }

    setStationNames(stationNames) {
        if (this.trainSimulation && Array.isArray(stationNames)) {
            this.trainSimulation.setStationNames(stationNames);
            
            this.broadcastMessage('stationNamesUpdated', {
                stationNames: this.trainSimulation.stationNames,
                message: 'Nombres de estaciones actualizados'
            });
        }
    }

    sendArrivalTimes(ws) {
        if (this.trainSimulation) {
            const arrivalTimes = this.trainSimulation.calculateAllArrivalTimes();
            this.sendMessage(ws, 'arrivalTimes', { arrivalTimes });
        }
    }

    validateSimulationParams(params) {
        const defaults = {
            initialVelocity: 0,
            acceleration: 1,
            timeStep: 0.05,
            stationDistance: 1000,
            numStations: 5
        };

        // Aplicar valores por defecto
        const validatedParams = { ...defaults, ...params };

        // Validar nombres de estaciones si se proporcionan
        if (validatedParams.stationNames && Array.isArray(validatedParams.stationNames)) {
            if (validatedParams.stationNames.length < validatedParams.numStations) {
                // Completar con nombres por defecto si faltan
                for (let i = validatedParams.stationNames.length; i < validatedParams.numStations; i++) {
                    validatedParams.stationNames.push(`Estación ${i + 1}`);
                }
            }
        }

        // Validaciones
        if (validatedParams.timeStep <= 0 || validatedParams.timeStep > 1) {
            return { valid: false, error: 'Paso de tiempo debe estar entre 0 y 1 segundo' };
        }

        if (validatedParams.stationDistance <= 0) {
            return { valid: false, error: 'Distancia entre estaciones debe ser positiva' };
        }

        if (validatedParams.numStations <= 0 || validatedParams.numStations > 20) {
            return { valid: false, error: 'Número de estaciones debe estar entre 1 y 20' };
        }

        if (Math.abs(validatedParams.acceleration) > 20) {
            return { valid: false, error: 'Aceleración debe estar entre -20 y 20 m/s²' };
        }

        if (Math.abs(validatedParams.initialVelocity) > 150) {
            return { valid: false, error: 'Velocidad inicial debe estar entre -150 y 150 m/s' };
        }

        return { valid: true, params: validatedParams };
    }

    sendCurrentState(ws) {
        if (this.trainSimulation) {
            this.sendUpdate(ws, this.trainSimulation.getState());
        } else {
            this.sendMessage(ws, 'noSimulation', {
                message: 'No hay simulación activa'
            });
        }
    }

    // Métodos de comunicación
    broadcastUpdate(updateData) {
        const message = {
            type: 'update',
            payload: updateData,
            timestamp: Date.now()
        };

        this.broadcast(message);
    }

    broadcastMessage(type, payload) {
        const message = {
            type,
            payload,
            timestamp: Date.now()
        };

        this.broadcast(message);
    }

    broadcastError(error) {
        const message = {
            type: 'error',
            payload: { error },
            timestamp: Date.now()
        };

        this.broadcast(message);
    }

    sendUpdate(ws, updateData) {
        this.sendMessage(ws, 'update', updateData);
    }

    sendError(ws, error) {
        this.sendMessage(ws, 'error', { error });
    }

    sendMessage(ws, type, payload) {
        if (ws.readyState === WebSocket.OPEN) {
            const message = {
                type,
                payload,
                timestamp: Date.now()
            };
            
            ws.send(JSON.stringify(message));
        }
    }

    broadcast(message) {
        const messageStr = JSON.stringify(message);
        
        this.clients.forEach((ws) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(messageStr);
            }
        });
    }

    // Limpieza al cerrar servidor
    cleanup() {
        this.stopSimulation();
        this.clients.clear();
    }
}

module.exports = TrainWebSocketHandler;