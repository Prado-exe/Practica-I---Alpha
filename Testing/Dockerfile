# Usamos una imagen ligera de Node
FROM node:20-alpine

# Directorio de trabajo
WORKDIR /app

# Copiamos solo archivos de dependencias para aprovechar el cache de Docker
COPY package*.json ./

# Instalamos las dependencias
RUN npm install

# Copiamos el resto del proyecto
COPY . .

# Exponemos el puerto de Vite
EXPOSE 5173

# Comando para ejecutar Vite con acceso externo (--host)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]