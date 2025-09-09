export async function fetchData() {
    try {
        const response = await fetch('/api/olympics/all', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            const errorText = await response.text();
            return {data: [], error: `Failed to fetch Olympic data: ${response.status} ${errorText}`};
        }

        return {data: await response.json(), error: null};
    } catch (err) {
        console.error('Error fetching data:', err);
        return {data: [], error: 'Error fetching data: ' + err.message};
    }
}