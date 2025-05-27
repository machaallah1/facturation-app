'use client'

import React from 'react'
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet
} from '@react-pdf/renderer'

// Styles
const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica' },
    title: { fontSize: 20, marginBottom: 20, color: '#2E6CCE' },

    section: { marginBottom: 10 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },

    bold: { fontWeight: 'bold' },

    table: { marginTop: 20, borderTop: 1, borderBottom: 1 },
    tableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
    tableHeader: { fontWeight: 'bold', backgroundColor: '#F0F0F0' },
    tableCell: { width: '16.6%' },

    totals: { marginTop: 10, alignSelf: 'flex-end', width: '50%' },
    totalsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
})

// Types
interface Props {
    facture: {
        client: { nom: string, adresse: string },
        numero: string,
        date: string,
        echeance: string,
        articles: { articleId: string, quantite: number, tva: number }[],
    },
    articlesRef: { id: string, nom: string, prix: number, unite: string }[]
}

// Composant
const FacturePDF: React.FC<Props> = ({ facture, articlesRef }) => {
    const lignes = facture.articles.map(item => {
        const ref = articlesRef.find(a => a.id === item.articleId)
        const prixHT = ref?.prix ?? 0
        const quantite = item.quantite
        const totalHT = prixHT * quantite
        const tauxTVA = item.tva
        const totalTVA = totalHT * tauxTVA / 100
        const totalTTC = totalHT + totalTVA

        return {
            nom: ref?.nom,
            unite: ref?.unite,
            quantite,
            prixHT,
            tauxTVA,
            totalTVA,
            totalHT,
            totalTTC
        }
    })

    const totalHT = lignes.reduce((sum, l) => sum + l.totalHT, 0)
    const totalTVA = lignes.reduce((sum, l) => sum + l.totalTVA, 0)
    const totalTTC = lignes.reduce((sum, l) => sum + l.totalTTC, 0)

    return (
        <Document>
            <Page style={styles.page}>
                <Text style={styles.title}>Facture</Text>

                {/* Informations Vendeur/Client */}
                <View style={styles.row}>
                    <View style={styles.section}>
                        <Text style={styles.bold}>Vendeur :</Text>
                        <Text>Mon Entreprise</Text>
                        <Text>20, Avenue Voltaire</Text>
                        <Text>13000 Marseille</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.bold}>Client :</Text>
                        <Text>{facture.client.nom}</Text>
                        <Text>{facture.client.adresse}</Text>
                    </View>
                </View>

                {/* Infos Facture */}
                <View style={[styles.row, { marginTop: 10 }]}>
                    <Text>Facture n°: {facture.numero}</Text>
                    <Text>Date : {facture.date}</Text>
                    <Text>Échéance : {facture.echeance}</Text>
                </View>

                {/* Tableau des articles */}
                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <Text style={styles.tableCell}>Description</Text>
                        <Text style={styles.tableCell}>Quantité</Text>
                        <Text style={styles.tableCell}>Unité</Text>
                        <Text style={styles.tableCell}>Prix unitaire HT</Text>
                        <Text style={styles.tableCell}>TVA</Text>
                        <Text style={styles.tableCell}>Total TTC</Text>
                    </View>

                    {lignes.map((ligne, index) => (
                        <View key={index} style={styles.tableRow}>
                            <Text style={styles.tableCell}>{ligne.nom}</Text>
                            <Text style={styles.tableCell}>{ligne.quantite}</Text>
                            <Text style={styles.tableCell}>{ligne.unite}</Text>
                            <Text style={styles.tableCell}>{ligne.prixHT.toFixed(2)} €</Text>
                            <Text style={styles.tableCell}>{ligne.tauxTVA}%</Text>
                            <Text style={styles.tableCell}>{ligne.totalTTC.toFixed(2)} €</Text>
                        </View>
                    ))}
                </View>

                {/* Totaux */}
                <View style={styles.totals}>
                    <View style={styles.totalsRow}>
                        <Text>Total HT :</Text>
                        <Text>{totalHT.toFixed(2)} €</Text>
                    </View>
                    <View style={styles.totalsRow}>
                        <Text>TVA :</Text>
                        <Text>{totalTVA.toFixed(2)} €</Text>
                    </View>
                    <View style={[styles.totalsRow, styles.bold]}>
                        <Text>Total TTC :</Text>
                        <Text>{totalTTC.toFixed(2)} €</Text>
                    </View>
                </View>
            </Page>
        </Document>
    )
}

export default FacturePDF
