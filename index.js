import Roster from "roster-server";
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configurar opciones de seguridad básicas
app.disable('x-powered-by');

// Servir archivos estáticos desde dist con opciones de caché
app.use(express.static(path.join(__dirname, 'dist'), {
    maxAge: '1d',
    etag: true,
    lastModified: true
}));

// Middleware para manejar errores 404 en archivos estáticos
app.use((err, req, res, next) => {
    if (err.status === 404) {
        res.status(404).send('404 - Not Found');
    } else {
        next(err);
    }
});

// Capturar rutas que solo contengan letras, números, guiones y slashes
app.get(/^[\/\w-]+$/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'), err => {
        if (err) {
            res.status(500).send('500 - Internal Server Error');
        }
    });
});

const roster = new Roster({ email: 'mclasen@blyts.com' });

roster.register('excam.tagnu.com', (httpsServer) => {
    return app;
});

roster.register('excam-server.tagnu.com', (httpsServer) => {
    import('./server/server.js').then((module) => {
        return module.default(httpsServer);
    });
});

roster.start();