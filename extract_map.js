const fs = require('fs');
const content = fs.readFileSync('india_map_src.js', 'utf8');
const jsonStr = content.replace('export default ', '').replace(/;$/, '');
const data = JSON.parse(jsonStr);

const output = {
    viewBox: data.viewBox,
    locations: data.locations.map(loc => ({
        name: loc.name,
        id: loc.id,
        path: loc.path
    }))
};

fs.writeFileSync('processed_map.json', JSON.stringify(output, null, 2));
console.log('Processed ' + output.locations.length + ' locations.');
