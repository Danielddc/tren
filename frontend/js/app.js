/**
 * Aplicación principal del simulador de tren
 * Conecta la UI, WebSocket y gráficas
 */

class TrainSimulatorApp {
    constructor() {
        this.isSimulationRunning = false;
        this.currentParams = {};
        this.stationsReached = [];
        this.stationNames = [];
        
        // Referencias a elementos DOM
        this.elements = {
            // Formulario
            form: document.getElementById('simulationForm'),
            initialVelocity: document.getElementById('initialVelocity'),
            numStations: document.getElementById('numStations'),
            stationDistance: document.getElementById('stationDistance'),
            acceleration: document.getElementById('acceleration'),
            timeStep: document.getElementById('timeStep'),
            
            // Botones de control
            startBtn: document.getElementById('startBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            stopBtn: document.getElementById('stopBtn'),
            
            // Arduino
            connectArduinoBtn: document.getElementById('connectArduinoBtn'),
            disconnectArduinoBtn: document.getElementById('disconnectArduinoBtn'),
            refreshPortsBtn: document.getElementById('refreshPortsBtn'),
            arduinoPort: document.getElementById('arduinoPort'),
            baudRate: document.getElementById('baudRate'),
            arduinoStatus: document.getElementById('arduinoStatus'),
            arduinoTime: document.getElementById('arduinoTime'),
            arduinoVelocity: document.getElementById('arduinoVelocity'),
            arduinoAcceleration: document.getElementById('arduinoAcceleration'),
            arduinoDistance: document.getElementById('arduinoDistance'),
            
            // Control de aceleración
            accelerationSlider: document.getElementById('accelerationSlider'),
            accelValue: document.getElementById('accelValue'),
            
            // Nombres de estaciones
            stationNamesContainer: document.getElementById('stationNamesContainer'),
            generateNamesBtn: document.getElementById('generateNamesBtn'),
            
            // Estado actual
            currentTime: document.getElementById('currentTime'),
            currentPosition: document.getElementById('currentPosition'),
            currentVelocity: document.getElementById('currentVelocity'),
            
            // Log de estaciones
            stationsLog: document.getElementById('stationsLog'),
            
            // Tiempos de llegada
            arrivalTimesDisplay: document.getElementById('arrivalTimesDisplay'),
            refreshTimesBtn: document.getElementById('refreshTimesBtn')
        };
        
        this.initializeEventListeners();
        this.initializeWebSocket();
        this.updateStationNameInputs(); // Generar inputs iniciales
        this.updateUI();
    }

    /**
     * Inicializa los event listeners de la UI
     */
    initializeEventListeners() {
        // Botones de control
        this.elements.startBtn.addEventListener('click', () => this.startSimulation());
        this.elements.pauseBtn.addEventListener('click', () => this.pauseSimulation());
        this.elements.stopBtn.addEventListener('click', () => this.stopSimulation());
        
        // Botones Arduino
        this.elements.connectArduinoBtn.addEventListener('click', () => this.connectArduino());
        this.elements.disconnectArduinoBtn.addEventListener('click', () => this.disconnectArduino());
        this.elements.refreshPortsBtn.addEventListener('click', () => this.refreshArduinoPorts());
        
        // Generar nombres de estaciones
        this.elements.generateNamesBtn.addEventListener('click', () => this.generateStationNames());
        
        // Actualizar tiempos de llegada
        this.elements.refreshTimesBtn.addEventListener('click', () => this.refreshArrivalTimes());
        
        // Actualizar inputs de estaciones cuando cambia el número
        this.elements.numStations.addEventListener('input', () => this.updateStationNameInputs());
        
        // Control de aceleración en tiempo real
        this.elements.accelerationSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.elements.accelValue.textContent = value.toFixed(1);
            
            if (this.isSimulationRunning) {
                this.setAcceleration(value);
            }
        });
        
        // Validación de formulario en tiempo real
        Object.keys(this.elements).forEach(key => {
            const element = this.elements[key];
            if (element && element.type === 'number') {
                element.addEventListener('input', () => this.validateForm());
            }
        });
        
        // Atajos de teclado
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName.toLowerCase() !== 'input') {
                switch (e.key) {
                    case ' ': // Barra espaciadora
                        e.preventDefault();
                        if (this.isSimulationRunning) {
                            this.pauseSimulation();
                        } else {
                            this.startSimulation();
                        }
                        break;
                    case 'Escape':
                        this.stopSimulation();
                        break;
                }
            }
        });
    }

    /**
     * Inicializa la conexión WebSocket
     */
    initializeWebSocket() {
        const ws = window.trainWebSocket;
        
        // Eventos de conexión
        ws.on('connected', () => {
            console.log('Conectado al servidor');
            this.updateUI();
        });
        
        ws.on('disconnected', () => {
            console.log('Desconectado del servidor');
            this.handleDisconnection();
        });
        
        // Eventos de simulación
        ws.on('simulationUpdate', (data) => {
            this.handleSimulationUpdate(data);
        });
        
        ws.on('simulationStarted', (data) => {
            this.handleSimulationStarted(data);
        });
        
        ws.on('simulationPaused', (data) => {
            this.handleSimulationPaused(data);
        });
        
        ws.on('simulationResumed', (data) => {
            this.handleSimulationResumed(data);
        });
        
        ws.on('simulationStopped', (data) => {
            this.handleSimulationStopped(data);
        });
        
        ws.on('simulationComplete', (data) => {
            this.handleSimulationComplete(data);
        });
        
        ws.on('serverError', (data) => {
            this.showError(data.error);
        });
        
        ws.on('stationNamesUpdated', (data) => {
            console.log('Nombres de estaciones actualizados:', data.stationNames);
        });
        
        ws.on('arrivalTimes', (data) => {
            this.displayArrivalTimes(data.arrivalTimes);
        });
        
        // Eventos de Arduino
        ws.on('arduinoConnected', (data) => {
            this.handleArduinoConnected(data);
        });
        
        ws.on('arduinoDisconnected', (data) => {
            this.handleArduinoDisconnected(data);
        });
        
        ws.on('arduinoData', (data) => {
            this.handleArduinoData(data);
        });
        
        ws.on('trainDeparture', (data) => {
            this.handleTrainDeparture(data);
        });
        
        ws.on('arduinoPorts', (data) => {
            this.updateArduinoPorts(data.ports);
        });
        
        ws.on('arduinoStatus', (data) => {
            this.updateArduinoStatus(data);
        });
        
        ws.on('stationReached', (data) => {
            this.addStationEvent(data);
        });
        
        // Conectar automáticamente
        ws.connect();
        
        // Conectar Arduino automáticamente después de 1 segundo
        setTimeout(() => {
            this.connectArduino();
        }, 1500);
    }

    /**
     * Inicia la simulación
     */
    startSimulation() {
        if (!this.validateForm()) {
            this.showError('Por favor, verifica que todos los parámetros sean válidos');
            return;
        }
        
        const params = this.getFormData();
        this.currentParams = params;
        
        const ws = window.trainWebSocket;
        if (ws.startSimulation(params)) {
            console.log('Iniciando simulación con parámetros:', params);
        } else {
            this.showError('No se pudo iniciar la simulación. Verifica la conexión.');
        }
    }

    /**
     * Pausa la simulación
     */
    pauseSimulation() {
        const ws = window.trainWebSocket;
        ws.pauseSimulation();
    }

    /**
     * Detiene la simulación
     */
    stopSimulation() {
        const ws = window.trainWebSocket;
        ws.stopSimulation();
    }

    /**
     * Cambia la aceleración en tiempo real
     */
    setAcceleration(acceleration) {
        const ws = window.trainWebSocket;
        ws.setAcceleration(acceleration);
    }

    /**
     * Obtiene los datos del formulario
     */
    getFormData() {
        const stationNames = this.getStationNames();
        
        return {
            initialVelocity: parseFloat(this.elements.initialVelocity.value) || 0,
            numStations: parseInt(this.elements.numStations.value) || 5,
            stationDistance: parseFloat(this.elements.stationDistance.value) || 1000,
            acceleration: parseFloat(this.elements.acceleration.value) || 1,
            timeStep: parseFloat(this.elements.timeStep.value) || 0.05,
            stationNames: stationNames
        };
    }

    /**
     * Obtiene los nombres de estaciones de los inputs
     */
    getStationNames() {
        const inputs = this.elements.stationNamesContainer.querySelectorAll('.station-name-input');
        const names = [];
        
        inputs.forEach(input => {
            const name = input.value.trim();
            names.push(name || input.placeholder);
        });
        
        return names;
    }

    /**
     * Actualiza los inputs de nombres de estaciones
     */
    updateStationNameInputs() {
        const numStations = parseInt(this.elements.numStations.value) || 5;
        const container = this.elements.stationNamesContainer;
        
        // Limpiar container
        container.innerHTML = '';
        
        // Crear inputs para cada estación
        for (let i = 0; i < numStations; i++) {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'station-name-input';
            input.placeholder = `Estación ${i + 1}`;
            input.value = this.stationNames[i] || '';
            
            container.appendChild(input);
        }
        
        // Enviar número de estaciones al backend para configurar Arduino
        const ws = window.trainWebSocket;
        if (ws && ws.send) {
            ws.send({
                type: 'setMaxStations',
                payload: { maxStations: numStations }
            });
        }
    }

    /**
     * Genera nombres automáticos para las estaciones
     */
    generateStationNames() {
        const cityNames = [
            'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza',
            'Málaga', 'Murcia', 'Palma', 'Bilbao', 'Alicante',
            'Córdoba', 'Valladolid', 'Vigo', 'Gijón', 'Granada',
            'Vitoria', 'Elche', 'Oviedo', 'Sabadell', 'Santander'
        ];
        
        const numStations = parseInt(this.elements.numStations.value) || 5;
        const inputs = this.elements.stationNamesContainer.querySelectorAll('.station-name-input');
        
        // Mezclar nombres de ciudades
        const shuffled = [...cityNames].sort(() => Math.random() - 0.5);
        
        inputs.forEach((input, index) => {
            if (index < shuffled.length) {
                input.value = shuffled[index];
            } else {
                input.value = `Estación ${index + 1}`;
            }
        });
        
        this.stationNames = this.getStationNames();
    }

    /**
     * Solicita actualización de tiempos de llegada
     */
    refreshArrivalTimes() {
        const ws = window.trainWebSocket;
        ws.getArrivalTimes();
    }

    /**
     * Valida el formulario
     */
    validateForm() {
        const data = this.getFormData();
        
        // Validaciones básicas
        if (data.numStations < 1 || data.numStations > 20) return false;
        if (data.stationDistance <= 0 || data.stationDistance > 10000) return false;
        if (Math.abs(data.acceleration) > 20) return false;
        if (data.timeStep <= 0 || data.timeStep > 1) return false;
        if (Math.abs(data.initialVelocity) > 200) return false;
        
        return true;
    }

    /**
     * Maneja actualizaciones de la simulación
     */
    handleSimulationUpdate(data) {
        this.updateCurrentState(data);
        this.updateCharts(data);
        
        // No agregar estación aquí porque ya se maneja con el evento 'stationReached'
        // Esto evita duplicados en el historial
    }

    handleSimulationStarted(data) {
        this.isSimulationRunning = true;
        this.stationsReached = [];
        this.updateUI();
        this.clearStationsLog();
        this.clearArrivalData();
        
        // Configurar slider con aceleración inicial
        this.elements.accelerationSlider.value = this.currentParams.acceleration;
        this.elements.accelValue.textContent = this.currentParams.acceleration.toFixed(1);
        
        this.showSuccess('Simulación iniciada');
    }

    handleSimulationPaused(data) {
        this.isSimulationRunning = false;
        this.updateUI();
        this.showInfo('Simulación pausada');
    }

    handleSimulationResumed(data) {
        this.isSimulationRunning = true;
        this.updateUI();
        this.showInfo('Simulación reanudada');
    }

    handleSimulationStopped(data) {
        this.isSimulationRunning = false;
        this.stationsReached = [];
        this.updateUI();
        this.clearStationsLog();
        this.clearArrivalData();
        this.resetCurrentState();
        this.showInfo('Simulación detenida');
    }

    handleSimulationComplete(data) {
        this.isSimulationRunning = false;
        this.updateUI();
        
        this.showSuccess('🎉 ¡Simulación completada! Todas las estaciones fueron alcanzadas.');
    }

    handleDisconnection() {
        this.isSimulationRunning = false;
        this.updateUI();
        this.showError('Conexión perdida con el servidor');
    }

    /**
     * Actualiza el estado actual en la UI
     */
    updateCurrentState(data) {
        this.elements.currentTime.textContent = `${data.time.toFixed(2)}s`;
        this.elements.currentPosition.textContent = `${data.position.toFixed(1)}m`;
        this.elements.currentVelocity.textContent = `${data.velocity.toFixed(2)} m/s`;
    }

    /**
     * Resetea el estado actual
     */
    resetCurrentState() {
        this.elements.currentTime.textContent = '0.0s';
        this.elements.currentPosition.textContent = '0.0m';
        this.elements.currentVelocity.textContent = '0.0 m/s';
    }

    /**
     * Actualiza las gráficas - DESHABILITADO
     */
    updateCharts(data) {
        // Gráficas deshabilitadas - solo mostramos datos de llegada
    }

    /**
     * Añade un evento de estación al log
     */
    addStationEvent(stationEvent) {
        this.stationsReached.push(stationEvent);
        
        // Actualizar log de estaciones
        const logEntry = document.createElement('div');
        logEntry.className = 'station-entry recent';
        logEntry.innerHTML = `
            <span>
                <i class="fas fa-map-marker-alt"></i>
                ${stationEvent.stationName}
            </span>
            <span>
                ${stationEvent.arrivalTime.toFixed(2)}s
                (${stationEvent.position}m)
            </span>
        `;
        
        // Remover mensaje de "no data"
        const noData = this.elements.stationsLog.querySelector('.no-data');
        if (noData) {
            noData.remove();
        }
        
        this.elements.stationsLog.appendChild(logEntry);
        
        // Scroll al final
        this.elements.stationsLog.scrollTop = this.elements.stationsLog.scrollHeight;
        
        // Remover clase "recent" después de animación
        setTimeout(() => {
            logEntry.classList.remove('recent');
        }, 500);
        
        // Actualizar display de datos de llegada
        this.updateArrivalData(stationEvent);
        
        // Actualizar tiempos de llegada automáticamente
        this.refreshArrivalTimes();
    }
    
    /**
     * Actualiza el display de datos de llegada
     */
    updateArrivalData(stationEvent) {
        const container = document.getElementById('arrivalDataDisplay');
        
        // Remover mensaje de "no data" si existe
        const noData = container.querySelector('.no-data');
        if (noData) {
            noData.remove();
        }
        
        // Formatear hora de llegada
        const arrivalDate = new Date(stationEvent.arrivalTime);
        const arrivalTimeStr = arrivalDate.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        // Crear card de datos de llegada con todos los datos
        const dataCard = document.createElement('div');
        dataCard.className = 'arrival-data-card recent';
        dataCard.innerHTML = `
            <div class="arrival-header">
                <h4><i class="fas fa-train"></i> ${stationEvent.stationName}</h4>
                <span class="station-number">Estación #${stationEvent.stationIndex}</span>
            </div>
            <div class="arrival-data-grid">
                <div class="data-box">
                    <i class="fas fa-clock"></i>
                    <div class="data-content">
                        <span class="data-label">Tiempo de Recorrido</span>
                        <span class="data-value">${stationEvent.travelTime ? stationEvent.travelTime.toFixed(3) : stationEvent.arrivalTime.toFixed(3)} s</span>
                    </div>
                </div>
                <div class="data-box">
                    <i class="fas fa-ruler"></i>
                    <div class="data-content">
                        <span class="data-label">Distancia Recorrida</span>
                        <span class="data-value">${stationEvent.distance ? stationEvent.distance.toFixed(2) : stationEvent.position.toFixed(2)} m</span>
                    </div>
                </div>
                <div class="data-box">
                    <i class="fas fa-tachometer-alt"></i>
                    <div class="data-content">
                        <span class="data-label">Velocidad Promedio</span>
                        <span class="data-value">${stationEvent.velocity.toFixed(3)} m/s</span>
                    </div>
                </div>
                <div class="data-box">
                    <i class="fas fa-bolt"></i>
                    <div class="data-content">
                        <span class="data-label">Aceleración</span>
                        <span class="data-value">${stationEvent.acceleration ? stationEvent.acceleration.toFixed(3) : 'N/A'} m/s²</span>
                    </div>
                </div>
                <div class="data-box">
                    <i class="fas fa-stopwatch"></i>
                    <div class="data-content">
                        <span class="data-label">Hora de Llegada</span>
                        <span class="data-value">${arrivalTimeStr}</span>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(dataCard);
        
        // Scroll al final
        container.scrollTop = container.scrollHeight;
        
        // Remover clase "recent" después de animación
        setTimeout(() => {
            dataCard.classList.remove('recent');
        }, 500);
    }
    
    /**
     * Maneja evento de salida del tren
     */
    handleDeparture(data) {
        console.log('🚂 Salida del tren detectada', data);
        
        // Mostrar notificación visual de salida
        const container = document.getElementById('arrivalDataDisplay');
        const departureNotice = document.createElement('div');
        departureNotice.className = 'departure-notice';
        departureNotice.innerHTML = `
            <div class="departure-content">
                <i class="fas fa-arrow-right"></i>
                <span>Tren saliendo de Estación ${data.station}...</span>
            </div>
        `;
        
        // Insertar al principio
        container.insertBefore(departureNotice, container.firstChild);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            departureNotice.remove();
        }, 3000);
    }
    
    /**
     * Maneja evento de salida del tren (alias para handleDeparture)
     */
    handleTrainDeparture(data) {
        this.handleDeparture(data);
    }
    
    /**
     * Limpia el display de datos de llegada
     */
    clearArrivalData() {
        const container = document.getElementById('arrivalDataDisplay');
        container.innerHTML = '<p class="no-data">Esperando datos del Arduino...</p>';
    }

    /**
     * Muestra los tiempos de llegada estimados
     */
    displayArrivalTimes(arrivalTimes) {
        const container = this.elements.arrivalTimesDisplay;
        
        // Limpiar contenido previo
        container.innerHTML = '';
        
        if (!arrivalTimes || arrivalTimes.length === 0) {
            container.innerHTML = '<p class="no-data">No hay estaciones pendientes</p>';
            return;
        }
        
        arrivalTimes.forEach(station => {
            const entry = document.createElement('div');
            entry.className = `arrival-time-entry ${station.reachable ? 'reachable' : 'unreachable'}`;
            
            entry.innerHTML = `
                <span class="arrival-time-name">
                    <i class="fas fa-map-marker-alt"></i>
                    ${station.stationName}
                </span>
                <span class="arrival-time-value">
                    ${station.estimatedArrivalTime}
                </span>
            `;
            
            container.appendChild(entry);
        });
    }

    /**
     * Limpia el log de estaciones
     */
    clearStationsLog() {
        this.elements.stationsLog.innerHTML = '<p class="no-data">Simulación en curso...</p>';
        this.elements.arrivalTimesDisplay.innerHTML = '<p class="no-data">Calculando tiempos...</p>';
    }

    /**
     * Actualiza la interfaz según el estado actual
     */
    updateUI() {
        const isConnected = window.trainWebSocket.isConnected;
        const isRunning = this.isSimulationRunning;
        
        // Botones de control
        this.elements.startBtn.disabled = !isConnected || isRunning;
        this.elements.pauseBtn.disabled = !isConnected || !isRunning;
        this.elements.stopBtn.disabled = !isConnected || !isRunning;
        
        // Formulario
        const formElements = this.elements.form.querySelectorAll('input');
        formElements.forEach(input => {
            input.disabled = isRunning;
        });
        
        // Slider de aceleración
        this.elements.accelerationSlider.disabled = !isConnected || !isRunning;
        
        // Botón de actualizar tiempos
        this.elements.refreshTimesBtn.disabled = !isConnected || !isRunning;
    }

    /**
     * Muestra mensajes al usuario
     */
    showMessage(message, type = 'info') {
        // Implementación simple con alert - podrías usar una librería de notificaciones
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        if (type === 'error') {
            alert(`Error: ${message}`);
        }
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showInfo(message) {
        this.showMessage(message, 'info');
    }
    
    /**
     * Métodos para Arduino
     */
    connectArduino() {
        const portPath = this.elements.arduinoPort.value || null;
        const baudRate = parseInt(this.elements.baudRate.value) || 9600;
        
        const ws = window.trainWebSocket;
        ws.connectArduino(portPath, baudRate);
        
        this.showInfo('Conectando con Arduino...');
    }
    
    disconnectArduino() {
        const ws = window.trainWebSocket;
        ws.disconnectArduino();
    }
    
    refreshArduinoPorts() {
        const ws = window.trainWebSocket;
        ws.listArduinoPorts();
    }
    
    handleArduinoConnected(data) {
        this.elements.arduinoStatus.textContent = '● Conectado';
        this.elements.arduinoStatus.className = 'status-connected';
        this.elements.connectArduinoBtn.disabled = true;
        this.elements.disconnectArduinoBtn.disabled = false;
        
        this.showSuccess(`Arduino conectado: ${data.status.port}`);
    }
    
    handleArduinoDisconnected(data) {
        this.elements.arduinoStatus.textContent = '● Desconectado';
        this.elements.arduinoStatus.className = 'status-disconnected';
        this.elements.connectArduinoBtn.disabled = false;
        this.elements.disconnectArduinoBtn.disabled = true;
        
        // Resetear datos
        this.elements.arduinoTime.textContent = '--';
        this.elements.arduinoVelocity.textContent = '--';
        this.elements.arduinoAcceleration.textContent = '--';
        this.elements.arduinoDistance.textContent = '--';
        
        this.showInfo('Arduino desconectado');
    }
    
    handleArduinoData(data) {
        // Actualizar display de datos de Arduino
        this.elements.arduinoTime.textContent = `${data.time.toFixed(2)} s`;
        this.elements.arduinoVelocity.textContent = `${data.velocity.toFixed(2)} m/s`;
        this.elements.arduinoAcceleration.textContent = `${data.acceleration.toFixed(2)} m/s²`;
        this.elements.arduinoDistance.textContent = `${data.distance.toFixed(1)} m`;
        
        // También actualizar el estado actual
        this.updateCurrentState({
            time: data.time,
            position: data.distance,
            velocity: data.velocity
        });
        
        // Manejar eventos de salida y llegada
        if (data.eventType === 'departure') {
            this.handleDeparture(data);
        }
    }
    
    updateArduinoPorts(ports) {
        const select = this.elements.arduinoPort;
        
        // Limpiar opciones actuales excepto la primera
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        // Agregar puertos encontrados
        ports.forEach(port => {
            const option = document.createElement('option');
            option.value = port.path;
            option.textContent = `${port.path}${port.manufacturer ? ' (' + port.manufacturer + ')' : ''}`;
            select.appendChild(option);
        });
        
        if (ports.length === 0) {
            this.showInfo('No se encontraron puertos Arduino');
        } else {
            this.showSuccess(`Se encontraron ${ports.length} puerto(s) disponible(s)`);
        }
    }
    
    updateArduinoStatus(data) {
        if (data.connected) {
            this.elements.arduinoStatus.textContent = '● Conectado';
            this.elements.arduinoStatus.className = 'status-connected';
            this.elements.connectArduinoBtn.disabled = true;
            this.elements.disconnectArduinoBtn.disabled = false;
        } else {
            this.elements.arduinoStatus.textContent = '● Desconectado';
            this.elements.arduinoStatus.className = 'status-disconnected';
            this.elements.connectArduinoBtn.disabled = false;
            this.elements.disconnectArduinoBtn.disabled = true;
        }
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.trainApp = new TrainSimulatorApp();
    
    console.log('🚂 Simulador de Tren inicializado');
    console.log('Atajos de teclado:');
    console.log('  - Barra espaciadora: Iniciar/Pausar');
    console.log('  - Escape: Detener simulación');
});