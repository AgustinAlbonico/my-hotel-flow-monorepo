-- Script para crear los tipos de habitación manualmente
-- Ejecutar antes del seed de habitaciones

-- Insertar tipos de habitación
INSERT INTO room_types (code, name, "precioPorNoche", "capacidadMaxima", descripcion, "caracteristicasIncluidas", "isActive", "createdAt", "updatedAt")
VALUES 
  ('ESTANDAR', 'Habitación Estándar', 1500.00, 2, 'Habitación cómoda y funcional con todas las comodidades básicas para una estadía placentera.', 'Cama matrimonial o 2 camas individuales,Baño privado,TV por cable,Wi-Fi gratuito,Aire acondicionado,Minibar', true, NOW(), NOW()),
  ('SUITE', 'Suite Premium', 3500.00, 4, 'Suite espaciosa con área de estar separada, comodidades de lujo y vista panorámica.', 'Cama king size,Sala de estar independiente,Baño con jacuzzi,TV Smart 55",Wi-Fi de alta velocidad,Aire acondicionado centralizado,Minibar premium,Cafetera Nespresso,Balcón privado,Servicio de habitaciones 24/7', true, NOW(), NOW()),
  ('FAMILIAR', 'Habitación Familiar', 2500.00, 6, 'Habitación amplia ideal para familias, con espacio suficiente para hasta 6 personas.', '2 camas matrimoniales,2 camas individuales,Baño privado grande,TV por cable,Wi-Fi gratuito,Aire acondicionado,Minibar,Área de juegos para niños,Cocina pequeña', true, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  "precioPorNoche" = EXCLUDED."precioPorNoche",
  "capacidadMaxima" = EXCLUDED."capacidadMaxima",
  descripcion = EXCLUDED.descripcion,
  "caracteristicasIncluidas" = EXCLUDED."caracteristicasIncluidas",
  "updatedAt" = NOW();

-- Verificar los IDs creados
SELECT id, code, name, "precioPorNoche", "capacidadMaxima" FROM room_types;
