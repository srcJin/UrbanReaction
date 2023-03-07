const GeoTools = {
  fetchNeighbourTiles: function (coords, bbox, primaryTile) {
    const tiles = {
      mainTile_i: null,
      /*tile_nw: [],
	        tile_ne: [],
	        tile_sw: [],
	        tile_se: [],*/
      shift_x: null,
      shift_y: null,
      tile_width: null,
      tile_length: null,
    };

    tiles.quad = {
      nw: {},
      ne: {},
      sw: {},
      se: {},
    };

    tiles.nineGrid = {
      center: {},
      nw: {},
      ne: {},
      sw: {},
      se: {},
      n: {},
      s: {},
      e: {},
      w: {},
    };

    //find approx center coords in degrees:
    const centerLng = (bbox[0] + bbox[2]) / 2;
    const centerLat = (bbox[1] + bbox[3]) / 2;

    //find the tile the center_approx falls in at 15 zoom
    const xtile = long2tile(centerLng, 15);
    const ytile = lat2tile(centerLat, 15);

    //Get NW corner of the tile
    const tileLng_nw = tile2long(xtile, 15);
    const tileLat_nw = tile2lat(ytile, 15);

    //Get SE corner of the tile
    const tileLng_se = tile2long(xtile + 1, 15);
    const tileLat_se = tile2lat(ytile + 1, 15);

    //Calc length and width of tile
    const tile_width = measure(tileLat_nw, tileLng_nw, tileLat_nw, tileLng_se);
    const tile_length = measure(tileLat_nw, tileLng_nw, tileLat_se, tileLng_nw);

    //Calc dist from NW Tile vertex to bounding box CENTER of the site
    const nw_toCenterApprox_x = measure(tileLat_nw, tileLng_nw, tileLat_nw, centerLng);
    const nw_toCenterApprox_y = measure(tileLat_nw, tileLng_nw, centerLat, tileLng_nw);

    /*const nw_toCenterApprox_x = measure(tileLat_nw, centerLng, tileLat_nw, tileLng_nw)
        const nw_toCenterApprox_y = measure(centerLat, tileLng_nw, tileLat_nw, tileLng_nw)*/

    //Determine where the tile sits in a 2x2 grid
    let x_quad, y_quad, tile_quad;
    nw_toCenterApprox_x < tile_width / 2 ? (x_quad = 'w') : (x_quad = 'e');
    nw_toCenterApprox_y < tile_length / 2 ? (y_quad = 'n') : (y_quad = 's');
    tile_quad = y_quad + x_quad;

    //Determine shifts in x and y to align tile to site
    tiles.shift_x = Math.abs(nw_toCenterApprox_x);
    tiles.shift_y = nw_toCenterApprox_y;

    tiles.tile_width = tile_width;
    tiles.tile_length = tile_length;
    tiles.tile_quad = tile_quad;

    const { quad } = tiles;
    const { nineGrid } = tiles;

    //Assign ZXY to main tile in quad object
    /*quad[tile_quad] = {
            z: primaryTile.z,
            x: primaryTile.x,
            y: primaryTile.y,
            filename: `${primaryTile.z}_${primaryTile.x}_${primaryTile.y}.png`
        }*/

    tiles.tile_quad = 'center';
    tile_quad = 'center';

    nineGrid.center = {
      z: primaryTile.z,
      x: primaryTile.x,
      y: primaryTile.y,
      filename: `${primaryTile.z}_${primaryTile.x}_${primaryTile.y}.png`,
    };

    //Matrix to calculate ZXY of other tiles in quad
    const quadMatrix = {
      nw: {
        ne: { x: -1, y: 0 },
        sw: { x: 0, y: -1 },
        se: { x: -1, y: -1 },
      },
      ne: {
        nw: { x: 1, y: 0 },
        sw: { x: 1, y: -1 },
        se: { x: 0, y: -1 },
      },
      sw: {
        nw: { x: 0, y: 1 },
        ne: { x: -1, y: 1 },
        se: { x: -1, y: 0 },
      },
      se: {
        nw: { x: 1, y: 1 },
        sw: { x: 1, y: 0 },
        ne: { x: 0, y: 1 },
      },
    };

    const nineMatrix = {
      center: {
        n: { x: 0, y: 1 },
        s: { x: 0, y: -1 },
        w: { x: 1, y: 0 },
        e: { x: -1, y: 0 },
        nw: { x: 1, y: 1 },
        ne: { x: -1, y: 1 },
        sw: { x: 1, y: -1 },
        se: { x: -1, y: -1 },
      },
    };

    //Calculate ZXY of other tiles in quad

    // console.log( 'tile_quad:: ', tile_quad )

    for (let key in nineGrid) {
      // console.log( 'key:: ', key )

      if (key != tile_quad) {
        nineGrid[key].z = primaryTile.z;
        nineGrid[key].x = nineGrid[tile_quad].x + nineMatrix[tile_quad][key].x;
        nineGrid[key].y = nineGrid[tile_quad].y + nineMatrix[tile_quad][key].y;
        nineGrid[key].filename = `${nineGrid[key].z}_${nineGrid[key].x}_${nineGrid[key].y}.png`;
      }
    }

    return tiles;
  },

  fetchPrimaryTile: function (coords) {
    const primaryTile = {};
    let avgCoord = getAvgCoord(coords);

    //Mapbox tiles available at zoom 15
    let zoom = 15;

    //Determine ZXY indices of tile to retrieve tile PNG from Mapbox API
    var xtile = long2tile(avgCoord.lng, zoom);
    var ytile = lat2tile(avgCoord.lat, zoom);

    //store ZXY of tile in Map3D object
    primaryTile.x = xtile;
    primaryTile.y = ytile;
    primaryTile.z = zoom;

    return primaryTile;
  },
};

function long2tile(lng, zoom) {
  return Math.floor(((lng + 180) / 360) * Math.pow(2, zoom));
}

function lat2tile(lat, zoom) {
  return Math.floor(
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
      Math.pow(2, zoom)
  );
}

function tile2long(x, z) {
  return (x / Math.pow(2, z)) * 360 - 180;
}

function tile2lat(y, z) {
  var n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

function measure(lat1, lng1, lat2, lng2) {
  var R = 6378.137; // Radius of earth in KM
  var dLat = ((lat2 - lat1) * Math.PI) / 180;
  var dLng = ((lng2 - lng1) * Math.PI) / 180;
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;

  return d * 1000; // meters
}

function getAvgCoord(coords) {
  let tLat = 0,
    tLng = 0;

  for (const coord of coords) {
    tLat += coord.lat;
    tLng += coord.lng;
  }

  tLat /= coords.length;
  tLng /= coords.length;

  const avgCoord = {};
  avgCoord.lat = tLat;
  avgCoord.lng = tLng;

  return avgCoord;
}

export default GeoTools;
