#!/bin/bash

# Script de configuración para TecnoJuy Frontend
set -e

echo "🚀 Configurando TecnoJuy Frontend..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes coloreados
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    print_error "No se encontró package.json. Asegúrate de estar en el directorio frontend/"
    exit 1
fi

# Verificar que pnpm está instalado
if ! command -v pnpm &> /dev/null; then
    print_warning "pnpm no encontrado. Instalando pnpm..."
    npm install -g pnpm
    print_status "pnpm instalado"
fi

# Instalar dependencias
print_info "Instalando dependencias con pnpm..."
pnpm install
print_status "Dependencias instaladas"

# Verificar archivo .env
if [ ! -f ".env" ]; then
    if [ -f "env.example" ]; then
        print_warning "Archivo .env no encontrado. Copiando desde env.example..."
        cp env.example .env
        print_info "Archivo .env creado. Por favor, configura PUBLIC_API_URL con la URL de tu backend."
    else
        print_error "No se encontró archivo env.example"
        exit 1
    fi
else
    print_status "Archivo .env encontrado"
fi

print_status "¡Configuración completada exitosamente!"
echo ""
print_info "Para ejecutar el servidor de desarrollo:"
echo "  pnpm dev"
echo ""
print_info "Para compilar para producción:"
echo "  pnpm build"
echo ""
print_info "El frontend estará disponible en:"
echo "  http://localhost:4321"


