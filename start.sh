#!/bin/bash

# Script para iniciar la aplicación completa (frontend + backend)
# Gestiona puertos automáticamente y compila todo lo necesario

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir con color
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Función para encontrar puerto disponible
find_available_port() {
    local start_port=$1
    local port=$start_port

    while lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; do
        print_warning "Puerto $port ocupado, probando siguiente..."
        port=$((port + 1))
    done

    echo $port
}

# Función para matar procesos en un puerto
kill_port() {
    local port=$1
    print_info "Verificando puerto $port..."

    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Puerto $port ocupado. Liberando..."
        lsof -ti:$port | xargs -r kill -9 2>/dev/null || true
        sleep 1
        print_success "Puerto $port liberado"
    else
        print_success "Puerto $port disponible"
    fi
}

# Función para verificar si node_modules existe
check_dependencies() {
    local dir=$1
    if [ ! -d "$dir/node_modules" ]; then
        print_warning "Dependencias no encontradas en $dir"
        return 1
    fi
    return 0
}

# Función para instalar dependencias
install_dependencies() {
    local dir=$1
    local name=$2

    print_info "Instalando dependencias para $name..."
    cd "$dir"
    npm install
    print_success "Dependencias instaladas para $name"
    cd - > /dev/null
}

# Banner
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   GRAPHS - Sistema de Arranque        ║${NC}"
echo -e "${GREEN}║   Análisis de comunidades digitales   ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════╝${NC}"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "start.sh" ]; then
    print_error "Este script debe ejecutarse desde el directorio raíz del proyecto"
    exit 1
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado"
    exit 1
fi

print_success "Node.js $(node --version) detectado"

# Verificar npm
if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado"
    exit 1
fi

print_success "npm $(npm --version) detectado"

# ==========================================
# PASO 1: Verificar e instalar dependencias
# ==========================================

print_info "Verificando dependencias..."

# Backend
if ! check_dependencies "./server"; then
    install_dependencies "./server" "Backend"
fi

# Frontend
if ! check_dependencies "./app"; then
    install_dependencies "./app" "Frontend"
fi

print_success "Todas las dependencias verificadas"

# ==========================================
# PASO 2: Limpiar puertos
# ==========================================

print_info "Limpiando puertos..."

kill_port 3001  # Backend por defecto
kill_port 5173  # Frontend por defecto

sleep 2

# ==========================================
# PASO 3: Encontrar puertos disponibles
# ==========================================

print_info "Buscando puertos disponibles..."

BACKEND_PORT=$(find_available_port 3001)
FRONTEND_PORT=$(find_available_port 5173)

print_success "Backend usará puerto: $BACKEND_PORT"
print_success "Frontend usará puerto: $FRONTEND_PORT"

# ==========================================
# PASO 4: Actualizar configuración si es necesario
# ==========================================

if [ "$BACKEND_PORT" != "3001" ]; then
    print_warning "Actualizando configuración del backend al puerto $BACKEND_PORT"

    # Actualizar .env del servidor si existe
    if [ -f "./server/.env" ]; then
        if grep -q "^PORT=" "./server/.env"; then
            sed -i "s/^PORT=.*/PORT=$BACKEND_PORT/" "./server/.env"
        else
            echo "PORT=$BACKEND_PORT" >> "./server/.env"
        fi
    fi
fi

# ==========================================
# PASO 5: Compilar TypeScript del backend
# ==========================================

print_info "Compilando backend TypeScript..."
cd server
npm run build 2>/dev/null || print_warning "No se pudo compilar el backend (puede que no tenga build script)"
cd ..

# ==========================================
# PASO 6: Iniciar Backend
# ==========================================

print_info "Iniciando servidor backend en puerto $BACKEND_PORT..."

cd server
PORT=$BACKEND_PORT npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Guardar PID del backend
echo $BACKEND_PID > .backend.pid

# Esperar a que el backend esté listo
print_info "Esperando a que el backend esté listo..."
sleep 3

# Verificar que el backend está corriendo
if ! ps -p $BACKEND_PID > /dev/null; then
    print_error "El backend no pudo iniciarse. Revisa backend.log"
    cat backend.log
    exit 1
fi

print_success "Backend iniciado (PID: $BACKEND_PID)"

# ==========================================
# PASO 7: Iniciar Frontend
# ==========================================

print_info "Iniciando frontend en puerto $FRONTEND_PORT..."

cd app
VITE_PORT=$FRONTEND_PORT npm run dev -- --port $FRONTEND_PORT --strictPort > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Guardar PID del frontend
echo $FRONTEND_PID > .frontend.pid

# Esperar a que el frontend esté listo
print_info "Esperando a que el frontend esté listo..."
sleep 5

# Verificar que el frontend está corriendo
if ! ps -p $FRONTEND_PID > /dev/null; then
    print_error "El frontend no pudo iniciarse. Revisa frontend.log"
    cat frontend.log

    # Matar backend también
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

print_success "Frontend iniciado (PID: $FRONTEND_PID)"

# ==========================================
# PASO 8: Resumen
# ==========================================

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        ✓ Sistema Iniciado             ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Backend:${NC}  http://localhost:$BACKEND_PORT"
echo -e "${BLUE}Frontend:${NC} http://localhost:$FRONTEND_PORT"
echo ""
echo -e "${BLUE}PIDs:${NC}"
echo -e "  Backend:  $BACKEND_PID"
echo -e "  Frontend: $FRONTEND_PID"
echo ""
echo -e "${YELLOW}Logs:${NC}"
echo -e "  Backend:  tail -f backend.log"
echo -e "  Frontend: tail -f frontend.log"
echo ""
echo -e "${YELLOW}Para detener:${NC}"
echo -e "  ./stop.sh"
echo -e "  o presiona Ctrl+C"
echo ""

# ==========================================
# PASO 9: Crear script de parada
# ==========================================

cat > stop.sh << 'STOP_SCRIPT'
#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo -e "${YELLOW}Deteniendo aplicación...${NC}"

# Leer PIDs
if [ -f .backend.pid ]; then
    BACKEND_PID=$(cat .backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        kill $BACKEND_PID 2>/dev/null || true
        echo -e "${GREEN}✓${NC} Backend detenido (PID: $BACKEND_PID)"
    fi
    rm .backend.pid
fi

if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        kill $FRONTEND_PID 2>/dev/null || true
        echo -e "${GREEN}✓${NC} Frontend detenido (PID: $FRONTEND_PID)"
    fi
    rm .frontend.pid
fi

# Limpiar puertos como backup
lsof -ti:3001 | xargs -r kill -9 2>/dev/null || true
lsof -ti:5173 | xargs -r kill -9 2>/dev/null || true

echo -e "${GREEN}✓${NC} Aplicación detenida"
echo ""
STOP_SCRIPT

chmod +x stop.sh

# ==========================================
# PASO 10: Mantener el script corriendo
# ==========================================

# Función para cleanup al salir
cleanup() {
    echo ""
    print_warning "Señal de terminación recibida. Deteniendo servicios..."
    ./stop.sh
    exit 0
}

# Capturar señales de terminación
trap cleanup SIGINT SIGTERM

print_info "Presiona Ctrl+C para detener todos los servicios"
echo ""

# Monitorear procesos
while true; do
    if ! ps -p $BACKEND_PID > /dev/null 2>&1; then
        print_error "Backend se detuvo inesperadamente"
        cat backend.log
        cleanup
    fi

    if ! ps -p $FRONTEND_PID > /dev/null 2>&1; then
        print_error "Frontend se detuvo inesperadamente"
        cat frontend.log
        cleanup
    fi

    sleep 5
done
