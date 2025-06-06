// BookingForm.tsx
import { Form, Input, InputNumber, Select, Modal, Button, Space, message, App } from 'antd';
import { db } from '@/app/lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

type Booking = {
    id?: string;
    numero: string;
    typeProduit: 'semi_fini' | 'matiere_premiere';
    typeContenaire: '20pieds' | '40pieds';
    nombreTC: number;
    fraisTransport: number;
    fauxFrais: number;
    manutention: {
        facture: number;
        dfu: number;
        honoraire: number;
        caution: number;
    };
    date?: Date;
};

export default function BookingForm({
    onSuccess,
    bookingData
}: {
    onSuccess: () => void;
    bookingData?: Booking | null
}) {
    const [form] = Form.useForm();
    const [submitLoading, setSubmitLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();
    const [modal, modalContextHolder] = Modal.useModal();
    const [typeProduit, setTypeProduit] = useState<string>('');

    useEffect(() => {
        if (bookingData) {
            form.setFieldsValue(bookingData);
            setTypeProduit(bookingData.typeProduit);
        } else {
            form.resetFields();
            setTypeProduit('');
        }
    }, [bookingData, form]);

    const handleSubmit = async (values: Booking) => {
        setSubmitLoading(true);
        try {
            const dataToSave = {
                ...values,
                date: bookingData?.date || new Date(),
            };

            const isUpdate = Boolean(bookingData?.id);
            const bookingId = bookingData?.id;

            if (isUpdate && bookingId) {
                await updateDoc(doc(db, 'bookings', bookingId), dataToSave);
            } else {
                await addDoc(collection(db, 'bookings'), dataToSave);
            }
            onSuccess();
            if (!isUpdate) {
                form.resetFields();
            }
        } catch (error) {
            console.error("Erreur lors de l'opération:", error);
            const actionType = bookingData?.id ? 'la mise à jour' : 'la création';
            messageApi.error(`Erreur lors de ${actionType}`);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!bookingData?.id) return;

        modal.confirm({
            title: 'Confirmer la suppression',
            content: 'Êtes-vous sûr de vouloir supprimer ce booking ?',
            okText: 'Supprimer',
            okType: 'danger',
            cancelText: 'Annuler',
            async onOk() {
                setDeleteLoading(true);
                try {
                    await deleteDoc(doc(db, 'bookings', bookingData.id!));
                    messageApi.success('Booking supprimé avec succès');
                    onSuccess();
                } catch (error) {
                    messageApi.error('Erreur lors de la suppression');
                    console.error(error);
                } finally {
                    setDeleteLoading(false);
                }
            },
        });
    };

    const handleTypeProduitChange = (value: string) => {
        setTypeProduit(value);
        // Reset manutention fields when product type changes
        form.setFieldsValue({
            manutention: {
                dfu: 0,
                honoraire: 0,
                caution: 0
            }
        });
    };

    return (
        <App>
            {contextHolder}
            {modalContextHolder}
            <Form form={form} onFinish={handleSubmit} layout="vertical">
                <Form.Item
                    name="numero"
                    label="N° Booking"
                    rules={[{ required: true, message: 'Ce champ est obligatoire' }]}
                >
                    <Input placeholder="EBKG/1200/6206" />
                </Form.Item>

                <Form.Item
                    name="typeProduit"
                    label="Type de produit"
                    rules={[{ required: true, message: 'Ce champ est obligatoire' }]}
                >
                    <Select
                        placeholder="Sélectionnez un type de produit"
                        onChange={handleTypeProduitChange}
                    >
                        <Select.Option value="semi_fini">Semi-fini</Select.Option>
                        <Select.Option value="matiere_premiere">Matière première</Select.Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    name="typeContenaire"
                    label="Type de contenaire"
                    rules={[{ required: true, message: 'Ce champ est obligatoire' }]}
                >
                    <Select placeholder="Sélectionnez un type">
                        <Select.Option value="20pieds">20 pieds</Select.Option>
                        <Select.Option value="40pieds">40 pieds</Select.Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    name="nombreTC"
                    label="Nombre de TC"
                    rules={[{
                        required: true,
                        message: 'Ce champ est obligatoire',
                        type: 'number',
                        min: 1,
                    }]}
                >
                    <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>

                <Space direction="horizontal" size={12} style={{ width: '100%' }}>
                    <Form.Item
                        name="fraisTransport"
                        label="Frais Transport (fcfa)"
                        rules={[{ required: true, message: 'Ce champ est obligatoire' }]}
                        style={{ width: '100%' }}
                    >
                        <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        name="fauxFrais"
                        label="Faux Frais (fcfa)"
                        rules={[{ required: true, message: 'Ce champ est obligatoire' }]}
                        style={{ width: '100%' }}
                    >
                        <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                    </Form.Item>
                </Space>

                <Form.Item label="Manutention (fcfa)">
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        <Form.Item
                            name={['manutention', 'facture']}
                            label="Facture"
                            rules={[{ required: true, message: 'Ce champ est obligatoire' }]}
                        >
                            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                        </Form.Item>

                        {'matiere_premiere'.includes(typeProduit) && (
                            <>
                                <Form.Item
                                    name={['manutention', 'dfu']}
                                    label="DFU"
                                    rules={[{ required: true, message: 'Ce champ est obligatoire' }]}
                                >
                                    <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                                </Form.Item>

                                <Form.Item
                                    name={['manutention', 'honoraire']}
                                    label="Honoraire"
                                    rules={[{ required: true, message: 'Ce champ est obligatoire' }]}
                                >
                                    <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                                </Form.Item>

                                <Form.Item
                                    name={['manutention', 'caution']}
                                    label="Caution"
                                    rules={[{ required: true, message: 'Ce champ est obligatoire' }]}
                                >
                                    <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                                </Form.Item>
                            </>
                        )}
                    </Space>
                </Form.Item>

                <Form.Item>
                    <Space>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={submitLoading}
                            icon={<EditOutlined />}
                        >
                            {bookingData?.id ? 'Mettre à jour' : 'Créer'}
                        </Button>

                        {bookingData?.id && (
                            <Button
                                danger
                                onClick={handleDelete}
                                loading={deleteLoading}
                                icon={<DeleteOutlined />}
                            >
                                Supprimer
                            </Button>
                        )}
                    </Space>
                </Form.Item>
            </Form>
        </App>
    );
}