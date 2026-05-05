const fs = require('fs');

// Load map data
const mapData = JSON.parse(fs.readFileSync('processed_map.json', 'utf8'));

// Load app.js
let appJs = fs.readFileSync('public/app.js', 'utf8');

// Generate SVG paths
const pathsHtml = mapData.locations.map(loc => {
    return `<path class="state-path" data-state="${loc.name}" d="${loc.path}" />`;
}).join('\n            ');

// Prepare the new indiaSVG variable content
const newIndiaSVG = `    const indiaSVG = \`
        <svg class="india-map-svg" viewBox="${mapData.viewBox}" xmlns="http://www.w3.org/2000/svg">
            ${pathsHtml}
        </svg>
    \`;`;

// Find and replace the indiaSVG definition
// Use a regex that captures from 'const indiaSVG = `' to the closing '`;'
const regex = /const indiaSVG = `[^`]*`;/s;
if (regex.test(appJs)) {
    appJs = appJs.replace(regex, newIndiaSVG);
    fs.writeFileSync('public/app.js', appJs);
    console.log('Successfully updated app.js with ' + mapData.locations.length + ' paths.');
} else {
    console.error('Could not find indiaSVG definition in app.js');
}
