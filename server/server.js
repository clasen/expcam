import { createServer } from 'http';
import SxServer from 'shotx/server';
import { ModelMix } from 'modelmix';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import hashFactory from 'hash-factory';

const fileHash = hashFactory({ words: true, alpha: true, now: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = createServer();
const sxServer = new SxServer({ server });

const categories = [
    'lodging', 'transport', 'meals', 'miscellaneous', 'purchases', 'other'
];

// Set a simple authentication handler
sxServer
    .onMessage('process_receipt', async (data) => {
        try {
            // Process with ModelMix
            const mmix = ModelMix.new().sonnet4().addImageFromBuffer(data);
            const result = await mmix.json({
                success: true,
                data: {
                    merchant: 'Delta Airlines',
                    amount: 1005.1,
                    currency: 'USD',
                    date: '2025-07-23',
                    hour: '13:20',
                    category: 'transport',
                    description: `Delta Airlines flight from New York to Los Angeles`,
                    taxAmount: (1005.1 * 0.1).toFixed(2),
                    paymentMethod: 'Credit Card',
                    receiptNumber: `RCP-1230121`,
                    location: 'New York, NY'
                },
                confidence: 90,
            }, { data: { category: categories.join('|') }, currency: 'ISO 4217 currency code' }, { addExample: true });

            // Generate unique filename
            const filename = fileHash(result.data.description) + '.jpg';
            console.log('Filename:', filename);
            // Save to main project's public directory so it's accessible via Vite dev server
            const filePath = join(__dirname, '..', 'public', 'receipts', filename);
            const imageUrl = `/receipts/${filename}`;

            // Save image to public/receipts directory
            writeFileSync(filePath, data);
            console.log('Image saved to:', filePath);
            result.data.imageUrl = imageUrl;

            return result;
        } catch (error) {
            console.error('Error processing receipt:', error);
            return {
                success: false,
                error: error.message
            };
        }
    })


const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`OCR Server running at http://localhost:${PORT}`);
    console.log('Ready to process receipt images...');
});