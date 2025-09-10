# Mobile App Integration Guide - WorkforceOne Live Tracking

## Production API Endpoints

**Base URL**: `https://www.workforceone.co.za`

### 📍 GPS Tracking Endpoints

#### 1. Send GPS Location Data
```
POST https://www.workforceone.co.za/api/mobile/gps
```

**Request Body:**
```json
{
  "user_id": "guard_user_id",
  "latitude": -25.7461,
  "longitude": 28.1881,
  "accuracy": 10,
  "altitude": 1350,
  "speed": 0,
  "heading": 180,
  "battery_level": 85,
  "timestamp": "2025-09-10T08:33:30.458Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "GPS data received and saved"
}
```

#### 2. Update Patrol Status
```
PUT https://www.workforceone.co.za/api/mobile/gps
```

**Request Body:**
```json
{
  "patrol_id": "083ac981-6eb6-420e-81cf-5db9846c3200",
  "status": "active",
  "user_id": "guard_user_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Patrol status updated"
}
```

#### 3. Get Live Tracking Data (for testing)
```
GET https://www.workforceone.co.za/api/gps/active
```

## 📱 Mobile App Implementation

### React Native / Expo Example

#### GPS Location Tracking Service
```javascript
import * as Location from 'expo-location';

class GPSTrackingService {
  constructor(userId) {
    this.userId = userId;
    this.trackingInterval = null;
    this.baseURL = 'https://www.workforceone.co.za';
  }

  async startTracking(patrolId) {
    // Update patrol status to active
    await this.updatePatrolStatus(patrolId, 'active');
    
    // Start GPS tracking every 30 seconds
    this.trackingInterval = setInterval(async () => {
      await this.sendGPSLocation();
    }, 30000); // 30 seconds
    
    // Send initial location immediately
    await this.sendGPSLocation();
  }

  async stopTracking(patrolId) {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
    
    // Update patrol status to completed
    await this.updatePatrolStatus(patrolId, 'completed');
  }

  async sendGPSLocation() {
    try {
      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Get battery level
      const battery = await Battery.getBatteryLevelAsync();

      const gpsData = {
        user_id: this.userId,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        altitude: location.coords.altitude,
        speed: location.coords.speed,
        heading: location.coords.heading,
        battery_level: Math.round(battery * 100),
        timestamp: new Date().toISOString()
      };

      const response = await fetch(`${this.baseURL}/api/mobile/gps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(gpsData)
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('GPS data sent successfully');
      } else {
        console.error('Failed to send GPS data:', result.error);
      }
    } catch (error) {
      console.error('Error sending GPS location:', error);
    }
  }

  async updatePatrolStatus(patrolId, status) {
    try {
      const response = await fetch(`${this.baseURL}/api/mobile/gps`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patrol_id: patrolId,
          status: status,
          user_id: this.userId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(`Patrol status updated to: ${status}`);
      } else {
        console.error('Failed to update patrol status:', result.error);
      }
    } catch (error) {
      console.error('Error updating patrol status:', error);
    }
  }
}

// Usage in your patrol component
export default function PatrolScreen() {
  const [gpsService] = useState(new GPSTrackingService(user.id));
  const [isPatrolActive, setIsPatrolActive] = useState(false);

  const startPatrol = async () => {
    const currentPatrol = await getCurrentPatrol(); // Your method to get current patrol
    await gpsService.startTracking(currentPatrol.id);
    setIsPatrolActive(true);
  };

  const stopPatrol = async () => {
    const currentPatrol = await getCurrentPatrol();
    await gpsService.stopTracking(currentPatrol.id);
    setIsPatrolActive(false);
  };

  return (
    <View>
      {!isPatrolActive ? (
        <Button title="Start Patrol" onPress={startPatrol} />
      ) : (
        <Button title="End Patrol" onPress={stopPatrol} />
      )}
    </View>
  );
}
```

#### Required Permissions (app.json)
```json
{
  "expo": {
    "permissions": [
      "ACCESS_COARSE_LOCATION",
      "ACCESS_FINE_LOCATION",
      "ACCESS_BACKGROUND_LOCATION"
    ],
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "This app needs to access location to track guard positions during patrols."
        }
      ]
    ]
  }
}
```

## 🔧 Background Processing

### For continuous GPS tracking during patrols:

```javascript
import * as TaskManager from 'expo-task-manager';

const LOCATION_TASK_NAME = 'background-location-task';

// Define the background task
TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }
  if (data) {
    const { locations } = data;
    const location = locations[0];
    
    // Send GPS data to server
    sendGPSToServer(location);
  }
});

// Start background location tracking
const startBackgroundLocation = async () => {
  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.High,
    timeInterval: 30000, // Update every 30 seconds
    distanceInterval: 10, // Update every 10 meters
  });
};
```

## 📊 Testing & Validation

### Test GPS Data Submission
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{
    "user_id": "1282a420-0534-4586-8a96-70e6798a9079",
    "latitude": -25.7461,
    "longitude": 28.1881,
    "battery_level": 85
  }' \
  https://www.workforceone.co.za/api/mobile/gps
```

### Verify Data in Live Tracking
```bash
curl https://www.workforceone.co.za/api/gps/active
```

### Test Patrol Status Update
```bash
curl -X PUT -H "Content-Type: application/json" \
  -d '{
    "patrol_id": "083ac981-6eb6-420e-81cf-5db9846c3200",
    "status": "active",
    "user_id": "1282a420-0534-4586-8a96-70e6798a9079"
  }' \
  https://www.workforceone.co.za/api/mobile/gps
```

## 🚀 Deployment Checklist

### Mobile App Updates Required:
- [ ] Update API base URL to `https://www.workforceone.co.za`
- [ ] Implement GPS tracking service
- [ ] Add background location permissions
- [ ] Test GPS data flow with admin portal
- [ ] Implement patrol status updates
- [ ] Add error handling and retry logic

### Admin Portal (Already Complete):
- [x] GPS receiving endpoints created
- [x] Live tracking with Google Maps working
- [x] Real-time updates every 30 seconds
- [x] Battery level indicators
- [x] Production environment configured

## 📋 API Status Codes

### Success Responses:
- `200 OK` - GPS data received successfully
- `200 OK` - Patrol status updated

### Error Responses:
- `400 Bad Request` - Missing required fields
- `500 Internal Server Error` - Database or server error

## 🔐 Security Considerations

### Current Implementation:
- CORS enabled for mobile app access
- User ID validation on patrol updates
- GPS data validation and sanitization

### Recommended Enhancements:
- Add API authentication tokens
- Implement rate limiting
- Add request signing for security

## 📍 Live Tracking Features

### Admin Portal Features:
- **Real-time GPS tracking** on Google Maps
- **Battery level indicators** (Green >50%, Orange 20-50%, Red <20%)
- **Auto-refresh** every 30 seconds
- **Guard information** on marker click
- **Movement history** tracking

### Mobile App Integration:
- **Automatic GPS submission** every 30 seconds during patrol
- **Patrol status synchronization** (scheduled → active → completed)
- **Battery level monitoring** and reporting
- **Background location tracking** support

---

**Production Endpoints**: https://www.workforceone.co.za  
**Integration Status**: ✅ Ready for mobile app implementation  
**Last Updated**: September 10, 2025