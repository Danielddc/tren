# 🚂 Instrucciones de Uso - Sistema de Monitoreo de Tren con Arduino

## ✅ Sistema Configurado

El sistema ahora muestra únicamente los **datos de llegada del tren** a cada estación. Cada vez que pases el objeto por el sensor IR (completando 2 pasadas = 1 vuelta), el sistema registrará la llegada del tren con todos sus datos.

---

## 🎯 Cómo Funciona

### 1. **Sistema de Estaciones**
- **1 vuelta = 1 estación alcanzada**
- El Arduino cuenta cada vuelta (2 pasadas del sensor)
- Cada vuelta se convierte en la llegada a una estación diferente
- La distancia se calcula como: `Estación × 3.20 metros`

### 2. **Datos que se Muestran por Estación**
- ⏱️ **Tiempo de Llegada**
- � **Distancia recorrida**
- � **Velocidad al llegar**

---

## 🚀 Pasos para Usar el Sistema

### **Paso 1: Iniciar el Servidor**
El servidor debe estar corriendo:
```powershell
cd c:\Users\Pc\OneDrive\Desktop\TREN\backend
node src\server.js
```

### **Paso 2: Abrir la Interfaz Web**
1. Abre tu navegador
2. Ve a: **http://localhost:8080**
3. El sistema se conectará automáticamente al Arduino en COM3

### **Paso 3: Configurar Estaciones (Opcional)**
En la parte superior de la interfaz:
1. **Número de Estaciones**: Define cuántas estaciones esperas registrar
2. **Nombres de Estaciones**: Asigna nombres personalizados o usa "Generar Nombres Automáticos"

### **Paso 4: Verificar Conexión Arduino**
En el panel superior derecho:
- Debe mostrar: **● Conectado** (en verde)
- Puerto: **COM3**
- Baud Rate: **9600**

### **Paso 5: Registrar Llegadas**
1. **Prepara tu Arduino** con el objeto detector
2. **Pasa el objeto 2 veces** por el sensor IR (esto completa 1 vuelta)
3. **En la interfaz web verás**:
   - Tarjeta de datos de llegada en el panel central
   - Datos actualizados en tiempo real (panel derecho)
   - Nueva entrada en el historial de estaciones (panel inferior)

---

## � Interfaz del Sistema

### **Panel Superior Izquierdo: Configuración de Estaciones**
- Número de estaciones a monitorear
- Nombres personalizados para cada estación
- Botón de generación automática de nombres

### **Panel Superior Derecho: Arduino**
- Estado de conexión
- Selector de puerto COM
- Botones de conectar/desconectar

### **Panel Central: Datos de Llegada del Tren**
Cada llegada muestra:
```
🚂 Estación 1                    Estación #1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏱️ Tiempo de Llegada: 2.50 s
📏 Distancia: 3.20 m
🚄 Velocidad: 1.28 m/s
```

### **Panel Derecho Superior: Estado Actual**
- Tiempo transcurrido
- Posición actual
- Velocidad actual

### **Panel Derecho Inferior: Datos Arduino en Tiempo Real**
- Tiempo
- Velocidad
- Aceleración
- Distancia

### **Panel Inferior: Historial de Estaciones**
Lista completa de todas las estaciones alcanzadas con sus tiempos

---

## 🔧 Formato de Datos del Arduino

Tu Arduino envía datos en este formato:
```
--- RESULTADOS ---
Vuelta número: 1
Tiempo total: 2.5000 s
Velocidad media: 1.2800 m/s
Aceleración media: 0.5120 m/s²
-------------------
```

El servidor automáticamente:
1. ✅ Detecta "Vuelta número: X"
2. ✅ Registra la estación X
3. ✅ Calcula distancia = X × 3.20m
4. ✅ Muestra tarjeta de llegada en el panel central
5. ✅ Actualiza el historial en tiempo real

---

## 🎨 Características de la Interfaz

- ✨ **Sin gráficas** - Solo datos de llegada
- 📊 **Tarjetas visuales** por cada estación
- 🎨 **Animaciones** cuando llega nueva información
- 📜 **Historial completo** de todas las llegadas
- 🔄 **Actualización automática** en tiempo real
- 📱 **Diseño responsive** adaptable

---

## 🐛 Solución de Problemas

### **Arduino no se conecta**
```powershell
# Verificar puertos disponibles
Get-WmiObject Win32_SerialPort | Select-Object Name, DeviceID
```
Asegúrate de que:
- El Arduino esté conectado por USB
- El puerto sea COM3
- No hay otro programa usando el puerto

### **No aparecen las estaciones**
- Verifica que completes 2 pasadas por el sensor (1 vuelta)
- Revisa la consola del servidor para mensajes
- Asegúrate de que el Arduino esté enviando "Vuelta número: X"

### **Reiniciar Sistema**
```powershell
# Detener servidor
Stop-Process -Name node -Force

# Reiniciar
cd c:\Users\Pc\OneDrive\Desktop\TREN\backend
node src\server.js
```

---

## 📝 Notas Importantes

1. ⚠️ **NO modifiques el código del Arduino** - el servidor se adapta a tu formato
2. 🔄 El sistema se conecta automáticamente al Arduino al cargar la página
3. � Los datos se muestran en tarjetas individuales por estación
4. 💾 El historial se acumula durante toda la sesión
5. 🎯 Cada vuelta genera una nueva tarjeta de datos

---

## 🎉 ¡Sistema Simplificado!

La interfaz ahora es más limpia y enfocada en mostrar:
- ✅ Datos de llegada por estación
- ✅ Estado actual del tren
- ✅ Datos en tiempo real del Arduino
- ✅ Historial completo de llegadas

**¡Cada pasada del tren será registrada con todos sus datos!** 🚂🎊
