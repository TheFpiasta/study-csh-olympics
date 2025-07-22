function countTotalVenues(msgPrefix, filePath) {

    const fs = require('fs');

    // Read the JSON file
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading the file:', err);
            return;
        }

        try {
            // Parse the JSON data
            const jsonData = JSON.parse(data);

            // Count the number of venues
            const totalVenues = jsonData?.data?.map((v => v.validation?.data?.status === "valid" ?
                v.extraction?.data?.venues?.length :
                v.validation?.data?.json?.venues?.length
            )).reduce((acc, curr) => acc + (curr || 0), 0);

            // Output the total number of venues
            console.log(`Total number of venues ${msgPrefix}: ${totalVenues}`);
        } catch (parseError) {
            console.error('Error parsing JSON data:', parseError);
        }
    }
    );
}

countTotalVenues("v2 winter", "./venues_winter/Full-report-venues-post-games-use-winter.pdf.json");
countTotalVenues("v1 winter", "../PDF_summery/venues_winter/Full-report-venues-post-games-use-winter.pdf.json");
countTotalVenues("v2 summer", "./venues_summer/Full-report-venues-post-games-use-summer.pdf.json");
countTotalVenues("v1 summer","../PDF_summery/venues_summer/Full-report-venues-post-games-use-summer.pdf.json");