/**
 * Motor de física para simulación de tren
 * Implementa ecuaciones cinemáticas y detección de estaciones
 */

class TrainPhysics {
    constructor(initialParams = {}) {
        // Parámetros de simulación
        this.v0 = initialParams.initialVelocity || 0;     // Velocidad inicial (m/s)
        this.a = initialParams.acceleration || 1;         // Aceleración (m/s²)
        this.dt = initialParams.timeStep || 0.05;         // Paso de tiempo (s)
        this.stationDistance = initialParams.stationDistance || 1000; // Distancia entre estaciones (m)
        this.numStations = initialParams.numStations || 5; // Número de estaciones
        this.stationNames = initialParams.stationNames || this.generateDefaultStationNames(); // Nombres de estaciones
        
        // Estado actual del tren
        this.reset();
        
        // Configuración de límites
        this.maxVelocity = 100;    // m/s (360 km/h)
        this.maxAcceleration = 10; // m/s²
        this.minAcceleration = -10; // m/s²
    }

    /**
     * Genera nombres por defecto para las estaciones
     */
    generateDefaultStationNames() {
        const defaultNames = [];
        for (let i = 0; i < this.numStations; i++) {
            defaultNames.push(`Estación ${i + 1}`);
        }
        return defaultNames;
    }

    /**
     * Actualiza los nombres de las estaciones
     */
    setStationNames(names) {
        if (Array.isArray(names) && names.length >= this.numStations) {
            this.stationNames = names.slice(0, this.numStations);
        }
    }

    /**
     * Reinicia la simulación al estado inicial
     */
    reset() {
        this.t = 0;           // Tiempo actual (s)
        this.x = 0;           // Posición actual (m)
        this.v = this.v0;     // Velocidad actual (m/s)
        this.currentStation = 0; // Índice de la próxima estación
        this.stationsReached = []; // Log de estaciones alcanzadas
        this.isRunning = false;
        this.isFinished = false;
    }

    /**
     * Actualiza la aceleración con validación de límites
     */
    setAcceleration(newAcceleration) {
        this.a = Math.max(this.minAcceleration, 
                 Math.min(this.maxAcceleration, newAcceleration));
    }

    /**
     * Calcula la posición de una estación específica
     */
    getStationPosition(stationIndex) {
        return (stationIndex + 1) * this.stationDistance;
    }

    /**
     * Detecta si el tren ha cruzado una estación en este paso
     */
    detectStationCrossing(prevX, currentX) {
        if (this.currentStation >= this.numStations) return null;
        
        const stationPos = this.getStationPosition(this.currentStation);
        
        // Verificar si hubo cruce (posición previa < estación <= posición actual)
        if (prevX < stationPos && currentX >= stationPos) {
            // Interpolación lineal para tiempo exacto de llegada
            const crossingRatio = (stationPos - prevX) / (currentX - prevX);
            const exactTime = this.t - this.dt + (crossingRatio * this.dt);
            
            return {
                stationIndex: this.currentStation,
                arrivalTime: exactTime,
                position: stationPos,
                velocity: this.v, // Velocidad aproximada en el momento del cruce
                stationName: this.stationNames[this.currentStation] || `Estación ${this.currentStation + 1}`
            };
        }
        
        return null;
    }

    /**
     * Avanza la simulación un paso de tiempo
     */
    step() {
        if (!this.isRunning || this.isFinished) return null;
        
        const prevX = this.x;
        
        // Integración numérica (método de Euler)
        this.x += this.v * this.dt + 0.5 * this.a * this.dt * this.dt;
        this.v += this.a * this.dt;
        this.t += this.dt;
        
        // Aplicar límite de velocidad
        if (Math.abs(this.v) > this.maxVelocity) {
            this.v = Math.sign(this.v) * this.maxVelocity;
        }
        
        // Detectar cruce de estación
        const stationEvent = this.detectStationCrossing(prevX, this.x);
        if (stationEvent) {
            this.stationsReached.push(stationEvent);
            this.currentStation++;
            
            // Verificar si es la última estación
            if (this.currentStation >= this.numStations) {
                this.isFinished = true;
            }
        }
        
        return {
            time: this.t,
            position: this.x,
            velocity: this.v,
            acceleration: this.a,
            stationEvent: stationEvent,
            isFinished: this.isFinished
        };
    }

    /**
     * Calcula analíticamente el tiempo para alcanzar una distancia específica
     * Resuelve: ½at² + v₀t - d = 0
     */
    calculateAnalyticalArrivalTime(distance) {
        const v0 = this.v;
        const a = this.a;
        
        if (Math.abs(a) < 1e-10) {
            // Caso especial: a ≈ 0 (movimiento uniforme)
            return v0 > 0 ? (distance - this.x) / v0 : Infinity;
        }
        
        // Fórmula cuadrática: at² + bt + c = 0
        const aCoeff = 0.5 * a;
        const bCoeff = v0;
        const cCoeff = this.x - distance;
        
        const discriminant = bCoeff * bCoeff - 4 * aCoeff * cCoeff;
        
        if (discriminant < 0) {
            // No hay solución real - la estación no será alcanzada
            return null;
        }
        
        const sqrtDisc = Math.sqrt(discriminant);
        const t1 = (-bCoeff + sqrtDisc) / (2 * aCoeff);
        const t2 = (-bCoeff - sqrtDisc) / (2 * aCoeff);
        
        // Seleccionar la solución positiva más pequeña
        const solutions = [t1, t2].filter(t => t > 0);
        return solutions.length > 0 ? Math.min(...solutions) : null;
    }

    /**
     * Calcula tiempos de llegada a todas las estaciones restantes
     */
    calculateAllArrivalTimes() {
        const arrivalTimes = [];
        
        for (let i = this.currentStation; i < this.numStations; i++) {
            const stationPos = this.getStationPosition(i);
            const timeToStation = this.calculateAnalyticalArrivalTime(stationPos);
            
            arrivalTimes.push({
                stationIndex: i,
                stationName: this.stationNames[i] || `Estación ${i + 1}`,
                position: stationPos,
                arrivalTime: timeToStation ? this.t + timeToStation : null,
                estimatedArrivalTime: timeToStation ? (this.t + timeToStation).toFixed(2) + 's' : 'No alcanzable',
                reachable: timeToStation !== null
            });
        }
        
        return arrivalTimes;
    }

    /**
     * Inicia la simulación
     */
    start() {
        this.isRunning = true;
    }

    /**
     * Pausa la simulación
     */
    pause() {
        this.isRunning = false;
    }

    /**
     * Detiene y reinicia la simulación
     */
    stop() {
        this.isRunning = false;
        this.reset();
    }

    /**
     * Obtiene el estado completo actual del tren
     */
    getState() {
        return {
            time: this.t,
            position: this.x,
            velocity: this.v,
            acceleration: this.a,
            currentStation: this.currentStation,
            stationsReached: this.stationsReached,
            isRunning: this.isRunning,
            isFinished: this.isFinished,
            totalStations: this.numStations,
            stationNames: this.stationNames,
            nextStationDistance: this.currentStation < this.numStations ? 
                this.getStationPosition(this.currentStation) - this.x : 0,
            nextStationName: this.currentStation < this.numStations ? 
                this.stationNames[this.currentStation] : null
        };
    }
}

module.exports = TrainPhysics;