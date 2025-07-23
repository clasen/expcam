import { createServer } from 'http';
import SxServer from 'shotx/server';
import { ModelMix } from 'modelmix';
import 'dotenv/config';


const server = createServer();
const sxServer = new SxServer({ server });

// Set a simple authentication handler
sxServer
    .onMessage('process_receipt', async (data, socket) => {
        const mmix = ModelMix.new().sonnet4().addImageFromBuffer(data);
        const result = await mmix.json({
            success: true,
            data: {
                merchant: 'Delta Airlines',
                amount: 1005.1,
                currency: 'USD',
                date: '2025-07-23',
                category: 'travel',
                description: `Delta Airlines flight from New York to Los Angeles`,
                taxAmount: (1005.1 * 0.1).toFixed(2),
                paymentMethod: 'Credit Card',
                receiptNumber: `RCP-1230121`,
                location: 'New York, NY'
            },
            confidence: 90,
        }, { addExample: true });
        socket.send(result);
    })


const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`OCR Server running at http://localhost:${PORT}`);
    console.log('Ready to process receipt images...');
});