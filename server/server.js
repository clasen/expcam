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

                // Check if image needs to be rotated to make long side vertical
                if (metadata.width > metadata.height) {
                    // Image is horizontal, rotate 90 degrees to make it vertical
                    buffer = await sharp(buffer).rotate(90).toBuffer();
                    console.log('Rotated image to vertical orientation');
                }

                // Now process with sharp as JPEG with compression
                let jpgBuffer = await sharp(buffer)
                    .resize({ width: 2560, height: 2560, fit: 'inside', withoutEnlargement: true })
                    .jpeg({ quality: 70, progressive: true, mozjpeg: true })
                    .toBuffer();

                // Optionally, you can log or check the format
                console.log('Incoming image format:', metadata.format);

                // Function to process image with ModelMix
                const processWithModelMix = async (imageBuffer) => {

                    const mmix = ModelMix.new().sonnet4().gpt4o().addImageFromBuffer(imageBuffer);

                    return await mmix.json({
                        success: true,
                        rotate: 0,
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
                    }, {
                        rotate: 'Return the number of degrees (0, 90, 180, or 270) to rotate the image clockwise so that the receipt text is readable from top to bottom. 0 means no rotation needed.',
                        data: {
                            category: categories.join('|')
                        },
                        currency: 'ISO 4217 currency code'
                    }, { addExample: true });
                };

                // Process with ModelMix
                let result = await processWithModelMix(jpgBuffer);
                console.log(result);
                
                if (result.rotate > 0) {
                    console.log(`Rotating image by ${result.rotate} degrees and re-processing`);
                    
                    // Rotate the vertical buffer by the specified amount
                    jpgBuffer = await sharp(jpgBuffer).rotate(result.rotate).toBuffer();
                    
                    // Re-process with the rotated image
                    result = await processWithModelMix(jpgBuffer);
                }

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

