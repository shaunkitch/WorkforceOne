// Global variable to track if Google Maps is loaded
declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

let isGoogleMapsLoaded = false;
let isGoogleMapsLoading = false;
const loadPromises: Array<(value: boolean) => void> = [];

/**
 * Load Google Maps API script
 * @returns Promise that resolves when Google Maps API is loaded
 */
export function loadGoogleMapsAPI(): Promise<boolean> {
  return new Promise((resolve) => {
    // If already loaded, resolve immediately
    if (isGoogleMapsLoaded && window.google && window.google.maps) {
      resolve(true);
      return;
    }

    // Add to the queue of promises waiting for load
    loadPromises.push(resolve);

    // If already loading, just wait
    if (isGoogleMapsLoading) {
      return;
    }

    // Start loading
    isGoogleMapsLoading = true;

    // Check if API key is available
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('Google Maps API key not found');
      // Resolve all promises with false
      loadPromises.forEach(promise => promise(false));
      loadPromises.length = 0;
      isGoogleMapsLoading = false;
      return;
    }

    // Create callback function
    window.initGoogleMaps = () => {
      isGoogleMapsLoaded = true;
      isGoogleMapsLoading = false;
      
      // Resolve all waiting promises
      loadPromises.forEach(promise => promise(true));
      loadPromises.length = 0;
    };

    // Load the script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry&callback=initGoogleMaps`;
    script.onerror = () => {
      console.error('Failed to load Google Maps API');
      isGoogleMapsLoading = false;
      
      // Resolve all promises with false
      loadPromises.forEach(promise => promise(false));
      loadPromises.length = 0;
    };

    document.head.appendChild(script);
  });
}

/**
 * Check if Google Maps API is available
 * @returns boolean indicating if Google Maps is loaded
 */
export function isGoogleMapsAPILoaded(): boolean {
  return isGoogleMapsLoaded && !!window.google?.maps;
}

/**
 * Initialize a Google Map with default settings for patrol routes
 * @param container Map container element
 * @param center Center coordinates
 * @param zoom Zoom level
 * @returns Google Maps instance or null
 */
export function createPatrolMap(
  container: HTMLElement,
  center: { lat: number; lng: number },
  zoom: number = 15
): google.maps.Map | null {
  if (!isGoogleMapsAPILoaded()) {
    return null;
  }

  return new google.maps.Map(container, {
    zoom,
    center,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    disableDefaultUI: true,
    zoomControl: false,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    gestureHandling: 'none',
    styles: [
      {
        featureType: 'poi',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'transit',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'administrative.land_parcel',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'administrative.neighborhood',
        stylers: [{ visibility: 'off' }]
      }
    ]
  });
}

/**
 * Create a numbered marker for checkpoints
 * @param map Google Maps instance
 * @param position Marker position
 * @param index Checkpoint index (0-based)
 * @param title Marker title
 * @param isStart Whether this is the start point
 * @param isEnd Whether this is the end point
 * @returns Google Maps marker
 */
export function createCheckpointMarker(
  map: google.maps.Map,
  position: { lat: number; lng: number },
  index: number,
  title: string,
  isStart: boolean = false,
  isEnd: boolean = false
): google.maps.Marker {
  let fillColor = '#3B82F6'; // Default blue
  if (isStart) fillColor = '#10B981'; // Green for start
  else if (isEnd) fillColor = '#EF4444'; // Red for end

  return new google.maps.Marker({
    position,
    map,
    title,
    label: {
      text: (index + 1).toString(),
      color: 'white',
      fontWeight: 'bold',
      fontSize: '12px'
    },
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor,
      fillOpacity: 1,
      strokeColor: 'white',
      strokeWeight: 2,
      scale: 10
    }
  });
}

/**
 * Create a polyline connecting checkpoints
 * @param map Google Maps instance
 * @param path Array of coordinates
 * @param color Line color (default blue)
 * @returns Google Maps polyline
 */
export function createRoutePath(
  map: google.maps.Map,
  path: Array<{ lat: number; lng: number }>,
  color: string = '#3B82F6'
): google.maps.Polyline {
  return new google.maps.Polyline({
    path,
    geodesic: true,
    strokeColor: color,
    strokeOpacity: 0.8,
    strokeWeight: 3,
    map
  });
}