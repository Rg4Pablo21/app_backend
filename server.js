const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors({ origin: 'http://127.0.0.1:5501' }));

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '0521', 
    database: 'todo_list',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function conectar(consulta_sql, params = []) {
    try {
        const conexion = await pool.getConnection();
        console.log("Conexión exitosa a la base de datos.");
        const [rows] = await conexion.execute(consulta_sql, params);
        conexion.release();
        return rows;
    } catch (error) {
        console.error("Error al conectar a la base de datos:", error);
        return null;
    }
}

app.get('/tareas', async (req, res) => {
    const resultado = await conectar("SELECT * FROM tareas");
    res.json(resultado);
});

app.post('/tareas', async (req, res) => {
    const { nombre } = req.body;
    if (!nombre) {
        return res.status(400).json({ error: "El nombre de la tarea es obligatorio" });
    }

    await conectar("INSERT INTO tareas (nombre) VALUES (?)", [nombre]);
    const nuevaTarea = await conectar("SELECT * FROM tareas ORDER BY id DESC LIMIT 1");
    res.json(nuevaTarea[0]);
});

app.delete('/tareas/:id', async (req, res) => {
    const { id } = req.params;
    await conectar("DELETE FROM tareas WHERE id = ?", [id]);
    res.json({ mensaje: "Tarea eliminada correctamente" });
});

app.patch('/tareas/:id', async (req, res) => {
    const { id } = req.params;
    const { completado } = req.body;  // Recibe el estado de completado
    if (typeof completado !== 'boolean') {
        return res.status(400).json({ error: "El estado de completado debe ser un valor booleano" });
    }
    await conectar("UPDATE tareas SET completado = ? WHERE id = ?", [completado, id]);
    res.json({ mensaje: "Tarea actualizada correctamente" });
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});

module.exports = app;
