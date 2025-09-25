/**
 * Manejador de gráficas en tiempo real usando Chart.js
 */

class TrainChartManager {
    constructor() {
        this.charts = {};
        this.dataLimit = 1000; // Máximo número de puntos a mostrar
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
        const ctx = document.getElementById('velocityChart').getContext('2d');
        
        this.charts.velocity = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Velocidad (m/s)',
                    data: [],
                    borderColor: 'rgba(46, 213, 115, 0.8)',
                    backgroundColor: 'rgba(46, 213, 115, 0.1)',
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
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
                    }
                }
            }
        });
    }

    /**
     * Crea la gráfica de posición vs tiempo
     */
    createPositionChart() {
        const ctx = document.getElementById('positionChart').getContext('2d');
        
        this.charts.position = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Posición (m)',
                    data: [],
                    borderColor: 'rgba(52, 152, 219, 0.8)',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
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
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
                    }
                }
            }
        });
    }

    /**
     * Crea la gráfica de aceleración vs tiempo
     */
    createAccelerationChart() {
        const ctx = document.getElementById('accelerationChart').getContext('2d');
        
        this.charts.acceleration = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Aceleración (m/s²)',
                    data: [],
                    borderColor: 'rgba(231, 76, 60, 0.8)',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
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
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
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

// Crear instancia global
window.chartManager = new TrainChartManager();

// Redimensionar gráficas cuando cambie el tamaño de ventana
window.addEventListener('resize', () => {
    if (window.chartManager) {
        window.chartManager.resizeCharts();
    }
});