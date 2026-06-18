USE cleantrack_uganda;

-- All demo users use this password: password123
SET @demo_password = '$2b$10$1itDutuxh3pi2lmMrdAd4.7HOwRS0phpwopISzr5zTXSjScRatOZq';

INSERT INTO users (id, full_name, email, phone, password, role, status) VALUES
(1, 'EcoCollect Admin', 'admin@ecocollect.ug', '+256700000001', @demo_password, 'admin', 'active'),
(2, 'David Ssenyonga', 'david@ecocollect.ug', '+256700000002', @demo_password, 'collector', 'active'),
(3, 'Grace Namutebi', 'grace@ecocollect.ug', '+256700000003', @demo_password, 'collector', 'active'),
(4, 'Isaac Mugisha', 'isaac@ecocollect.ug', '+256700000004', @demo_password, 'collector', 'active'),
(5, 'Joyce Akello', 'joyce@ecocollect.ug', '+256700000005', @demo_password, 'collector', 'active'),
(6, 'Sarah Nambi', 'sarah@ecocollect.ug', '+256700000006', @demo_password, 'client', 'active'),
(7, 'Peter Walusimbi', 'peter@example.com', '+256700000007', @demo_password, 'client', 'active'),
(8, 'Ruth Atim', 'ruth@example.com', '+256700000008', @demo_password, 'client', 'active'),
(9, 'Joseph Kiggundu', 'joseph@example.com', '+256700000009', @demo_password, 'client', 'active'),
(10, 'Martha Nakato', 'martha@example.com', '+256700000010', @demo_password, 'client', 'active'),
(11, 'Daniel Ouma', 'daniel@example.com', '+256700000011', @demo_password, 'client', 'active');

INSERT INTO collector_profiles (user_id, bio, service_area, is_verified, rating, total_collections) VALUES
(2, 'Experienced waste collector with 5 years service. Available daily.', 'Kampala Central', TRUE, 4.8, 156),
(3, 'Friendly and reliable collector. Serves East Kampala area.', 'Kampala East', TRUE, 4.9, 142),
(4, 'Professional service provider. Handles all waste types including hazardous.', 'Wakiso District', TRUE, 4.7, 128),
(5, 'Quick and efficient collection. Available for urgent requests.', 'Kampala North', FALSE, 4.5, 89);

INSERT INTO waste_categories (id, name, description, status) VALUES
(1, 'organic', 'Food remains, garden waste, and biodegradable material', 'active'),
(2, 'plastic', 'Plastic bottles, containers, and packaging', 'active'),
(3, 'paper', 'Paper, cartons, and cardboard', 'active'),
(4, 'metal', 'Metal cans and scrap metal', 'active'),
(5, 'glass', 'Glass bottles and broken glass', 'active'),
(6, 'mixed waste', 'Mixed household or business waste', 'active'),
(7, 'hazardous', 'Waste that requires special handling', 'active');

INSERT INTO customer_locations (id, user_id, location_name, location_type, district, division_or_subcounty, parish, village_or_zone, address_details, latitude, longitude) VALUES
(1, 6, 'Nambi Home', 'home', 'Kampala', 'Nakawa', 'Ntinda', 'Kiwatule', 'Near Kiwatule mosque', 0.36650000, 32.62680000),
(2, 6, 'Nambi Mini Market Stall', 'market_stall', 'Kampala', 'Central', 'Nakasero', 'Market Lane', 'Stall B22', 0.31560000, 32.58350000),
(3, 7, 'Walusimbi Hardware', 'business', 'Wakiso', 'Nansana', 'Nansana West', 'Nabweru', 'Opposite the taxi stage', 0.36320000, 32.52930000),
(4, 8, 'Atim Residence', 'home', 'Kampala', 'Makindye', 'Kansanga', 'Kiwafu', 'Blue gate on Church Road', 0.29140000, 32.61570000),
(5, 9, 'Kiggundu Primary School', 'school', 'Mukono', 'Goma', 'Seeta', 'Seeta', 'Behind Seeta trading center', 0.36390000, 32.74870000),
(6, 10, 'Nakato Clinic', 'institution', 'Kampala', 'Rubaga', 'Mengo', 'Lungujja', 'Clinic compound bins', 0.30690000, 32.55200000),
(7, 11, 'Ouma Apartments', 'business', 'Wakiso', 'Kira', 'Namugongo', 'Kyaliwajjala', 'Apartment block near main road', 0.39430000, 32.64570000);

INSERT INTO collection_requests
(id, client_id, location_id, waste_category_id, description, urgency, estimated_bin_level, status, requested_at, completed_at) VALUES
(1, 6, 1, 6, 'Household bin is overflowing after the weekend.', 'urgent', 95, 'pending', NOW() - INTERVAL 1 DAY, NULL),
(2, 6, 2, 2, 'Plastic bottles from the market stall.', 'normal', 70, 'accepted', NOW() - INTERVAL 2 DAY, NULL),
(3, 7, 3, 3, 'Cartons from hardware deliveries.', 'normal', 80, 'in_progress', NOW() - INTERVAL 2 DAY, NULL),
(4, 8, 4, 1, 'Food waste from home compound.', 'urgent', 90, 'completed', NOW() - INTERVAL 7 DAY, NOW() - INTERVAL 6 DAY),
(5, 9, 5, 6, 'School bins full after sports day.', 'urgent', 100, 'cancelled', NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 4 DAY),
(6, 10, 6, 7, 'Clinic hazardous waste ready for special pickup.', 'urgent', 85, 'pending', NOW() - INTERVAL 3 HOUR, NULL),
(7, 11, 7, 5, 'Glass waste from tenants.', 'normal', 65, 'pending', NOW() - INTERVAL 5 HOUR, NULL),
(8, 7, 3, 4, 'Metal scraps need collection.', 'normal', 60, 'accepted', NOW() - INTERVAL 4 DAY, NULL),
(9, 8, 4, 6, 'Mixed home waste.', 'normal', 75, 'completed', NOW() - INTERVAL 12 DAY, NOW() - INTERVAL 11 DAY),
(10, 9, 5, 3, 'Paper waste after exams.', 'normal', 55, 'pending', NOW() - INTERVAL 1 HOUR, NULL),
(11, 10, 6, 6, 'General clinic waste bin is full.', 'normal', 80, 'cancelled', NOW() - INTERVAL 10 DAY, NOW() - INTERVAL 9 DAY),
(12, 11, 7, 2, 'Plastic sacks from apartment tenants.', 'urgent', 88, 'completed', NOW() - INTERVAL 18 DAY, NOW() - INTERVAL 17 DAY);

INSERT INTO collection_assignments
(id, collection_request_id, collector_id, status, collection_notes, cancellation_reason, waste_quantity_collected, assigned_at, completed_at) VALUES
(1, 2, 2, 'accepted', NULL, NULL, NULL, NOW() - INTERVAL 1 DAY, NULL),
(2, 3, 3, 'in_progress', NULL, NULL, NULL, NOW() - INTERVAL 1 DAY, NULL),
(3, 4, 4, 'completed', 'Collected two sacks of organic waste.', NULL, 42.50, NOW() - INTERVAL 7 DAY, NOW() - INTERVAL 6 DAY),
(4, 5, 5, 'cancelled', NULL, 'School gate was locked when collector arrived.', NULL, NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 4 DAY),
(5, 8, 2, 'accepted', NULL, NULL, NULL, NOW() - INTERVAL 3 DAY, NULL),
(6, 9, 4, 'completed', 'Collected mixed household waste.', NULL, 37.00, NOW() - INTERVAL 12 DAY, NOW() - INTERVAL 11 DAY),
(7, 11, 5, 'cancelled', NULL, 'Waste was not sorted for safe collection.', NULL, NOW() - INTERVAL 10 DAY, NOW() - INTERVAL 9 DAY),
(8, 12, 3, 'completed', 'Collected plastic sacks from apartment store.', NULL, 51.75, NOW() - INTERVAL 18 DAY, NOW() - INTERVAL 17 DAY);

INSERT INTO collection_feedback (collection_request_id, client_id, rating, comment) VALUES
(4, 8, 5, 'The collector was polite and arrived early.'),
(9, 8, 4, 'Good service, but the pickup came later than expected.'),
(12, 11, 5, 'Very clean collection work.');

INSERT INTO notifications (user_id, title, message, status) VALUES
(6, 'Collection received', 'Your collection request has been received by EcoCollect.', 'unread'),
(2, 'New assignment', 'You have a new collection request in Kampala.', 'unread'),
(1, 'Pending hazardous collection', 'A hazardous collection request needs a collector.', 'unread');
