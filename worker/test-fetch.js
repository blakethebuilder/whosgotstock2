async function testFetch() {
    const urls = [
        "https://www.syntech.co.za/feeds/feedhandler.php?key=668EEFF7-494A-43B9-908B-E72B79648CFC&feed=syntech-xml-full",
        "https://www.pinnacle.co.za/pinnacle/productfeed/xml/id/8756/uid/942709f3-9b39-4e93-9a5e-cdd883453178/"
    ];

    for (const url of urls) {
        console.log(`\nTesting ${url}...`);
        try {
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
                }
            });
            console.log(`Status: ${res.status} ${res.statusText}`);
            const text = await res.text();
            console.log(`Body length: ${text.length}`);
            console.log(`First 200 chars: ${text.substring(0, 200)}`);
        } catch (e) {
            console.error(`Fetch failed: ${e.message}`);
            console.error(e);
        }
    }
}

testFetch();
