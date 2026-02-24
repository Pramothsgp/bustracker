import React from "react";
import { View, Text } from "react-native";

let RNMaps: typeof import("react-native-maps") | null = null;
try {
  RNMaps = require("react-native-maps");
  // Verify the native module is actually available (throws in Expo Go)
  RNMaps.default;
} catch {
  RNMaps = null;
}

const isAvailable = RNMaps !== null;

// Re-export map components (real or placeholder)
export const MapAvailable = isAvailable;

type MapViewProps = React.ComponentProps<typeof import("react-native-maps").default>;

const SafeMapView = React.forwardRef<any, MapViewProps & { children?: React.ReactNode }>(
  (props, ref) => {
    if (!isAvailable) {
      return (
        <View
          style={[
            { backgroundColor: "#e5e7eb", alignItems: "center", justifyContent: "center" },
            props.style,
          ]}
          className={props.className}
        >
          <Text style={{ fontSize: 40, marginBottom: 8 }}>🗺️</Text>
          <Text style={{ color: "#6b7280", fontWeight: "600", fontSize: 14 }}>
            Map requires a development build
          </Text>
          <Text style={{ color: "#9ca3af", fontSize: 12, marginTop: 4, textAlign: "center", paddingHorizontal: 24 }}>
            Run "npx expo run:android" to enable native maps
          </Text>
        </View>
      );
    }

    const MapView = RNMaps!.default;
    return <MapView ref={ref} {...props} />;
  }
);

SafeMapView.displayName = "SafeMapView";
export default SafeMapView;

// Re-export sub-components that are safe to use (they only render inside MapView)
export const Marker = isAvailable ? RNMaps!.Marker : (() => null) as any;
export const Polyline = isAvailable ? RNMaps!.Polyline : (() => null) as any;
export const PROVIDER_GOOGLE = isAvailable ? RNMaps!.PROVIDER_GOOGLE : undefined;
