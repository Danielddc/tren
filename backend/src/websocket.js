/**
 * Manejador de WebSocket para comunicación en tiempo real
 */

const WebSocket = require('ws');
const TrainPhysics = require('./physics');
const ArduinoDataReader = require('./arduino');

class TrainWebSocketHandler {
    constructor(wss) {
        this.wss = wss;
        this.trainSimulation = null;
        this.simulationInterval = null;
        this.clients = new Set();
        this.arduino = null;
        this.useArduinoData = false;
        
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
                
                // Si no quedan clientes, detener simulación pero NO cerrar Arduino
                if (this.clients.size === 0 && this.trainSimulation) {
                    this.stopSimulation();
                }
                // El Arduino permanece conectado aunque no haya clientes web
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
                
            case 'setMaxStations':
                this.setMaxStations(payload.maxStations);
                break;
                
            case 'getArrivalTimes':
                this.sendArrivalTimes(ws);
                break;
                
            case 'getState':
                this.sendCurrentState(ws);
                break;
                
            case 'connectArduino':
                this.connectArduino(payload);
                break;
                
            case 'disconnectArduino':
                this.disconnectArduino();
                break;
                
            case 'listArduinoPorts':
                this.listArduinoPorts(ws);
                break;
                
            case 'getArduinoStatus':
                this.sendArduinoStatus(ws);
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
        
        // Configurar número de estaciones en Arduino si está conectado
        if (this.arduino && validatedParams.params.numStations) {
            this.arduino.setMaxStations(validatedParams.params.numStations);
        }

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
        
        // Configurar también en Arduino si está conectado
        if (this.arduino && Array.isArray(stationNames)) {
            this.arduino.setMaxStations(stationNames.length);
        }
    }
    
    setMaxStations(maxStations) {
        const numStations = parseInt(maxStations);
        if (this.arduino && !isNaN(numStations) && numStations > 0) {
            this.arduino.setMaxStations(numStations);
            console.log(`📍 Configurado máximo de ${numStations} estaciones en Arduino`);
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

    // Métodos para Arduino
    async connectArduino(params) {
        try {
            // Si ya está conectado, solo enviar confirmación
            if (this.arduino && this.arduino.isConnected) {
                console.log('Arduino ya está conectado, enviando confirmación...');
                this.broadcastMessage('arduinoConnected', {
                    message: 'Arduino ya conectado',
                    status: this.arduino.getStatus()
                });
                return;
            }

            // Desconectar Arduino existente si está conectado
            if (this.arduino) {
                await this.disconnectArduino();
            }

            const portPath = params?.portPath || null;
            const baudRate = params?.baudRate || 9600;

            this.arduino = new ArduinoDataReader(portPath, baudRate);
            
            // Configurar callback para recibir datos
            this.arduino.onData((data) => {
                this.handleArduinoData(data);
            });

            this.arduino.onError((error) => {
                this.broadcastError(`Error Arduino: ${error.message}`);
            });

            // Conectar
            await this.arduino.connect(true);
            this.useArduinoData = true;

            this.broadcastMessage('arduinoConnected', {
                message: 'Arduino conectado exitosamente',
                status: this.arduino.getStatus()
            });

        } catch (error) {
            console.error('Error conectando Arduino:', error);
            this.broadcastError(`No se pudo conectar Arduino: ${error.message}`);
            this.arduino = null;
            this.useArduinoData = false;
        }
    }

    async disconnectArduino() {
        if (this.arduino) {
            await this.arduino.disconnect();
            this.arduino = null;
            this.useArduinoData = false;

            this.broadcastMessage('arduinoDisconnected', {
                message: 'Arduino desconectado'
            });
        }
    }

    async listArduinoPorts(ws) {
        try {
            const ports = await ArduinoDataReader.listPorts();
            this.sendMessage(ws, 'arduinoPorts', { ports });
        } catch (error) {
            this.sendError(ws, `Error listando puertos: ${error.message}`);
        }
    }

    sendArduinoStatus(ws) {
        if (this.arduino) {
            const status = this.arduino.getStatus();
            this.sendMessage(ws, 'arduinoStatus', status);
        } else {
            this.sendMessage(ws, 'arduinoStatus', {
                connected: false,
                message: 'Arduino no conectado'
            });
        }
    }

    handleArduinoData(data) {
        console.log('📨 Datos recibidos del Arduino:', data);
        
        // Manejar eventos de salida y llegada
        if (data.eventType === 'departure') {
            console.log(`🚂 SALIDA del tren - Estación ${data.station}`);
            this.broadcastMessage('trainDeparture', {
                station: data.station,
                timestamp: data.timestamp,
                departureTime: data.departureTime
            });
            return;
        }
        
        if (data.eventType === 'arrival') {
            console.log(`🚉 LLEGADA del tren - Estación ${data.station}`);
            console.log(`📊 Datos completos:`, JSON.stringify(data, null, 2));
            
            const stationEvent = {
                stationIndex: data.station,
                stationName: `Estación ${data.station}`,
                arrivalTime: data.arrivalTime,
                departureTime: data.departureTime,
                travelTime: data.travelTime,
                distance: data.distance,
                velocity: data.velocity,
                acceleration: data.acceleration,
                position: data.distance,
                time: data.travelTime
            };
            
            console.log(`📊 Enviando evento de llegada:`, stationEvent);
            
            // Notificar llegada a estación
            this.broadcastMessage('stationReached', stationEvent);
            this.broadcastUpdate({
                time: data.travelTime,
                position: data.distance,
                velocity: data.velocity,
                acceleration: data.acceleration,
                fromArduino: true,
                stationEvent: stationEvent,
                isFinished: false
            });
            return;
        }
        
        // Solo procesar datos legacy si NO tiene eventType (para evitar duplicados)
        if (data.eventType) {
            // Si tiene eventType pero no es departure ni arrival, solo broadcast
            this.broadcastMessage('arduinoData', data);
            return;
        }
        
        // Broadcast datos del Arduino a todos los clientes
        this.broadcastMessage('arduinoData', data);

        // Si hay evento de estación (nueva vuelta detectada) - solo para formato legacy
        if (data.stationReached && data.stationIndex !== undefined) {
            const stationEvent = {
                stationIndex: data.stationIndex,
                arrivalTime: data.time,
                position: data.distance,
                velocity: data.velocity,
                acceleration: data.acceleration || 0,
                stationName: `Estación ${data.stationIndex}`
            };
            
            console.log(`🚉 Evento de estación enviado: Estación ${data.stationIndex}`);
            
            // Notificar llegada a estación
            this.broadcastMessage('stationReached', stationEvent);
            this.broadcastUpdate({
                time: data.time,
                position: data.distance,
                velocity: data.velocity,
                acceleration: data.acceleration,
                fromArduino: true,
                stationEvent: stationEvent,
                isFinished: false
            });
        } else {
            // Si no hay evento de estación, solo actualizar datos
            this.broadcastUpdate({
                time: data.time,
                position: data.distance,
                velocity: data.velocity,
                acceleration: data.acceleration,
                fromArduino: true,
                isFinished: false
            });
        }

        // Si hay simulación activa en modo Arduino, actualizar el estado
        if (this.trainSimulation && this.useArduinoData) {
            // Actualizar el estado de la simulación con datos reales del Arduino
            this.trainSimulation.t = data.time;
            this.trainSimulation.v = data.velocity;
            this.trainSimulation.a = data.acceleration;
            this.trainSimulation.x = data.distance;

            // Detectar si cruzó alguna estación
            const prevStation = this.trainSimulation.currentStation;
            for (let i = prevStation; i < this.trainSimulation.numStations; i++) {
                const stationPos = this.trainSimulation.getStationPosition(i);
                
                if (data.distance >= stationPos && !this.trainSimulation.stationsReached.find(s => s.stationIndex === i)) {
                    const stationEvent = {
                        stationIndex: i,
                        arrivalTime: data.time,
                        position: stationPos,
                        velocity: data.velocity,
                        stationName: this.trainSimulation.stationNames[i] || `Estación ${i + 1}`
                    };
                    
                    this.trainSimulation.stationsReached.push(stationEvent);
                    this.trainSimulation.currentStation = i + 1;

                    // Verificar si es la última estación
                    if (this.trainSimulation.currentStation >= this.trainSimulation.numStations) {
                        this.trainSimulation.isFinished = true;
                        this.broadcastMessage('simulationComplete', {
                            message: 'Simulación completada - todas las estaciones alcanzadas',
                            finalState: this.trainSimulation.getState()
                        });
                    }
                }
            }
        }
    }

    // Limpieza al cerrar servidor
    async cleanup() {
        this.stopSimulation();
        
        if (this.arduino) {
            await this.disconnectArduino();
        }
        
        this.clients.clear();
    }
}

module.exports = TrainWebSocketHandler;