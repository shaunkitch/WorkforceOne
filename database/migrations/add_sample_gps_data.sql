-- Sample GPS tracking data for testing live tracking
-- This will add GPS positions for existing users in the organization

-- First, let's insert some sample GPS tracking data for guards
-- We'll use coordinates around Johannesburg, South Africa as an example

INSERT INTO gps_tracking (user_id, latitude, longitude, accuracy, altitude, speed, heading, battery_level, timestamp)
SELECT 
    u.id as user_id,
    -26.2041 + (RANDOM() * 0.1 - 0.05) as latitude, -- Johannesburg area with some variation
    28.0473 + (RANDOM() * 0.1 - 0.05) as longitude,
    5 + (RANDOM() * 15) as accuracy, -- 5-20 meters accuracy
    1750 + (RANDOM() * 100) as altitude, -- Johannesburg altitude ~1750m
    CASE 
        WHEN RANDOM() < 0.3 THEN 0 -- 30% chance stationary
        ELSE RANDOM() * 5 -- 0-5 m/s when moving
    END as speed,
    RANDOM() * 360 as heading, -- Random heading 0-360 degrees
    50 + (RANDOM() * 50) as battery_level, -- 50-100% battery
    NOW() - INTERVAL '1 minute' * FLOOR(RANDOM() * 30) as timestamp -- Last 30 minutes
FROM users u
INNER JOIN organizations o ON u.organization_id = o.id
WHERE u.is_active = true
LIMIT 10; -- Add GPS data for up to 10 active users

-- Add more recent updates for some users (to show movement)
INSERT INTO gps_tracking (user_id, latitude, longitude, accuracy, altitude, speed, heading, battery_level, timestamp)
SELECT 
    u.id as user_id,
    -26.2041 + (RANDOM() * 0.1 - 0.05) as latitude,
    28.0473 + (RANDOM() * 0.1 - 0.05) as longitude,
    5 + (RANDOM() * 15) as accuracy,
    1750 + (RANDOM() * 100) as altitude,
    RANDOM() * 3 as speed,
    RANDOM() * 360 as heading,
    45 + (RANDOM() * 50) as battery_level,
    NOW() - INTERVAL '1 second' * FLOOR(RANDOM() * 60) as timestamp -- Last minute
FROM users u
INNER JOIN organizations o ON u.organization_id = o.id
WHERE u.is_active = true
LIMIT 5; -- Update positions for 5 users

-- You can run this query to verify the GPS data:
-- SELECT 
--     gt.*, 
--     u.first_name, 
--     u.last_name 
-- FROM gps_tracking gt
-- JOIN users u ON gt.user_id = u.id
-- WHERE gt.timestamp > NOW() - INTERVAL '30 minutes'
-- ORDER BY gt.timestamp DESC;