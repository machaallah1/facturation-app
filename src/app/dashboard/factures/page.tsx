// app/factures/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, DatePicker, Space, message, Tag, Card, App } from 'antd';
import { DownloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const { Option } = Select;

type Client = {
    id: string;
    nom: string;
    adresse: string;
    telephone: string;
    email: string;
};

type Facture = {
    id?: string;
    numero: string;
    date: Date;
    client: Client;
    articles: Article[];
    tva: number;
    remise: number;
    statut: 'payée' | 'impayée' | 'en_retard';
};

type Article = {
    id: string;
    description: string;
    quantite: number;
    prixUnitaire: number;
};

export default function FacturesPage() {
    const [factures, setFactures] = useState<Facture[]>([]);
    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [currentFacture, setCurrentFacture] = useState<Facture | null>(null);
    const [form] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();
    const [modal, modalContextHolder] = Modal.useModal();
    const [previewFacture, setPreviewFacture] = useState<Facture | null>(null);

    useEffect(() => {
        fetchFactures();
    }, []);

    const handlePreview = (facture: Facture) => {
        setPreviewFacture(facture);
      };

    const fetchFactures = async () => {
        setLoading(true);
        try {
            const snapshot = await getDocs(collection(db, 'factures'));
            const data = snapshot.docs.map(docSnap => {
                const docData = docSnap.data();
                return {
                    id: docSnap.id,
                    numero: docData.numero,
                    date: docData.date?.toDate ? docData.date.toDate() : new Date(),
                    client: docData.client,
                    articles: docData.articles,
                    tva: docData.tva,
                    remise: docData.remise,
                    statut: docData.statut,
                } as Facture;
            });
            setFactures(data);
        } catch (error) {
            messageApi.error('Erreur lors du chargement des factures');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };    

    const handleSubmit = async (values: Facture) => {
        setLoading(true);
        try {
            if (currentFacture?.id) {
                await updateDoc(doc(db, 'factures', currentFacture.id), values);
                messageApi.success('Facture mise à jour avec succès');
            } else {
                await addDoc(collection(db, 'factures'), {
                    ...values,
                    date: new Date()
                });
                messageApi.success('Facture créée avec succès');
            }
            setModalVisible(false);
            fetchFactures();
            form.resetFields();
        } catch (error) {
            messageApi.error('Erreur lors de l\'opération');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        modal.confirm({
            title: 'Confirmer la suppression',
            content: 'Êtes-vous sûr de vouloir supprimer cette facture ?',
            okText: 'Supprimer',
            okType: 'danger',
            cancelText: 'Annuler',
            okButtonProps: { loading: deleteLoading },
            async onOk() {
                setDeleteLoading(true);
                try {
                    await deleteDoc(doc(db, 'factures', id));
                    messageApi.success('Facture supprimée avec succès');
                    fetchFactures();
                } catch (error) {
                    messageApi.error('Erreur lors de la suppression');
                    console.error(error);
                } finally {
                    setDeleteLoading(false);
                }
            },
        });
    };

    const generatePDF = async (facture: Facture) => {
        try {
            setPreviewFacture(null);
            const input = document.getElementById(`facture-${facture.id}`);
            if (!input) {
                messageApi.error('Erreur: Élément de facture non trouvé');
                return;
            }

            // Attendre que le DOM soit complètement rendu
            await new Promise(resolve => setTimeout(resolve, 100));

            const canvas = await html2canvas(input, {
                scale: 2, // Meilleure qualité
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgWidth = 210; // A4 width in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            const pdf = new jsPDF('p', 'mm', 'a4');

            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

            pdf.save(`facture-${facture.numero}.pdf`);
            messageApi.success('PDF généré avec succès');
        } catch (error) {
            console.error('Erreur lors de la génération du PDF:', error);
            messageApi.error('Erreur lors de la génération du PDF');
        }
    };

    const handleEdit = (record: Facture) => {
        setCurrentFacture(record);
        // Préremplir le formulaire avec les valeurs existantes
        form.setFieldsValue({
            numero: record.numero,
            client: {
                nom: record.client.nom,
                email: record.client.email,
                adresse: record.client.adresse,
                telephone: record.client.telephone,
            },
            articles: record.articles,
            tva: record.tva,
            remise: record.remise,
            statut: record.statut,
        });
        setModalVisible(true);
    };

    const columns = [
        {
            title: 'N° Facture',
            dataIndex: 'numero',
            key: 'numero',
            responsive: ['md' as const],
        },
        {
            title: 'Client',
            dataIndex: ['client', 'nom'],
            key: 'client',
            responsive: ['md' as const],
        },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (date: Date) => date.toLocaleDateString(),
            responsive: ['md' as const],
        },
        {
            title: 'Montant',
            key: 'montant',
            render: (_: any, record: Facture) => {
                const total = record.articles.reduce((sum, article) => sum + (article.prixUnitaire * article.quantite), 0);
                return `${total.toFixed(2)} €`;
            },
            responsive: ['md' as const],
        },
        {
            title: 'Statut',
            dataIndex: 'statut',
            key: 'statut',
            render: (statut: string) => {
                let color = '';
                switch (statut) {
                    case 'payée': color = 'green'; break;
                    case 'impayée': color = 'red'; break;
                    case 'en_retard': color = 'orange'; break;
                    default: color = 'gray';
                }
                return <Tag color={color}>{statut}</Tag>;
            },
            responsive: ['sm' as const],
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: Facture) => (
                <Space>
                    <Button
                        icon={<EyeOutlined />}
                        onClick={() => handlePreview(record)}
                        size="small"
                    />
                    <Button
                        icon={<DownloadOutlined />}
                        onClick={() => generatePDF(record)}
                        size="small"
                    />
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                        size="small"
                    />
                    <Button
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record.id!)}
                        danger
                        size="small"
                    />
                </Space>
            ),
        },
    ];

    const FactureTemplate = ({ facture }: { facture: Facture }) => {
        const totalHT = facture.articles.reduce((sum, article) => sum + (article.prixUnitaire * article.quantite), 0);
        const montantTVA = totalHT * (facture.tva / 100);
        const montantRemise = totalHT * (facture.remise / 100);
        const totalTTC = totalHT + montantTVA - montantRemise;

        return (
            <Card id={`facture-${facture.id}`} className="w-full max-w-3xl mx-auto bg-gray-50 p-6">
                {/* En-tête */}
                <div className="flex flex-col md:flex-row justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">ENTREPRISE OKOTAN</h1>
                        <p className="text-gray-600">Import/Export</p>
                        <p className="text-gray-600">123 Rue des Affaires, Abidjan</p>
                        <p className="text-gray-600">Tél: +225 01 23 45 67 89</p>
                    </div>
                    <div className="mt-4 md:mt-0 text-right">
                        <h2 className="text-xl font-bold text-gray-800">FACTURE</h2>
                        <p className="text-gray-600">N°: {facture.numero}</p>
                        <p className="text-gray-600">Date: {facture.date.toLocaleDateString()}</p>
                    </div>
                </div>

                {/* Client */}
                <div className="mb-8 p-4 bg-gray-100 rounded">
                    <h3 className="font-bold text-gray-800 mb-2">CLIENT</h3>
                    <p className="text-gray-700">{facture.client?.nom}</p>
                    <p className="text-gray-700">{facture.client?.adresse}</p>
                    <p className="text-gray-700">Tél: {facture.client?.telephone}</p>
                    <p className="text-gray-700">Email: {facture.client?.email}</p>
                </div>

                {/* Articles */}
                <div className="mb-8">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="p-2 text-left border border-gray-300">Description</th>
                                <th className="p-2 text-right border border-gray-300">Quantité</th>
                                <th className="p-2 text-right border border-gray-300">Prix Unitaire</th>
                                <th className="p-2 text-right border border-gray-300">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {facture.articles.map((article, index) => (
                                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="p-2 border border-gray-300">{article?.description}</td>
                                    <td className="p-2 border border-gray-300 text-right">{article?.quantite}</td>
                                    <td className="p-2 border border-gray-300 text-right">{(article?.prixUnitaire ?? 0).toFixed(2)} €</td>
                                    <td className="p-2 border border-gray-300 text-right">{(article.quantite * article.prixUnitaire).toFixed(2)} €</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totaux */}
                <div className="ml-auto w-full md:w-1/2">
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-700">Total HT:</span>
                        <span className="font-bold">{totalHT.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-700">TVA ({facture.tva}%):</span>
                        <span className="font-bold">{montantTVA.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-700">Remise ({facture.remise}%):</span>
                        <span className="font-bold">-{montantRemise.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between mt-4 pt-2 border-t-2 border-gray-300">
                        <span className="text-lg font-bold text-gray-800">Total TTC:</span>
                        <span className="text-lg font-bold text-gray-800">{totalTTC.toFixed(2)} €</span>
                    </div>
                </div>

                {/* Pied de page */}
                <div className="mt-12 pt-4 border-t border-gray-300 text-center text-gray-500 text-sm">
                    <p>ENTREPRISE OKOTAN - Capital social: 10.000.000 FCFA - RCCM: CI-ABJ-2023-B-12345</p>
                    <p>N° contribuable: A123456789B - Tél: +225 01 23 45 67 89 - Email: contact@okotan.com</p>
                </div>
            </Card>
        );
    };

    return (
        <App>
            <div className="p-6">
                {contextHolder}
                {modalContextHolder}
                
                {/* En-tête de page */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h1 className="text-2xl font-bold text-gray-800">Gestion des Factures</h1>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            setCurrentFacture(null);
                            form.resetFields(); // Réinitialiser le formulaire pour une nouvelle facture
                            setModalVisible(true);
                        }}
                    >
                        Nouvelle Facture
                    </Button>
                </div>

                {/* Tableau des factures */}
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <Table
                        columns={columns}
                        dataSource={factures}
                        rowKey="id"
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                        scroll={{ x: true }}
                    />
                </div>

                {/* Modal pour ajouter/modifier une facture */}
                <Modal
                    title={currentFacture ? "Modifier Facture" : "Nouvelle Facture"}
                    open={modalVisible}
                    onCancel={() => {
                        setModalVisible(false);
                        setCurrentFacture(null);
                        form.resetFields();
                    }}
                    footer={null}
                    width="90%"
                    style={{ maxWidth: 800 }}
                    destroyOnClose={true}
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                        initialValues={{
                            tva: 18,
                            remise: 0,
                            statut: 'impayée',
                            articles: [{ id: '1', description: '', quantite: 1, prixUnitaire: 0 }]
                        }}
                    >
                        <Form.Item
                            name="numero"
                            label="Numéro de facture"
                            rules={[{ required: true, message: 'Ce champ est obligatoire' }]}
                        >
                            <Input placeholder="FAC-2023-001" />
                        </Form.Item>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Form.Item
                                name={['client', 'nom']}
                                label="Nom du client"
                                rules={[{ required: true, message: 'Ce champ est obligatoire' }]}
                            >
                                <Input placeholder="Nom complet" />
                            </Form.Item>

                            <Form.Item
                                name={['client', 'email']}
                                label="Email"
                                rules={[{ type: 'email', message: 'Email invalide' }]}
                            >
                                <Input placeholder="client@example.com" />
                            </Form.Item>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Form.Item
                                name={['client', 'adresse']}
                                label="Adresse"
                            >
                                <Input placeholder="Adresse complète" />
                            </Form.Item>

                            <Form.Item
                                name={['client', 'telephone']}
                                label="Téléphone"
                            >
                                <Input placeholder="+225..." />
                            </Form.Item>
                        </div>

                        <Form.List name="articles">
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map(({ key, name, ...restField }) => (
                                        <div key={key} className="flex gap-4 mb-4">
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'description']}
                                                label="Description"
                                                className="flex-1"
                                                rules={[{ required: true, message: 'Description requise' }]}
                                            >
                                                <Input placeholder="Article/service" />
                                            </Form.Item>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'quantite']}
                                                label="Quantité"
                                                className="w-24"
                                                rules={[{ required: true, message: 'Quantité requise' }]}
                                            >
                                                <InputNumber min={1} />
                                            </Form.Item>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'prixUnitaire']}
                                                label="Prix unitaire"
                                                className="w-32"
                                                rules={[{ required: true, message: 'Prix requis' }]}
                                            >
                                                <InputNumber min={0} step={0.01} />
                                            </Form.Item>
                                            <Button
                                                type="text"
                                                danger
                                                onClick={() => remove(name)}
                                                className="self-end mb-7"
                                            >
                                                <DeleteOutlined />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button
                                        type="dashed"
                                        onClick={() => add()}
                                        icon={<PlusOutlined />}
                                        className="w-full mb-4"
                                    >
                                        Ajouter un article
                                    </Button>
                                </>
                            )}
                        </Form.List>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Form.Item
                                name="tva"
                                label="TVA (%)"
                            >
                                <InputNumber min={0} max={100} />
                            </Form.Item>

                            <Form.Item
                                name="remise"
                                label="Remise (%)"
                            >
                                <InputNumber min={0} max={100} />
                            </Form.Item>

                            <Form.Item
                                name="statut"
                                label="Statut"
                            >
                                <Select>
                                    <Option value="payée">Payée</Option>
                                    <Option value="impayée">Impayée</Option>
                                    <Option value="en_retard">En retard</Option>
                                </Select>
                            </Form.Item>
                        </div>

                        <Form.Item className="text-right">
                            <Space>
                                <Button onClick={() => setModalVisible(false)}>
                                    Annuler
                                </Button>
                                <Button type="primary" htmlType="submit" loading={loading}>
                                    {currentFacture ? 'Mettre à jour' : 'Créer'}
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Modal>
                <Modal
                    title={`Prévisualisation - Facture ${previewFacture?.numero}`}
                    open={!!previewFacture}
                    onCancel={() => setPreviewFacture(null)}
                    footer={[
                        <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={() => previewFacture && generatePDF(previewFacture)}>
                            Télécharger PDF
                        </Button>,
                        <Button key="close" onClick={() => setPreviewFacture(null)}>
                            Fermer
                        </Button>
                    ]}
                    width="90%"
                    style={{ maxWidth: 1000 }}
                >
                    {previewFacture && <FactureTemplate facture={previewFacture} />}
                </Modal>

                {/* Prévisualisation des factures (déplacé en haut pour un meilleur rendu) */}
                <div style={{ position: 'absolute', left: '-9999px' }}>
                    {factures.map(facture => (
                        <div key={facture.id}>
                            <FactureTemplate facture={facture} />
                        </div>
                    ))}
                </div>
            </div>
        </App>
    );
}