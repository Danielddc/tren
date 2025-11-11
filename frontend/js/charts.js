/**
 * Manejador de gráficas en tiempo real usando Chart.js
 */

class TrainChartManager {
    constructor() {
        this.charts = {};
        this.dataLimit = 1000; // Máximo número de puntos a mostrar
        this.maxLapCharts = 20; // máximo número de tarjetas de vuelta en pantalla
        this.updateInterval = 50; // ms
        
        // Configuración común para todas las gráficas
        this.commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Tiempo (s)',
                        color: 'rgba(255, 255, 255, 0.8)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        color: 'rgba(255, 255, 255, 0.8)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    borderWidth: 1
                }
            },
            elements: {
                point: {
                    radius: 0,
                    hitRadius: 5
                },
                line: {
                    borderWidth: 2,
                    tension: 0.1
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            animation: {
                duration: 0 // Desactivar animaciones para mejor rendimiento
            }
        };
        
        this.initializeCharts();
    }

    /**
     * Safe initialization: only create charts if the corresponding canvas elements exist.
     * This method is called from the constructor but each create*Chart checks for DOM elements.
     */

    /**
     * Inicializa todas las gráficas
     */
    initializeCharts() {
        this.createVelocityChart();
        this.createPositionChart();
        this.createAccelerationChart();
    }

    /**
     * Crea la gráfica de velocidad vs tiempo
     */
    createVelocityChart() {
        const el = document.getElementById('velocityChart');
        if (!el) return; // canvas not present in DOM
        const ctx = el.getContext('2d');

        this.charts.velocity = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Velocidad (m/s)',
                    data: [],
                    borderColor: 'rgba(46, 213, 115, 0.95)',
                    backgroundColor: 'rgba(46, 213, 115, 0.06)',
                    fill: true
                }]
            },
            options: {
                ...this.commonOptions,
                scales: {
                    ...this.commonOptions.scales,
                    y: {
                        ...this.commonOptions.scales.y,
                        title: {
                            display: true,
                            text: 'Velocidad (m/s)',
                            color: '#222'
                        },
                        ticks: { color: '#333' }
                    }
                }
            }
        });
    }

    /**
     * Crea la gráfica de posición vs tiempo
     */
    createPositionChart() {
        const el = document.getElementById('positionChart');
        if (!el) return;
        const ctx = el.getContext('2d');

        this.charts.position = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Posición (m)',
                    data: [],
                    borderColor: 'rgba(52, 152, 219, 0.95)',
                    backgroundColor: 'rgba(52, 152, 219, 0.06)',
                    fill: true
                }]
            },
            options: {
                ...this.commonOptions,
                scales: {
                    ...this.commonOptions.scales,
                    y: {
                        ...this.commonOptions.scales.y,
                        title: {
                            display: true,
                            text: 'Posición (m)',
                            color: '#222'
                        },
                        ticks: { color: '#333' }
                    }
                }
            }
        });
    }

    /**
     * Crea la gráfica de aceleración vs tiempo
     */
    createAccelerationChart() {
        const el = document.getElementById('accelerationChart');
        if (!el) return;
        const ctx = el.getContext('2d');

        this.charts.acceleration = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Aceleración (m/s²)',
                    data: [],
                    borderColor: 'rgba(231, 76, 60, 0.95)',
                    backgroundColor: 'rgba(231, 76, 60, 0.04)',
                    fill: true
                }]
            },
            options: {
                ...this.commonOptions,
                scales: {
                    ...this.commonOptions.scales,
                    y: {
                        ...this.commonOptions.scales.y,
                        title: {
                            display: true,
                            text: 'Aceleración (m/s²)',
                            color: '#222'
                        },
                        ticks: { color: '#333' }
                    }
                }
            }
        });
    }

    /**
     * Actualiza todas las gráficas con nuevos datos
     */
    updateCharts(data) {
        const { time, velocity, position, acceleration, stationEvent } = data;
        
        // Actualizar gráfica de velocidad
        this.addDataPoint('velocity', time, velocity);
        
        // Actualizar gráfica de posición
        this.addDataPoint('position', time, position);
        
        // Actualizar gráfica de aceleración
        this.addDataPoint('acceleration', time, acceleration);
        
        // Marcar estación en las gráficas si hubo evento
        if (stationEvent) {
            this.addStationMarker(stationEvent);
        }
    }

    /**
     * Añade un punto de datos a una gráfica específica
     */
    addDataPoint(chartName, x, y) {
        const chart = this.charts[chartName];
        if (!chart) return;

        const dataset = chart.data.datasets[0];
        dataset.data.push({ x, y });

        // Limitar número de puntos para rendimiento
        if (dataset.data.length > this.dataLimit) {
            dataset.data.shift();
        }

        chart.update('none'); // Actualizar sin animación
    }

    /**
     * Añade marcadores de estación en las gráficas
     */
    addStationMarker(stationEvent) {
        const { stationIndex, arrivalTime, position } = stationEvent;
        
        // Añadir línea vertical en el tiempo de llegada a todas las gráficas
        Object.keys(this.charts).forEach(chartName => {
            const chart = this.charts[chartName];
            
            // Crear anotación de estación (si Chart.js tiene plugin de anotaciones)
            if (chart.options.plugins && chart.options.plugins.annotation) {
                chart.options.plugins.annotation.annotations[`station_${stationIndex}`] = {
                    type: 'line',
                    scaleID: 'x',
                    value: arrivalTime,
                    borderColor: 'rgba(255, 193, 7, 0.8)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    label: {
                        content: `Est. ${stationIndex + 1}`,
                        enabled: true,
                        position: 'top'
                    }
                };
            }
        });
    }

    /**
     * Limpia todas las gráficas
     */
    clearCharts() {
        Object.keys(this.charts).forEach(chartName => {
            const chart = this.charts[chartName];
            chart.data.datasets[0].data = [];
            chart.update();
        });
    }

    /**
     * Redimensiona las gráficas (útil para cambios de ventana)
     */
    resizeCharts() {
        Object.keys(this.charts).forEach(chartName => {
            this.charts[chartName].resize();
        });
    }

    /**
     * Actualiza la escala Y automáticamente basada en los datos
     */
    updateScales() {
        Object.keys(this.charts).forEach(chartName => {
            const chart = this.charts[chartName];
            const dataset = chart.data.datasets[0];
            
            if (dataset.data.length > 0) {
                const values = dataset.data.map(point => point.y);
                const min = Math.min(...values);
                const max = Math.max(...values);
                const range = max - min;
                const padding = range * 0.1; // 10% padding
                
                chart.options.scales.y.min = min - padding;
                chart.options.scales.y.max = max + padding;
            }
        });
    }

    /**
     * Exporta los datos de las gráficas como CSV
     */
    exportData() {
        const velocityData = this.charts.velocity.data.datasets[0].data;
        const positionData = this.charts.position.data.datasets[0].data;
        const accelerationData = this.charts.acceleration.data.datasets[0].data;
        
        let csv = 'Tiempo,Velocidad,Posicion,Aceleracion\n';
        
        for (let i = 0; i < velocityData.length; i++) {
            const time = velocityData[i]?.x || 0;
            const velocity = velocityData[i]?.y || 0;
            const position = positionData[i]?.y || 0;
            const acceleration = accelerationData[i]?.y || 0;
            
            csv += `${time},${velocity},${position},${acceleration}\n`;
        }
        
        // Crear y descargar archivo
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `simulacion_tren_${new Date().toISOString().slice(0, 19)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Obtiene estadísticas de los datos actuales
     */
    getStatistics() {
        const velocityData = this.charts.velocity.data.datasets[0].data;
        const positionData = this.charts.position.data.datasets[0].data;
        
        if (velocityData.length === 0) return null;
        
        const velocities = velocityData.map(p => p.y);
        const maxVelocity = Math.max(...velocities);
        const minVelocity = Math.min(...velocities);
        const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;
        
        const finalPosition = positionData.length > 0 ? positionData[positionData.length - 1].y : 0;
        const totalTime = velocityData.length > 0 ? velocityData[velocityData.length - 1].x : 0;
        
        return {
            maxVelocity: maxVelocity.toFixed(2),
            minVelocity: minVelocity.toFixed(2),
            avgVelocity: avgVelocity.toFixed(2),
            finalPosition: finalPosition.toFixed(2),
            totalTime: totalTime.toFixed(2),
            dataPoints: velocityData.length
        };
    }
}

// Crear instancia global al cargarse el DOM para asegurar que los elementos existen
window.addEventListener('DOMContentLoaded', () => {
    try {
        window.chartManager = new TrainChartManager();
    } catch (err) {
        console.error('No se pudo inicializar TrainChartManager:', err);
        window.chartManager = null;
    }
});

// Redimensionar gráficas cuando cambie el tamaño de ventana
window.addEventListener('resize', () => {
    if (window.chartManager) {
        window.chartManager.resizeCharts();
    }
});

/**
 * Crea una gráfica combinada para una vuelta/estación con tres series: posición, velocidad y aceleración.
 * Recibe el objeto `stationEvent` con al menos: stationIndex, travelTime (s), distance (m), velocity (m/s), acceleration (m/s^2)
 */
TrainChartManager.prototype.createLapChart = function(stationEvent) {
    if (!stationEvent) return;

    // Asegurar que exista el contenedor estático (index.html lo crea, pero por compatibilidad lo creamos si falta)
    if (!document.getElementById('lapChartsContainer')) {
        const main = document.querySelector('.main-container');
        const wrap = document.createElement('div');
        wrap.id = 'lapChartsWrapper';
        wrap.className = 'lap-charts-wrapper';
        wrap.style.display = 'none';
        wrap.innerHTML = '<h3>Gráficas por Vuelta</h3><div id="lapChartsContainer" class="lap-charts-container"></div>';
        if (main && main.parentNode) main.parentNode.insertBefore(wrap, main.nextSibling);
    }

    const container = document.getElementById('lapChartsContainer');
    if (!container) return;

    // Mostrar wrapper cuando haya gráficas
    const wrapperEl = document.getElementById('lapChartsWrapper');
    if (wrapperEl) wrapperEl.style.display = 'block';

    // Inicializar array de lapCharts y limitar número de tarjetas para mantener orden
    this._lapCharts = this._lapCharts || [];
    if (this._lapCharts.length >= (this.maxLapCharts || 20)) {
        // remover la más antigua
        const oldest = this._lapCharts.shift();
        try { if (oldest && oldest.chart) oldest.chart.destroy(); } catch (e) {}
        try { if (oldest && oldest.card && oldest.card.parentNode) oldest.card.parentNode.removeChild(oldest.card); } catch (e) {}
    }

    const idx = stationEvent.stationIndex != null ? stationEvent.stationIndex : (this._lapCounter = (this._lapCounter || 0));
    const label = stationEvent.stationName || `Vuelta ${idx}`;

    const travelTime = (stationEvent.travelTime && stationEvent.travelTime > 0) ? stationEvent.travelTime : (stationEvent.time || 0);
    const distance = stationEvent.distance || stationEvent.position || 0;
    let acceleration = stationEvent.acceleration;
    if (!acceleration || !isFinite(acceleration)) {
        // Calcular aceleración suponiendo v0 = 0: a = 2*d / t^2
        acceleration = travelTime > 0 ? (2 * distance) / (travelTime * travelTime) : 0;
    }

    const points = 60; // número de puntos de la serie (más puntos para curvas más suaves)
    const dt = travelTime / Math.max(1, points - 1);
    const timeData = [];
    const positionData = [];
    const velocityData = [];
    const accelerationData = [];

    for (let i = 0; i < points; i++) {
        const t = +(i * dt).toFixed(4);
        const pos = 0.5 * acceleration * t * t; // x = 0.5 * a * t^2 (v0=0)
        const vel = acceleration * t; // v = a * t
        const acc = acceleration; // constante

        timeData.push(t);
        positionData.push({ x: t, y: +pos.toFixed(4) });
        velocityData.push({ x: t, y: +vel.toFixed(4) });
        accelerationData.push({ x: t, y: +acc.toFixed(4) });
    }

    // Crear elemento de tarjeta para la gráfica
    const card = document.createElement('div');
    card.className = 'lap-chart-card';
    const canvasId = `lapChart_${idx}_${Date.now()}`;
    card.innerHTML = `
        <div class="lap-chart-header">
            <strong>${label}</strong>
            <span class="lap-meta">Tiempo: ${travelTime.toFixed(3)} s — Distancia: ${distance.toFixed(2)} m</span>
        </div>
        <div class="lap-chart-canvas-wrapper"><canvas id="${canvasId}"></canvas></div>
    `;

    container.appendChild(card);

    const ctx = document.getElementById(canvasId).getContext('2d');

    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Posición (m)',
                    data: positionData,
                    borderColor: 'rgba(52, 152, 219, 0.95)',
                    backgroundColor: 'rgba(52, 152, 219, 0.08)',
                    yAxisID: 'yPosition',
                    fill: true
                },
                {
                    label: 'Velocidad (m/s)',
                    data: velocityData,
                    borderColor: 'rgba(46, 213, 115, 0.95)',
                    backgroundColor: 'rgba(46, 213, 115, 0.06)',
                    yAxisID: 'yVelocity',
                    fill: false,
                    borderDash: [3,2]
                },
                {
                    label: 'Aceleración (m/s²)',
                    data: accelerationData,
                    borderColor: 'rgba(231, 76, 60, 0.95)',
                    backgroundColor: 'rgba(231, 76, 60, 0.06)',
                    yAxisID: 'yAcceleration',
                    fill: false,
                    borderDash: [6,4]
                }
            ]
        },
        options: {
            // Base options pero adaptadas para fondo claro (gráfica blanca)
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: { display: true, text: 'Tiempo (s)', color: '#222' },
                    ticks: { color: '#333', font: { size: 12 } },
                    grid: { color: 'rgba(0,0,0,0.06)' }
                },
                yPosition: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'Posición (m)', color: '#222' },
                    ticks: { color: '#333', font: { size: 12 } },
                    grid: { color: 'rgba(0,0,0,0.06)' }
                },
                yVelocity: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: 'Velocidad (m/s)', color: '#222' },
                    ticks: { color: '#333', font: { size: 12 } },
                    grid: { drawOnChartArea: false }
                },
                yAcceleration: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: 'Aceleración (m/s²)', color: '#222' },
                    ticks: { color: '#333', font: { size: 12 } },
                    grid: { drawOnChartArea: false },
                    offset: true
                }
            },
            plugins: {
                legend: { display: true, position: 'bottom', labels: { color: '#222', font: { size: 12 } } },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    titleFont: { size: 13 },
                    bodyFont: { size: 12 }
                }
            },
            elements: {
                point: { radius: 0, hitRadius: 6 },
                line: { borderWidth: 2, tension: 0.15 }
            }
        }
    });

    // Guardar referencia (opcional) y actualizar contador de vueltas
    this._lapCharts.push({ stationIndex: idx, chart, card, canvasId });
    this._lapCounter = (this._lapCounter || 0) + 1;
};

/**
 * Limpia todas las gráficas por vuelta y oculta el wrapper
 */
TrainChartManager.prototype.clearLapCharts = function() {
    if (!this._lapCharts || this._lapCharts.length === 0) return;
    this._lapCharts.forEach(entry => {
        try { if (entry.chart) entry.chart.destroy(); } catch (e) {}
        try { if (entry.card && entry.card.parentNode) entry.card.parentNode.removeChild(entry.card); } catch (e) {}
    });
    this._lapCharts = [];
    const wrapperEl = document.getElementById('lapChartsWrapper');
    if (wrapperEl) wrapperEl.style.display = 'none';
};