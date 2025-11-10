/**
 * Test simple para verificar conexión con Arduino
 */

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

console.log('🔍 Buscando Arduino en COM3...\n');

const port = new SerialPort({
    path: 'COM3',
    baudRate: 9600,
    autoOpen: false
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

port.on('open', () => {
    console.log('✅ Puerto COM3 abierto correctamente');
    console.log('📡 Esperando datos del Arduino...\n');
});

parser.on('data', (line) => {
    console.log('📨 Recibido:', line.trim());
});

port.on('error', (err) => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});

port.on('close', () => {
    console.log('\n⚠️ Puerto cerrado');
    process.exit(0);
});

// Abrir puerto
port.open((err) => {
    if (err) {
        console.error('❌ Error abriendo puerto:', err.message);
        console.log('\n💡 Soluciones:');
        console.log('   1. Cierra el Monitor Serial de Arduino IDE');
        console.log('   2. Desconecta y reconecta el Arduino');
        console.log('   3. Verifica que COM3 es el puerto correcto');
        process.exit(1);
    }
});

// Cerrar con Ctrl+C
process.on('SIGINT', () => {
    console.log('\n\n🛑 Cerrando...');
    port.close();
});

console.log('⌨️  Presiona Ctrl+C para salir\n');
