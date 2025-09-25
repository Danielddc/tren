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
        
        // Conectar automáticamente
        ws.connect();
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
     * Manejadores de eventos de simulación
     */
    handleSimulationUpdate(data) {
        this.updateCurrentState(data);
        this.updateCharts(data);
        
        if (data.stationEvent) {
            this.addStationEvent(data.stationEvent);
        }
    }

    handleSimulationStarted(data) {
        this.isSimulationRunning = true;
        this.stationsReached = [];
        this.updateUI();
        this.clearStationsLog();
        window.chartManager.clearCharts();
        
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
        window.chartManager.clearCharts();
        this.resetCurrentState();
        this.showInfo('Simulación detenida');
    }

    handleSimulationComplete(data) {
        this.isSimulationRunning = false;
        this.updateUI();
        
        const stats = window.chartManager.getStatistics();
        let message = '🎉 ¡Simulación completada! Todas las estaciones fueron alcanzadas.';
        
        if (stats) {
            message += `\n\nEstadísticas:\n`;
            message += `• Tiempo total: ${stats.totalTime}s\n`;
            message += `• Distancia total: ${stats.finalPosition}m\n`;
            message += `• Velocidad máxima: ${stats.maxVelocity} m/s\n`;
            message += `• Velocidad promedio: ${stats.avgVelocity} m/s`;
        }
        
        this.showSuccess(message);
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
     * Actualiza las gráficas
     */
    updateCharts(data) {
        window.chartManager.updateCharts(data);
    }

    /**
     * Añade un evento de estación al log
     */
    addStationEvent(stationEvent) {
        this.stationsReached.push(stationEvent);
        
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
        
        // Actualizar tiempos de llegada automáticamente
        this.refreshArrivalTimes();
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
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.trainApp = new TrainSimulatorApp();
    
    console.log('🚂 Simulador de Tren inicializado');
    console.log('Atajos de teclado:');
    console.log('  - Barra espaciadora: Iniciar/Pausar');
    console.log('  - Escape: Detener simulación');
});