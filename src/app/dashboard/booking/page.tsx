"use client";

import { useState, useEffect, SetStateAction } from 'react';
import { Table, Input, Button, Select, DatePicker, Modal, Form, Tag, Space, message, Descriptions, Collapse } from 'antd';
const { RangePicker } = DatePicker;
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { collection, addDoc, getDocs, where, query, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import BookingForm from '@/components/bookings/BookingForm';
import { Option } from 'antd/es/mentions';
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
    
        const [messageApi, contextHolder] = message.useMessage();
    
        const fetchBookings = async () => {
            setLoading(true);
            try {
                let q = query(collection(db, 'bookings'));
    
                if (typeFilter) q = query(q, where('typeCamion', '==', typeFilter));
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
            console.log('Tentative de suppression ID:', id);
            try {
                const docRef = doc(db, 'bookings', id);
                console.log('Référence du document:', docRef);
                await deleteDoc(docRef);
                messageApi.success('Booking supprimé avec succès');
                fetchBookings();
            } catch (error) {
                console.error('Détails de l\'erreur:', error);
                if (error instanceof Error) {
                    messageApi.error(`Erreur: ${error.message}`);
                } else {
                    messageApi.error('Erreur inconnue lors de la suppression du booking');
                }
            }
          };
    
        const calculateTotals = (booking: Booking) => {
            const transport = booking.nombreTC * booking.fraisTransport;
            const fauxFrais = booking.nombreTC * booking.fauxFrais;
            const manutention = booking.manutention.facture + booking.manutention.dfu + booking.manutention.honoraire + booking.manutention.caution;
            const total = transport + fauxFrais + manutention;
            return { transport, fauxFrais, manutention, total };
        };
    
        const handleEdit = (booking: Booking) => {
            setCurrentBooking(booking);
            setIsModalVisible(true);
        };
    
        const handleAddSuccess = () => {
            messageApi.success('Booking ajouté avec succès');
            fetchBookings();
            setIsModalVisible(false);
            form.resetFields();
        };
    
        useEffect(() => { fetchBookings(); }, [typeFilter, dateRange]);
    
    const columns = [
        { title: 'N° Booking', dataIndex: 'numero', key: 'numero' },
        {
            title: 'Type Camion', dataIndex: 'typeCamion', key: 'typeCamion', render: (type: string) => (
                <Tag color={type === '20pieds' ? 'blue' : 'green'}>{type}</Tag>
            )
        },
        { title: 'Transport', key: 'transport', render: (_: any, record: Booking) => `${calculateTotals(record).transport.toLocaleString()} fcfa` },
        { title: 'Faux Frais', key: 'fauxFrais', render: (_: any, record: Booking) => `${calculateTotals(record).fauxFrais.toLocaleString()} fcfa` },
        { title: 'Manutention', key: 'manutention', render: (_: any, record: Booking) => `${calculateTotals(record).manutention.toLocaleString()} fcfa` },
        { title: 'Total', key: 'total', render: (_: any, record: Booking) => <strong>{calculateTotals(record).total.toLocaleString()} €</strong> },
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
                        onClick={() => {
                            Modal.confirm({
                                title: 'Confirmer la suppression',
                                content: 'Êtes-vous sûr de vouloir supprimer ce booking ?',
                                okText: 'Supprimer',
                                cancelText: 'Annuler',
                                onOk: () => handleDelete(record.id!),
                            });
                        }}
                    />
                </Space>
            ),
        },
        ];
    
        return (
            <div className="p-6">
                {contextHolder}
    
                <div className="flex gap-4 mb-6">
                    <Input
                        placeholder="Rechercher par N° Booking"
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: 200 }}
                        allowClear
                    />
                    <Select
                        placeholder="Type de camion"
                        onChange={setTypeFilter}
                        allowClear
                        style={{ width: 150 }}
                    >
                        <Option value="20pieds">20 pieds</Option>
                        <Option value="40pieds">40 pieds</Option>
                    </Select>
                    <RangePicker
                        onChange={(dates) => {
                            if (dates && dates[0] && dates[1]) {
                                setDateRange([dates[0].toDate(), dates[1].toDate()]);
                            } else {
                                setDateRange(null);
                            }
                        }}
                        style={{ width: 250 }}
                    />
                    <Button
                        type="primary"
                        onClick={() => setIsModalVisible(true)}
                        icon={<PlusOutlined />}
                    >
                        Ajouter Booking
                    </Button>
                </div>
    
                <Table
                    dataSource={bookings.filter(b => b.numero.toLowerCase().includes(searchTerm.toLowerCase()))}
                    columns={columns}
                    loading={loading}
                    rowKey="id"
                    bordered
                    pagination={{ pageSize: 10 }}
                />

                {/* Modal pour voir les détails */}
                <Modal
                    title={`Détails du Booking ${selectedBooking?.numero}`}
                    open={isDetailVisible}
                    onCancel={() => setIsDetailVisible(false)}
                    footer={null}
                    width={800}
                >
                    {selectedBooking && (
                        <Descriptions bordered column={1}>
                            <Descriptions.Item label="N° Booking">{selectedBooking.numero}</Descriptions.Item>
                            <Descriptions.Item label="Type de camion">
                                <Tag color={selectedBooking.typeCamion === '20pieds' ? 'blue' : 'green'}>
                                    {selectedBooking.typeCamion}
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
                                            <Descriptions.Item label="DFU">{selectedBooking.manutention.dfu.toLocaleString()} fcfa</Descriptions.Item>
                                            <Descriptions.Item label="Honoraire">{selectedBooking.manutention.honoraire.toLocaleString()} fcfa</Descriptions.Item>
                                            <Descriptions.Item label="Caution">{selectedBooking.manutention.caution.toLocaleString()} fcfa</Descriptions.Item>
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

                {/* Gardez votre modal existante pour l'ajout/modification */}
                <Modal
                    title={currentBooking ? "Modifier Booking" : "Nouveau Booking"}
                    open={isModalVisible}
                    onCancel={() => {
                        setIsModalVisible(false);
                        setCurrentBooking(null);
                    }}
                    footer={null}
                    width={800}
                    destroyOnClose
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
        );
}