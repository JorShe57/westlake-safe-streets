import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SafetyReport } from '../types';
import {
  ROAD_USER_META,
  SAMPLE_HIN_CORRIDORS,
  WESTLAKE_BOUNDARY,
  WESTLAKE_CENTER,
} from '../data/westlakeData';

interface SafetyMapProps {
  reports: SafetyReport[];
  isPinDropMode: boolean;
  showHinLayer: boolean;
  searchPin: { lat: number; lng: number; label: string } | null;
  flyToTarget: { lat: number; lng: number; zoom: number; nonce: number } | null;
  selectedReportId: string | null;
  onSelectReport: (report: SafetyReport) => void;
  onMapPickLocation: (lat: number, lng: number) => void;
}

export function SafetyMap({
  reports,
  isPinDropMode,
  showHinLayer,
  searchPin,
  flyToTarget,
  selectedReportId,
  onSelectReport,
  onMapPickLocation,
}: SafetyMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const hinLayerRef = useRef<L.LayerGroup | null>(null);
  const searchLayerRef = useRef<L.LayerGroup | null>(null);
  const pinDropModeRef = useRef(isPinDropMode);
  const onMapPickRef = useRef(onMapPickLocation);

  pinDropModeRef.current = isPinDropMode;
  onMapPickRef.current = onMapPickLocation;

  // Initialize Leaflet map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: WESTLAKE_CENTER,
      zoom: 13,
      minZoom: 12,
      maxZoom: 18,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Free, no-API-key basemaps: Street Map (OSM) + Aerial/Satellite (Esri World Imagery)
    const streetLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    });

    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
        maxZoom: 19,
      }
    );

    streetLayer.addTo(map);

    L.control
      .layers(
        {
          'Street Map': streetLayer,
          'Aerial / Satellite': satelliteLayer,
        },
        undefined,
        { position: 'topright' }
      )
      .addTo(map);

    // Verified Westlake municipal boundary overlay
    L.polygon(WESTLAKE_BOUNDARY, {
      color: '#0f2942',
      weight: 2,
      dashArray: '6 6',
      fillColor: '#0f2942',
      fillOpacity: 0.03,
      interactive: false,
    }).addTo(map);

    hinLayerRef.current = L.layerGroup().addTo(map);
    searchLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      if (pinDropModeRef.current) {
        onMapPickRef.current(e.latlng.lat, e.latlng.lng);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      hinLayerRef.current = null;
      searchLayerRef.current = null;
    };
  }, []);

  // Update cursor when in pin-drop mode
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (isPinDropMode) {
      el.classList.add('map-pin-drop-active');
    } else {
      el.classList.remove('map-pin-drop-active');
    }
  }, [isPinDropMode]);

  // Smooth flyTo when corridor chip, search result, or admin "Locate" is clicked
  useEffect(() => {
    if (!mapRef.current || !flyToTarget) return;
    mapRef.current.flyTo([flyToTarget.lat, flyToTarget.lng], flyToTarget.zoom, {
      duration: 0.75,
    });
  }, [flyToTarget]);

  // Render Sample High-Injury Network (HIN) Corridors when toggled on
  useEffect(() => {
    const layer = hinLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!showHinLayer) return;

    SAMPLE_HIN_CORRIDORS.forEach((corridor) => {
      const color = corridor.tier === 'High Injury' ? '#dc2626' : '#ea580c';
      const line = L.polyline(corridor.coordinates, {
        color,
        weight: 8,
        opacity: 0.52,
        lineCap: 'round',
        lineJoin: 'round',
      });

      line.bindPopup(
        `<div class="hin-popup">
          <span class="hin-popup-tier" style="background:${color}">${corridor.tier} · Sample HIN</span>
          <strong>${corridor.name}</strong>
          <p>${corridor.note}</p>
          <small>Primary Agency: ${corridor.jurisdiction}</small>
        </div>`
      );

      line.addTo(layer);
    });
  }, [showHinLayer]);

  // Render temporary search / GPS location marker
  useEffect(() => {
    const layer = searchLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!searchPin) return;

    const icon = L.divIcon({
      className: 'search-pin-wrapper',
      html: `<div class="search-pin-pulse"></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    const marker = L.marker([searchPin.lat, searchPin.lng], { icon });
    marker.addTo(layer);
  }, [searchPin]);

  // Render report markers
  useEffect(() => {
    const layer = markersLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    reports.forEach((report) => {
      const meta = ROAD_USER_META[report.userType];
      const isSelected = report.id === selectedReportId;
      const size = report.upvotes >= 20 ? 34 : report.upvotes >= 12 ? 30 : 26;

      const icon = L.divIcon({
        className: 'safety-pin-wrapper',
        html: `
          <div class="safety-pin ${isSelected ? 'is-selected' : ''}" style="--pin-color: ${meta.color}; width: ${size}px; height: ${size}px;">
            <span class="safety-pin-count">${report.upvotes}</span>
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([report.lat, report.lng], { icon });

      marker.on('click', () => {
        if (pinDropModeRef.current) return;
        onSelectReport(report);
      });

      marker.addTo(layer);
    });
  }, [reports, selectedReportId, onSelectReport]);

  return (
    <div
      ref={containerRef}
      className="safety-map-canvas"
      aria-label="Interactive traffic safety map of Westlake, Ohio"
    />
  );
}
