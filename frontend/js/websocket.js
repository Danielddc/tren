/**
 * Cliente WebSocket para comunicación en tiempo real con el servidor de simulación
 */

class TrainWebSocketClient {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000;
        this.eventHandlers = new Map();
        
        // Configuración del servidor
        this.serverUrl = this.getWebSocketUrl();
        
        // Vincular métodos para evitar problemas de contexto
        this.onOpen = this.onOpen.bind(this);
        this.onMessage = this.onMessage.bind(this);
        this.onClose = this.onClose.bind(this);
        this.onError = this.onError.bind(this);
    }

    /**
     * Obtiene la URL del WebSocket basada en la ubicación actual
     */
    getWebSocketUrl() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host || 'localhost:8080';
        return `${protocol}//${host}/ws`;
    }

    /**
     * Conecta al servidor WebSocket
     */
    connect() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            console.log('Ya conectado al servidor');
            return;
        }

        console.log(`Conectando a ${this.serverUrl}...`);
        
        try {
            this.socket = new WebSocket(this.serverUrl);
            this.socket.onopen = this.onOpen;
            this.socket.onmessage = this.onMessage;
            this.socket.onclose = this.onClose;
            this.socket.onerror = this.onError;
        } catch (error) {
            console.error('Error creando WebSocket:', error);
            this.updateConnectionStatus(false);
        }
    }

    /**
     * Desconecta del servidor
     */
    disconnect() {
        if (this.socket) {
            console.log('Desconectando...');
            this.socket.close();
        }
    }

    /**
     * Manejador de conexión exitosa
     */
    onOpen(event) {
        console.log('Conectado al servidor');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.updateConnectionStatus(true);
        this.emit('connected');
    }

    /**
     * Manejador de mensajes recibidos
     */
    onMessage(event) {
        try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        } catch (error) {
            console.error('Error procesando mensaje:', error);
        }
    }

    /**
     * Manejador de cierre de conexión
     */
    onClose(event) {
        console.log('Conexión cerrada:', event.code, event.reason);
        this.isConnected = false;
        this.updateConnectionStatus(false);
        this.emit('disconnected');

        // Intentar reconectar automáticamente
        if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
        }
    }

    /**
     * Manejador de errores
     */
    onError(error) {
        console.error('Error WebSocket:', error);
        this.updateConnectionStatus(false);
        this.emit('error', error);
    }

    /**
     * Programa un intento de reconexión
     */
    scheduleReconnect() {
        this.reconnectAttempts++;
        console.log(`Reintentando conexión (${this.reconnectAttempts}/${this.maxReconnectAttempts}) en ${this.reconnectDelay}ms...`);
        
        setTimeout(() => {
            this.connect();
        }, this.reconnectDelay);
        
        // Incrementar delay exponencialmente
        this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 10000);
    }

    /**
     * Procesa mensajes recibidos del servidor
     */
    handleMessage(data) {
        const { type, payload, timestamp } = data;

        switch (type) {
            case 'update':
                this.emit('simulationUpdate', payload);
                break;
                
            case 'simulationStarted':
                this.emit('simulationStarted', payload);
                break;
                
            case 'simulationPaused':
                this.emit('simulationPaused', payload);
                break;
                
            case 'simulationResumed':
                this.emit('simulationResumed', payload);
                break;
                
            case 'simulationStopped':
                this.emit('simulationStopped', payload);
                break;
                
            case 'simulationComplete':
                this.emit('simulationComplete', payload);
                break;
                
            case 'accelerationChanged':
                this.emit('accelerationChanged', payload);
                break;
                
            case 'stationNamesUpdated':
                this.emit('stationNamesUpdated', payload);
                break;
                
            case 'arrivalTimes':
                this.emit('arrivalTimes', payload);
                break;
                
            case 'arduinoConnected':
                this.emit('arduinoConnected', payload);
                break;
                
            case 'arduinoDisconnected':
                this.emit('arduinoDisconnected', payload);
                break;
                
            case 'arduinoData':
                this.emit('arduinoData', payload);
                break;
                
            case 'arduinoPorts':
                this.emit('arduinoPorts', payload);
                break;
                
            case 'arduinoStatus':
                this.emit('arduinoStatus', payload);
                break;
                
            case 'stationReached':
                this.emit('stationReached', payload);
                break;
                
            case 'error':
                this.emit('serverError', payload);
                break;
                
            default:
                console.warn('Tipo de mensaje desconocido:', type);
        }
    }

    /**
     * Envía un mensaje al servidor
     */
    send(type, payload = {}) {
        if (!this.isConnected) {
            console.warn('No conectado - no se puede enviar mensaje');
            return false;
        }

        const message = {
            type,
            payload,
            timestamp: Date.now()
        };

        try {
            this.socket.send(JSON.stringify(message));
            return true;
        } catch (error) {
            console.error('Error enviando mensaje:', error);
            return false;
        }
    }

    /**
     * Métodos de control de simulación
     */
    startSimulation(params) {
        return this.send('start', params);
    }

    pauseSimulation() {
        return this.send('pause');
    }

    resumeSimulation() {
        return this.send('resume');
    }

    stopSimulation() {
        return this.send('stop');
    }

    setAcceleration(acceleration) {
        return this.send('setAcceleration', { acceleration });
    }

    setStationNames(stationNames) {
        return this.send('setStationNames', { stationNames });
    }

    getArrivalTimes() {
        return this.send('getArrivalTimes');
    }

    requestState() {
        return this.send('getState');
    }

    /**
     * Métodos de control de Arduino
     */
    connectArduino(portPath, baudRate) {
        return this.send('connectArduino', { portPath, baudRate });
    }

    disconnectArduino() {
        return this.send('disconnectArduino');
    }

    listArduinoPorts() {
        return this.send('listArduinoPorts');
    }

    getArduinoStatus() {
        return this.send('getArduinoStatus');
    }

    /**
     * Sistema de eventos
     */
    on(eventName, handler) {
        if (!this.eventHandlers.has(eventName)) {
            this.eventHandlers.set(eventName, []);
        }
        this.eventHandlers.get(eventName).push(handler);
    }

    off(eventName, handler) {
        if (this.eventHandlers.has(eventName)) {
            const handlers = this.eventHandlers.get(eventName);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    emit(eventName, data) {
        if (this.eventHandlers.has(eventName)) {
            this.eventHandlers.get(eventName).forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error en handler de evento ${eventName}:`, error);
                }
            });
        }
    }

    /**
     * Actualiza el indicador de estado de conexión en la UI
     */
    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            if (connected) {
                statusElement.className = 'status-connected';
                statusElement.innerHTML = '<i class="fas fa-wifi"></i> Conectado';
            } else {
                statusElement.className = 'status-disconnected';
                statusElement.innerHTML = '<i class="fas fa-wifi"></i> Desconectado';
            }
        }
    }

    /**
     * Obtiene el estado actual de la conexión
     */
    getConnectionState() {
        return {
            isConnected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            serverUrl: this.serverUrl
        };
    }
}

// Crear instancia global
window.trainWebSocket = new TrainWebSocketClient();