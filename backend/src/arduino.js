/**
 * Módulo para comunicación serial con Arduino
 * Lee datos de tiempo, velocidad, aceleración y distancia desde el puerto serial
 */

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

class ArduinoDataReader {
    constructor(portPath = null, baudRate = 9600) {
        this.portPath = portPath;
        this.baudRate = baudRate;
        this.port = null;
        this.parser = null;
        this.isConnected = false;
        this.dataCallback = null;
        this.errorCallback = null;
        this.pendingData = false; // Para formato de múltiples líneas
        
        // Últimos datos recibidos
        this.latestData = {
            time: 0,
            velocity: 0,
            acceleration: 0,
            distance: 0,
            timestamp: Date.now()
        };
        
        // Tracking de estaciones - nuevo sistema
        this.currentStation = 0;
        this.totalDistance = 0;
        this.departureTime = null;      // Tiempo de salida
        this.arrivalTime = null;        // Tiempo de llegada
        this.travelTime = 0;            // Tiempo de recorrido
        this.calculatedVelocity = 0;    // Velocidad calculada
        this.calculatedDistance = 0;    // Distancia calculada
        this.calculatedAcceleration = 0; // Aceleración calculada
        this.detectionCount = 0;        // Contador de detecciones (1=salida, 2=llegada)
        this.maxStations = null;        // Número máximo de estaciones configuradas
        this.lastProcessedStation = -1; // Para evitar duplicados
        this.processingStation = false; // Flag para evitar procesamiento múltiple
    }
    
    /**
     * Configura el número máximo de estaciones
     */
    setMaxStations(numStations) {
        this.maxStations = numStations;
        console.log(`📍 Configuradas ${numStations} estaciones máximas`);
    }

    /**
     * Lista todos los puertos seriales disponibles
     */
    static async listPorts() {
        try {
            const ports = await SerialPort.list();
            return ports.map(port => ({
                path: port.path,
                manufacturer: port.manufacturer,
                serialNumber: port.serialNumber,
                pnpId: port.pnpId,
                vendorId: port.vendorId,
                productId: port.productId
            }));
        } catch (error) {
            console.error('Error listando puertos:', error);
            return [];
        }
    }

    /**
     * Detecta automáticamente el puerto Arduino
     */
    static async detectArduinoPort() {
        const ports = await ArduinoDataReader.listPorts();
        
        // Buscar puertos que típicamente son Arduino
        const arduinoPort = ports.find(port => 
            port.manufacturer && (
                port.manufacturer.includes('Arduino') ||
                port.manufacturer.includes('CH340') ||
                port.manufacturer.includes('FTDI') ||
                port.manufacturer.includes('Silicon Labs')
            )
        );
        
        return arduinoPort ? arduinoPort.path : null;
    }

    /**
     * Conecta al puerto serial
     */
    async connect(autoDetect = true) {
        try {
            // Auto-detectar puerto si no se especificó
            if (!this.portPath && autoDetect) {
                console.log('Buscando puerto Arduino automáticamente...');
                this.portPath = await ArduinoDataReader.detectArduinoPort();
                
                if (!this.portPath) {
                    const ports = await ArduinoDataReader.listPorts();
                    console.log('Puertos disponibles:', ports);
                    throw new Error('No se encontró puerto Arduino. Especifica manualmente el puerto.');
                }
                
                console.log(`Arduino detectado en: ${this.portPath}`);
            }

            // Crear conexión serial
            this.port = new SerialPort({
                path: this.portPath,
                baudRate: this.baudRate,
                autoOpen: false
            });

            // Crear parser para leer líneas
            this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));

            // Configurar manejadores de eventos
            this.setupEventHandlers();

            // Abrir puerto
            return new Promise((resolve, reject) => {
                this.port.open((error) => {
                    if (error) {
                        reject(new Error(`Error abriendo puerto: ${error.message}`));
                    } else {
                        this.isConnected = true;
                        console.log(`✅ Conectado a Arduino en ${this.portPath} @ ${this.baudRate} baud`);
                        resolve();
                    }
                });
            });

        } catch (error) {
            console.error('Error conectando con Arduino:', error);
            throw error;
        }
    }

    /**
     * Configura los manejadores de eventos del puerto serial
     */
    setupEventHandlers() {
        // Leer datos del Arduino
        this.parser.on('data', (line) => {
            try {
                const data = this.parseArduinoData(line.trim());
                if (data) {
                    this.latestData = {
                        ...data,
                        timestamp: Date.now()
                    };
                    
                    // Llamar callback si existe
                    if (this.dataCallback) {
                        this.dataCallback(this.latestData);
                    }
                }
            } catch (error) {
                console.error('Error parseando datos:', error);
            }
        });

        // Manejar errores del puerto
        this.port.on('error', (error) => {
            console.error('Error en puerto serial:', error);
            this.isConnected = false;
            
            if (this.errorCallback) {
                this.errorCallback(error);
            }
        });

        // Manejar cierre del puerto
        this.port.on('close', () => {
            console.log('Puerto serial cerrado');
            this.isConnected = false;
        });
    }

    /**
     * Parsea los datos recibidos del Arduino
     * Nuevo formato JSON: {"station":1,"time":5.2,"distance":3.33,"velocity":0.64,"acceleration":0.25}
     */
    parseArduinoData(line) {
        // Intentar parsear como JSON primero
        if (line.startsWith('{')) {
            try {
                const json = JSON.parse(line);
                
                // Nuevo formato con datos de llegada a estación
                if (json.station !== undefined) {
                    const arrivalTime = Date.now();
                    const departureTime = arrivalTime - (json.time * 1000);
                    
                    this.currentStation = json.station;
                    this.totalDistance = json.station * 3.33;
                    
                    const arrivalData = {
                        eventType: 'arrival',
                        type: 'arduino',
                        station: json.station,
                        stationIndex: json.station,
                        time: parseFloat(json.time),
                        distance: parseFloat(json.distance),
                        totalDistance: this.totalDistance,
                        velocity: parseFloat(json.velocity),
                        acceleration: parseFloat(json.acceleration),
                        travelTime: parseFloat(json.time),
                        arrivalTime: arrivalTime,
                        departureTime: departureTime,
                        stationReached: true
                    };
                    
                    console.log(`🚉 LLEGADA a estación ${json.station}`);
                    console.log(`   ⏱️  Tiempo: ${json.time.toFixed(4)}s`);
                    console.log(`   📏 Distancia: ${json.distance} m`);
                    console.log(`   🚄 Velocidad: ${json.velocity.toFixed(4)} m/s`);
                    console.log(`   ⚡ Aceleración: ${json.acceleration.toFixed(4)} m/s²`);
                    
                    return arrivalData;
                }
                
                // Formato genérico JSON
                return {
                    time: parseFloat(json.time) || this.latestData.time,
                    velocity: parseFloat(json.velocity || json.vel) || this.latestData.velocity,
                    acceleration: parseFloat(json.acceleration || json.acc) || this.latestData.acceleration,
                    distance: parseFloat(json.distance || json.dist) || this.latestData.distance
                };
            } catch (e) {
                // Si falla JSON, continuar con otros formatos
            }
        }

        // Detectar mensajes informativos del Arduino
        if (line.includes('Tren detectado') || line.includes('vuelta completada')) {
            console.log(`� Arduino: ${line}`);
            return null;
        }
        
        if (line.includes('Detección ignorada')) {
            console.log(`⚠️  Arduino: ${line}`);
            return null;
        }

        // Parsear formato "Vuelta número: X" - tratarlo como estación
        if (line.includes('Vuelta número:')) {
            const match = line.match(/Vuelta número:\s*(\d+)/);
            if (match) {
                const vuelta = parseInt(match[1]);
                
                // Evitar procesar la misma estación múltiples veces
                if (vuelta !== this.lastProcessedStation && !this.processingStation) {
                    this.processingStation = true;
                    console.log(`🚉 Estación ${vuelta} detectada (de Vuelta número)`);
                    
                    // Marcar como evento de estación para el siguiente procesamiento
                    this.latestData.stationReached = true;
                    this.latestData.stationIndex = vuelta;
                    this.latestData.station = vuelta;
                    this.currentStation = vuelta;
                }
            }
        }
        
        // Parsear "Tiempo de vuelta: X s"
        if (line.includes('Tiempo de vuelta:')) {
            const match = line.match(/Tiempo de vuelta:\s*([\d.]+)\s*s/);
            if (match) {
                this.latestData.time = parseFloat(match[1]);
                this.latestData.travelTime = parseFloat(match[1]);
            }
        }
        
        // Detectar fin de resultados para procesar una sola vez
        if (line.includes('-------------------') && this.processingStation) {
            // Si tenemos estación y tiempo, crear evento completo
            if (this.latestData.stationReached && this.latestData.time && 
                this.currentStation !== this.lastProcessedStation) {
                
                const arrivalTime = Date.now();
                const departureTime = arrivalTime - (this.latestData.time * 1000);
                
                // Calcular velocidad y aceleración con distancia 3.33m
                const distance = 3.33;
                const velocity = distance / this.latestData.time;
                const acceleration = (2 * distance) / (this.latestData.time * this.latestData.time);
                
                const arrivalData = {
                    eventType: 'arrival',
                    type: 'arduino',
                    station: this.latestData.station,
                    stationIndex: this.latestData.station,
                    time: this.latestData.time,
                    distance: distance,
                    totalDistance: this.latestData.station * distance,
                    velocity: velocity,
                    acceleration: acceleration,
                    travelTime: this.latestData.time,
                    arrivalTime: arrivalTime,
                    departureTime: departureTime,
                    stationReached: true
                };
                
                console.log(`🚉 LLEGADA a estación ${this.latestData.station}`);
                console.log(`   ⏱️  Tiempo: ${this.latestData.time.toFixed(4)}s`);
                console.log(`   📏 Distancia: ${distance} m`);
                console.log(`   🚄 Velocidad: ${velocity.toFixed(4)} m/s`);
                console.log(`   ⚡ Aceleración: ${acceleration.toFixed(4)} m/s²`);
                
                // Marcar como procesado
                this.lastProcessedStation = this.currentStation;
                this.processingStation = false;
                this.latestData.stationReached = false;
                
                return arrivalData;
            }
            
            // Resetear flags
            this.processingStation = false;
            this.latestData.stationReached = false;
        }

        // Parsear formato clave:valor (si se usa formato alternativo)
        const data = {};
        const pairs = line.split(',');
        
        for (const pair of pairs) {
            const [key, value] = pair.split(':');
            if (key && value) {
                const keyLower = key.trim().toLowerCase();
                const numValue = parseFloat(value.trim());
                
                if (!isNaN(numValue)) {
                    if (keyLower === 'time' || keyLower === 't') {
                        data.time = numValue;
                    } else if (keyLower === 'velocity' || keyLower === 'vel' || keyLower === 'v') {
                        data.velocity = numValue;
                    } else if (keyLower === 'acceleration' || keyLower === 'acc' || keyLower === 'a') {
                        data.acceleration = numValue;
                    } else if (keyLower === 'distance' || keyLower === 'dist' || keyLower === 'd') {
                        data.distance = numValue;
                    }
                }
            }
        }

        // Validar que tengamos al menos algún dato
        if (Object.keys(data).length > 0) {
            return {
                time: data.time || this.latestData.time,
                velocity: data.velocity || this.latestData.velocity,
                acceleration: data.acceleration || this.latestData.acceleration,
                distance: data.distance || this.latestData.distance
            };
        }

        return null;
    }

    /**
     * Establece el callback para recibir datos
     */
    onData(callback) {
        this.dataCallback = callback;
    }

    /**
     * Establece el callback para errores
     */
    onError(callback) {
        this.errorCallback = callback;
    }

    /**
     * Obtiene los últimos datos recibidos
     */
    getLatestData() {
        return { ...this.latestData };
    }

    /**
     * Envía un comando al Arduino
     */
    sendCommand(command) {
        if (this.isConnected && this.port) {
            return new Promise((resolve, reject) => {
                this.port.write(`${command}\n`, (error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            });
        } else {
            throw new Error('Arduino no conectado');
        }
    }

    /**
     * Desconecta del Arduino
     */
    async disconnect() {
        if (this.port && this.isConnected) {
            return new Promise((resolve) => {
                this.port.close((error) => {
                    if (error) {
                        console.error('Error cerrando puerto:', error);
                    }
                    this.isConnected = false;
                    console.log('Desconectado de Arduino');
                    resolve();
                });
            });
        }
    }

    /**
     * Verifica el estado de conexión
     */
    getStatus() {
        return {
            connected: this.isConnected,
            port: this.portPath,
            baudRate: this.baudRate,
            latestData: this.latestData
        };
    }
}

module.exports = ArduinoDataReader;
