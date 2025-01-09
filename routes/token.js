/**
 * @swagger
 * /api/Commenti/{id}:
 *   delete:
 *     summary: Elimina un commento
 *     tags: [Commenti]
 *     security:
 *       - bearerAuth: []  # Protegge la rotta con il JWT
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID del commento da eliminare
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Commento eliminato con successo
 *       403:
 *         description: Non autorizzato a eliminare questo commento
 *       404:
 *         description: Commento non trovato
 *       500:
 *         description: Errore del server
 */
router.delete('/api/Commenti/:id', tokenChecker, async (req, res) => {
    const commentoId = req.params.id;
    try {
        const commento = await Commento.findById(commentoId);
        if (!commento) {
            return res.status(404).json({ error: 'Commento non trovato' });
        }
        if (commento.utente_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Non autorizzato a eliminare questo commento' });
        }
        await Commento.findByIdAndDelete(commentoId);
        res.status(200).json({ message: 'Commento eliminato con successo' });
    } catch (err) {
        console.error('Errore durante l\'eliminazione del commento:', err);
        res.status(500).json({ error: 'Errore del server', details: err.message });
}
});