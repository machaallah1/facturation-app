'use client'

import { PDFDownloadLink } from '@react-pdf/renderer'
import FacturePDF from './FacturePDF'
import { DownloadOutlined } from '@ant-design/icons'

const FactureDownloadButton = ({ facture, articles }: any) => {
    return (
        <PDFDownloadLink
            document={<FacturePDF facture={facture} articlesRef={articles} />}
            fileName={`Facture-${facture.id}.pdf`}
        >
            {({ loading }) =>
                loading ? 'Génération...' : (
                    <button className="bg-blue-600 text-black px-3 py-1 rounded">
                        <DownloadOutlined/> PDF
                    </button>
                )
            }
        </PDFDownloadLink>
    )
}

export default FactureDownloadButton
