const { XMLParser } = require('fast-xml-parser');
const fs = require('fs');
const path = require('path');

// Mock data source function - in production this would fetch from a URL
async function fetchXmlFeed() {
    // Returning a mock XML string for demonstration
    return `
    <products>
        <product>
            <supplier_sku>PIN001</supplier_sku>
            <name>Laptop Pro X</name>
            <brand>TechBrand</brand>
            <price>15000.00</price>
            <stock>10</stock>
        </product>
        <product>
            <supplier_sku>PIN002</supplier_sku>
            <name>Monitor 4K</name>
            <brand>ViewGreat</brand>
            <price>5000.00</price>
            <stock>5</stock>
        </product>
    </products>
    `;
}

async function ingestData(client) {
    console.log('Starting ingestion...');
    const xmlData = await fetchXmlFeed();

    const parser = new XMLParser();
    const parsed = parser.parse(xmlData);

    // Handle array or single object from XML parser
    const products = Array.isArray(parsed.products.product)
        ? parsed.products.product
        : [parsed.products.product];

    console.log(\`Found \${products.length} products to ingest.\`);

    for (const p of products) {
        const query = \`
            INSERT INTO products (
                supplier_sku, supplier_name, name, brand, price_ex_vat, qty_on_hand, raw_data, master_sku
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8
            )
            ON CONFLICT (supplier_name, supplier_sku) 
            DO UPDATE SET
                name = EXCLUDED.name,
                brand = EXCLUDED.brand,
                price_ex_vat = EXCLUDED.price_ex_vat,
                qty_on_hand = EXCLUDED.qty_on_hand,
                last_updated = CURRENT_TIMESTAMP,
                raw_data = EXCLUDED.raw_data
        \`;

        const supplierName = 'Pinnacle'; // Hardcoded for this mock ingestor
        // Simple master SKU logic: just use supplier SKU for now
        const masterSku = p.supplier_sku; 

        const values = [
            p.supplier_sku,
            supplierName,
            p.name,
            p.brand,
            p.price,
            p.stock,
            JSON.stringify(p),
            masterSku
        ];

        try {
            await client.query(query, values);
            console.log(\`Upserted \${p.supplier_sku}\`);
        } catch (err) {
            console.error(\`Failed to upsert \${p.supplier_sku}: \${err.message}\`);
        }
    }
}

module.exports = { ingestData };
