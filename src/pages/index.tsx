import type { NextPage } from "next";
import Head from "next/head";
import { computeclosestcoordsfromevent } from "../components/getclosestcoordsfromevent";
import { CloseButton } from "../components/CloseButton";
import { SelectButtons } from "@/components/SelectButtons";
import { MapTitle } from "@/components/MapTitle";
import { InfoCarousel } from "@/components/InfoCarousel";
import { signintrack, uploadMapboxTrack } from "../components/mapboxtrack";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import MapboxLanguage from "@mapbox/mapbox-gl-language";
import Nav from "../components/nav";
import { MantineProvider, Checkbox } from "@mantine/core";
import React, { useEffect, useState, useRef } from "react";
const councildistricts = require("./CouncilDistricts.json");
const citybounds = require("./citybounds.json");
import mapboxgl from "mapbox-gl";
import { Intensity } from "@/components/Intensity";

const filterableDistricts: any = {
  1: "583",
  2: "173",
  3: "42",
  4: "193",
  5: "371",
  6: "106",
  7: "56",
  8: "308",
  9: "397",
  10: "1019",
  11: "410",
  12: "4",
  13: "999",
  14: "256",
  15: "91",
};

const filterableDistrictsKeys = Object.keys(filterableDistricts);

const Home: NextPage = () => {
  const shouldfilteropeninit =
    typeof window != "undefined" ? window.innerWidth >= 640 : false;
  const [showtotalarea, setshowtotalarea] = useState(false);
  var mapref: any = useRef(null);
  const okaydeletepoints: any = useRef(null);
  const [doneloadingmap, setdoneloadingmap] = useState(false);
  const [selectedfilteropened, setselectedfilteropened] = useState("district");
  const [filteredDistricts, setFilteredDistricts] = useState<number[]>(
    filterableDistrictsKeys.map((key) => Number(key))
  );

  const [filterpanelopened, setfilterpanelopened] =
    useState(shouldfilteropeninit);

  let [evictionData, setEvictionData]: any = useState(null);
  let [evictionInfoOpen, setEvictionInfoOpen] = useState(false);
  const [infoBoxLength, setInfoBoxLength] = useState(1);
  const [evictionInfo, setEvictionInfo] = useState(0);
  const [normalizeIntensity, setNormalizeIntensity] = useState(false);
  const [mapboxConfig, setMapboxConfig] = useState<{
    mapboxToken: string;
    mapboxStyle: string;
  } | null>(null);

  //template name, this is used to submit to the map analytics software what the current state of the map is.
  var mapname = "Tenant-Buyouts";

  const setFilteredDistrictPre = (input: string[]) => {
    if (input.length === 0) {
      setFilteredDistricts([99999]);
    } else {
      setFilteredDistricts(input.map((x) => Number(x)));
    }
  };

  var [hasStartedControls, setHasStartedControls] = useState(false);

  function checkHideOrShowTopRightGeocoder() {
    var toprightbox = document.querySelector(".mapboxgl-ctrl-top-right");
    if (toprightbox) {
      var toprightgeocoderbox: any = toprightbox.querySelector(
        ".mapboxgl-ctrl-geocoder"
      );
      if (toprightgeocoderbox) {
        if (typeof window != "undefined") {
          if (window.innerWidth >= 768) {
            toprightgeocoderbox.style.display = "block";
          } else {
            toprightgeocoderbox.style.display = "none";
          }
        } else {
          toprightgeocoderbox.style.display = "none";
        }
      }
    }
  }

  const handleResize = () => {
    checkHideOrShowTopRightGeocoder();
  };

  const divRef: any = React.useRef<HTMLDivElement>(null);

  const closeInfoBox = () => {
    console.log("mapref.current", mapref.current);
    console.log(
      "mapref.current.getSource tenant-point",
      mapref.current.getSource("tenant-point")
    );

    mapref.current.setLayoutProperty("point-selected", "visibility", "none");

    setEvictionInfoOpen(false);
    if (mapref) {
      if (mapref.current) {
        var evictionPoint: any = mapref.current.getSource("tenant-point");
        evictionPoint.setData(null);
      } else {
        console.log("no current ref");
      }
    } else {
      console.log("no ref");
    }

    if (okaydeletepoints.current) {
      okaydeletepoints.current();
    }
  };

  const recomputeIntensity = () => {
    let levels = ["interpolate", ["linear"], ["zoom"], 7, 0.2, 22, 2];

    if (normalizeIntensity === true) {
      levels = ["interpolate", ["linear"], ["zoom"], 7, 3, 15, 4];
    }

    var layer = mapref.current.getLayer("tenant-buyouts-2019-2024");

    if (layer) {
      mapref.current.setPaintProperty(
        "tenant-buyouts-2019-2024",
        "heatmap-intensity",
        levels
      );
    }
  };

  useEffect(() => {
    if (mapref.current) {
      recomputeIntensity();
    }
  }, [normalizeIntensity]);

  useEffect(() => {
    if (mapboxConfig && divRef.current) {
      mapboxgl.accessToken = mapboxConfig.mapboxToken;
      // mapboxgl.accessToken =
      //   "pk.eyJ1Ijoia2VubmV0aG1lamlhIiwiYSI6ImNsZG1oYnpxNDA2aTQzb2tkYXU2ZWc1b3UifQ.PxO_XgMo13klJ3mQw1QxlQ";

      const formulaForZoom = () => {
        if (typeof window != "undefined") {
          if (window.innerWidth > 700) {
            return 10;
          } else {
            return 9.1;
          }
        }
      };

      const urlParams = new URLSearchParams(
        typeof window != "undefined" ? window.location.search : ""
      );
      const latParam = urlParams.get("lat");
      const lngParam = urlParams.get("lng");
      const zoomParam = urlParams.get("zoom");
      const debugParam = urlParams.get("debug");

      var mapparams: any = {
        container: divRef.current, // container ID
        style: "mapbox://styles/kennethmejia/clqy3aerb00fj01ob1tj3b5m2", // style URL (THIS IS STREET VIEW)
        center: [-118.41, 34], // starting position [lng, lat]
        zoom: formulaForZoom(), // starting zoom
      };

      const map = new mapboxgl.Map(mapparams);
      mapref.current = map;

      var rtldone = false;

      try {
        if (rtldone === false && hasStartedControls === false) {
          setHasStartedControls(true);
          //multilingual support
          //right to left allows arabic rendering
          mapboxgl.setRTLTextPlugin(
            "https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.10.1/mapbox-gl-rtl-text.js",
            (callbackinfo: any) => {
              console.log(callbackinfo);
              rtldone = true;
            }
          );
        }

        const language = new MapboxLanguage();
        map.addControl(language);
      } catch (error) {
        console.error(error);
      }

      window.addEventListener("resize", handleResize);

      map.on("load", () => {
        setdoneloadingmap(true);
        setshowtotalarea(window.innerWidth > 640 ? true : false);

        okaydeletepoints.current = () => {
          try {
            var evictionPoint: any = map.getSource("tenant-point");
            evictionPoint.setData(null);
          } catch (err) {
            console.error(err);
          }
        };

        const processgeocodereventresult = (eventmapbox: any) => {
          var singlePointSet: any = map.getSource("single-point");

          singlePointSet.setData({
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: eventmapbox.result.geometry,
              },
            ],
          });
        };

        const processgeocodereventselect = (object: any) => {
          var coord = object.feature.geometry.coordinates;
          var singlePointSet: any = map.getSource("single-point");

          singlePointSet.setData({
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: object.feature.geometry,
              },
            ],
          });
        };

        const geocoder: any = new MapboxGeocoder({
          accessToken: mapboxgl.accessToken,
          mapboxgl: map,
          proximity: {
            longitude: -118.41,
            latitude: 34,
          },
          marker: true,
        });

        var colormarker = new mapboxgl.Marker({
          color: "#41ffca",
        });

        const geocoderopt: any = {
          accessToken: mapboxgl.accessToken,
          mapboxgl: mapboxgl,
          marker: {
            color: "#41ffca",
          },
        };

        const geocoder2 = new MapboxGeocoder(geocoderopt);
        const geocoder3 = new MapboxGeocoder(geocoderopt);

        geocoder.on("result", (event: any) => {
          processgeocodereventresult(event);
        });

        geocoder.on("select", function (object: any) {
          processgeocodereventselect(object);
        });

        var geocoderId = document.getElementById("geocoder");

        if (geocoderId) {
          if (!document.querySelector(".geocoder input")) {
            geocoderId.appendChild(geocoder3.onAdd(map));

            var inputMobile = document.querySelector(".geocoder input");

            try {
              var loadboi = document.querySelector(
                ".mapboxgl-ctrl-geocoder--icon-loading"
              );
              if (loadboi) {
                var brightspin: any = loadboi.firstChild;
                if (brightspin) {
                  brightspin.setAttribute("style", "fill: #e2e8f0");
                }
                var darkspin: any = loadboi.lastChild;
                if (darkspin) {
                  darkspin.setAttribute("style", "fill: #94a3b8");
                }
              }
            } catch (err) {
              console.error(err);
            }

            if (inputMobile) {
              inputMobile.addEventListener("focus", () => {
                //make the box below go away
              });
            }
          }

          geocoder2.on("result", (event: any) => {
            processgeocodereventresult(event);
          });

          geocoder2.on("select", function (object: any) {
            processgeocodereventselect(object);
          });

          geocoder3.on("result", (event: any) => {
            processgeocodereventresult(event);
          });

          geocoder3.on("select", function (object: any) {
            processgeocodereventselect(object);
          });
        }

        map.addSource("single-point", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
          },
        });

        if (debugParam) {
          map.showTileBoundaries = true;
          map.showCollisionBoxes = true;
          map.showPadding = true;
        }

        if (urlParams.get("terraindebug")) {
          map.showTerrainWireframe = true;
        }

        if (
          !document.querySelector(
            ".mapboxgl-ctrl-top-right > .mapboxgl-ctrl-geocoder"
          )
        ) {
          map.addControl(geocoder2);
        }

        checkHideOrShowTopRightGeocoder();

        // Create a popup, but don't add it to the map yet.
        const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
        });

        map.addSource("tenant-point", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
          },
        });

        map.on("mouseenter", "tenant-buyouts-2019-2024", (e: any) => {
          const hoveredFeature = e.features[0];

          if (hoveredFeature && hoveredFeature.geometry) {
            map.getCanvas().style.cursor = "pointer";

            popup.setLngLat(e.lngLat);

            const areaPC = hoveredFeature.properties["CD"];

            const allthelineitems = e.features.map((eachCase: any) => {
              if (eachCase.properties?.["Address"]) {
                return `<li class="leading-none my-2 text-blue-400">Address: ${
                  eachCase.properties["Address"]
                }
                            <br />
                            ${
                              eachCase.properties?.["City"]
                                ? `<span class="text-blue-400">City: ${eachCase.properties["City"]}</span>`
                                : ""
                            }
                            <br />
                            ${
                              eachCase.properties?.["State"]
                                ? `<span class="text-blue-400">State: ${eachCase.properties["State"]}</span>`
                                : ""
                            }
                            <br />
                            ${
                              eachCase.properties?.["Zip Code"]
                                ? `<span class="text-blue-400">Zip: ${eachCase.properties["Zip Code"]}</span> `
                                : ""
                            }
                            <br />
                            ${
                              eachCase.properties?.["Amount"]
                                ? `<span class="text-slate-100">Amount: ${eachCase.properties["Amount"]}</span>`
                                : ""
                            }
                            <br />
                            ${
                              eachCase.properties?.["Year"]
                                ? `<span class="text-amber-400">Year: ${eachCase.properties["Year"]}</span>`
                                : ""
                            }
                            <br />
                            ${
                              eachCase.properties?.["Rent Credit"]
                                ? `<span class="text-lime-400">Rent Credit: ${eachCase.properties["Rent Credit"]}</span>`
                                : ""
                            }
                      </li>`;
              }
            });

            popup
              .setHTML(
                ` <div>
                <p class="font-semibold">Council District: ${areaPC}</p>
                <p>${e.features.length} Tenant Buyout${
                  e.features.length > 1 ? "s" : ""
                }</p>
                <ul class='list-disc leading-none'>
                  ${
                    allthelineitems.length <= 3
                      ? allthelineitems.join("")
                      : allthelineitems.splice(0, 3).join("")
                  }
                </ul> 
                ${
                  allthelineitems.length >= 1
                    ? `<p class="text-xs font-bold text-gray-300 mt-4">CLICK LOCATION TO SEE MORE</p>`
                    : ""
                }
              </div><style>
              .mapboxgl-popup-content {
                background: #212121e0;
                color: #fdfdfd;
              }
      
              .flexcollate {
                row-gap: 0.5rem;
                display: flex;
                flex-direction: column;
              }
              </style>`
              )
              .addTo(map);
          }
        });

        map.on("mouseleave", "tenant-buyouts-2019-2024", () => {
          map.getCanvas().style.cursor = "";
          popup.remove();
        });

        map.loadImage("/map-marker.png", (error, image: any) => {
          if (error) throw error;

          // Add the image to the map style.
          map.addImage("map-marker", image);

          if (true) {
            // example of how to add a pointer to what is currently selected
            map.addLayer({
              id: "point-selected",
              type: "symbol",
              source: "tenant-point",
              paint: {
                "icon-color": "#FF8C00",
                "icon-translate": [0, -13],
              },
              layout: {
                "icon-image": "map-marker",
                // get the title name from the source's "title" property
                "text-allow-overlap": true,
                "icon-allow-overlap": true,
                "icon-ignore-placement": true,
                "text-ignore-placement": true,
                "icon-size": 0.5,
                "icon-text-fit": "both",
              },
            });
          }
        });

        map.on("mousedown", "tenant-buyouts-2019-2024", (e: any) => {
          setEvictionInfo(0);
          setInfoBoxLength(1);
          setEvictionInfoOpen(true);
          console.log("e.features", e.features);
          let filteredData = e.features.map((obj: any) => {
            return {
              cd: obj.properties["CD"],
              address: obj.properties["Address"],
              city: obj.properties["City"],
              zip: obj.properties["Zip Code"],
              state: obj.properties["State"],
              filed: obj.properties["Filed Date"],
              amount: obj.properties.Amount,
              year: obj.properties.Year,
              rentCredit: obj.properties["Rent Credit"],
            };
          });

          var evictionPoint: any = map.getSource("tenant-point");
          evictionPoint.setData(e.features[0].geometry);

          map.setLayoutProperty("point-selected", "visibility", "visible");

          setEvictionData(filteredData);
        });

        if (true) {
          map.addLayer(
            {
              id: "citybound",
              type: "line",
              source: {
                type: "geojson",
                data: citybounds,
              },
              paint: {
                "line-color": "#dddddd",
                "line-opacity": 1,
                "line-width": 2,
              },
            },
            "road-label-navigation"
          );

          map.addSource("citycouncildist", {
            type: "geojson",
            data: councildistricts,
          });

          map.addLayer(
            {
              id: "councildistrictslayer",
              type: "line",
              source: "citycouncildist",
              paint: {
                "line-color": "#dddddd",
                "line-opacity": 1,
                "line-width": 1,
              },
            },
            "road-label-navigation"
          );

          map.addLayer(
            {
              id: "councildistrictsselectlayer",
              type: "fill",
              source: "citycouncildist",
              paint: {
                "fill-color": "#000000",
                "fill-opacity": 0,
              },
            },
            "road-label-navigation"
          );

          map.on("mousedown", "councildistrictsselectlayer", (e: any) => {
            var sourceofcouncildistselect: any = map.getSource(
              "selected-council-dist"
            );

            var clickeddata = e.features[0].properties.district;

            var councildistpolygonfound = councildistricts.features.find(
              (eachDist: any) => eachDist.properties.district === clickeddata
            );

            if (sourceofcouncildistselect) {
              if (councildistpolygonfound) {
                sourceofcouncildistselect.setData(councildistpolygonfound);
              }
            }
          });

          map.addSource("selected-council-dist", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: [],
            },
          });

          map.addLayer(
            {
              id: "selected-council-dist-layer",
              type: "fill",
              source: "selected-council-dist",
              paint: {
                "fill-color": "#000000",
                "fill-opacity": 0.3,
              },
            },
            "road-label-navigation"
          );
        }

        if (hasStartedControls === false) {
          // Add zoom and rotation controls to the map.
          map.addControl(new mapboxgl.NavigationControl());

          // Add geolocate control to the map.
          map.addControl(
            new mapboxgl.GeolocateControl({
              positionOptions: {
                enableHighAccuracy: true,
              },
              // When active the map will receive updates to the device's location as it changes.
              trackUserLocation: true,
              // Draw an arrow next to the location dot to indicate which direction the device is heading.
              showUserHeading: true,
            })
          );
        }

        checkHideOrShowTopRightGeocoder();

        map.on("dragstart", (e) => {
          uploadMapboxTrack({
            mapname,
            eventtype: "dragstart",
            globallng: map.getCenter().lng,
            globallat: map.getCenter().lat,
            globalzoom: map.getZoom(),
          });
        });

        map.on("dragend", (e) => {
          uploadMapboxTrack({
            mapname,
            eventtype: "dragend",
            globallng: map.getCenter().lng,
            globallat: map.getCenter().lat,
            globalzoom: map.getZoom(),
          });
        });

        map.on("zoomstart", (e) => {
          uploadMapboxTrack({
            mapname,
            eventtype: "dragstart",
            globallng: map.getCenter().lng,
            globallat: map.getCenter().lat,
            globalzoom: map.getZoom(),
          });
        });
      });

      var getmapboxlogo: any = document.querySelector(".mapboxgl-ctrl-logo");

      if (getmapboxlogo) {
        getmapboxlogo.remove();
      }
    }
  }, [mapboxConfig]);

  useEffect(() => {
    let arrayoffilterables: any = [];

    arrayoffilterables.push([
      "match",
      ["get", "CD"],
      filteredDistricts,
      true,
      false,
    ]);

    if (mapref.current) {
      if (doneloadingmap) {
        const filterinput = JSON.parse(
          JSON.stringify(["all", ...arrayoffilterables])
        );

        if (doneloadingmap === true) {
          mapref.current.setFilter("tenant-buyouts-2019-2024", filterinput);
        }
      }
    }
  }, [filteredDistricts]);

  const onSelect = () => {
    if (selectedfilteropened === "district") {
      setFilteredDistrictPre(filterableDistrictsKeys);
    }
  };

  const onUnselect = () => {
    if (selectedfilteropened === "district") {
      setFilteredDistrictPre([]);
    }
  };

  const onInvert = () => {
    if (selectedfilteropened === "district") {
      setFilteredDistrictPre(
        filterableDistrictsKeys.filter(
          (n) => !filteredDistricts.includes(Number(n))
        )
      );
    }
  };

  return (
    <div className="flex flex-col h-full w-screen absolute">
      <MantineProvider
        theme={{ colorScheme: "dark" }}
        withGlobalStyles
        withNormalizeCSS
      >
        <Head>
          <meta charSet="utf-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
          />
          <title>Cash for Keys LA | Map</title>
          <meta property="og:type" content="website" />
          <meta name="twitter:site" content="@lacontroller" />
          <meta name="twitter:creator" content="@lacontroller" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta
            name="twitter:title"
            key="twittertitle"
            content="Cash for Keys LA | Map"
          ></meta>
          <meta
            name="twitter:description"
            key="twitterdesc"
            content="Cash for Keys LA"
          ></meta>
          <meta
            name="twitter:image"
            key="twitterimg"
            content="https://cashforkeys.lacontroller.app/cash-for-keys.png"
          ></meta>
          <meta name="description" content="Cash for Keys LA | Map" />

          <meta
            property="og:url"
            content="https://cashforkeys.lacontroller.app/"
          />
          <meta property="og:type" content="website" />
          <meta property="og:title" content="Cash for Keys LA | Map" />
          <meta property="og:description" content="Cash for Keys LA | Map" />
          <meta
            property="og:image"
            content="https://cashforkeys.lacontroller.app/cash-for-keys.png"
          />
        </Head>

        <div className="flex-none">
          <Nav />
        </div>

        <div className="flex-initial h-content flex-col flex z-50">
          <div className="max-h-screen flex-col flex z-5">
            <div className="hidden sm:block">
              <MapTitle />
            </div>
            <div
              className={`geocoder absolute xs:mt-[1.5em] sm:mt-[2.7em] md:mt-[4.1em] ml-1 left-1 md:hidden xs:text-sm sm:text-base md:text-lg`}
              id="geocoder"
            ></div>
            <div className="w-content"></div>

            <div className="fixed mt-[3em] ml-2 sm:hidden flex flex-row">
              {filterpanelopened === false && (
                <button
                  onClick={() => {
                    setfilterpanelopened(true);
                  }}
                  className={` md:hidden mt-2 rounded-full px-3 pb-1.5 pt-0.5 text-sm bold md:text-base 
                  bg-gray-800 bg-opacity-80 text-white border-white border-2`}
                >
                  <svg
                    style={{
                      width: "20px",
                      height: "20px",
                    }}
                    viewBox="0 0 24 24"
                    className="inline align-middle mt-0.5"
                  >
                    <path
                      fill="currentColor"
                      d="M14,12V19.88C14.04,20.18 13.94,20.5 13.71,20.71C13.32,21.1 12.69,21.1 12.3,20.71L10.29,18.7C10.06,18.47 9.96,18.16 10,17.87V12H9.97L4.21,4.62C3.87,4.19 3.95,3.56 4.38,3.22C4.57,3.08 4.78,3 5,3V3H19V3C19.22,3 19.43,3.08 19.62,3.22C20.05,3.56 20.13,4.19 19.79,4.62L14.03,12H14Z"
                    />
                  </svg>
                  <span>Filter</span>
                </button>
              )}
            </div>

            <div
              className="filterandinfobox fixed top-auto bottom-0 left-0 right-0 sm:max-w-sm sm:absolute sm:mt-[6em] md:mt-[3em] sm:ml-3 
                        sm:top-auto sm:bottom-auto sm:left-auto sm:right-auto flex flex-col gap-y-2"
            >
              {filterpanelopened === false && (
                <div className=" flex flex-row">
                  <button
                    onClick={() => {
                      setfilterpanelopened(true);
                    }}
                    className={`hidden md:block mt-2 rounded-full px-3 pb-1.5 pt-0.5 text-sm bold md:text-base 
                  bg-gray-800 bg-opacity-80 text-white border-white border-2`}
                  >
                    <svg
                      style={{
                        width: "20px",
                        height: "20px",
                      }}
                      viewBox="0 0 24 24"
                      className="inline align-middle mt-0.5"
                    >
                      <path
                        fill="currentColor"
                        d="M14,12V19.88C14.04,20.18 13.94,20.5 13.71,20.71C13.32,21.1 12.69,21.1 12.3,20.71L10.29,18.7C10.06,18.47 9.96,18.16 10,17.87V12H9.97L4.21,4.62C3.87,4.19 3.95,3.56 4.38,3.22C4.57,3.08 4.78,3 5,3V3H19V3C19.22,3 19.43,3.08 19.62,3.22C20.05,3.56 20.13,4.19 19.79,4.62L14.03,12H14Z"
                      />
                    </svg>
                    <span>Filter</span>
                  </button>
                </div>
              )}
              <div
                className={`
              ${
                filterpanelopened
                  ? "relative bg-zinc-900 w-content bg-opacity-90 px-2 py-1 mt-1 sm:rounded-lg"
                  : "hidden"
              }
              `}
              >
                <CloseButton
                  onClose={() => {
                    setfilterpanelopened(false);
                  }}
                />
                <div className="gap-x-0 flex flex-row w-full pr-8">
                  <button
                    onClick={() => {
                      setselectedfilteropened("district");
                    }}
                    className={`px-2 border-b-2  py-1  font-semibold ${
                      selectedfilteropened === "district"
                        ? "border-[#41ffca] text-[#41ffca]"
                        : "hover:border-white border-transparent text-gray-50"
                    }`}
                  >
                    Council District
                  </button>
                </div>
                <div className="flex flex-col">
                  {selectedfilteropened === "district" && (
                    <div className="mt-2">
                      <SelectButtons
                        onSelect={onSelect}
                        onUnselect={onUnselect}
                        onInvert={onInvert}
                      />
                      <div className="flex flex-row gap-x-1">
                        <div className="flex items-center">
                          <Checkbox.Group
                            value={filteredDistricts.map((district) =>
                              String(district)
                            )}
                            onChange={setFilteredDistrictPre}
                          >
                            <div
                              className={`grid grid-cols-3
                          } gap-x-4 `}
                            >
                              {Object.entries(filterableDistricts).map(
                                (eachEntry) => (
                                  <Checkbox
                                    value={eachEntry[0]}
                                    label={
                                      <span className="text-nowrap text-xs">
                                        <span className="text-white">
                                          {eachEntry[0]}
                                        </span>{" "}
                                        <span>{eachEntry[1]}</span>
                                      </span>
                                    }
                                    key={eachEntry[0]}
                                  />
                                )
                              )}
                            </div>
                          </Checkbox.Group>
                        </div>
                      </div>
                      <div>
                        <p className="text-blue-400 text-xs mt-1">
                          <strong>Tenant Buyouts by Council District</strong>
                        </p>
                      </div>
                      <Intensity
                        normalizeIntensity={normalizeIntensity}
                        setNormalizeIntensity={setNormalizeIntensity}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div
                className={`text-sm ${
                  evictionInfoOpen
                    ? `px-3 pt-2 pb-3 fixed sm:relative top-auto bottom-0 left-0 right-0 w-full sm:mt-2 sm:w-auto 
                                    sm:top-auto sm:bottom-auto sm:left-auto sm:right-auto bg-[#212121] sm:rounded-xl bg-opacity-90 sm:bg-opacity-80 text-white 
                                    border-t-2 border-gray-200 sm:border sm:border-gray-400`
                    : "hidden"
                }`}
              >
                <CloseButton
                  onClose={() => {
                    closeInfoBox();
                    setInfoBoxLength(1);
                    setEvictionInfo(0);
                    if (mapref.current) {
                      var evictionPoint: any =
                        mapref.current.getSource("tenant-point");
                      if (evictionPoint) {
                        evictionPoint.setData(null);
                      }
                    } else {
                      console.log("no ref current");
                    }
                  }}
                />
                {evictionData && (
                  <InfoCarousel
                    evictionData={evictionData}
                    infoBoxLength={infoBoxLength}
                    setInfoBoxLength={setInfoBoxLength}
                    evictionInfo={evictionInfo}
                    setEvictionInfo={setEvictionInfo}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <div ref={divRef} style={{}} className="map-container w-full h-full " />

        {(typeof window !== "undefined" ? window.innerWidth >= 640 : false) && (
          <>
            <div
              className={`absolute md:mx-auto z-9 bottom-2 left-1 md:left-1/2 md:transform md:-translate-x-1/2`}
            >
              <a
                href="https://controller.lacity.gov/"
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src="https://controller.lacity.gov/images/KennethMejia-logo-white-elect.png"
                  className="h-9 md:h-10 z-40"
                  alt="Kenneth Mejia LA City Controller Logo"
                />
              </a>
            </div>
          </>
        )}
      </MantineProvider>
    </div>
  );
};

export default Home;
