import React, { useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { content } from "@/api/content";
import { useLanguage } from "@/lib/LanguageContext";

const CENTER = [39.6, 43.2];
const DEFAULT_ZOOM = 5;

function Flyer({ selected, regions }) {
  const map = useMap();
  React.useEffect(() => {
    if (!selected) {
      map.flyTo(CENTER, DEFAULT_ZOOM, { duration: 1 });
      return;
    }
    const r = regions.find((x) => x.key === selected);
    if (r && r.lat) map.flyTo([r.lat, r.lng], 6, { duration: 1.2 });
  }, [selected]);
  return null;
}

export default function PulsingMap({ regions, selected, onSelect, dark = false, className = "h-[480px] w-full z-0" }) {
  const { lang } = useLanguage();
  const [preview, setPreview] = useState(null); // { key, story | null }
  const cache = useRef({});

  const enter = (r) => {
    setPreview({ key: r.key, story: cache.current[r.key] || null });
    if (cache.current[r.key]) return;
    content.Story
      .filter({ region_en: r.key }, { limit: 1, fields: ["title_en", "title_am", "year", "excerpt_en"] })
      .then((p) => {
        if (p.items.length) {
          cache.current[r.key] = p.items[0];
          setPreview((prev) => (prev && prev.key === r.key ? { key: r.key, story: p.items[0] } : prev));
        }
      })
      .catch(() => {});
  };
  const leave = () => setPreview(null);

  const withPlace = regions.filter((r) => r.count > 0 && r.lat);
  return (
    <MapContainer
      center={CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      className={`${className} ${dark ? "map-console" : ""}`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Flyer selected={selected} regions={regions} />
      {withPlace.map((r) => {
        const size = 16 + Math.min(r.count, 40) * 0.6;
        const icon = L.divIcon({
          className: "",
          html: `<span class="map-pulse${selected === r.key ? " map-pulse-active" : ""}" style="--s:${size}px"></span>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
        const p = preview && preview.key === r.key ? preview : null;
        return (
          <Marker
            key={r.key}
            position={[r.lat, r.lng]}
            icon={icon}
            eventHandlers={{
              click: () => onSelect(selected === r.key ? null : r.key),
              mouseover: () => enter(r),
              mouseout: leave,
            }}
          >
            <Tooltip className="holo-tip" direction="top" offset={[0, -14]} opacity={1}>
              <div className="holo-card">
                <div className="holo-head">
                  <span className="holo-name">{r.label}</span>
                  <span className="holo-count">{r.count}</span>
                </div>
                {p && p.story ? (
                  <div className="holo-file">
                    <p className="holo-year">{p.story.year}</p>
                    <p className="holo-title">{lang === "am" ? p.story.title_am : p.story.title_en}</p>
                    {p.story.excerpt_en && <p className="holo-excerpt">{p.story.excerpt_en}</p>}
                  </div>
                ) : (
                  <p className="holo-scan">{lang === "am" ? "ՍԿԱՆԱՒՈՐՈՒՄ…" : "SCANNING…"}</p>
                )}
                <p className="holo-hint">{lang === "am" ? "ՍԵՂՄԵԼ՝ ԹԻՐԱԽԱՒՈՐԵԼՈՒ" : "CLICK TO TARGET"}</p>
              </div>
            </Tooltip>
          </Marker>
        );
      })}
    </MapContainer>
  );
}