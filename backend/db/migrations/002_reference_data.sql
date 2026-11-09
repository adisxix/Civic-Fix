-- Migration 002: Seed reference data (wards, departments, categories)

-- Demo Wards
INSERT INTO wards (id, code, name, city, center_lat, center_lng, is_active) VALUES
(14, 'WARD-14', 'Ward 14 (Central Market)', 'Bengaluru', 12.9716, 77.5946, 1),
(7, 'WARD-07', 'Ward 7 (Indiranagar East)', 'Bengaluru', 12.9784, 77.6408, 1),
(21, 'WARD-21', 'Ward 21 (Koramangala South)', 'Bengaluru', 12.9352, 77.6245, 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Departments
INSERT INTO departments (id, code, name, description) VALUES
(1, 'roads', 'Roads & Pavements', 'Street repairs, potholes, sidewalks, and lane markings'),
(2, 'lighting', 'Street Lighting', 'Public streetlights, high-mast lamps, and junction illumination'),
(3, 'sanitation', 'Sanitation & Solid Waste', 'Garbage clearing, waste bins, and public hygiene'),
(4, 'drainage', 'Drainage & Sewerage', 'Stormwater drains, desilting, culverts, and waterlogging'),
(5, 'water', 'Water Supply', 'Municipal pipeline leaks, water supply outages, and valve repairs')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Categories with default department mapping and SLA hours
INSERT INTO categories (id, code, name, icon, default_department_id, sla_hours) VALUES
(1, 'pothole', 'Pothole / road damage', 'construction', 1, 72),
(2, 'streetlight', 'Broken streetlight', 'lamp', 2, 48),
(3, 'garbage', 'Garbage / overflowing bin', 'trash-2', 3, 24),
(4, 'drainage', 'Blocked drain / waterlogging', 'waves', 4, 48),
(5, 'water_leakage', 'Water leakage / supply issue', 'droplets', 5, 24)
ON DUPLICATE KEY UPDATE name=VALUES(name);

