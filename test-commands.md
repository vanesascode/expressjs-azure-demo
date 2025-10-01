# Comandos de Testing para la API de Contactos

Este archivo contiene ejemplos de comandos curl para probar todos los endpoints de la API.

## 1. Obtener todos los contactos

```bash
curl http://localhost:3001/contacts
```

## 2. Obtener un contacto específico

```bash
curl http://localhost:3001/contacts/1001
```

## 3. Crear un nuevo contacto

```bash
curl -X POST http://localhost:3001/contacts \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test User\",
    \"email\": \"test@example.com\",
    \"company\": \"Test Company\",
    \"phone1\": \"+1 555-0123\"
  }"
```

## 4. Actualizar completamente un contacto (usar un ID existente)

```bash
curl -X PUT http://localhost:3001/contacts/1001 \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Sarah Johnson Updated\",
    \"email\": \"sarah.johnson.updated@microsoft.com\",
    \"company\": \"Microsoft Corporation\",
    \"phone1\": \"+1 (206) 555-0123\",
    \"phone2\": \"+1 (206) 555-0124\"
  }"
```

## 5. Actualizar parcialmente un contacto

```bash
curl -X PATCH http://localhost:3001/contacts/1001 \
  -H "Content-Type: application/json" \
  -d "{
    \"phone1\": \"+1 (206) 555-9999\"
  }"
```

## 6. Eliminar un contacto (usar un ID existente que no necesites)

```bash
curl -X DELETE http://localhost:3001/contacts/1001
```

## Casos de Error para Probar

### Contacto no encontrado

```bash
curl http://localhost:3001/contacts/99999
```

### Crear contacto con email duplicado

```bash
# Primero crear un contacto
curl -X POST http://localhost:3001/contacts \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test User 1\",
    \"email\": \"duplicate@example.com\",
    \"company\": \"Test Company\"
  }"

# Luego intentar crear otro con el mismo email
curl -X POST http://localhost:3001/contacts \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test User 2\",
    \"email\": \"duplicate@example.com\",
    \"company\": \"Another Company\"
  }"
```

### Crear contacto sin campos requeridos

```bash
curl -X POST http://localhost:3001/contacts \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Incomplete User\"
  }"
```

### Email con formato inválido

```bash
curl -X POST http://localhost:3001/contacts \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Bad Email User\",
    \"email\": \"invalid-email\",
    \"company\": \"Test Company\"
  }"
```

## Herramientas Alternativas

### Usando PowerShell (Windows)

```powershell
# GET todos los contactos
Invoke-RestMethod -Uri "http://localhost:3001/contacts" -Method GET

# POST nuevo contacto
$body = @{
    name = "PowerShell User"
    email = "powershell@example.com"
    company = "Microsoft"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/contacts" -Method POST -Body $body -ContentType "application/json"
```

### Usando un cliente REST como Postman o Thunder Client (VS Code)

1. Instala la extensión "Thunder Client" en VS Code
2. Crea una nueva colección
3. Agrega requests para cada endpoint con los datos de ejemplo

## Verificación de Funcionamiento

1. **Inicia el servidor:** `npm start`
2. **Ejecuta los comandos de prueba** en el orden sugerido
3. **Verifica el archivo contacts.json** para ver los cambios
4. **Revisa los logs del servidor** para ver las operaciones realizadas
