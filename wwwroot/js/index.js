/**
 * Elements that make up the popup.
 */
const container = document.getElementById('popup');
const content = document.getElementById('popup-content');
const closer = document.getElementById('popup-closer');
const target = document.getElementById('map');

const pinIcon = 'img/pin_drop.png';
const centerIcon = 'img/center.png';
const listIcon = 'img/view_list.png';

/**
 * Create an overlay to anchor the popup to the map.
 */
const overlay = new ol.Overlay({
    element: container,
    autoPan: true,
    autoPanAnimation: {
        duration: 250,
    },
});

const defaultIconFeature = new ol.Feature({
    geometry: new ol.geom.Point([0, 0]),
    name: 'Null Island',
    population: 4000,
    rainfall: 500,
});

const defaultIconStyle = new ol.style.Style({
    image: new ol.style.Icon({
        anchor: [0.5, 46],
        anchorXUnits: 'fraction',
        anchorYUnits: 'pixels',
        src: pinIcon,
    }),
});

defaultIconFeature.setStyle(defaultIconStyle);
const vectorSource = new ol.source.Vector({
    features: [defaultIconFeature],
});

/**
 * Add a click handler to hide the popup.
 * @return {boolean} Don't follow the href.
 */
closer.onclick = function() {
    overlay.setPosition(undefined);
    closer.blur();
    return false;
};

/* global ol, ContextMenu */
var view = new ol.View({ center: [0, 0], zoom: 4 }),
    vectorLayer = new ol.layer.Vector({ source: vectorSource }),
    baseLayer = new ol.layer.Tile({ source: new ol.source.OSM() }),
    map = new ol.Map({
        overlays: [overlay],
        target: target,
        view: view,
        layers: [baseLayer, vectorLayer],
    });

var contextmenu_items = [{
        text: 'Center map here',
        classname: 'bold',
        icon: centerIcon,
        callback: center,
    },
    {
        text: 'Some Actions',
        icon: listIcon,
        items: [{
                text: 'Center map here',
                icon: 'img/center.png',
                callback: center,
            },
            {
                text: 'Add a Marker',
                icon: pinIcon,
                callback: marker,
            },
        ],
    },
    {
        text: 'Add a Marker',
        icon: pinIcon,
        callback: marker,
    },
    '-', // this is a separator
];

var removeMarkerItem = {
    text: 'Remove this Marker',
    classname: 'marker',
    callback: removeMarker,
};

var infoMarkerItem = {
    text: 'Marker Info',
    classname: 'marker',
    callback: infoMarker,
};

var contextmenu = new ContextMenu({
    width: 180,
    items: contextmenu_items,
});
map.addControl(contextmenu);

const modify = new ol.interaction.Modify({
    hitDetection: vectorLayer,
    source: vectorSource,
});
modify.on(['modifystart', 'modifyend'], function(evt) {
    target.style.cursor = evt.type === 'modifystart' ? 'grabbing' : 'pointer';
});
const overlaySource = modify.getOverlay().getSource();
overlaySource.on(['addfeature', 'removefeature'], function(evt) {
    target.style.cursor = evt.type === 'addfeature' ? 'pointer' : '';
});

map.addInteraction(modify);

contextmenu.on('open', function(evt) {
    var feature = map.forEachFeatureAtPixel(evt.pixel, function(ft, l) {
        return ft;
    });
    if (feature && feature.get('type') === 'removable') {
        contextmenu.clear();
        removeMarkerItem.data = {
            marker: feature,
        };
        contextmenu.push(removeMarkerItem);
        infoMarkerItem.data = {
            evt: evt,
        };
        contextmenu.push(infoMarkerItem);
    } else {
        contextmenu.clear();
        contextmenu.extend(contextmenu_items);
        contextmenu.extend(contextmenu.getDefaultItems());
    }
});

map.on('pointermove', function(e) {
    var pixel = map.getEventPixel(e.originalEvent);
    var hit = map.hasFeatureAtPixel(pixel);

    if (e.dragging) return;

    map.getTargetElement().style.cursor = hit ? 'pointer' : '';
});

// from https://github.com/DmitryBaranovskiy/raphael
function elastic(t) {
    return (
        Math.pow(2, -10 * t) * Math.sin(((t - 0.075) * (2 * Math.PI)) / 0.3) + 1
    );
}

function center(obj) {
    view.animate({
        duration: 700,
        easing: elastic,
        center: obj.coordinate,
    });
}

function removeMarker(obj) {
    vectorLayer.getSource().removeFeature(obj.data.marker);
}

function infoMarker(obj) {
    const coordinate = obj.data.evt.coordinate;
    const hdms = ol.coordinate.toStringHDMS(ol.proj.toLonLat(coordinate));

    content.innerHTML = '<p>You clicked here:</p><code>' + hdms + '</code>';
    overlay.setPosition(coordinate);
}

function marker(obj) {
    var coord4326 = ol.proj.transform(obj.coordinate, 'EPSG:3857', 'EPSG:4326'),
        template = 'Coordinate is ({x} | {y})',
        iconStyle = new ol.style.Style({
            image: new ol.style.Icon({ scale: 0.6, src: pinIcon }),
            text: new ol.style.Text({
                offsetY: 25,
                text: ol.coordinate.format(coord4326, template, 2),
                font: '15px Open Sans,sans-serif',
                fill: new ol.style.Fill({ color: '#111' }),
                stroke: new ol.style.Stroke({ color: '#eee', width: 2 }),
            }),
        }),
        feature = new ol.Feature({
            type: 'removable',
            geometry: new ol.geom.Point(obj.coordinate),
        });

    feature.setStyle(iconStyle);
    vectorLayer.getSource().addFeature(feature);
}