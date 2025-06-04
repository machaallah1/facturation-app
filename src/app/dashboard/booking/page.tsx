// page.tsx
"use client";

import { useState, useEffect, SetStateAction } from 'react';
import { Table, Input, Button, Select, DatePicker, Modal, Form, Tag, Space, message, Descriptions, Collapse, App } from 'antd';
const { RangePicker } = DatePicker;
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { collection, addDoc, getDocs, where, query, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import BookingForm from '@/components/bookings/BookingForm';
import { auth } from '@/app/lib/firebase';
const { Panel } = Collapse;

export default function BookingPage() {
    const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [isDetailVisible, setIsDetailVisible] = useState(false);
    const [form] = Form.useForm();
    const [modal, contextHolderModal] = Modal.useModal();
    const [messageApi, contextHolder] = message.useMessage();

    const fetchBookings = async () => {
        setLoading(true);
        try {
            let q = query(collection(db, 'bookings'));

            if (typeFilter) q = query(q, where('typeContenaire', '==', typeFilter));
            if (dateRange) q = query(q, where('date', '>=', dateRange[0]), where('date', '<=', dateRange[1]));

            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().date.toDate()
            } as Booking));
            setBookings(data);
        } catch (error) {
            messageApi.error('Erreur lors du chargement des bookings');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        setLoading(true);
        console.log('Tentative de suppression ID:', id);
        try {
            if (!auth.currentUser) {
                throw new Error('Utilisateur non authentifié');
            }
            const docRef = doc(db, 'bookings', id);
            console.log('Référence du document:', docRef);
            await deleteDoc(docRef);
            messageApi.success('Booking supprimé avec succès');
            await fetchBookings(); // Attendre le rechargement des données
        } catch (error) {
            console.error('Détails de l\'erreur:', error);
            if (error instanceof Error) {
                messageApi.error(`Erreur lors de la suppression: ${error.message}`);
            } else {
                messageApi.error('Erreur inconnue lors de la suppression du booking');
            }
        } finally {
            setLoading(false);
        }
    };

    const calculateTotals = (booking: Booking) => {
        const transport = booking.nombreTC * booking.fraisTransport;
        const fauxFrais = booking.nombreTC * booking.fauxFrais;

        let manutention = 0;
        if ('matiere_premiere'.includes(booking.typeProduit)) {
            manutention = booking.manutention.facture + booking.manutention.dfu + booking.manutention.honoraire + booking.manutention.caution;
        } else if ('semi_fini'.includes(booking.typeProduit)) {
            manutention = booking.manutention.facture;
        }

        const total = transport + fauxFrais + manutention;
        return { transport, fauxFrais, manutention, total };
    };

    const handleEdit = (booking: Booking) => {
        setCurrentBooking(booking);
        setIsModalVisible(true);
    };

    const handleAddSuccess = () => {
        const message = currentBooking ? 'Booking mis à jour avec succès' : 'Booking ajouté avec succès';
        messageApi.success(message);
        fetchBookings();
        setIsModalVisible(false);
        setCurrentBooking(null);
        form.resetFields();
    };

    useEffect(() => { fetchBookings(); }, [typeFilter, dateRange]);

    const showDeleteConfirm = (id: string) => {
        modal.confirm({
            title: 'Confirmer la suppression',
            content: 'Êtes-vous sûr de vouloir supprimer ce booking ?',
            okText: 'Supprimer',
            cancelText: 'Annuler',
            okButtonProps: { loading },
            onOk: () => handleDelete(id),
        });
    };

    const columns = [
        { title: 'N° Booking', dataIndex: 'numero', key: 'numero' },
        { title: 'Type Produit', dataIndex: 'typeProduit', key: 'typeProduit' },
        {
            title: 'Type Contenaire', dataIndex: 'typeContenaire', key: 'typeContenaire', render: (type: string) => (
                <Tag color={type === '20pieds' ? 'blue' : 'green'}>{type}</Tag>
            )
        },
        { title: 'Transport', key: 'transport', render: (_: any, record: Booking) => `${calculateTotals(record).transport.toLocaleString()} fcfa` },
        { title: 'Faux Frais', key: 'fauxFrais', render: (_: any, record: Booking) => `${calculateTotals(record).fauxFrais.toLocaleString()} fcfa` },
        { title: 'Manutention', key: 'manutention', render: (_: any, record: Booking) => `${calculateTotals(record).manutention.toLocaleString()} fcfa` },
        { title: 'Total', key: 'total', render: (_: any, record: Booking) => <strong>{calculateTotals(record).total.toLocaleString()} fcfa</strong> },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: Booking) => (
                <Space>
                    <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => {
                            setSelectedBooking(record);
                            setIsDetailVisible(true);
                        }}
                    />
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    />
                    <Button
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => showDeleteConfirm(record.id!)}
                        disabled={loading}
                    />
                </Space>
            ),
        },
    ];

    return (
        <App>
            <div className="p-4 md:p-6">
                {contextHolder}
                {contextHolderModal}

                {/* Filtres et boutons - version responsive */}
                <div className="flex flex-col gap-3 mb-6 md:flex-row md:items-center md:gap-4">
                    <Input
                        placeholder="Rechercher par N° Booking"
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-48"
                        allowClear
                    />

                    <div className="flex gap-3 md:gap-4">
                        <Select
                            placeholder="Type de contenaire"
                            onChange={setTypeFilter}
                            allowClear
                            className="w-full md:w-40"
                        >
                            <Select.Option value="20pieds">20 pieds</Select.Option>
                            <Select.Option value="40pieds">40 pieds</Select.Option>
                        </Select>

                        <RangePicker
                            onChange={(dates) => {
                                if (dates && dates[0] && dates[1]) {
                                    setDateRange([dates[0].toDate(), dates[1].toDate()]);
                                } else {
                                    setDateRange(null);
                                }
                            }}
                            className="w-full md:w-56"
                        />

                        <Button
                            type="primary"
                            onClick={() => setIsModalVisible(true)}
                            icon={<PlusOutlined />}
                            className="w-full md:w-auto"
                        >
                            <span className="hidden md:inline">Ajouter Booking</span>
                            <span className="md:hidden">Ajouter</span>
                        </Button>
                    </div>
                </div>

                {/* Tableau responsive avec défilement horizontal */}
                <div className="overflow-x-auto">
                    <Table
                        dataSource={bookings.filter(b => b.numero.toLowerCase().includes(searchTerm.toLowerCase()))}
                        columns={columns}
                        loading={loading}
                        rowKey="id"
                        bordered
                        pagination={{ pageSize: 10 }}
                        scroll={{ x: true }}
                        className="min-w-[600px] md:min-w-full"
                    />
                </div>

                {/* Modal Détails - version responsive */}
                <Modal
                    title={`Détails du Booking ${selectedBooking?.numero}`}
                    open={isDetailVisible}
                    onCancel={() => setIsDetailVisible(false)}
                    footer={null}
                    width="90%"
                    style={{ maxWidth: 800 }}
                >
                    {selectedBooking && (
                        <Descriptions bordered column={1}>
                            <Descriptions.Item label="N° Booking">{selectedBooking.numero}</Descriptions.Item>
                            <Descriptions.Item label="Type Produit">{selectedBooking.typeProduit}</Descriptions.Item>
                            <Descriptions.Item label="Type de contenaire">
                                <Tag color={selectedBooking.typeContenaire === '20pieds' ? 'blue' : 'green'}>
                                    {selectedBooking.typeContenaire}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Date">{selectedBooking.date.toLocaleDateString()}</Descriptions.Item>

                            <Descriptions.Item label="Détails Transport">
                                <Collapse ghost>
                                    <Panel header="Voir les détails" key="1">
                                        <Descriptions column={1}>
                                            <Descriptions.Item label="Nombre TC">{selectedBooking.nombreTC}</Descriptions.Item>
                                            <Descriptions.Item label="Frais Transport">{selectedBooking.fraisTransport.toLocaleString()} fcfa</Descriptions.Item>
                                            <Descriptions.Item label="Total Transport">
                                                {calculateTotals(selectedBooking).transport.toLocaleString()} fcfa
                                            </Descriptions.Item>
                                        </Descriptions>
                                    </Panel>
                                </Collapse>
                            </Descriptions.Item>

                            <Descriptions.Item label="Détails Manutention">
                                <Collapse ghost>
                                    <Panel header="Voir les détails" key="2">
                                        <Descriptions column={1}>
                                            <Descriptions.Item label="Facture">{selectedBooking.manutention.facture.toLocaleString()} fcfa</Descriptions.Item>
                                            {['soja', 'anacarde', 'cesame'].includes(selectedBooking.typeProduit) && (
                                                <>
                                                    <Descriptions.Item label="DFU">{selectedBooking.manutention.dfu.toLocaleString()} fcfa</Descriptions.Item>
                                                    <Descriptions.Item label="Honoraire">{selectedBooking.manutention.honoraire.toLocaleString()} fcfa</Descriptions.Item>
                                                    <Descriptions.Item label="Caution">{selectedBooking.manutention.caution.toLocaleString()} fcfa</Descriptions.Item>
                                                </>
                                            )}
                                            <Descriptions.Item label="Total Manutention">
                                                {calculateTotals(selectedBooking).manutention.toLocaleString()} fcfa
                                            </Descriptions.Item>
                                        </Descriptions>
                                    </Panel>
                                </Collapse>
                            </Descriptions.Item>

                            <Descriptions.Item label="Total Général">
                                <strong>{calculateTotals(selectedBooking).total.toLocaleString()} fcfa</strong>
                            </Descriptions.Item>
                        </Descriptions>
                    )}
                </Modal>

                {/* Modal Formulaire - version responsive */}
                <Modal
                    title={currentBooking ? "Modifier Booking" : "Nouveau Booking"}
                    open={isModalVisible}
                    onCancel={() => {
                        setIsModalVisible(false);
                        setCurrentBooking(null);
                    }}
                    footer={null}
                    width="90%"
                    style={{ maxWidth: 800 }}
                    destroyOnHidden
                >
                    <BookingForm
                        onSuccess={() => {
                            handleAddSuccess();
                            setCurrentBooking(null);
                        }}
                        bookingData={currentBooking}
                    />
                </Modal>
            </div>
        </App>
    );
}