const fs = require('fs');

/**
 * This script counts the total number of venues from JSON files generated from PDF reports.
 *
 * @param filePath {string} - The path to the JSON file containing venue data.
 * @returns {number} - The total number of venues counted from the JSON data.
 */
function countTotalVenues(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(data);

        return jsonData?.data?.map(v =>
            v.validation?.data?.status === "valid"
                ? v.extraction?.data?.venues?.length
                : v.validation?.data?.json?.venues?.length
        ).reduce((acc, curr) => acc + (curr || 0), 0);
    } catch (err) {
        return 0;
    }
}

const sv2 = countTotalVenues("./venues_summer/Full-report-venues-post-games-use-summer.pdf.json");
const wv2 = countTotalVenues("./venues_winter/Full-report-venues-post-games-use-winter.pdf.json");
const sv1 = countTotalVenues("../PDF_summery/venues_summer/Full-report-venues-post-games-use-summer.pdf.json");
const wv1 = countTotalVenues("../PDF_summery/venues_winter/Full-report-venues-post-games-use-winter.pdf.json");

console.log(`Total number of venues v2 summer: ${sv2}`);
console.log(`Total number of venues v2 winter: ${wv2}`);
console.log(`Total number of venues v2: ${sv2 + wv2}`);
console.log(`Total number of venues v2 summer: ${sv1}`);
console.log(`Total number of venues v2 winter: ${wv1}`);
console.log(`Total number of venues v1: ${sv1 + wv1}`);
