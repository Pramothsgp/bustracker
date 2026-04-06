import React, { useRef, useEffect, useCallback, useImperativeHandle } from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";

export interface LeafletMarker {
  id: string;
  lat: number;
  lng: number;
  title?: string;
  description?: string;
  color?: string;
}

export interface LeafletPolyline {
  id: string;
  coordinates: { lat: number; lng: number }[];
  color?: string;
  weight?: number;
}

interface LeafletMapProps {
  className?: string;
  style?: any;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta?: number;
    longitudeDelta?: number;
  };
  markers?: LeafletMarker[];
  polylines?: LeafletPolyline[];
  showsUserLocation?: boolean;
  onMarkerPress?: (id: string) => void;
}

export interface LeafletMapRef {
  fitToMarkers: () => void;
}

const LEAFLET_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; }
    html, body, #map { width: 100%; height: 100%; }
    .bus-icon {
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
    }
    .bus-popup .route { font-weight: 700; font-size: 14px; color: #1d4ed8; }
    .bus-popup .desc { font-size: 12px; color: #6b7280; margin-top: 2px; }
    .stop-icon {
      width: 10px; height: 10px; background: #059669; border: 2px solid #fff;
      border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    let map, markers = {}, polylines = {}, userMarker;

    function init(lat, lng, zoom) {
      map = L.map('map', { zoomControl: false }).setView([lat, lng], zoom || 13);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© OSM, Carto',
        maxZoom: 19
      }).addTo(map);
      L.control.zoom({ position: 'topright' }).addTo(map);
    }

    function updateMarkers(data) {
      const ids = new Set(data.map(m => m.id));
      // Remove old
      Object.keys(markers).forEach(id => {
        if (!ids.has(id)) { markers[id].remove(); delete markers[id]; }
      });
      // Add/update
      data.forEach(m => {
        const color = m.color || '#1d4ed8';
        if (markers[m.id]) {
          markers[m.id].setLatLng([m.lat, m.lng]);
        } else {
          const icon = L.divIcon({
            className: 'bus-icon',
            html: '🚌',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });
          markers[m.id] = L.marker([m.lat, m.lng], { icon })
            .addTo(map)
            .on('click', () => {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerPress', id: m.id }));
            });
        }
        const popup = '<div class="bus-popup">'
          + (m.title ? '<div class="route">' + m.title + '</div>' : '')
          + (m.description ? '<div class="desc">' + m.description + '</div>' : '')
          + '</div>';
        markers[m.id].bindPopup(popup);
      });
    }

    function updatePolylines(data) {
      const ids = new Set(data.map(p => p.id));
      Object.keys(polylines).forEach(id => {
        if (!ids.has(id)) { polylines[id].remove(); delete polylines[id]; }
      });
      data.forEach(p => {
        const latlngs = p.coordinates.map(c => [c.lat, c.lng]);
        if (polylines[p.id]) {
          polylines[p.id].setLatLngs(latlngs);
        } else {
          polylines[p.id] = L.polyline(latlngs, {
            color: p.color || '#1d4ed8', weight: p.weight || 3
          }).addTo(map);
        }
      });
    }

    function showUserLocation(lat, lng) {
      if (userMarker) {
        userMarker.setLatLng([lat, lng]);
      } else {
        const icon = L.divIcon({
          className: '',
          html: '<div style="width:14px;height:14px;background:#3b82f6;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 2px #3b82f6,0 2px 4px rgba(0,0,0,0.3)"></div>',
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });
        userMarker = L.marker([lat, lng], { icon, zIndexOffset: 1000 }).addTo(map);
      }
    }

    function fitBounds(bounds) {
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    }

    // Listen for messages from React Native
    document.addEventListener('message', function(e) { handleMsg(e.data); });
    window.addEventListener('message', function(e) { handleMsg(e.data); });

    function handleMsg(raw) {
      try {
        const msg = JSON.parse(raw);
        if (msg.type === 'init') init(msg.lat, msg.lng, msg.zoom);
        if (msg.type === 'markers') updateMarkers(msg.data);
        if (msg.type === 'polylines') updatePolylines(msg.data);
        if (msg.type === 'userLocation') showUserLocation(msg.lat, msg.lng);
        if (msg.type === 'fitBounds') fitBounds(msg.bounds);
      } catch {}
    }

    // Signal ready
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
  </script>
</body>
</html>
`;

const LeafletMap = React.forwardRef<LeafletMapRef, LeafletMapProps>(
  ({ className, style, initialRegion, markers, polylines, showsUserLocation, onMarkerPress }, ref) => {
    const webRef = useRef<WebView>(null);
    const readyRef = useRef(false);
    const pendingRef = useRef<string[]>([]);

    const send = useCallback((msg: object) => {
      const json = JSON.stringify(msg);
      if (readyRef.current) {
        webRef.current?.postMessage(json);
      } else {
        pendingRef.current.push(json);
      }
    }, []);

    useImperativeHandle(ref, () => ({
      fitToMarkers() {
        if (markers && markers.length > 0) {
          const bounds = markers.map((m) => [m.lat, m.lng]);
          send({ type: "fitBounds", bounds });
        }
      },
    }), [markers, send]);

    const handleMessage = useCallback((event: any) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data);
        if (msg.type === "ready") {
          readyRef.current = true;
          // Send init
          send({
            type: "init",
            lat: initialRegion?.latitude ?? 11.0168,
            lng: initialRegion?.longitude ?? 76.9558,
            zoom: initialRegion?.latitudeDelta
              ? Math.round(Math.log2(360 / (initialRegion.latitudeDelta || 0.05)) + 1)
              : 13,
          });
          // Flush pending
          pendingRef.current.forEach((json) => webRef.current?.postMessage(json));
          pendingRef.current = [];
        }
        if (msg.type === "markerPress" && onMarkerPress) {
          onMarkerPress(msg.id);
        }
      } catch {}
    }, [initialRegion, onMarkerPress, send]);

    // Update markers
    useEffect(() => {
      if (markers) {
        send({ type: "markers", data: markers });
      }
    }, [markers, send]);

    // Update polylines
    useEffect(() => {
      if (polylines) {
        send({ type: "polylines", data: polylines });
      }
    }, [polylines, send]);

    return (
      <View style={[{ flex: 1 }, style]} className={className}>
        <WebView
          ref={webRef}
          source={{ html: LEAFLET_HTML }}
          style={{ flex: 1 }}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={["*"]}
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          userAgent="BusTrackerApp/1.0"
        />
      </View>
    );
  }
);

LeafletMap.displayName = "LeafletMap";
export default LeafletMap;
