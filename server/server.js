import SxServer from 'shotx/server';
import { ModelMix } from 'modelmix';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import hashFactory from 'hash-factory';
import sharp from 'sharp';
import heicConvert from 'heic-convert';

const fileHash = hashFactory({ words: true, alpha: true, now: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default (server) => {
    const sxServer = new SxServer({ server, opts: { maxHttpBufferSize: 10 * 1024 * 1024 } });

    const categories = [
        'lodging', 'transport', 'meals', 'miscellaneous', 'purchases', 'other'
    ];

    // Set a simple authentication handler
    sxServer
        .onMessage('process_receipt', async (data) => {
            try {
                let buffer = data;
                let format = null;

                // Detect format
                const image = sharp(data);
                const metadata = await image.metadata();
                format = metadata.format;

                if (format === 'heif' || format === 'heic') {
                    // Convert HEIC to JPEG buffer
                    buffer = await heicConvert({
                        buffer: data, // the HEIC file buffer
                        format: 'JPEG',
                        quality: 1
                    });
                }

                // Now process with sharp as JPEG with compression
                const jpgBuffer = await sharp(buffer)
                    .jpeg({ 
                        quality: 70,  // Reduce quality to 80% for compression
                        progressive: true,  // Use progressive JPEG for better compression
                        mozjpeg: true  // Use mozjpeg for better compression
                    })
                    .toBuffer();

                // Optionally, you can log or check the format
                console.log('Incoming image format:', metadata.format);

                // Process with ModelMix
                const mmix = ModelMix.new().sonnet4().addImageFromBuffer(jpgBuffer);
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
                const filePath = join(__dirname, '..', 'dist', 'receipts', filename);
                const imageUrl = `/receipts/${filename}`;

                // Save image to public/receipts directory
                writeFileSync(filePath, jpgBuffer);
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
};

